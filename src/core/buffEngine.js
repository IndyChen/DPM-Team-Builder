// src/core/buffEngine.js — Character, Resonance Chain, Weapon, Echo Set & Main Echo Buff Engine
import { charData, charAttrMap } from '../data/characters.js';
import { globalStore } from './store.js';
import {
    ROLE_SKILLS_DB,
    ROLE_RC_DB,
    ROLE_INHERENT_DB,
    ECHO_SET_EXACT_OVERRIDES_DB,
    MAIN_ECHO_EXACT_OVERRIDES_DB,
    getCharOffsetCapabilities,
    computeCharEffectiveStats,
    getDefaultSlotConfig,
    calcRealSkillDamage
} from '../data/buffsAndLoadoutsDb.js';

const ROVER_ELEMENT_MAP = {
    '光主': '衍射', '暗主': '湮滅', '風主': '氣動',
    '雷主': '導電', '火主': '熱熔', '冰主': '冷凝',
    '衍射主': '衍射', '湮滅主': '湮滅', '氣動主': '氣動'
};
const ROVER_NAMES = new Set(['光主', '暗主', '風主', '雷主', '火主', '冰主', '衍射主', '湮滅主', '氣動主', '漂泊者', '漂泊者·衍射', '漂泊者·湮滅', '漂泊者·氣動', '漂泊者·導電']);

function getBase(name) {
    if (!name) return '';
    if (ROVER_NAMES.has(name)) return '漂泊者';
    return name.replace(/\(.*\)|（.*）|S\d+/g, '').trim();
}

function getCharElement(charName) {
    if (!charName) return '';
    if (ROVER_ELEMENT_MAP[charName]) return ROVER_ELEMENT_MAP[charName];
    const base = getBase(charName);
    return charAttrMap[charName] || charAttrMap[base] || charData[base]?.element || '';
}

export function getEffectiveCharLoadout(charName, env) {
    if (!charName) return { hasCustomLoadout: false, slot: null, stats: null, defaultStats: null, roverAttr: '衍射' };
    const baseName = getBase(charName);
    const roverAttr = ROVER_ELEMENT_MAP[charName] || '衍射';
    const loadouts = (env && env.charLoadouts) ? env.charLoadouts : (globalStore?.charLoadouts || {});
    const entry = loadouts[charName] || loadouts[baseName];
    if (!entry || !Array.isArray(entry.slots) || entry.slots.length === 0) {
        return { hasCustomLoadout: false, slot: null, stats: null, defaultStats: null, roverAttr };
    }
    const idx = entry.activeSlot === 1 ? 1 : 0;
    const slot = entry.slots[idx] || entry.slots[0];
    const stats = computeCharEffectiveStats(baseName, slot, { roverAttr });
    const defaultStats = computeCharEffectiveStats(baseName, getDefaultSlotConfig(baseName, 0, roverAttr), { roverAttr });
    return { hasCustomLoadout: true, slot, stats, defaultStats, roverAttr };
}

export function getTeamOffsetCapabilities(team, modeMap = null) {
    const members = [team?.c1, team?.c2, team?.c3].filter(Boolean);
    const merged = {
        tuneShift: false, zhenxie: false, jixie: false, haipo: false,
        guangzao: false, fengshi: false, shuangjian: false, jubeo: false,
        xuyan: false, dianci: false, frostbite: false, concerto: false, anomaly: false
    };
    for (const m of members) {
        const bm = getBase(m);
        const caps = getCharOffsetCapabilities ? getCharOffsetCapabilities(bm, modeMap?.[bm] || modeMap?.[m] || null) : {};
        for (const k of Object.keys(merged)) {
            if (caps[k]) merged[k] = true;
        }
    }
    return merged;
}

export function getTeammateSharedBuffs(targetCharName, team, env) {
    const keys = [
        'teamAtkPct', 'teamElemDmgPct',
        'teamBasicDmgPct', 'teamHeavyDmgPct', 'teamSkillDmgPct', 'teamLibDmgPct', 'teamEchoDmgPct',
        'teamCritRate', 'teamCritDmg', 'teamEchoCritRate', 'teamEchoCritDmg',
        'teamAmplifyPct', 'teamElemAmpPct', 'teamBasicAmpPct', 'teamHeavyAmpPct', 'teamSkillAmpPct', 'teamLibAmpPct', 'teamEchoAmpPct',
        'teamIgnoreDefPct', 'teamResShredPct'
    ];
    const active = Object.fromEntries(keys.map(k => [k, 0]));
    const delta = Object.fromEntries(keys.map(k => [k, 0]));
    if (!team) return { active, delta };

    const teamOffsetCaps = getTeamOffsetCapabilities(team);
    const targetBase = getBase(targetCharName);
    const targetElem = getCharElement(targetCharName);
    const targetCaps = getCharOffsetCapabilities ? getCharOffsetCapabilities(targetBase) : {};
    const members = [team.c1, team.c2, team.c3].filter(Boolean);

    for (const m of members) {
        const mb = getBase(m);
        if (!mb || mb === targetBase) continue;
        const lo = getEffectiveCharLoadout(m, env);
        const activeSlot = (lo.hasCustomLoadout && lo.slot) ? lo.slot : getDefaultSlotConfig(mb, 0, lo.roverAttr);
        const defaultSlot = getDefaultSlotConfig(mb, 0, lo.roverAttr);

        const activeStats = computeCharEffectiveStats(mb, activeSlot, { roverAttr: lo.roverAttr, teamOffsetCaps, isSupportTeammate: true });
        const defaultStats = computeCharEffectiveStats(mb, defaultSlot, { roverAttr: lo.roverAttr, teamOffsetCaps, isSupportTeammate: true });
        const sm = activeStats.mods || {};
        const dm = defaultStats.mods || {};
        for (const k of keys) {
            active[k] += Number(sm[k] || 0);
            if (lo.hasCustomLoadout) {
                delta[k] += Number(sm[k] || 0) - Number(dm[k] || 0);
            }
        }

        // 首位聲骸延奏交接增益 (如 格洛獁圖 200131 延奏 +12% 冷凝、海維夏 280036 +10% 全屬傷、達妮婭 280040 +12% 熱熔、絕息魄 200154 +12% 導電、迷朧幻蛾 200134 +12% 攻)
        const mainEchoOverride = MAIN_ECHO_EXACT_OVERRIDES_DB[Number(activeSlot?.mainEchoId)];
        if (mainEchoOverride?.outroNext) {
            const on = mainEchoOverride.outroNext;
            if (!on.elemAttr || on.elemAttr === targetElem) {
                if (on.teamElemDmgPct) active.teamElemDmgPct += on.teamElemDmgPct;
                if (on.teamAtkPct) active.teamAtkPct += on.teamAtkPct;
            }
        }

        // 莉莉基礎技能組團隊增益: 延奏《薰香綻放》全加深+25%、解放《夢芳》、回路《斑白眠夢》(同奏攻擊+聲骸雙暴)
        if (mb === '莉莉') {
            const liliEr = Number(activeStats.er || 100);
            const erOver190 = Math.max(0, liliEr - 190);
            const perStackAtk = Math.min(7, erOver190 * 0.1);
            const mengfangStacks = Number(activeStats.rc || 0) >= 1 ? 2 : 1;
            active.teamAmplifyPct += 25;
            active.teamAtkPct += perStackAtk * mengfangStacks;
            if (Number(activeStats.rc || 0) >= 2) {
                active.teamCritRate += 2 * mengfangStacks;
                active.teamCritDmg += 6 * mengfangStacks;
            }
            if (targetCaps.concerto || teamOffsetCaps.concerto) {
                const s6Mult = Number(activeStats.rc || 0) >= 6 ? 1.5 : 1.0;
                active.teamAtkPct += perStackAtk * 2 * s6Mult;
            }
            active.teamEchoCritRate += Math.min(10, (erOver190 / 0.7) * 0.1);
            active.teamEchoCritDmg += Math.min(20, (erOver190 / 0.7) * 0.2);
        }
        // 琳奈基礎延奏《有空一起兜風！》: 全傷害加深 +15% (S2 額外 +25% 已由 RC 解析或此處確認)、共解加深 +25% + 共解《爆炸噴塗》全隊造傷 +24%
        if (mb === '琳奈') {
            active.teamAmplifyPct += 15;
            active.teamLibAmpPct += 25;
            active.teamElemDmgPct += 24;
        }
        // 莫寧基礎延奏《全隊全傷害加深 +25%》＋ 干涉標記《目標受到傷害提升最高 +40% (260%共效吃滿)》
        if (mb === '莫寧') {
            active.teamAmplifyPct += 25;
            const moningErOver100 = Math.max(0, Number(activeStats.er || 100) - 100);
            active.teamElemDmgPct += Math.min(40, moningErOver100 * 0.25);
        }
        if (mb === '守岸人') {
            active.teamAmplifyPct += 15;
            active.teamCritRate += 12.5;
            active.teamCritDmg += 25;
        }
        if (mb === '維里奈') {
            active.teamAmplifyPct += 15;
            active.teamAtkPct += 20;
        }
        if (mb === '白芷') {
            active.teamAmplifyPct += 15;
            active.teamAtkPct += 15;
        }
        if (mb === '卜靈') {
            active.teamAmplifyPct += 15;
            active.teamSkillAmpPct += 20;
            if (Number(activeStats.rc || 0) >= 6) active.teamSkillDmgPct += 50;
        }
        // 穗穗：延奏/固有《煙嵐》全傷害加深 +15%、攻擊 +15%；S2《山河水境》附加異常/霜漸後暴擊傷害 +50%
        if (mb === '穗穗') {
            active.teamAmplifyPct += 15;
            active.teamAtkPct += 15;
            // 若 sm.teamCritDmg 尚未計入穗穗 S2 (+50% 暴傷)，於此確保異常/霜漸隊友穩定獲得 +50% 暴傷
            if (Number(activeStats.rc || 0) >= 2 && Number(sm.teamCritDmg || 0) < 50 && (targetCaps.anomaly || teamOffsetCaps.anomaly || targetCaps.shuangjian || teamOffsetCaps.shuangjian)) {
                active.teamCritDmg += 50;
                if (lo.hasCustomLoadout) delta.teamCritDmg += 50;
            }
        }
        if (mb === '千咲') {
            active.teamElemDmgPct += 20;
            active.teamIgnoreDefPct += 18;
        }
        if (mb === '達妮婭') {
            active.teamAmplifyPct += 25;
        }
        if (mb === '秧秧·玄翎' && targetElem === '湮滅') {
            active.teamElemAmpPct += 20;
        }
        if (mb === '鎖暝') {
            const hasTongzou = Boolean(targetCaps.concerto || teamOffsetCaps.concerto);
            if (targetElem === '導電') {
                active.teamElemAmpPct += 20;
                active.teamElemDmgPct += (hasTongzou ? 70 : 30);
            }
            if (hasTongzou) active.teamSkillAmpPct += 25;
            if (Number(activeStats.rc || 0) >= 2 && hasTongzou) {
                active.teamCritDmg += 34; // S2 延奏 10% + 4層同奏*6% = 34% 暴傷
            }
        }
        if (mb === '蕾貝卡') {
            active.teamAmplifyPct += 15;
            active.teamHeavyAmpPct += 25;
        }
        if (mb === '散華') active.teamBasicAmpPct += 38;
        if (mb === '莫特斐') active.teamHeavyAmpPct += 38;
        if (mb === '燈燈') active.teamSkillAmpPct += 38;
        if (mb === '鑒心') active.teamLibAmpPct += 38;
        if (mb === '尤諾') active.teamHeavyAmpPct += 50;
        if (mb === '仇遠') {
            active.teamEchoAmpPct += 50;
            active.teamCritDmg += 30;
        }
        if (mb === '折枝') {
            active.teamSkillAmpPct += 25;
            if (targetElem === '冷凝') active.teamElemAmpPct += 20;
        }
        if (mb === '吟霖') {
            active.teamLibAmpPct += 25;
            if (targetElem === '導電') active.teamElemAmpPct += 20;
        }
        if (mb === '洛可可') {
            active.teamBasicAmpPct += 25;
            active.teamAtkPct += 10;
            if (targetElem === '湮滅') active.teamElemAmpPct += 20;
        }
        if (mb === '坎特蕾拉') {
            active.teamSkillAmpPct += 25;
            if (targetElem === '湮滅') active.teamElemAmpPct += 20;
        }
        if (mb === '布蘭特') {
            active.teamSkillAmpPct += 25;
            if (targetElem === '熱熔') active.teamElemAmpPct += 20;
        }
        if (mb === '露帕') {
            active.teamBasicAmpPct += 25;
            active.teamAtkPct += 18;
            if (targetElem === '熱熔') active.teamElemAmpPct += 20;
        }
        if (mb === '夏空') {
            active.teamElemDmgPct += 24;
            if (targetElem === '氣動') active.teamElemAmpPct += 20;
        }
        if (mb === '菲比' && targetElem === '衍射') active.teamResShredPct += 10;
        // 洛瑟菈：固有1《慢鏡頭》霜漸模態減冷凝抗 8% + 延奏/底片減抗 (合計 15%)；若走聲骸模態則全隊聲骸傷害+25% (S2 額外+40%)
        if (mb === '洛瑟菈') {
            if (targetElem === '冷凝') {
                // 避免與 sm.teamResShredPct (固有1 的 8%) 重複累加，補足延奏部分至 15%
                const alreadyShred = Number(sm.teamResShredPct || 0);
                active.teamResShredPct += Math.max(0, 15 - alreadyShred);
            } else if (targetCaps.echo || targetBase === '西格莉卡') {
                active.teamEchoDmgPct += 25 + (Number(activeStats.rc || 0) >= 2 ? 40 : 0);
            }
        }
    }
    return { active, delta };
}

export function getSharedSkillTypeDmgPct(sharedObj, skillType) {
    if (!sharedObj) return 0;
    switch (skillType) {
        case '普攻': return Number(sharedObj.teamBasicDmgPct || 0);
        case '重擊': return Number(sharedObj.teamHeavyDmgPct || 0);
        case '共技': return Number(sharedObj.teamSkillDmgPct || 0);
        case '共解': return Number(sharedObj.teamLibDmgPct || 0);
        case '聲骸':
        case '聲骸技能': return Number(sharedObj.teamEchoDmgPct || 0);
        default: return 0;
    }
}

function getRepresentativeSkillsForChar(baseName, elem, team = null, charName = null) {
    const kit = ROLE_SKILLS_DB[baseName] || [];
    const coreTypes = ['普攻', '重擊', '共技', '共解'];
    const defaultWeights = { '普攻': 0.20, '重擊': 0.30, '共技': 0.25, '共解': 0.25 };

    let typeWeights = { ...defaultWeights };
    if (team && Array.isArray(team.gridData) && team.gridData.length > 0) {
        let charDmgTotal = 0;
        const byType = {};
        for (const n of team.gridData) {
            const nc = getBase(n?.char || team.c1);
            if (nc !== baseName && n?.char !== charName) continue;
            const d = parseFloat(n?.dmg) || 0;
            if (d <= 0) continue;
            const st = n?.skillType || n?.skill || '普攻';
            byType[st] = (byType[st] || 0) + d;
            charDmgTotal += d;
        }
        if (charDmgTotal > 0) {
            typeWeights = {};
            for (const [st, d] of Object.entries(byType)) {
                typeWeights[st] = d / charDmgTotal;
            }
        }
    }

    const entries = [];
    for (const [st, weight] of Object.entries(typeWeights)) {
        if (weight <= 0) continue;
        const candidates = kit.filter(s => s.skillType === st);
        const bestSkill = candidates.sort((a, b) => (b.mvPct || 0) - (a.mvPct || 0))[0]
            || { mvPct: 120, skillType: st, statType: 'atk', element: elem, isGenericDummy: true };
        entries.push({ skill: bestSkill, weight });
    }
    if (entries.length === 0) {
        for (const st of coreTypes) {
            const candidates = kit.filter(s => s.skillType === st);
            const bestSkill = candidates.sort((a, b) => (b.mvPct || 0) - (a.mvPct || 0))[0]
                || { mvPct: 120, skillType: st, statType: 'atk', element: elem, isGenericDummy: true };
            entries.push({ skill: bestSkill, weight: defaultWeights[st] });
        }
    }
    return entries;
}

export function getCharOffensivePowerRatio(charName, env, team = null) {
    const lo = getEffectiveCharLoadout(charName, env);
    const baseName = getBase(charName);
    const shared = getTeammateSharedBuffs(charName, team, env);
    const hasSharedDelta = Object.values(shared.delta).some(v => Math.abs(v) > 0.01);
    if ((!lo.hasCustomLoadout || !lo.stats || !lo.defaultStats) && !hasSharedDelta) return 1.0;

    const roverAttr = lo.roverAttr || '衍射';
    const defStats = lo.defaultStats || computeCharEffectiveStats(baseName, getDefaultSlotConfig(baseName, 0, roverAttr), { roverAttr });
    const actStats = lo.stats || defStats;

    const entries = getRepresentativeSkillsForChar(baseName, actStats.element, team, charName);
    let weightedActive = 0;
    let weightedBase = 0;
    for (const { skill, weight } of entries) {
        const isEchoSkill = skill.skillType === '聲骸' || skill.skillType === '聲骸技能';
        const actD = calcRealSkillDamage({
            charName: baseName,
            stats: actStats,
            skill,
            extraAtkPct: shared.delta.teamAtkPct,
            extraDmgBonusPct: shared.delta.teamElemDmgPct + getSharedSkillTypeDmgPct(shared.delta, skill.skillType),
            extraAmplifyPct: shared.delta.teamAmplifyPct + (isEchoSkill ? shared.delta.teamEchoAmpPct : 0),
            extraResShredPct: shared.delta.teamResShredPct,
            extraCritDmg: shared.delta.teamCritDmg,
            critMode: 'expected'
        }).rawDamage;
        const baseD = calcRealSkillDamage({
            charName: baseName,
            stats: defStats,
            skill,
            critMode: 'expected'
        }).rawDamage;
        weightedActive += actD * weight;
        weightedBase += baseD * weight;
    }
    if (!weightedBase || weightedBase <= 0) return 1.0;

    const activeCr = Math.max(0, Math.min(1, actStats.critRate / 100));
    const activeCd = Math.max(1, (actStats.critDmg + shared.delta.teamCritDmg) / 100);
    const baseCr = Math.max(0, Math.min(1, defStats.critRate / 100));
    const baseCd = Math.max(1, defStats.critDmg / 100);
    const activeCritF = (1 - activeCr) + activeCr * activeCd;
    const baseCritF = (1 - baseCr) + baseCr * baseCd;
    const activeNonCrit = activeCritF > 0 ? weightedActive / activeCritF : weightedActive;
    const baseNonCrit = baseCritF > 0 ? weightedBase / baseCritF : weightedBase;
    const cdFactor = activeCd / (baseCd || 1);
    return Math.max(0.2, Math.min(8.0, (activeNonCrit / (baseNonCrit || 1)) * cdFactor));
}

const _charMechCache = new Map();
export function getCharMechanics(charName, modeOverride = null) {
    if (!charName) return null;
    const base = getBase(charName);
    const cacheKey = modeOverride ? `${base}::${modeOverride}` : base;
    if (_charMechCache.has(cacheKey)) return _charMechCache.get(cacheKey);
    const caps = getCharOffsetCapabilities ? getCharOffsetCapabilities(base, modeOverride) : {};
    const skills = ROLE_SKILLS_DB[base] || [];
    const rcs = ROLE_RC_DB[base] || [];
    const inhs = (ROLE_INHERENT_DB && ROLE_INHERENT_DB[base]) || [];
    const blob = [
        ...skills.map(s => `${s.name || ''} ${s.skillType || ''} ${s.fixedCritNote || ''}`),
        ...rcs.map(r => `${r.name || ''} ${r.desc || ''}`),
        ...inhs.map(r => `${r.name || ''} ${r.desc || ''}`)
    ].join(' ');
    const mech = {
        tuneShift: Boolean(caps.tuneShift),
        zhenxie: Boolean(caps.zhenxie),
        jixie: Boolean(caps.jixie),
        haipo: Boolean(caps.haipo),
        anomaly: Boolean(caps.anomaly),
        frostbite: Boolean(caps.frostbite),
        shield: /獲得護盾|生成護盾|提供護盾|護盾量|產生護盾|賦予護盾|形成護盾|護盾持續|的護盾|盾量/.test(blob),
        concerto: Boolean(caps.concerto || /同奏/.test(blob))
    };
    _charMechCache.set(cacheKey, mech);
    return mech;
}