// src/core/store.js
import { reactive, shallowRef, markRaw, watch } from 'vue';
import { charData, characterOrder } from '../data/characters.js';
import { defaultDpsData } from '../data/rotations.js';
import { getDefaultSlotConfig, computeCharEffectiveStats, normalizeEchoSets, normalizeEchoCosts } from '../data/combatDb.js';

export const globalStore = reactive({
    ownedCharacters: new Set(),
    savedLineups: [],
    customStatsMap: {},
    teamDisplayCount: 16,
    activeDiffs: new Set(['🟩', '🔵', '⭐', '⚠️', '🧩']),
    charCritRates: {},
    charLoadouts: {},
    disabledRots: new Set()
});

export const dpsDataMap = shallowRef({});
globalStore.dpsDataMap = dpsDataMap.value;

export function initStore() {
    let tempMap = {};
    
    // 載入自訂角色庫
    try {
        const localCustomChars = JSON.parse(localStorage.getItem('ww_custom_characters') || '[]');
        localCustomChars.forEach(char => {
            charData[char.name] = {
                rarity: char.rarity,
                gen: char.gen,
                element: char.element || '衍射',
                max: char.max !== undefined ? char.max : 1,
                isCustom: true
            };
            if (!characterOrder.includes(char.name)) {
                characterOrder.push(char.name);
            }
        });
    } catch (e) {
        console.warn("自訂角色庫載入失敗", e);
    }

    try {
        defaultDpsData.forEach(d => {
            if (d && d.id) {
                tempMap[d.id] = markRaw(d);
            }
        });
    } catch (err) {
        console.error("官方排軸載入失敗", err);
    }

    try {
        const savedStats = localStorage.getItem('ww_custom_stats');
        if (savedStats) globalStore.customStatsMap = JSON.parse(savedStats);

        const savedCrit = localStorage.getItem('ww_char_crit_rates');
        if (savedCrit) globalStore.charCritRates = JSON.parse(savedCrit);

        const savedLoadouts = localStorage.getItem('ww_char_loadouts');
        if (savedLoadouts) {
            globalStore.charLoadouts = JSON.parse(savedLoadouts);
            // 同步各角色當前配置槽位的最新暴擊率（包含共鳴鏈與武器加成）
            for (const [cName, st] of Object.entries(globalStore.charLoadouts || {})) {
                if (st && Array.isArray(st.slots) && st.slots.length > 0) {
                    const activeIdx = st.activeSlot === 1 ? 1 : 0;
                    const slotObj = st.slots[activeIdx] || st.slots[0];
                    const eff = computeCharEffectiveStats(cName, slotObj);
                    globalStore.charCritRates[cName] = Math.min(100, eff.critRate);
                }
            }
        }

        const savedCustomRots = localStorage.getItem('ww_custom_rotations_v2');
        let customRots = savedCustomRots ? JSON.parse(savedCustomRots) : [];
        
        customRots.forEach(d => {
            let internalId = 'custom_rot_' + d.id;
            tempMap[internalId] = markRaw({
                id: internalId, 
                c1: d.c1, 
                c2: d.c2, 
                c3: d.c3,
                dps: d.dps, 
                rot: d.rot || "自訂排軸", 
                diff: d.diff || "🧩",
                duration: d.duration || 25, 
                totalDmg: d.totalDmg || (d.dps * 25),
                isUserCustom: true,
                baseCritRates: d.baseCritRates || d.critRates || {},
                buffCritRates: d.buffCritRates || d.extraCritRates || {},
                gridData: d.gridData || [],
                // 🌟 轉場專用排軸資料
                hasSwitchRot: !!d.hasSwitchRot,
                switchDps: d.switchDps || null,
                switchDuration: d.switchDuration || 20,
                switchTotalDmg: d.switchTotalDmg || 0,
                switchGridData: d.switchGridData || []
            });
        });
    } catch (e) {
        console.warn("自訂資料庫初始化失敗", e);
    }

    dpsDataMap.value = tempMap;
    globalStore.dpsDataMap = tempMap;

    const savedChars = localStorage.getItem('ww_owned_chars') || localStorage.getItem('ww_roster');
    if (savedChars && savedChars !== '{}') {
        try {
            const parsed = JSON.parse(savedChars);
            if (Array.isArray(parsed)) {
                globalStore.ownedCharacters.clear();
                parsed.forEach(c => globalStore.ownedCharacters.add(c));
            }
        } catch (e) {
            console.error("角色庫讀取失敗", e);
        }
    }

    try {
        const savedDisabled = JSON.parse(localStorage.getItem('ww_disabled_rots') || '[]');
        if (Array.isArray(savedDisabled)) {
            globalStore.disabledRots.clear();
            savedDisabled.forEach(id => globalStore.disabledRots.add(id));
        }
    } catch (e) {
        console.warn("禁用排軸清單讀取失敗", e);
    }
}

initStore();

let saveCharsTimeout = null;
watch(() => Array.from(globalStore.ownedCharacters), (newVal) => {
    if (saveCharsTimeout) clearTimeout(saveCharsTimeout);
    saveCharsTimeout = setTimeout(() => {
        try {
            localStorage.setItem('ww_owned_chars', JSON.stringify(newVal));
        } catch (e) {}
    }, 300);
}, { deep: true });

// ============================
// 角色雙專屬槽位配置管理 (Slot 1 & Slot 2)
// ============================
function persistCharLoadouts() {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ww_char_loadouts', JSON.stringify(globalStore.charLoadouts));
        }
    } catch (e) {}
}

function normalizeSlotData(charName, slotIdx, slotData) {
    const base = getDefaultSlotConfig(charName, slotIdx);
    const merged = { ...base, ...(slotData || {}) };
    if (slotData && slotData.echoSetId !== undefined && !Array.isArray(slotData.echoSets)) {
        merged.echoSets = normalizeEchoSets({ echoSetId: slotData.echoSetId });
    } else {
        merged.echoSets = normalizeEchoSets(merged);
    }
    merged.echoCosts = normalizeEchoCosts(merged);
    const firstActiveSet = merged.echoSets.find(s => Number(s.setId) > 0 && Number(s.pieces) > 0) || merged.echoSets[0];
    merged.echoSetId = Number(firstActiveSet?.setId || merged.echoSetId || 0);
    merged.rc = Math.max(0, Math.min(6, Math.round(Number(merged.rc) || 0)));
    return merged;
}

export function getCharLoadoutState(charName) {
    if (!charName) return { activeSlot: 0, slots: [getDefaultSlotConfig('', 0), getDefaultSlotConfig('', 1)] };
    const key = charName;
    if (!globalStore.charLoadouts[key] || !Array.isArray(globalStore.charLoadouts[key].slots)) {
        const s0 = getDefaultSlotConfig(key, 0);
        const s1 = getDefaultSlotConfig(key, 1);
        // 若使用者先前已有設定暴擊率，保留進槽位 1
        if (globalStore.charCritRates[key] !== undefined && !isNaN(parseFloat(globalStore.charCritRates[key]))) {
            const targetCr = parseFloat(globalStore.charCritRates[key]);
            const cur = computeCharEffectiveStats(key, s0, { triggerPassives: s0.triggerPassives !== false });
            s0.echoCritRate = Math.max(0, Number((s0.echoCritRate + (targetCr - cur.critRate)).toFixed(1)));
        }
        globalStore.charLoadouts[key] = { activeSlot: 0, slots: [s0, s1] };
    }
    while (globalStore.charLoadouts[key].slots.length < 2) {
        globalStore.charLoadouts[key].slots.push(getDefaultSlotConfig(key, globalStore.charLoadouts[key].slots.length));
    }
    // 確保舊存檔升級為 3 聲骸套裝 + 5 聲骸 Cost 結構
    for (let i = 0; i < 2; i++) {
        const s = globalStore.charLoadouts[key].slots[i];
        if (!Array.isArray(s?.echoSets) || s.echoSets.length !== 3 || !Array.isArray(s?.echoCosts) || s.echoCosts.length !== 5) {
            globalStore.charLoadouts[key].slots[i] = normalizeSlotData(key, i, s);
        }
    }
    return globalStore.charLoadouts[key];
}

export function getActiveCharSlot(charName) {
    const state = getCharLoadoutState(charName);
    const idx = state.activeSlot === 1 ? 1 : 0;
    return state.slots[idx] || state.slots[0];
}

export function getCharStats(charName, slotIdx = null, options = {}) {
    const state = getCharLoadoutState(charName);
    const idx = slotIdx === 0 || slotIdx === 1 ? slotIdx : (state.activeSlot === 1 ? 1 : 0);
    const slot = state.slots[idx] || state.slots[0];
    return computeCharEffectiveStats(charName, slot, options);
}

export function switchCharSlot(charName, slotIdx) {
    const state = getCharLoadoutState(charName);
    state.activeSlot = slotIdx === 1 ? 1 : 0;
    const stats = computeCharEffectiveStats(charName, state.slots[state.activeSlot]);
    globalStore.charCritRates[charName] = Math.min(100, stats.critRate);
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ww_char_crit_rates', JSON.stringify(globalStore.charCritRates));
        }
    } catch (e) {}
    persistCharLoadouts();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ww-loadout-updated', { detail: { charName } }));
    }
    return state;
}

export function saveCharSlot(charName, slotIdx, slotData, setActive = true) {
    const state = getCharLoadoutState(charName);
    const idx = slotIdx === 1 ? 1 : 0;
    state.slots[idx] = normalizeSlotData(charName, idx, slotData);
    if (setActive) state.activeSlot = idx;
    const activeSlotObj = state.slots[state.activeSlot];
    const activeStats = computeCharEffectiveStats(charName, activeSlotObj);
    globalStore.charCritRates[charName] = Math.min(100, activeStats.critRate);
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ww_char_crit_rates', JSON.stringify(globalStore.charCritRates));
        }
    } catch (e) {}
    persistCharLoadouts();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ww-loadout-updated', { detail: { charName } }));
    }
    return idx === state.activeSlot ? activeStats : computeCharEffectiveStats(charName, state.slots[idx]);
}

export function setCharResonanceChain(charName, rcVal, slotIdx = null) {
    const state = getCharLoadoutState(charName);
    const idx = slotIdx === 0 || slotIdx === 1 ? slotIdx : (state.activeSlot === 1 ? 1 : 0);
    const clampedRc = Math.max(0, Math.min(6, Math.round(Number(rcVal) || 0)));
    const updated = { ...(state.slots[idx] || getDefaultSlotConfig(charName, idx)), rc: clampedRc };
    return saveCharSlot(charName, idx, updated, false);
}