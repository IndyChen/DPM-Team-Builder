<!-- src/components/RotationManager.vue -->
<script setup>
import { ref, computed, inject, reactive, watch, onMounted, onUnmounted } from 'vue';
import LZString from 'lz-string';
import {
  globalStore,
  initStore,
  dpsDataMap,
  getCharLoadoutState,
  getCharStats,
  switchCharSlot,
  setCharResonanceChain
} from '../core/store.js';
import { characterOrder, charData } from '../data/characters.js';
import {
  ROLE_SKILLS_DB,
  WEAPONS_DB,
  ECHO_SETS_DB,
  MAIN_ECHOES_DB,
  calcRealSkillDamage,
  getWeaponRarityMeta,
  getSkillFixedCritState,
  matchRoleSkillFromTextOrDamage,
  KEYBIND_DEFS,
  getCharKeybindVariants,
  evaluateCharKeybindDerivations,
  resolveKeybindActionToSkills,
  compileKeybindSectionToGrid,
  parseKeybindShorthandText,
  PRESET_KEYBIND_ROTATIONS
} from '../data/combatDb.js';
import { zhCN, ja, en } from '../locales/dictionary.js';
import { avatarStorage } from '../core/avatarStorage.js';
import {
  getMonteCarloFloatRange,
  getCharCritDetails,
  getBase,
  evaluateRotationAcrossMatrixBuffs,
  resolveTeamEffectiveInputs,
  applyMonteCarloDps,
  previewAllSwitchPoints
} from '../core/core.js';

const t = inject('t') || ((str) => str);

const rotSearchQuery = ref('');
const activeFolder = ref(null);
const customAvatars = ref({});
const ROVER_VARIANTS = ['光主', '暗主', '風主', '雷主', '火主', '冰主'];
const skillOpts = ['普攻', '重擊', '共技', '回路', '共解', '變奏', '延奏', '聲骸技能', '效應', '震諧', '諧度破壞'];
const difficulties = [
  { icon: '🟩', name: '輪椅' }, { icon: '🔵', name: '中等' }, { icon: '⭐', name: '進階' },
  { icon: '⚠️', name: '極難' }, { icon: '🧩', name: '非主流' }
];
const partnerSheetUrl = ref('https://docs.google.com/spreadsheets/d/1X8LeE0MFW1NoXOCkaDOS3JvpNIqlbxiVeK5btOeN6mE/edit?usp=sharing');

const WEAPON_OBJ_MAP = new Map(WEAPONS_DB.map(w => [w.id, w]));
const WEAPON_NAME_MAP = new Map(WEAPONS_DB.map(w => [w.id, w.name]));
const SET_NAME_MAP = new Map(ECHO_SETS_DB.map(s => [s.id, s.name]));
const ECHO_NAME_MAP = new Map(MAIN_ECHOES_DB.map(e => [e.id, e]));

const createEmptyRot = () => ({
  id: null,
  c1: '',
  c2: '',
  c3: '',
  rot: '',
  dps: 0,
  duration: 25,
  totalDmg: 0,
  diff: '🧩',
  baseCritRates: {},
  buffCritRates: {},
  gridData: [],
  firstDuration: null,
  firstDps: null,
  firstTotalDmg: null,
  firstGridData: [],
  hasSwitchRot: false,
  switchDuration: 25,
  switchDps: null,
  switchGridData: [],
  isUserCustom: true
});

// 統一單一排軸建置器狀態
const builderOpen = ref(false);
const builderMode = ref('new'); // 'new' | 'edit'
const builderTab = ref('main'); // 'main' | 'opener' | 'switch'
const draftRot = ref(createEmptyRot());

const showTextImporter = ref(false);
const magicInput = ref('');
const mirrorTool = reactive({ startIndex: 0, actualDmg: null, ratio: 80 });

// 實戰招式庫快速加入狀態
const skillPicker = reactive({
  casterSlot: 'c1',
  selectedSkillId: '',
  customActionName: '',
  customMvPct: 100,
  customSkillType: '普攻',
  customStatType: 'atk',
  time: 1.5,
  hits: 1,
  enemyLv: 100,
  enemyResPct: 10,
  extraAtkPct: 0,
  extraDmgBonusPct: 0,
  extraAmplifyPct: 0,
  extraCritDmg: 0,
  extraIgnoreDefPct: 0,
  extraDefShredPct: 0,
  showExtraMods: false
});

// 4-Buff 實測排名結果與轉火自動推演預覽
const matrixEvalResult = ref(null);
const selectedSwitchPreviewIdx = ref(0);

const autoSwitchAllPoints = computed(() => {
  if (!builderOpen.value || !draftRot.value?.gridData || draftRot.value.gridData.length < 2) return [];
  const env = readStoredEnv();
  return previewAllSwitchPoints(
    { ...draftRot.value, hasSwitchRot: false },
    { ...env, applyLoadoutScaling: true }
  );
});

const selectedSwitchPreview = computed(() => {
  const list = autoSwitchAllPoints.value;
  if (!list.length) return null;
  return list.find(x => x.killIndex === selectedSwitchPreviewIdx.value) || list[0];
});

const applyAutoSwitchSnapshotToManual = () => {
  const sp = selectedSwitchPreview.value;
  if (!sp) return;
  const fullGrid = draftRot.value.gridData || [];
  const prefix = fullGrid.slice(0, sp.killIndex + 1).map(n => ({
    ...n,
    baseDmg: parseFloat(n.dmg) || 0,
    ratio: 100
  }));
  const suffix = (sp.nodes || []).map(n => {
    const base = parseFloat(n.baseDmg || n.dmg) || 0;
    const after = parseFloat(n.dmg) || 0;
    return {
      ...n,
      time: parseFloat((sp.killTime + n.time).toFixed(2)),
      baseDmg: base,
      ratio: base > 0 ? parseFloat(((after / base) * 100).toFixed(1)) : 100
    };
  });
  draftRot.value.switchGridData = [...prefix, ...suffix];
  draftRot.value.switchDuration = draftRot.value.duration || 25;
  draftRot.value.hasSwitchRot = true;
  recalculateRotTotals(draftRot.value, 'switch');
  alert(`✅ 已根據第 #${sp.killIndex + 1} 招斬殺點之自動推算結果寫入手動微調表！`);
};

const readStoredEnv = () => {
  try {
    return JSON.parse(localStorage.getItem('ww_env_global') || '{}');
  } catch (e) {
    return {};
  }
};

const allSelectableCharacters = computed(() => {
  let roverCfg = null;
  try {
    roverCfg = JSON.parse(localStorage.getItem('ww_rover_config') || 'null');
  } catch (e) {}
  const defaultEnabled = ['光主', '暗主', '風主', '雷主'];
  const list = [];
  characterOrder.forEach(c => {
    if (c === '漂泊者') {
      ROVER_VARIANTS.forEach(rName => {
        if (roverCfg && roverCfg[rName]) {
          if (roverCfg[rName].enabled) list.push(rName);
        } else if (defaultEnabled.includes(rName)) {
          list.push(rName);
        }
      });
    } else {
      list.push(c);
    }
  });
  return list;
});

const getAvailableCharactersForSlot = (targetObj, currentSlot) => {
  const selectedBases = new Set();
  if (currentSlot !== 'c1' && targetObj.c1) selectedBases.add(getBase(targetObj.c1));
  if (currentSlot !== 'c2' && targetObj.c2) selectedBases.add(getBase(targetObj.c2));
  if (currentSlot !== 'c3' && targetObj.c3) selectedBases.add(getBase(targetObj.c3));
  return allSelectableCharacters.value.filter(c => {
    if (targetObj[currentSlot] === c) return true;
    return !selectedBases.has(getBase(c));
  });
};

// 隊伍成員當前 2 槽位裝備摘要
const draftTeamSummaries = computed(() => {
  return ['c1', 'c2', 'c3'].map(slotKey => {
    const name = draftRot.value[slotKey];
    if (!name) return null;
    const base = getBase(name);
    const state = getCharLoadoutState(base);
    const activeSlot = state.slots[state.activeSlot] || state.slots[0];
    const stats = getCharStats(base);
    const weaponObj = WEAPON_OBJ_MAP.get(Number(activeSlot.weaponId));
    const weaponRarityMeta = getWeaponRarityMeta(weaponObj?.rarity || 5);
    return {
      slotKey,
      name,
      base,
      activeIdx: state.activeSlot,
      weaponName: weaponObj?.name || `#${activeSlot.weaponId}`,
      weaponRarity: weaponObj?.rarity || 5,
      weaponRarityMeta,
      weaponRank: activeSlot.weaponRank || 1,
      setName: stats.echoSetSummary || SET_NAME_MAP.get(Number(activeSlot.echoSetId)) || `#${activeSlot.echoSetId}`,
      echoTotalCost: stats.echoTotalCost ?? 12,
      echoValidation: stats.echoValidation,
      echoName: ECHO_NAME_MAP.get(Number(activeSlot.mainEchoId))?.name || '無主聲骸',
      rc: activeSlot.rc ?? 0,
      stats
    };
  }).filter(Boolean);
});

const activeCasterChar = computed(() => {
  const name = draftRot.value[skillPicker.casterSlot] || draftRot.value.c1 || '';
  return name;
});

const activeCasterSkills = computed(() => {
  const base = getBase(activeCasterChar.value);
  const roleSkills = ROLE_SKILLS_DB[base] || [];
  const loState = getCharLoadoutState(base);
  const activeSlot = loState.slots[loState.activeSlot] || loState.slots[0];
  const mainEcho = ECHO_NAME_MAP.get(Number(activeSlot?.mainEchoId));
  const echoSkill = mainEcho
    ? [{ id: `echo_${mainEcho.id}`, name: `聲骸：${mainEcho.name}`, skillType: '聲骸技能', mvPct: mainEcho.mvPct || 405, statType: 'atk', tag: 'echo', element: mainEcho.element }]
    : [];
  const customOption = [{ id: '__custom__', name: '✏️ 自訂倍率與屬性招式', skillType: skillPicker.customSkillType, mvPct: skillPicker.customMvPct, statType: skillPicker.customStatType, tag: 'custom' }];
  return [...roleSkills, ...echoSkill, ...customOption];
});

watch(activeCasterChar, () => {
  const firstSkill = activeCasterSkills.value[0];
  if (firstSkill) skillPicker.selectedSkillId = firstSkill.id;
}, { immediate: true });

const currentPickedSkillObj = computed(() => {
  const found = activeCasterSkills.value.find(s => s.id === skillPicker.selectedSkillId) || activeCasterSkills.value[0];
  if (!found || found.id === '__custom__') {
    return {
      id: '__custom__',
      name: skillPicker.customActionName || '自訂招式',
      skillType: skillPicker.customSkillType,
      mvPct: Number(skillPicker.customMvPct) || 100,
      statType: skillPicker.customStatType || 'atk',
      tag: 'custom'
    };
  }
  return found;
});

const skillPickerPreview = computed(() => {
  const charName = activeCasterChar.value;
  if (!charName) return null;
  const base = getBase(charName);
  const stats = getCharStats(base);
  const sk = currentPickedSkillObj.value;
  const hits = Math.max(1, Number(skillPicker.hits) || 1);
  const enemyRes = (Number(skillPicker.enemyResPct) || 0) / 100;
  const commonOpts = {
    charName: base,
    stats,
    skill: sk,
    enemyLv: Number(skillPicker.enemyLv) || 100,
    enemyRes,
    extraAtkPct: Number(skillPicker.extraAtkPct) || 0,
    extraDmgBonusPct: Number(skillPicker.extraDmgBonusPct) || 0,
    extraAmplifyPct: Number(skillPicker.extraAmplifyPct) || 0,
    extraCritDmg: Number(skillPicker.extraCritDmg) || 0,
    extraIgnoreDefPct: Number(skillPicker.extraIgnoreDefPct) || 0,
    extraDefShredPct: Number(skillPicker.extraDefShredPct) || 0
  };
  const exp = calcRealSkillDamage({ ...commonOpts, critMode: 'expected' });
  const crit = calcRealSkillDamage({ ...commonOpts, critMode: 'crit' });
  return {
    skill: sk,
    expectedTotal: Math.round(exp.rawDamage * hits),
    critTotal: Math.round(crit.rawDamage * hits),
    critDmgPct: stats.critDmg,
    critRatePct: stats.critRate
  };
});

const recalculateRotTotals = (rot, targetTab = 'main') => {
  if (targetTab === 'opener') {
    const list = rot.firstGridData || [];
    list.sort((a, b) => (parseFloat(a.time) || 0) - (parseFloat(b.time) || 0));
    const maxT = list.reduce((m, n) => Math.max(m, parseFloat(n.time) || 0), 0);
    const totalD = list.reduce((s, n) => s + (parseFloat(n.dmg) || 0), 0);
    if (maxT > 0) rot.firstDuration = parseFloat(maxT.toFixed(1));
    rot.firstTotalDmg = parseFloat((totalD / 10000).toFixed(2));
    const dur = parseFloat(rot.firstDuration || rot.duration) || 25;
    rot.firstDps = parseFloat((dur > 0 ? totalD / dur / 10000 : 0).toFixed(2));
  } else if (targetTab === 'switch') {
    const list = rot.switchGridData || [];
    list.sort((a, b) => (parseFloat(a.time) || 0) - (parseFloat(b.time) || 0));
    const totalD = list.reduce((s, n) => s + (parseFloat(n.dmg) || 0), 0);
    const dur = parseFloat(rot.switchDuration) || 25;
    rot.switchDps = parseFloat((dur > 0 ? totalD / dur / 10000 : 0).toFixed(2));
  } else {
    const list = rot.gridData || [];
    list.sort((a, b) => (parseFloat(a.time) || 0) - (parseFloat(b.time) || 0));
    const maxT = list.reduce((m, n) => Math.max(m, parseFloat(n.time) || 0), 0);
    const totalD = list.reduce((s, n) => s + (parseFloat(n.dmg) || 0), 0);
    if (maxT > 0) rot.duration = parseFloat(maxT.toFixed(1));
    rot.totalDmg = parseFloat((totalD / 10000).toFixed(2));
    const dur = parseFloat(rot.duration) || 25;
    rot.dps = parseFloat((dur > 0 ? totalD / dur / 10000 : 0).toFixed(2));
  }
};

const addPickedSkillNode = () => {
  const charName = activeCasterChar.value;
  if (!charName) return alert(t('請先選擇出戰角色！'));
  const preview = skillPickerPreview.value;
  if (!preview) return;
  const targetTab = builderTab.value === 'opener' ? 'opener' : 'main';
  const targetList = targetTab === 'opener'
    ? (draftRot.value.firstGridData ||= [])
    : (draftRot.value.gridData ||= []);

  const base = getBase(charName);
  const stats = getCharStats(base);
  const sk = preview.skill;
  const fcState = getSkillFixedCritState(base, sk, stats?.rc ?? 0);
  targetList.push({
    time: parseFloat(Number(skillPicker.time || 0).toFixed(2)),
    char: charName,
    action: sk.name + (Number(skillPicker.hits) > 1 ? ` ×${skillPicker.hits}` : ''),
    dmg: preview.expectedTotal,
    skill: skillOpts.includes(sk.skillType) ? sk.skillType : '普攻',
    skillType: sk.skillType,
    fixedCrit: Boolean(fcState.fixedCrit),
    fixedCritRate: fcState.fixedCrit ? Number(fcState.fixedCritRate) : undefined,
    dbFixedCritNote: fcState.reason || '常規暴擊',
    matchMethod: '招式庫加入',
    skillMeta: {
      id: sk.id,
      name: sk.name,
      mvPct: Number(sk.mvPct) || 100,
      skillType: sk.skillType || '普攻',
      statType: sk.statType || 'atk',
      tag: sk.tag || '',
      element: sk.element || '',
      fixedCrit: Boolean(sk.fixedCrit),
      fixedCritRate: sk.fixedCritRate ?? null,
      fixedCritDmg: sk.fixedCritDmg ?? null,
      rcFixedCritReq: sk.rcFixedCritReq ?? null,
      fixedCritNote: sk.fixedCritNote || '',
      hits: Math.max(1, Number(skillPicker.hits) || 1),
      extraAtkPct: Number(skillPicker.extraAtkPct) || 0,
      extraDmgBonusPct: Number(skillPicker.extraDmgBonusPct) || 0,
      extraAmplifyPct: Number(skillPicker.extraAmplifyPct) || 0,
      extraCritDmg: Number(skillPicker.extraCritDmg) || 0,
      extraIgnoreDefPct: Number(skillPicker.extraIgnoreDefPct) || 0,
      extraDefShredPct: Number(skillPicker.extraDefShredPct) || 0
    }
  });

  recalculateRotTotals(draftRot.value, targetTab);
  // 自動推進下一個時間點
  skillPicker.time = parseFloat((Number(skillPicker.time || 0) + 1.2).toFixed(1));
  if (matrixEvalResult.value) runMatrixBuffEval(draftRot.value);
};

const syncNodeDbFixedCrit = (node) => {
  if (!node) return;
  const base = getBase(node.char || draftRot.value?.c1 || '');
  if (!base || base === '未知') return;
  const stats = getCharStats(base);
  const rc = stats?.rc ?? 0;
  const kit = ROLE_SKILLS_DB[base] || [];
  let matchedSk = null;
  if (node.skillMeta?.id) {
    matchedSk = kit.find(s => s.id === node.skillMeta.id) || node.skillMeta;
  }
  if (!matchedSk) {
    const m = matchRoleSkillFromTextOrDamage({
      charName: base,
      rawText: node.action || '',
      dmg: Number(node.dmg) || 0,
      skillTypeHint: node.skill || '',
      stats,
      rc
    });
    if (m) {
      matchedSk = m.skill;
      node.matchMethod = m.matchMethod === 'text' ? '多語文字匹配' : '參數反推匹配';
    }
  }
  if (matchedSk) {
    const fcState = getSkillFixedCritState(base, matchedSk, rc);
    node.fixedCrit = Boolean(fcState.fixedCrit);
    node.fixedCritRate = fcState.fixedCrit ? Number(fcState.fixedCritRate) : undefined;
    node.dbFixedCritNote = fcState.reason || '常規暴擊';
  }
};

const envRefreshTick = ref(0);

const recomputeSkillMetaNodes = (rot) => {
  if (!rot) return;
  const env = readStoredEnv();
  const hasReal = (rot.gridData || []).some(n => n?.skillMeta?.mvPct > 0);
  if (hasReal) {
    const res = resolveTeamEffectiveInputs(rot, env);
    rot.gridData = res.gridData;
    rot.gridData.forEach(syncNodeDbFixedCrit);
    recalculateRotTotals(rot, 'main');
    if ((rot.firstGridData || []).some(n => n?.skillMeta?.mvPct > 0)) {
      rot.firstGridData = res.firstGridData || rot.firstGridData;
      rot.firstGridData.forEach(syncNodeDbFixedCrit);
      recalculateRotTotals(rot, 'opener');
    }
  } else if (Array.isArray(rot.gridData) && rot.gridData.length > 0) {
    // 預設排軸（無 skillMeta）：保存原始未縮放節點，並依據當前共鳴鏈 S0~S6、武器/聲骸槽位與矩陣 Buff 即時縮放
    if (!rot._origGridData) {
      rot._origGridData = JSON.parse(JSON.stringify(rot.gridData));
      rot._origFirstGridData = rot.firstGridData ? JSON.parse(JSON.stringify(rot.firstGridData)) : null;
      rot._origRawDps = parseFloat(rot.rawDps || rot.dps) || 0;
    }
    const baseRot = {
      ...rot,
      gridData: JSON.parse(JSON.stringify(rot._origGridData)),
      firstGridData: rot._origFirstGridData ? JSON.parse(JSON.stringify(rot._origFirstGridData)) : null,
      rawDps: rot._origRawDps,
      dps: rot._origRawDps
    };
    const res = resolveTeamEffectiveInputs(baseRot, env);
    const effDps = applyMonteCarloDps({ ...baseRot, gridData: res.gridData, baseCritRates: res.baseCritRates }, env, 'expected', res.loopBaseDps);
    const ratio = (rot._origRawDps > 0 && effDps > 0) ? (effDps / rot._origRawDps) : 1.0;
    rot.gridData = rot._origGridData.map(n => ({ ...n, dmg: Math.round((parseFloat(n.dmg) || 0) * ratio) }));
    recalculateRotTotals(rot, 'main');
    if (rot._origFirstGridData && rot._origFirstGridData.length > 0) {
      rot.firstGridData = rot._origFirstGridData.map(n => ({ ...n, dmg: Math.round((parseFloat(n.dmg) || 0) * ratio) }));
      recalculateRotTotals(rot, 'opener');
    }
  }
  if (matrixEvalResult.value) runMatrixBuffEval(rot);
};

const getRotEffectivePreview = (rot) => {
  const _tick = envRefreshTick.value;
  const _loadouts = globalStore.charLoadouts;
  if (!rot || !rot.c1) return { baseDps: '0.00', effDps: '0.00', isModified: false, rcBadges: [], matrixName: '' };
  const env = readStoredEnv();
  const res = resolveTeamEffectiveInputs(rot, env);
  const effTeam = {
    ...rot,
    gridData: res.gridData,
    firstGridData: res.firstGridData,
    baseCritRates: res.baseCritRates
  };
  const effDpsNum = applyMonteCarloDps(effTeam, env, 'expected', res.loopBaseDps);
  const baseDpsNum = parseFloat(rot.rawDps || rot.dps) || 0;
  const rcBadges = [rot.c1, rot.c2, rot.c3].filter(Boolean).map(c => {
    const b = getBase(c);
    const st = getCharLoadoutState(b);
    const idx = st?.activeSlot === 1 ? 1 : 0;
    const rc = Number(st?.slots?.[idx]?.rc || 0);
    return { char: c, rc, slot: idx + 1 };
  });
  const matrixName = (res.appliedMatrixBuff && res.appliedMatrixBuff.buffId !== 'none')
    ? `${res.appliedMatrixBuff.name} (x${res.matrixMult.toFixed(2)})`
    : '';
  return {
    baseDps: baseDpsNum.toFixed(2),
    effDps: effDpsNum.toFixed(2),
    isModified: Math.abs(effDpsNum - baseDpsNum) >= 0.02 || Boolean(matrixName) || rcBadges.some(b => b.rc > 0),
    rcBadges,
    matrixName
  };
};

const handleBuilderSlotSwitch = (charBase, slotIdx) => {
  switchCharSlot(charBase, slotIdx);
  if (keybindState.openerSegments.length > 0 || keybindState.loopSegments.length > 0) {
    compileDraftKeybinds();
  } else {
    recomputeSkillMetaNodes(draftRot.value);
  }
};

const handleBuilderRcChange = (charBase, newRc) => {
  setCharResonanceChain(charBase, Number(newRc));
  if (keybindState.openerSegments.length > 0 || keybindState.loopSegments.length > 0) {
    compileDraftKeybinds();
  } else {
    (activeDraftNodes.value || []).forEach(syncNodeDbFixedCrit);
    recomputeSkillMetaNodes(draftRot.value);
  }
};

const runMatrixBuffEval = (rotObj) => {
  if (!rotObj || !rotObj.c1) return alert(t('請先選擇主 C 並建立排軸！'));
  const env = readStoredEnv();
  const evalOut = evaluateRotationAcrossMatrixBuffs(rotObj, {
    ...env,
    matrixVersion: env.matrixVersion || '3.8',
    applyLoadoutScaling: true
  });
  matrixEvalResult.value = evalOut;
};

const applyBestBuffToEnv = (buffId) => {
  try {
    const env = readStoredEnv();
    env.matrixBuffId = buffId;
    localStorage.setItem('ww_env_global', JSON.stringify(env));
    envRefreshTick.value++;
    if (builderOpen.value && draftRot.value?.c1) {
      recomputeSkillMetaNodes(draftRot.value);
    }
    window.dispatchEvent(new CustomEvent('ww-env-updated'));
    alert(`✅ 已將終焉矩陣增益切換為：${buffId}（排軸傷害與分數演算引擎已即時同步）`);
  } catch (e) {}
};

// 蒙地卡羅浮動預測
const draftMcRange = computed(() => {
  if (!draftRot.value || !draftRot.value.dps) return { minDps: 0, maxDps: 0, minPct: 0, maxPct: 0 };
  const _b = JSON.stringify(draftRot.value.baseCritRates);
  const _u = JSON.stringify(draftRot.value.buffCritRates);
  const _f = draftRot.value.gridData?.map(n => `${n.char}_${n.dmg}_${n.fixedCrit ? 1 : 0}_${n.fixedCritRate ?? 80}`).join('|');
  return getMonteCarloFloatRange(draftRot.value, null, parseFloat(draftRot.value.dps) || 0);
});

const getCritDetails = (rot, charName) => {
  if (!rot || !charName) return { userCR: 50, baseCR: 70, deltaCR: 0, buffCR: 0, finalCR: 50 };
  const base = getBase(charName);
  if (!rot.baseCritRates) rot.baseCritRates = {};
  if (!rot.buffCritRates) rot.buffCritRates = {};
  if (rot.baseCritRates[base] === undefined) rot.baseCritRates[base] = 70;
  if (rot.buffCritRates[base] === undefined) rot.buffCritRates[base] = 0;
  return getCharCritDetails(rot, charName, null);
};

const activeDraftNodes = computed(() => {
  if (builderTab.value === 'opener') return draftRot.value.firstGridData || [];
  if (builderTab.value === 'switch') return draftRot.value.switchGridData || [];
  return draftRot.value.gridData || [];
});

const addBlankNode = () => {
  const list = builderTab.value === 'opener'
    ? (draftRot.value.firstGridData ||= [])
    : (builderTab.value === 'switch' ? (draftRot.value.switchGridData ||= []) : (draftRot.value.gridData ||= []));
  const lastT = list.length ? parseFloat(list[list.length - 1].time || 0) : 0;
  list.push({
    time: parseFloat((lastT + 1.0).toFixed(1)),
    char: draftRot.value.c1 || t('未知'),
    action: t('新動作'),
    dmg: 0,
    baseDmg: 0,
    ratio: 100,
    skill: '普攻',
    fixedCrit: false,
    dbFixedCritNote: '常規暴擊'
  });
};

const removeDraftNode = (idx) => {
  const list = activeDraftNodes.value;
  list.splice(idx, 1);
  recalculateRotTotals(draftRot.value, builderTab.value);
};

const getFixedCritDmgPct = (gridData) => {
  if (!gridData || !gridData.length) return '0.0';
  let total = 0, fixed = 0;
  gridData.forEach(n => {
    const d = parseFloat(n.dmg) || 0;
    total += d;
    if (n.fixedCrit) fixed += d;
  });
  return total > 0 ? ((fixed / total) * 100).toFixed(1) : '0.0';
};

/**
 * 2-Pass DB skill auto-matcher for an entire list of rotation nodes:
 * Pass 1: Official Multi-Language Text Match (zh-Hant/zh-Hans/en/ja) + calibration scale factor
 * Pass 2: Reverse-compute damage from raw character stats / calibrated scale factor for unmatched skills
 */
const autoMatchNodesWithDb = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) return;
  const fallbackChar = getBase(draftRot.value?.c1 || '');
  const charStatsCache = new Map();
  const getStatsFor = (base) => {
    if (!base || base === '未知') return null;
    if (!charStatsCache.has(base)) charStatsCache.set(base, getCharStats(base));
    return charStatsCache.get(base);
  };

  // Pass 1: text match across 4 official languages + compute per-character scale calibration from matched rows
  const calibSums = new Map(); // base -> { obs: 0, pred: 0 }
  for (const node of nodes) {
    const base = getBase(node.char && node.char !== '未知' ? node.char : fallbackChar);
    const stats = getStatsFor(base);
    if (!stats) continue;
    const m = matchRoleSkillFromTextOrDamage({
      charName: base,
      rawText: node.action || '',
      dmg: 0, // text-only in Pass 1
      skillTypeHint: node.skill || '',
      stats,
      rc: stats.rc ?? 0
    });
    if (m && m.skill) {
      node._matchedPass1 = true;
      node.skill = skillOpts.includes(m.skill.skillType) ? m.skill.skillType : node.skill;
      node.fixedCrit = Boolean(m.fixedCrit);
      node.fixedCritRate = m.fixedCrit ? Number(m.fixedCritRate) : undefined;
      node.dbFixedCritNote = m.reason || '常規暴擊';
      node.matchMethod = '多語文字匹配';
      if (!node.skillMeta) {
        node.skillMeta = {
          id: m.skill.id,
          name: m.skill.name,
          mvPct: Number(m.skill.mvPct) || 100,
          skillType: m.skill.skillType || '普攻',
          statType: m.skill.statType || 'atk',
          element: m.skill.element || '',
          fixedCrit: Boolean(m.skill.fixedCrit),
          fixedCritRate: m.skill.fixedCritRate ?? null,
          fixedCritDmg: m.skill.fixedCritDmg ?? null,
          rcFixedCritReq: m.skill.rcFixedCritReq ?? null,
          fixedCritNote: m.skill.fixedCritNote || ''
        };
      }
      const obsDmg = Number(node.dmg) || 0;
      if (obsDmg > 0) {
        const pred = calcRealSkillDamage({ charName: base, stats, skill: m.skill }).damage;
        if (pred > 0) {
          const acc = calibSums.get(base) || { obs: 0, pred: 0 };
          acc.obs += obsDmg;
          acc.pred += pred;
          calibSums.set(base, acc);
        }
      }
    }
  }

  // Pass 2: For unmatched rows with damage > 0, use calibrated scaleFactor from Pass 1 OR raw stats to match DB skill
  for (const node of nodes) {
    if (node._matchedPass1) {
      delete node._matchedPass1;
      continue;
    }
    const base = getBase(node.char && node.char !== '未知' ? node.char : fallbackChar);
    const stats = getStatsFor(base);
    if (!stats) continue;
    const acc = calibSums.get(base);
    const scaleFactor = acc && acc.pred > 0 ? (acc.obs / acc.pred) : null;
    const m = matchRoleSkillFromTextOrDamage({
      charName: base,
      rawText: node.action || '',
      dmg: Number(node.dmg) || 0,
      skillTypeHint: node.skill || '',
      stats,
      rc: stats.rc ?? 0,
      scaleFactor,
      maxRelErr: 0.25
    });
    if (m && m.skill) {
      node.skill = skillOpts.includes(m.skill.skillType) ? m.skill.skillType : node.skill;
      node.fixedCrit = Boolean(m.fixedCrit);
      node.fixedCritRate = m.fixedCrit ? Number(m.fixedCritRate) : undefined;
      node.dbFixedCritNote = m.reason || '常規暴擊';
      node.matchMethod = m.matchMethod === 'calibrated_dmg' ? '他招校準反推' : (m.matchMethod === 'raw_dmg' ? '原始參數反推' : '多語文字匹配');
      if (!node.skillMeta) {
        node.skillMeta = {
          id: m.skill.id,
          name: m.skill.name,
          mvPct: Number(m.skill.mvPct) || 100,
          skillType: m.skill.skillType || '普攻',
          statType: m.skill.statType || 'atk',
          element: m.skill.element || '',
          fixedCrit: Boolean(m.skill.fixedCrit),
          fixedCritRate: m.skill.fixedCritRate ?? null,
          fixedCritDmg: m.skill.fixedCritDmg ?? null,
          rcFixedCritReq: m.skill.rcFixedCritReq ?? null,
          fixedCritNote: m.skill.fixedCritNote || ''
        };
      }
    } else if (!node.dbFixedCritNote) {
      node.dbFixedCritNote = '未匹配 (常規暴擊)';
    }
  }
};

const runAutoMatchOnDraft = () => {
  autoMatchNodesWithDb(activeDraftNodes.value);
  recalculateRotTotals(draftRot.value, builderTab.value);
};

const getNodeDbCritBadge = (node) => {
  if (node?.fixedCrit) {
    const rate = node.fixedCritRate !== undefined && node.fixedCritRate !== null ? Number(node.fixedCritRate) : 100;
    if (rate === 0) return { text: 'DB: 不可暴擊 (0%)', cls: 'bg-slate-800 text-slate-300 border-slate-600' };
    return { text: `DB: 固暴 ${rate}%`, cls: 'bg-amber-900/50 text-amber-300 border-amber-500/60' };
  }
  if (node?.skillMeta?.rcFixedCritReq) {
    return { text: `需 S${node.skillMeta.rcFixedCritReq} 必暴 (當前未解鎖)`, cls: 'bg-gray-900 text-gray-400 border-gray-700' };
  }
  return { text: node?.dbFixedCritNote && node.dbFixedCritNote !== '常規暴擊' ? node.dbFixedCritNote : '常規暴擊', cls: 'bg-gray-900/60 text-gray-500 border-gray-800' };
};

// 鏡像折損軸邏輯
const syncMirrorFromMain = () => {
  const sourceNodes = draftRot.value.gridData || [];
  if (!sourceNodes.length) return alert(t('請先建立或解析主循環軸動作節點！'));
  draftRot.value.switchGridData = sourceNodes.map(n => {
    const d = parseFloat(n.dmg) || 0;
    return {
      time: parseFloat(n.time) || 0,
      char: n.char || draftRot.value.c1,
      action: n.action || t('動作'),
      skill: n.skill || '普攻',
      baseDmg: d,
      dmg: d,
      ratio: 100,
      fixedCrit: !!n.fixedCrit,
      fixedCritRate: n.fixedCritRate ?? 80
    };
  });
  draftRot.value.switchDuration = draftRot.value.duration || 25;
  draftRot.value.hasSwitchRot = true;
  draftRot.value.switchDps = draftRot.value.dps || 0;
  alert(t('✅ 已建立與主軸 1:1 完全鏡像的折損表！'));
};

const applyMirrorRatioFromNode = () => {
  const list = draftRot.value.switchGridData || [];
  if (!list.length) return alert(t('請先引用主軸生成鏡像表！'));
  const sIdx = parseInt(mirrorTool.startIndex) || 0;
  const ratio = Math.max(0, Math.min(200, parseFloat(mirrorTool.ratio) || 0));
  for (let i = sIdx; i < list.length; i++) {
    const node = list[i];
    const base = node.baseDmg !== undefined ? node.baseDmg : (parseFloat(node.dmg) || 0);
    node.baseDmg = base;
    node.ratio = ratio;
    node.dmg = Math.round(base * (ratio / 100));
  }
  recalculateRotTotals(draftRot.value, 'switch');
};

const onSwitchRatioChange = (node) => {
  const base = node.baseDmg !== undefined ? node.baseDmg : (parseFloat(node.dmg) || 0);
  node.baseDmg = base;
  node.dmg = Math.round(base * ((parseFloat(node.ratio) || 0) / 100));
  recalculateRotTotals(draftRot.value, 'switch');
};

// Base85 + LZString WW2_ 分享碼系統 (與 4.9.x 相容)
const SAFE_BASE85 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#";
const BASE = BigInt(85);

function encodeBase85(bytes) {
  if (bytes.length === 0) return "";
  let hex = "0x";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  let num = BigInt(hex);
  let str = "";
  while (num > 0n) { str = SAFE_BASE85[Number(num % BASE)] + str; num = num / BASE; }
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length; i++) { if (bytes[i] === 0) leadingZeros++; else break; }
  for (let i = 0; i < leadingZeros; i++) str = SAFE_BASE85[0] + str;
  return str;
}

function decodeBase85(str) {
  if (!str) return new Uint8Array(0);
  let leadingZeros = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === SAFE_BASE85[0]) leadingZeros++;
    else break;
  }
  let bytes = [];
  let num = 0n, pow = 1n;
  for (let i = str.length - 1; i >= leadingZeros; i--) {
    const idx = SAFE_BASE85.indexOf(str[i]);
    if (idx !== -1) { num += BigInt(idx) * pow; pow *= BASE; }
  }
  if (num > 0n) {
    let hex = num.toString(16);
    if (hex.length % 2 !== 0) hex = '0' + hex;
    for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  for (let i = 0; i < leadingZeros; i++) bytes.unshift(0);
  return new Uint8Array(bytes);
}

const parseFixedCritToken = (token) => {
  if (!token || token === '0') return { fixedCrit: false, fixedCritRate: 80 };
  if (token === '1') return { fixedCrit: true, fixedCritRate: 80 };
  if (String(token).startsWith('1:')) {
    const rate = parseFloat(String(token).split(':')[1]);
    return { fixedCrit: true, fixedCritRate: isNaN(rate) ? 80 : rate };
  }
  return { fixedCrit: false, fixedCritRate: 80 };
};

const exportRotation = async (rot) => {
  try {
    const encodeChar = (name) => {
      if (!name) return 999;
      const idx = characterOrder.indexOf(name);
      if (idx >= 0 && idx < 46 && !ROVER_VARIANTS.includes(name)) return idx;
      return name;
    };
    let diffId = ['🟩', '🔵', '⭐', '⚠️', '🧩'].indexOf(rot.diff);
    if (diffId === -1) diffId = 2;
    const teamNames = [rot.c1, rot.c2, rot.c3];

    const flatGridString = (rot.gridData || []).map(r => {
      let cPos = teamNames.indexOf(r.char); if (cPos === -1) cPos = 99;
      let sId = skillOpts.indexOf(r.skill); if (sId === -1) sId = 99;
      const safeAction = (r.action || r.name || "").replace(/[|;]/g, " ");
      const fcToken = r.fixedCrit ? `1:${r.fixedCritRate ?? 80}` : '0';
      return `${cPos};${sId};${r.time};${r.dmg};${safeAction};${fcToken}`;
    }).join('|');

    const flatSwitchGridString = (rot.switchGridData || []).map(r => {
      let cPos = teamNames.indexOf(r.char); if (cPos === -1) cPos = 99;
      let sId = skillOpts.indexOf(r.skill); if (sId === -1) sId = 99;
      const safeAction = (r.action || r.name || "").replace(/[|;]/g, " ");
      const base = r.baseDmg !== undefined ? r.baseDmg : r.dmg;
      const ratio = r.ratio !== undefined ? r.ratio : 100;
      const fcToken = r.fixedCrit ? `1:${r.fixedCritRate ?? 80}` : '0';
      return `${cPos};${sId};${r.time};${r.dmg};${safeAction};${base};${ratio};${fcToken}`;
    }).join('|');

    const customMeta = {};
    teamNames.forEach(cName => {
      if (cName && charData[cName]?.isCustom) {
        customMeta[cName] = { element: charData[cName].element || '衍射', rarity: charData[cName].rarity || 5, gen: charData[cName].gen || 3, max: charData[cName].max || 1 };
      }
    });

    const dpsVal = parseFloat(rot.dps) || 0;
    const durVal = parseFloat(rot.duration) || 25;
    const exportData = {
      c: [encodeChar(rot.c1), encodeChar(rot.c2), encodeChar(rot.c3)],
      df: diffId, dp: dpsVal, du: durVal, td: parseFloat((dpsVal * durVal).toFixed(2)),
      g: flatGridString, bcr: rot.baseCritRates || {}, ucr: rot.buffCritRates || {},
      hasSwitch: !!rot.hasSwitchRot, sdu: rot.switchDuration || 25, sdp: rot.switchDps || null, sg: flatSwitchGridString,
      cm: Object.keys(customMeta).length > 0 ? customMeta : undefined
    };
    const compressedBytes = LZString.compressToUint8Array(JSON.stringify(exportData));
    const shareCode = "WW2_" + encodeBase85(compressedBytes);
    await navigator.clipboard.writeText(shareCode);
    alert(t('✅ 排軸【{name}】專屬分享碼已複製！').replace('{name}', t(rot.rot)));
  } catch (err) {
    alert(t("❌ 複製失敗：") + err.message);
  }
};

// 純文字解析與 WW2_ 導入
const charAliasEntries = (() => {
  const seen = new Set();
  const entries = [];
  const addAlias = (alias, canonical) => {
    if (!alias || typeof alias !== 'string') return;
    const clean = alias.trim();
    if (!clean) return;
    const key = `${clean.toLowerCase()}::${canonical}`;
    if (!seen.has(key)) { seen.add(key); entries.push({ alias: clean, canonical }); }
  };
  [...ROVER_VARIANTS, ...characterOrder].forEach(c => {
    addAlias(c, c);
    if (zhCN[c]) addAlias(zhCN[c], c);
    if (ja[c]) addAlias(ja[c], c);
    if (en[c]) addAlias(en[c], c);
  });
  return entries.sort((a, b) => b.alias.length - a.alias.length);
})();

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseNodesFromRawText = (rawStr) => {
  const gridNodes = [];
  let totalDmg = 0, maxTime = 0, lastTime = 0;
  rawStr.split('\n').forEach(line => {
    const rawLine = line.trim();
    if (!rawLine) return;
    const tokens = rawLine.split(/\s+/);
    const extractedNums = [];
    tokens.forEach((tok, idx) => {
      const cleanToken = tok.replace(/,/g, '');
      if (/^-?\d+(\.\d+)?$/.test(cleanToken)) {
        extractedNums.push({ val: parseFloat(cleanToken), idx, hasDecimal: cleanToken.includes('.') });
      }
    });
    if (extractedNums.length < 2) return;
    const timeObj = extractedNums.find(n => n.val >= lastTime && n.hasDecimal) || extractedNums[0];
    const remainingNums = extractedNums.filter(n => n !== timeObj).sort((a, b) => b.val - a.val);
    const dmgObj = remainingNums[0];
    const tNum = timeObj ? timeObj.val : NaN;
    const dNum = dmgObj ? dmgObj.val : NaN;
    if (!isNaN(tNum)) lastTime = tNum;
    let actionText = tokens.filter((_, idx) => idx !== timeObj?.idx && idx !== dmgObj?.idx).join(' ');
    let charName = t('未知');
    for (const entry of charAliasEntries) {
      const isAscii = /^[\x00-\x7F]+$/.test(entry.alias);
      const pattern = isAscii ? new RegExp(`\\b${escapeRegExp(entry.alias)}\\b`, 'gi') : new RegExp(escapeRegExp(entry.alias), 'g');
      if (pattern.test(actionText)) {
        charName = entry.canonical;
        actionText = actionText.replace(pattern, '').trim();
        break;
      }
    }
    const finalAction = actionText.replace(/^(Basic|Skill|Heavy|Liberation|Echo|Intro|Outro|Forte|TB):\s*/i, '').replace(/^[-_・\[\]【】\s]+/g, '').trim() || t('動作');
    gridNodes.push({ time: tNum, action: finalAction, dmg: dNum, char: charName, skill: '普攻', fixedCrit: false });
    totalDmg += dNum;
    if (tNum > maxTime) maxTime = tNum;
  });
  gridNodes.sort((a, b) => a.time - b.time);
  autoMatchNodesWithDb(gridNodes);
  return { gridNodes, totalDmg, maxTime: parseFloat(maxTime.toFixed(1)) };
};

const importMagicOrShareCode = () => {
  const inputStr = magicInput.value.trim();
  if (!inputStr) return;

  if (inputStr.startsWith('WW2_')) {
    let decodedData = null;
    const payload = inputStr.substring(4);
    try {
      const bytes = decodeBase85(payload);
      if (bytes.length > 0) {
        const jsonStr = LZString.decompressFromUint8Array(bytes);
        if (jsonStr) decodedData = JSON.parse(jsonStr);
      }
    } catch (e) {}
    if (!decodedData) {
      try { decodedData = JSON.parse(decodeURIComponent(escape(atob(payload)))); } catch (e) {
        try { decodedData = JSON.parse(atob(payload)); } catch (e2) {}
      }
    }
    if (!decodedData) return alert(t('❌ 解析失敗，請確認分享碼格式。'));

    if (decodedData.cm) {
      const localCustomChars = JSON.parse(localStorage.getItem('ww_custom_characters') || '[]');
      let updated = false;
      Object.keys(decodedData.cm).forEach(cName => {
        if (!charData[cName]) {
          const meta = decodedData.cm[cName];
          const item = { name: cName, rarity: meta.rarity, gen: meta.gen, element: meta.element, max: meta.max, isCustom: true };
          localCustomChars.push(item); charData[cName] = item;
          if (!characterOrder.includes(cName)) characterOrder.push(cName);
          globalStore.ownedCharacters.add(cName);
          updated = true;
        }
      });
      if (updated) localStorage.setItem('ww_custom_characters', JSON.stringify(localCustomChars));
    }
    const decodeChar = (val) => (typeof val === 'number' ? (val >= 0 && val < 46 ? characterOrder[val] : t('未知')) : (val || ''));
    const c1 = decodeChar(decodedData.c?.[0]), c2 = decodeChar(decodedData.c?.[1]), c3 = decodeChar(decodedData.c?.[2]);
    const teamNames = [c1, c2, c3];
    const diffOptions = ['🟩', '🔵', '⭐', '⚠️', '🧩'];
    const gridData = (decodedData.g || '').split('|').filter(Boolean).map(row => {
      const p = row.split(';'); const fc = parseFixedCritToken(p[5]);
      return { char: teamNames[parseInt(p[0])] || t('未知'), skill: skillOpts[parseInt(p[1])] || '普攻', time: parseFloat(p[2]) || 0, dmg: parseFloat(p[3]) || 0, action: p[4] || '', fixedCrit: fc.fixedCrit, fixedCritRate: fc.fixedCritRate };
    }).sort((a, b) => a.time - b.time);
    const switchGridData = (decodedData.sg || '').split('|').filter(Boolean).map(row => {
      const p = row.split(';'); const d = parseFloat(p[3]) || 0; const fc = parseFixedCritToken(p[7]);
      return { char: teamNames[parseInt(p[0])] || t('未知'), skill: skillOpts[parseInt(p[1])] || '普攻', time: parseFloat(p[2]) || 0, dmg: d, action: p[4] || '', baseDmg: p[5] !== undefined ? parseFloat(p[5]) : d, ratio: p[6] !== undefined ? parseFloat(p[6]) : 100, fixedCrit: fc.fixedCrit, fixedCritRate: fc.fixedCritRate };
    });

    Object.assign(draftRot.value, {
      c1: c1 !== t('未知') ? c1 : '',
      c2: c2 !== t('未知') ? c2 : '',
      c3: c3 !== t('未知') ? c3 : '',
      diff: typeof decodedData.df === 'number' ? (diffOptions[decodedData.df] || '⭐') : (decodedData.df || '⭐'),
      dps: decodedData.dp || 0,
      duration: decodedData.du || 25,
      totalDmg: decodedData.td || ((decodedData.dp || 0) * (decodedData.du || 25)),
      baseCritRates: decodedData.bcr || {},
      buffCritRates: decodedData.ucr || {},
      hasSwitchRot: !!decodedData.hasSwitch,
      switchDuration: decodedData.sdu || 25,
      switchDps: decodedData.sdp || null,
      gridData,
      switchGridData
    });
    magicInput.value = '';
    showTextImporter.value = false;
    return alert(t('✅ 分享碼導入成功！'));
  }

  const { gridNodes, totalDmg, maxTime } = parseNodesFromRawText(inputStr);
  if (gridNodes.length === 0) return alert(t('❌ 解析失敗。請確認格式包含時間與傷害數字。'));
  draftRot.value.gridData = gridNodes;
  draftRot.value.duration = maxTime || 25;
  draftRot.value.totalDmg = parseFloat((totalDmg / 10000).toFixed(2));
  draftRot.value.dps = parseFloat((maxTime > 0 ? (totalDmg / maxTime / 10000) : 0).toFixed(2));
  magicInput.value = '';
  showTextImporter.value = false;
};

// ============================================================================
// 真實操作鍵位順序排軸器狀態與方法 (Real Operation Keybind Builder)
// ============================================================================
const builderInputMode = ref('keybind'); // 'keybind' | 'skillNode'
const keybindState = reactive({
  activeSection: 'loop', // 'opener' | 'loop'
  activeChar: '',
  activeSegIdx: 0,
  showShorthandBox: false,
  shorthandText: '',
  openerSegments: [],
  loopSegments: []
});

const draftTeamChars = computed(() => {
  return [draftRot.value.c1, draftRot.value.c2, draftRot.value.c3].filter(Boolean);
});

const activeKeybindChar = computed(() => {
  if (keybindState.activeChar && draftTeamChars.value.includes(keybindState.activeChar)) {
    return keybindState.activeChar;
  }
  return draftRot.value.c1 || draftTeamChars.value[0] || '';
});

const activeCharSpecialVariants = computed(() => {
  const ch = activeKeybindChar.value;
  if (!ch) return [];
  return getCharKeybindVariants(getBase(ch));
});

const getActiveSegmentArray = (section = keybindState.activeSection) => {
  return section === 'opener' ? keybindState.openerSegments : keybindState.loopSegments;
};

const groupSegmentsIntoVisualRows = (segments = []) => {
  const rows = [];
  (segments || []).forEach((seg, segIdx) => {
    if (seg.inline && rows.length > 0) {
      rows[rows.length - 1].push({ seg, segIdx });
    } else {
      rows.push([{ seg, segIdx }]);
    }
  });
  return rows;
};

const openerVisualRows = computed(() => groupSegmentsIntoVisualRows(keybindState.openerSegments));
const loopVisualRows = computed(() => groupSegmentsIntoVisualRows(keybindState.loopSegments));

const getCharElemBadgeStyle = (charName) => {
  const base = getBase(charName);
  const el = charData[base]?.element || '氣動';
  const map = {
    '氣動': 'border-emerald-400 bg-emerald-950/80 text-emerald-200',
    '導電': 'border-purple-400 bg-purple-950/80 text-purple-200',
    '熱熔': 'border-rose-400 bg-rose-950/80 text-rose-200',
    '冷凝': 'border-sky-400 bg-sky-950/80 text-sky-200',
    '衍射': 'border-amber-300 bg-amber-950/80 text-amber-200',
    '湮滅': 'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-200'
  };
  return map[el] || 'border-gray-500 bg-gray-900 text-gray-200';
};

const getStepTooltip = (charName, step) => {
  const base = getBase(charName);
  const slotObj = getCharLoadoutState(base);
  const activeSlot = slotObj?.slots?.[slotObj?.activeSlot === 1 ? 1 : 0];
  const res = resolveKeybindActionToSkills(base, step, { mainEchoId: activeSlot?.mainEchoId });
  if (res.isCancel) return '右鍵閃避：取消前招後搖硬直約 0.25 秒';
  const sk = res.combinedSkill;
  if (!sk) return step.label;
  return `${charName} · ${res.actionLabel} [${sk.skillType} · Lv.10 總倍率 ${sk.mvPct}%]`;
};

const compileDraftKeybinds = () => {
  const teamCtx = {
    getCharSlot: (ch) => {
      const base = getBase(ch);
      const st = getCharLoadoutState(base);
      return st?.slots?.[st?.activeSlot === 1 ? 1 : 0] || null;
    },
    getCharStats: (ch) => getCharStats(getBase(ch)),
    extraAtkPct: Number(skillPicker.extraAtkPct) || 0,
    extraDmgBonusPct: Number(skillPicker.extraDmgBonusPct) || 0,
    extraAmplifyPct: Number(skillPicker.extraAmplifyPct) || 0
  };

  if (keybindState.openerSegments.length > 0) {
    const opRes = compileKeybindSectionToGrid(keybindState.openerSegments, teamCtx);
    draftRot.value.firstGridData = opRes.nodes;
    draftRot.value.firstDuration = opRes.totalDuration;
    draftRot.value.firstTotalDmg = parseFloat((opRes.totalDmg / 10000).toFixed(2));
    draftRot.value.firstDps = opRes.dpsWan;
  }
  if (keybindState.loopSegments.length > 0) {
    const lpRes = compileKeybindSectionToGrid(keybindState.loopSegments, teamCtx);
    draftRot.value.gridData = lpRes.nodes;
    draftRot.value.duration = lpRes.totalDuration;
    draftRot.value.totalDmg = parseFloat((lpRes.totalDmg / 10000).toFixed(2));
    draftRot.value.dps = lpRes.dpsWan;
  }

  recomputeSkillMetaNodes(draftRot.value);

  draftRot.value.keybindData = {
    openerSegments: JSON.parse(JSON.stringify(keybindState.openerSegments)),
    loopSegments: JSON.parse(JSON.stringify(keybindState.loopSegments))
  };

  if (matrixEvalResult.value) runMatrixBuffEval(draftRot.value);
};

const selectKeybindSegment = (section, segIdx, charName) => {
  keybindState.activeSection = section;
  keybindState.activeSegIdx = segIdx;
  if (charName) keybindState.activeChar = charName;
};

const addKeybindSegment = (charName, inline = false) => {
  const ch = charName || activeKeybindChar.value;
  if (!ch) return alert('請先在上方選擇主C / 副C / 輔助角色！');
  keybindState.activeChar = ch;
  const arr = getActiveSegmentArray();
  arr.push({
    id: 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    char: ch,
    inline: Boolean(inline && arr.length > 0),
    steps: []
  });
  keybindState.activeSegIdx = arr.length - 1;
};

const keybindDeriveMenu = ref(null);
const editingStepDerive = ref(null);

const getCharPriorSteps = (section, charName, upToSegIdx = null, upToStepIdx = null) => {
  const arr = getActiveSegmentArray(section);
  const baseTarget = getBase(charName);
  const collected = [];
  const segLimit = upToSegIdx !== null ? upToSegIdx : arr.length - 1;
  for (let i = 0; i <= segLimit && i < arr.length; i++) {
    const seg = arr[i];
    if (!seg || getBase(seg.char) !== baseTarget) continue;
    const steps = seg.steps || [];
    const stLimit = (upToSegIdx !== null && i === upToSegIdx && upToStepIdx !== null)
      ? upToStepIdx - 1
      : steps.length - 1;
    for (let j = 0; j <= stLimit && j < steps.length; j++) {
      collected.push(steps[j]);
    }
  }
  return collected;
};

const confirmKeybindDeriveChoice = (choice) => {
  keybindDeriveMenu.value = null;
  if (!choice) return;
  appendKeybindStep({ ...choice, skipDeriveCheck: true });
};

const dismissKeybindDeriveMenu = () => {
  keybindDeriveMenu.value = null;
};

const getStepDeriveEval = (section, segIdx, stepIdx, charName, step) => {
  if (!charName || !step || step.key === 'CANCEL') return { hasMetCandidate: false, candidates: [] };
  const prior = getCharPriorSteps(section, charName, segIdx, stepIdx);
  return evaluateCharKeybindDerivations(getBase(charName), prior, step.key);
};

const toggleStepDeriveMenu = (section, segIdx, stepIdx, charName, step) => {
  if (
    editingStepDerive.value &&
    editingStepDerive.value.section === section &&
    editingStepDerive.value.segIdx === segIdx &&
    editingStepDerive.value.stepIdx === stepIdx
  ) {
    editingStepDerive.value = null;
    return;
  }
  const evalRes = getStepDeriveEval(section, segIdx, stepIdx, charName, step);
  if (!evalRes.candidates.length) {
    editingStepDerive.value = null;
    return;
  }
  const baseKey = step.key === 'ENH_HEAVY' ? 'HEAVY' : (step.key === 'ENH_SKILL' ? 'SKILL' : step.key);
  editingStepDerive.value = {
    section,
    segIdx,
    stepIdx,
    char: charName,
    baseOption: {
      key: baseKey,
      label: KEYBIND_DEFS[baseKey]?.label || step.label,
      variant: '',
      skillId: '',
      count: 1
    },
    candidates: evalRes.candidates
  };
};

const applyStepDeriveChoice = (section, segIdx, stepIdx, choice) => {
  const arr = getActiveSegmentArray(section);
  const st = arr[segIdx]?.steps?.[stepIdx];
  if (!st || !choice) return;
  st.key = choice.key;
  st.label = choice.label || KEYBIND_DEFS[choice.key]?.label || st.label;
  st.variant = choice.variant || '';
  st.skillId = choice.skillId || '';
  if (choice.count && choice.count > 1) st.count = choice.count;
  editingStepDerive.value = null;
  compileDraftKeybinds();
};

const appendKeybindStep = (stepTemplate) => {
  const ch = activeKeybindChar.value;
  if (!ch) return alert('請先在上方選擇出戰角色！');

  if (!stepTemplate.skipDeriveCheck && !stepTemplate.skillId && !stepTemplate.variant) {
    // 若同一基礎按鍵的派生確認選單已開啟，再點一次直接以基礎招式輸入，不阻斷快速連按
    if (
      keybindDeriveMenu.value &&
      keybindDeriveMenu.value.char === ch &&
      keybindDeriveMenu.value.baseTemplate?.key === stepTemplate.key
    ) {
      const baseChoice = { ...keybindDeriveMenu.value.baseTemplate, skipDeriveCheck: true };
      keybindDeriveMenu.value = null;
      return appendKeybindStep(baseChoice);
    }
    const arrCheck = getActiveSegmentArray();
    const segIdxCheck = (keybindState.activeSegIdx >= 0 && keybindState.activeSegIdx < arrCheck.length && arrCheck[keybindState.activeSegIdx]?.char === ch)
      ? keybindState.activeSegIdx
      : null;
    const prior = getCharPriorSteps(keybindState.activeSection, ch, segIdxCheck, null);
    const evalRes = evaluateCharKeybindDerivations(getBase(ch), prior, stepTemplate.key);
    if (evalRes.hasMetCandidate) {
      keybindDeriveMenu.value = {
        char: ch,
        baseTemplate: { ...stepTemplate },
        candidates: evalRes.candidates
      };
      return;
    }
  }
  keybindDeriveMenu.value = null;

  const arr = getActiveSegmentArray();
  let targetIdx = keybindState.activeSegIdx;
  if (targetIdx < 0 || targetIdx >= arr.length || arr[targetIdx]?.char !== ch) {
    arr.push({
      id: 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      char: ch,
      inline: false,
      steps: []
    });
    targetIdx = arr.length - 1;
    keybindState.activeSegIdx = targetIdx;
  }
  const seg = arr[targetIdx];
  const lastStep = seg.steps[seg.steps.length - 1];
  const incomingCount = Number(stepTemplate.count) || 1;

  // 連點「普攻」或「強化重擊」（無特殊變體差異時）且未指定多重 count 時自動疊加 ×2 ~ ×5
  if (
    lastStep &&
    !stepTemplate.noStack &&
    incomingCount === 1 &&
    (stepTemplate.key === 'BASIC' || stepTemplate.key === 'ENH_HEAVY') &&
    lastStep.key === stepTemplate.key &&
    (lastStep.variant || '') === (stepTemplate.variant || '') &&
    (lastStep.label || '') === (stepTemplate.label || '') &&
    lastStep.count < 5
  ) {
    lastStep.count += 1;
  } else {
    seg.steps.push({
      key: stepTemplate.key,
      label: stepTemplate.label || KEYBIND_DEFS[stepTemplate.key]?.label || '普攻',
      variant: stepTemplate.variant || '',
      count: incomingCount,
      skillId: stepTemplate.skillId || ''
    });
  }
  compileDraftKeybinds();
};

const stepCountDelta = (section, segIdx, stepIdx, delta) => {
  const arr = getActiveSegmentArray(section);
  const st = arr[segIdx]?.steps?.[stepIdx];
  if (!st) return;
  const next = (Number(st.count) || 1) + delta;
  if (next <= 0) {
    arr[segIdx].steps.splice(stepIdx, 1);
  } else {
    st.count = Math.min(10, next);
  }
  compileDraftKeybinds();
};

const removeKeybindStep = (section, segIdx, stepIdx) => {
  const arr = getActiveSegmentArray(section);
  if (!arr[segIdx]) return;
  arr[segIdx].steps.splice(stepIdx, 1);
  compileDraftKeybinds();
};

const removeKeybindSegment = (section, segIdx) => {
  const arr = getActiveSegmentArray(section);
  arr.splice(segIdx, 1);
  if (keybindState.activeSegIdx >= arr.length) {
    keybindState.activeSegIdx = Math.max(0, arr.length - 1);
  }
  compileDraftKeybinds();
};

const toggleSegmentInline = (section, segIdx) => {
  const arr = getActiveSegmentArray(section);
  if (segIdx > 0 && arr[segIdx]) {
    arr[segIdx].inline = !arr[segIdx].inline;
    compileDraftKeybinds();
  }
};

const applyKeybindShorthandImport = () => {
  const parsed = parseKeybindShorthandText(keybindState.shorthandText, {
    c1: draftRot.value.c1,
    c2: draftRot.value.c2,
    c3: draftRot.value.c3
  });
  if (parsed.openerSegments.length === 0 && parsed.loopSegments.length === 0) {
    return alert('⚠️ 未能解析出任何鍵位指令，請檢查輸入格式！');
  }
  if (parsed.openerSegments.length > 0) keybindState.openerSegments = parsed.openerSegments;
  if (parsed.loopSegments.length > 0) keybindState.loopSegments = parsed.loopSegments;
  compileDraftKeybinds();
  keybindState.showShorthandBox = false;
};

const CALIBRATED_KEYBIND_ROTATIONS = PRESET_KEYBIND_ROTATIONS.filter(
  pr => (pr.title && pr.title.includes('校正')) || pr.id === 'preset_sigrika_qiuyuan_lili'
);

const filteredPresetKeybindRotations = computed(() => {
  const c1 = (draftRot.value?.c1 || '').trim();
  if (!c1) return CALIBRATED_KEYBIND_ROTATIONS.slice(0, 6);
  return CALIBRATED_KEYBIND_ROTATIONS.filter(pr => pr.c1 === c1 || (pr.title && pr.title.includes(c1)));
});

const loadKeybindPreset = (preset) => {
  if (!preset) return;
  draftRot.value.c1 = preset.c1;
  draftRot.value.c2 = preset.c2;
  draftRot.value.c3 = preset.c3;
  draftRot.value.rot = preset.title;
  draftRot.value.diff = '⭐';
  keybindState.activeChar = preset.c1;
  keybindState.shorthandText = preset.shorthand;
  const parsed = parseKeybindShorthandText(preset.shorthand, {
    c1: preset.c1,
    c2: preset.c2,
    c3: preset.c3
  });
  keybindState.openerSegments = parsed.openerSegments;
  keybindState.loopSegments = parsed.loopSegments;
  keybindState.activeSection = 'loop';
  keybindState.activeSegIdx = Math.max(0, parsed.loopSegments.length - 1);
  compileDraftKeybinds();
};

// 開啟新增或編輯
const openNewBuilder = (presetC1 = '') => {
  builderMode.value = 'new';
  builderTab.value = 'main';
  matrixEvalResult.value = null;
  draftRot.value = { ...createEmptyRot(), c1: presetC1 || '' };
  keybindState.openerSegments = [];
  keybindState.loopSegments = [];
  keybindState.activeChar = presetC1 || '';
  keybindState.activeSegIdx = 0;
  builderOpen.value = true;
};

const openEditBuilder = (rot) => {
  builderMode.value = 'edit';
  builderTab.value = 'main';
  matrixEvalResult.value = null;
  const copy = JSON.parse(JSON.stringify(rot));
  draftRot.value = {
    ...createEmptyRot(),
    ...copy,
    baseCritRates: { ...(copy.baseCritRates || {}) },
    buffCritRates: { ...(copy.buffCritRates || {}) },
    gridData: (copy.gridData || []).map(n => ({ ...n, fixedCrit: !!n.fixedCrit, fixedCritRate: n.fixedCritRate ?? 80 })),
    firstGridData: (copy.firstGridData || []).map(n => ({ ...n, fixedCrit: !!n.fixedCrit, fixedCritRate: n.fixedCritRate ?? 80 })),
    switchGridData: (copy.switchGridData || []).map(n => ({
      ...n,
      baseDmg: n.baseDmg !== undefined ? n.baseDmg : (parseFloat(n.dmg) || 0),
      ratio: n.ratio !== undefined ? n.ratio : 100,
      fixedCrit: !!n.fixedCrit,
      fixedCritRate: n.fixedCritRate ?? 80
    }))
  };
  keybindState.openerSegments = copy.keybindData?.openerSegments ? JSON.parse(JSON.stringify(copy.keybindData.openerSegments)) : [];
  keybindState.loopSegments = copy.keybindData?.loopSegments ? JSON.parse(JSON.stringify(copy.keybindData.loopSegments)) : [];
  keybindState.activeChar = copy.c1 || '';
  keybindState.activeSegIdx = 0;
  builderOpen.value = true;
  if ((draftRot.value.gridData || []).length > 0) {
    recomputeSkillMetaNodes(draftRot.value);
  } else if (keybindState.loopSegments.length === 0) {
    const matchedPreset = PRESET_KEYBIND_ROTATIONS.find(p =>
      (copy.presetKeybindId && p.id === copy.presetKeybindId) ||
      (p.c1 === copy.c1 && (p.c2 || '') === (copy.c2 || '') && (p.c3 || '') === (copy.c3 || ''))
    );
    if (matchedPreset) {
      const origRotTitle = draftRot.value.rot;
      const origDur = draftRot.value.duration;
      loadKeybindPreset(matchedPreset);
      if (origRotTitle) draftRot.value.rot = origRotTitle;
      if (origDur) draftRot.value.duration = origDur;
      builderInputMode.value = 'keybind';
    }
  }
};

const saveDraftRotation = () => {
  const r = draftRot.value;
  if (!r.c1 || !r.rot || !(parseFloat(r.dps) > 0)) {
    return alert(t('⚠️ 「主C」、「排軸名稱」與「DPS」為必填項目！'));
  }
  const b1 = getBase(r.c1), b2 = r.c2 ? getBase(r.c2) : null, b3 = r.c3 ? getBase(r.c3) : null;
  if ((b2 && b1 === b2) || (b3 && b1 === b3) || (b2 && b3 && b2 === b3)) {
    return alert(t('⚠️ 隊伍中不能包含重複的角色！'));
  }

  let saved = JSON.parse(localStorage.getItem('ww_custom_rotations_v2') || '[]');
  const rawId = r.id ? String(r.id) : Date.now().toString();
  const cleanId = rawId.replace('custom_rot_', '');
  const idx = saved.findIndex(x => String(x.id) === rawId || String(x.id) === cleanId);
  const dpsVal = parseFloat(r.dps) || 0;
  const durVal = parseFloat(r.duration) || 25;

  const payload = {
    id: idx !== -1 ? saved[idx].id : cleanId,
    c1: r.c1, c2: r.c2 || '', c3: r.c3 || '',
    rot: r.rot,
    dps: dpsVal,
    duration: durVal,
    totalDmg: parseFloat((dpsVal * durVal).toFixed(2)),
    diff: r.diff || '🧩',
    baseCritRates: { ...(r.baseCritRates || {}) },
    buffCritRates: { ...(r.buffCritRates || {}) },
    gridData: r.gridData || [],
    firstDuration: r.firstDuration ? parseFloat(r.firstDuration) : null,
    firstDps: r.firstDps ? parseFloat(r.firstDps) : null,
    firstTotalDmg: r.firstTotalDmg ? parseFloat(r.firstTotalDmg) : null,
    firstGridData: r.firstGridData || [],
    hasSwitchRot: !!r.hasSwitchRot,
    switchDuration: parseFloat(r.switchDuration) || 25,
    switchDps: r.switchDps ? parseFloat(r.switchDps) : null,
    switchGridData: r.switchGridData || [],
    keybindData: (keybindState.openerSegments.length > 0 || keybindState.loopSegments.length > 0)
      ? {
          openerSegments: JSON.parse(JSON.stringify(keybindState.openerSegments)),
          loopSegments: JSON.parse(JSON.stringify(keybindState.loopSegments))
        }
      : (r.keybindData || null),
    isUserCustom: true
  };

  if (idx !== -1) saved[idx] = payload;
  else saved.push(payload);
  localStorage.setItem('ww_custom_rotations_v2', JSON.stringify(saved));
  initStore();
  builderOpen.value = false;
  alert(t('✅ 排軸已成功儲存至排軸庫！'));
};

const deleteRotation = (rotId) => {
  if (!confirm(t('確定要刪除這個自訂排軸嗎？'))) return;
  const originalId = String(rotId).replace('custom_rot_', '');
  let saved = JSON.parse(localStorage.getItem('ww_custom_rotations_v2') || '[]');
  saved = saved.filter(r => String(r.id) !== originalId && String(r.id) !== String(rotId));
  localStorage.setItem('ww_custom_rotations_v2', JSON.stringify(saved));
  initStore();
};

const toggleDiff = (diffIcon) => {
  if (globalStore.activeDiffs.has(diffIcon)) globalStore.activeDiffs.delete(diffIcon);
  else globalStore.activeDiffs.add(diffIcon);
};

const groupedRotationsArray = computed(() => {
  const allRots = Object.values(dpsDataMap.value || {});
  const groups = {};
  allRots.forEach(rot => {
    if (!globalStore.activeDiffs.has(rot.diff)) return;
    const q = rotSearchQuery.value;
    if (q && !rot.rot.includes(q) && !(rot.c2 && rot.c2.includes(q)) && !(rot.c3 && rot.c3.includes(q)) && !(rot.c1 && rot.c1.includes(q))) return;
    const mainC = rot.c1 || '未知';
    if (!groups[mainC]) groups[mainC] = [];
    groups[mainC].push(rot);
  });
  const result = [];
  allSelectableCharacters.value.forEach(char => {
    if (groups[char]) {
      const rots = groups[char];
      result.push({ charName: char, rots, enabledCount: rots.filter(r => !globalStore.disabledRots.has(r.id)).length, totalCount: rots.length, hasDIY: rots.some(r => r.isUserCustom) });
      delete groups[char];
    }
  });
  Object.keys(groups).forEach(key => {
    const rots = groups[key];
    result.push({ charName: key, rots, enabledCount: rots.filter(r => !globalStore.disabledRots.has(r.id)).length, totalCount: rots.length, hasDIY: rots.some(r => r.isUserCustom) });
  });
  return result;
});

const activeFolderData = computed(() => groupedRotationsArray.value.find(g => g.charName === activeFolder.value)?.rots || []);

const toggleDisableState = (rotId, event) => {
  event.stopPropagation();
  if (globalStore.disabledRots.has(rotId)) globalStore.disabledRots.delete(rotId);
  else globalStore.disabledRots.add(rotId);
  localStorage.setItem('ww_disabled_rots', JSON.stringify([...globalStore.disabledRots]));
};

const handleExternalEnvOrLoadoutUpdate = () => {
  envRefreshTick.value++;
  if (builderOpen.value && draftRot.value?.c1) {
    recomputeSkillMetaNodes(draftRot.value);
  }
};

onMounted(async () => {
  window.addEventListener('ww-env-updated', handleExternalEnvOrLoadoutUpdate);
  window.addEventListener('ww-loadout-updated', handleExternalEnvOrLoadoutUpdate);
  for (const c of characterOrder) {
    try {
      const url = await avatarStorage.getAvatar(c);
      if (url) customAvatars.value[c] = url;
    } catch (e) {}
  }
});

onUnmounted(() => {
  window.removeEventListener('ww-env-updated', handleExternalEnvOrLoadoutUpdate);
  window.removeEventListener('ww-loadout-updated', handleExternalEnvOrLoadoutUpdate);
});
</script>

<template>
  <div class="bg-panel p-6 rounded-xl border border-glass shadow-lg relative">

    <!-- 頂部控制列 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
      <div>
        <h2 class="text-xl font-bold text-blue-400 flex items-center gap-2 m-0 border-none pb-0">
          <span>⚙️</span> 實戰排軸建置器與排軸庫
        </h2>
        <p class="text-xs text-gray-400 mt-1">結合角色雙專屬槽位裝備、Lv.10 實戰招式倍率庫與終焉矩陣 4-Buff 自動最高分測評。</p>
      </div>
      <div class="flex flex-wrap gap-2.5 w-full sm:w-auto items-center">
        <input v-model="rotSearchQuery" type="text" :placeholder="t('🔍 搜尋排軸或隊友...')"
               class="bg-[#16171d] text-content border border-gray-700 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:outline-none text-sm w-44 sm:w-56">
        <button @click="builderOpen ? (builderOpen = false) : openNewBuilder(activeFolder || '')"
                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm px-4 py-2 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap">
          <span>{{ builderOpen ? '✖ 關閉建置器' : '➕ 開啟排軸建置器' }}</span>
        </button>
      </div>
    </div>

    <!-- 難度過濾列 -->
    <div class="mb-5 bg-[#181920] p-3 rounded-xl border border-gray-800 flex items-center gap-3 flex-wrap">
      <span class="text-xs font-bold text-gray-300">🎯 {{ t('顯示難度：') }}</span>
      <button v-for="d in difficulties" :key="d.icon" @click="toggleDiff(d.icon)"
              class="px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 border"
              :class="globalStore.activeDiffs.has(d.icon) ? 'bg-gray-800 border-gray-600 text-white' : 'bg-transparent border-transparent text-gray-500 opacity-50'">
        <span>{{ d.icon }}</span><span>{{ t(d.name) }}</span>
      </button>
    </div>

    <!-- ================================================================ -->
    <!-- 重置化統一排軸建置器 (Single Unified Builder Panel)               -->
    <!-- ================================================================ -->
    <div v-if="builderOpen" class="bg-[#111218] p-5 rounded-xl border-2 border-emerald-500/60 mb-6 shadow-2xl space-y-4">
      <div class="flex flex-wrap justify-between items-center gap-3 border-b border-gray-800 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="text-lg font-black text-emerald-400">
            {{ builderMode === 'edit' ? '🔧 編輯實戰排軸' : '✨ 新建實戰排軸' }}
          </span>
          <a :href="partnerSheetUrl" target="_blank"
             class="bg-[#1e293b] hover:bg-blue-900/40 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-1 rounded font-bold no-underline">
            📊 {{ t('合作方排軸計算器') }}
          </a>
        </div>
        <div class="flex items-center gap-2">
          <button @click="showTextImporter = !showTextImporter"
                  class="bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-lg">
            📥 {{ showTextImporter ? '收合匯入框' : '貼上文字 / WW2_分享碼' }}
          </button>
          <button @click="runMatrixBuffEval(draftRot)"
                  class="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
            ⚡ 4-Buff 最高分測評
          </button>
          <button @click="builderOpen = false" class="text-gray-400 hover:text-white text-lg font-bold px-2">&times;</button>
        </div>
      </div>

      <!-- 摺疊式純文字 / WW2_ 分享碼匯入區 -->
      <div v-if="showTextImporter" class="bg-gray-900/80 border border-amber-500/30 rounded-lg p-3 space-y-2">
        <textarea v-model="magicInput" rows="3"
                  placeholder="貼上合作試算表純文字排軸，或貼上 WW2_ 開頭分享碼..."
                  class="w-full bg-gray-950 text-white text-xs font-mono border border-gray-700 rounded p-2 focus:border-amber-400 outline-none"></textarea>
        <div class="flex justify-end gap-2">
          <button @click="importMagicOrShareCode" class="bg-amber-600 hover:bg-amber-500 text-black text-xs font-black px-4 py-1.5 rounded">
            ⚡ 立即解析 / 匯入
          </button>
        </div>
      </div>

      <!-- 第一區：隊伍基本資料 & 2 槽位武器/套裝即時連動 -->
      <div id="rotation-editor-panel" class="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <div>
          <label class="block text-[11px] text-gray-400 font-bold mb-1">1. 主C *</label>
          <select v-model="draftRot.c1" class="w-full bg-gray-950 text-white text-xs border border-gray-700 rounded px-2 py-2 font-bold">
            <option value="">-- 選擇主C --</option>
            <option v-for="c in getAvailableCharactersForSlot(draftRot, 'c1')" :key="c" :value="c">{{ t(c) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 font-bold mb-1">2. 副C</label>
          <select v-model="draftRot.c2" class="w-full bg-gray-950 text-white text-xs border border-gray-700 rounded px-2 py-2">
            <option value="">(無)</option>
            <option v-for="c in getAvailableCharactersForSlot(draftRot, 'c2')" :key="c" :value="c">{{ t(c) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 font-bold mb-1">3. 輔助/生存</label>
          <select v-model="draftRot.c3" class="w-full bg-gray-950 text-white text-xs border border-gray-700 rounded px-2 py-2">
            <option value="">(無)</option>
            <option v-for="c in getAvailableCharactersForSlot(draftRot, 'c3')" :key="c" :value="c">{{ t(c) }}</option>
          </select>
        </div>
        <div class="col-span-2">
          <label class="block text-[11px] text-gray-400 font-bold mb-1">排軸名稱 *</label>
          <input v-model="draftRot.rot" type="text" placeholder="例：清宵 S6R5 雲琅主C實戰軸"
                 class="w-full bg-gray-950 text-white text-xs border border-gray-700 rounded px-2.5 py-2 font-bold">
        </div>
        <div>
          <label class="block text-[11px] text-gray-400 font-bold mb-1">難度分級</label>
          <select v-model="draftRot.diff" class="w-full bg-gray-950 text-white text-xs border border-gray-700 rounded px-2 py-2">
            <option v-for="d in difficulties" :key="d.icon" :value="d.icon">{{ d.icon }} {{ t(d.name) }}</option>
          </select>
        </div>
      </div>

      <!-- 出戰成員當前武器 / 套裝 / 共鳴鏈 2-Slot 切換卡 -->
      <div v-if="draftTeamSummaries.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div v-for="m in draftTeamSummaries" :key="m.base"
             class="bg-gray-900/70 border border-gray-800 rounded-lg p-2.5 flex flex-col gap-1"
             :style="{ borderLeft: '4px solid ' + m.weaponRarityMeta.borderHex }">
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-black text-amber-300">{{ t(m.name) }}</span>
              <select :value="m.rc" @change="handleBuilderRcChange(m.base, $event.target.value)"
                      class="bg-amber-950/50 border border-amber-500/50 text-amber-200 rounded px-1 py-0.5 text-[10px] font-black outline-none cursor-pointer">
                <option v-for="lvl in [0,1,2,3,4,5,6]" :key="lvl" :value="lvl">S{{ lvl }}</option>
              </select>
            </div>
            <div class="inline-flex rounded border border-gray-700 overflow-hidden text-[10px]">
              <button @click="handleBuilderSlotSwitch(m.base, 0)"
                      :class="m.activeIdx === 0 ? 'bg-amber-500 text-black font-black' : 'bg-gray-950 text-gray-400'"
                      class="px-2 py-0.5">槽位1</button>
              <button @click="handleBuilderSlotSwitch(m.base, 1)"
                      :class="m.activeIdx === 1 ? 'bg-cyan-500 text-black font-black' : 'bg-gray-950 text-gray-400'"
                      class="px-2 py-0.5">槽位2</button>
            </div>
          </div>
          <div class="text-[11px] text-gray-300 truncate flex items-center gap-1">
            <span class="px-1 py-0 rounded border text-[9px] font-black shrink-0" :class="m.weaponRarityMeta.badgeClass">{{ m.weaponRarity }}★</span>
            <span class="font-bold shrink-0" :class="m.weaponRarityMeta.textClass">{{ m.weaponName }} R{{ m.weaponRank }}</span>
            <span class="text-gray-500">·</span>
            <span class="truncate">💿 {{ m.setName }}</span>
          </div>
          <div class="text-[11px] text-gray-400 flex justify-between font-mono">
            <span>👾 {{ m.echoName }} ({{ m.echoTotalCost }}/12C)</span>
            <span class="text-emerald-400">ATK {{ m.stats.totalAtk }} | {{ m.stats.critRate }}%/{{ m.stats.critDmg }}%</span>
          </div>
        </div>
      </div>

      <!-- 輸入模式切換列：真實操作鍵位順序排軸 vs 傳統招式倍率庫節點 -->
      <div class="flex flex-wrap items-center justify-between gap-2 bg-[#161822] p-2 rounded-xl border border-gray-800">
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" @click="builderInputMode = 'keybind'"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border"
                  :class="builderInputMode === 'keybind'
                    ? 'bg-amber-500 text-black border-amber-300 shadow-md'
                    : 'bg-gray-900 text-gray-300 border-gray-700 hover:text-white'">
            <span>🎮 真實操作鍵位順序排軸 (啟動軸 + 循環軸 膠囊圖譜)</span>
            <span class="px-1.5 py-0.5 rounded bg-purple-900/70 text-purple-200 border border-purple-400/50 text-[10px] font-bold">🧪 實驗性功能</span>
          </button>
          <button type="button" @click="builderInputMode = 'skillNode'"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border"
                  :class="builderInputMode === 'skillNode'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-gray-900 text-gray-300 border-gray-700 hover:text-white'">
            <span>📊 單招倍率庫微調加入器</span>
          </button>
        </div>
        <div v-if="filteredPresetKeybindRotations.length > 0" class="flex flex-wrap items-center gap-1.5">
          <button v-for="pr in filteredPresetKeybindRotations" :key="pr.id"
                  type="button"
                  @click="builderInputMode = 'keybind'; loadKeybindPreset(pr)"
                  class="bg-emerald-950/80 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-500/50 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors">
            📋 載入範例：{{ pr.title.split(' ')[0] }}
          </button>
        </div>
      </div>

      <!-- ================================================================ -->
      <!-- 模式 A：真實操作鍵位順序排軸器 (Visual Keybind Capsule Builder)   -->
      <!-- ================================================================ -->
      <div v-if="builderInputMode === 'keybind'" class="bg-[#0e131f] border border-amber-500/40 rounded-xl p-4 space-y-3.5">
        <!-- 頂部：編輯區段切換 & 角色選擇 & 簡譜快貼 -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-black text-amber-300">🎮 鍵位輸入目標：</span>
            <div class="inline-flex rounded-lg border border-gray-700 overflow-hidden text-xs">
              <button type="button"
                      @click="keybindState.activeSection = 'opener'; keybindState.activeSegIdx = Math.max(0, keybindState.openerSegments.length - 1)"
                      :class="keybindState.activeSection === 'opener' ? 'bg-purple-600 text-white font-black' : 'bg-gray-950 text-gray-400'"
                      class="px-3 py-1">
                🚀 啟動軸 ({{ keybindState.openerSegments.length }} 段)
              </button>
              <button type="button"
                      @click="keybindState.activeSection = 'loop'; keybindState.activeSegIdx = Math.max(0, keybindState.loopSegments.length - 1)"
                      :class="keybindState.activeSection === 'loop' ? 'bg-emerald-600 text-white font-black' : 'bg-gray-950 text-gray-400'"
                      class="px-3 py-1">
                🔁 循環軸 ({{ keybindState.loopSegments.length }} 段)
              </button>
            </div>

            <!-- 當前操作角色切換與新增操作段 -->
            <div class="flex items-center gap-1 ml-1">
              <span class="text-[11px] text-gray-400">出招角色：</span>
              <button v-for="ch in draftTeamChars" :key="ch"
                      type="button"
                      @click="keybindState.activeChar = ch"
                      class="px-2.5 py-1 rounded-full text-xs font-black border transition-all flex items-center gap-1"
                      :class="activeKeybindChar === ch
                        ? 'bg-amber-500 text-black border-amber-300 shadow'
                        : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'">
                <span>{{ t(ch) }}</span>
              </button>
              <button type="button"
                      @click="addKeybindSegment(activeKeybindChar, false)"
                      class="bg-blue-900/70 hover:bg-blue-800 text-blue-200 border border-blue-500/50 text-[11px] font-bold px-2.5 py-1 rounded-lg ml-1">
                ➕ 換行新操作列
              </button>
              <button type="button"
                      @click="addKeybindSegment(activeKeybindChar, true)"
                      title="在同一橫排緊接上一段合軸顯示（如圖中第一排：莉莉 → 仇遠 → 莉莉）"
                      class="bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/50 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                ⇄ 同行合軸段
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button"
                    @click="keybindState.showShorthandBox = !keybindState.showShorthandBox"
                    class="bg-gray-900 hover:bg-gray-800 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg">
              📝 {{ keybindState.showShorthandBox ? '收合鍵位簡譜框' : '文字鍵位簡譜快貼' }}
            </button>
            <button type="button"
                    @click="compileDraftKeybinds()"
                    class="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded-lg shadow">
              ⚡ 重新編譯傷害節點
            </button>
          </div>
        </div>

        <!-- 選填：文字鍵位簡譜快貼框 -->
        <div v-if="keybindState.showShorthandBox" class="bg-gray-950/90 border border-amber-500/40 rounded-lg p-3 space-y-2">
          <div class="flex justify-between items-center text-[11px] text-gray-400">
            <span>支援格式：<code class="text-amber-300">啟動軸</code> / <code class="text-emerald-300">循環軸</code> 標題，每行 <code class="text-cyan-300">角色: 變奏 聲骸 普攻×4 重擊(鏈刃) 大招</code>；同行合軸用 <code class="text-amber-300">|</code> 分隔</span>
          </div>
          <textarea v-model="keybindState.shorthandText" rows="5"
                    placeholder="啟動軸&#10;莉莉: 共鳴技能 | 仇遠: 重擊 普攻 重擊 | 莉莉: 聲骸 大招&#10;西格莉卡: 變奏 聲骸 普攻×4 重擊(鏈刃) 大招&#10;循環軸&#10;西格莉卡: 變奏 聲骸 重擊(爆破) 大招"
                    class="w-full bg-[#090b10] text-gray-100 text-xs font-mono border border-gray-700 rounded p-2.5 focus:border-amber-400 outline-none"></textarea>
          <div class="flex justify-end gap-2">
            <button type="button" @click="applyKeybindShorthandImport"
                    class="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-1.5 rounded-lg">
              ⚡ 解析簡譜並生成鍵位膠囊軸
            </button>
          </div>
        </div>

        <!-- 實戰按鍵輸入盤 (Standard Keys + Character-Specific Variant Keys) -->
        <div class="bg-[#141926] border border-gray-800 rounded-xl p-3 space-y-2.5">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-bold text-gray-400 mr-1">基礎鍵位點擊輸入 (連點普攻/強化重擊自動疊加 ×N)：</span>
            <!-- 變奏 -->
            <button type="button" @click="appendKeybindStep({ key: 'INTRO', label: '變奏' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black shadow-sm">
              變奏
            </button>
            <!-- 左鍵 普攻 -->
            <button type="button" @click="appendKeybindStep({ key: 'BASIC', label: '普攻' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="inline-block w-3 h-3.5 rounded-sm border border-[#18181b] bg-white relative overflow-hidden shrink-0">
                <span class="absolute top-0 left-0 w-1.5 h-2 bg-[#f97316]"></span>
              </span>
              <span>普攻</span>
            </button>
            <!-- 長按 重擊 -->
            <button type="button" @click="appendKeybindStep({ key: 'HEAVY', label: '重擊' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="inline-block w-3 h-3.5 rounded-sm border border-[#18181b] bg-white relative overflow-hidden shrink-0">
                <span class="absolute top-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>
                <span class="absolute top-0.5 left-0 w-1.5 h-2 bg-[#2dd4bf]"></span>
              </span>
              <span>重擊</span>
            </button>
            <!-- 長按 強化重擊 -->
            <button type="button" @click="appendKeybindStep({ key: 'ENH_HEAVY', label: '強化重擊' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="inline-block w-3 h-3.5 rounded-sm border border-[#18181b] bg-white relative overflow-hidden shrink-0">
                <span class="absolute top-0 left-0 right-0 h-0.5 bg-[#f97316]"></span>
                <span class="absolute top-0.5 left-0 w-1.5 h-2 bg-[#2dd4bf]"></span>
              </span>
              <span>強化重擊</span>
            </button>
            <!-- E 共鳴技能 -->
            <button type="button" @click="appendKeybindStep({ key: 'SKILL', label: '共鳴技能' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="px-1 py-0 text-[10px] font-black border border-[#18181b] rounded bg-white text-[#18181b] leading-tight">E</span>
              <span>共鳴技能</span>
            </button>
            <!-- E 強化技能 -->
            <button type="button" @click="appendKeybindStep({ key: 'ENH_SKILL', label: '強化技能' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="px-1 py-0 text-[10px] font-black border border-[#18181b] rounded bg-[#5eead4] text-[#18181b] leading-tight">E</span>
              <span>強化技能</span>
            </button>
            <!-- Q 聲骸 -->
            <button type="button" @click="appendKeybindStep({ key: 'ECHO', label: '聲骸' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="px-1 py-0 text-[10px] font-black border border-[#18181b] rounded bg-white text-[#18181b] leading-tight">Q</span>
              <span>聲骸</span>
            </button>
            <!-- R 大招 -->
            <button type="button" @click="appendKeybindStep({ key: 'ULT', label: '大招' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="px-1 py-0 text-[10px] font-black border border-[#18181b] rounded bg-white text-[#18181b] leading-tight">R</span>
              <span>大招</span>
            </button>
            <!-- F 處決 -->
            <button type="button" @click="appendKeybindStep({ key: 'EXEC', label: '處決' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="px-1 py-0 text-[10px] font-black border border-[#18181b] rounded bg-[#fde047] text-[#18181b] leading-tight">F</span>
              <span>處決</span>
            </button>
            <!-- 右鍵 閃避 -->
            <button type="button" @click="appendKeybindStep({ key: 'CANCEL', label: '閃避' })"
                    class="bg-[#f4f1ea] hover:bg-white text-[#18181b] border-2 border-[#18181b] rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 shadow-sm">
              <span class="inline-block w-3 h-3.5 rounded-sm border border-[#18181b] bg-white relative overflow-hidden shrink-0">
                <span class="absolute top-0 right-0 w-1.5 h-2 bg-[#f97316]"></span>
              </span>
              <span>閃避</span>
            </button>
          </div>

          <!-- 當前角色專屬派生招式按鍵 (自動從 DB 抓取，如西格莉卡 鏈刃/爆破/大日靈、仇遠 強化重擊×3、清宵 弦劍/天鈞蕩煞/凌霄) -->
          <div v-if="activeCharSpecialVariants.length > 0" class="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-gray-800/80">
            <span class="text-[11px] font-bold text-cyan-300 mr-1">✨ {{ t(activeKeybindChar) }} 專屬派生鍵位：</span>
            <button v-for="(v, vIdx) in activeCharSpecialVariants" :key="vIdx"
                    type="button"
                    :title="v.title || v.label"
                    @click="appendKeybindStep({ key: v.key, label: v.label, variant: v.variant, count: v.count || 1, skillId: v.skillId || '', noStack: true })"
                    class="bg-cyan-950/90 hover:bg-cyan-800 text-cyan-100 border border-cyan-400/60 rounded-lg px-2.5 py-1 text-xs font-black flex items-center gap-1 transition-colors">
              <span v-if="v.key === 'ENH_SKILL'" class="px-1 py-0 text-[10px] font-black border border-black rounded bg-[#5eead4] text-black leading-tight">E</span>
              <span v-else-if="v.key === 'EXEC'" class="px-1 py-0 text-[10px] font-black border border-black rounded bg-[#fde047] text-black leading-tight">F</span>
              <span v-else class="text-[10px] text-teal-300">🖱️</span>
              <span>{{ v.label }}{{ v.variant ? ` (${v.variant})` : '' }}{{ (v.count || 1) > 1 ? `×${v.count}` : '' }}</span>
              <span v-if="v.mvPct" class="text-[10px] text-cyan-300/80 font-mono">[{{ v.mvPct }}%]</span>
            </button>
          </div>

          <!-- 派生技能達成條件確認選單 (鍵位輸入時自動檢測前置條件並彈出選單確認) -->
          <div v-if="keybindDeriveMenu" class="bg-amber-950/90 border border-amber-400/70 rounded-xl p-2.5 space-y-2 shadow-lg">
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="font-black text-amber-200">
                ⚡ 偵測到「{{ t(keybindDeriveMenu.char) }}」的【{{ keybindDeriveMenu.baseTemplate.label }}】已達成派生要求，請確認是否為派生技能：
              </span>
              <button type="button" @click="dismissKeybindDeriveMenu" class="text-[11px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-gray-900/70">✕ 取消</button>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button"
                      @click="confirmKeybindDeriveChoice(keybindDeriveMenu.baseTemplate)"
                      class="bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-600 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors">
                保留基礎：{{ keybindDeriveMenu.baseTemplate.label }}
              </button>
              <button v-for="(c, cIdx) in keybindDeriveMenu.candidates" :key="'derive_' + cIdx"
                      type="button"
                      @click="confirmKeybindDeriveChoice({ key: c.key, label: c.label, variant: c.variant, count: c.count || 1, skillId: c.skillId || '', noStack: true })"
                      class="rounded-lg px-2.5 py-1 text-xs font-black border flex items-center gap-1.5 transition-colors"
                      :class="c.met
                        ? 'bg-emerald-950/90 hover:bg-emerald-800 text-emerald-100 border-emerald-400/80'
                        : 'bg-gray-900/60 hover:bg-gray-800 text-gray-400 border-gray-700'">
                <span v-if="c.met" class="text-[10px] px-1 py-0 rounded bg-emerald-500 text-black font-black">✓ 已達要求</span>
                <span v-else class="text-[10px] px-1 py-0 rounded bg-gray-700 text-gray-300">未達</span>
                <span>{{ c.label }}{{ c.variant ? `（${c.variant}）` : '' }}{{ (c.count || 1) > 1 ? `×${c.count}` : '' }}</span>
                <span v-if="c.mvPct" class="text-[10px] font-mono opacity-80">[{{ c.mvPct }}%]</span>
                <span class="text-[10px] opacity-70 hidden sm:inline">({{ c.reqLabel }})</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- 視覺化膠囊排軸圖譜畫布 (啟動軸 + 循環軸 — 還原原圖視覺風格)    -->
        <!-- ============================================================== -->
        <div class="bg-[#e8e4dc] text-[#18181b] rounded-xl p-4 border-2 border-[#18181b] shadow-inner space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#cfc9bc] pb-2">
            <div class="text-base font-black tracking-wide text-[#18181b]">
              {{ draftRot.rot || (draftTeamChars.length ? `全01 ${draftTeamChars.map(c => c[0]).join('')} 實戰鍵位軸` : '實戰操作鍵位軸圖譜') }}
            </div>
            <div class="text-[11px] font-bold text-[#52504c]">
              💡 點擊任意膠囊條可接續輸入；滑鼠移至招式可查看對應 DB 技能與 Lv.10 倍率，點擊 ×N 可增減段數
            </div>
          </div>

          <!-- 1. 啟動軸 (Opener) -->
          <div v-if="openerVisualRows.length > 0 || keybindState.activeSection === 'opener'" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-black text-[#18181b] tracking-wider">啟動軸</span>
              <span v-if="draftRot.firstGridData && draftRot.firstGridData.length > 0"
                    class="text-xs font-mono font-bold bg-[#18181b] text-amber-300 px-2.5 py-0.5 rounded-full">
                ⏱️ {{ draftRot.firstDuration }}s ｜ 💥 總傷 {{ draftRot.firstTotalDmg }}萬 ｜ ⚡ DPS {{ draftRot.firstDps }}萬/s
              </span>
            </div>

            <div v-if="openerVisualRows.length === 0"
                 @click="keybindState.activeSection = 'opener'; addKeybindSegment(activeKeybindChar, false)"
                 class="border-2 border-dashed border-[#8c857b] rounded-xl p-3 text-center text-xs font-bold text-[#57534e] cursor-pointer hover:bg-[#ded9ce]">
              + 點此新增「啟動軸」第一條角色鍵位序列
            </div>

            <div v-for="(row, rIdx) in openerVisualRows" :key="'op_row_' + rIdx"
                 class="flex flex-wrap items-center gap-3">
              <div v-for="item in row" :key="item.seg.id"
                   @click="selectKeybindSegment('opener', item.segIdx, item.seg.char)"
                   class="inline-flex items-center group cursor-pointer">
                <!-- 角色圓形頭像徽章 -->
                <div class="w-10 h-10 rounded-full border-2 border-[#18181b] flex items-center justify-center shrink-0 z-10 overflow-hidden shadow-md font-black text-xs select-none"
                     :class="customAvatars[item.seg.char] ? 'bg-gray-900' : getCharElemBadgeStyle(item.seg.char)"
                     :title="item.seg.char">
                  <img v-if="customAvatars[item.seg.char]" :src="customAvatars[item.seg.char]" class="w-full h-full object-cover" />
                  <span v-else>{{ item.seg.char.slice(0, 2) }}</span>
                </div>

                <!-- 鍵位膠囊條 -->
                <div class="-ml-2 pl-3.5 pr-2.5 py-1.5 rounded-r-xl border-2 border-[#18181b] bg-[#f7f5f0] shadow-[2px_3px_0_#18181b] flex flex-wrap items-center gap-2 transition-all"
                     :class="keybindState.activeSection === 'opener' && keybindState.activeSegIdx === item.segIdx ? 'ring-2 ring-purple-600 bg-white' : ''">
                  <span v-if="item.seg.steps.length === 0" class="text-xs text-gray-400 italic">點擊上方按鍵加入招式...</span>

                  <div v-for="(step, sIdx) in item.seg.steps" :key="sIdx"
                       :title="getStepTooltip(item.seg.char, step)"
                       class="inline-flex items-center gap-1 text-xs font-black text-[#18181b] px-1 py-0.5 rounded hover:bg-amber-200/70 transition-colors">
                    <!-- 左鍵圖示 -->
                    <span v-if="step.key === 'BASIC'"
                          class="inline-block w-3.5 h-4 rounded-[3px] border-[1.5px] border-[#18181b] bg-white relative overflow-hidden shrink-0">
                      <span class="absolute top-0 left-0 w-1.5 h-2 bg-[#f97316] border-r border-b border-[#18181b]"></span>
                    </span>
                    <!-- 右鍵閃避圖示 -->
                    <span v-else-if="step.key === 'CANCEL'"
                          class="inline-block w-3.5 h-4 rounded-[3px] border-[1.5px] border-[#18181b] bg-white relative overflow-hidden shrink-0">
                      <span class="absolute top-0 right-0 w-1.5 h-2 bg-[#f97316] border-l border-b border-[#18181b]"></span>
                    </span>
                    <!-- 長按重擊圖示 -->
                    <span v-else-if="step.key === 'HEAVY' || step.key === 'ENH_HEAVY' || step.key === 'BASIC_ENH_HEAVY'"
                          class="inline-block w-3.5 h-4 rounded-[3px] border-[1.5px] border-[#18181b] bg-white relative overflow-hidden shrink-0">
                      <span class="absolute top-0 left-0 right-0 h-[2px] bg-[#f97316]"></span>
                      <span class="absolute top-[2px] left-0 w-1.5 h-2 bg-[#2dd4bf] border-r border-b border-[#18181b]"></span>
                    </span>
                    <!-- E / Q / R / F 鍵帽 -->
                    <span v-else-if="step.key === 'SKILL' || step.key === 'ENH_SKILL' || step.key === 'ECHO' || step.key === 'ULT' || step.key === 'EXEC'"
                          class="px-1 py-0 text-[10px] font-black border-[1.5px] border-[#18181b] rounded-[3px] leading-tight shrink-0"
                          :class="step.key === 'EXEC'
                            ? 'bg-[#fde047] text-[#18181b]'
                            : ((step.key === 'ENH_SKILL' && (step.label === '大日靈' || step.variant)) ? 'bg-[#5eead4] text-[#18181b]' : 'bg-white text-[#18181b]')">
                      {{ KEYBIND_DEFS[step.key]?.badge || 'E' }}
                    </span>

                    <!-- 動作文字與變體/段數 -->
                    <span @click.stop="stepCountDelta('opener', item.segIdx, sIdx, 1)"
                          class="select-none cursor-pointer">
                      {{ step.label }}{{ step.variant ? `（${step.variant}）` : '' }}{{ (step.count || 1) > 1 ? `×${step.count}` : '' }}
                    </span>

                    <!-- 派生技能確認選單切換鈕 -->
                    <div v-if="getStepDeriveEval('opener', item.segIdx, sIdx, item.seg.char, step).candidates.length > 0" class="relative inline-flex items-center">
                      <button type="button"
                              @click.stop="toggleStepDeriveMenu('opener', item.segIdx, sIdx, item.seg.char, step)"
                              title="透過選單確認是否為派生技能"
                              class="text-[10px] px-1 rounded border leading-tight font-black transition-colors"
                              :class="getStepDeriveEval('opener', item.segIdx, sIdx, item.seg.char, step).hasMetCandidate
                                ? 'bg-amber-300 border-[#18181b] text-[#18181b] hover:bg-amber-400'
                                : 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300'">
                        ▾
                      </button>
                      <div v-if="editingStepDerive && editingStepDerive.section === 'opener' && editingStepDerive.segIdx === item.segIdx && editingStepDerive.stepIdx === sIdx"
                           @click.stop
                           class="absolute left-0 top-full mt-1 z-50 min-w-[230px] bg-gray-950 text-white border border-amber-400 rounded-lg shadow-xl p-1.5 space-y-1 text-[11px]">
                        <div class="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 border-b border-gray-800">確認是否為派生技能：</div>
                        <button type="button"
                                @click="applyStepDeriveChoice('opener', item.segIdx, sIdx, editingStepDerive.baseOption)"
                                class="w-full text-left px-2 py-1 rounded hover:bg-gray-800 flex items-center justify-between gap-2">
                          <span>基礎：{{ editingStepDerive.baseOption.label }}</span>
                          <span v-if="!step.variant && !step.skillId" class="text-emerald-400 text-[10px]">目前</span>
                        </button>
                        <button v-for="(c, cIdx) in editingStepDerive.candidates" :key="'op_dm_' + cIdx"
                                type="button"
                                @click="applyStepDeriveChoice('opener', item.segIdx, sIdx, c)"
                                class="w-full text-left px-2 py-1 rounded hover:bg-gray-800 flex items-center justify-between gap-2">
                          <span class="flex items-center gap-1">
                            <span v-if="c.met" class="text-[9px] px-1 rounded bg-emerald-500 text-black font-black">✓達標</span>
                            <span class="font-bold">{{ c.label }}{{ c.variant ? `（${c.variant}）` : '' }}{{ (c.count || 1) > 1 ? `×${c.count}` : '' }}</span>
                          </span>
                          <span v-if="c.mvPct" class="font-mono text-cyan-300 text-[10px]">{{ c.mvPct }}%</span>
                        </button>
                      </div>
                    </div>

                    <!-- 單步刪除小鈕 -->
                    <button type="button"
                            @click.stop="removeKeybindStep('opener', item.segIdx, sIdx)"
                            class="opacity-0 group-hover:opacity-100 text-[10px] text-rose-600 hover:text-rose-800 font-black ml-0.5 px-0.5">
                      ×
                    </button>
                  </div>

                  <!-- 膠囊末端 ┳ 標記 -->
                  <span class="text-[10px] font-mono font-black text-[#18181b] ml-0.5 select-none">┳</span>

                  <!-- 段落控制 (同行合軸切換 / 刪段) -->
                  <div class="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 ml-1 pl-1 border-l border-gray-300">
                    <button v-if="item.segIdx > 0" type="button"
                            @click.stop="toggleSegmentInline('opener', item.segIdx)"
                            title="切換是否與上一段同行顯示 (合軸)"
                            class="text-[10px] px-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold">
                      {{ item.seg.inline ? '↵換行' : '⇄同行' }}
                    </button>
                    <button type="button"
                            @click.stop="removeKeybindSegment('opener', item.segIdx)"
                            title="刪除此角色操作段"
                            class="text-[10px] px-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold">
                      刪
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 循環軸 (Loop) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-black text-[#18181b] tracking-wider">循環軸</span>
              <span v-if="draftRot.gridData && draftRot.gridData.length > 0"
                    class="text-xs font-mono font-bold bg-[#18181b] text-emerald-300 px-2.5 py-0.5 rounded-full">
                ⏱️ {{ draftRot.duration }}s ｜ 💥 總傷 {{ draftRot.totalDmg }}萬 ｜ ⚡ DPS {{ draftRot.dps }}萬/s
              </span>
            </div>

            <div v-if="loopVisualRows.length === 0"
                 @click="keybindState.activeSection = 'loop'; addKeybindSegment(activeKeybindChar, false)"
                 class="border-2 border-dashed border-[#8c857b] rounded-xl p-3 text-center text-xs font-bold text-[#57534e] cursor-pointer hover:bg-[#ded9ce]">
              + 點此新增「循環軸」第一條角色鍵位序列（或點右上角「📋 載入範例：全01西仇莉上限軸」一鍵體驗）
            </div>

            <div v-for="(row, rIdx) in loopVisualRows" :key="'lp_row_' + rIdx"
                 class="flex flex-wrap items-center gap-3">
              <div v-for="item in row" :key="item.seg.id"
                   @click="selectKeybindSegment('loop', item.segIdx, item.seg.char)"
                   class="inline-flex items-center group cursor-pointer">
                <!-- 角色圓形頭像徽章 -->
                <div class="w-10 h-10 rounded-full border-2 border-[#18181b] flex items-center justify-center shrink-0 z-10 overflow-hidden shadow-md font-black text-xs select-none"
                     :class="customAvatars[item.seg.char] ? 'bg-gray-900' : getCharElemBadgeStyle(item.seg.char)"
                     :title="item.seg.char">
                  <img v-if="customAvatars[item.seg.char]" :src="customAvatars[item.seg.char]" class="w-full h-full object-cover" />
                  <span v-else>{{ item.seg.char.slice(0, 2) }}</span>
                </div>

                <!-- 鍵位膠囊條 -->
                <div class="-ml-2 pl-3.5 pr-2.5 py-1.5 rounded-r-xl border-2 border-[#18181b] bg-[#f7f5f0] shadow-[2px_3px_0_#18181b] flex flex-wrap items-center gap-2 transition-all"
                     :class="keybindState.activeSection === 'loop' && keybindState.activeSegIdx === item.segIdx ? 'ring-2 ring-emerald-600 bg-white' : ''">
                  <span v-if="item.seg.steps.length === 0" class="text-xs text-gray-400 italic">點擊上方按鍵加入招式...</span>

                  <div v-for="(step, sIdx) in item.seg.steps" :key="sIdx"
                       :title="getStepTooltip(item.seg.char, step)"
                       class="inline-flex items-center gap-1 text-xs font-black text-[#18181b] px-1 py-0.5 rounded hover:bg-amber-200/70 transition-colors">
                    <!-- 左鍵圖示 -->
                    <span v-if="step.key === 'BASIC'"
                          class="inline-block w-3.5 h-4 rounded-[3px] border-[1.5px] border-[#18181b] bg-white relative overflow-hidden shrink-0">
                      <span class="absolute top-0 left-0 w-1.5 h-2 bg-[#f97316] border-r border-b border-[#18181b]"></span>
                    </span>
                    <!-- 右鍵閃避圖示 -->
                    <span v-else-if="step.key === 'CANCEL'"
                          class="inline-block w-3.5 h-4 rounded-[3px] border-[1.5px] border-[#18181b] bg-white relative overflow-hidden shrink-0">
                      <span class="absolute top-0 right-0 w-1.5 h-2 bg-[#f97316] border-l border-b border-[#18181b]"></span>
                    </span>
                    <!-- 長按重擊圖示 -->
                    <span v-else-if="step.key === 'HEAVY' || step.key === 'ENH_HEAVY' || step.key === 'BASIC_ENH_HEAVY'"
                          class="inline-block w-3.5 h-4 rounded-[3px] border-[1.5px] border-[#18181b] bg-white relative overflow-hidden shrink-0">
                      <span class="absolute top-0 left-0 right-0 h-[2px] bg-[#f97316]"></span>
                      <span class="absolute top-[2px] left-0 w-1.5 h-2 bg-[#2dd4bf] border-r border-b border-[#18181b]"></span>
                    </span>
                    <!-- E / Q / R / F 鍵帽 -->
                    <span v-else-if="step.key === 'SKILL' || step.key === 'ENH_SKILL' || step.key === 'ECHO' || step.key === 'ULT' || step.key === 'EXEC'"
                          class="px-1 py-0 text-[10px] font-black border-[1.5px] border-[#18181b] rounded-[3px] leading-tight shrink-0"
                          :class="step.key === 'EXEC'
                            ? 'bg-[#fde047] text-[#18181b]'
                            : ((step.key === 'ENH_SKILL' && (step.label === '大日靈' || step.variant)) ? 'bg-[#5eead4] text-[#18181b]' : 'bg-white text-[#18181b]')">
                      {{ KEYBIND_DEFS[step.key]?.badge || 'E' }}
                    </span>

                    <!-- 動作文字與變體/段數 -->
                    <span @click.stop="stepCountDelta('loop', item.segIdx, sIdx, 1)"
                          class="select-none cursor-pointer">
                      {{ step.label }}{{ step.variant ? `（${step.variant}）` : '' }}{{ (step.count || 1) > 1 ? `×${step.count}` : '' }}
                    </span>

                    <!-- 派生技能確認選單切換鈕 -->
                    <div v-if="getStepDeriveEval('loop', item.segIdx, sIdx, item.seg.char, step).candidates.length > 0" class="relative inline-flex items-center">
                      <button type="button"
                              @click.stop="toggleStepDeriveMenu('loop', item.segIdx, sIdx, item.seg.char, step)"
                              title="透過選單確認是否為派生技能"
                              class="text-[10px] px-1 rounded border leading-tight font-black transition-colors"
                              :class="getStepDeriveEval('loop', item.segIdx, sIdx, item.seg.char, step).hasMetCandidate
                                ? 'bg-amber-300 border-[#18181b] text-[#18181b] hover:bg-amber-400'
                                : 'bg-gray-200 border-gray-400 text-gray-700 hover:bg-gray-300'">
                        ▾
                      </button>
                      <div v-if="editingStepDerive && editingStepDerive.section === 'loop' && editingStepDerive.segIdx === item.segIdx && editingStepDerive.stepIdx === sIdx"
                           @click.stop
                           class="absolute left-0 top-full mt-1 z-50 min-w-[230px] bg-gray-950 text-white border border-amber-400 rounded-lg shadow-xl p-1.5 space-y-1 text-[11px]">
                        <div class="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 border-b border-gray-800">確認是否為派生技能：</div>
                        <button type="button"
                                @click="applyStepDeriveChoice('loop', item.segIdx, sIdx, editingStepDerive.baseOption)"
                                class="w-full text-left px-2 py-1 rounded hover:bg-gray-800 flex items-center justify-between gap-2">
                          <span>基礎：{{ editingStepDerive.baseOption.label }}</span>
                          <span v-if="!step.variant && !step.skillId" class="text-emerald-400 text-[10px]">目前</span>
                        </button>
                        <button v-for="(c, cIdx) in editingStepDerive.candidates" :key="'lp_dm_' + cIdx"
                                type="button"
                                @click="applyStepDeriveChoice('loop', item.segIdx, sIdx, c)"
                                class="w-full text-left px-2 py-1 rounded hover:bg-gray-800 flex items-center justify-between gap-2">
                          <span class="flex items-center gap-1">
                            <span v-if="c.met" class="text-[9px] px-1 rounded bg-emerald-500 text-black font-black">✓達標</span>
                            <span class="font-bold">{{ c.label }}{{ c.variant ? `（${c.variant}）` : '' }}{{ (c.count || 1) > 1 ? `×${c.count}` : '' }}</span>
                          </span>
                          <span v-if="c.mvPct" class="font-mono text-cyan-300 text-[10px]">{{ c.mvPct }}%</span>
                        </button>
                      </div>
                    </div>

                    <!-- 單步刪除小鈕 -->
                    <button type="button"
                            @click.stop="removeKeybindStep('loop', item.segIdx, sIdx)"
                            class="opacity-0 group-hover:opacity-100 text-[10px] text-rose-600 hover:text-rose-800 font-black ml-0.5 px-0.5">
                      ×
                    </button>
                  </div>

                  <!-- 膠囊末端 ┳ 標記 -->
                  <span class="text-[10px] font-mono font-black text-[#18181b] ml-0.5 select-none">┳</span>

                  <!-- 段落控制 (同行合軸切換 / 刪段) -->
                  <div class="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 ml-1 pl-1 border-l border-gray-300">
                    <button v-if="item.segIdx > 0" type="button"
                            @click.stop="toggleSegmentInline('loop', item.segIdx)"
                            title="切換是否與上一段同行顯示 (合軸)"
                            class="text-[10px] px-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold">
                      {{ item.seg.inline ? '↵換行' : '⇄同行' }}
                    </button>
                    <button type="button"
                            @click.stop="removeKeybindSegment('loop', item.segIdx)"
                            title="刪除此角色操作段"
                            class="text-[10px] px-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold">
                      刪
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二區：實戰招式庫加入器 (Real Combat Skill Builder) -->
      <div v-if="builderInputMode === 'skillNode'" class="bg-[#0b1322] border border-blue-500/35 rounded-xl p-3.5 space-y-2.5">
        <div class="flex flex-wrap justify-between items-center gap-2">
          <span class="text-xs font-black text-blue-300">⚔️ 從角色實戰招式庫加入節點（自動套用裝備/套裝/共鳴鏈/矩陣環境）</span>
          <div class="flex items-center gap-2">
            <button type="button" @click="skillPicker.showExtraMods = !skillPicker.showExtraMods"
                    class="bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 text-[11px] font-bold px-2.5 py-1 rounded">
              ⚙️ {{ skillPicker.showExtraMods ? '收合額外微調' : '額外乘區微調' }}
            </button>
            <button @click="recomputeSkillMetaNodes(draftRot)"
                    class="bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-[11px] font-bold px-2.5 py-1 rounded">
              🔄 依當前槽位重新計算所有招式節點
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs items-end">
          <div>
            <label class="block text-[10px] text-gray-400 mb-0.5">施放成員</label>
            <select v-model="skillPicker.casterSlot" class="w-full bg-gray-950 text-white border border-gray-700 rounded px-2 py-1.5">
              <option value="c1" v-if="draftRot.c1">主C：{{ t(draftRot.c1) }}</option>
              <option value="c2" v-if="draftRot.c2">副C：{{ t(draftRot.c2) }}</option>
              <option value="c3" v-if="draftRot.c3">輔/生：{{ t(draftRot.c3) }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-[10px] text-gray-400 mb-0.5">選擇實戰招式 (Lv.10 倍率庫)</label>
            <select v-model="skillPicker.selectedSkillId" class="w-full bg-gray-950 text-emerald-300 font-bold border border-gray-700 rounded px-2 py-1.5">
              <option v-for="sk in activeCasterSkills" :key="sk.id" :value="sk.id">
                {{ sk.name }} [{{ sk.skillType }} · {{ sk.mvPct }}%]
              </option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] text-gray-400 mb-0.5">時間點 (秒)</label>
            <input v-model.number="skillPicker.time" type="number" step="0.1" class="w-full bg-gray-950 text-amber-300 font-mono border border-gray-700 rounded px-2 py-1.5">
          </div>
          <div>
            <label class="block text-[10px] text-gray-400 mb-0.5">次數 / 段數</label>
            <input v-model.number="skillPicker.hits" type="number" min="1" step="1" class="w-full bg-gray-950 text-white font-mono border border-gray-700 rounded px-2 py-1.5">
          </div>
          <div>
            <button @click="addPickedSkillNode"
                    class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow">
              ➕ 加入節點
            </button>
          </div>
        </div>

        <!-- 若選擇自訂倍率，展開自訂欄位 -->
        <div v-if="skillPicker.selectedSkillId === '__custom__'" class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <input v-model="skillPicker.customActionName" type="text" placeholder="招式名稱" class="bg-gray-950 text-white border border-gray-700 rounded px-2 py-1">
          <input v-model.number="skillPicker.customMvPct" type="number" step="1" placeholder="倍率 %" class="bg-gray-950 text-white border border-gray-700 rounded px-2 py-1">
          <select v-model="skillPicker.customSkillType" class="bg-gray-950 text-white border border-gray-700 rounded px-2 py-1">
            <option v-for="s in skillOpts" :key="s" :value="s">{{ s }}</option>
          </select>
          <select v-model="skillPicker.customStatType" class="bg-gray-950 text-white border border-gray-700 rounded px-2 py-1">
            <option value="atk">吃攻擊力 (ATK)</option>
            <option value="hp">吃生命值 (HP)</option>
            <option value="def">吃防禦力 (DEF)</option>
          </select>
        </div>

        <!-- 選填：進階額外 Buff 覆寫微調列（預設收合） -->
        <div v-if="skillPicker.showExtraMods" class="grid grid-cols-2 sm:grid-cols-8 gap-2 text-[11px] pt-2 border-t border-gray-800/80">
          <div>
            <span class="text-gray-400">敵等級(奇藏)</span>
            <input v-model.number="skillPicker.enemyLv" type="number" step="10" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">敵抗性%</span>
            <input v-model.number="skillPicker.enemyResPct" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">外加攻擊%</span>
            <input v-model.number="skillPicker.extraAtkPct" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">外加增傷%</span>
            <input v-model.number="skillPicker.extraDmgBonusPct" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">傷害加深%</span>
            <input v-model.number="skillPicker.extraAmplifyPct" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">外加暴傷%</span>
            <input v-model.number="skillPicker.extraCritDmg" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">無視防%</span>
            <input v-model.number="skillPicker.extraIgnoreDefPct" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
          <div>
            <span class="text-gray-400">減防%</span>
            <input v-model.number="skillPicker.extraDefShredPct" type="number" step="5" class="w-full bg-gray-950 text-white border border-gray-800 rounded px-1.5 py-1 font-mono">
          </div>
        </div>

        <div v-if="skillPickerPreview" class="flex flex-wrap justify-between items-center gap-2 pt-1 text-xs font-mono text-gray-300">
          <div class="flex flex-wrap gap-3">
            <span>預期傷害：<strong class="text-emerald-400">{{ skillPickerPreview.expectedTotal.toLocaleString() }}</strong></span>
            <span>滿暴傷害：<strong class="text-amber-300">{{ skillPickerPreview.critTotal.toLocaleString() }}</strong></span>
            <span class="text-gray-400">(暴擊 {{ skillPickerPreview.critRatePct }}% / 暴傷 {{ skillPickerPreview.critDmgPct }}%)</span>
          </div>
        </div>
      </div>

      <!-- 4-Buff 實測結果面板 -->
      <div v-if="matrixEvalResult" class="bg-gray-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-2">
        <div class="flex flex-wrap justify-between items-center gap-2 border-b border-gray-800 pb-2">
          <span class="text-xs font-black text-cyan-300">
            🏆 終焉矩陣 ({{ matrixEvalResult.version }} 期) 4-Buff 實戰比較排名
          </span>
          <span v-if="matrixEvalResult.best" class="text-xs text-emerald-300 font-bold">
            最高分建議：{{ matrixEvalResult.best.category }}（{{ matrixEvalResult.best.score.toLocaleString() }} 分）
          </span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div v-for="(item, rIdx) in matrixEvalResult.ranked" :key="item.buffId"
               :class="rIdx === 0 ? 'bg-amber-950/30 border-amber-400/70' : 'bg-gray-900/70 border-gray-800'"
               class="border rounded-lg p-2.5 flex flex-col justify-between gap-1.5 text-xs">
            <div>
              <div class="flex justify-between items-center font-black">
                <span :class="rIdx === 0 ? 'text-amber-300' : 'text-gray-300'">#{{ rIdx + 1 }} {{ item.category }}</span>
                <span class="font-mono text-cyan-300">x{{ item.matrixMult.toFixed(2) }}</span>
              </div>
              <div class="text-[11px] text-gray-400 mt-0.5">{{ item.name }}</div>
            </div>
            <div class="font-mono text-[11px] space-y-0.5 border-t border-gray-800 pt-1.5">
              <div class="flex justify-between">
                <span class="text-gray-400">軸總傷害：</span>
                <span class="text-white font-bold">{{ item.totalDmg.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">實戰 DPS：</span>
                <span class="text-emerald-400 font-bold">{{ (item.expectedDps / 10000).toFixed(2) }}w/s</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">單隊估算分：</span>
                <span :class="rIdx === 0 ? 'text-amber-300 font-black' : 'text-white font-bold'">{{ item.score.toLocaleString() }}</span>
              </div>
            </div>
            <button @click="applyBestBuffToEnv(item.buffId)"
                    class="w-full py-1 rounded text-[11px] font-bold transition-colors"
                    :class="rIdx === 0 ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'">
              {{ rIdx === 0 ? '👑 套用最高分 Buff' : '套用此 Buff' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 第三區：排軸分段頁籤與時間軸節點表格 -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2">
        <div class="flex gap-2">
          <button @click="builderTab = 'main'"
                  :class="builderTab === 'main' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold">
            主循環軸 ({{ (draftRot.gridData || []).length }})
          </button>
          <button @click="builderTab = 'opener'"
                  :class="builderTab === 'opener' ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold">
            啟動軸 ({{ (draftRot.firstGridData || []).length }})
          </button>
          <button @click="builderTab = 'switch'"
                  :class="builderTab === 'switch' ? 'bg-amber-600 text-black' : 'bg-gray-900 text-gray-400'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold">
            轉火折損軸 ({{ (draftRot.switchGridData || []).length }})
          </button>
        </div>

        <div class="flex items-center gap-3 text-xs font-mono">
          <span>循環時長：<input v-model.number="draftRot.duration" type="number" step="0.5" class="w-16 bg-gray-950 border border-gray-700 rounded px-1.5 py-0.5 text-white text-center"> s</span>
          <span>DPS (萬/s)：<input v-model.number="draftRot.dps" type="number" step="0.01" class="w-20 bg-gray-950 border border-emerald-500/50 rounded px-1.5 py-0.5 text-emerald-400 font-bold text-center"></span>
          <span class="text-gray-400">區間 [{{ draftMcRange.minDps.toFixed(2) }}~{{ draftMcRange.maxDps.toFixed(2) }}w]</span>
        </div>
      </div>

      <!-- 轉火折損自動推演與手動覆寫控制列 -->
      <div v-if="builderTab === 'switch'" class="space-y-3">
        <div class="bg-cyan-950/25 border border-cyan-500/40 rounded-xl p-3 space-y-2 text-xs">
          <div class="flex flex-wrap justify-between items-center gap-2 border-b border-gray-800 pb-2">
            <div>
              <span class="font-black text-cyan-300">⚡ 轉火折損自動推演（於每波斬殺瞬間自動重算後續殘軸與連鎖轉火）</span>
              <div class="text-[11px] text-gray-400 mt-0.5">
                {{ draftRot.hasSwitchRot ? '目前使用「手動鏡像表」覆寫；取消勾選即可改由引擎於戰報中依 1.5s 轉場耗時、目標狀態清空與 14~15s Buff 到期動態計算。' : '目前為「自動動態計算模式（推薦）」：推演中任一招式斬殺時，系統會自動計算之後每招傷害、連殺殘軸衰減與恢復週期。' }}
              </div>
            </div>
            <label class="flex items-center gap-1.5 font-bold text-amber-300 bg-gray-900 px-2.5 py-1 rounded border border-amber-500/40 cursor-pointer">
              <input type="checkbox" v-model="draftRot.hasSwitchRot" class="accent-amber-400">
              <span>改用手動固定鏡像表覆寫</span>
            </label>
          </div>

          <div v-if="autoSwitchAllPoints.length > 0" class="space-y-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-gray-400 font-bold">點選預覽若於第幾招斬殺：</span>
              <button v-for="pt in autoSwitchAllPoints" :key="pt.killIndex"
                      @click="selectedSwitchPreviewIdx = pt.killIndex"
                      :class="selectedSwitchPreview?.killIndex === pt.killIndex ? 'bg-cyan-500 text-black font-black' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'"
                      class="px-2 py-1 rounded border border-gray-700 font-mono text-[11px]">
                #{{ pt.killIndex + 1 }} ({{ pt.killTime }}s · -{{ pt.lossPct }}%)
              </button>
            </div>

            <div v-if="selectedSwitchPreview" class="bg-gray-950/90 border border-gray-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <div class="flex flex-wrap justify-between items-center gap-2 font-mono">
                <span>
                  若第 <strong class="text-amber-300">#{{ selectedSwitchPreview.killIndex + 1 }} 招</strong>「{{ selectedSwitchPreview.killerAction }}」({{ selectedSwitchPreview.killTime }}s) 斬殺轉火：
                  後續 <strong>{{ selectedSwitchPreview.remainingNodes }} 招</strong> ({{ selectedSwitchPreview.remainingDur }}s)
                  由 <span class="text-gray-400">{{ selectedSwitchPreview.origTotalDmgWan }}w</span> ➔ <strong class="text-emerald-400">{{ selectedSwitchPreview.afterSwitchDmgWan }}w</strong>
                  （折損 <strong class="text-rose-400">-{{ selectedSwitchPreview.lossDmgWan }}w / -{{ selectedSwitchPreview.lossPct }}%</strong>，殘軸 DPS {{ selectedSwitchPreview.afterSwitchDpsWan }}w/s）
                </span>
                <button @click="applyAutoSwitchSnapshotToManual" class="bg-amber-600 hover:bg-amber-500 text-black font-bold px-2.5 py-1 rounded text-[11px]">
                  📋 匯出至手動微調表
                </button>
              </div>
              <div class="text-[11px] text-cyan-300/90">
                判定原因：{{ (selectedSwitchPreview.reasons || []).join(' · ') }}
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 text-[11px]">主循環軸至少需有 2 個動作節點，即可在此自動模擬任一招斬殺後的轉火狀況。</div>
        </div>

        <div v-if="draftRot.hasSwitchRot" class="bg-amber-950/20 border border-amber-500/30 rounded-lg p-2.5 flex flex-wrap items-center gap-2 text-xs">
          <button @click="syncMirrorFromMain" class="bg-amber-600 hover:bg-amber-500 text-black font-bold px-2.5 py-1 rounded">
            🧬 從主軸 1:1 複製鏡像
          </button>
          <span>從第 <input v-model.number="mirrorTool.startIndex" type="number" min="0" class="w-12 bg-gray-950 border border-gray-700 rounded px-1 text-center"> 招起套用</span>
          <span><input v-model.number="mirrorTool.ratio" type="number" class="w-14 bg-gray-950 border border-gray-700 rounded px-1 text-center">%</span>
          <button @click="applyMirrorRatioFromNode" class="bg-gray-800 hover:bg-gray-700 text-white px-2.5 py-1 rounded">套用折損比</button>
          <span class="ml-auto font-mono text-amber-300">手動轉火 DPS: {{ draftRot.switchDps ?? 0 }}w</span>
        </div>
      </div>

      <!-- DB 招式自動匹配與新增節點列 -->
      <div class="flex flex-wrap justify-between items-center gap-2 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-gray-400">DB 固暴佔比 <span class="text-amber-300 font-bold">{{ getFixedCritDmgPct(activeDraftNodes) }}%</span></span>
          <button @click="runAutoMatchOnDraft"
                  class="bg-cyan-900/50 hover:bg-cyan-800/70 text-cyan-200 border border-cyan-500/40 px-2.5 py-1 rounded font-bold"
                  title="依據繁/簡/英/日官方招式對照表，以及他招實際傷害校準/原始參數反推倍率自動識別招式與DB固暴">
            🔍 多語/參數反推匹配 DB 招式
          </button>
        </div>
        <div class="flex gap-2">
          <button @click="addBlankNode" class="bg-gray-800 hover:bg-gray-700 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded font-bold">+ 空白節點</button>
          <button @click="recalculateRotTotals(draftRot, builderTab)" class="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded font-bold">🔄 依節點重算 DPS</button>
        </div>
      </div>

      <!-- 統一動作節點表格 -->
      <div class="overflow-x-auto max-h-72 border border-gray-800 rounded-lg bg-[#090a0f]">
        <table class="w-full text-xs text-left">
          <thead class="bg-gray-900 text-gray-400 sticky top-0">
            <tr>
              <th class="p-2 w-10">#</th>
              <th class="p-2 w-20">時間(s)</th>
              <th class="p-2 w-24">角色</th>
              <th class="p-2">招式 / 動作名稱</th>
              <th class="p-2 w-24">分類</th>
              <th class="p-2 w-28">預期傷害</th>
              <th v-if="builderTab === 'switch'" class="p-2 w-20">比例%</th>
              <th class="p-2 w-36">DB 暴擊判定</th>
              <th class="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/70">
            <tr v-for="(node, idx) in activeDraftNodes" :key="idx" class="hover:bg-gray-900/60">
              <td class="p-1.5 text-gray-500 font-mono">{{ idx + 1 }}</td>
              <td class="p-1.5"><input v-model.number="node.time" type="number" step="0.1" class="w-full bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-amber-300 font-mono"></td>
              <td class="p-1.5">
                <select v-model="node.char" @change="syncNodeDbFixedCrit(node)" class="w-full bg-gray-950 border border-gray-800 rounded px-1 py-1 text-white">
                  <option v-if="draftRot.c1" :value="draftRot.c1">{{ t(draftRot.c1) }}</option>
                  <option v-if="draftRot.c2" :value="draftRot.c2">{{ t(draftRot.c2) }}</option>
                  <option v-if="draftRot.c3" :value="draftRot.c3">{{ t(draftRot.c3) }}</option>
                  <option value="未知">未知</option>
                </select>
              </td>
              <td class="p-1.5">
                <div class="flex items-center gap-1">
                  <input v-model="node.action" @change="syncNodeDbFixedCrit(node)" type="text" class="w-full bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-white">
                  <span v-if="node.skillMeta" class="text-[10px] bg-blue-900/50 text-blue-300 px-1 rounded whitespace-nowrap" :title="node.skillMeta.name">{{ node.skillMeta.mvPct }}%</span>
                  <span v-if="node.matchMethod" class="text-[9px] bg-cyan-950/60 text-cyan-300 px-1 rounded whitespace-nowrap">{{ node.matchMethod }}</span>
                </div>
              </td>
              <td class="p-1.5">
                <select v-model="node.skill" class="w-full bg-gray-950 border border-gray-800 rounded px-1 py-1 text-cyan-300">
                  <option v-for="s in skillOpts" :key="s" :value="s">{{ s }}</option>
                </select>
              </td>
              <td class="p-1.5"><input v-model.number="node.dmg" @change="syncNodeDbFixedCrit(node); recalculateRotTotals(draftRot, builderTab)" type="number" class="w-full bg-gray-950 border border-gray-800 rounded px-1.5 py-1 text-emerald-400 font-mono font-bold"></td>
              <td v-if="builderTab === 'switch'" class="p-1.5"><input v-model.number="node.ratio" @change="onSwitchRatioChange(node)" type="number" class="w-full bg-gray-950 border border-gray-800 rounded px-1 py-1 text-amber-300 font-mono"></td>
              <td class="p-1.5">
                <span class="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap" :class="getNodeDbCritBadge(node).cls">
                  {{ getNodeDbCritBadge(node).text }}
                </span>
              </td>
              <td class="p-1.5 text-center">
                <button @click="removeDraftNode(idx)" class="text-red-400 hover:text-red-300 font-bold">✕</button>
              </td>
            </tr>
            <tr v-if="activeDraftNodes.length === 0">
              <td colspan="9" class="p-6 text-center text-gray-500">尚無節點。請從上方「實戰招式庫加入器」加入招式或貼上分享碼。</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end gap-3 pt-2 border-t border-gray-800">
        <button @click="builderOpen = false" class="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold">取消</button>
        <button @click="saveDraftRotation" class="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg">💾 儲存排軸到排軸庫</button>
      </div>
    </div>

    <!-- ================================================================ -->
    <!-- 排軸資料夾檢視與清單                                             -->
    <!-- ================================================================ -->
    <div v-if="!activeFolder" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <div v-for="group in groupedRotationsArray" :key="group.charName" @click="activeFolder = group.charName"
           class="bg-[#16171d] hover:bg-[#1e2028] border border-gray-800 hover:border-blue-500/50 p-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-3 shadow-sm">
        <img v-if="customAvatars[group.charName]" :src="customAvatars[group.charName]" class="w-10 h-10 rounded-full object-cover border border-gray-700">
        <div v-else class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-black text-blue-300">{{ t(group.charName).slice(0, 2) }}</div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-bold text-white truncate flex items-center gap-1">
            <span>{{ t(group.charName) }}</span>
            <span v-if="group.hasDIY" class="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded">DIY</span>
          </div>
          <div class="text-[11px] text-gray-400 font-mono">啟用 {{ group.enabledCount }} / {{ group.totalCount }} 軸</div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div class="flex flex-wrap justify-between items-center gap-2 bg-[#16171d] p-3 rounded-xl border border-gray-800">
        <div class="flex items-center gap-3">
          <button @click="activeFolder = null; matrixEvalResult = null" class="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">⬅ 返回角色清單</button>
          <span class="text-base font-black text-amber-300">{{ t(activeFolder) }} 排軸清單 ({{ activeFolderData.length }})</span>
        </div>
        <button @click="openNewBuilder(activeFolder)" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">➕ 為 {{ t(activeFolder) }} 新增排軸</button>
      </div>

      <!-- 資料夾內若跑了 4-Buff 測評，亦於清單上方展示 -->
      <div v-if="matrixEvalResult && !builderOpen" class="bg-gray-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-2">
        <div class="flex justify-between items-center text-xs font-black text-cyan-300">
          <span>🏆 終焉矩陣 ({{ matrixEvalResult.version }} 期) 4-Buff 測評排名 — 最高分：{{ matrixEvalResult.best?.category }} ({{ matrixEvalResult.best?.score?.toLocaleString() }} 分)</span>
          <button @click="matrixEvalResult = null" class="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div v-for="(item, idx) in matrixEvalResult.ranked" :key="item.buffId"
               :class="idx === 0 ? 'border-amber-400 bg-amber-950/25' : 'border-gray-800 bg-gray-900/60'"
               class="border rounded-lg p-2 space-y-1">
            <div class="font-bold flex justify-between">
              <span :class="idx === 0 ? 'text-amber-300' : 'text-gray-300'">#{{ idx + 1 }} {{ item.category }}</span>
              <span class="text-cyan-300 font-mono">x{{ item.matrixMult.toFixed(2) }}</span>
            </div>
            <div class="font-mono text-[11px] text-gray-300">DPS: {{ (item.expectedDps / 10000).toFixed(2) }}w | 預估分: <strong class="text-white">{{ item.score.toLocaleString() }}</strong></div>
            <button @click="applyBestBuffToEnv(item.buffId)" class="w-full py-1 rounded text-[11px] font-bold bg-gray-800 hover:bg-gray-700 text-amber-300">套用至環境</button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="rot in activeFolderData" :key="rot.id"
             :class="globalStore.disabledRots.has(rot.id) ? 'opacity-45 border-gray-800' : 'border-gray-700/80'"
             class="bg-[#16171d] border rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm">{{ rot.diff }}</span>
              <span class="text-sm font-bold text-white">{{ rot.rot }}</span>
              <span v-if="rot.isUserCustom" class="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">自訂/實戰</span>
              <span class="text-xs text-gray-400">({{ [rot.c1, rot.c2, rot.c3].filter(Boolean).map(t).join(' + ') }})</span>
            </div>
            <div class="text-xs font-mono text-gray-400 flex flex-wrap items-center gap-3">
              <span>基礎 DPS：<strong class="text-gray-300">{{ rot.dps }}w/s</strong></span>
              <span v-if="getRotEffectivePreview(rot).isModified" class="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-bold">
                ⚡ 實效 DPS：{{ getRotEffectivePreview(rot).effDps }}w/s
              </span>
              <span v-for="b in getRotEffectivePreview(rot).rcBadges" :key="rot.id+'-rc-'+b.char"
                    class="text-[10px] px-1.5 py-0.5 rounded border"
                    :class="b.rc > 0 ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 font-bold' : 'bg-gray-900 border-gray-800 text-gray-400'">
                {{ t(b.char) }} S{{ b.rc }}
              </span>
              <span v-if="getRotEffectivePreview(rot).matrixName" class="text-[10px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                🌌 {{ getRotEffectivePreview(rot).matrixName }}
              </span>
              <span>時長：{{ rot.duration }}s</span>
              <span>節點：{{ (rot.gridData || []).length }}</span>
              <span v-if="rot.hasSwitchRot" class="text-amber-400">轉火折損：{{ rot.switchDps }}w</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 shrink-0">
            <button @click="runMatrixBuffEval(rot)" class="bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg">
              ⚡ 4-Buff 實測
            </button>
            <button @click="openEditBuilder(rot); nextTick(() => document.getElementById('rotation-editor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))" class="bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg">
              ✏️ 編輯
            </button>
            <button @click="exportRotation(rot)" class="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold px-2.5 py-1.5 rounded-lg">
              🔗 分享碼
            </button>
            <button @click="toggleDisableState(rot.id, $event)"
                    :class="globalStore.disabledRots.has(rot.id) ? 'bg-gray-800 text-gray-400' : 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'"
                    class="text-xs font-bold px-2.5 py-1.5 rounded-lg">
              {{ globalStore.disabledRots.has(rot.id) ? '已停用' : '啟用中' }}
            </button>
            <button v-if="rot.isUserCustom" @click="deleteRotation(rot.id)" class="bg-red-900/40 hover:bg-red-800 text-red-300 text-xs font-bold px-2.5 py-1.5 rounded-lg">
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
