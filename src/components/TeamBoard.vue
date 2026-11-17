<!-- src/components/TeamBoard.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, inject, nextTick } from 'vue';
import { globalStore, dpsDataMap, getCharLoadoutState } from '../core/store.js';
import { characterOrder, charData } from '../data/characters.js';
import { autoBuildMaxDpsTeams, reverseInferAndOptimize, resolveTeamEffectiveInputs, applyMonteCarloDps, resimulateCurrentTeams } from '../core/core.js';
import { getMatrixBuffsByVersion } from '../data/combatDb.js';
import BattleVisualizer from './BattleVisualizer.vue';

const t = inject('t') || ((str) => str);

const finalScoreMax = ref(0);
const finalScoreMin = ref(0);
const globalTraceMax = ref([]);
const globalTraceMin = ref([]);
const isCalculating = ref(false);
const calcProgress = ref(0);
const engineDepth = ref(0);
const maxTeamsTarget = ref(10);
const reverseDiscrepancies = ref([]);

const envRefreshTick = ref(0);
const handleEnvOrLoadoutChanged = () => {
  envRefreshTick.value++;
  const envStr = localStorage.getItem('ww_env_global');
  if (envStr) {
    try {
      const parsed = JSON.parse(envStr);
      if (parsed.searchDepth !== undefined) engineDepth.value = parsed.searchDepth;
      if (parsed.maxTeamsTarget !== undefined) maxTeamsTarget.value = parsed.maxTeamsTarget;
    } catch (e) {}
  }
};

const isDesktop = ref(window.innerWidth >= 1024);
const isMobileStaminaExpanded = ref(false);
const handleResize = () => { isDesktop.value = window.innerWidth >= 1024; };

const sidebarOffset = ref(0);
const flexContainerRef = ref(null);
const sidebarRef = ref(null);

let scrollRaf = null;
const handleScroll = () => {
    if (!isDesktop.value || !flexContainerRef.value || !sidebarRef.value) {
        sidebarOffset.value = 0; 
        return;
    }
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        if (!flexContainerRef.value || !sidebarRef.value) return;
        const containerRect = flexContainerRef.value.getBoundingClientRect();
        const sidebarHeight = sidebarRef.value.offsetHeight;
        const offsetTop = 104; 
        
        if (containerRect.top < offsetTop) {
            let maxOffset = containerRect.height - sidebarHeight;
            let currentOffset = offsetTop - containerRect.top;
            sidebarOffset.value = Math.max(0, Math.min(currentOffset, maxOffset));
        } else {
            sidebarOffset.value = 0;
        }
    });
};

// 漂泊者屬性設定與二次確認彈窗
const ROVER_VARIANTS = ['光主', '暗主', '風主', '雷主', '火主', '冰主'];
const getBaseChar = (n) => ROVER_VARIANTS.includes(n) ? '漂泊者' : n;

const showRoverSelectModal = ref(false);
const pendingRoverDrop = ref(null);

const onCharDragStart = (charName, event) => { 
    event.dataTransfer.effectAllowed = 'copy'; 
    event.dataTransfer.setData('text/plain', charName); 
};

const handleRoverSelection = (selectedRover) => { 
    if (pendingRoverDrop.value) { 
        const { team, slotKey } = pendingRoverDrop.value;
        if (isDuplicateInTeam(team, slotKey, selectedRover)) {
            alert(t('⚠️ 隊伍中不能包含重複的角色！'));
        } else if (isExhausted(selectedRover, team[slotKey])) {
            alert(t('⚠️ 該角色剩餘耐力不足，無法繼續編入隊伍！'));
        } else {
            team[slotKey] = selectedRover; 
            onCharacterChange(team); 
        }
    } 
    showRoverSelectModal.value = false; 
    pendingRoverDrop.value = null; 
};

const cancelRoverSelection = () => { 
    showRoverSelectModal.value = false; 
    pendingRoverDrop.value = null; 
};

const onCharDrop = (team, slotKey, event) => {
    let charName = event.dataTransfer.getData('text/plain');
    if (!charName) return; 
    charName = charName.trim();
    if (charName.includes('漂泊者') || charName.includes('Rover') || charName.includes('主')) {
        if (isDuplicateInTeam(team, slotKey, '漂泊者')) {
            alert(t('⚠️ 隊伍中不能包含重複的角色！'));
            return;
        }
        if (isExhausted('漂泊者', team[slotKey])) {
            alert(t('⚠️ 該角色剩餘耐力不足，無法繼續編入隊伍！'));
            return;
        }
        pendingRoverDrop.value = { team, slotKey }; 
        showRoverSelectModal.value = true;
    } else {
        if (isDuplicateInTeam(team, slotKey, charName)) {
            alert(t('⚠️ 隊伍中不能包含重複的角色！'));
            return;
        }
        if (isExhausted(charName, team[slotKey])) {
            alert(t('⚠️ 該角色剩餘耐力不足，無法繼續編入隊伍！'));
            return;
        }
        team[slotKey] = charName; 
        onCharacterChange(team); 
    }
};

// 耐力管理彈窗與數值控制 (1~3 次)
const showStaminaModal = ref(false);
const staminaSearchQuery = ref('');
const customStaminaMap = ref({});
const multiUseChars = ['維里奈', '守岸人', '白芷', '卜靈', '莫寧'];

const getDefaultMaxUse = (charName) => {
  const baseName = getBaseChar(charName);
  return multiUseChars.includes(baseName) ? 2 : 1;
};

const getCharMaxUse = (charName) => {
  if (!charName) return 1;
  const baseName = getBaseChar(charName);
  if (customStaminaMap.value[baseName] !== undefined) return customStaminaMap.value[baseName];
  if (charData[baseName]?.max !== undefined) return charData[baseName].max;
  return getDefaultMaxUse(baseName);
};

const isStaminaModified = (charName) => {
  const baseName = getBaseChar(charName);
  return customStaminaMap.value[baseName] !== undefined && customStaminaMap.value[baseName] !== getDefaultMaxUse(baseName);
};

const setCharStamina = (charName, targetValue) => {
  const baseName = getBaseChar(charName);
  const val = Math.min(3, Math.max(1, targetValue));
  const defaultVal = getDefaultMaxUse(baseName);
  
  if (val === defaultVal) {
    delete customStaminaMap.value[baseName];
  } else {
    customStaminaMap.value[baseName] = val;
  }

  if (charData[baseName]) {
    charData[baseName].max = val;
  }
  localStorage.setItem('ww_char_stamina_bytes', JSON.stringify(customStaminaMap.value));
};

const resetAllStaminaToDefault = () => {
  if (confirm(t('確定要將所有角色的耐力上限恢復為預設值嗎？'))) {
    customStaminaMap.value = {};
    Object.keys(charData).forEach(name => {
      charData[name].max = getDefaultMaxUse(name);
    });
    localStorage.removeItem('ww_char_stamina_bytes');
  }
};

onMounted(() => {
  try {
    const savedStamina = JSON.parse(localStorage.getItem('ww_char_stamina_bytes') || '{}');
    customStaminaMap.value = savedStamina;
    Object.keys(savedStamina).forEach(bName => {
      if (charData[bName]) charData[bName].max = savedStamina[bName];
    });
  } catch (e) {}

  const savedV4 = localStorage.getItem('ww_saved_lineups_v4');
  if (savedV4) {
    try {
      const parsed = JSON.parse(savedV4);
      if (parsed && parsed.length > 0) globalStore.savedLineups.splice(0, globalStore.savedLineups.length, ...parsed);
    } catch (e) {}
  } else {
    for (let i = 0; i < 3; i++) addTeam();
  }
  
  const envStr = localStorage.getItem('ww_env_global');
  if (envStr) {
    try {
      const parsed = JSON.parse(envStr);
      if (parsed.searchDepth !== undefined) engineDepth.value = parsed.searchDepth;
      if (parsed.maxTeamsTarget !== undefined) maxTeamsTarget.value = parsed.maxTeamsTarget;
    } catch (e) {}
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('ww-env-updated', handleEnvOrLoadoutChanged);
  window.addEventListener('ww-loadout-updated', handleEnvOrLoadoutChanged);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('ww-env-updated', handleEnvOrLoadoutChanged);
  window.removeEventListener('ww-loadout-updated', handleEnvOrLoadoutChanged);
});

// 出戰次數計算
const usedCounts = computed(() => {
  const counts = {};
  globalStore.savedLineups.forEach(team => { 
    if (team.c1) counts[getBaseChar(team.c1)] = (counts[getBaseChar(team.c1)] || 0) + 1;
    if (team.c2) counts[getBaseChar(team.c2)] = (counts[getBaseChar(team.c2)] || 0) + 1;
    if (team.c3) counts[getBaseChar(team.c3)] = (counts[getBaseChar(team.c3)] || 0) + 1;
  }); 
  return counts;
});

const isExhausted = (charName, currentSlotChar) => { 
  if (!charName) return false;
  const baseName = getBaseChar(charName); 
  const currentBase = currentSlotChar ? getBaseChar(currentSlotChar) : null;
  if (baseName === currentBase) return false; 
  return (usedCounts.value[baseName] || 0) >= getCharMaxUse(baseName); 
};

const isDuplicateInTeam = (team, slotKey, charName) => {
  if (!charName || !team) return false;
  const targetBase = getBaseChar(charName);
  return ['c1', 'c2', 'c3'].some(k => k !== slotKey && team[k] && getBaseChar(team[k]) === targetBase);
};

const isSlotOptionDisabled = (team, slotKey, charName) => {
  return isExhausted(charName, team[slotKey]) || isDuplicateInTeam(team, slotKey, charName);
};

const ownedCharactersList = computed(() => {
    let list = [];
    let roverCfg = null;
    try {
        roverCfg = JSON.parse(localStorage.getItem('ww_rover_config') || 'null');
    } catch (e) {}

    characterOrder.forEach(c => { 
        if (globalStore.ownedCharacters.has(c)) { 
            if (c === '漂泊者') { 
                ROVER_VARIANTS.forEach(rName => {
                    if (roverCfg && roverCfg[rName]) {
                        if (roverCfg[rName].enabled) list.push(rName);
                    } else if (['光主', '暗主', '風主', '雷主'].includes(rName)) {
                        list.push(rName);
                    }
                });
            } else { 
                list.push(c); 
            } 
        } 
    });
    return list;
});

const staminaStats = computed(() => {
  const _ = customStaminaMap.value;
  let surv = [], dps = []; 
  const processedBases = new Set();
  
  ownedCharactersList.value.forEach(c => {
    const baseC = getBaseChar(c);
    if (processedBases.has(baseC)) return; 
    processedBases.add(baseC);
    
    const max = getCharMaxUse(baseC); 
    const rem = max - (usedCounts.value[baseC] || 0);
    const isMod = isStaminaModified(baseC);
    const charDataObj = { name: baseC, rem, max, isMod };
    
    if (max > 1) surv.push(charDataObj); 
    else dps.push(charDataObj);
  });
  
  const sorter = (a, b) => (b.rem > 0) - (a.rem > 0);
  surv.sort(sorter); 
  dps.sort(sorter); 
  return { surv, dps };
});

const modalFilteredCharacters = computed(() => {
  const q = staminaSearchQuery.value.trim().toLowerCase();
  const list = [];
  const processed = new Set();
  
  characterOrder.forEach(c => {
    const base = getBaseChar(c);
    if (processed.has(base)) return;
    processed.add(base);
    if (!q || base.toLowerCase().includes(q)) {
      list.push({
        name: base,
        currentMax: getCharMaxUse(base),
        defaultMax: getDefaultMaxUse(base),
        isMod: isStaminaModified(base)
      });
    }
  });
  return list;
});

const getAvailableRotations = (team) => { 
    if (!team.c1) return []; 
    return Object.values(dpsDataMap.value || {})
        .filter(r => r.c1 === team.c1
            && ((r.c2 === team.c2 && r.c3 === team.c3) || (r.c2 === team.c3 && r.c3 === team.c2))
            && globalStore.activeDiffs.has(r.diff)
            && !globalStore.disabledRots.has(r.id))
        .sort((a,b) => b.dps - a.dps); 
};

const getDiffText = (diffEmoji) => ({ '⚠️': t('極難'), '⭐': t('進階'), '🔵': t('中等'), '🟩': t('輪椅'), '🧩': t('非主流') }[diffEmoji] || t('未知'));

const onCharacterChange = (team) => { 
    const matches = getAvailableRotations(team); 
    team.rotId = matches.length > 0 ? matches[0].id : 'generic_fallback'; 
};

const getEnvSettings = () => { 
    try {
        const envStr = localStorage.getItem('ww_env_global'); 
        return envStr ? JSON.parse(envStr) : undefined; 
    } catch (e) {
        return undefined;
    }
};

const getRotEffectiveMeta = (rot, teamOverride = null) => {
    const _t = envRefreshTick.value;
    const _l = globalStore.charLoadouts;
    if (!rot || !rot.c1) return { baseDps: '0.00', effDps: '0.00', isModified: false, matrixName: '', matrixMult: 1.0, rcBadges: [], dualModeBadges: [] };
    const env = getEnvSettings() || {};
    const effectiveBuffId = teamOverride?.forcedMatrixBuffId || env.matrixBuffId || 'auto';
    const res = resolveTeamEffectiveInputs(
        { ...rot, forcedMatrixBuffId: teamOverride?.forcedMatrixBuffId || null, matrixBuffId: effectiveBuffId },
        { ...env, matrixBuffId: effectiveBuffId }
    );
    const effTeam = {
        ...rot,
        gridData: res.gridData,
        firstGridData: res.firstGridData,
        baseCritRates: res.baseCritRates
    };
    const effDpsNum = applyMonteCarloDps(effTeam, env, 'expected', res.loopBaseDps);
    const baseDpsNum = parseFloat(rot.rawDps || rot.dps) || 0;
    const rcBadges = [rot.c1, rot.c2, rot.c3].filter(Boolean).map(c => {
        const b = getBaseChar(c);
        const st = getCharLoadoutState(b);
        const idx = st?.activeSlot === 1 ? 1 : 0;
        return { char: c, rc: Number(st?.slots?.[idx]?.rc || 0), slot: idx + 1 };
    });
    const dualModes = teamOverride?.appliedDualModes || res.appliedDualModes || {};
    const dualModeBadges = Object.entries(dualModes).map(([char, mode]) => ({ char, mode }));
    const matrixName = (res.appliedMatrixBuff && res.appliedMatrixBuff.buffId !== 'none')
        ? `${res.appliedMatrixBuff.name} (x${res.matrixMult.toFixed(2)})`
        : '';
    return {
        baseDps: baseDpsNum.toFixed(2),
        effDps: effDpsNum.toFixed(2),
        isModified: Math.abs(effDpsNum - baseDpsNum) >= 0.02 || Boolean(matrixName) || rcBadges.some(b => b.rc > 0),
        matrixName,
        matrixMult: res.matrixMult || 1.0,
        rcBadges,
        dualModeBadges
    };
};

const getTeamActiveRotMeta = (team) => {
    const _t = envRefreshTick.value;
    const _l = globalStore.charLoadouts;
    if (!team || !team.c1) return null;
    const rot = (dpsDataMap.value || {})[team.rotId] || getAvailableRotations(team)[0];
    if (rot) return getRotEffectiveMeta(rot, team);
    const rcBadges = [team.c1, team.c2, team.c3].filter(Boolean).map(c => {
        const b = getBaseChar(c);
        const st = getCharLoadoutState(b);
        const idx = st?.activeSlot === 1 ? 1 : 0;
        return { char: c, rc: Number(st?.slots?.[idx]?.rc || 0), slot: idx + 1 };
    });
    return { baseDps: '0.00', effDps: '0.00', isModified: true, matrixName: '', matrixMult: 1.0, rcBadges };
};

const calcElapsedSec = ref(0);

const handleAutoBuild = async () => {
    const availableRots = Object.values(dpsDataMap.value || {}).filter(r => globalStore.ownedCharacters.has(getBaseChar(r.c1)) && globalStore.ownedCharacters.has(getBaseChar(r.c2)) && globalStore.ownedCharacters.has(getBaseChar(r.c3)) && globalStore.activeDiffs.has(r.diff) && !globalStore.disabledRots.has(r.id));
    if (availableRots.length === 0) return alert(t('⚠️ 沒有符合條件的排軸！請確認您擁有的角色與難度篩選。'));
    
    const charMaxUses = {};
    ownedCharactersList.value.forEach(c => { 
        const base = getBaseChar(c); 
        charMaxUses[c] = getCharMaxUse(base); 
        charMaxUses[base] = charMaxUses[c]; 
    });

    let env = getEnvSettings() || {}; 
    env.searchDepth = engineDepth.value; 
    isCalculating.value = true; 
    calcProgress.value = 0; 
    calcElapsedSec.value = 0;
    const t0 = performance.now();
    const timer = setInterval(() => { calcElapsedSec.value = (performance.now() - t0) / 1000; }, 100);
    reverseDiscrepancies.value = [];
    let result;
    try {
        result = await autoBuildMaxDpsTeams(availableRots, charMaxUses, env, globalStore.customStatsMap, maxTeamsTarget.value, engineDepth.value, (current, total) => { calcProgress.value = Math.floor((current / total) * 100); });
    } finally {
        clearInterval(timer);
        isCalculating.value = false;
    }
    if (result.status === 'success') {
        globalStore.savedLineups.splice(0, globalStore.savedLineups.length);
        result.optimizedTeams.forEach(team => {
            globalStore.savedLineups.push({
                c1: team.c1, c2: team.c2, c3: team.c3, rotId: team.rotId, score: team.scoreInput || '', inputMode: 'score', endBoss: 'R1-1', endHpPct: null,
                scoreMax: team.scoreMax, scoreMin: team.scoreMin, reportMax: team.reportMax, reportMin: team.reportMin, duration: team.duration,
                forcedMatrixBuffId: team.forcedMatrixBuffId || null,
                matrixBuffId: team.forcedMatrixBuffId || null,
                appliedMatrixBuff: team.appliedMatrixBuff || null,
                appliedDualModes: team.appliedDualModes || null,
                transitionEvents: team.transitionEvents || [],
                rotationStateSummary: team.rotationStateSummary || null
            });
        });
        finalScoreMax.value = result.finalScoreMax; 
        finalScoreMin.value = result.finalScoreMin; 
        globalTraceMax.value = result.globalTraceMax; 
        globalTraceMin.value = result.globalTraceMin;
        try { localStorage.setItem('ww_saved_lineups_v4', JSON.stringify(globalStore.savedLineups)); } catch (e) {}
        nextTick(() => { document.getElementById('battle-report-node')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    } else { alert(t('❌ 運算失敗：') + result.message); }
};

const handleReverseInfer = async () => {
    const allRotsUnfiltered = Object.values(dpsDataMap.value || {});
    const charMaxUses = {};
    ownedCharactersList.value.forEach(c => { 
        const base = getBaseChar(c); 
        charMaxUses[c] = getCharMaxUse(base); 
        charMaxUses[base] = charMaxUses[c]; 
    });

    const currentTeams = JSON.parse(JSON.stringify(globalStore.savedLineups));
    const activeTeams = currentTeams.filter(t => t.c1 !== '');
    if (activeTeams.length === 0) return alert(t('⚠️ 沙盤為空，沒有隊伍可以進行反推！'));
    isCalculating.value = true; 
    calcProgress.value = 0; 
    calcElapsedSec.value = 0;
    const t0 = performance.now();
    const timer = setInterval(() => { calcElapsedSec.value = (performance.now() - t0) / 1000; }, 100);
    reverseDiscrepancies.value = [];
    let result;
    try {
        result = await reverseInferAndOptimize(currentTeams, allRotsUnfiltered, charMaxUses, getEnvSettings(), globalStore.customStatsMap, (current, total) => { calcProgress.value = Math.floor((current / total) * 100); });
    } finally {
        clearInterval(timer);
        isCalculating.value = false;
    }
    if (result.status === 'success') {
        globalStore.savedLineups.splice(0, globalStore.savedLineups.length);
        result.optimizedTeams.forEach((team, idx) => {
            const orig = (team.index !== undefined && activeTeams[team.index]) ? activeTeams[team.index] : (activeTeams[idx] || {});
            const forcedId = team.forcedMatrixBuffId || orig.forcedMatrixBuffId || null;
            globalStore.savedLineups.push({
                c1: team.c1, c2: team.c2, c3: team.c3, rotId: team.rotId, score: team.scoreInput || team.score || orig.score || '', 
                inputMode: orig.inputMode || 'score', endBoss: orig.endBoss || 'R1-1', endHpPct: orig.endHpPct,
                scoreMax: team.scoreMax, scoreMin: team.scoreMin, reportMax: team.reportMax, reportMin: team.reportMin, duration: team.duration,
                forcedMatrixBuffId: forcedId,
                matrixBuffId: forcedId,
                appliedMatrixBuff: team.appliedMatrixBuff || null,
                appliedDualModes: team.appliedDualModes || null,
                transitionEvents: team.transitionEvents || [],
                rotationStateSummary: team.rotationStateSummary || null
            });
        });
        reverseDiscrepancies.value = result.discrepancies || [];
        finalScoreMax.value = result.finalScoreMax; 
        finalScoreMin.value = result.finalScoreMin; 
        globalTraceMax.value = result.globalTraceMax; 
        globalTraceMin.value = result.globalTraceMin;
        try { localStorage.setItem('ww_saved_lineups_v4', JSON.stringify(globalStore.savedLineups)); } catch (e) {}
        nextTick(() => { document.getElementById('battle-report-node')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    } else { alert(t('❌ 運算失敗：') + result.message); }
};

const matrixBuffOptions = computed(() => {
    const _t = envRefreshTick.value;
    const env = getEnvSettings() || {};
    const ver = env.matrixVersion || '3.8';
    return getMatrixBuffsByVersion(ver);
});

const handleResimulateWithForcedBuffs = async () => {
    const allRots = Object.values(dpsDataMap.value || {});
    const env = getEnvSettings() || {};
    const currentTeams = JSON.parse(JSON.stringify(globalStore.savedLineups));
    const activeTeams = currentTeams.filter(t => t.c1 && t.c1 !== '');
    if (activeTeams.length === 0) return alert(t('⚠️ 沙盤為空，沒有隊伍可以重排！'));
    isCalculating.value = true;
    calcProgress.value = 35;
    calcElapsedSec.value = 0;
    const t0 = performance.now();
    const timer = setInterval(() => { calcElapsedSec.value = (performance.now() - t0) / 1000; }, 100);
    await new Promise(r => setTimeout(r, 0));
    let result;
    try {
        result = resimulateCurrentTeams(currentTeams, allRots, env);
        calcProgress.value = 100;
    } finally {
        clearInterval(timer);
        isCalculating.value = false;
    }
    if (result.status === 'success') {
        globalStore.savedLineups.splice(0, globalStore.savedLineups.length);
        result.optimizedTeams.forEach((team, idx) => {
            const orig = (team.index !== undefined && activeTeams[team.index]) ? activeTeams[team.index] : (activeTeams[idx] || {});
            const forcedId = team.forcedMatrixBuffId || orig.forcedMatrixBuffId || null;
            globalStore.savedLineups.push({
                c1: team.c1, c2: team.c2, c3: team.c3, rotId: team.rotId, score: orig.score || '',
                inputMode: orig.inputMode || 'score', endBoss: orig.endBoss || 'R1-1', endHpPct: orig.endHpPct,
                scoreMax: team.scoreMax, scoreMin: team.scoreMin, reportMax: team.reportMax, reportMin: team.reportMin, duration: team.duration,
                forcedMatrixBuffId: forcedId,
                matrixBuffId: forcedId,
                appliedMatrixBuff: team.appliedMatrixBuff || null,
                appliedDualModes: team.appliedDualModes || null,
                transitionEvents: team.transitionEvents || [],
                rotationStateSummary: team.rotationStateSummary || null
            });
        });
        finalScoreMax.value = result.finalScoreMax;
        finalScoreMin.value = result.finalScoreMin;
        globalTraceMax.value = result.globalTraceMax;
        globalTraceMin.value = result.globalTraceMin;
        try { localStorage.setItem('ww_saved_lineups_v4', JSON.stringify(globalStore.savedLineups)); } catch (e) {}
    } else {
        alert(t('❌ 重排失敗：') + result.message);
    }
};

const onForceTeamMatrixBuffChange = (team, buffVal) => {
    team.forcedMatrixBuffId = buffVal || null;
    team.matrixBuffId = buffVal || null;
    handleResimulateWithForcedBuffs();
};

const displayScoreMax = computed(() => finalScoreMax.value > 0 ? finalScoreMax.value : globalStore.savedLineups.reduce((sum, t) => sum + (parseFloat(t.scoreMax) || 0), 0));
const displayScoreMin = computed(() => finalScoreMin.value > 0 ? finalScoreMin.value : globalStore.savedLineups.reduce((sum, t) => sum + (parseFloat(t.scoreMin) || 0), 0));

const addTeam = () => { 
    globalStore.savedLineups.push({ 
        c1: '', c2: '', c3: '', rotId: '', score: '', inputMode: 'score', 
        endBoss: 'R1-1', endHpPct: null, scoreMax: 0, scoreMin: 0, reportMax: '', reportMin: '',
        transitionEvents: [], rotationStateSummary: null
    }); 
};

const removeTeam = (index) => { globalStore.savedLineups.splice(index, 1); };

const saveTeams = () => { 
    try { localStorage.setItem('ww_saved_lineups_v4', JSON.stringify(globalStore.savedLineups)); } catch (e) {}
    alert(t('✅ 當前沙盤已成功暫存！')); 
};

const clearTeams = () => { 
    if (confirm(t('確定要清空沙盤嗎？'))) { 
        globalStore.savedLineups.splice(0, globalStore.savedLineups.length); 
        for (let i = 0; i < 3; i++) {
            globalStore.savedLineups.push({ 
                c1: '', c2: '', c3: '', rotId: '', score: '', inputMode: 'score', 
                endBoss: 'R1-1', endHpPct: null, scoreMax: 0, scoreMin: 0, reportMax: '', reportMin: '',
                transitionEvents: [], rotationStateSummary: null
            });
        }
        localStorage.removeItem('ww_saved_lineups_v4'); 
        reverseDiscrepancies.value = [];
        finalScoreMax.value = 0; 
        finalScoreMin.value = 0; 
        globalTraceMax.value = []; 
        globalTraceMin.value = []; 
    } 
};
</script>

<template>
  <div class="relative w-full">
    
    <div class="flex flex-col xl:flex-row gap-5 items-start w-full relative" ref="flexContainerRef">
      
      <!-- 左側可用出戰次數 / 耐力面板 -->
      <div class="w-full xl:w-[320px] shrink-0 z-30 transition-transform duration-500 ease-out bg-main/95 xl:bg-transparent rounded-xl" 
           ref="sidebarRef"
           :class="isDesktop ? 'static' : 'sticky top-[104px] pb-2 mb-2 shadow-sm border border-glass xl:border-none xl:shadow-none'"
           :style="isDesktop ? { transform: `translateY(${sidebarOffset}px)` } : {}">
         
         <!-- 手機版折疊抽屜 (次級內容) -->
         <div class="flex xl:hidden flex-col px-3 pt-2">
           <div class="flex justify-between items-center bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 shadow-sm">
             <div @click="isMobileStaminaExpanded = !isMobileStaminaExpanded" class="flex items-center gap-2 flex-1 min-w-0 pr-2 cursor-pointer">
               <span class="text-gold font-bold text-sm flex items-center gap-1 shrink-0">⏳ {{ t('耐力剩餘') }}</span>
               <span class="text-xs font-bold text-gray-300 bg-black/40 px-2 py-0.5 rounded-full border border-gray-700 truncate">
                 <span class="text-emerald-400">{{ staminaStats.surv.filter(c => c.rem > 0).length }}</span> {{ t('生存位') }} / 
                 <span class="text-blue-400">{{ staminaStats.dps.filter(c => c.rem > 0).length }}</span> {{ t('一般角色') }}
               </span>
             </div>
             <div class="flex items-center gap-2 shrink-0">
               <button @click.stop="showStaminaModal = true" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1">
                 ⚙️ {{ t('設定') }}
               </button>
               <span @click="isMobileStaminaExpanded = !isMobileStaminaExpanded" class="text-xs text-gray-400 font-bold bg-gray-900 px-2 py-1 rounded border border-gray-700 transition-colors cursor-pointer" :class="isMobileStaminaExpanded ? 'text-amber-400 border-amber-500/50' : ''">
                 {{ isMobileStaminaExpanded ? '▲' : '▼' }}
               </span>
             </div>
           </div>

           <div v-show="isMobileStaminaExpanded" class="flex flex-col gap-y-3 pt-3 animate-fade-in-up pb-2">
              <div class="flex flex-wrap gap-2 items-center" v-if="staminaStats.surv.length > 0">
                 <span v-for="c in staminaStats.surv" :key="'mob-s-'+c.name" 
                       draggable="true" @dragstart="onCharDragStart(c.name, $event)" 
                       class="cursor-grab active:cursor-grabbing px-2.5 py-1 rounded-md text-sm font-bold border shadow-sm flex items-center gap-1.5 transition-transform select-none" 
                       :class="c.rem > 0 ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700' : 'bg-red-900/60 text-white border-red-600 opacity-60'">
                    <span>{{ t(c.name) }}</span>
                    <span v-if="c.isMod" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-mono leading-none">{{ t('改') }}</span>
                    <span class="bg-black/50 px-1.5 py-0.2 rounded-sm text-xs font-mono">{{ c.rem }}</span>
                 </span>
              </div>
              <div class="flex flex-wrap gap-2 items-center" v-if="staminaStats.dps.length > 0">
                 <span v-for="c in staminaStats.dps" :key="'mob-d-'+c.name" 
                       draggable="true" @dragstart="onCharDragStart(c.name, $event)" 
                       class="cursor-grab active:cursor-grabbing px-2.5 py-1 rounded-md text-sm font-bold border shadow-sm flex items-center gap-1.5 transition-transform select-none" 
                       :class="c.rem > 0 ? 'bg-blue-900/40 text-blue-300 border-blue-700' : 'bg-red-900/60 text-white border-red-600 opacity-60'">
                    <span>{{ t(c.name) }}</span>
                    <span v-if="c.isMod" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-mono leading-none">{{ t('改') }}</span>
                    <span class="bg-black/50 px-1.5 py-0.2 rounded-sm text-xs font-mono">{{ c.rem }}</span>
                 </span>
              </div>
           </div>
         </div>

         <!-- 桌機版固定側邊欄 (次級內容) -->
         <div class="hidden xl:flex flex-col bg-panel p-5 rounded-xl border border-glass shadow-lg">
            <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h3 class="text-gold font-bold text-lg flex items-center gap-2 m-0 p-0 border-none">
                <span>⏳</span> {{ t('剩餘可用次數') }}
              </h3>
              <button @click="showStaminaModal = true" class="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1">
                <span>⚙️</span> {{ t('耐力設定') }}
              </button>
            </div>
            
            <div v-if="staminaStats.surv.length > 0" class="mb-6">
              <div class="text-emerald-400 font-bold mb-3 text-base flex items-center gap-1">
                🛡️ {{ t('生存位 / 多耐力角色') }}
              </div>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="c in staminaStats.surv" :key="'desk-s-'+c.name" 
                     draggable="true" @dragstart="onCharDragStart(c.name, $event)" 
                     class="cursor-grab active:cursor-grabbing px-3 py-1.5 rounded-lg text-sm font-bold transition-all border shadow-sm flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md select-none" 
                     :class="c.rem > 0 ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700' : 'bg-red-900/60 text-white border-red-600 opacity-60'">
                  <span>{{ t(c.name) }}</span>
                  <span v-if="c.isMod" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-mono leading-none" :title="t('耐力上限已自訂修改')">{{ t('改') }}</span>
                  <span class="bg-black/50 px-2 py-0.5 rounded-md leading-none text-xs font-mono">{{ c.rem }}</span>
                </span>
              </div>
            </div>

            <div v-if="staminaStats.dps.length > 0">
              <div class="text-blue-400 font-bold mb-3 text-base flex items-center gap-1">
                ⚔️ {{ t('一般角色') }}
              </div>
              <div class="flex flex-wrap gap-2.5">
                <span v-for="c in staminaStats.dps" :key="'desk-d-'+c.name" 
                     draggable="true" @dragstart="onCharDragStart(c.name, $event)" 
                     class="cursor-grab active:cursor-grabbing px-3 py-1.5 rounded-lg text-sm font-bold transition-all border shadow-sm flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md select-none" 
                     :class="c.rem > 0 ? 'bg-blue-900/40 text-blue-300 border-blue-700' : 'bg-red-900/60 text-white border-red-600 opacity-60'">
                  <span>{{ t(c.name) }}</span>
                  <span v-if="c.isMod" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded font-mono leading-none" :title="t('耐力上限已自訂修改')">{{ t('改') }}</span>
                  <span class="bg-black/50 px-2 py-0.5 rounded-md leading-none text-xs font-mono">{{ c.rem }}</span>
                </span>
              </div>
            </div>
         </div>
      </div>

      <!-- 右側主編隊沙盤 (次級內容) -->
      <div class="flex-1 min-w-0 flex flex-col w-full">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-purple-400 flex items-center gap-2 m-0">
            <span>⚔️</span> {{ t('戰術編排沙盤') }}
          </h2>
          <div class="text-right">
            <div v-if="displayScoreMax > 0" class="text-amber-400 font-black text-sm">📈 MAX: {{ Math.round(displayScoreMax).toLocaleString() }}</div>
            <div v-if="displayScoreMin > 0" class="text-emerald-400 font-black text-lg">🛡️ MIN: {{ Math.round(displayScoreMin).toLocaleString() }}</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3 mb-5">
          <button @click="handleAutoBuild" :disabled="isCalculating" class="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 text-lg">⚙️ {{ isCalculating ? t('編排計算中...') : t('自動最佳編制') }}</button>
          <button @click="handleReverseInfer" :disabled="isCalculating" class="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 text-lg">🔄 {{ t('保留排軸・推演出場順序') }}</button>
        </div>

        <!-- ⏱️ 自動配置讀秒計條與進度條 -->
        <div v-if="isCalculating" class="mb-5 bg-[#1b1b22] border border-purple-500/40 rounded-xl p-3.5 shadow-lg">
          <div class="flex items-center justify-between text-xs font-bold mb-2">
            <span class="text-purple-300 flex items-center gap-2">⏳ {{ t('正在搜尋最佳隊伍組合與矩陣 Buff...') }}</span>
            <span class="text-amber-300 font-mono">⏱️ {{ calcElapsedSec.toFixed(1) }}s ｜ {{ calcProgress }}%</span>
          </div>
          <div class="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 transition-all duration-150" :style="{ width: Math.max(5, calcProgress) + '%' }"></div>
          </div>
        </div>

        <!-- 隊伍列清單 -->
        <div class="space-y-3">
          <div v-for="(team, index) in globalStore.savedLineups" :key="index" class="flex flex-col gap-2 bg-[#1e1e24] p-3.5 rounded-xl border border-gray-700">
            <div class="flex flex-wrap gap-3 items-center">
                <span class="font-black text-gray-500 w-5 text-center text-lg">{{ index + 1 }}</span>
                <div class="flex flex-wrap flex-1 gap-2 items-center">
                    <div @dragover.prevent @drop.prevent.stop="onCharDrop(team, 'c1', $event)">
                        <select v-model="team.c1" @change="onCharacterChange(team)" class="bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-2 w-32 font-bold cursor-pointer">
                            <option value="">-- {{ t('主C') }} --</option>
                            <option v-for="c in ownedCharactersList" :key="c" :value="c" :disabled="isSlotOptionDisabled(team, 'c1', c)">{{ t(c) }}</option>
                        </select>
                    </div>
                    <div @dragover.prevent @drop.prevent.stop="onCharDrop(team, 'c2', $event)">
                        <select v-model="team.c2" @change="onCharacterChange(team)" class="bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-2 w-32 font-bold cursor-pointer">
                            <option value="">-- {{ t('副C') }} --</option>
                            <option v-for="c in ownedCharactersList" :key="c" :value="c" :disabled="isSlotOptionDisabled(team, 'c2', c)">{{ t(c) }}</option>
                        </select>
                    </div>
                    <div @dragover.prevent @drop.prevent.stop="onCharDrop(team, 'c3', $event)">
                        <select v-model="team.c3" @change="onCharacterChange(team)" class="bg-gray-800 text-white border border-gray-600 rounded-lg px-2 py-2 w-32 font-bold cursor-pointer">
                            <option value="">-- {{ t('生存') }} --</option>
                            <option v-for="c in ownedCharactersList" :key="c" :value="c" :disabled="isSlotOptionDisabled(team, 'c3', c)">{{ t(c) }}</option>
                        </select>
                    </div>
                    <select v-model="team.rotId" class="bg-gray-900 text-amber-400 font-bold border border-gray-600 rounded-lg px-2 py-2 flex-1 min-w-[160px] text-sm">
                        <option v-for="rot in getAvailableRotations(team)" :key="rot.id" :value="rot.id">
                            {{ t(rot.rot) }} ({{ getDiffText(rot.diff) }}) | {{ getRotEffectiveMeta(rot).isModified ? `⚡實效 ${getRotEffectiveMeta(rot).effDps}w (基礎 ${rot.dps}w)` : `${rot.dps}w` }}
                        </option>
                        <option value="generic_fallback">🧩 {{ t('非主流') }}</option>
                    </select>
                    <div class="flex items-center gap-1 bg-gray-900 border border-gray-700 rounded p-1">
                        <input v-model="team.score" type="number" :placeholder="t('單隊得分')" class="w-24 bg-transparent text-xs text-amber-400 font-bold px-1 text-center outline-none font-mono">
                    </div>
                </div>
                <button @click="removeTeam(index)" class="text-gray-500 hover:text-red-400 p-2 font-bold">✖</button>
            </div>

            <!-- 即時共鳴鏈 S0~S6 與終焉矩陣增益狀態列 -->
            <div v-if="team.c1 && getTeamActiveRotMeta(team)" class="flex flex-wrap items-center gap-2 pt-1.5 border-t border-gray-800/80 text-[11px] font-mono">
                <span v-for="b in getTeamActiveRotMeta(team).rcBadges" :key="index+'-rc-'+b.char"
                      class="px-2 py-0.5 rounded border"
                      :class="b.rc > 0 ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-bold' : 'bg-gray-900 border-gray-800 text-gray-400'">
                    {{ t(b.char) }} S{{ b.rc }} (槽位{{ b.slot }})
                </span>
                <span v-if="getTeamActiveRotMeta(team).matrixName" class="bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded font-bold">
                    🌌 矩陣增益: {{ getTeamActiveRotMeta(team).matrixName }}
                </span>
                <span v-for="dm in (getTeamActiveRotMeta(team).dualModeBadges || [])" :key="index+'-dm-'+dm.char"
                      class="bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded font-bold">
                    ⚙️ {{ t(dm.char) }}: {{ dm.mode }}
                </span>
                <span v-if="getTeamActiveRotMeta(team).effDps !== '0.00'" class="ml-auto text-emerald-300 font-bold">
                    ⚡ 實效循環 DPS: {{ getTeamActiveRotMeta(team).effDps }}w/s
                    <span class="text-gray-500 font-normal">(基礎 {{ getTeamActiveRotMeta(team).baseDps }}w)</span>
                </span>
            </div>

            <!-- 斬殺與轉場事件展示 -->
            <div v-if="team.transitionEvents?.length" class="flex flex-wrap gap-2 pt-2 border-t border-gray-800 text-xs font-mono">
                <span v-for="(ev, eIdx) in team.transitionEvents" :key="eIdx" class="bg-purple-950/40 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded flex items-center gap-1 flex-wrap">
                    ⚔️ {{ ev.boss }} ({{ ev.teamTime ?? ev.time }}s [{{ ev.phase }}] 由 <strong class="text-amber-300">{{ ev.killerChar }}</strong>「{{ ev.killerAction }}」斬殺)
                    <span v-if="ev.switchAnalysis" class="text-amber-200 bg-amber-900/40 px-1.5 rounded">
                        ➔ 剩{{ ev.switchAnalysis.remainingNodes }}招/{{ ev.switchAnalysis.remainingDur }}s · 折損 -{{ ev.switchAnalysis.lossPct }}% ({{ ev.switchAnalysis.afterSwitchDmgWan }}w)
                    </span>
                </span>
            </div>
          </div>
          <button @click="addTeam" class="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-white font-bold">+ {{ t('新增隊伍欄位') }}</button>
        </div>

        <!-- 儲存 / 清空 -->
        <div class="mt-6 flex gap-3">
          <button @click="saveTeams" class="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl font-bold">{{ t('暫存沙盤') }}</button>
          <button @click="clearTeams" class="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold">{{ t('清空') }}</button>
        </div>

        <!-- 實戰誤差警報面板 (>15% 偏差提醒) -->
        <div v-if="reverseDiscrepancies.length > 0" class="mt-6 bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 flex flex-col gap-2">
            <div class="flex justify-between items-center">
                <span class="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <span>⚠️</span> {{ t('實戰誤差警報（逆算 DPS 與理論偏差超過 15%）') }}
                </span>
                <button @click="reverseDiscrepancies = []" class="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-black/40 border border-gray-700">✖</button>
            </div>
            <div class="space-y-1.5 text-xs font-mono text-gray-200">
                <div v-for="(d, dIdx) in reverseDiscrepancies" :key="'disc-'+dIdx" class="bg-black/40 border border-amber-800/40 rounded-lg px-3 py-2 flex flex-wrap justify-between gap-2">
                    <span>
                        #{{ d.teamIndex }} <strong class="text-white">{{ t(d.teamC1) }}</strong>
                        ({{ d.bossKey }}) · {{ t('實戰反推') }} <strong class="text-amber-300">{{ d.realDps }}w</strong> vs {{ t('理論') }} <strong class="text-emerald-300">{{ d.theoryDps }}w</strong>
                    </span>
                    <span :class="parseFloat(d.diffPct) > 0 ? 'text-emerald-400' : 'text-rose-400'" class="font-bold">
                        {{ parseFloat(d.diffPct) > 0 ? '+' : '' }}{{ d.diffPct }}%
                    </span>
                </div>
            </div>
        </div>

        <!-- 視覺化沙盤圖表與戰報 (次級展示) -->
        <div v-if="globalTraceMax.length > 0" id="battle-report-node" class="mt-8 bg-[#101014] p-6 rounded-xl border border-purple-500/40 flex flex-col gap-6">
            <BattleVisualizer :teams="globalStore.savedLineups.filter(t => t.c1 !== '')" :envConfig="getEnvSettings() || { battleTime: 120 }" :finalScoreMax="finalScoreMax" :finalScoreMin="finalScoreMin" :globalTraceMax="globalTraceMax" :globalTraceMin="globalTraceMin" />
            
            <div class="bg-gray-900/80 rounded-xl border border-gray-700 p-5 flex flex-col gap-4">
                <div class="flex justify-between items-center border-b border-gray-800 pb-3">
                    <h3 class="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
                        <span>📋</span> {{ t('各隊排軸採用狀態與時序流變分析') }}
                    </h3>
                    <span class="text-xs text-gray-400 font-mono">
                        已推演 <span class="text-purple-400 font-bold">{{ globalStore.savedLineups.filter(t => t.c1).length }}</span> 支作戰序列
                    </span>
                </div>

                <div class="grid grid-cols-1 gap-3.5">
                    <div v-for="(team, tIdx) in globalStore.savedLineups.filter(t => t.c1)" :key="'summary-'+tIdx"
                         class="bg-[#121216] border border-gray-800 hover:border-gray-700 p-4 rounded-xl flex flex-col gap-3 transition-colors">
                        
                        <div class="flex flex-wrap justify-between items-center gap-2 border-b border-gray-800/80 pb-2">
                            <div class="flex items-center gap-2">
                                <span class="font-black text-purple-400 text-sm w-6">#{{ tIdx + 1 }}</span>
                                <span class="font-bold text-white text-sm">
                                    {{ t(team.c1) }}{{ team.c2 ? ' + ' + t(team.c2) : '' }}{{ team.c3 ? ' + ' + t(team.c3) : '' }}
                                </span>
                                <span class="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded font-mono">
                                    {{ team.rotationStateSummary?.rotName || '常規排軸' }}
                                </span>
                            </div>

                            <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                                <span class="px-2 py-0.5 rounded border"
                                      :class="team.rotationStateSummary?.hasOpener ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-400'">
                                    {{ team.rotationStateSummary?.hasOpener ? `啟動軸 (${team.rotationStateSummary.openerDuration}s)` : '無獨立啟動軸' }}
                                </span>
                                <span class="px-2 py-0.5 rounded border"
                                      :class="team.rotationStateSummary?.hasSwitchConfigured ? 'bg-amber-950/50 border-amber-700/60 text-amber-300' : 'bg-cyan-950/50 border-cyan-700/60 text-cyan-300'">
                                    {{ team.rotationStateSummary?.hasSwitchConfigured ? `手動鏡像表 (${team.rotationStateSummary.switchNodesCount}招)` : '轉火自動推演模式' }}
                                </span>
                            </div>
                        </div>

                        <!-- 實驗性功能：輸出結果後強制修改單隊矩陣 Buff 並重排當前編隊 -->
                        <div class="flex flex-wrap items-center justify-between gap-2 bg-[#0d111a] border border-purple-500/30 rounded-lg px-2.5 py-1.5 text-[11px] font-mono">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="px-1.5 py-0.5 rounded bg-purple-900/70 text-purple-200 border border-purple-400/50 text-[10px] font-bold">🧪 實驗性功能</span>
                                <span class="text-cyan-300 font-bold">強制單隊矩陣 Buff:</span>
                                <select :value="team.forcedMatrixBuffId || ''"
                                        @change="onForceTeamMatrixBuffChange(team, $event.target.value)"
                                        class="bg-[#0a0a0c] text-amber-300 border border-gray-700 rounded px-2 py-1 text-[11px] font-bold outline-none focus:border-purple-500">
                                    <option value="">自動依環境 ({{ team.appliedMatrixBuff?.name || '預設' }})</option>
                                    <option v-for="mb in matrixBuffOptions" :key="mb.id" :value="mb.id">
                                        [{{ mb.category }}] {{ mb.name }}
                                    </option>
                                    <option value="none">🚫 無矩陣增益 (關閉)</option>
                                </select>
                            </div>
                            <button type="button"
                                    @click="handleResimulateWithForcedBuffs"
                                    class="px-2.5 py-1 rounded bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-[11px] border border-purple-400/40 transition-colors">
                                🔄 用此設定重排當前編隊
                            </button>
                        </div>

                        <div class="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                            <span class="text-gray-500 text-[11px]">時序流變:</span>
                            <template v-for="(phaseText, pIdx) in (team.rotationStateSummary?.phaseFlow || ['常規循環'])" :key="'pf-'+pIdx">
                                <span class="px-2 py-0.5 rounded font-bold"
                                      :class="phaseText.includes('啟動') ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' 
                                             : (phaseText.includes('轉火') ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' 
                                             : 'bg-purple-900/40 text-purple-300 border border-purple-700/50')">
                                    {{ phaseText }}
                                </span>
                                <span v-if="pIdx < (team.rotationStateSummary?.phaseFlow.length - 1)" class="text-gray-600 font-bold">➔</span>
                            </template>
                        </div>

                        <div v-if="team.transitionEvents?.length" class="flex flex-col gap-1.5 text-xs font-mono bg-black/40 p-2.5 rounded-lg border border-gray-800/80">
                            <div v-for="(ev, evIdx) in team.transitionEvents" :key="'ev-'+evIdx" class="text-gray-300 flex flex-wrap items-center gap-1.5">
                                <span>
                                    ⚔️ <strong class="text-purple-300">{{ ev.boss }}</strong>
                                    ({{ ev.teamTime ?? ev.time }}s 由 <span class="text-amber-300 font-bold">{{ ev.killerChar }}</span>「{{ ev.killerAction }}」第 <strong class="text-rose-400">#{{ ev.actionIndex }}</strong> 招斬殺)
                                </span>
                                <span v-if="ev.switchAnalysis" class="text-[11px] bg-amber-950/50 border border-amber-700/50 text-amber-200 px-2 py-0.5 rounded">
                                    ➔ 自動轉火後續：餘 {{ ev.switchAnalysis.remainingNodes }} 招 ({{ ev.switchAnalysis.remainingDur }}s) ·
                                    {{ ev.switchAnalysis.origDmgWan }}w ➔ <strong class="text-emerald-300">{{ ev.switchAnalysis.afterSwitchDmgWan }}w</strong>
                                    (<span class="text-rose-300">-{{ ev.switchAnalysis.lossPct }}%</span> · {{ (ev.switchAnalysis.reasons || []).join(' / ') }})
                                </span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center text-xs font-mono pt-1 text-gray-400 border-t border-gray-800/60">
                            <span>作戰時長: <strong class="text-white">{{ team.duration?.toFixed(1) || 0 }}s</strong> / 120s</span>
                            <div class="flex gap-3">
                                <span>保底: <strong class="text-emerald-400 font-bold">{{ Math.round(team.scoreMin || 0).toLocaleString() }}</strong></span>
                                <span>極限: <strong class="text-amber-400 font-bold">{{ Math.round(team.scoreMax || 0).toLocaleString() }}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>

    <!-- 🌟 擴增內容：耐力管理 Modal -->
    <Teleport to="body">
      <div v-if="showStaminaModal" class="fixed inset-0 z-[9960] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div class="bg-[#121216] w-full max-w-lg rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <div class="bg-gray-800 px-5 py-3.5 border-b border-gray-700 flex justify-between items-center">
            <h3 class="text-base font-bold text-amber-300 flex items-center gap-2 m-0">
              <span>⏳</span> {{ t('共鳴者耐力上限自訂') }}
            </h3>
            <button @click="showStaminaModal = false" class="text-gray-400 hover:text-white transition-colors font-bold">✖</button>
          </div>
          <div class="p-4 bg-gray-900/60 border-b border-gray-800 flex gap-3 items-center">
            <input v-model="staminaSearchQuery" type="text" :placeholder="t('🔍 搜尋角色名稱...')" 
                   class="flex-1 bg-[#0a0a0c] text-white border border-gray-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-500">
            <button @click="resetAllStaminaToDefault" class="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/40 hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors font-bold whitespace-nowrap">
              🔄 {{ t('恢復全部預設') }}
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar bg-[#0a0a0c]">
            <div v-for="c in modalFilteredCharacters" :key="'modal-stam-'+c.name"
                 class="flex justify-between items-center p-2.5 rounded-xl border bg-gray-900/80 transition-colors"
                 :class="c.isMod ? 'border-amber-500/50 bg-amber-950/20' : 'border-gray-800'">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-gray-200">{{ t(c.name) }}</span>
                <span class="text-[10px] text-gray-500 font-mono">({{ t('預設') }}: {{ c.defaultMax }}次)</span>
                <span v-if="c.isMod" class="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-mono">{{ t('已修改') }}</span>
              </div>
              <div class="flex bg-black/60 p-1 rounded-lg border border-gray-800 gap-1 font-mono text-xs">
                <button v-for="val in [1, 2, 3]" :key="val" @click="setCharStamina(c.name, val)" class="px-2.5 py-1 rounded font-bold transition-all"
                        :class="c.currentMax === val ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'">
                  {{ val }}{{ t('次') }}
                </button>
              </div>
            </div>
          </div>
          <div class="bg-gray-800 px-5 py-3 border-t border-gray-700 flex justify-end">
            <button @click="showStaminaModal = false" class="bg-amber-600 hover:bg-amber-500 text-black font-bold px-6 py-2 rounded-xl transition-colors text-sm shadow-md">
              ✅ {{ t('完成') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 🌟 擴增內容：漂泊者屬性選擇 Modal -->
    <Teleport to="body">
        <div v-if="showRoverSelectModal" class="fixed inset-0 z-[9950] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div class="bg-[#121216] w-full max-w-sm rounded-2xl border border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col">
                <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                    <h2 class="text-lg font-bold text-yellow-400 flex items-center gap-2"><span>✨</span> {{ t('選擇漂泊者屬性') }}</h2>
                    <button @click="cancelRoverSelection" class="text-gray-400 hover:text-white transition-colors font-bold">✖</button>
                </div>
                <div class="p-5 flex flex-col gap-3">
                    <button v-for="rName in ownedCharactersList.filter(c => ROVER_VARIANTS.includes(c))" :key="rName"
                            @click="handleRoverSelection(rName)" 
                            class="py-3 px-4 rounded-xl font-bold border transition-all flex items-center justify-center bg-yellow-900/30 border-yellow-500/50 text-yellow-300 hover:bg-yellow-600 hover:text-black">
                        {{ t(rName) }}
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
</style>