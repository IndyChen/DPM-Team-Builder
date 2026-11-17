// src/core/core.js

import { charData, charAttrMap } from '../data/characters.js';
import { globalStore } from './store.js';
import { getEffectiveCharLoadout, getTeamOffsetCapabilities, getTeammateSharedBuffs, getCharMechanics, getSharedSkillTypeDmgPct, getCharOffensivePowerRatio } from './buffEngine.js';
import {
    ROLE_SKILLS_DB,
    ROLE_RC_DB,
    ROLE_INHERENT_DB,
    DUAL_MODE_ROLES,
    PRESET_KEYBIND_ROTATIONS,
    getCharOffsetCapabilities,
    computeCharEffectiveStats,
    getDefaultSlotConfig,
    getMatrixBuffNodeMultiplier,
    getMatrixBuffsByVersion,
    calcRealSkillDamage,
    parseKeybindShorthandText,
    compileKeybindSectionToGrid,
    checkTriggeredDerivedSkills
} from '../data/buffsAndLoadoutsDb.js';

const compiledPresetGridCache = new Map();
function getCompiledPresetGridsForTeam(team, env = null) {
    if (!team || !team.c1) return null;
    const lo1 = getEffectiveCharLoadout(team.c1, env);
    const lo2 = getEffectiveCharLoadout(team.c2, env);
    const lo3 = getEffectiveCharLoadout(team.c3, env);
    const loSig = `${lo1.slot?.weaponId || 0}_${lo1.slot?.weaponRank || 1}_${lo1.slot?.rc || 0}_${lo1.stats?.totalAtk || 0}_${lo2.slot?.weaponId || 0}_${lo2.slot?.rc || 0}_${lo3.slot?.weaponId || 0}_${lo3.slot?.rc || 0}`;
    const key = `${team.presetKeybindId || `${team.c1}|${team.c2 || ''}|${team.c3 || ''}`}::${loSig}`;
    if (compiledPresetGridCache.has(key)) return compiledPresetGridCache.get(key);

    const preset = (team.presetKeybindId && (PRESET_KEYBIND_ROTATIONS || []).find(p => p.id === team.presetKeybindId))
        || (PRESET_KEYBIND_ROTATIONS || []).find(p => p.c1 === team.c1 && (p.c2 || '') === (team.c2 || '') && (p.c3 || '') === (team.c3 || ''));
    if (!preset) {
        compiledPresetGridCache.set(key, null);
        return null;
    }
    const parsed = parseKeybindShorthandText(preset.shorthand, preset);
    const ctx = {
        enemyLv: Number(env?.enemyLv || 100),
        enemyRes: env?.bossRes !== undefined ? parseFloat(env.bossRes) : 0.10,
        extraAtkPct: 0,
        extraDmgBonusPct: 0,
        extraAmplifyPct: 0,
        getCharSlot: (ch) => getEffectiveCharLoadout(ch, env).slot,
        getCharStats: (ch) => getEffectiveCharLoadout(ch, env).stats
    };
    const loop = compileKeybindSectionToGrid(parsed.loopSegments, ctx);
    const opener = compileKeybindSectionToGrid(parsed.openerSegments, ctx);
    const res = {
        gridData: loop.nodes || [],
        firstGridData: opener.nodes || [],
        duration: loop.totalDuration || 25,
        firstDuration: opener.totalDuration || 28
    };
    compiledPresetGridCache.set(key, res);
    return res;
}

export let isEngineRunning = false;

// 3.7 / 3.8 矩陣表定基礎血量 (單位：萬，來源：遊戲客戶端 DB 提取驗證)
const HP_BASE_37 = {
    1: [561.2519, 561.2723, 561.2519, 561.2519, 617.3771],
    2: [954.1514, 954.1661, 954.1514, 954.1514, 1275.6094],
    3: [1938.8951, 1938.8572, 1938.8951, 1938.8951, 1938.8951]
};

const HP_BASE_38 = {
    1: [561.2519, 561.2519, 561.2519, 561.2519, 617.3771],
    2: [954.1514, 954.1514, 954.1514, 954.1514, 1275.6094],
    3: [1938.8951, 1938.8951, 1938.8951, 1938.8951, 1938.8951]
};

export const MATRIX_BOSS_PRESETS = {
    '3.8': {
        names: ['飛廉之猩', '達妮婭', '無冠者', '辛吉勒姆', '矩陣奇藏'],
        resTags: ['氣動', '熱熔', '湮滅', '衍射', ''],
        resPenalties: [25, 25, 25, 25, 0]
    },
    '3.7': {
        names: ['燎照之騎', '封庭械囿', '無冠者', '天傀劫煞', '矩陣奇藏'],
        resTags: ['熱熔', '冷凝', '湮滅', '氣動', ''],
        resPenalties: [25, 25, 25, 25, 0]
    }
};

export let bossHPMap = {};
export const ttkCache = new Map();

export const ROVER_VARIANTS = ['光主', '暗主', '風主', '雷主', '火主', '冰主'];
export function getBase(n) { return ROVER_VARIANTS.includes(n) ? '漂泊者' : n; }

const ROVER_ELEMENT_MAP = {
    '光主': '衍射', '暗主': '湮滅', '風主': '氣動',
    '雷主': '導電', '火主': '熱熔', '冰主': '冷凝'
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function getCharElement(charName) {
    if (!charName) return '';
    return ROVER_ELEMENT_MAP[charName] 
        || charAttrMap[charName] 
        || charData[charName]?.element 
        || charAttrMap[getBase(charName)] 
        || charData[getBase(charName)]?.element 
        || charName;
}

export function getBossScoreMultiplier(idx, env) {
    if (env && env.bossMultipliers && env.bossMultipliers[idx - 1] !== undefined && env.bossMultipliers[idx - 1] !== null) {
        return parseFloat(env.bossMultipliers[idx - 1]);
    }
    return idx === 5 ? 1.1 : 1.0;
}

// 依據輪次 (R1 / R2 / R3+) 與首領位置取得每萬點傷害積分倍率
export function getBossEffectiveRatio(r, idx, env) {
    let baseRatio = 10.43;
    if (env && Array.isArray(env.roundRatios) && env.roundRatios.length >= 3) {
        if (r === 1) baseRatio = parseFloat(env.roundRatios[0]) || 8.34;
        else if (r === 2) baseRatio = parseFloat(env.roundRatios[1]) || 9.60;
        else baseRatio = parseFloat(env.roundRatios[2]) || 10.43;
    } else {
        if (r === 1) baseRatio = 8.34;
        else if (r === 2) baseRatio = 9.60;
        else baseRatio = (env && env.scoreRatio) ? parseFloat(env.scoreRatio) : 10.43;
    }

    const mult = getBossScoreMultiplier(idx, env);
    if (idx === 5 && Math.abs(mult - 1.1) < 0.001) {
        if (Math.abs(baseRatio - 8.34) < 0.001) return 9.18;
        if (Math.abs(baseRatio - 9.60) < 0.001) return 10.55;
        if (Math.abs(baseRatio - 10.43) < 0.001) return 11.47;
    }
    return parseFloat((baseRatio * mult).toFixed(4));
}

export function getBossKillBonus(idx, env) {
    if (idx !== 5) return 0;
    if (env && env.bossKillBonus !== undefined && env.bossKillBonus !== null) {
        return parseFloat(env.bossKillBonus) || 0;
    }
    return 1000;
}

function getEnvParams(env) {
    return {
        ratio: (env && env.scoreRatio) ? parseFloat(env.scoreRatio) : 10.43,
        bTime: (env && env.battleTime !== undefined) ? parseFloat(env.battleTime) : 120,
        eTime: (env && env.entryTime !== undefined) ? parseFloat(env.entryTime) : 1.0,
        tTime: (env && env.transTime !== undefined) ? parseFloat(env.transTime) : 1.5,
        pen110: (env && env.pen110 !== undefined) ? parseFloat(env.pen110) : 1.0,
        pen120: (env && env.pen120 !== undefined) ? parseFloat(env.pen120) : 1.0,
    };
}

export function initBossHPMap(envSettings) {
    let growth = (envSettings && envSettings.hpGrowth !== undefined) ? (envSettings.hpGrowth / 100) : 0.05;
    let growthMode = (envSettings && envSettings.hpGrowthMode) ? envSettings.hpGrowthMode : 'linear';
    let customMap = (envSettings && envSettings.customHpMap) ? envSettings.customHpMap : {};
    
    const ver = (envSettings && envSettings.matrixVersion === '3.7') ? '3.7' : '3.8';
    const HP_BASE = ver === '3.7' ? HP_BASE_37 : HP_BASE_38;

    bossHPMap = {}; 
    for (let r = 1; r <= 10; r++) {
        for (let i = 1; i <= 5; i++) {
            let key = `R${r}-${i}`;
            if (customMap[key] !== undefined && customMap[key] !== null && customMap[key] !== '') {
                bossHPMap[key] = { value: parseFloat(customMap[key]), isDefault: false };
                continue; 
            }
            if (r <= 3) {
                let baseVal = HP_BASE[r][i - 1];
                if (envSettings) {
                    if (r === 1 && envSettings.r1_hp !== undefined && i !== 5 && Math.abs(envSettings.r1_hp - 561.25) > 0.01) baseVal = envSettings.r1_hp;
                    if (r === 2 && envSettings.r2_hp !== undefined && i !== 5 && Math.abs(envSettings.r2_hp - 954.15) > 0.01) baseVal = envSettings.r2_hp;
                    if (r === 3 && envSettings.r3_hp !== undefined && Math.abs(envSettings.r3_hp - 1938.90) > 0.01) baseVal = envSettings.r3_hp;
                }
                bossHPMap[key] = { value: baseVal, isDefault: true };
            } else {
                let baseR3Val = (envSettings && envSettings.r3_hp && Math.abs(envSettings.r3_hp - 1938.90) > 0.01)
                    ? envSettings.r3_hp
                    : HP_BASE[3][i - 1];
                let stepsAfterR3 = (r - 4) * 5 + i;
                let hpVal = growthMode === 'compound'
                    ? baseR3Val * Math.pow(1 + growth, stepsAfterR3)
                    : baseR3Val * (1 + growth * stepsAfterR3);
                bossHPMap[key] = { value: hpVal, isDefault: true };
            }
        }
    }
}

export function getBossMaxHP(r, idx) { return (bossHPMap[`R${r}-${idx}`]?.value) || 400; }

export function getBossResistanceMultiplier(env, teamAttr, bossIdx) {
    let mul = 1.0;
    if (env?.resTags && env.resTags[bossIdx - 1] === teamAttr) {
        mul *= (1 - ((env.resPenalties ? (env.resPenalties[bossIdx - 1] || 0) : 0) / 100));
    }
    return Math.max(0.1, mul);
}

/**
 * 依據當前隊伍與排軸節點獨立計算該 Boss 專屬減傷與條件式消除/增傷倍率（不跨王、不繼承給下一隊）
 */
export function getBossMechanicMultiplier(env, team, bossIdx) {
    if (env?.enableBossMechanics === false || bossIdx === 5) {
        return { factor: 1.0, label: '' };
    }
    const ver = env?.matrixVersion === '3.7' ? '3.7' : '3.8';
    const gridAll = [
        ...(Array.isArray(team?.firstGridData) ? team.firstGridData : []),
        ...(Array.isArray(team?.gridData) ? team.gridData : [])
    ];
    const caps = team ? getTeamOffsetCapabilities(team, team?.appliedDualModes || null) : {};

    if (ver === '3.7') {
        if (bossIdx === 3 && caps.concerto) {
            return { factor: 1.40, label: '戰爭藝術(同奏+40%)' };
        }
        return { factor: 1.0, label: '' };
    }

    // 3.8 (Cycle 7)
    if (bossIdx === 1) {
        // 飛廉之猩: BB[78] 破枷之怒(-20%) + 諧度破壞每層+12.5%(上限4層+50%)
        let tuneStacks = 0;
        if (gridAll.length > 0) {
            const execNodes = gridAll.filter(n =>
                n && (n.skill === '處決' || n.skill === '諧度破壞' || n.skillType === '震諧' || /處決|諧度破壞/.test(n.action || ''))
            ).length;
            tuneStacks = Math.min(4, execNodes > 0 ? execNodes * 2 : (caps.tuneShift ? 2 : 0));
        } else if (caps.tuneShift) {
            tuneStacks = 2;
        }
        const factor = 0.80 * (1 + 0.125 * tuneStacks);
        return {
            factor,
            label: tuneStacks > 0 ? `破枷之怒(-20%)·諧度${tuneStacks}層(+${tuneStacks * 12.5}%)` : '破枷之怒(-20%)'
        };
    }

    if (bossIdx === 2) {
        // 達妮婭: BB[81] 異常效應+25%, 受霜結+30%
        if (caps.frostbite) return { factor: 1.30, label: '基礎特性(霜結+30%)' };
        if (caps.anomaly) return { factor: 1.06, label: '基礎特性(異常+25%)' };
        return { factor: 1.0, label: '' };
    }

    if (bossIdx === 3) {
        // 無冠者: BB[80] 響應同奏+40%
        if (caps.concerto) return { factor: 1.40, label: '戰爭藝術(同奏+40%)' };
        return { factor: 1.0, label: '' };
    }

    if (bossIdx === 4) {
        // 辛吉勒姆: BB[79] 壁壘協議(-25%) + BB[82] 同名聲骸技能疊【迷航】(上限5層, 每層+10%, 滿5層額外+30%)
        const distinctEchoes = new Set();
        for (const n of gridAll) {
            if (!n) continue;
            const st = n.skillType || n.skillMeta?.skillType || '';
            if (st === '聲骸' || st === '聲骸技能') {
                const key = (n.action || n.skill || '').replace(/\s*×\d+.*$/, '').trim();
                if (key) distinctEchoes.add(key);
            }
        }
        let stacks = Math.min(5, distinctEchoes.size);
        if (gridAll.length === 0 && team?.c1) {
            // 舊版無節點排軸：檢查隊伍成員技能庫是否具備聲骸傷害類型 + 每名角色預設主音聲骸 Q (最多計 3)
            let echoRoles = 0;
            [team.c1, team.c2, team.c3].filter(Boolean).forEach(cn => {
                const bn = getBase(cn);
                const kit = ROLE_SKILLS_DB[bn] || [];
                const roleEchoCount = new Set(kit.filter(s => s.skillType === '聲骸' || s.skillType === '聲骸技能').map(s => s.name)).size;
                echoRoles += Math.max(1, roleEchoCount); // 每名角色至少有 1 個主音聲骸 Q
            });
            stacks = Math.min(5, echoRoles);
        }
        const bonus = stacks * 0.10 + (stacks >= 5 ? 0.30 : 0);
        const factor = 0.75 * (1 + bonus);
        return {
            factor,
            label: stacks > 0 ? `壁壘(-25%)·迷航${stacks}層(+${Math.round(bonus * 100)}%)` : '壁壘協議(-25%)'
        };
    }

    return { factor: 1.0, label: '' };
}

export function getCombatMultiplier(env, teamAttr, charName, bossIdx, team = null) {
    const resMul = getBossResistanceMultiplier(env, teamAttr, bossIdx);
    const mech = getBossMechanicMultiplier(env, team || (charName ? { c1: charName } : null), bossIdx);
    return Math.max(0.1, resMul * mech.factor);
}

// [Moved to ./buffEngine.js]: getEffectiveCharLoadout, getTeamOffsetCapabilities, getTeammateSharedBuffs, calcEffectiveLoadoutScale, getCharMechanics
function buildTeamMatrixContext(team, env, modeMap = null) {
    const baseCtx = env?.matrixContext || {};
    const grid = team?.gridData || [];
    const members = [team?.c1, team?.c2, team?.c3].filter(Boolean);
    let autoTune = false, autoZhen = false, autoJi = false, autoHaipo = false, autoAnom = false, autoFrost = false, autoShield = false, autoConc = false;
    for (const m of members) {
        const bm = getBase(m);
        const mode = modeMap?.[bm] || modeMap?.[m] || null;
        const mc = getCharMechanics(m, mode);
        if (!mc) continue;
        if (mc.tuneShift) autoTune = true;
        if (mc.zhenxie) autoZhen = true;
        if (mc.jixie) autoJi = true;
        if (mc.haipo) autoHaipo = true;
        if (mc.anomaly) autoAnom = true;
        if (mc.frostbite) autoFrost = true;
        if (mc.shield) autoShield = true;
        if (mc.concerto) autoConc = true;
    }
    const hasTuneShiftNode = grid.some(n => {
        if (!n) return false;
        const text = `${n.action || ''} ${n.skill || ''} ${n.skillType || ''} ${n.skillMeta?.skillType || ''}`;
        return /偏移/.test(text);
    });
    const hasZhenxieNode = grid.some(n => {
        if (!n) return false;
        const st = n.skillType || n.skillMeta?.skillType || '';
        const text = `${n.action || ''} ${n.skill || ''} ${st}`;
        return st === '震諧' || /震諧/.test(text);
    });
    const hasAnomalyNode = grid.some(n => n?.skill === '效應' || n?.skillType === '效應');
    const hasTuneCap = autoTune || hasTuneShiftNode;
    const pick = (key, autoVal) => (baseCtx[key] !== undefined ? Boolean(baseCtx[key]) : Boolean(autoVal));
    return {
        teamHasTuneShift: baseCtx.teamHasTuneShift !== undefined ? Boolean(baseCtx.teamHasTuneShift) : Boolean(hasTuneCap),
        teamHasAnomaly: pick('teamHasAnomaly', autoAnom || hasAnomalyNode),
        teamHasFrostbite: pick('teamHasFrostbite', autoFrost),
        teamHasZhenxie: pick('teamHasZhenxie', (autoZhen && hasTuneCap) || hasZhenxieNode),
        teamHasJixie: pick('teamHasJixie', (autoJi && autoTune)),
        teamHasHaipo: pick('teamHasHaipo', autoHaipo),
        teamHasShield: pick('teamHasShield', autoShield),
        teamHasConcerto: pick('teamHasConcerto', autoConc)
    };
}

function createMatrixTimeWindowChecker(grid, team, ctxBase, opts = {}) {
    if (!Array.isArray(grid) || grid.length === 0) return () => ctxBase;
    const hasTimes = grid.some(n => n && n.time !== undefined && !isNaN(parseFloat(n.time)));
    if (!hasTimes) return () => ctxBase;

    const isOpener = Boolean(opts.isOpener);
    const loopDur = Math.max(1, parseFloat(opts.loopDur || team?.duration || grid[grid.length - 1]?.time || 25));
    const limitSec = Number(opts.limitSec || 30);

    const triggers = {
        shield: [],
        concerto: [],
        anomaly: [],
        frostbite: [],
        tuneShift: [],
        zhenxie: []
    };

    for (const n of grid) {
        if (!n) continue;
        const t = parseFloat(n.time);
        if (isNaN(t)) continue;
        const mc = getCharMechanics(n.char || team?.c1);
        const st = n.skillType || n.skillMeta?.skillType || n.skill || '';
        const stExact = n.skillType || n.skillMeta?.skillType || '';
        const act = `${n.action || ''} ${n.skill || ''} ${stExact}`;
        if (mc?.shield || /護盾|盾/.test(act)) triggers.shield.push(t);
        if (mc?.concerto || /同奏/.test(act)) triggers.concerto.push(t);
        if (mc?.anomaly || st === '效應') triggers.anomaly.push(t);
        if (mc?.frostbite || /霜漸|霜結/.test(act)) triggers.frostbite.push(t);
        if (mc?.tuneShift || /偏移/.test(act)) triggers.tuneShift.push(t);
        if ((mc?.zhenxie && ctxBase?.teamHasTuneShift) || stExact === '震諧' || /震諧/.test(act)) triggers.zhenxie.push(t);
    }

    const inWindow = (trigList, t) => {
        if (trigList.length === 0) return true; // 無明確節點時回退團隊靜態能力
        for (const tr of trigList) {
            if (t >= tr - 1e-6 && t <= tr + limitSec + 1e-6) return true;
            if (!isOpener && (t + loopDur) >= tr - 1e-6 && (t + loopDur) <= tr + limitSec + 1e-6) return true;
        }
        return false;
    };

    return (node) => {
        const t = parseFloat(node?.time);
        if (isNaN(t)) return ctxBase;
        return {
            ...ctxBase,
            teamHasShield: ctxBase.teamHasShield && inWindow(triggers.shield, t),
            teamHasConcerto: ctxBase.teamHasConcerto && inWindow(triggers.concerto, t),
            teamHasAnomaly: ctxBase.teamHasAnomaly && inWindow(triggers.anomaly, t),
            teamHasFrostbite: ctxBase.teamHasFrostbite && inWindow(triggers.frostbite, t),
            teamHasTuneShift: ctxBase.teamHasTuneShift && inWindow(triggers.tuneShift, t),
            teamHasZhenxie: ctxBase.teamHasZhenxie && inWindow(triggers.zhenxie, t)
        };
    };
}

export function getRotationMatrixMultiplier(team, env, overrideBuffId = null) {
    const buffId = overrideBuffId !== null ? overrideBuffId : (env?.matrixBuffId || 'auto');
    if (!buffId || buffId === 'none') return { finalMult: 1.0, buffId: 'none', name: '無矩陣增益' };

    const ver = env?.matrixVersion || '3.8';
    const ctxBase = buildTeamMatrixContext(team, env);

    if (buffId === 'auto') {
        const buffs = getMatrixBuffsByVersion(ver);
        const grid = team?.gridData || [];
        const hasRealSkillNodes = grid.some(n => n && n.skillMeta && Number(n.skillMeta.mvPct) > 0);
        let best = { finalMult: 1.0, buffId: buffs[0]?.id || 'buff_42', name: buffs[0]?.name || '', _bestScore: -1 };
        for (const b of buffs) {
            const res = getRotationMatrixMultiplier(team, env, b.id);
            let scoreMetric = res.finalMult;
            if (hasRealSkillNodes) {
                const realTest = recomputeGridWithCombatDb(grid, team, env, b.id, ctxBase);
                if (realTest.usedRealSkills && realTest.totalDmg > 0) {
                    scoreMetric = realTest.totalDmg;
                }
            }
            if (scoreMetric > best._bestScore) {
                best = { ...res, _bestScore: scoreMetric };
            }
        }
        delete best._bestScore;
        return best;
    }

    const meta = getMatrixBuffsByVersion(ver).find(b => b.id === buffId) || getMatrixBuffsByVersion('3.7').find(b => b.id === buffId);
    const grid = team?.gridData || [];
    if (grid.length > 0) {
        const getNodeCtx = createMatrixTimeWindowChecker(grid, team, ctxBase, { limitSec: env?.matrixBuffDurationSec || 30 });
        let weightedSum = 0;
        let totalDmg = 0;
        for (const node of grid) {
            const d = parseFloat(node.dmg) || 0;
            if (d <= 0) continue;
            const elem = node.element || getCharElement(node.char || team?.c1);
            const st = node.skillType || node.skill || '普攻';
            const res = getMatrixBuffNodeMultiplier(buffId, { ...getNodeCtx(node), skillType: st, element: elem });
            weightedSum += d * res.finalMult;
            totalDmg += d;
        }
        if (totalDmg > 0) {
            return { finalMult: weightedSum / totalDmg, buffId, name: meta?.name || buffId };
        }
    }
    const c1Base = getBase(team?.c1);
    const c1Elem = getCharElement(team?.c1);
    const c1Kit = ROLE_SKILLS_DB[c1Base] || [];
    if (c1Kit.length > 0) {
        let mvSum = 0, wMult = 0;
        for (const sk of c1Kit) {
            const mv = Number(sk.mvPct) || 0;
            if (mv <= 0) continue;
            const r = getMatrixBuffNodeMultiplier(buffId, { ...ctxBase, skillType: sk.skillType || '普攻', element: c1Elem });
            wMult += mv * r.finalMult;
            mvSum += mv;
        }
        if (mvSum > 0) {
            return { finalMult: wMult / mvSum, buffId, name: meta?.name || buffId };
        }
    }
    const res = getMatrixBuffNodeMultiplier(buffId, { ...ctxBase, skillType: '普攻', element: c1Elem });
    return { finalMult: res.finalMult, buffId, name: meta?.name || buffId };
}

const GLOBAL_30S_OUTRO_CHARS = new Set(['守岸人', '維里奈', '白芷']);
const ULT_FIELD_DURATION = { '守岸人': 30, '莫寧': 25 };

function analyzeGridBuffCoverage(grid, team) {
    if (!Array.isArray(grid) || grid.length === 0) return [];
    const mainDpsBase = getBase(team?.c1 || '');
    let maxT = 0;
    for (const n of grid) maxT = Math.max(maxT, parseFloat(n?.time) || 0);
    const totalDur = Math.max(12, maxT || parseFloat(team?.duration) || 25);

    const outroEvents = [];
    const ultWindows = new Map();
    let hasExplicitOutro = false;

    for (let i = 0; i < grid.length; i++) {
        const n = grid[i];
        const t = parseFloat(n?.time) || 0;
        const cBase = getBase(n?.char || '');
        const tag = `${n?.skillType || ''} ${n?.skill || ''} ${n?.action || ''}`;

        if (/解放|大招|liberation|ult/i.test(tag) && ULT_FIELD_DURATION[cBase]) {
            const list = ultWindows.get(cBase) || [];
            list.push({ start: t, end: t + ULT_FIELD_DURATION[cBase] });
            ultWindows.set(cBase, list);
        }

        if (/延奏|outro/i.test(tag) && cBase) {
            hasExplicitOutro = true;
            let receiver = mainDpsBase;
            for (let j = i + 1; j < grid.length; j++) {
                const nb = getBase(grid[j]?.char || '');
                if (nb && nb !== cBase) { receiver = nb; break; }
            }
            const isGlobal = GLOBAL_30S_OUTRO_CHARS.has(cBase);
            let outroEnd = t + (isGlobal ? 30 : 14);
            if (!isGlobal) {
                let entered = false;
                for (let j = i + 1; j < grid.length; j++) {
                    const tj = parseFloat(grid[j]?.time) || 0;
                    if (tj > outroEnd) break;
                    const nb = getBase(grid[j]?.char || '');
                    if (nb === receiver) entered = true;
                    else if (entered && nb && nb !== receiver) { outroEnd = tj; break; }
                }
            }
            outroEvents.push({ caster: cBase, receiver, start: t, outroEnd, echo15sEnd: t + 15, isGlobal });
        }
    }

    if (!hasExplicitOutro) {
        const firstMainBurst = grid.find(n => getBase(n?.char || '') === mainDpsBase && (parseFloat(n?.time) || 0) >= totalDur * 0.18);
        const anchorT = firstMainBurst ? (parseFloat(firstMainBurst.time) || 0) : totalDur * 0.25;
        for (const m of [team?.c2, team?.c3].filter(Boolean)) {
            const mBase = getBase(m);
            if (!mBase || mBase === mainDpsBase) continue;
            let lastSupT = -1;
            for (const n of grid) {
                const nt = parseFloat(n?.time) || 0;
                if (getBase(n?.char || '') === mBase && nt <= anchorT + 0.5) lastSupT = nt;
            }
            const start = lastSupT >= 0 ? lastSupT : Math.min(anchorT, totalDur * 0.25);
            const isGlobal = GLOBAL_30S_OUTRO_CHARS.has(mBase);
            outroEvents.push({ caster: mBase, receiver: mainDpsBase, start, outroEnd: start + (isGlobal ? 30 : 14.5), echo15sEnd: start + 15, isGlobal });
        }
    }

    return grid.map(n => {
        const t = parseFloat(n?.time) || 0;
        const cBase = getBase(n?.char || team?.c1 || '');
        const activeLabels = [];
        const missedLabels = [];
        let maxOutroEnd = 0;
        let maxUltEnd = 0;

        for (const ev of outroEvents) {
            if (ev.caster === cBase) continue;
            if (ev.isGlobal || ev.receiver === cBase) {
                if (t >= ev.start && t <= ev.outroEnd) {
                    activeLabels.push(`${ev.caster}延奏(${ev.outroEnd.toFixed(1)}s)`);
                    if (ev.outroEnd > maxOutroEnd) maxOutroEnd = ev.outroEnd;
                } else if (ev.receiver === cBase) {
                    missedLabels.push(`${ev.caster}延奏未覆蓋`);
                }
            }
        }
        for (const [uCaster, wins] of ultWindows.entries()) {
            if (uCaster === cBase) continue;
            const hit = wins.find(w => t >= w.start && t <= w.end);
            if (hit) {
                activeLabels.push(`${uCaster}領域(${hit.end.toFixed(1)}s)`);
                if (hit.end > maxUltEnd) maxUltEnd = hit.end;
            } else {
                missedLabels.push(`${uCaster}領域未覆蓋`);
            }
        }
        return {
            outroWindowEnd: maxOutroEnd > 0 ? maxOutroEnd : (Math.max(2.0, totalDur * 0.25) + 14.5),
            ultWindowEnd: maxUltEnd > 0 ? maxUltEnd : 30,
            coveredOutro: maxOutroEnd > 0,
            coveredUlt: maxUltEnd > 0 || ultWindows.size === 0,
            activeLabels,
            missedLabels
        };
    });
}

function recomputeGridWithCombatDb(grid, team, env, buffId, matrixCtx) {
    if (!Array.isArray(grid) || grid.length === 0) return { nodes: grid, totalDmg: 0, usedRealSkills: false };
    const envRes = env?.bossRes !== undefined
        ? parseFloat(env.bossRes)
        : (env?.enemyResPct !== undefined && !isNaN(parseFloat(env.enemyResPct)) ? parseFloat(env.enemyResPct) / 100 : 0.10);
    const hasRealSkillNodes = grid.some(n => n && n.skillMeta && Number(n.skillMeta.mvPct) > 0);
    if (!hasRealSkillNodes) return { nodes: grid, totalDmg: grid.reduce((s, n) => s + (parseFloat(n.dmg) || 0), 0), usedRealSkills: false };

    const coverageList = analyzeGridBuffCoverage(grid, team);
    const getNodeCtx = createMatrixTimeWindowChecker(grid, team, matrixCtx, { limitSec: env?.matrixBuffDurationSec || 30 });
    const sharedCache = new Map();
    let totalDmg = 0;
    const updated = grid.map((n, idx) => {
        const cov = coverageList[idx] || null;
        const nodeMatrixCtx = getNodeCtx(n);
        if (!n || !n.skillMeta || !(Number(n.skillMeta.mvPct) > 0)) {
            const baseD = (parseFloat(n?.dmg) || 0);
            const nodeMult = (buffId && buffId !== 'none')
                ? getMatrixBuffNodeMultiplier(buffId, { ...nodeMatrixCtx, skillType: n?.skillType || n?.skill || '普攻', element: getCharElement(n?.char || team?.c1) }).finalMult
                : 1.0;
            const d = baseD * nodeMult;
            totalDmg += d;
            return { ...n, dmg: Math.round(d), ...(cov ? { buffCoverage: cov } : {}) };
        }
        const charName = n.char || team?.c1;
        const baseName = getBase(charName);
        const lo = getEffectiveCharLoadout(charName, env);
        const effStats = lo.stats || computeCharEffectiveStats(baseName, getDefaultSlotConfig(baseName, 0, lo.roverAttr), { roverAttr: lo.roverAttr });
        let shared = sharedCache.get(charName);
        if (!shared) {
            shared = getTeammateSharedBuffs(charName, team, env);
            sharedCache.set(charName, shared);
        }
        const hits = Number(n.skillMeta.hits || 1);
        const st = n.skillMeta.skillType || '普攻';
        const isEchoSkill = st === '聲骸' || st === '聲骸技能';
        const typeAmp = st === '普攻' ? (shared.active.teamBasicAmpPct || 0)
            : (st === '重擊' ? (shared.active.teamHeavyAmpPct || 0)
            : (st === '共技' ? (shared.active.teamSkillAmpPct || 0)
            : (st === '共解' ? (shared.active.teamLibAmpPct || 0)
            : (isEchoSkill ? (shared.active.teamEchoAmpPct || 0) : 0))));
        const sharedSnapshot = {
            teamAtkPct: shared.active.teamAtkPct || 0,
            teamDmgBonusPct: (shared.active.teamElemDmgPct || 0) + getSharedSkillTypeDmgPct(shared.active, st),
            teamAmplifyPct: (shared.active.teamAmplifyPct || 0) + (shared.active.teamElemAmpPct || 0) + typeAmp,
            teamCritRate: (shared.active.teamCritRate || 0) + (isEchoSkill ? (shared.active.teamEchoCritRate || 0) : 0),
            teamCritDmg: (shared.active.teamCritDmg || 0) + (isEchoSkill ? (shared.active.teamEchoCritDmg || 0) : 0),
            teamIgnoreDefPct: shared.active.teamIgnoreDefPct || 0,
            teamResShredPct: shared.active.teamResShredPct || 0
        };
        const res = calcRealSkillDamage({
            charName: baseName,
            stats: effStats,
            skill: n.skillMeta,
            enemyLv: Number(env?.enemyLv || 100),
            charLv: 90,
            enemyRes: isNaN(envRes) ? 0.10 : envRes,
            extraAtkPct: Number(n.skillMeta.extraAtkPct || 0) + sharedSnapshot.teamAtkPct,
            extraDmgBonusPct: Number(n.skillMeta.extraDmgBonusPct || 0) + sharedSnapshot.teamDmgBonusPct,
            extraAmplifyPct: Number(n.skillMeta.extraAmplifyPct || 0) + sharedSnapshot.teamAmplifyPct,
            extraCritRate: Number(n.skillMeta.extraCritRate || 0) + sharedSnapshot.teamCritRate,
            extraCritDmg: Number(n.skillMeta.extraCritDmg || 0) + sharedSnapshot.teamCritDmg,
            extraIgnoreDefPct: Number(n.skillMeta.extraIgnoreDefPct || 0) + sharedSnapshot.teamIgnoreDefPct,
            extraDefShredPct: Number(n.skillMeta.extraDefShredPct || 0),
            extraResShredPct: Number(n.skillMeta.extraResShredPct || 0) + sharedSnapshot.teamResShredPct,
            matrixBuffId: (buffId && buffId !== 'none') ? buffId : null,
            matrixContext: nodeMatrixCtx,
            critMode: 'expected'
        });
        const nodeDmg = Math.round(res.rawDamage * hits);
        totalDmg += nodeDmg;
        const fcFlag = Boolean(res.breakdown?.fixedCrit);
        return {
            ...n,
            dmg: nodeDmg,
            fixedCrit: fcFlag,
            fixedCritRate: fcFlag ? Number(res.breakdown.fixedCritRate) : n.fixedCritRate,
            sharedSnapshot,
            ...(cov ? { buffCoverage: cov } : {})
        };
    });
    const derivedSkillsTriggered = [];
    for (const m of [team?.c1, team?.c2, team?.c3].filter(Boolean)) {
        const loM = getEffectiveCharLoadout(m, env);
        const trig = checkTriggeredDerivedSkills(m, updated, loM?.rc || 0);
        if (trig.length > 0) derivedSkillsTriggered.push({ char: m, skills: trig });
    }
    return { nodes: updated, totalDmg, usedRealSkills: true, derivedSkillsTriggered };
}

export function resolveTeamDualModes(team, env = {}) {
    const members = [team?.c1, team?.c2, team?.c3].filter(Boolean).map(getBase);
    const dualList = members.filter(m => DUAL_MODE_ROLES && Array.isArray(DUAL_MODE_ROLES[m]));
    if (dualList.length === 0) return {};

    // Enumerate cartesian combinations (at most 2^3 = 8)
    let combos = [{}];
    for (const dm of dualList) {
        const modes = DUAL_MODE_ROLES[dm];
        const next = [];
        for (const c of combos) {
            for (const md of modes) next.push({ ...c, [dm]: md });
        }
        combos = next;
    }

    let bestCombo = combos[0];
    let bestScore = -1;
    const buffId = env?.matrixBuffId || 'auto';
    for (const combo of combos) {
        const ctx = buildTeamMatrixContext(team, env, combo);
        const envWithCtx = { ...env, matrixContext: ctx };
        const matRes = (buffId && buffId !== 'none')
            ? getRotationMatrixMultiplier(team, envWithCtx, buffId)
            : { finalMult: 1.0 };

        // Synergy score: teammates sharing the same mode mechanism (zhenxie / jixie / jubeo) + teammate mode buffs
        let synergy = 1.0;
        const capsList = members.map(m => getCharOffsetCapabilities(m, combo[m] || null));
        const zhenCount = capsList.filter(x => x.zhenxie).length;
        const jiCount = capsList.filter(x => x.jixie).length;
        const polyCount = capsList.filter(x => x.jubeo).length;
        const anomSupportCount = capsList.filter(x => x.anomaly && !x.jubeo).length;
        const mainType = capsList[0]?.zhenxie && !capsList[0]?.jubeo && !capsList[0]?.jixie ? 'zhenxie'
            : (capsList[0]?.jixie && !capsList[0]?.zhenxie ? 'jixie'
            : (capsList[0]?.jubeo && !capsList[0]?.zhenxie ? 'jubeo' : null));
        if (zhenCount >= 2 && (!mainType || mainType === 'zhenxie')) synergy += 0.25 * (zhenCount - 1) + (capsList[0]?.zhenxie ? 0.35 : 0);
        if (jiCount >= 2 && (!mainType || mainType === 'jixie')) synergy += 0.25 * (jiCount - 1) + (capsList[0]?.jixie ? 0.35 : 0);
        if (polyCount >= 2 && (!mainType || mainType === 'jubeo')) synergy += 0.30 * (polyCount - 1) + 0.15 * anomSupportCount + (capsList[0]?.jubeo ? 0.35 : 0);

        let statScore = 1.0;
        let teamElemBonus = 0;
        const c1Elem = getCharElement(members[0]);
        for (const dm of dualList) {
            const lo = getEffectiveCharLoadout(dm, env);
            const st = computeCharEffectiveStats(dm, lo.slot || getDefaultSlotConfig(dm, 0, lo.roverAttr), {
                roverAttr: lo.roverAttr,
                resonanceMode: combo[dm]
            });
            const dmElem = getCharElement(dm);
            if (dmElem === c1Elem || members.filter(x => x !== dm).some(x => getCharElement(x) === dmElem)) {
                teamElemBonus += Number(st.mods?.teamElemDmgPct || 0);
            }
            statScore *= (1 + (st.allDmgPct + st.elemDmgPct) / 300) * (1 + Math.min(1, st.critRate / 100) * (st.critDmg / 100 - 1)) * (1 + (st.tuneAmp || 0) * Math.max(1, jiCount) / 400);
        }
        statScore *= (1 + teamElemBonus / 200);
        const totalScore = matRes.finalMult * synergy * statScore;
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestCombo = combo;
        }
    }
    return bestCombo;
}

export function resolveTeamEffectiveInputs(team, env) {
    const rawLoop = parseFloat(team._skipCritScale ? (team.calculatedMinDps || team.rawDps || team.dps) : (team.rawDps || team.dps)) || 0;
    const rawOpener = resolveOpenerBaseDps(team);
    if (team?._skipCritScale) {
        return {
            loopBaseDps: rawLoop,
            openerBaseDps: rawOpener,
            gridData: team.gridData || [],
            firstGridData: team.firstGridData || null,
            baseCritRates: team.baseCritRates || {},
            matrixMult: 1.0,
            appliedMatrixBuff: { buffId: 'none', name: '實戰逆算', finalMult: 1.0 },
            skipCritScalingAdjustment: false
        };
    }

    let activeGridData = team.gridData;
    let activeFirstGridData = team.firstGridData;
    let activeDur = parseFloat(team.duration) || 25;
    let activeFirstDur = parseFloat(team.firstDuration || activeDur) || activeDur;
    const shouldAutoCompilePreset = Boolean(team.presetKeybindId || !(parseFloat(team.rawDps || team.dps) > 0) || env?.usePresetKeybindGrids === true);
    if ((!Array.isArray(activeGridData) || activeGridData.length === 0) && shouldAutoCompilePreset && env?.usePresetKeybindGrids !== false) {
        const compiledPreset = getCompiledPresetGridsForTeam(team, env);
        if (compiledPreset && compiledPreset.gridData.length > 0) {
            activeGridData = compiledPreset.gridData;
            if (!Array.isArray(activeFirstGridData) || activeFirstGridData.length === 0) {
                activeFirstGridData = compiledPreset.firstGridData;
                activeFirstDur = compiledPreset.firstDuration || activeFirstDur;
            }
        }
    }

    const appliedModes = resolveTeamDualModes(team, env);
    const teamForMatrix = (activeGridData && activeGridData.length > 0)
        ? { ...team, gridData: activeGridData, firstGridData: activeFirstGridData }
        : team;
    const matrixCtx = buildTeamMatrixContext(teamForMatrix, env, appliedModes);
    const effectiveBuffId = team?.forcedMatrixBuffId
        ? team.forcedMatrixBuffId
        : (env?.matrixBuffId === 'none'
            ? 'none'
            : ((env?.matrixBuffId && env.matrixBuffId !== 'auto')
                ? env.matrixBuffId
                : (team?.matrixBuffId && team.matrixBuffId !== 'none' ? team.matrixBuffId : 'auto')));
    let chosenMatrix = { buffId: 'none', name: '無', finalMult: 1.0 };
    if (effectiveBuffId && effectiveBuffId !== 'none') {
        chosenMatrix = getRotationMatrixMultiplier(teamForMatrix, { ...env, matrixContext: matrixCtx }, effectiveBuffId);
    }

    const realMain = recomputeGridWithCombatDb(activeGridData, team, env, chosenMatrix.buffId, matrixCtx);
    if (realMain.usedRealSkills && realMain.totalDmg > 0) {
        const dur = activeDur;
        const loopBaseDps = realMain.totalDmg / dur / 10000;
        const realFirst = recomputeGridWithCombatDb(activeFirstGridData, team, env, chosenMatrix.buffId, matrixCtx);
        const fDur = activeFirstDur;
        const openerBaseDps = (realFirst.usedRealSkills && realFirst.totalDmg > 0)
            ? (realFirst.totalDmg / fDur / 10000)
            : (rawOpener * chosenMatrix.finalMult);

        const adjustedBaseCR = { ...(team.baseCritRates || {}) };
        [team.c1, team.c2, team.c3].forEach(cn => {
            if (!cn) return;
            const bn = getBase(cn);
            const lo = getEffectiveCharLoadout(cn, env);
            const stats = lo.stats || computeCharEffectiveStats(bn, getDefaultSlotConfig(bn, 0, lo.roverAttr), { roverAttr: lo.roverAttr });
            const buffCr = parseFloat(team?.buffCritRates?.[bn] ?? team?.buffCritRates?.[cn] ?? 0) || 0;
            adjustedBaseCR[bn] = Math.max(0, Number((stats.critRate - buffCr).toFixed(1)));
        });

        const rawRefDmg = (team.gridData || []).reduce((s, n) => s + (parseFloat(n.dmg) || 0), 0);
        return {
            loopBaseDps,
            openerBaseDps,
            gridData: realMain.nodes,
            firstGridData: realFirst.usedRealSkills ? realFirst.nodes : (team.firstGridData || null),
            baseCritRates: adjustedBaseCR,
            matrixMult: chosenMatrix.finalMult,
            appliedMatrixBuff: chosenMatrix,
            appliedDualModes: appliedModes,
            legacyLoadoutScale: rawRefDmg > 0 ? (realMain.totalDmg / rawRefDmg) : 1.0,
            skipCritScalingAdjustment: false
        };
    }

    let loadoutScale = 1.0;
    if (env?.applyLoadoutScaling !== false) {
        const lo1 = getEffectiveCharLoadout(team.c1, env);
        const lo2 = getEffectiveCharLoadout(team.c2, env);
        const lo3 = getEffectiveCharLoadout(team.c3, env);
        if (lo1.hasCustomLoadout || lo2.hasCustomLoadout || lo3.hasCustomLoadout) {
            const p1 = getCharOffensivePowerRatio(team.c1, env, team);
            const p2 = team.c2 ? getCharOffensivePowerRatio(team.c2, env, team) : 1.0;
            const p3 = team.c3 ? getCharOffensivePowerRatio(team.c3, env, team) : 1.0;
            if (Array.isArray(team.gridData) && team.gridData.length > 0) {
                let dTotal = 0, wSum = 0;
                const b2 = getBase(team.c2), b3 = getBase(team.c3);
                for (const n of team.gridData) {
                    const d = parseFloat(n.dmg) || 0;
                    dTotal += d;
                    const nb = getBase(n.char);
                    if (team.c2 && (n.char === team.c2 || (b2 === '漂泊者' && nb === b2))) wSum += d * p2;
                    else if (team.c3 && (n.char === team.c3 || (b3 === '漂泊者' && nb === b3))) wSum += d * p3;
                    else wSum += d * p1;
                }
                if (dTotal > 0) loadoutScale = wSum / dTotal;
            } else {
                loadoutScale = team.c2 ? (0.65 * p1 + 0.35 * p2) : p1;
            }
        }
    }

    const totalScale = loadoutScale * chosenMatrix.finalMult;
    const scaledGrid = (totalScale !== 1.0 && Array.isArray(team.gridData))
        ? team.gridData.map(n => ({ ...n, dmg: Math.round((parseFloat(n.dmg) || 0) * totalScale) }))
        : (team.gridData || []);
    const scaledFirstGrid = (totalScale !== 1.0 && Array.isArray(team.firstGridData))
        ? team.firstGridData.map(n => ({ ...n, dmg: Math.round((parseFloat(n.dmg) || 0) * totalScale) }))
        : (team.firstGridData || null);

    return {
        loopBaseDps: rawLoop * totalScale,
        openerBaseDps: rawOpener * totalScale,
        gridData: scaledGrid,
        firstGridData: scaledFirstGrid,
        baseCritRates: team.baseCritRates || {},
        matrixMult: chosenMatrix.finalMult,
        appliedMatrixBuff: chosenMatrix,
        appliedDualModes: appliedModes,
        legacyLoadoutScale: loadoutScale,
        skipCritScalingAdjustment: false
    };
}

export function evaluateRotationAcrossMatrixBuffs(rotObj, env = {}) {
    const ver = env?.matrixVersion || '3.8';
    const buffs = getMatrixBuffsByVersion(ver);
    const dur = parseFloat(rotObj?.duration) || 25;
    const ranked = buffs.map(b => {
        const envForBuff = { ...env, matrixVersion: ver, matrixBuffId: b.id };
        const resolved = resolveTeamEffectiveInputs(rotObj, envForBuff);
        const effTeam = {
            ...rotObj,
            gridData: resolved.gridData,
            firstGridData: resolved.firstGridData,
            baseCritRates: resolved.baseCritRates
        };
        const expectedDpsWan = applyMonteCarloDps(effTeam, envForBuff, 'expected', resolved.loopBaseDps);
        const simRes = simulateAndGenerateReport([{
            ...rotObj,
            rotId: rotObj.id || rotObj.rotId || 'custom_rot',
            _residualCache: new Map()
        }], envForBuff, 'expected');
        return {
            buffId: b.id,
            dbId: b.dbId,
            name: b.name,
            category: b.category,
            desc: b.desc,
            matrixMult: resolved.matrixMult,
            expectedDpsWan: Number(expectedDpsWan.toFixed(4)),
            expectedDps: Math.round(expectedDpsWan * 10000),
            totalDmg: Math.round(expectedDpsWan * dur * 10000),
            openerDps: Math.round(resolved.openerBaseDps * 10000),
            score: Math.round(simRes.score || 0),
            report: simRes.teams?.[0]?.report || '',
            gridData: resolved.gridData
        };
    }).sort((a, b) => (b.score - a.score) || (b.expectedDps - a.expectedDps));

    return {
        version: ver,
        best: ranked[0] || null,
        ranked
    };
}

export function getCharCritDetails(team, charName, env) {
    if (!charName) return { userCR: 70, baseCR: 70, deltaCR: 0, buffCR: 0, finalCR: 70, isUserSet: false };
    const baseName = getBase(charName);
    const hasExplicitEnvCrit = Boolean(env && env.charCritRates && (env.charCritRates[baseName] !== undefined || env.charCritRates[charName] !== undefined));
    const globalRates = hasExplicitEnvCrit ? env.charCritRates : (globalStore?.charCritRates || {});
    const lo = getEffectiveCharLoadout(charName, env);
    const shared = getTeammateSharedBuffs(charName, team, env);

    let baseCR = 70;
    if (team?.baseCritRates && (team.baseCritRates[baseName] !== undefined || team.baseCritRates[charName] !== undefined)) {
        const parsedBase = parseFloat(team.baseCritRates[baseName] ?? team.baseCritRates[charName]);
        if (!isNaN(parsedBase)) baseCR = parsedBase;
    }

    let userCR = baseCR;
    let isUserSet = false;
    const rawUserVal = globalRates[baseName] !== undefined ? globalRates[baseName] : globalRates[charName];
    if (hasExplicitEnvCrit && rawUserVal !== undefined && rawUserVal !== null && rawUserVal !== '') {
        const parsedUser = typeof rawUserVal === 'object' && rawUserVal.cr !== undefined ? parseFloat(rawUserVal.cr) : parseFloat(rawUserVal);
        if (!isNaN(parsedUser)) {
            userCR = parsedUser;
            isUserSet = true;
        }
    } else if (lo.hasCustomLoadout && lo.stats) {
        userCR = Math.min(100, Number((lo.stats.critRate + shared.delta.teamCritRate).toFixed(1)));
        isUserSet = true;
    } else if (rawUserVal !== undefined && rawUserVal !== null && rawUserVal !== '') {
        const parsedUser = typeof rawUserVal === 'object' && rawUserVal.cr !== undefined ? parseFloat(rawUserVal.cr) : parseFloat(rawUserVal);
        if (!isNaN(parsedUser)) {
            userCR = parsedUser;
            isUserSet = true;
        }
    } else if (Math.abs(shared.delta.teamCritRate) > 0.01) {
        userCR = Math.min(100, Number((baseCR + shared.delta.teamCritRate).toFixed(1)));
        isUserSet = true;
    }

    let buffCR = 0;
    if (team?.buffCritRates && (team.buffCritRates[baseName] !== undefined || team.buffCritRates[charName] !== undefined)) {
        const parsedBuff = parseFloat(team.buffCritRates[baseName] ?? team.buffCritRates[charName]);
        if (!isNaN(parsedBuff)) buffCR = parsedBuff;
    }

    const deltaCR = parseFloat((userCR - baseCR).toFixed(1));
    const finalCR = parseFloat(Math.max(0, Math.min(100, baseCR + buffCR + deltaCR)).toFixed(1));
    return { userCR, baseCR, deltaCR, buffCR, finalCR, isUserSet };
}

export function resolveCharCritRate(team, charName, env) {
    return getCharCritDetails(team, charName, env).finalCR / 100;
}

export function resolveOpenerBaseDps(team) {
    if (team.firstDps && team.firstDps > 0) return parseFloat(team.firstDps);
    if (team.firstTotalDmg && team.firstDuration && team.firstDuration > 0) {
        return parseFloat(team.firstTotalDmg) / parseFloat(team.firstDuration);
    }
    const base = parseFloat(team.rawDps || team.dps) || 0;
    return base * 0.85;
}

export function applyMonteCarloDps(team, env, mode, baseDps) {
    if (!baseDps || baseDps <= 0) return 0;

    const d1 = getCharCritDetails(team, team.c1, env);
    const d2 = getCharCritDetails(team, team.c2, env);
    const d3 = getCharCritDetails(team, team.c3, env);

    const c1CR = d1.finalCR / 100;
    const c2CR = d2.finalCR / 100;
    const c3CR = d3.finalCR / 100;

    const ref1CR = Math.max(0, Math.min(100, d1.baseCR + d1.buffCR)) / 100;
    const ref2CR = Math.max(0, Math.min(100, d2.baseCR + d2.buffCR)) / 100;
    const ref3CR = Math.max(0, Math.min(100, d3.baseCR + d3.buffCR)) / 100;

    const lo1 = getEffectiveCharLoadout(team.c1, env);
    const lo2 = getEffectiveCharLoadout(team.c2, env);
    const lo3 = getEffectiveCharLoadout(team.c3, env);
    let c1CD = (lo1.hasCustomLoadout && lo1.stats) ? Math.max(1.5, lo1.stats.critDmg / 100) : 2.5;
    let c2CD = (lo2.hasCustomLoadout && lo2.stats) ? Math.max(1.5, lo2.stats.critDmg / 100) : 2.2;
    let c3CD = (lo3.hasCustomLoadout && lo3.stats) ? Math.max(1.5, lo3.stats.critDmg / 100) : 2.0;
    let fixedCD = 2.5;
    let ratio1 = 1.0, ratio2 = 0.0, ratio3 = 0.0, ratioFixed = 0.0;
    let avgFixedCR = 0.8;

    if (team.gridData && team.gridData.length > 0) {
        let totalDmg = 0, c1Dmg = 0, c2Dmg = 0, c3Dmg = 0, fixedDmg = 0, fixedCrWeightedSum = 0;
        const c2Base = getBase(team.c2);
        const c3Base = getBase(team.c3);
        for (let i = 0; i < team.gridData.length; i++) {
            const node = team.gridData[i];
            let d = parseFloat(node.dmg) || 0;
            totalDmg += d;
            if (node.fixedCrit) {
                let fRate = node.fixedCritRate !== undefined && node.fixedCritRate !== null && node.fixedCritRate !== ''
                    ? parseFloat(node.fixedCritRate)
                    : 80;
                fRate = Math.max(0, Math.min(100, isNaN(fRate) ? 80 : fRate)) / 100;
                fixedDmg += d;
                fixedCrWeightedSum += d * fRate;
            } else {
                const nodeBase = getBase(node.char);
                if (team.c2 && (node.char === team.c2 || (c2Base === '漂泊者' && nodeBase === c2Base))) c2Dmg += d;
                else if (team.c3 && (node.char === team.c3 || (c3Base === '漂泊者' && nodeBase === c3Base))) c3Dmg += d;
                else c1Dmg += d; // 預設或未知角色歸入主C暴率池
            }
        }
        if (totalDmg > 0) { 
            ratio1 = c1Dmg / totalDmg; 
            ratio2 = c2Dmg / totalDmg; 
            ratio3 = c3Dmg / totalDmg;
            ratioFixed = fixedDmg / totalDmg;
            if (fixedDmg > 0) avgFixedCR = fixedCrWeightedSum / fixedDmg;
        }
    } else if (team.c2) { 
        ratio1 = 0.65; 
        ratio2 = 0.35; 
    }

    let ratioStatic = Math.max(0, 1.0 - ratio1 - ratio2 - ratio3 - ratioFixed);
    let exp1 = (1 - c1CR) + c1CR * c1CD;
    let exp2 = (1 - c2CR) + c2CR * c2CD;
    let exp3 = (1 - c3CR) + c3CR * c3CD;
    let expFixed = (1 - avgFixedCR) + avgFixedCR * fixedCD;

    // 若已經是實戰逆算出的真實 DPS (_skipCritScale)，不再重複乘算面板暴率差值倍率
    let refExp1 = team?._skipCritScale ? exp1 : ((1 - ref1CR) + ref1CR * c1CD);
    let refExp2 = team?._skipCritScale ? exp2 : ((1 - ref2CR) + ref2CR * c2CD);
    let refExp3 = team?._skipCritScale ? exp3 : ((1 - ref3CR) + ref3CR * c3CD);

    if (mode === 'expected') {
        const expectedScale = ratioStatic + ratioFixed
            + ratio1 * (exp1 / (refExp1 || 1))
            + ratio2 * (exp2 / (refExp2 || 1))
            + ratio3 * (exp3 / (refExp3 || 1));
        return baseDps * expectedScale;
    }

    let baseHit1 = (baseDps * ratio1) / (refExp1 || 1);
    let baseHit2 = (baseDps * ratio2) / (refExp2 || 1);
    let baseHit3 = (baseDps * ratio3) / (refExp3 || 1);
    let baseHitFixed = (baseDps * ratioFixed) / (expFixed || 1);
    let staticDps = baseDps * ratioStatic; 

    let samples = new Float64Array(100);
    let hits = 25; 
    for (let i = 0; i < 100; i++) {
        let dmg = 0;
        for (let h = 0; h < hits; h++) {
            if (ratio1 > 0) dmg += baseHit1 * (Math.random() < c1CR ? c1CD : 1);
            if (ratio2 > 0) dmg += baseHit2 * (Math.random() < c2CR ? c2CD : 1);
            if (ratio3 > 0) dmg += baseHit3 * (Math.random() < c3CR ? c3CD : 1);
            if (ratioFixed > 0) dmg += baseHitFixed * (Math.random() < avgFixedCR ? fixedCD : 1);
        }
        samples[i] = (dmg / hits) + staticDps;
    }
    samples.sort();
    if (mode === 'min') return samples[5];
    if (mode === 'max') return samples[95];
    return samples[50];
}

export function getMonteCarloFloatRange(team, env, baseDps) {
    if (!baseDps || baseDps <= 0) return { minDps: 0, maxDps: 0, minPct: 0, maxPct: 0 };
    let minDps = applyMonteCarloDps(team, env, 'min', baseDps);
    let maxDps = applyMonteCarloDps(team, env, 'max', baseDps);
    return {
        minDps: parseFloat(minDps.toFixed(2)),
        maxDps: parseFloat(maxDps.toFixed(2)),
        minPct: parseFloat((((minDps - baseDps) / baseDps) * 100).toFixed(1)),
        maxPct: parseFloat((((maxDps - baseDps) / baseDps) * 100).toFixed(1))
    };
}

export function buildTableFromNodes(nodes, duration, totalDmg) {
    let dur = parseFloat(duration) || 25;
    let times = [], cumDmgs = [], nodeIndices = [];
    const hasDiscreteNodes = Boolean(nodes && nodes.length > 0);

    if (hasDiscreteNodes) {
        let sorted = nodes
            .map((n, origIdx) => ({ ...n, _origIdx: origIdx }))
            .sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
        let accDmg = 0;
        let rawTotal = 0;
        for (let i = 0; i < sorted.length; i++) {
            rawTotal += (parseFloat(sorted[i].dmg) || 0);
        }
        let scale = rawTotal > 0 ? (totalDmg / rawTotal) : 1;

        times.push(0);
        cumDmgs.push(0);
        nodeIndices.push(-1);

        for (let i = 0; i < sorted.length; i++) {
            let n = sorted[i];
            let t = parseFloat(n.time) || 0;
            accDmg += (parseFloat(n.dmg) || 0) * scale;
            if (Math.abs(t - times[times.length - 1]) < 1e-6) {
                cumDmgs[cumDmgs.length - 1] = accDmg;
                nodeIndices[nodeIndices.length - 1] = i;
            } else {
                times.push(t);
                cumDmgs.push(accDmg);
                nodeIndices.push(i);
            }
        }
        if (times[times.length - 1] < dur) {
            times.push(dur);
            cumDmgs.push(totalDmg);
            nodeIndices.push(sorted.length - 1);
        }
    } else {
        times = [0, dur];
        cumDmgs = [0, totalDmg];
        nodeIndices = [-1, 0];
    }
    return { times, cumDmgs, nodeIndices, totalDmg, duration: dur, hasDiscreteNodes };
}

// 依據查找表取得區間實際造成傷害
function getDmgDealtInTimeWindow(lookupTable, r_factor, lvlPenalty, startTimeAcc, timeDelta) {
    if (timeDelta <= 0 || !lookupTable || lookupTable.totalDmg <= 0) return 0;
    const dur = lookupTable.duration || 25;
    const totDmg = lookupTable.totalDmg;
    const times = lookupTable.times;
    const cumDmgs = lookupTable.cumDmgs;

    const evalCumDmgAt = (tAcc) => {
        const fullCycles = Math.floor(tAcc / dur);
        const phaseT = tAcc - fullCycles * dur;
        let phaseDmg = 0;
        if (times.length > 0 && phaseT >= times[times.length - 1]) {
            phaseDmg = cumDmgs[cumDmgs.length - 1];
        } else {
            for (let i = 1; i < times.length; i++) {
                if (phaseT <= times[i]) {
                    let t0 = times[i - 1], t1 = times[i];
                    let d0 = cumDmgs[i - 1], d1 = cumDmgs[i];
                    let ratio = (phaseT - t0) / Math.max(0.001, t1 - t0);
                    phaseDmg = d0 + (d1 - d0) * ratio;
                    break;
                }
            }
        }
        return fullCycles * totDmg + phaseDmg;
    };

    const rawDelta = Math.max(0, evalCumDmgAt(startTimeAcc + timeDelta) - evalCumDmgAt(startTimeAcc));
    return rawDelta * r_factor * lvlPenalty;
}

/**
 * 修正斬殺招式判定與溢傷 (Overkill) 鎖定：
 * 若傳入 lookupTable 與擊殺所需血量，直接透過二分搜尋定位「實際跨過斬殺線的招式節點」，
 * 確保大招打在殘血首領身上的超額傷害真正作為溢傷蒸發，不會在轉火後重複施放。
 */
export function getKillTriggerAction(gridData, rotDuration, timeInTable, lookupTable = null, hpToKill = 0, r_factor = 1, lvlPenalty = 1, startTimeAcc = 0) {
    if (!gridData || gridData.length === 0) {
        return { char: '未知', action: '常規收尾', skill: '普攻', timeInCycle: 0, index: 0, overkillWan: 0 };
    }
    const dur = rotDuration || 25;

    // 1. 優先使用查找表與實際擊殺血量精確鎖定「跨過斬殺門檻」的招式節點與溢傷量
    if (lookupTable && lookupTable.hasDiscreteNodes && hpToKill > 0 && lookupTable.totalDmg > 0) {
        const effFactor = Math.max(0.0001, r_factor * lvlPenalty);
        const effectiveHpToKill = hpToKill / effFactor;
        const totDmg = lookupTable.totalDmg;
        const times = lookupTable.times;
        const cumDmgs = lookupTable.cumDmgs;
        const nodeIndices = lookupTable.nodeIndices;

        let currentPhaseTime = startTimeAcc % dur;
        let currentPhaseDmg = 0;
        for (let i = 1; i < times.length; i++) {
            if (currentPhaseTime <= times[i]) {
                let t0 = times[i - 1], t1 = times[i];
                let d0 = cumDmgs[i - 1], d1 = cumDmgs[i];
                let ratio = (currentPhaseTime - t0) / Math.max(0.001, t1 - t0);
                currentPhaseDmg = d0 + (d1 - d0) * ratio;
                break;
            }
        }

        let targetTotalDmg = currentPhaseDmg + effectiveHpToKill;
        let fullRotations = Math.floor(targetTotalDmg / totDmg);
        let remDmg = targetTotalDmg - (fullRotations * totDmg);
        if (remDmg <= 1e-7 && fullRotations > 0) {
            fullRotations -= 1;
            remDmg = totDmg;
        }

        let L = 1, R = cumDmgs.length - 1;
        while (L <= R) {
            let mid = (L + R) >> 1;
            if (cumDmgs[mid] >= remDmg - 1e-7) R = mid - 1;
            else L = mid + 1;
        }
        let lutIdx = Math.min(cumDmgs.length - 1, Math.max(1, L));
        let nodeIdx = (nodeIndices && nodeIndices[lutIdx] !== undefined && nodeIndices[lutIdx] >= 0)
            ? nodeIndices[lutIdx]
            : Math.min(gridData.length - 1, lutIdx - 1);
        nodeIdx = Math.max(0, Math.min(gridData.length - 1, nodeIdx));

        const node = gridData[nodeIdx] || gridData[0];
        const overkillWan = Math.max(0, (cumDmgs[lutIdx] - remDmg) * effFactor);
        return {
            char: node.char || '未知',
            action: node.action || '收尾傷害',
            skill: node.skill || '普攻',
            timeInCycle: parseFloat((parseFloat(node.time) || times[lutIdx] || 0).toFixed(1)),
            index: nodeIdx,
            overkillWan: parseFloat(overkillWan.toFixed(2))
        };
    }

    // 2. 傳統時間點反查 fallback：若時間點落在兩招之間，取「剛跨越或抵達該時間點」的招式
    let cycleTime = timeInTable % dur;
    if (cycleTime === 0 && timeInTable > 0) cycleTime = dur;
    let closestIndex = 0;
    let foundCeiling = false;
    for (let i = 0; i < gridData.length; i++) {
        const nt = parseFloat(gridData[i].time) || 0;
        if (nt >= cycleTime - 1e-4) {
            closestIndex = i;
            foundCeiling = true;
            break;
        }
    }
    if (!foundCeiling) closestIndex = gridData.length - 1;

    const node = gridData[closestIndex];
    return {
        char: node.char || '未知',
        action: node.action || '收尾傷害',
        skill: node.skill || '普攻',
        timeInCycle: parseFloat(cycleTime.toFixed(1)),
        index: closestIndex,
        overkillWan: 0
    };
}

export function buildResidualSwitchTable(loopGrid, switchGrid, loopDur, switchDur, killCycleTime, options = null) {
    if (!loopGrid || loopGrid.length === 0) return null;
    
    let killIndex = 0;
    let killT = -1;
    for (let i = 0; i < loopGrid.length; i++) {
        const nt = parseFloat(loopGrid[i].time) || 0;
        if (nt <= killCycleTime && nt >= killT) {
            killIndex = i;
            killT = nt;
        }
    }
    
    return buildResidualByKillIndex(loopGrid, switchGrid, loopDur, switchDur, killIndex, options?.dpsScale ?? 1, options);
}

function isTuneShiftInflictingSkill(node) {
    const st = node?.skillType || node?.skill || '';
    if (st === '震諧' || st === '諧度破壞') return true;
    const tag = node?.skillMeta?.tag || '';
    return tag === 'skillXingfa' || tag === 'cloudBasic' || tag === 'heavyString' || tag === 'juque';
}

function buildResidualByKillIndex(loopGrid, switchGrid, loopDur, switchDur, killIndex, dpsScale = 1, options = null) {
    if (!loopGrid || loopGrid.length === 0) return null;
    const nextIndex = killIndex + 1;
    const totalLoopDur = parseFloat(loopDur) || 25;
    const killTime = parseFloat(loopGrid[killIndex]?.time || 0);
    const scale = (dpsScale > 0 && isFinite(dpsScale)) ? dpsScale : 1;

    // 依據完整循環節點總傷判定原始數值是否為個位數（需除以 10000 轉「萬」），避免殘留切片總傷低於門檻時誤判單位
    let fullLoopRaw = 0;
    for (let i = 0; i < loopGrid.length; i++) fullLoopRaw += (parseFloat(loopGrid[i].dmg) || 0);

    // 1. 若有明確自訂鏡像折損表 (hasSwitchRot 或手動傳入 switchGrid)，沿用自訂節點數值
    const useManualSwitch = Boolean(switchGrid && switchGrid.length > 0 && (!options?.team || options.team.hasSwitchRot));
    if (useManualSwitch) {
        if (nextIndex >= switchGrid.length) return null;

        let fullSwitchRaw = 0;
        for (let i = 0; i < switchGrid.length; i++) fullSwitchRaw += (parseFloat(switchGrid[i].dmg) || 0);
        const dmgDivisor = Math.max(fullSwitchRaw, fullLoopRaw) > 5000 ? 10000 : 1;

        const residualNodes = switchGrid.slice(nextIndex);
        const startTime = parseFloat(switchGrid[nextIndex]?.time || killTime);
        let residualTotalDmgRaw = 0;
        let origTotalRaw = 0;
        const shiftedNodes = new Array(residualNodes.length);
        for (let i = 0; i < residualNodes.length; i++) {
            const n = residualNodes[i];
            const d = parseFloat(n.dmg) || 0;
            const origD = parseFloat(loopGrid[nextIndex + i]?.dmg ?? n.baseDmg ?? d) || 0;
            residualTotalDmgRaw += d;
            origTotalRaw += origD;
            shiftedNodes[i] = {
                ...n,
                time: Math.max(0, parseFloat((parseFloat(n.time) - startTime).toFixed(2)))
            };
        }

        const totalSwitchDur = parseFloat(switchDur) || totalLoopDur;
        const residualDur = Math.max(0.5, parseFloat((totalSwitchDur - startTime).toFixed(2)));
        const totalDmgInWan = (residualTotalDmgRaw / dmgDivisor) * scale;
        const origTotalDmgWan = (origTotalRaw / dmgDivisor) * scale;
        const lossDmgWan = Math.max(0, origTotalDmgWan - totalDmgInWan);
        const lossPct = origTotalDmgWan > 0 ? (lossDmgWan / origTotalDmgWan) * 100 : 0;

        return {
            mode: 'manual',
            table: buildTableFromNodes(shiftedNodes, residualDur, totalDmgInWan),
            nodes: shiftedNodes,
            startIndex: nextIndex,
            killerIndex: killIndex,
            duration: residualDur,
            totalDmg: totalDmgInWan,
            origTotalDmgWan,
            lossDmgWan,
            lossPct,
            reasons: ['套用手動鏡像折損表']
        };
    }

    if (nextIndex >= loopGrid.length) return null;
    const dmgDivisor = fullLoopRaw > 5000 ? 10000 : 1;

    // 2. 純單元測試無環境/隊伍上下文時，保留經典 0.8x 回歸行為
    if (!options || (!options.env && !options.team)) {
        const sliceLen = loopGrid.length - nextIndex;
        const residualNodes = new Array(sliceLen);
        let residualTotalDmgRaw = 0;
        let origTotalRaw = 0;
        for (let i = 0; i < sliceLen; i++) {
            const n = loopGrid[nextIndex + i];
            const origD = parseFloat(n.dmg) || 0;
            const d = Math.round(origD * 0.8);
            origTotalRaw += origD;
            residualTotalDmgRaw += d;
            residualNodes[i] = {
                ...n,
                time: Math.max(0, parseFloat((parseFloat(n.time) - killTime).toFixed(2))),
                dmg: d
            };
        }

        const residualDur = Math.max(0.5, parseFloat((totalLoopDur - killTime).toFixed(2)));
        const totalDmgInWan = (residualTotalDmgRaw / dmgDivisor) * scale;
        const origTotalDmgWan = (origTotalRaw / dmgDivisor) * scale;
        return {
            mode: 'legacy_0.8',
            table: buildTableFromNodes(residualNodes, residualDur, totalDmgInWan),
            nodes: residualNodes,
            startIndex: nextIndex,
            killerIndex: killIndex,
            duration: residualDur,
            totalDmg: totalDmgInWan,
            origTotalDmgWan,
            lossDmgWan: Math.max(0, origTotalDmgWan - totalDmgInWan),
            lossPct: 20,
            reasons: ['預設 80% 殘軸估算']
        };
    }

    // 3. 自動動態計算轉火後狀況 (Auto Post-Switch Calculation)
    const team = options.team || {};
    const env = options.env || {};
    const transTime = env.transTime !== undefined ? Math.max(0, parseFloat(env.transTime) || 0) : 1.5;
    const chainDepth = Math.max(1, Number(options.chainDepth || 1));
    const cumTransLost = chainDepth * transTime;
    const envRes = env.bossRes !== undefined && !isNaN(parseFloat(env.bossRes))
        ? parseFloat(env.bossRes)
        : (env.enemyResPct !== undefined && !isNaN(parseFloat(env.enemyResPct)) ? parseFloat(env.enemyResPct) / 100 : 0.10);
    const baseMatrixCtx = buildTeamMatrixContext(team, env);
    const buffId = (options.appliedBuffId && options.appliedBuffId !== 'none')
        ? options.appliedBuffId
        : ((env.matrixBuffId && env.matrixBuffId !== 'none') ? getRotationMatrixMultiplier(team, env, env.matrixBuffId).buffId : null);

    let targetTuneShiftReapplied = false;
    let targetAnomalyReapplied = false;
    let targetDefShredReapplied = false;
    const mainBuffStartT = Math.min(killTime, Math.max(2.0, totalLoopDur * 0.25));
    const outroWindowEnd = mainBuffStartT + 14.5;

    const sliceLen = loopGrid.length - nextIndex;
    const residualNodes = new Array(sliceLen);
    let residualTotalDmgRaw = 0;
    let origTotalRaw = 0;

    let hadExpiredOutro = false;
    let hadTargetDebuffLoss = false;
    let hadMatrixReset = false;

    for (let i = 0; i < sliceLen; i++) {
        const n = loopGrid[nextIndex + i];
        const nTime = parseFloat(n.time) || 0;
        const origD = parseFloat(n.dmg) || 0;
        origTotalRaw += origD;

        const isMainCarry = !n.char || n.char === team.c1 || getBase(n.char) === getBase(team.c1);
        const st = n.skillType || n.skill || '普攻';
        const shiftedTime = Math.max(0, parseFloat((nTime - killTime).toFixed(2)));
        const effectiveClock = nTime + cumTransLost;

        if (!targetTuneShiftReapplied && isTuneShiftInflictingSkill(n)) {
            targetTuneShiftReapplied = true;
        }
        if (!targetAnomalyReapplied && (st === '效應' || (!isMainCarry && baseMatrixCtx.teamHasAnomaly))) {
            targetAnomalyReapplied = true;
        }
        if (!targetDefShredReapplied && (!isMainCarry || Number(n.skillMeta?.extraDefShredPct || 0) > 0)) {
            targetDefShredReapplied = true;
        }

        let afterDmg = origD;
        if (n.skillMeta && Number(n.skillMeta.mvPct) > 0) {
            const charName = n.char || team.c1;
            const baseName = getBase(charName);
            const lo = getEffectiveCharLoadout(charName, env);
            const baseSlot = lo.slot || getDefaultSlotConfig(baseName, 0, lo.roverAttr);

            const nodeOutroEnd = Number(n.buffCoverage?.outroWindowEnd || outroWindowEnd);
            const nodeUltEnd = Number(n.buffCoverage?.ultWindowEnd || 30);
            const buffExpired = effectiveClock > nodeOutroEnd;
            const ultExpired = effectiveClock > nodeUltEnd;
            if (buffExpired && isMainCarry) hadExpiredOutro = true;

            const effStats = computeCharEffectiveStats(baseName, baseSlot, {
                roverAttr: lo.roverAttr,
                triggerPassives: buffExpired && !targetTuneShiftReapplied ? false : (baseSlot.triggerPassives !== false)
            });

            const snap = n.sharedSnapshot || (() => {
                const sh = getTeammateSharedBuffs(charName, team, env);
                const isEcho = st === '聲骸' || st === '聲骸技能';
                const tAmp = st === '普攻' ? (sh.active.teamBasicAmpPct || 0)
                    : (st === '重擊' ? (sh.active.teamHeavyAmpPct || 0)
                    : (st === '共技' ? (sh.active.teamSkillAmpPct || 0)
                    : (st === '共解' ? (sh.active.teamLibAmpPct || 0)
                    : (isEcho ? (sh.active.teamEchoAmpPct || 0) : 0))));
                return {
                    teamAtkPct: sh.active.teamAtkPct || 0,
                    teamDmgBonusPct: (sh.active.teamElemDmgPct || 0) + getSharedSkillTypeDmgPct(sh.active, st),
                    teamAmplifyPct: (sh.active.teamAmplifyPct || 0) + (sh.active.teamElemAmpPct || 0) + tAmp,
                    teamCritRate: (sh.active.teamCritRate || 0) + (isEcho ? (sh.active.teamEchoCritRate || 0) : 0),
                    teamCritDmg: (sh.active.teamCritDmg || 0) + (isEcho ? (sh.active.teamEchoCritDmg || 0) : 0),
                    teamIgnoreDefPct: sh.active.teamIgnoreDefPct || 0,
                    teamResShredPct: sh.active.teamResShredPct || 0
                };
            })();

            const extAmplify = Number(n.skillMeta.extraAmplifyPct || 0) + (buffExpired ? 0 : snap.teamAmplifyPct);
            const extAtk = Number(n.skillMeta.extraAtkPct || 0) + (buffExpired ? Math.round(snap.teamAtkPct * 0.5) : snap.teamAtkPct);
            const extDmg = Number(n.skillMeta.extraDmgBonusPct || 0) + (buffExpired ? Math.round(snap.teamDmgBonusPct * 0.5) : snap.teamDmgBonusPct);
            const extCr = Number(n.skillMeta.extraCritRate || 0) + (ultExpired ? 0 : snap.teamCritRate);
            const extCd = Number(n.skillMeta.extraCritDmg || 0) + (ultExpired ? 0 : snap.teamCritDmg);

            const rawDefShred = Number(n.skillMeta.extraDefShredPct || 0);
            const extDefShred = targetDefShredReapplied ? rawDefShred : 0;
            const rawResShred = Number(n.skillMeta.extraResShredPct || 0) + snap.teamResShredPct;
            const extResShred = targetDefShredReapplied ? rawResShred : Number(n.skillMeta.extraResShredPct || 0);
            if ((rawDefShred > 0 && extDefShred === 0) || (snap.teamResShredPct > 0 && !targetDefShredReapplied)) hadTargetDebuffLoss = true;

            const postCtx = {
                ...baseMatrixCtx,
                teamHasAnomaly: baseMatrixCtx.teamHasAnomaly && targetAnomalyReapplied,
                teamHasTuneShift: baseMatrixCtx.teamHasTuneShift && targetTuneShiftReapplied
            };
            if ((baseMatrixCtx.teamHasAnomaly && !targetAnomalyReapplied) || (baseMatrixCtx.teamHasTuneShift && !targetTuneShiftReapplied)) {
                hadMatrixReset = true;
            }

            const hits = Number(n.skillMeta.hits || 1);
            const calc = calcRealSkillDamage({
                charName: baseName,
                stats: effStats,
                skill: n.skillMeta,
                enemyLv: Number(env.enemyLv || 100),
                charLv: 90,
                enemyRes: envRes,
                extraAtkPct: extAtk,
                extraDmgBonusPct: extDmg,
                extraAmplifyPct: extAmplify,
                extraCritRate: extCr,
                extraCritDmg: extCd,
                extraIgnoreDefPct: Number(n.skillMeta.extraIgnoreDefPct || 0) + snap.teamIgnoreDefPct,
                extraDefShredPct: extDefShred,
                extraResShredPct: extResShred,
                matrixBuffId: buffId && buffId !== 'none' ? buffId : null,
                matrixContext: postCtx,
                critMode: 'expected'
            });
            afterDmg = Math.round(calc.rawDamage * hits);
        } else {
            let retention = 1.0;
            if (!targetTuneShiftReapplied && (buffId === 'buff_41' || buffId === 'buff_36' || buffId === 'buff_39' || buffId === 'buff_34')) {
                retention *= 0.84;
                hadMatrixReset = true;
            } else if (!targetDefShredReapplied && shiftedTime <= 2.5) {
                retention *= 0.90;
                hadTargetDebuffLoss = true;
            }
            if (isMainCarry && effectiveClock > outroWindowEnd) {
                const overSec = Math.min(8, effectiveClock - outroWindowEnd);
                const outroDrop = 0.72 + 0.08 * Math.max(0, 1 - overSec / 6);
                retention *= outroDrop;
                hadExpiredOutro = true;
            } else if (!isMainCarry) {
                retention *= 0.92;
            } else if (cumTransLost > 0) {
                retention *= Math.max(0.86, 1 - (cumTransLost / Math.max(12, totalLoopDur)) * 0.35);
            }
            afterDmg = Math.round(origD * retention);
        }

        residualTotalDmgRaw += afterDmg;
        residualNodes[i] = {
            ...n,
            time: shiftedTime,
            baseDmg: origD,
            dmg: afterDmg
        };
    }

    const residualDur = Math.max(0.5, parseFloat((totalLoopDur - killTime).toFixed(2)));
    const totalDmgInWan = (residualTotalDmgRaw / dmgDivisor) * scale;
    const origTotalDmgWan = (origTotalRaw / dmgDivisor) * scale;
    const lossDmgWan = Math.max(0, origTotalDmgWan - totalDmgInWan);
    const lossPct = origTotalDmgWan > 0 ? (lossDmgWan / origTotalDmgWan) * 100 : 0;

    const reasons = [];
    if (cumTransLost > 0) reasons.push(`轉場耗時累計 ${cumTransLost.toFixed(1)}s`);
    if (hadMatrixReset || hadTargetDebuffLoss) reasons.push('新目標減防/偏移·異常重建');
    if (hadExpiredOutro) reasons.push('延奏/15s套裝窗格超時衰減');
    if (reasons.length === 0) reasons.push('實戰公式自動推演（低損接駁）');

    return {
        mode: 'auto',
        table: buildTableFromNodes(residualNodes, residualDur, totalDmgInWan),
        nodes: residualNodes,
        startIndex: nextIndex,
        killerIndex: killIndex,
        duration: residualDur,
        totalDmg: totalDmgInWan,
        origTotalDmgWan,
        lossDmgWan,
        lossPct: Number(lossPct.toFixed(1)),
        chainDepth,
        reasons
    };
}

function getCachedResidualTable(team, killIndex, dpsScale = 1, env = null, chainDepth = 1, sourcePhase = 'loop') {
    const srcGrid = sourcePhase === 'opener' ? (team.firstGridData || []) : (team.gridData || []);
    const srcDur = sourcePhase === 'opener' ? (team.firstDuration || team.duration) : team.duration;
    if (!srcGrid || srcGrid.length === 0) return null;
    if (!team._residualCache) {
        team._residualCache = new Map();
    }
    const transT = env?.transTime ?? 1.5;
    const buffId = env?.matrixBuffId || team.appliedMatrixBuff?.buffId || 'none';
    const cacheKey = `${sourcePhase}_${killIndex}_${dpsScale.toFixed(4)}_${chainDepth}_${transT}_${buffId}`;
    if (team._residualCache.has(cacheKey)) {
        return team._residualCache.get(cacheKey);
    }
    const res = buildResidualByKillIndex(
        srcGrid,
        sourcePhase === 'loop' ? team.switchGridData : null,
        srcDur,
        team.switchDuration,
        killIndex,
        dpsScale,
        { team, env: env || {}, chainDepth, appliedBuffId: team.appliedMatrixBuff?.buffId }
    );
    team._residualCache.set(cacheKey, res);
    return res;
}

export function previewSwitchAtNode(rotObj, env = {}, killIndex = 0, chainDepth = 1) {
    if (!rotObj || !Array.isArray(rotObj.gridData) || killIndex >= rotObj.gridData.length - 1) return null;
    const resolved = resolveTeamEffectiveInputs(rotObj, env);
    const effTeam = {
        ...rotObj,
        gridData: resolved.gridData,
        firstGridData: resolved.firstGridData,
        baseCritRates: resolved.baseCritRates,
        appliedMatrixBuff: resolved.appliedMatrixBuff
    };
    const res = buildResidualByKillIndex(
        effTeam.gridData,
        effTeam.switchGridData,
        effTeam.duration,
        effTeam.switchDuration,
        killIndex,
        1,
        { team: effTeam, env: env || {}, chainDepth, appliedBuffId: resolved.appliedMatrixBuff?.buffId }
    );
    if (!res) return null;
    const killerNode = effTeam.gridData[killIndex] || {};
    return {
        killIndex,
        killTime: parseFloat(killerNode.time) || 0,
        killerChar: killerNode.char || effTeam.c1,
        killerAction: killerNode.action || '斬殺',
        mode: res.mode,
        remainingNodes: res.nodes.length,
        remainingDur: res.duration,
        origTotalDmgWan: Number((res.origTotalDmgWan || 0).toFixed(2)),
        afterSwitchDmgWan: Number((res.totalDmg || 0).toFixed(2)),
        afterSwitchDpsWan: Number((res.totalDmg / Math.max(0.5, res.duration)).toFixed(2)),
        lossDmgWan: Number((res.lossDmgWan || 0).toFixed(2)),
        lossPct: res.lossPct,
        reasons: res.reasons,
        nodes: res.nodes
    };
}

export function previewAllSwitchPoints(rotObj, env = {}) {
    if (!rotObj || !Array.isArray(rotObj.gridData) || rotObj.gridData.length < 2) return [];
    const results = [];
    for (let k = 0; k < rotObj.gridData.length - 1; k++) {
        const item = previewSwitchAtNode(rotObj, env, k, 1);
        if (item) results.push(item);
    }
    return results;
}

export function buildNextRotationModel(team, killerInfo) {
    const rawNodes = team.gridData || [];
    const dur = parseFloat(team.duration) || 25;
    
    const nextNodes = rawNodes.map((node, idx) => {
        const isFirst = idx === 0;
        return {
            nodeIndex: idx,
            time: parseFloat(node.time) || 0,
            char: node.char || team.c1,
            skill: isFirst ? '變奏' : (node.skill || '普攻'),
            action: isFirst ? `${node.action || '進場攻擊'} (轉火變奏入場)` : node.action,
            dmg: parseFloat(node.dmg) || 0,
            isIntroTriggered: isFirst
        };
    });

    return {
        cycleType: '次輪常規循環',
        duration: dur,
        killerTrigger: killerInfo,
        gridData: nextNodes
    };
}

export function getTtkFromLookupTable(hp, lookupTable, r_factor, lvlPenalty, timeOnFieldAcc = 0) {
    if (hp <= 0) return 0;
    let effectiveHpToKill = hp / Math.max(0.0001, (r_factor * lvlPenalty));
    let dur = lookupTable.duration;
    let totDmg = lookupTable.totalDmg;
    if (totDmg <= 0) return 9999;

    let currentPhaseTime = timeOnFieldAcc % dur;
    let currentPhaseDmg = 0;
    const times = lookupTable.times;
    const cumDmgs = lookupTable.cumDmgs;

    for (let i = 1; i < times.length; i++) {
        if (currentPhaseTime <= times[i]) {
            let t0 = times[i-1], t1 = times[i];
            let d0 = cumDmgs[i-1], d1 = cumDmgs[i];
            let ratio = (currentPhaseTime - t0) / Math.max(0.001, t1 - t0);
            currentPhaseDmg = d0 + (d1 - d0) * ratio;
            break;
        }
    }

    let targetTotalDmg = currentPhaseDmg + effectiveHpToKill;
    let fullRotations = Math.floor(targetTotalDmg / totDmg);
    let remDmg = targetTotalDmg - (fullRotations * totDmg);
    if (remDmg <= 1e-7 && fullRotations > 0) {
        fullRotations -= 1;
        remDmg = totDmg;
    }
    
    let exactRemTime = 0;
    let L = 0, R = cumDmgs.length - 1;
    while (L <= R) {
        let mid = (L + R) >> 1;
        if (cumDmgs[mid] >= remDmg - 1e-7) R = mid - 1;
        else L = mid + 1;
    }
    
    let idx = L;
    // 若該查找表含有真實離散招式節點，擊殺時間點對齊至該招式實際出手時間 times[idx]，使超額傷害成為真實溢傷
    if (lookupTable.hasDiscreteNodes && idx > 0 && idx < times.length) {
        exactRemTime = times[idx];
    } else if (idx > 0 && idx < cumDmgs.length) {
        let d0 = cumDmgs[idx - 1], d1 = cumDmgs[idx];
        let t0 = times[idx - 1], t1 = times[idx];
        let ratio = (remDmg - d0) / Math.max(0.001, d1 - d0);
        exactRemTime = t0 + (t1 - t0) * ratio;
    } else if (idx >= cumDmgs.length) {
        exactRemTime = times[times.length - 1];
    } else {
        exactRemTime = times[0];
    }

    return Math.max(0, (fullRotations * dur) + exactRemTime - currentPhaseTime);
}

export function calcScoreBetweenStates(env, startR, startIdx, startHp, endR, endIdx, endHpAbs) {
    let score = 0;
    let currR = startR, currIdx = startIdx, currHp = startHp;

    while (currR < endR || (currR === endR && currIdx < endIdx)) {
        let effRatio = getBossEffectiveRatio(currR, currIdx, env);
        score += (currHp * effRatio) + getBossKillBonus(currIdx, env);
        currIdx++;
        if (currIdx > 5) { currR++; currIdx = 1; }
        currHp = getBossMaxHP(currR, currIdx);
        if (currR > 8) break;
    }
    if (currR === endR && currIdx === endIdx) {
        let hpDealt = currHp - endHpAbs;
        if (hpDealt > 0) {
            let effRatio = getBossEffectiveRatio(currR, currIdx, env);
            score += (hpDealt * effRatio);
            if (endHpAbs <= 0.0001) score += getBossKillBonus(currIdx, env);
        }
    }
    return score;
}

function reverseCalculateDPS(targetScore, env, teamAttr, charName, startState) {
    let p = getEnvParams(env);
    if (!targetScore || targetScore <= 0) return { dps: 0, endState: startState };
    
    let tmp_r = startState ? startState.r : 1;
    let tmp_idx = startState ? startState.idx : 1;
    let currentHp = startState ? startState.hp : getBossMaxHP(1, 1);
    let remainingScore = targetScore, activeTimeSum = 0, kills = 0;

    while (remainingScore > 0 && kills < 50 && tmp_r <= 8) {
        let effRatio = getBossEffectiveRatio(tmp_r, tmp_idx, env);
        let killBonus = getBossKillBonus(tmp_idx, env);
        let bossHpScore = currentHp * effRatio;
        let bossTotalClearScore = bossHpScore + killBonus;

        let lvlPenalty = (tmp_r === 1) ? 1.0 : (tmp_r === 2 ? p.pen110 : p.pen120);
        let r_factor = getCombatMultiplier(env, teamAttr, charName, tmp_idx);
        if (tmp_idx === 5) r_factor = 1.0;
        let effectiveMultiplier = r_factor * lvlPenalty;

        if (remainingScore >= bossTotalClearScore) {
            activeTimeSum += currentHp / effectiveMultiplier;
            remainingScore -= bossTotalClearScore; 
            kills++; tmp_idx++; 
            if (tmp_idx > 5) { tmp_r++; tmp_idx = 1; }
            currentHp = getBossMaxHP(tmp_r, tmp_idx);
        } else if (remainingScore >= bossHpScore) {
            activeTimeSum += currentHp / effectiveMultiplier;
            remainingScore = 0;
            kills++; tmp_idx++;
            if (tmp_idx > 5) { tmp_r++; tmp_idx = 1; }
            currentHp = getBossMaxHP(tmp_r, tmp_idx);
        } else {
            let partialHp = remainingScore / effRatio;
            activeTimeSum += partialHp / effectiveMultiplier;
            currentHp -= partialHp; 
            remainingScore = 0;
        }
    }

    let actualAvailableTime = Math.max(0.5, p.bTime - p.eTime - (kills * p.tTime));
    return { dps: (activeTimeSum / actualAvailableTime), endState: { r: tmp_r, idx: tmp_idx, hp: currentHp } };
}

export function getFeixueGuiRenProfile(team, env = {}) {
    const members = [team?.c1, team?.c2, team?.c3].filter(Boolean).map(getBase);
    if (!members.includes('緋雪')) return null;
    const lo = getEffectiveCharLoadout('緋雪', env);
    const slotCfg = lo.slot || getDefaultSlotConfig('緋雪', 0, lo.roverAttr);
    const rc = Number(slotCfg?.rc ?? 0);
    const stats = lo.stats || computeCharEffectiveStats('緋雪', slotCfg);
    const maxCharges = rc >= 2 ? 3 : 1;
    const guiRenSk = (ROLE_SKILLS_DB['緋雪'] || []).find(s => s.name && s.name.includes('預求我身·歸刃'))
        || { id: 'feixue_guiren', name: '預求我身·歸刃基礎傷害', skillType: '共解', mvPct: 1200, statType: 'atk', element: '冷凝' };
    const buffId = (team?.appliedMatrixBuff?.buffId && team.appliedMatrixBuff.buffId !== 'none')
        ? team.appliedMatrixBuff.buffId
        : (env?.matrixBuffId && env.matrixBuffId !== 'none' ? env.matrixBuffId : null);
    const envRes = env?.bossRes !== undefined ? parseFloat(env.bossRes) : (env?.enemyResPct !== undefined ? parseFloat(env.enemyResPct) / 100 : 0.10);
    const dmgRes = calcRealSkillDamage({
        charName: '緋雪',
        stats,
        skill: guiRenSk,
        rc,
        enemyLv: Number(env?.enemyLv || 100),
        charLv: 90,
        enemyRes: isNaN(envRes) ? 0.10 : envRes,
        matrixBuffId: buffId,
        matrixContext: buildTeamMatrixContext(team, env)
    });
    return {
        maxCharges,
        burstWan: Math.max(10, (dmgRes.rawDamage || 0) / 10000),
        rc
    };
}

export function shouldSpendFeixueGuiRen({ charges, r, idx, hp, maxHp, rFactor, tLeft, estDps }) {
    if (!charges || charges <= 0 || hp <= 0) return false;
    if (rFactor < 0.9) return tLeft <= 15 && hp > estDps * 2;
    if (idx === 5 && hp >= maxHp * 0.25) return true;
    if (hp >= maxHp * 0.50 && (r >= 2 || hp >= 500)) return true;
    if (tLeft <= 22 && hp > estDps * 2.5) return true;
    return false;
}

function evaluateAddingTeamToState(state, team, env) {
    let p = getEnvParams(env);
    const effTeam = {
        ...team,
        gridData: team.effGridData || team.gridData || [],
        firstGridData: team.effFirstGridData || team.firstGridData || null
    };
    let tmp_r = state.r, tmp_idx = state.idx, tmp_hp = state.hp;
    let t_left = p.bTime; 
    let scoreGained = 0;
    let timeSpent = 0;

    if (t_left >= p.eTime) { t_left -= p.eTime; timeSpent += p.eTime; }
    else { timeSpent += t_left; t_left = 0; }

    let currentPhase = (team.firstDuration && team.firstDuration > 0) ? 'opener' : 'loop';
    let residualSourcePhase = 'loop';
    let residualOrigStartIdx = 0;
    let chainDepth = 0;
    let activeLut = currentPhase === 'opener' ? team.openerLut : team.loopLut;
    let activeGrid = currentPhase === 'opener' ? (effTeam.firstGridData || effTeam.gridData || []) : effTeam.gridData;
    let tableTimeAcc = 0;
    let loopGuard = 0;
    const baseDpsRef = parseFloat(team.rawDps || team.dps) || 0;
    const effLoopDps = parseFloat(team.calculatedMinDps || baseDpsRef) || 0;
    const dpsScale = (baseDpsRef > 0 && effLoopDps > 0 && !team._skipCritScale) ? (effLoopDps / baseDpsRef) : 1;
    const feixueProf = getFeixueGuiRenProfile(team, env);
    let guiRenCharges = feixueProf ? feixueProf.maxCharges : 0;
    const spentWaves = new Set();

    while (t_left > 0 && loopGuard < 50) {
        loopGuard++;
        let lvlPenalty = (tmp_r === 1) ? 1.0 : (tmp_r === 2 ? p.pen110 : p.pen120);
        let r_factor = getCombatMultiplier(env, team.teamAttr, team.c1, tmp_idx, effTeam); 
        if (tmp_idx === 5) r_factor = 1.0;
        let effRatio = getBossEffectiveRatio(tmp_r, tmp_idx, env);
        const waveKey = `R${tmp_r}-${tmp_idx}`;
        if (feixueProf && guiRenCharges > 0 && !spentWaves.has(waveKey)) {
            const maxHp = getBossMaxHP(tmp_r, tmp_idx);
            if (shouldSpendFeixueGuiRen({ charges: guiRenCharges, r: tmp_r, idx: tmp_idx, hp: tmp_hp, maxHp, rFactor: r_factor, tLeft: t_left, estDps: effLoopDps })) {
                spentWaves.add(waveKey);
                guiRenCharges--;
                const burstDealt = Math.min(tmp_hp, feixueProf.burstWan * r_factor * lvlPenalty);
                tmp_hp -= burstDealt;
                scoreGained += burstDealt * effRatio;
                if (tmp_hp <= 1e-6) {
                    scoreGained += getBossKillBonus(tmp_idx, env);
                    tmp_hp = 0;
                    let actualTrans = Math.min(t_left, p.tTime);
                    t_left -= actualTrans;
                    timeSpent += actualTrans;
                    tmp_idx++; if (tmp_idx > 5) { tmp_r++; tmp_idx = 1; }
                    tmp_hp = getBossMaxHP(tmp_r, tmp_idx);
                    continue;
                }
            }
        }

        if (currentPhase === 'opener' || currentPhase === 'switch_residual') {
            const remPhaseTime = Math.max(0, activeLut.duration - tableTimeAcc);
            if (remPhaseTime <= 1e-6) {
                currentPhase = 'loop';
                residualSourcePhase = 'loop';
                residualOrigStartIdx = 0;
                chainDepth = 0;
                activeLut = team.loopLut;
                activeGrid = effTeam.gridData || [];
                tableTimeAcc = 0;
                continue;
            }
            const remPhaseDmg = getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, remPhaseTime);
            if (tmp_hp > remPhaseDmg) {
                if (t_left >= remPhaseTime) {
                    const dmgDealt = Math.min(tmp_hp * 0.999, remPhaseDmg);
                    tmp_hp -= dmgDealt;
                    scoreGained += (dmgDealt * effRatio);
                    t_left -= remPhaseTime;
                    timeSpent += remPhaseTime;

                    currentPhase = 'loop';
                    residualSourcePhase = 'loop';
                    residualOrigStartIdx = 0;
                    chainDepth = 0;
                    activeLut = team.loopLut;
                    activeGrid = effTeam.gridData || [];
                    tableTimeAcc = 0;
                    continue;
                } else {
                    const dmgDealt = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, t_left));
                    scoreGained += (dmgDealt * effRatio);
                    tmp_hp -= dmgDealt;
                    timeSpent += t_left;
                    t_left = 0;
                    break;
                }
            }
        }
        
        let ttk = getTtkFromLookupTable(tmp_hp, activeLut, r_factor, lvlPenalty, tableTimeAcc);

        if (ttk <= t_left) {
            const preKillTimeAcc = tableTimeAcc;
            const hpBeforeKill = tmp_hp;
            scoreGained += (tmp_hp * effRatio) + getBossKillBonus(tmp_idx, env);
            tableTimeAcc += ttk;
            t_left -= ttk;
            timeSpent += ttk;
            tmp_hp = 0;

            let actualTrans = Math.min(t_left, p.tTime);
            t_left -= actualTrans;
            timeSpent += actualTrans;
            tmp_idx++; if (tmp_idx > 5) { tmp_r++; tmp_idx = 1; }
            tmp_hp = getBossMaxHP(tmp_r, tmp_idx);

            const killer = getKillTriggerAction(
                activeGrid,
                activeLut.duration,
                tableTimeAcc,
                activeLut,
                hpBeforeKill,
                r_factor,
                lvlPenalty,
                preKillTimeAcc
            );

            if (currentPhase === 'opener') {
                const residual = (tableTimeAcc < activeLut.duration - 1e-6)
                    ? getCachedResidualTable(effTeam, killer.index, dpsScale, env, 1, 'opener')
                    : null;
                if (residual && residual.duration > 0) {
                    currentPhase = 'switch_residual';
                    residualSourcePhase = 'opener';
                    residualOrigStartIdx = residual.startIndex;
                    chainDepth = 1;
                    activeLut = residual.table;
                    activeGrid = residual.nodes;
                    tableTimeAcc = 0;
                } else if (tableTimeAcc >= activeLut.duration - 1e-6) {
                    currentPhase = 'loop';
                    residualSourcePhase = 'loop';
                    residualOrigStartIdx = 0;
                    chainDepth = 0;
                    activeLut = team.loopLut;
                    activeGrid = effTeam.gridData || [];
                    tableTimeAcc = 0;
                }
            } else if (currentPhase === 'loop') {
                chainDepth = 1;
                const residual = getCachedResidualTable(effTeam, killer.index, dpsScale, env, chainDepth, 'loop');
                if (residual && residual.duration > 0) {
                    currentPhase = 'switch_residual';
                    residualSourcePhase = 'loop';
                    residualOrigStartIdx = residual.startIndex;
                    activeLut = residual.table;
                    activeGrid = residual.nodes;
                    tableTimeAcc = 0;
                } else {
                    currentPhase = 'loop';
                    chainDepth = 0;
                    residualOrigStartIdx = 0;
                    activeLut = team.loopLut;
                    activeGrid = effTeam.gridData || [];
                    tableTimeAcc = 0;
                }
            } else if (currentPhase === 'switch_residual') {
                const globalKillIdx = residualOrigStartIdx + killer.index;
                chainDepth += 1;
                const residual = getCachedResidualTable(effTeam, globalKillIdx, dpsScale, env, chainDepth, residualSourcePhase);
                if (residual && residual.duration > 0) {
                    currentPhase = 'switch_residual';
                    residualOrigStartIdx = residual.startIndex;
                    activeLut = residual.table;
                    activeGrid = residual.nodes;
                    tableTimeAcc = 0;
                } else {
                    currentPhase = 'loop';
                    residualSourcePhase = 'loop';
                    residualOrigStartIdx = 0;
                    chainDepth = 0;
                    activeLut = team.loopLut;
                    activeGrid = effTeam.gridData || [];
                    tableTimeAcc = 0;
                }
            }
        } else {
            let remTableTime = activeLut.duration - (tableTimeAcc % activeLut.duration);
            if ((currentPhase === 'switch_residual' || currentPhase === 'opener') && t_left >= remTableTime) {
                let dmgDealt = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, remTableTime));
                tmp_hp -= dmgDealt;
                scoreGained += (dmgDealt * effRatio);
                t_left -= remTableTime;
                timeSpent += remTableTime;

                currentPhase = 'loop';
                residualSourcePhase = 'loop';
                residualOrigStartIdx = 0;
                chainDepth = 0;
                activeLut = team.loopLut;
                activeGrid = effTeam.gridData || [];
                tableTimeAcc = 0;
            } else {
                let dmgDealt = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, t_left));
                scoreGained += (dmgDealt * effRatio);
                tmp_hp -= dmgDealt;
                timeSpent += t_left;
                t_left = 0;
            }
        }
    }

    let newCharUses = new Uint8Array(state.charUses);
    if (team.c1_id !== -1) newCharUses[team.c1_id]++;
    if (team.c2_id !== -1) newCharUses[team.c2_id]++;
    if (team.c3_id !== -1) newCharUses[team.c3_id]++;

    const sigId = team.rotId || team.id || `${team.c1}_${team.c2}_${team.c3}`;
    return {
        score: state.score + scoreGained, r: tmp_r, idx: tmp_idx, hp: tmp_hp,
        timeUsed: state.timeUsed + timeSpent, seq: [...state.seq, team], charUses: newCharUses,
        sig: state.sig ? `${state.sig}|${sigId}` : sigId
    };
}

export function simulateAndGenerateReport(seqInput, env, mode = 'min', initialState = null) {
    let p = getEnvParams(env);
    let testScore = 0;
    let tmp_r = initialState?.r ?? 1;
    let tmp_idx = initialState?.idx ?? 1;
    let tmp_hp = initialState?.hp ?? getBossMaxHP(tmp_r, tmp_idx);
    let globalTrace = [], currentGlobalTime = 0;
    
    let seq = seqInput.map(team => ({
        ...team,
        _residualCache: team._residualCache instanceof Map ? team._residualCache : new Map()
    }));
    globalTrace.push({ 
        globalTime: 0, currentScore: 0, teamC1: seq[0] ? seq[0].c1 : '等待', 
        currentBoss: `R${tmp_r}-${tmp_idx}`, bossHpPct: (tmp_hp / getBossMaxHP(tmp_r, tmp_idx)) * 100, teamStartTime: 0, rotDuration: 25, 
        rotId: seq[0] ? seq[0].rotId : '', cycle: 1, 
        phase: 'opener', phaseName: '啟動軸', isSpecialWait: false 
    });
    
    seq.forEach(team => { 
        team.report = ""; team.trace = []; team.teamScore = 0; 
        team.transitionEvents = [];
        team.rotationStateSummary = null;
    });

    const TICK_RATE = 0.5;

    for (let j = 0; j < seq.length; j++) {
        let team = seq[j];
        let t_left = p.bTime;
        let teamStartTime = currentGlobalTime;
        let reports = [];

        const resolved = resolveTeamEffectiveInputs(team, env);
        const effTeam = {
            ...team,
            gridData: resolved.gridData,
            firstGridData: resolved.firstGridData,
            baseCritRates: resolved.baseCritRates,
            _residualCache: team._residualCache
        };
        team.appliedMatrixBuff = resolved.appliedMatrixBuff;
        team.appliedDualModes = resolved.appliedDualModes;

        let openerBaseDps = resolved.openerBaseDps;
        let loopBaseDps = resolved.loopBaseDps;
        let openerDps = applyMonteCarloDps(effTeam, env, mode, openerBaseDps);
        let loopDps = applyMonteCarloDps(effTeam, env, mode, loopBaseDps);
        const rawLoopBase = parseFloat(team.rawDps || team.dps) || 0;
        const dpsScale = (rawLoopBase > 0 && loopDps > 0 && !team._skipCritScale) ? (loopDps / rawLoopBase) : 1;

        const openerDur = parseFloat(team.firstDuration || team.duration) || 28;
        const loopDur = parseFloat(team.duration) || 25;
        let openerLut = buildTableFromNodes(effTeam.firstGridData || effTeam.gridData, openerDur, openerDps * openerDur);
        let loopLut = buildTableFromNodes(effTeam.gridData, loopDur, loopDps * loopDur);

        let currentPhase = (team.firstDuration && team.firstDuration > 0) ? 'opener' : 'loop';
        let residualSourcePhase = 'loop';
        let residualOrigStartIdx = 0;
        let chainDepth = 0;
        let activeLut = currentPhase === 'opener' ? openerLut : loopLut;
        let activeGrid = currentPhase === 'opener' ? (effTeam.firstGridData || effTeam.gridData || []) : (effTeam.gridData || []);
        let tableTimeAcc = 0;
        let phaseFlow = [currentPhase === 'opener' ? '啟動軸' : '循環軸'];
        
        if (t_left <= 0) { team.duration = 0; team.score = 0; continue; }

        let startHpPct = (tmp_hp / getBossMaxHP(tmp_r, tmp_idx)) * 100;
        
        if (t_left >= p.eTime) {
            for (let stepT = TICK_RATE; stepT <= p.eTime; stepT += TICK_RATE) {
                globalTrace.push({ 
                    globalTime: currentGlobalTime + stepT, currentScore: testScore, teamC1: team.c1, 
                    currentBoss: `R${tmp_r}-${tmp_idx}`, bossHpPct: startHpPct, teamStartTime, 
                    rotDuration: activeLut.duration, rotId: team.rotId, cycle: 1, 
                    phase: currentPhase, phaseName: currentPhase === 'opener' ? '啟動軸' : (currentPhase === 'switch_residual' ? '轉火低Buff' : '循環軸'),
                    isSpecialWait: false 
                });
            }
            t_left -= p.eTime; currentGlobalTime += p.eTime;
        }

        let loopGuard = 0;
        let pColor = mode === 'max' ? '#fbbf24' : '#10b981';
        const feixueProf = getFeixueGuiRenProfile(team, env);
        let guiRenCharges = feixueProf ? feixueProf.maxCharges : 0;
        const spentWaves = new Set();

        while (t_left > 0 && loopGuard < 50) {
            loopGuard++;
            let lvlPenalty = (tmp_r === 1) ? 1.0 : (tmp_r === 2 ? p.pen110 : p.pen120);
            let r_factor = getCombatMultiplier(env, team.teamAttr, team.c1, tmp_idx, effTeam); 
            if (tmp_idx === 5) r_factor = 1.0;
            let effRatio = getBossEffectiveRatio(tmp_r, tmp_idx, env);
            const waveKey = `R${tmp_r}-${tmp_idx}`;
            if (feixueProf && guiRenCharges > 0 && !spentWaves.has(waveKey)) {
                const maxHp = getBossMaxHP(tmp_r, tmp_idx);
                if (shouldSpendFeixueGuiRen({ charges: guiRenCharges, r: tmp_r, idx: tmp_idx, hp: tmp_hp, maxHp, rFactor: r_factor, tLeft: t_left, estDps: loopDps })) {
                    spentWaves.add(waveKey);
                    guiRenCharges--;
                    const burstDealt = Math.min(tmp_hp, feixueProf.burstWan * r_factor * lvlPenalty);
                    tmp_hp -= burstDealt;
                    const burstScore = burstDealt * effRatio;
                    testScore += burstScore;
                    team.teamScore += burstScore;
                    reports.push(`⚔️ [R${tmp_r}-${tmp_idx}] 緋雪戰略消耗歸刃 (-${burstDealt.toFixed(1)}萬, 剩 ${guiRenCharges}/${feixueProf.maxCharges} 點)`);
                    if (tmp_hp <= 1e-6) {
                        const kBonus = getBossKillBonus(tmp_idx, env);
                        testScore += kBonus;
                        team.teamScore += kBonus;
                        tmp_hp = 0;
                        let actualTrans = Math.min(t_left, p.tTime);
                        t_left -= actualTrans;
                        currentGlobalTime += actualTrans;
                        tmp_idx++; if (tmp_idx > 5) { tmp_r++; tmp_idx = 1; }
                        tmp_hp = getBossMaxHP(tmp_r, tmp_idx);
                        continue;
                    }
                } else {
                    spentWaves.add(waveKey);
                    reports.push(`🛡️ [R${tmp_r}-${tmp_idx}] 保留緋雪歸刃 (${guiRenCharges}/${feixueProf.maxCharges} 點)`);
                }
            }

            if (currentPhase === 'opener' || currentPhase === 'switch_residual') {
                const remPhaseTime = Math.max(0, activeLut.duration - tableTimeAcc);
                if (remPhaseTime <= 1e-6) {
                    const nextLabel = currentPhase === 'switch_residual' ? '回歸滿Buff循環軸' : '進入循環軸';
                    currentPhase = 'loop';
                    residualSourcePhase = 'loop';
                    residualOrigStartIdx = 0;
                    chainDepth = 0;
                    activeLut = loopLut;
                    activeGrid = effTeam.gridData || [];
                    tableTimeAcc = 0;
                    phaseFlow.push(nextLabel);
                    continue;
                }
                const remPhaseDmg = getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, remPhaseTime);
                if (tmp_hp > remPhaseDmg) {
                    const pLabel = currentPhase === 'switch_residual' ? '轉火低Buff' : '啟動軸';
                    const stepLimit = t_left >= remPhaseTime ? remPhaseTime : t_left;
                    const loopDurSafe = Math.max(parseFloat(loopLut?.duration) || 25, 1);
                    for (let stepT = TICK_RATE; stepT <= stepLimit; stepT += TICK_RATE) {
                        let stepDmg = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, stepT));
                        const stepCycle = currentPhase === 'opener' ? 1 : Math.max(1, Math.floor((currentGlobalTime + stepT - teamStartTime - 0.001) / loopDurSafe) + 1);
                        globalTrace.push({
                            globalTime: currentGlobalTime + stepT,
                            currentScore: testScore + (stepDmg * effRatio),
                            teamC1: team.c1, currentBoss: `R${tmp_r}-${tmp_idx}`,
                            bossHpPct: Math.max(0.1, ((tmp_hp - stepDmg) / getBossMaxHP(tmp_r, tmp_idx)) * 100),
                            teamStartTime, rotDuration: activeLut.duration, rotId: team.rotId, cycle: stepCycle,
                            phase: currentPhase, phaseName: pLabel, isSpecialWait: false
                        });
                    }
                    const dmgDealt = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, stepLimit));
                    tmp_hp -= dmgDealt;
                    testScore += (dmgDealt * effRatio);
                    team.teamScore += (dmgDealt * effRatio);
                    t_left -= stepLimit;
                    currentGlobalTime += stepLimit;

                    if (stepLimit >= remPhaseTime - 1e-6 && t_left > 0) {
                        const nextLabel = currentPhase === 'switch_residual' ? '回歸滿Buff循環軸' : '進入循環軸';
                        currentPhase = 'loop';
                        residualSourcePhase = 'loop';
                        residualOrigStartIdx = 0;
                        chainDepth = 0;
                        activeLut = loopLut;
                        activeGrid = effTeam.gridData || [];
                        tableTimeAcc = 0;
                        phaseFlow.push(nextLabel);
                        continue;
                    }
                    t_left = 0;
                    break;
                }
            }
            
            let ttk = getTtkFromLookupTable(tmp_hp, activeLut, r_factor, lvlPenalty, tableTimeAcc);

            if (ttk <= t_left) {
                const preKillTimeAcc = tableTimeAcc;
                const hpBeforeKill = tmp_hp;
                const killer = getKillTriggerAction(
                    activeGrid,
                    activeLut.duration,
                    tableTimeAcc + ttk,
                    activeLut,
                    hpBeforeKill,
                    r_factor,
                    lvlPenalty,
                    preKillTimeAcc
                );

                for (let stepT = TICK_RATE; stepT <= ttk; stepT += TICK_RATE) {
                    let cCycle = Math.floor((tableTimeAcc + stepT - 0.001) / activeLut.duration) + 1;
                    let stepDmg = Math.min(tmp_hp, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, stepT));
                    globalTrace.push({
                        globalTime: currentGlobalTime + stepT,
                        currentScore: testScore + (stepDmg * effRatio),
                        teamC1: team.c1, currentBoss: `R${tmp_r}-${tmp_idx}`,
                        bossHpPct: Math.max(0, ((tmp_hp - stepDmg) / getBossMaxHP(tmp_r, tmp_idx)) * 100),
                        teamStartTime, rotDuration: activeLut.duration, rotId: team.rotId, cycle: cCycle,
                        phase: currentPhase, phaseName: currentPhase === 'opener' ? '啟動軸' : (currentPhase === 'switch_residual' ? '轉火低Buff' : '循環軸'),
                        isSpecialWait: false
                    });
                }

                tableTimeAcc += ttk;
                let gainedScore = (tmp_hp * effRatio) + getBossKillBonus(tmp_idx, env);
                testScore += gainedScore; team.teamScore += gainedScore;
                t_left -= ttk; currentGlobalTime += ttk; tmp_hp = 0;
                
                let phaseName = currentPhase === 'opener' ? '啟動軸' : (currentPhase === 'switch_residual' ? '轉火低Buff段' : '循環軸');
                const safeChar = escapeHtml(killer.char);
                const safeAction = escapeHtml(killer.action);
                const overkillNote = killer.overkillWan >= 5 ? ` · 溢傷${killer.overkillWan}w` : '';
                reports.push(`<span style="color:${pColor}; font-weight:bold; margin-right:8px;">R${tmp_r}-${tmp_idx} (${ttk.toFixed(1)}s [${phaseName}] 由 ${safeChar}「${safeAction}」第 ${killer.index + 1} 招斬殺${overkillNote})</span>`);
                
                team.transitionEvents.push({
                    boss: `R${tmp_r}-${tmp_idx}`,
                    time: parseFloat(currentGlobalTime.toFixed(1)),
                    teamTime: parseFloat((currentGlobalTime - teamStartTime).toFixed(1)),
                    phase: currentPhase,
                    phaseLabel: phaseName,
                    killerChar: killer.char,
                    killerAction: killer.action,
                    actionIndex: killer.index + 1,
                    overkillWan: killer.overkillWan || 0
                });

                let actualTrans = Math.min(t_left, p.tTime);
                let nextCycleNum = Math.floor(tableTimeAcc / activeLut.duration) + 1;
                for (let stepT = TICK_RATE; stepT <= actualTrans; stepT += TICK_RATE) {
                    globalTrace.push({ 
                        globalTime: currentGlobalTime + stepT, currentScore: testScore, teamC1: team.c1, 
                        currentBoss: `R${tmp_r}-${tmp_idx}`, bossHpPct: 0,
                        teamStartTime, rotDuration: activeLut.duration, rotId: team.rotId, cycle: nextCycleNum, 
                        phase: currentPhase, phaseName: '轉場停頓', isSpecialWait: false
                    });
                }
                t_left -= actualTrans; currentGlobalTime += actualTrans;
                tmp_idx++; if (tmp_idx > 5) { tmp_r++; tmp_idx = 1; }
                tmp_hp = getBossMaxHP(tmp_r, tmp_idx);

                if (currentPhase === 'opener') {
                    if (tableTimeAcc < activeLut.duration - 1e-6) {
                        const residual = getCachedResidualTable(effTeam, killer.index, dpsScale, env, 1, 'opener');
                        if (residual && residual.duration > 0) {
                            currentPhase = 'switch_residual';
                            residualSourcePhase = 'opener';
                            residualOrigStartIdx = residual.startIndex;
                            chainDepth = 1;
                            activeLut = residual.table;
                            activeGrid = residual.nodes;
                            tableTimeAcc = 0;
                            phaseFlow.push(`啟動轉火(#${residual.startIndex + 1}招, -${residual.lossPct}%)`);
                            team.transitionEvents[team.transitionEvents.length - 1].switchAnalysis = {
                                mode: residual.mode,
                                remainingNodes: residual.nodes.length,
                                remainingDur: residual.duration,
                                origDmgWan: Number((residual.origTotalDmgWan || 0).toFixed(2)),
                                afterSwitchDmgWan: Number((residual.totalDmg || 0).toFixed(2)),
                                lossPct: residual.lossPct,
                                chainDepth,
                                reasons: residual.reasons
                            };
                        }
                    } else {
                        currentPhase = 'loop';
                        residualSourcePhase = 'loop';
                        residualOrigStartIdx = 0;
                        chainDepth = 0;
                        activeLut = loopLut;
                        activeGrid = effTeam.gridData || [];
                        tableTimeAcc = 0;
                        phaseFlow.push('回歸循環軸');
                    }
                } else if (currentPhase === 'loop') {
                    chainDepth = 1;
                    const residual = getCachedResidualTable(effTeam, killer.index, dpsScale, env, chainDepth, 'loop');
                    if (residual && residual.duration > 0) {
                        currentPhase = 'switch_residual';
                        residualSourcePhase = 'loop';
                        residualOrigStartIdx = residual.startIndex;
                        activeLut = residual.table;
                        activeGrid = residual.nodes;
                        tableTimeAcc = 0;
                        phaseFlow.push(`轉火接駁(#${residual.startIndex + 1}招, -${residual.lossPct}%)`);
                        team.transitionEvents[team.transitionEvents.length - 1].switchAnalysis = {
                            mode: residual.mode,
                            remainingNodes: residual.nodes.length,
                            remainingDur: residual.duration,
                            origDmgWan: Number((residual.origTotalDmgWan || 0).toFixed(2)),
                            afterSwitchDmgWan: Number((residual.totalDmg || 0).toFixed(2)),
                            lossPct: residual.lossPct,
                            chainDepth,
                            reasons: residual.reasons
                        };
                    } else {
                        currentPhase = 'loop';
                        chainDepth = 0;
                        residualOrigStartIdx = 0;
                        activeLut = loopLut;
                        activeGrid = effTeam.gridData || [];
                        tableTimeAcc = 0;
                        phaseFlow.push('次輪循環軸');
                    }
                } else if (currentPhase === 'switch_residual') {
                    const globalKillIdx = residualOrigStartIdx + killer.index;
                    chainDepth += 1;
                    const residual = getCachedResidualTable(effTeam, globalKillIdx, dpsScale, env, chainDepth, residualSourcePhase);
                    if (residual && residual.duration > 0) {
                        currentPhase = 'switch_residual';
                        residualOrigStartIdx = residual.startIndex;
                        activeLut = residual.table;
                        activeGrid = residual.nodes;
                        tableTimeAcc = 0;
                        phaseFlow.push(`連鎖轉火(#${residual.startIndex + 1}招, -${residual.lossPct}%)`);
                        team.transitionEvents[team.transitionEvents.length - 1].switchAnalysis = {
                            mode: residual.mode,
                            remainingNodes: residual.nodes.length,
                            remainingDur: residual.duration,
                            origDmgWan: Number((residual.origTotalDmgWan || 0).toFixed(2)),
                            afterSwitchDmgWan: Number((residual.totalDmg || 0).toFixed(2)),
                            lossPct: residual.lossPct,
                            chainDepth,
                            reasons: residual.reasons
                        };
                    } else {
                        currentPhase = 'loop';
                        residualSourcePhase = 'loop';
                        residualOrigStartIdx = 0;
                        chainDepth = 0;
                        activeLut = loopLut;
                        activeGrid = effTeam.gridData || [];
                        tableTimeAcc = 0;
                        phaseFlow.push('回歸循環軸');
                    }
                }
            } else {
                let remTableTime = activeLut.duration - (tableTimeAcc % activeLut.duration);

                if ((currentPhase === 'switch_residual' || currentPhase === 'opener') && t_left >= remTableTime) {
                    const pLabel = currentPhase === 'switch_residual' ? '轉火低Buff' : '啟動軸';
                    for (let stepT = TICK_RATE; stepT <= remTableTime; stepT += TICK_RATE) {
                        let stepDmg = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, stepT));
                        globalTrace.push({
                            globalTime: currentGlobalTime + stepT,
                            currentScore: testScore + (stepDmg * effRatio),
                            teamC1: team.c1, currentBoss: `R${tmp_r}-${tmp_idx}`,
                            bossHpPct: Math.max(0.1, ((tmp_hp - stepDmg) / getBossMaxHP(tmp_r, tmp_idx)) * 100),
                            teamStartTime, rotDuration: activeLut.duration, rotId: team.rotId, cycle: 1, 
                            phase: currentPhase, phaseName: pLabel, isSpecialWait: false
                        });
                    }
                    let dmgDealt = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, remTableTime));
                    tmp_hp -= dmgDealt;
                    testScore += (dmgDealt * effRatio);
                    team.teamScore += (dmgDealt * effRatio);
                    t_left -= remTableTime;
                    currentGlobalTime += remTableTime;

                    const nextLabel = currentPhase === 'switch_residual' ? '回歸滿Buff循環軸' : '進入循環軸';
                    currentPhase = 'loop';
                    residualSourcePhase = 'loop';
                    residualOrigStartIdx = 0;
                    chainDepth = 0;
                    activeLut = loopLut;
                    activeGrid = effTeam.gridData || [];
                    tableTimeAcc = 0;
                    phaseFlow.push(nextLabel);
                } else {
                    const pLabel = currentPhase === 'opener' ? '啟動軸' : (currentPhase === 'switch_residual' ? '轉火低Buff' : '循環軸');
                    for (let stepT = TICK_RATE; stepT <= t_left; stepT += TICK_RATE) {
                        let cCycle = Math.floor((tableTimeAcc + stepT - 0.001) / activeLut.duration) + 1;
                        let stepDmg = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, stepT));
                        globalTrace.push({
                            globalTime: currentGlobalTime + stepT,
                            currentScore: testScore + (stepDmg * effRatio),
                            teamC1: team.c1, currentBoss: `R${tmp_r}-${tmp_idx}`,
                            bossHpPct: Math.max(0.1, ((tmp_hp - stepDmg) / getBossMaxHP(tmp_r, tmp_idx)) * 100),
                            teamStartTime, rotDuration: activeLut.duration, rotId: team.rotId, cycle: cCycle,
                            phase: currentPhase, phaseName: pLabel, isSpecialWait: false
                        });
                    }
                    let dmgDealt = Math.min(tmp_hp * 0.999, getDmgDealtInTimeWindow(activeLut, r_factor, lvlPenalty, tableTimeAcc, t_left));
                    testScore += (dmgDealt * effRatio);
                    team.teamScore += (dmgDealt * effRatio);
                    tmp_hp -= dmgDealt;
                    currentGlobalTime += t_left;
                    t_left = 0;
                    reports.push(`<span style="color:#9ca3af; margin-right:8px;">R${tmp_r}-${tmp_idx} 剩 ${((tmp_hp / getBossMaxHP(tmp_r, tmp_idx)) * 100).toFixed(1)}%</span>`);
                }
            }
        }
        team.report = reports.join('<span style="color:#4b5563; font-weight:bold;">|</span> ');
        team.duration = currentGlobalTime - teamStartTime; 
        team.score = Math.round(team.teamScore);

        team.rotationStateSummary = {
            rotName: team.rot || '常規排軸',
            hasOpener: !!(team.firstDuration && team.firstDuration > 0),
            openerDuration: team.firstDuration || 0,
            loopDuration: team.duration || 25,
            hasSwitchConfigured: !!(team.hasSwitchRot && team.switchGridData?.length > 0),
            switchNodesCount: team.switchGridData?.length || 0,
            phaseFlow: phaseFlow,
            transitionCount: team.transitionEvents.length,
            lastPhase: currentPhase === 'opener' ? '啟動軸' : (currentPhase === 'switch_residual' ? '轉火接駁段' : '循環軸')
        };
    }
    
    return {
        score: testScore,
        trace: globalTrace,
        teams: seq,
        endState: { r: tmp_r, idx: tmp_idx, hp: tmp_hp }
    };
}

// =========================================================================
// [ 增量預處理快取池 (Incremental Pre-processing Cache) ]
// 僅重算有變動的角色面板、裝備共鳴鏈或排軸節點，其餘直接 O(1) 合併複用
// =========================================================================
export const preprocessedRotCache = new Map();

export function clearPreprocessedRotCache() {
    preprocessedRotCache.clear();
}

function getCharStateDirtySignature(charName, team, env) {
    if (!charName) return '';
    const cr = getCharCritDetails(team, charName, env);
    const lo = getEffectiveCharLoadout(charName, env);
    const slotSig = lo.hasCustomLoadout && lo.slot
        ? `${lo.slot.weaponId || 0}_${lo.slot.weaponRank || 1}_${lo.slot.echoSetId || 0}_${lo.slot.mainEchoId || 0}_${lo.slot.rc || 0}_${lo.stats?.atk || 0}_${lo.stats?.critRate || 0}_${lo.stats?.critDmg || 0}`
        : 'default';
    return `${charName}:${cr.userCR}_${cr.baseCR}_${cr.buffCR}_${ cr.finalCR}_${slotSig}`;
}

function getGridQuickChecksum(grid) {
    if (!Array.isArray(grid) || grid.length === 0) return '0';
    const len = grid.length;
    const first = grid[0];
    const mid = grid[len >> 1];
    const last = grid[len - 1];
    let sum = 0;
    for (let i = 0; i < len; i++) {
        sum += (parseFloat(grid[i].dmg) || 0) + (parseFloat(grid[i].time) || 0) * 13 + (grid[i].fixedCrit ? (grid[i].fixedCritRate ?? 80) : 0);
    }
    return `${len}_${Math.round(sum)}_${first.time}:${first.dmg}_${mid.time}:${mid.dmg}_${last.time}:${last.dmg}`;
}

function getRotationDirtySignature(r, autoEnv) {
    const rotId = String(r.rotId || r.id || '');
    const c1Sig = getCharStateDirtySignature(r.c1, r, autoEnv);
    const c2Sig = getCharStateDirtySignature(r.c2, r, autoEnv);
    const c3Sig = getCharStateDirtySignature(r.c3, r, autoEnv);
    const gSig = getGridQuickChecksum(r.gridData);
    const fgSig = getGridQuickChecksum(r.firstGridData);
    const sgSig = r.hasSwitchRot ? getGridQuickChecksum(r.switchGridData) : '0';
    const envSig = `${autoEnv.matrixVersion || '3.8'}_${autoEnv.matrixBuffId || 'auto'}_${autoEnv.enemyLv || 100}_${autoEnv.bossRes ?? ''}_${autoEnv.applyLoadoutScaling !== false ? 1 : 0}_${autoEnv.usePresetKeybindGrids !== false ? 1 : 0}`;
    return `${rotId}|${r.dps}|${r.duration}|${r.firstDuration || 0}|${r.firstDps || 0}|${r.firstTotalDmg || 0}|${r.presetKeybindId || ''}|${r.forcedMatrixBuffId || ''}|${r.matrixBuffId || ''}|${c1Sig}|${c2Sig}|${c3Sig}|${gSig}|${fgSig}|${sgSig}|${envSig}`;
}

/**
 * 提取排軸的「爆發時點與節點分佈特徵指紋」：
 * 確保同陣容 (c1, c2, c3) 中具有不同爆發分佈、不同軸長、不同轉火表或不同啟動軸的排軸皆能保留進入實戰血線測試，
 * 僅合併「無節點且軸長完全相同、斜率完全受支配」的純線性重複項目。
 */
function getRotationCurveCharacteristicKey(cand) {
    const loopDurKey = Math.round((cand._loopDur || 25) * 10);
    const openDurKey = Math.round((cand._openerDur || 28) * 10);
    const hasOpenerFlag = (cand.firstDuration && cand.firstDuration > 0) ? 1 : 0;
    const switchFlag = (cand.hasSwitchRot && cand.switchGridData?.length > 0) ? `sw${cand.switchGridData.length}` : 'nosw';
    const buffKey = cand.matrixBuffId || 'none';

    const grid = cand.effGridData;
    if (Array.isArray(grid) && grid.length > 0) {
        // 統計前段 (0~33%)、中段 (33~66%)、尾段 (66~100%) 傷害分佈比例與最大單擊佔比，區分前載/平滑/後置核爆軸
        let q1 = 0, q2 = 0, q3 = 0, maxHit = 0, tot = 0;
        const dur = cand._loopDur || 25;
        for (let i = 0; i < grid.length; i++) {
            const d = parseFloat(grid[i].dmg) || 0;
            const t = parseFloat(grid[i].time) || 0;
            tot += d;
            if (d > maxHit) maxHit = d;
            if (t <= dur * 0.33) q1 += d;
            else if (t <= dur * 0.66) q2 += d;
            else q3 += d;
        }
        if (tot > 0) {
            const b1 = Math.round((q1 / tot) * 10);
            const b2 = Math.round((q2 / tot) * 10);
            const b3 = Math.round((q3 / tot) * 10);
            const nukeBucket = Math.round((maxHit / tot) * 20);
            return `discrete_${loopDurKey}_${openDurKey}_${hasOpenerFlag}_${switchFlag}_${buffKey}_n${grid.length}_${b1}_${b2}_${b3}_pk${nukeBucket}_${cand.rotId}`;
        }
    }
    return `linear_${loopDurKey}_${openDurKey}_${hasOpenerFlag}_${switchFlag}_${buffKey}`;
}

export async function autoBuildMaxDpsTeams(availableRots, charMaxUses, envSettings, customStatsMap, maxTeamsTarget, searchDepth, onProgress) {
    if (isEngineRunning) return { status: 'error', message: "引擎運算中" };
    isEngineRunning = true;
    ttkCache.clear();

    try {
        const env = envSettings || {};
        initBossHPMap(env);
        const safeCharMaxUses = charMaxUses || {};

        const charToIndex = Object.create(null);
        const baseToMaxUse = [];
        let idxCounter = 0;

        const registerChar = (c) => {
            if (!c) return -1;
            if (charToIndex[c] !== undefined) return charToIndex[c];
            const b = getBase(c);
            if (!b) return -1;
            let id = charToIndex[b];
            if (id === undefined) {
                id = idxCounter++;
                charToIndex[b] = id;
                const baseUse = safeCharMaxUses[b];
                baseToMaxUse[id] = baseUse !== undefined ? baseUse : 1;
            }
            charToIndex[c] = id;
            const specificUse = safeCharMaxUses[c];
            if (specificUse !== undefined && specificUse > baseToMaxUse[id]) {
                baseToMaxUse[id] = specificUse;
            }
            return id;
        };

        for (let i = 0; i < availableRots.length; i++) {
            const r = availableRots[i];
            if (!r) continue;
            registerChar(r.c1);
            registerChar(r.c2);
            registerChar(r.c3);
        }

        const MAX_CHARS = idxCounter;
        const maxUsesById = new Uint8Array(MAX_CHARS);
        let totalDeployments = 0;
        for (let i = 0; i < MAX_CHARS; i++) {
            const u = Math.max(0, Math.min(255, baseToMaxUse[i] ?? 1));
            maxUsesById[i] = u;
            totalDeployments += u;
        }

        const safeMaxTeams = (isNaN(maxTeamsTarget) || maxTeamsTarget <= 0) ? 10 : maxTeamsTarget;
        const actualTargetTeams = Math.min(safeMaxTeams, Math.floor(totalDeployments / 3));
        if (actualTargetTeams <= 0) {
            return { status: 'error', message: "可用角色的剩餘耐力不足以組成任何完整隊伍。" };
        }

        const autoEnv = {
            ...env,
            matrixBuffId: (env?.matrixBuffId && env.matrixBuffId !== 'none') ? env.matrixBuffId : 'auto'
        };

        const yieldEventLoop = () => new Promise(r => setTimeout(r, 0));
        let lastYieldTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const maybeYield = async () => {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            if (now - lastYieldTime >= 16) {
                await yieldEventLoop();
                lastYieldTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            }
        };

        // 1. 增量預處理階段：僅針對新增或角色面板/裝備/節點有改動的排軸計算，其餘直接由 preprocessedRotCache 合併
        const byTriple = new Map();

        for (let i = 0; i < availableRots.length; i++) {
            const r = availableRots[i];
            if (!r || !r.c1) continue;

            const id1 = charToIndex[r.c1] !== undefined ? charToIndex[r.c1] : -1;
            const id2 = r.c2 ? (charToIndex[r.c2] !== undefined ? charToIndex[r.c2] : -1) : -1;
            const id3 = r.c3 ? (charToIndex[r.c3] !== undefined ? charToIndex[r.c3] : -1) : -1;

            if (id1 === -1) continue;
            if (id2 !== -1 && id1 === id2) continue;
            if (id3 !== -1 && (id1 === id3 || id2 === id3)) continue;

            if (maxUsesById[id1] === 0) continue;
            if (id2 !== -1 && maxUsesById[id2] === 0) continue;
            if (id3 !== -1 && maxUsesById[id3] === 0) continue;

            const rotId = String(r.rotId || r.id || `rot_${i}`);
            const dirtySig = getRotationDirtySignature(r, autoEnv);
            const cachedEntry = preprocessedRotCache.get(rotId);

            let cand = null;
            if (cachedEntry && cachedEntry.sig === dirtySig) {
                // 直接複用快取的查找表與轉火殘留快取 (_residualCache)，僅更新當前搜尋之角色耐力索引
                cand = {
                    ...cachedEntry.data,
                    c1_id: id1,
                    c2_id: id2,
                    c3_id: id3
                };
            } else {
                const resolved = resolveTeamEffectiveInputs(r, autoEnv);
                const effR = {
                    ...r,
                    gridData: resolved.gridData,
                    firstGridData: resolved.firstGridData,
                    baseCritRates: resolved.baseCritRates
                };
                const actualDps = applyMonteCarloDps(effR, autoEnv, 'expected', resolved.loopBaseDps);
                const openerDps = applyMonteCarloDps(effR, autoEnv, 'expected', resolved.openerBaseDps);
                if (!(actualDps > 0) && !(openerDps > 0)) continue;

                const openerDur = parseFloat(r.firstDuration || r.duration) || 28;
                const loopDur = parseFloat(r.duration) || 25;

                const openerLut = buildTableFromNodes(
                    effR.firstGridData || effR.gridData,
                    openerDur,
                    openerDps * openerDur
                );
                const loopLut = buildTableFromNodes(
                    effR.gridData,
                    loopDur,
                    actualDps * loopDur
                );

                cand = {
                    ...r,
                    effGridData: effR.gridData,
                    effFirstGridData: effR.firstGridData,
                    baseCritRates: effR.baseCritRates,
                    matrixBuffId: resolved.appliedMatrixBuff?.buffId || autoEnv.matrixBuffId,
                    appliedMatrixBuff: resolved.appliedMatrixBuff,
                    appliedDualModes: resolved.appliedDualModes,
                    rotId,
                    teamAttr: getCharElement(r.c1),
                    rawDps: r.dps,
                    calculatedMinDps: actualDps,
                    _openerDps: openerDps,
                    _openerDur: openerDur,
                    _loopDur: loopDur,
                    _peakDps: Math.max(actualDps, openerDps),
                    c1_id: id1,
                    c2_id: id2,
                    c3_id: id3,
                    openerLut,
                    loopLut,
                    _residualCache: new Map()
                };
                cand._curveKey = getRotationCurveCharacteristicKey(cand);
                preprocessedRotCache.set(rotId, { sig: dirtySig, data: cand });
            }

            let a = id1, b = id2, c = id3;
            if (a > b) { const t = a; a = b; b = t; }
            if (b > c) { const t = b; b = c; c = t; }
            if (a > b) { const t = a; a = b; b = t; }
            const tripleKey = `${a},${b},${c}`;

            let list = byTriple.get(tripleKey);
            if (!list) {
                list = [];
                byTriple.set(tripleKey, list);
            }
            list.push(cand);

            if ((i & 127) === 127) await maybeYield();
        }

        // 2. 特色保留篩選：保留所有具備獨立節點曲線、不同軸長、啟動軸或轉火表的排軸，讓實戰血線決定誰不溢傷
        const candidateRots = [];
        const pickedIds = new Set();

        for (const list of byTriple.values()) {
            list.sort((x, y) => y.calculatedMinDps - x.calculatedMinDps);
            const linearBuckets = new Map();

            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (pickedIds.has(item.rotId)) continue;

                const cKey = item._curveKey || getRotationCurveCharacteristicKey(item);
                if (cKey.startsWith('discrete_')) {
                    // 具備離散招式節點之排軸：爆發時點與溢傷特性皆獨立，全數保留進入血線測試
                    pickedIds.add(item.rotId);
                    candidateRots.push(item);
                } else {
                    // 無節點之純線性排軸：按 (軸長, 啟動軸長, 轉火配置, 矩陣Buff) 分桶，每桶保留最高與次高節奏以兼顧斬殺對齊
                    let lBucket = linearBuckets.get(cKey);
                    if (!lBucket) {
                        lBucket = [];
                        linearBuckets.set(cKey, lBucket);
                    }
                    const dominatedInLinear = lBucket.some(
                        ex => ex.calculatedMinDps >= item.calculatedMinDps && ex._openerDps >= item._openerDps
                    );
                    if (!dominatedInLinear || lBucket.length < 2) {
                        lBucket.push(item);
                        pickedIds.add(item.rotId);
                        candidateRots.push(item);
                    }
                }
            }
        }

        candidateRots.sort((a, b) => b.calculatedMinDps - a.calculatedMinDps);
        if (candidateRots.length === 0) {
            return { status: 'error', message: "沒有有效的候選隊伍。" };
        }

        let beamWidth = Number(searchDepth);
        if (!beamWidth || isNaN(beamWidth) || beamWidth <= 0) {
            const rotCount = candidateRots.length;
            beamWidth = Math.max(500, Math.min(5000, Math.floor(500 + Math.log(rotCount || 1) * 1000)));
        }

        const encodeCharUsesKey = (arr) => {
            let s = '';
            for (let i = 0; i < arr.length; i++) {
                s += String.fromCharCode(arr[i]);
            }
            return s;
        };

        // 3. 波次狀態轉移快取 (Wave-State Transition Cache)：相同入場波次與殘血量對同一排軸僅需模擬一次
        const transitionEvalCache = new Map();
        const evaluateAddingTeamCached = (state, team, envObj) => {
            const hpQuant = Math.round(state.hp * 20); // 0.05萬 (500 HP) 量化精度
            const cacheKey = `${state.r}_${state.idx}_${hpQuant}_${team.rotId}`;
            let simDelta = transitionEvalCache.get(cacheKey);

            if (!simDelta) {
                const evaluated = evaluateAddingTeamToState(state, team, envObj);
                if (!evaluated) return null;
                simDelta = {
                    scoreGained: evaluated.score - state.score,
                    r: evaluated.r,
                    idx: evaluated.idx,
                    hp: evaluated.hp,
                    timeSpent: (evaluated.timeUsed || 0) - (state.timeUsed || 0)
                };
                if (transitionEvalCache.size > 25000) transitionEvalCache.clear();
                transitionEvalCache.set(cacheKey, simDelta);
            }

            const newUses = new Uint8Array(state.charUses);
            if (team.c1_id !== -1) newUses[team.c1_id]++;
            if (team.c2_id !== -1) newUses[team.c2_id]++;
            if (team.c3_id !== -1) newUses[team.c3_id]++;

            const seqSig = state.sig ? `${state.sig}|${team.rotId}` : team.rotId;
            return {
                score: state.score + simDelta.scoreGained,
                r: simDelta.r,
                idx: simDelta.idx,
                hp: simDelta.hp,
                timeUsed: (state.timeUsed || 0) + simDelta.timeSpent,
                seq: [...state.seq, team],
                charUses: newUses,
                sig: seqSig
            };
        };

        const initialHp = getBossMaxHP(1, 1);
        let beam = [{
            score: 0,
            r: 1,
            idx: 1,
            hp: initialHp,
            seq: [],
            charUses: new Uint8Array(MAX_CHARS),
            timeUsed: 0,
            sig: ''
        }];
        let bestGlobalState = beam[0];
        let maxObservedGainPerTeam = 0;

        if (onProgress) onProgress(0, actualTargetTeams);
        await yieldEventLoop();
        lastYieldTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

        const rotLen = candidateRots.length;

        for (let step = 0; step < actualTargetTeams; step++) {
            const remainingTeamsAfter = actualTargetTeams - step - 1;
            const dominatedByUses = new Map();
            const seenSeqKey = new Set();
            let stepMaxGain = 0;

            for (let bIdx = 0; bIdx < beam.length; bIdx++) {
                const state = beam[bIdx];
                const uses = state.charUses;

                if (maxObservedGainPerTeam > 0 && bestGlobalState.score > 0) {
                    const optimisticRemaining = (remainingTeamsAfter + 1) * maxObservedGainPerTeam * 1.25;
                    if (state.score + optimisticRemaining < bestGlobalState.score * 0.96) {
                        continue;
                    }
                }

                for (let tIdx = 0; tIdx < rotLen; tIdx++) {
                    const team = candidateRots[tIdx];
                    const id1 = team.c1_id;
                    const id2 = team.c2_id;
                    const id3 = team.c3_id;

                    if (uses[id1] >= maxUsesById[id1]) continue;
                    if (id2 !== -1 && uses[id2] >= maxUsesById[id2]) continue;
                    if (id3 !== -1 && uses[id3] >= maxUsesById[id3]) continue;

                    const seqSig = state.sig ? `${state.sig}|${team.rotId}` : team.rotId;
                    if (seenSeqKey.has(seqSig)) continue;
                    seenSeqKey.add(seqSig);

                    const newState = evaluateAddingTeamCached(state, team, env);
                    if (!newState) continue;

                    const gain = newState.score - state.score;
                    if (gain > stepMaxGain) stepMaxGain = gain;
                    if (newState.score > bestGlobalState.score) {
                        bestGlobalState = newState;
                    }

                    // 4. 實戰血線測試後剪枝：比較同耐力消耗 (usesKey) 下各排軸打完該血線後的真實進度與得分
                    const usesKey = encodeCharUsesKey(newState.charUses);
                    let bucket = dominatedByUses.get(usesKey);
                    if (!bucket) {
                        dominatedByUses.set(usesKey, [newState]);
                    } else {
                        let isDominated = false;
                        for (let k = bucket.length - 1; k >= 0; k--) {
                            const ex = bucket[k];
                            const exBetterStage = (ex.r > newState.r) ||
                                (ex.r === newState.r && ex.idx > newState.idx) ||
                                (ex.r === newState.r && ex.idx === newState.idx && ex.hp <= newState.hp);
                            if (exBetterStage && ex.score >= newState.score && (ex.timeUsed || 0) <= (newState.timeUsed || 0)) {
                                isDominated = true;
                                break;
                            }
                            const newBetterStage = (newState.r > ex.r) ||
                                (newState.r === ex.r && newState.idx > ex.idx) ||
                                (newState.r === ex.r && newState.idx === ex.idx && newState.hp <= ex.hp);
                            if (newBetterStage && newState.score >= ex.score && (newState.timeUsed || 0) <= (ex.timeUsed || 0)) {
                                bucket.splice(k, 1);
                            }
                        }
                        if (!isDominated) {
                            bucket.push(newState);
                        }
                    }

                    if (((tIdx & 63) === 63)) {
                        await maybeYield();
                    }
                }

                if ((bIdx & 7) === 7) {
                    await maybeYield();
                }
            }

            if (stepMaxGain > maxObservedGainPerTeam) {
                maxObservedGainPerTeam = stepMaxGain;
            }

            const nextBeam = [];
            for (const bucket of dominatedByUses.values()) {
                for (let k = 0; k < bucket.length; k++) {
                    nextBeam.push(bucket[k]);
                }
            }

            if (nextBeam.length === 0) break;

            nextBeam.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeUsed || 0) - (b.timeUsed || 0);
            });
            beam = nextBeam.length > beamWidth ? nextBeam.slice(0, beamWidth) : nextBeam;

            if (onProgress) onProgress(step + 1, actualTargetTeams);
            await yieldEventLoop();
            lastYieldTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        }

        let bestSeq = bestGlobalState.seq;
        if (!bestSeq || bestSeq.length === 0) {
            bestSeq = [candidateRots[0]];
        }

        let currentStartState = { r: 1, idx: 1, hp: getBossMaxHP(1, 1) };
        const detailedReports = [];
        let totalScore = 0;
        let totalDamage = 0;
        let totalTimeUsed = 0;

        for (let i = 0; i < bestSeq.length; i++) {
            const team = bestSeq[i];
            const teamEnv = {
                ...env,
                matrixBuffId: team.matrixBuffId || env.matrixBuffId || 'auto'
            };

            const simInput = {
                ...team,
                gridData: team.effGridData || team.gridData,
                firstGridData: team.effFirstGridData || team.firstGridData,
                baseCritRates: team.baseCritRates,
                appliedMatrixBuff: team.appliedMatrixBuff,
                appliedDualModes: team.appliedDualModes,
                _residualCache: team._residualCache
            };

            const simRes = simulateAndGenerateReport([simInput], teamEnv, 'expected', currentStartState);
            const endState = simRes?.endState || (simRes?.r !== undefined ? { r: simRes.r, idx: simRes.idx, hp: simRes.hp } : currentStartState);

            const teamReport = {
                ...simRes,
                teamIndex: i + 1,
                rotId: team.rotId || team.id,
                id: team.id || team.rotId,
                name: team.name,
                c1: team.c1,
                c2: team.c2,
                c3: team.c3,
                teamAttr: team.teamAttr,
                rawDps: team.rawDps,
                calculatedMinDps: team.calculatedMinDps,
                matrixBuffId: simRes?.appliedMatrixBuff?.buffId || team.matrixBuffId,
                appliedMatrixBuff: simRes?.appliedMatrixBuff ?? team.appliedMatrixBuff ?? null,
                appliedDualModes: simRes?.appliedDualModes ?? team.appliedDualModes ?? null,
                transitionEvents: simRes?.transitionEvents ?? [],
                rotationStateSummary: simRes?.rotationStateSummary ?? null,
                startState: { ...currentStartState },
                endState: { ...endState }
            };

            detailedReports.push(teamReport);
            totalScore += (simRes?.score ?? simRes?.teamScore ?? 0);
            totalDamage += (simRes?.totalDamage ?? simRes?.damageDealt ?? 0);
            totalTimeUsed += (simRes?.timeUsed ?? simRes?.durationUsed ?? 0);

            currentStartState = {
                r: endState.r ?? currentStartState.r,
                idx: endState.idx ?? currentStartState.idx,
                hp: endState.hp ?? currentStartState.hp
            };

            await maybeYield();
        }

        const simMax = simulateAndGenerateReport(bestSeq, autoEnv, 'max');
        const simMin = simulateAndGenerateReport(bestSeq, autoEnv, 'min');
        const optimizedTeams = (simMax.teams || []).map((tMax, i) => {
            const tMin = simMin.teams?.[i] || tMax;
            const src = bestSeq[i] || {};
            return {
                ...src,
                c1: tMax.c1 || src.c1,
                c2: tMax.c2 || src.c2,
                c3: tMax.c3 || src.c3,
                rotId: tMax.rotId || src.rotId || src.id,
                scoreMax: Math.round(tMax.score || 0),
                scoreMin: Math.round(tMin.score || 0),
                reportMax: tMax.report || '',
                reportMin: tMin.report || '',
                duration: tMax.duration || 0,
                appliedMatrixBuff: tMax.appliedMatrixBuff || src.appliedMatrixBuff || null,
                appliedDualModes: tMax.appliedDualModes || src.appliedDualModes || null,
                transitionEvents: tMax.transitionEvents || [],
                rotationStateSummary: tMax.rotationStateSummary || null
            };
        });

        const finalScore = simMax.score || totalScore || bestGlobalState.score;

        return {
            status: 'success',
            optimizedTeams,
            finalScoreMax: Math.round(simMax.score || finalScore),
            finalScoreMin: Math.round(simMin.score || finalScore),
            globalTraceMax: simMax.trace || simMax.globalTrace || [],
            globalTraceMin: simMin.trace || simMin.globalTrace || [],
            teams: detailedReports,
            reports: detailedReports,
            bestSeq,
            totalScore: finalScore,
            score: finalScore,
            totalDamage,
            totalTimeUsed: totalTimeUsed || bestGlobalState.timeUsed || 0,
            endState: currentStartState,
            finalRound: currentStartState.r,
            finalBossIdx: currentStartState.idx,
            remainingHp: currentStartState.hp
        };
    } catch (err) {
        return {
            status: 'error',
            message: err?.message || String(err)
        };
    } finally {
        isEngineRunning = false;
    }
}

/**
 * 針對固定隊伍集合尋找總分最高的出場順序（支援狀壓 DP / 束式搜索）
 */
function findBestTeamOrder(validTeams, envSettings = {}) {
    if (!Array.isArray(validTeams) || validTeams.length <= 1) return validTeams || [];
    const autoEnv = {
        ...(envSettings || {}),
        matrixBuffId: envSettings?.matrixBuffId || 'auto'
    };

    const prepared = validTeams.map((t, i) => {
        const resolved = resolveTeamEffectiveInputs(t, autoEnv);
        const effR = {
            ...t,
            gridData: resolved.gridData,
            firstGridData: resolved.firstGridData,
            baseCritRates: resolved.baseCritRates
        };
        const actualDps = applyMonteCarloDps(effR, autoEnv, 'expected', resolved.loopBaseDps);
        const openerDps = applyMonteCarloDps(effR, autoEnv, 'expected', resolved.openerBaseDps);
        const openerDur = parseFloat(t.firstDuration || t.duration) || 28;
        const loopDur = parseFloat(t.duration) || 25;
        const openerLut = buildTableFromNodes(effR.firstGridData || effR.gridData, openerDur, openerDps * openerDur);
        const loopLut = buildTableFromNodes(effR.gridData, loopDur, actualDps * loopDur);

        return {
            ...t,
            _slotIdx: i,
            effGridData: effR.gridData,
            effFirstGridData: effR.firstGridData,
            baseCritRates: effR.baseCritRates,
            appliedMatrixBuff: resolved.appliedMatrixBuff,
            appliedDualModes: resolved.appliedDualModes,
            calculatedMinDps: actualDps,
            _openerDps: openerDps,
            _openerDur: openerDur,
            _loopDur: loopDur,
            c1_id: -1,
            c2_id: -1,
            c3_id: -1,
            openerLut,
            loopLut,
            _residualCache: t._residualCache instanceof Map ? t._residualCache : new Map()
        };
    });

    const N = prepared.length;
    const transitionCache = new Map();
    const evalStep = (state, team) => {
        const hpQuant = Math.round(state.hp * 20);
        const key = `${state.r}_${state.idx}_${hpQuant}_${team._slotIdx}`;
        let delta = transitionCache.get(key);
        if (!delta) {
            const ev = evaluateAddingTeamToState(state, team, autoEnv);
            if (!ev) return null;
            delta = {
                scoreGained: ev.score - state.score,
                r: ev.r,
                idx: ev.idx,
                hp: ev.hp,
                timeSpent: (ev.timeUsed || 0) - (state.timeUsed || 0)
            };
            transitionCache.set(key, delta);
        }
        return {
            score: state.score + delta.scoreGained,
            r: delta.r,
            idx: delta.idx,
            hp: delta.hp,
            timeUsed: (state.timeUsed || 0) + delta.timeSpent,
            seq: [...state.seq, team],
            usedMask: state.usedMask | (1 << team._slotIdx),
            charUses: state.charUses
        };
    };

    let beam = [{
        score: 0,
        r: 1,
        idx: 1,
        hp: getBossMaxHP(1, 1),
        timeUsed: 0,
        seq: [],
        usedMask: 0,
        charUses: new Uint8Array(0)
    }];

    const beamLimit = N <= 6 ? 720 : 1200;

    for (let step = 0; step < N; step++) {
        const byMask = new Map();
        for (let b = 0; b < beam.length; b++) {
            const st = beam[b];
            for (let i = 0; i < N; i++) {
                if (st.usedMask & (1 << i)) continue;
                const nextSt = evalStep(st, prepared[i]);
                if (!nextSt) continue;
                let bucket = byMask.get(nextSt.usedMask);
                if (!bucket) {
                    byMask.set(nextSt.usedMask, [nextSt]);
                } else {
                    let dominated = false;
                    for (let k = bucket.length - 1; k >= 0; k--) {
                        const ex = bucket[k];
                        const exBetterWave = (ex.r > nextSt.r) ||
                            (ex.r === nextSt.r && ex.idx > nextSt.idx) ||
                            (ex.r === nextSt.r && ex.idx === nextSt.idx && ex.hp <= nextSt.hp);
                        if (exBetterWave && ex.score >= nextSt.score && ex.timeUsed <= nextSt.timeUsed) {
                            dominated = true;
                            break;
                        }
                        const nextBetterWave = (nextSt.r > ex.r) ||
                            (nextSt.r === ex.r && nextSt.idx > ex.idx) ||
                            (nextSt.r === ex.r && nextSt.idx === ex.idx && nextSt.hp <= ex.hp);
                        if (nextBetterWave && nextSt.score >= ex.score && nextSt.timeUsed <= ex.timeUsed) {
                            bucket.splice(k, 1);
                        }
                    }
                    if (!dominated) bucket.push(nextSt);
                }
            }
        }
        const nextBeam = [];
        for (const bucket of byMask.values()) {
            for (let k = 0; k < bucket.length; k++) nextBeam.push(bucket[k]);
        }
        if (nextBeam.length === 0) break;
        nextBeam.sort((a, b) => (b.score - a.score) || (a.timeUsed - b.timeUsed));
        beam = nextBeam.length > beamLimit ? nextBeam.slice(0, beamLimit) : nextBeam;
    }

    const best = beam[0];
    if (!best || !best.seq || best.seq.length !== N) return validTeams;
    return best.seq.map(item => validTeams[item._slotIdx]);
}

export async function reverseInferAndOptimize(currentTeams, availableRots, charMaxUses, envSettings, customStatsMap, onProgress) {
    if (isEngineRunning) return { status: 'error', message: "引擎運算中" };
    isEngineRunning = true;
    try {
        const rawEnv = envSettings || {};
        const env = {
            ...rawEnv,
            matrixBuffId: rawEnv.matrixBuffId || 'auto'
        };
        initBossHPMap(env);
        let currentState = { r: 1, idx: 1, hp: getBossMaxHP(1, 1) };
        let discrepancies = [];

        let validTeams = currentTeams.filter(t => t.c1 && t.c1 !== '').map((t, idx) => {
            let r = availableRots.find(rot => rot.id === t.rotId);
            if (!r) {
                let matches = availableRots.filter(rot =>
                    rot.c1 === t.c1 && (
                        (rot.c2 === t.c2 && rot.c3 === t.c3) ||
                        (rot.c2 === t.c3 && rot.c3 === t.c2)
                    )
                );
                if (matches.length === 0) matches = availableRots.filter(rot => rot.c1 === t.c1);
                if (matches.length > 0) {
                    matches.sort((a, b) => b.dps - a.dps);
                    r = matches[0];
                    t.rotId = r.id;
                }
            }

            let theoryDps = r ? r.dps : 0;
            let rawDps = theoryDps;
            let usedScore = 0;

            if (t.inputMode === 'hp' && t.endBoss && t.endHpPct !== null && t.endHpPct !== '') {
                let parts = t.endBoss.replace('R', '').split('-');
                let endR = parseInt(parts[0]), endIdx = parseInt(parts[1]);
                let endHpAbs = getBossMaxHP(endR, endIdx) * (parseFloat(t.endHpPct || 0) / 100);
                usedScore = calcScoreBetweenStates(env, currentState.r, currentState.idx, currentState.hp, endR, endIdx, endHpAbs);
                t.score = usedScore.toFixed(0);
            } else {
                usedScore = parseFloat(t.score);
            }

            if (usedScore > 0) {
                let res = reverseCalculateDPS(usedScore, env, getCharElement(t.c1), t.c1, currentState);
                rawDps = res.dps * 1.03;
                if (theoryDps > 0) {
                    let diffRatio = (rawDps - theoryDps) / theoryDps;
                    if (Math.abs(diffRatio) > 0.15) {
                        discrepancies.push({
                            teamIndex: idx + 1,
                            bossKey: `R${res.endState.r}-${res.endState.idx}`,
                            currentBaseHp: getBossMaxHP(res.endState.r, res.endState.idx),
                            teamC1: t.c1,
                            rotId: t.rotId,
                            realDps: rawDps.toFixed(2),
                            theoryDps: theoryDps.toFixed(2),
                            suggestedHpAdjust: diffRatio > 0 ? '增加' : '減少',
                            diffPct: (diffRatio * 100).toFixed(1),
                            rawRatio: rawDps / theoryDps
                        });
                    }
                }
                currentState = res.endState;
            }

            const forcedId = t.forcedMatrixBuffId || null;
            return {
                ...t,
                index: idx,
                dps: rawDps || theoryDps,
                rawDps: rawDps || theoryDps,
                baseCritRates: t.baseCritRates || (r ? r.baseCritRates : {}),
                buffCritRates: t.buffCritRates || (r ? r.buffCritRates : {}),
                firstGridData: r ? r.firstGridData : null,
                firstDuration: r ? r.firstDuration : null,
                firstDps: r ? r.firstDps : null,
                firstTotalDmg: r ? r.firstTotalDmg : null,
                hasSwitchRot: t.hasSwitchRot ?? (r ? r.hasSwitchRot : false),
                switchDps: t.switchDps ?? (r ? r.switchDps : null),
                switchDuration: t.switchDuration ?? (r ? r.switchDuration : 20),
                switchGridData: t.switchGridData ?? (r ? r.switchGridData : []),
                calculatedMinDps: rawDps,
                _skipCritScale: usedScore > 0,
                teamAttr: getCharElement(t.c1),
                _originalScore: t.score,
                gridData: (r ? r.gridData : []),
                presetKeybindId: t.presetKeybindId || (r ? r.presetKeybindId : null),
                duration: (r ? r.duration : 25),
                forcedMatrixBuffId: forcedId,
                matrixBuffId: forcedId || null,
                _residualCache: new Map()
            };
        });

        if (validTeams.length === 0) return { status: 'error', message: "沙盤中無完整隊伍！" };

        if (onProgress) onProgress(30, 100);
        await new Promise(r => setTimeout(r, 0));

        // 真正搜尋最高分之隊伍出場順序
        const bestSeq = findBestTeamOrder(validTeams, env);

        let simMax = simulateAndGenerateReport(bestSeq, env, 'max');
        let simMin = simulateAndGenerateReport(bestSeq, env, 'min');
        let mergedTeams = simMin.teams.map((t, i) => ({
            ...t,
            scoreMin: t.score,
            reportMin: t.report,
            scoreMax: simMax.teams[i].score,
            reportMax: simMax.teams[i].report,
            appliedMatrixBuff: simMax.teams[i].appliedMatrixBuff || t.appliedMatrixBuff || null,
            appliedDualModes: simMax.teams[i].appliedDualModes || t.appliedDualModes || null
        }));
        mergedTeams.forEach(t => { if (t._originalScore !== undefined && t._originalScore !== "") t.scoreInput = t._originalScore; });

        if (onProgress) onProgress(100, 100);
        return {
            status: 'success',
            optimizedTeams: mergedTeams,
            finalScoreMax: simMax.score,
            finalScoreMin: simMin.score,
            globalTraceMax: simMax.trace,
            globalTraceMin: simMin.trace,
            discrepancies: discrepancies
        };
    } catch (err) {
        return { status: 'error', message: err.message };
    } finally {
        isEngineRunning = false;
    }
}

export function resimulateCurrentTeams(currentTeams, availableRots, envSettings = {}) {
    try {
        const rawEnv = envSettings || {};
        const env = {
            ...rawEnv,
            matrixBuffId: rawEnv.matrixBuffId || 'auto'
        };
        initBossHPMap(env);
        const validTeams = (currentTeams || []).filter(t => t && t.c1 && t.c1 !== '').map((t, idx) => {
            let r = availableRots.find(rot => rot.id === t.rotId);
            if (!r) {
                let matches = availableRots.filter(rot =>
                    rot.c1 === t.c1 && ((rot.c2 === t.c2 && rot.c3 === t.c3) || (rot.c2 === t.c3 && rot.c3 === t.c2))
                );
                if (matches.length === 0) matches = availableRots.filter(rot => rot.c1 === t.c1);
                if (matches.length > 0) {
                    matches.sort((a, b) => b.dps - a.dps);
                    r = matches[0];
                }
            }
            const forcedId = t.forcedMatrixBuffId || null;
            return {
                ...t,
                index: idx,
                rotId: r ? r.id : t.rotId,
                dps: r ? (r.rawDps || r.dps || 0) : (parseFloat(t.dps) || 0),
                rawDps: r ? (r.rawDps || r.dps || 0) : (parseFloat(t.rawDps || t.dps) || 0),
                baseCritRates: t.baseCritRates || (r ? r.baseCritRates : {}),
                buffCritRates: t.buffCritRates || (r ? r.buffCritRates : {}),
                firstGridData: r ? r.firstGridData : (t.firstGridData || null),
                firstDuration: r ? r.firstDuration : (t.firstDuration || null),
                firstDps: r ? r.firstDps : (t.firstDps || null),
                firstTotalDmg: r ? r.firstTotalDmg : (t.firstTotalDmg || null),
                hasSwitchRot: t.hasSwitchRot ?? (r ? r.hasSwitchRot : false),
                switchDps: t.switchDps ?? (r ? r.switchDps : null),
                switchDuration: t.switchDuration ?? (r ? r.switchDuration : 20),
                switchGridData: t.switchGridData ?? (r ? r.switchGridData : []),
                teamAttr: getCharElement(t.c1),
                gridData: r ? (r.gridData || []) : (t.gridData || []),
                presetKeybindId: t.presetKeybindId || (r ? r.presetKeybindId : null),
                duration: r ? (r.duration || 25) : (t.duration || 25),
                forcedMatrixBuffId: forcedId,
                matrixBuffId: forcedId || null,
                _skipCritScale: false,
                _residualCache: new Map()
            };
        });
        if (validTeams.length === 0) return { status: 'error', message: '沙盤中無完整隊伍！' };

        // 依據當前設定與強制 Buff 搜尋最高分之隊伍出場順序
        const bestSeq = findBestTeamOrder(validTeams, env);

        const simMax = simulateAndGenerateReport(bestSeq, env, 'max');
        const simMin = simulateAndGenerateReport(bestSeq, env, 'min');
        const mergedTeams = simMin.teams.map((t, i) => ({
            ...t,
            scoreMin: t.score,
            reportMin: t.report,
            scoreMax: simMax.teams[i].score,
            reportMax: simMax.teams[i].report,
            appliedMatrixBuff: simMax.teams[i].appliedMatrixBuff || t.appliedMatrixBuff || null,
            appliedDualModes: simMax.teams[i].appliedDualModes || t.appliedDualModes || null
        }));
        return {
            status: 'success',
            optimizedTeams: mergedTeams,
            finalScoreMax: simMax.score,
            finalScoreMin: simMin.score,
            globalTraceMax: simMax.trace,
            globalTraceMin: simMin.trace
        };
    } catch (err) {
        return { status: 'error', message: err.message };
    }
}