<!-- src/components/EnvConfig.vue -->
<script setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted, inject } from 'vue';
import { getMatrixBuffsByVersion } from '../data/combatDb.js';

const emit = defineEmits(['update-env']);
const t = inject('t') || ((str) => str);

const MATRIX_BOSS_PRESETS = {
  '3.8': {
    names: ['飛廉之猩', '達妮婭', '無冠者', '辛吉勒姆', '矩陣奇藏'],
    resTags: ['氣動', '熱熔', '湮滅', '衍射', ''],
    resPenalties: [25, 25, 25, 25, 0],
    mechanics: [
      '破枷之怒 -20% (諧度破壞疊4層滿+50%)',
      '異常+25% / 霜結+30%',
      '戰爭藝術 (響應同奏+40%)',
      '壁壘協議 -25% (同名聲骸疊5層迷航+80%)',
      '全抗 20% · 1.1x積分 +1000'
    ]
  },
  '3.7': {
    names: ['燎照之騎', '封庭械囿', '無冠者', '天傀劫煞', '矩陣奇藏'],
    resTags: ['熱熔', '冷凝', '湮滅', '氣動', ''],
    resPenalties: [25, 25, 25, 25, 0],
    mechanics: [
      '週期熱熔灼燒 (無減傷詞條)',
      '閃反回能削韌 (無減傷詞條)',
      '戰爭藝術 (響應同奏+40%)',
      '失序狂亂 (電磁效應失效 · 無減傷)',
      '全抗 20% · 1.1x積分 +1000'
    ]
  }
};

const DEFAULT_CONFIG = {
  scoreRatio: 10.43,
  roundRatios: [8.34, 9.60, 10.43], // R1, R2, R3+ 每萬點傷害基準得分
  battleTime: 120,
  entryTime: 1.0,
  transTime: 1.5,
  hpGrowth: 5,
  hpGrowthMode: 'linear', // 'linear' | 'compound'
  r1_hp: 561.25,
  r2_hp: 954.15,
  r3_hp: 1938.90,
  bossMultipliers: [1.0, 1.0, 1.0, 1.0, 1.1],
  bossKillBonus: 1000,
  resTags: [...MATRIX_BOSS_PRESETS['3.8'].resTags],
  resPenalties: [...MATRIX_BOSS_PRESETS['3.8'].resPenalties],
  pen110: 1.0,
  pen120: 1.0,
  customHpMap: {
    'R1-5': 617.38,
    'R2-5': 1275.61
  },
  matrixVersion: '3.8',
  matrixBuffId: 'auto',
  applyLoadoutScaling: true,
  enemyLv: 100,
  enemyResPct: 10
};

const localEnv = reactive({
  scoreRatio: DEFAULT_CONFIG.scoreRatio,
  roundRatios: [...DEFAULT_CONFIG.roundRatios],
  battleTime: DEFAULT_CONFIG.battleTime,
  entryTime: DEFAULT_CONFIG.entryTime,
  transTime: DEFAULT_CONFIG.transTime,
  hpGrowth: DEFAULT_CONFIG.hpGrowth,
  hpGrowthMode: DEFAULT_CONFIG.hpGrowthMode,
  r1_hp: DEFAULT_CONFIG.r1_hp,
  r2_hp: DEFAULT_CONFIG.r2_hp,
  r3_hp: DEFAULT_CONFIG.r3_hp,
  bossMultipliers: [...DEFAULT_CONFIG.bossMultipliers],
  bossKillBonus: DEFAULT_CONFIG.bossKillBonus,
  resTags: [...DEFAULT_CONFIG.resTags],
  resPenalties: [...DEFAULT_CONFIG.resPenalties],
  pen110: DEFAULT_CONFIG.pen110,
  pen120: DEFAULT_CONFIG.pen120,
  customHpMap: { ...DEFAULT_CONFIG.customHpMap },
  matrixVersion: DEFAULT_CONFIG.matrixVersion,
  matrixBuffId: DEFAULT_CONFIG.matrixBuffId,
  applyLoadoutScaling: DEFAULT_CONFIG.applyLoadoutScaling,
  enemyLv: DEFAULT_CONFIG.enemyLv,
  enemyResPct: DEFAULT_CONFIG.enemyResPct
});

const attrOptions = ['衍射', '氣動', '冷凝', '導電', '熱熔', '湮滅'];
const activeVersionBuffs = computed(() => getMatrixBuffsByVersion(localEnv.matrixVersion || '3.8'));

const selectedBuffDesc = computed(() => {
  if (localEnv.matrixBuffId === 'auto') {
    return '系統會自動讀取各隊伍成員的實戰招式庫、共鳴鏈與異常/諧度/護盾/同奏機制，於當期 4 個矩陣 Buff 中自動套用最高分增益。';
  }
  if (localEnv.matrixBuffId === 'none') {
    return '不計算終焉矩陣環境 Buff，僅以角色自身面板、武器、聲骸與排軸倍率計算基準傷害。';
  }
  const found = activeVersionBuffs.value.find(b => b.id === localEnv.matrixBuffId);
  return found ? `${found.name}：${found.desc}` : '';
});

// 特定關卡血量微調 (R1-1 ~ R8-5)
const showCustomHpBar = ref(false);
const manualOverrideBoss = ref('R1-5');
const manualOverrideHp = ref('');

const bossOptions = computed(() => {
  const opts = [];
  for (let r = 1; r <= 8; r++) {
    for (let i = 1; i <= 5; i++) {
      opts.push({ value: `R${r}-${i}`, label: `R${r}-${i}${i === 5 ? ' (奇藏)' : ''}` });
    }
  }
  return opts;
});

const addManualOverride = () => {
  const val = parseFloat(manualOverrideHp.value);
  if (!isNaN(val) && val > 0) {
    localEnv.customHpMap[manualOverrideBoss.value] = val;
    manualOverrideHp.value = '';
  }
};

// 查血量：依當前環境設定即時計算 R1-1 ~ R8-5 首領血量（萬）
const activeBossNames = computed(() => {
  const ver = localEnv.matrixVersion === '3.7' ? '3.7' : '3.8';
  return MATRIX_BOSS_PRESETS[ver].names;
});

const activeBossMechanics = computed(() => {
  const ver = localEnv.matrixVersion === '3.7' ? '3.7' : '3.8';
  return MATRIX_BOSS_PRESETS[ver].mechanics;
});

const lookupBossKey = ref('R1-1');
const calcEnvBossHp = (key) => {
  if (localEnv.customHpMap && localEnv.customHpMap[key] > 0) {
    return { hp: Number(localEnv.customHpMap[key]), isOverride: true };
  }
  const m = String(key).match(/^R(\d+)-(\d+)$/);
  if (!m) return { hp: 0, isOverride: false };
  const r = Number(m[1]);
  const idx = Number(m[2]);
  const is37 = localEnv.matrixVersion === '3.7';
  const r1Default = (is37 && idx === 2) ? 561.2723 : 561.2519;
  const r2Default = (is37 && idx === 2) ? 954.1661 : 954.1514;
  const r3Default = (is37 && idx === 2) ? 1938.8572 : 1938.8951;
  const r1 = (Number(localEnv.r1_hp) && Math.abs(Number(localEnv.r1_hp) - 561.25) > 0.01) ? Number(localEnv.r1_hp) : r1Default;
  const r2 = (Number(localEnv.r2_hp) && Math.abs(Number(localEnv.r2_hp) - 954.15) > 0.01) ? Number(localEnv.r2_hp) : r2Default;
  const r3 = (Number(localEnv.r3_hp) && Math.abs(Number(localEnv.r3_hp) - 1938.90) > 0.01) ? Number(localEnv.r3_hp) : r3Default;
  const g = (Number(localEnv.hpGrowth) || 5) / 100;
  let base = r === 1 ? r1 : (r === 2 ? r2 : r3);
  if (r >= 4) {
    const stepsAfterR3 = (r - 4) * 5 + idx;
    base = localEnv.hpGrowthMode === 'compound' ? r3 * Math.pow(1 + g, stepsAfterR3) : r3 * (1 + stepsAfterR3 * g);
  }
  if (idx === 5 && r === 1 && !localEnv.customHpMap?.['R1-5']) base = 617.3771;
  if (idx === 5 && r === 2 && !localEnv.customHpMap?.['R2-5']) base = 1275.6094;
  return { hp: Number(base.toFixed(2)), isOverride: false };
};
const lookedUpBossInfo = computed(() => calcEnvBossHp(lookupBossKey.value));

// 矩陣增益開關（預設自動套用 Buff）
const matrixBuffEnabled = computed({
  get: () => localEnv.matrixBuffId !== 'none',
  set: (val) => {
    localEnv.matrixBuffId = val ? 'auto' : 'none';
  }
});

const removeOverride = (key) => {
  delete localEnv.customHpMap[key];
};

const resetToDefaultConfig = () => {
  Object.assign(localEnv, {
    scoreRatio: DEFAULT_CONFIG.scoreRatio,
    roundRatios: [...DEFAULT_CONFIG.roundRatios],
    battleTime: DEFAULT_CONFIG.battleTime,
    entryTime: DEFAULT_CONFIG.entryTime,
    transTime: DEFAULT_CONFIG.transTime,
    hpGrowth: DEFAULT_CONFIG.hpGrowth,
    hpGrowthMode: DEFAULT_CONFIG.hpGrowthMode,
    r1_hp: DEFAULT_CONFIG.r1_hp,
    r2_hp: DEFAULT_CONFIG.r2_hp,
    r3_hp: DEFAULT_CONFIG.r3_hp,
    bossMultipliers: [...DEFAULT_CONFIG.bossMultipliers],
    bossKillBonus: DEFAULT_CONFIG.bossKillBonus,
    resTags: [...DEFAULT_CONFIG.resTags],
    resPenalties: [...DEFAULT_CONFIG.resPenalties],
    pen110: DEFAULT_CONFIG.pen110,
    pen120: DEFAULT_CONFIG.pen120,
    customHpMap: { ...DEFAULT_CONFIG.customHpMap },
    matrixVersion: DEFAULT_CONFIG.matrixVersion,
    matrixBuffId: DEFAULT_CONFIG.matrixBuffId,
    applyLoadoutScaling: DEFAULT_CONFIG.applyLoadoutScaling,
    enemyLv: DEFAULT_CONFIG.enemyLv,
    enemyResPct: DEFAULT_CONFIG.enemyResPct
  });
  localStorage.setItem('ww_env_global', JSON.stringify(localEnv));
};

const handleExternalEnvSync = () => {
  try {
    const savedEnv = localStorage.getItem('ww_env_global');
    if (savedEnv) {
      const parsed = JSON.parse(savedEnv);
      localEnv.customHpMap = { ...(parsed.customHpMap || {}) };
      if (parsed.matrixVersion) localEnv.matrixVersion = parsed.matrixVersion;
      if (parsed.matrixBuffId) localEnv.matrixBuffId = parsed.matrixBuffId;
      if (parsed.applyLoadoutScaling !== undefined) localEnv.applyLoadoutScaling = parsed.applyLoadoutScaling;
    }
  } catch (e) {}
};

onMounted(() => {
  window.addEventListener('ww-env-updated', handleExternalEnvSync);
  const savedEnv = localStorage.getItem('ww_env_global');
  if (savedEnv) {
    try {
      const parsed = JSON.parse(savedEnv);
      Object.assign(localEnv, parsed);
      if (!localEnv.resTags || localEnv.resTags.length !== 5) localEnv.resTags = [...DEFAULT_CONFIG.resTags];
      if (!localEnv.resPenalties || localEnv.resPenalties.length !== 5) localEnv.resPenalties = [...DEFAULT_CONFIG.resPenalties];
      if (!localEnv.bossMultipliers || localEnv.bossMultipliers.length !== 5) localEnv.bossMultipliers = [...DEFAULT_CONFIG.bossMultipliers];
      if (!Array.isArray(localEnv.roundRatios) || localEnv.roundRatios.length < 3) {
        localEnv.roundRatios = [...DEFAULT_CONFIG.roundRatios];
        localEnv.scoreRatio = DEFAULT_CONFIG.scoreRatio;
      }
      if (localEnv.bossKillBonus === undefined) localEnv.bossKillBonus = DEFAULT_CONFIG.bossKillBonus;
      if (!localEnv.hpGrowthMode) localEnv.hpGrowthMode = DEFAULT_CONFIG.hpGrowthMode;
      if (!localEnv.customHpMap) localEnv.customHpMap = { ...DEFAULT_CONFIG.customHpMap };
      if (!localEnv.matrixVersion) localEnv.matrixVersion = DEFAULT_CONFIG.matrixVersion;
      if (!localEnv.matrixBuffId) localEnv.matrixBuffId = DEFAULT_CONFIG.matrixBuffId;
      if (localEnv.applyLoadoutScaling === undefined) localEnv.applyLoadoutScaling = true;
    } catch (e) {}
  }
  localStorage.setItem('ww_env_global', JSON.stringify(localEnv));
  emit('update-env', localEnv);
});

watch(() => localEnv.matrixVersion, (ver) => {
  const v = ver === '3.7' ? '3.7' : '3.8';
  const validIds = getMatrixBuffsByVersion(v).map(b => b.id);
  if (localEnv.matrixBuffId !== 'auto' && localEnv.matrixBuffId !== 'none' && !validIds.includes(localEnv.matrixBuffId)) {
    localEnv.matrixBuffId = 'auto';
  }
  const preset = MATRIX_BOSS_PRESETS[v];
  if (preset) {
    localEnv.resTags = [...preset.resTags];
    localEnv.resPenalties = [...preset.resPenalties];
  }
});

onUnmounted(() => {
  window.removeEventListener('ww-env-updated', handleExternalEnvSync);
});

let saveTimeout = null;
watch(localEnv, (newVal) => {
  if (Array.isArray(newVal.roundRatios) && newVal.roundRatios[2] !== undefined) {
    newVal.scoreRatio = newVal.roundRatios[2];
  }
  emit('update-env', newVal);
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem('ww_env_global', JSON.stringify(newVal));
  }, 300);
}, { deep: true });
</script>

<template>
  <div class="bg-panel p-5 rounded-xl border border-glass shadow-lg space-y-4">

    <!-- 頂部：標題、期數切換、裝備連動與一鍵重置 -->
    <div class="flex flex-wrap justify-between items-center gap-3 border-b border-glass pb-3">
      <div class="flex items-center gap-2.5">
        <h2 class="text-lg font-bold text-blue-400 m-0 border-none p-0 flex items-center gap-2">
          <span>🌌</span> {{ t('終焉矩陣環境與參數設定') }}
        </h2>
        <select v-model="localEnv.matrixVersion"
                class="bg-gray-950 text-cyan-300 text-xs font-bold border border-cyan-500/40 rounded-lg px-2.5 py-1 outline-none">
          <option value="3.8">3.8 期 (S2-4)</option>
          <option value="3.7">3.7 期 (S2-3)</option>
        </select>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-1.5 text-xs font-bold text-emerald-300 cursor-pointer bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
          <input type="checkbox" v-model="localEnv.applyLoadoutScaling" class="accent-emerald-400">
          <span>套用角色裝備/共鳴鏈槽位</span>
        </label>
        <button @click="resetToDefaultConfig"
                class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs font-bold px-3 py-1 rounded-lg transition-colors">
          🔄 {{ t('重置預設') }}
        </button>
      </div>
    </div>

    <!-- 第一區：終焉矩陣 4-Buff 開關與單排直選（預設自動套用最優 Buff） -->
    <div class="bg-gray-900/70 border border-cyan-500/30 rounded-xl p-3.5 space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <button type="button" @click="matrixBuffEnabled = !matrixBuffEnabled"
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black transition-all"
                  :class="matrixBuffEnabled ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-gray-950 border-gray-700 text-gray-400'">
            <span class="inline-block w-7 h-4 rounded-full relative transition-colors"
                  :class="matrixBuffEnabled ? 'bg-amber-500' : 'bg-gray-700'">
              <span class="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                    :class="matrixBuffEnabled ? 'left-3.5' : 'left-0.5'"></span>
            </span>
            <span>{{ matrixBuffEnabled ? '🏆 矩陣增益：開啟（預設自動套用）' : '⬜ 矩陣增益：關閉（純面板基準傷害）' }}</span>
          </button>
        </div>
        <span class="text-[11px] text-gray-400" v-if="matrixBuffEnabled">可點選下方指定 Buff 或維持「自動最優」</span>
      </div>

      <div v-if="matrixBuffEnabled" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <button type="button" @click="localEnv.matrixBuffId = 'auto'"
                class="px-3 py-2 rounded-lg border text-left transition-all"
                :class="localEnv.matrixBuffId === 'auto' ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-black' : 'bg-gray-950/70 border-gray-800 text-gray-400 hover:border-gray-600'">
          <div class="text-xs font-black">🏆 自動最優 Buff</div>
          <div class="text-[10px] opacity-80 truncate">依隊伍招式自動配適</div>
        </button>

        <button v-for="b in activeVersionBuffs" :key="b.id" type="button" @click="localEnv.matrixBuffId = b.id"
                class="px-3 py-2 rounded-lg border text-left transition-all"
                :class="localEnv.matrixBuffId === b.id ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 font-black' : 'bg-gray-950/70 border-gray-800 text-gray-300 hover:border-gray-600'">
          <div class="text-xs font-black truncate">{{ b.category }} · {{ b.name }}</div>
          <div class="text-[10px] text-gray-400 truncate">{{ (b.tags || []).join(' / ') }}</div>
        </button>
      </div>

      <div class="text-[11px] text-gray-300 bg-black/40 border border-gray-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2">
        <span>💡 {{ selectedBuffDesc }}</span>
      </div>
    </div>

    <!-- 第二區：戰鬥時序、各輪血量與計分倍率（單表整合，免開彈窗） -->
    <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-3.5 space-y-3">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">⏱️ 戰鬥時長(s)</label>
          <input v-model.number="localEnv.battleTime" type="number" class="w-full bg-gray-950 text-white font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">⏳ 進場耗時(s)</label>
          <input v-model.number="localEnv.entryTime" type="number" step="0.1" class="w-full bg-gray-950 text-emerald-400 font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">🔄 轉場耗時(s)</label>
          <input v-model.number="localEnv.transTime" type="number" step="0.1" class="w-full bg-gray-950 text-amber-400 font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">❤️ R1 血量(萬)</label>
          <input v-model.number="localEnv.r1_hp" type="number" step="10" class="w-full bg-gray-950 text-white font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">❤️ R2 血量(萬)</label>
          <input v-model.number="localEnv.r2_hp" type="number" step="10" class="w-full bg-gray-950 text-white font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">❤️ R3 血量(萬)</label>
          <input v-model.number="localEnv.r3_hp" type="number" step="10" class="w-full bg-gray-950 text-white font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1 flex justify-between">
            <span>📈 R4+ 成長%</span>
            <button type="button" @click="localEnv.hpGrowthMode = localEnv.hpGrowthMode === 'compound' ? 'linear' : 'compound'"
                    class="text-[9px] text-pink-300 underline">
              {{ localEnv.hpGrowthMode === 'compound' ? '複利' : '單利' }}
            </button>
          </label>
          <input v-model.number="localEnv.hpGrowth" type="number" class="w-full bg-gray-950 text-pink-400 font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
        <div>
          <label class="block text-[10px] text-gray-400 mb-1">🏆 奇藏斬殺加分</label>
          <input v-model.number="localEnv.bossKillBonus" type="number" step="100" class="w-full bg-gray-950 text-amber-300 font-mono font-bold border border-gray-700 rounded px-2 py-1.5">
        </div>
      </div>

      <!-- 輪次積分倍率與特例血量微調列 -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/80 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-[11px] text-gray-400 font-bold">📊 每萬傷得分倍率 (R1 / R2 / R3+)：</span>
          <input v-model.number="localEnv.roundRatios[0]" type="number" step="0.01" class="w-16 bg-gray-950 text-emerald-300 font-mono font-bold border border-gray-700 rounded px-2 py-1 text-center" title="R1 每萬傷得分">
          <span class="text-gray-600">/</span>
          <input v-model.number="localEnv.roundRatios[1]" type="number" step="0.01" class="w-16 bg-gray-950 text-emerald-300 font-mono font-bold border border-gray-700 rounded px-2 py-1 text-center" title="R2 每萬傷得分">
          <span class="text-gray-600">/</span>
          <input v-model.number="localEnv.roundRatios[2]" type="number" step="0.01" class="w-16 bg-gray-950 text-emerald-300 font-mono font-bold border border-gray-700 rounded px-2 py-1 text-center" title="R3+ 每萬傷得分">
          <span class="text-gray-700 mx-1">|</span>
          <span class="text-[11px] text-amber-300 font-bold">🎯 奇藏基準：</span>
          <span class="text-[11px] text-gray-400">Lv</span>
          <input v-model.number="localEnv.enemyLv" type="number" step="10" class="w-14 bg-gray-950 text-amber-300 font-mono font-bold border border-gray-700 rounded px-1.5 py-1 text-center" title="奇藏基準敵人等級 (預設 Lv.100)">
          <span class="text-[11px] text-gray-400">抗性%</span>
          <input v-model.number="localEnv.enemyResPct" type="number" step="5" class="w-14 bg-gray-950 text-amber-300 font-mono font-bold border border-gray-700 rounded px-1.5 py-1 text-center" title="奇藏基礎抗性% (無特殊抗性預設 10%)">
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span v-for="(hpVal, bKey) in localEnv.customHpMap" :key="bKey"
                class="bg-purple-950/50 border border-purple-500/40 text-purple-200 text-[11px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
            <span>{{ bKey }}:{{ hpVal }}w</span>
            <button @click="removeOverride(bKey)" class="hover:text-rose-400 text-gray-400">✕</button>
          </span>
          <button type="button" @click="showCustomHpBar = !showCustomHpBar"
                  class="text-[11px] bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold">
            {{ showCustomHpBar ? '收合查血量與特例' : '🔍 查血量 / 特例覆寫' }}
          </button>
        </div>
      </div>

      <div v-if="showCustomHpBar" class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/60 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-cyan-300 font-bold">🔍 查血量：</span>
          <select v-model="lookupBossKey" class="bg-gray-950 text-cyan-200 border border-cyan-500/40 rounded px-2 py-1 font-bold">
            <option v-for="opt in bossOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <span class="bg-cyan-950/50 border border-cyan-500/40 text-cyan-200 px-2.5 py-1 rounded font-mono font-bold">
            {{ lookedUpBossInfo.hp }} 萬
            <span v-if="lookedUpBossInfo.isOverride" class="text-[10px] text-purple-300 ml-1">(特例覆寫)</span>
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model="manualOverrideBoss" class="bg-gray-950 text-white border border-gray-700 rounded px-2 py-1 font-bold">
            <option v-for="opt in bossOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input v-model="manualOverrideHp" type="number" placeholder="輸入萬血量..." class="w-32 bg-gray-950 text-white font-mono border border-gray-700 rounded px-2.5 py-1">
          <button @click="addManualOverride" :disabled="!manualOverrideHp" class="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white px-3 py-1 rounded font-bold">
            儲存覆寫
          </button>
        </div>
      </div>
    </div>

    <!-- 第三區：BOSS 1 ~ 5 抗性、減傷與分數加權（五王同列） -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
      <div v-for="i in 5" :key="i" class="bg-[#121216] p-3 rounded-xl border border-gray-800 flex flex-col gap-2">
        <div class="flex items-center justify-between border-b border-gray-800 pb-1.5">
          <span class="text-xs font-black text-white">BOSS {{ i }} · {{ activeBossNames[i-1] }} <span v-if="i === 5" class="text-[10px] text-amber-400">(奇藏)</span></span>
          <div class="flex items-center gap-1 text-[10px]">
            <span class="text-gray-500">加權</span>
            <input v-model.number="localEnv.bossMultipliers[i-1]" type="number" step="0.05"
                   class="w-12 bg-gray-950 border border-gray-700 rounded px-1 py-0.5 text-center text-amber-300 font-mono font-bold">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="block text-[10px] text-gray-500 mb-0.5">抗性屬性</label>
            <select v-model="localEnv.resTags[i-1]" class="w-full bg-gray-900 text-gray-200 border border-gray-700 rounded px-1.5 py-1 text-xs font-bold">
              <option value="">無</option>
              <option v-for="attr in attrOptions" :key="attr" :value="attr">{{ t(attr) }}</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] text-pink-400/80 mb-0.5" title="僅於隊伍主屬性撞到該 Boss 40% 高抗屬性時扣減 (40%抗 vs 20%抗 = 25%)">撞高抗折損%</label>
            <input v-model.number="localEnv.resPenalties[i-1]" type="number"
                   class="w-full bg-gray-900 text-pink-400 font-mono font-bold border border-gray-700 rounded px-1.5 py-1 text-xs">
          </div>
        </div>
        <div class="text-[10px] text-cyan-300/90 bg-cyan-950/30 border border-cyan-800/40 rounded px-2 py-1 leading-snug">
          🛡️ {{ activeBossMechanics[i-1] }}
        </div>
      </div>
    </div>

  </div>
</template>
