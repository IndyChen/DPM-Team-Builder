<!-- src/components/CharInventory.vue -->
<script setup>
import { ref, computed, reactive, inject, onMounted, watch } from 'vue';
import { globalStore, getCharLoadoutState, saveCharSlot, switchCharSlot, setCharResonanceChain } from '../core/store.js';
import { charData, characterOrder } from '../data/characters.js';
import { avatarStorage } from '../core/avatarStorage.js';
import {
  WEAPONS_DB, ECHO_SETS_DB, MAIN_ECHOES_DB, ROLE_RC_DB,
  computeCharEffectiveStats, getDefaultSlotConfig, formatWeaponDesc,
  getWeaponRarityMeta, normalizeEchoSets, normalizeEchoCosts, validateEchoLoadout,
  getEchoesForSets, getCharRelevantEchoStats
} from '../data/combatDb.js';

const t = inject('t') || ((str) => str);
const searchQuery = ref('');

const activeStars = reactive(new Set());
const activeGens = reactive(new Set());

const localTags = ref(JSON.parse(localStorage.getItem('ww_char_custom_tags') || '{}'));
const customAvatars = ref({});
const fileInput = ref(null);
const uploadingChar = ref(null);

const DEFAULT_ROVER_CONFIG = {
    '光主': { name: '光主', attr: '衍射', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-900/30', enabled: true },
    '暗主': { name: '暗主', attr: '湮滅', color: 'text-purple-400 border-purple-500/50 bg-purple-900/30', enabled: true },
    '風主': { name: '風主', attr: '氣動', color: 'text-teal-400 border-teal-500/50 bg-teal-900/30', enabled: true },
    '雷主': { name: '雷主', attr: '導電', color: 'text-violet-400 border-violet-500/50 bg-violet-900/30', enabled: true },
    '火主': { name: '火主', attr: '熱熔', color: 'text-rose-400 border-rose-500/50 bg-rose-900/30', enabled: false },
    '冰主': { name: '冰主', attr: '冷凝', color: 'text-cyan-400 border-cyan-500/50 bg-cyan-900/30', enabled: false }
};

const roverConfig = reactive(
    JSON.parse(localStorage.getItem('ww_rover_config') || 'null') || DEFAULT_ROVER_CONFIG
);

watch(roverConfig, (newVal) => {
    localStorage.setItem('ww_rover_config', JSON.stringify(newVal));
}, { deep: true });

const showRoverModal = ref(false);
const openRoverModal = (event) => {
    event.stopPropagation();
    showRoverModal.value = true;
};

const ROVER_VARIANTS = ['光主', '暗主', '風主', '雷主', '火主', '冰主'];

const getCharMeta = (name) => {
  const baseName = ROVER_VARIANTS.includes(name) ? '漂泊者' : name;
  const baseMeta = charData[baseName] || { rarity: 5, gen: 2, element: '衍射', max: 1 }; 
  if (localTags.value[name] !== undefined) return { ...baseMeta, gen: localTags.value[name] };
  return baseMeta;
};

const availableGens = computed(() => {
  const gens = new Set([1, 2, 3]);
  characterOrder.forEach(c => {
    const meta = getCharMeta(c);
    if (meta.gen !== undefined && meta.gen !== null && meta.gen !== '') gens.add(meta.gen);
  });
  return Array.from(gens).sort((a, b) => {
    const numA = parseFloat(a); const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
  });
});

const filteredCharacters = computed(() => {
  return characterOrder.filter(c => {
    const meta = getCharMeta(c);
    const matchSearch = !searchQuery.value || c.includes(searchQuery.value);
    const matchStar = activeStars.size === 0 || activeStars.has(meta.rarity);
    const matchGen = activeGens.size === 0 || activeGens.has(meta.gen);
    return matchSearch && matchStar && matchGen;
  });
});

const toggleFilter = (set, val) => { if (set.has(val)) set.delete(val); else set.add(val); };
const toggleChar = (charName) => { if (globalStore.ownedCharacters.has(charName)) globalStore.ownedCharacters.delete(charName); else globalStore.ownedCharacters.add(charName); };

const isAllSelected = computed(() => globalStore.ownedCharacters.size === characterOrder.length);
const toggleAll = () => { if (isAllSelected.value) globalStore.ownedCharacters.clear(); else characterOrder.forEach(c => globalStore.ownedCharacters.add(c)); };

// ============================
// 🌟 角色實戰裝備與雙專屬槽位 Modal (Slot 1 & Slot 2)
// ============================
const showLoadoutModal = ref(false);
const loadoutChar = ref('');
const loadoutTab = ref(0); // 0 = 槽位1, 1 = 槽位2
const showAllWeaponTypes = ref(false);
const showAllMainEchoes = ref(false);
const cloneSlotData = (slotObj) => {
  const base = { ...(slotObj || getDefaultSlotConfig(loadoutChar.value || '清宵', loadoutTab.value)) };
  base.echoSets = normalizeEchoSets(base);
  base.echoCosts = normalizeEchoCosts(base);
  base.rc = Math.max(0, Math.min(6, Math.round(Number(base.rc) || 0)));
  const activeSetIds = base.echoSets.filter(s => Number(s.setId) > 0 && Number(s.pieces) > 0).map(s => Number(s.setId));
  if (activeSetIds.length > 0) {
    const setEchoes = getEchoesForSets(activeSetIds);
    if (setEchoes.length > 0 && !setEchoes.some(e => Number(e.id) === Number(base.mainEchoId))) {
      base.mainEchoId = setEchoes[0].id;
      if (Array.isArray(base.echoCosts) && base.echoCosts.length > 0 && setEchoes[0].cost) {
        base.echoCosts[0] = Number(setEchoes[0].cost);
      }
    }
  }
  return base;
};
const draftSlot = ref(cloneSlotData(getDefaultSlotConfig('清宵', 0)));
const focusedRcNode = ref(1);

const openLoadoutModal = (charName, event) => {
  if (event) event.stopPropagation();
  loadoutChar.value = charName;
  const st = getCharLoadoutState(charName);
  loadoutTab.value = st.activeSlot === 1 ? 1 : 0;
  draftSlot.value = cloneSlotData(st.slots[loadoutTab.value]);
  focusedRcNode.value = Math.max(1, draftSlot.value.rc || 1);
  showAllWeaponTypes.value = false;
  showAllMainEchoes.value = false;
  showLoadoutModal.value = true;
};

const selectLoadoutTab = (idx) => {
  loadoutTab.value = idx;
  const st = getCharLoadoutState(loadoutChar.value);
  draftSlot.value = cloneSlotData(st.slots[idx]);
  focusedRcNode.value = Math.max(1, draftSlot.value.rc || 1);
};

const currentCharMeta = computed(() => {
  const c = loadoutChar.value;
  const lookup = ROVER_VARIANTS.includes(c) ? '漂泊者' : c;
  const base = charData[lookup] || charData[c] || { weaponType: '迅刀', element: '氣動', baseHp: 10500, baseAtk: 412, baseDef: 1150, skillTreePassives: {} };
  if (ROVER_VARIANTS.includes(c) && DEFAULT_ROVER_CONFIG[c]) {
    return { ...base, element: DEFAULT_ROVER_CONFIG[c].attr };
  }
  return base;
});

const availableWeaponsForChar = computed(() => {
  const wt = currentCharMeta.value.weaponType;
  const list = (showAllWeaponTypes.value || !wt) ? [...WEAPONS_DB] : WEAPONS_DB.filter(w => w.weaponType === wt);
  return list.sort((a, b) => (b.rarity - a.rarity) || (b.baseAtk - a.baseAtk) || a.id - b.id);
});

const weaponGroupsByRarity = computed(() => {
  const groups = [5, 4, 3, 2, 1].map(star => ({
    star,
    meta: getWeaponRarityMeta(star),
    items: availableWeaponsForChar.value.filter(w => Number(w.rarity) === star)
  })).filter(g => g.items.length > 0);
  return groups;
});

const selectedWeaponObj = computed(() => WEAPONS_DB.find(w => Number(w.id) === Number(draftSlot.value.weaponId)));
const selectedWeaponRarityMeta = computed(() => getWeaponRarityMeta(selectedWeaponObj.value?.rarity || 5));

const activeDraftSetIds = computed(() => {
  const fromSlots = (draftSlot.value.echoSets || [])
    .filter(s => Number(s.setId) > 0 && Number(s.pieces) > 0)
    .map(s => Number(s.setId));
  if (fromSlots.length > 0) return fromSlots;
  const fallback = Number(draftSlot.value.echoSets?.[0]?.setId || draftSlot.value.echoSetId || 0);
  return fallback > 0 ? [fallback] : [];
});

const availableMainEchoesForDraft = computed(() => {
  if (showAllMainEchoes.value || activeDraftSetIds.value.length === 0) {
    return MAIN_ECHOES_DB;
  }
  return getEchoesForSets(activeDraftSetIds.value);
});

const mainEchoGroupsByCost = computed(() => {
  const labels = {
    4: '👑 4C 怒濤 / 海嘯級 (首位主力)',
    3: '⚔️ 3C 巨浪級',
    1: '🔹 1C 輕波級'
  };
  return [4, 3, 1].map(cost => ({
    cost,
    label: labels[cost],
    items: availableMainEchoesForDraft.value.filter(e => Number(e.cost || 4) === cost)
  })).filter(g => g.items.length > 0);
});

const fourCostMainEchoesForDraft = computed(() =>
  availableMainEchoesForDraft.value.filter(e => Number(e.cost || 4) === 4)
);

const selectedMainEchoObj = computed(() => MAIN_ECHOES_DB.find(e => Number(e.id) === Number(draftSlot.value.mainEchoId)));

const relevantEchoStats = computed(() => getCharRelevantEchoStats(loadoutChar.value || '今汐', draftSlot.value) || {
  critRate: true, critDmg: true, elemDmgPct: true, atkPct: true, atkFlat: true
});

const onMainEchoChange = () => {
  if (selectedMainEchoObj.value?.cost && Array.isArray(draftSlot.value.echoCosts) && draftSlot.value.echoCosts.length > 0) {
    draftSlot.value.echoCosts[0] = Number(selectedMainEchoObj.value.cost);
  }
};

const selectQuickMainEcho = (echoObj) => {
  if (!echoObj) return;
  draftSlot.value.mainEchoId = Number(echoObj.id);
  onMainEchoChange();
};

const rcNodesForChar = computed(() => {
  const c = loadoutChar.value;
  return ROLE_RC_DB[c] || (ROVER_VARIANTS.includes(c) ? ROLE_RC_DB['漂泊者'] : null) || [];
});

const getEchoSetById = (id) => ECHO_SETS_DB.find(e => Number(e.id) === Number(id));
const echoValidation = computed(() => validateEchoLoadout(draftSlot.value));

const applyEchoCostPreset = (costsArr) => {
  draftSlot.value.echoCosts = [...costsArr];
};

const syncPrimaryEchoSetId = () => {
  const firstActive = (draftSlot.value.echoSets || []).find(s => Number(s.setId) > 0 && Number(s.pieces) > 0) || draftSlot.value.echoSets?.[0];
  draftSlot.value.echoSetId = Number(firstActive?.setId || 0);
  if (!showAllMainEchoes.value && activeDraftSetIds.value.length > 0) {
    const inSetList = getEchoesForSets(activeDraftSetIds.value);
    if (inSetList.length > 0 && !inSetList.some(e => Number(e.id) === Number(draftSlot.value.mainEchoId))) {
      draftSlot.value.mainEchoId = inSetList[0].id;
      onMainEchoChange();
    }
  }
};

const draftEffectiveStats = computed(() => {
  if (!loadoutChar.value) return null;
  return computeCharEffectiveStats(loadoutChar.value, draftSlot.value, {
    triggerPassives: draftSlot.value.triggerPassives !== false
  });
});

const copyOtherSlotToDraft = () => {
  const otherIdx = loadoutTab.value === 0 ? 1 : 0;
  const st = getCharLoadoutState(loadoutChar.value);
  const labelKeep = draftSlot.value.label;
  draftSlot.value = cloneSlotData({ ...st.slots[otherIdx], label: labelKeep });
};

const resetDraftToDefault = () => {
  draftSlot.value = cloneSlotData(getDefaultSlotConfig(loadoutChar.value, loadoutTab.value));
};

const saveLoadoutAndActivate = (activate = true) => {
  if (!loadoutChar.value || !echoValidation.value.isValid) return;
  syncPrimaryEchoSetId();
  saveCharSlot(loadoutChar.value, loadoutTab.value, cloneSlotData(draftSlot.value), activate);
  if (activate) showLoadoutModal.value = false;
};

const quickSwitchSlot = (charName, slotIdx, event) => {
  if (event) event.stopPropagation();
  switchCharSlot(charName, slotIdx);
};

const getCardActiveSlotIdx = (charName) => {
  return globalStore.charLoadouts[charName]?.activeSlot === 1 ? 2 : 1;
};

const getCardRc = (charName) => {
  const st = globalStore.charLoadouts[charName];
  if (!st || !Array.isArray(st.slots)) return 0;
  const idx = st.activeSlot === 1 ? 1 : 0;
  return Number(st.slots[idx]?.rc || 0);
};

const quickChangeCardRc = (charName, event) => {
  event.stopPropagation();
  setCharResonanceChain(charName, Number(event.target.value));
};

const showTagModal = ref(false);
const tagModalName = ref('');
const tagModalSelectedChars = reactive(new Set());

watch(tagModalName, (newVal) => {
    tagModalSelectedChars.clear();
    const trimmed = String(newVal).trim();
    if (!trimmed) return;
    const parsedNum = parseFloat(trimmed);
    const targetGen = isNaN(parsedNum) ? trimmed : parsedNum;
    characterOrder.forEach(c => {
        if (getCharMeta(c).gen === targetGen) tagModalSelectedChars.add(c);
    });
});

const openTagModal = () => {
    tagModalName.value = '';
    tagModalSelectedChars.clear();
    showTagModal.value = true;
};

const toggleCharForTag = (c) => {
    if (tagModalSelectedChars.has(c)) tagModalSelectedChars.delete(c);
    else tagModalSelectedChars.add(c);
};

const saveTagAssignments = () => {
    const tName = tagModalName.value.trim();
    if (!tName) return;
    const parsedNum = parseFloat(tName);
    const finalTag = isNaN(parsedNum) ? tName : parsedNum;
    characterOrder.forEach(c => {
        const currentTag = getCharMeta(c).gen;
        if (tagModalSelectedChars.has(c)) localTags.value[c] = finalTag;
        else if (currentTag === finalTag) delete localTags.value[c];
    });
    localStorage.setItem('ww_char_custom_tags', JSON.stringify(localTags.value));
    showTagModal.value = false;
};

onMounted(async () => {
    for (const c of characterOrder) {
        try { const url = await avatarStorage.getAvatar(c); if (url) customAvatars.value[c] = url; } catch (e) {}
    }
});

const cropState = reactive({ 
    show: false, step: 'crop', imgUrl: '', previewUrl: '', previewBlob: null,
    char: '', scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 
});

const triggerAvatarUpload = async (c, event) => {
    event.stopPropagation();
    if (customAvatars.value[c]) {
        if (confirm(t('此角色已有自訂頭像。按「確定」刪除並恢復預設，或按「取消」上傳新圖片。'))) {
            await avatarStorage.deleteAvatar(c);
            URL.revokeObjectURL(customAvatars.value[c]);
            delete customAvatars.value[c];
            return;
        }
    }
    uploadingChar.value = c;
    if (fileInput.value) fileInput.value.click();
};

const onFileSelected = (event) => {
    const file = event.target.files[0];
    if (!file || !uploadingChar.value) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        const fitScale = Math.max(192 / img.naturalWidth, 192 / img.naturalHeight);
        cropState.scale = parseFloat(Math.min(10, Math.max(0.1, fitScale)).toFixed(2));
        cropState.imgUrl = url; cropState.char = uploadingChar.value;
        cropState.x = 0; cropState.y = 0; cropState.step = 'crop'; 
        cropState.previewUrl = ''; cropState.previewBlob = null;
        cropState.show = true; event.target.value = ''; 
    };
    img.src = url;
};

const startDrag = (e) => {
    cropState.isDragging = true;
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropState.startX = clientX - cropState.x; cropState.startY = clientY - cropState.y;
};
const onDrag = (e) => {
    if (!cropState.isDragging) return;
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    cropState.x = clientX - cropState.startX; cropState.y = clientY - cropState.startY;
};
const stopDrag = () => { cropState.isDragging = false; };
const closeCrop = () => { 
    if (cropState.imgUrl) URL.revokeObjectURL(cropState.imgUrl); 
    if (cropState.previewUrl) URL.revokeObjectURL(cropState.previewUrl);
    cropState.show = false; 
};
const backToCrop = () => { cropState.step = 'crop'; };

const generatePreview = () => {
    const img = new Image();
    img.onload = () => {
        const SIZE = 256; const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE; const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#121216'; ctx.fillRect(0, 0, SIZE, SIZE);
        const uiSize = 192; const ratio = SIZE / uiSize; 
        const w = img.naturalWidth * cropState.scale * ratio;
        const h = img.naturalHeight * cropState.scale * ratio;
        const drawX = (SIZE / 2) + (cropState.x * ratio) - (w / 2);
        const drawY = (SIZE / 2) + (cropState.y * ratio) - (h / 2);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, drawX, drawY, w, h);
        canvas.toBlob((blob) => {
            if (cropState.previewUrl) URL.revokeObjectURL(cropState.previewUrl);
            cropState.previewBlob = blob; cropState.previewUrl = URL.createObjectURL(blob);
            cropState.step = 'preview';
        }, 'image/jpeg', 0.95);
    };
    img.src = cropState.imgUrl;
};

const confirmCropAndSave = async () => {
    if (!cropState.previewBlob) return;
    await avatarStorage.saveAvatar(cropState.char, cropState.previewBlob);
    if (customAvatars.value[cropState.char]) URL.revokeObjectURL(customAvatars.value[cropState.char]);
    customAvatars.value[cropState.char] = URL.createObjectURL(cropState.previewBlob);
    closeCrop();
};

// 🌟 新增自訂角色系統 (角色定位：生存位 2次 / 一般角色 1次)
const elementOptions = ['衍射', '氣動', '冷凝', '導電', '熱熔', '湮滅'];
const roleTypeOptions = [
    { label: '一般角色 (可用 1 次)', value: 1 },
    { label: '生存位 (可用 2 次)', value: 2 }
];

const showAddCharModal = ref(false);
const newChar = reactive({ name: '', rarity: 5, gen: 3, element: '衍射', roleMax: 1 });

const addCustomCharacter = () => {
    const name = newChar.name.trim(); 
    let genInput = String(newChar.gen).trim();
    if (!name) return alert(t('角色名稱不能為空！'));
    if (charData[name]) return alert(t('該角色已經存在於資料庫中！'));
    if (!genInput) genInput = '3';
    const parsedNum = parseFloat(genInput); 
    const finalGen = isNaN(parsedNum) ? genInput : parsedNum;
    const maxUse = parseInt(newChar.roleMax) === 2 ? 2 : 1;

    const localCustomChars = JSON.parse(localStorage.getItem('ww_custom_characters') || '[]');
    localCustomChars.push({ 
        name, 
        rarity: newChar.rarity, 
        gen: finalGen, 
        element: newChar.element,
        max: maxUse 
    });
    localStorage.setItem('ww_custom_characters', JSON.stringify(localCustomChars));

    charData[name] = { 
        rarity: newChar.rarity, 
        gen: finalGen, 
        element: newChar.element, 
        max: maxUse, 
        isCustom: true 
    };
    characterOrder.push(name); 
    globalStore.ownedCharacters.add(name);

    newChar.name = ''; 
    newChar.gen = 3; 
    newChar.element = '衍射';
    newChar.roleMax = 1;
    showAddCharModal.value = false;
};

const deleteCustomCharacter = async (charName, event) => {
    event.stopPropagation();
    if (!confirm(t('確定要刪除自訂角色「{name}」嗎？').replace('{name}', t(charName)))) return;

    let localCustomChars = JSON.parse(localStorage.getItem('ww_custom_characters') || '[]');
    localCustomChars = localCustomChars.filter(c => c.name !== charName);
    localStorage.setItem('ww_custom_characters', JSON.stringify(localCustomChars));

    delete localTags.value[charName]; 
    localStorage.setItem('ww_char_custom_tags', JSON.stringify(localTags.value));
    delete charData[charName];
    const idx = characterOrder.indexOf(charName); 
    if (idx > -1) characterOrder.splice(idx, 1);
    globalStore.ownedCharacters.delete(charName); 
    delete globalStore.charCritRates[charName];

    try {
        await avatarStorage.deleteAvatar(charName);
        if (customAvatars.value[charName]) { 
            URL.revokeObjectURL(customAvatars.value[charName]); 
            delete customAvatars.value[charName]; 
        }
    } catch (e) {}
    if (loadoutChar.value === charName) showLoadoutModal.value = false;
};
</script>

<template>
  <div class="bg-panel p-6 rounded-xl border border-glass shadow-lg">
    
    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelected" />

    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
      <h2 class="text-xl font-bold text-gold flex items-center gap-2 m-0 border-none pb-0">
        <span>🎒</span> {{ t('角色庫') }}
      </h2>
      <div class="flex flex-wrap items-center gap-4">
        <input v-model="searchQuery" type="text" :placeholder="t('🔍 搜尋角色...')" class="bg-main text-content border border-glass rounded-lg px-3 py-1.5 focus:border-gold focus:outline-none text-sm w-32 md:w-48 transition-colors">
        <span class="text-gray-400 text-sm font-bold">{{ t('已擁有') }}：<span class="text-content">{{ globalStore.ownedCharacters.size }}</span> / {{ characterOrder.length }}</span>
        <button @click="showAddCharModal = true" class="bg-main border border-glass text-gold hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">➕ {{ t('新增角色') }}</button>
        <button @click="toggleAll" class="text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-bold shadow-sm" :class="isAllSelected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-500'">{{ isAllSelected ? t('全部變暗') : t('一鍵全選') }}</button>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="mb-6 flex flex-wrap gap-3 items-center bg-main/50 p-3 rounded-xl border border-glass">
      <div class="flex items-center gap-2 flex-wrap w-full">
        <span class="text-gray-400 text-sm font-bold px-2">✨ {{ t('篩選') }}：</span>
        <button @click="toggleFilter(activeStars, 5)" class="px-3 py-1 rounded-md text-sm border font-bold transition-colors" :class="activeStars.has(5) ? 'bg-yellow-600/30 border-yellow-500 text-yellow-400' : 'bg-main border-glass text-gray-500 opacity-60'">5★</button>
        <button @click="toggleFilter(activeStars, 4)" class="px-3 py-1 rounded-md text-sm border font-bold transition-colors" :class="activeStars.has(4) ? 'bg-purple-600/30 border-purple-500 text-purple-400' : 'bg-main border-glass text-gray-500 opacity-60'">4★</button>
        <div class="w-px h-5 bg-gray-700 mx-2 hidden sm:block"></div>
        
        <button v-for="g in availableGens" :key="g" @click="toggleFilter(activeGens, g)" class="px-3 py-1 rounded-md text-sm border font-bold transition-colors" :class="activeGens.has(g) ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-main border-glass text-gray-500 opacity-60'">{{ (typeof g === 'number' || !isNaN(g)) ? g + '.X' : t(g) }}</button>
        
        <button @click="openTagModal" class="ml-2 px-3 py-1 rounded-md text-xs border border-dashed border-emerald-500 text-emerald-400 hover:bg-emerald-900/30 font-bold transition-colors whitespace-nowrap shadow-sm">
            ➕ {{ t('新增/管理標籤') }}
        </button>
      </div>
    </div>

    <!-- 角色網格清單 (精簡外層：只保留名稱、必要狀態標籤與設定入口) -->
    <div class="grid grid-cols-[repeat(auto-fill,minmax(165px,1fr))] gap-3">
      <div v-for="c in filteredCharacters" :key="c" @click="toggleChar(c)" 
           class="relative group cursor-pointer transition-all duration-200 flex items-center justify-between gap-2 px-3 py-3 rounded-xl border border-glass" 
           :style="{ borderLeft: getCharMeta(c).rarity === 5 ? '4px solid #d4af37' : '4px solid #9b59b6', opacity: globalStore.ownedCharacters.has(c) ? '1' : '0.4', backgroundColor: globalStore.ownedCharacters.has(c) ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.4)' }">
        <span class="font-bold text-sm tracking-wide truncate" :class="globalStore.ownedCharacters.has(c) ? 'text-content' : 'text-gray-400'">{{ t(c) }}</span>
        
        <div class="flex items-center gap-1.5 shrink-0">
            <span v-if="getCardRc(c) > 0"
                  class="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300"
                  :title="t('已設定共鳴鏈')">
              S{{ getCardRc(c) }}
            </span>
            <span v-if="globalStore.charLoadouts[c]?.activeSlot === 1"
                  class="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300"
                  :title="t('目前啟用槽位 2')">
              槽2
            </span>
            <button v-if="c === '漂泊者'" @click="openRoverModal" 
                    class="bg-yellow-500/20 hover:bg-yellow-500 text-yellow-400 hover:text-black border border-yellow-500/50 text-[10px] px-1.5 py-0.5 rounded font-black transition-all shadow-sm" 
                    :title="t('管理漂泊者可用屬性與開關')">
                ✨
            </button>
            <button @click="openLoadoutModal(c, $event)"
                    class="text-xs opacity-50 group-hover:opacity-100 hover:text-gold transition-opacity p-0.5"
                    :title="t('角色設定 (共鳴鏈 / 武器 / 聲骸 / 雙槽位 / 頭像)')">
              ⚙️
            </button>
        </div>
      </div>
    </div>

    <!-- 漂泊者可用屬性管理 Modal -->
    <Teleport to="body">
      <div v-if="showRoverModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div class="bg-[#121216] w-full max-w-md rounded-2xl border border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.3)] overflow-hidden flex flex-col">
            <div class="bg-gray-800 px-5 py-4 border-b border-gray-700 flex justify-between items-center">
                <h2 class="text-lg font-bold text-yellow-400 flex items-center gap-2"><span>✨</span> {{ t('漂泊者可用屬性管理') }}</h2>
                <button @click="showRoverModal = false" class="text-gray-400 hover:text-white transition-colors font-bold text-lg">✖</button>
            </div>
            <div class="p-5 flex flex-col gap-4">
                <div class="text-xs text-gray-400 bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-xl leading-relaxed">
                    {{ t('在此勾選或取消漂泊者開放的屬性型態。') }}
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div v-for="(cfg, key) in roverConfig" :key="key" 
                         class="bg-gray-900/80 p-3.5 rounded-xl border transition-all flex justify-between items-center cursor-pointer select-none shadow-sm"
                         :class="cfg.enabled ? 'border-yellow-500/60 bg-yellow-900/10' : 'border-gray-800 opacity-50'"
                         @click="cfg.enabled = !cfg.enabled">
                        <div class="flex flex-col">
                            <span class="font-black text-sm" :class="cfg.enabled ? 'text-yellow-300' : 'text-gray-400'">{{ t(key) }}</span>
                            <span class="text-[11px] text-gray-500 font-mono">{{ cfg.attr }}屬性</span>
                        </div>
                        <input type="checkbox" v-model="cfg.enabled" @click.stop class="w-5 h-5 accent-yellow-500 rounded cursor-pointer">
                    </div>
                </div>
                <button @click="showRoverModal = false" class="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 rounded-xl transition-all shadow-lg text-base mt-2">
                    ✅ {{ t('完成並儲存屬性設定') }}
                </button>
            </div>
        </div>
      </div>
    </Teleport>

    <!-- 標籤管理 Modal -->
    <Teleport to="body">
        <div v-if="showTagModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-[#121216] border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-[800px] relative flex flex-col gap-5 max-h-[90vh]">
                <div class="flex justify-between items-center border-b border-gray-700 pb-3">
                    <h3 class="text-xl font-bold text-emerald-400 flex items-center gap-2"><span>🏷️</span> {{ t('標籤與分類管理') }}</h3>
                    <button @click="showTagModal = false" class="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full font-bold transition-colors flex items-center justify-center">✖</button>
                </div>
                <div class="flex flex-col gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                    <div>
                        <label class="block text-gray-300 text-xs font-bold mb-2 flex items-center gap-1">✨ {{ t('快速選取現有標籤：') }}</label>
                        <div class="flex flex-wrap gap-2">
                            <button v-for="g in availableGens" :key="g" @click="tagModalName = String(g)"
                                    class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm"
                                    :class="tagModalName === String(g) ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-gray-800 border-gray-600 text-gray-400'">
                                {{ (typeof g === 'number' || !isNaN(g)) ? g + '.X' : t(g) }}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-gray-300 text-xs font-bold mb-1 flex items-center gap-1">✏️ {{ t('或輸入欲編輯、新增的標籤名稱：') }}</label>
                        <input v-model="tagModalName" type="text" class="w-full bg-[#0a0a0c] text-emerald-300 border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 outline-none font-bold" :placeholder="t('例如：熱熔、4、聯動角色')">
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0c] border border-gray-800 rounded-xl p-4 relative">
                    <div v-if="!tagModalName.trim()" class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] z-20 rounded-xl">
                        <span class="text-emerald-400 text-4xl mb-3 animate-bounce">👆</span>
                        <span class="text-white text-base font-bold tracking-wider">{{ t('請先從上方選擇標籤，或輸入新名稱') }}</span>
                    </div>
                    <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                        <div v-for="c in characterOrder" :key="c" @click="tagModalName.trim() ? toggleCharForTag(c) : null"
                             class="flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all border-2 select-none"
                             :class="tagModalSelectedChars.has(c) ? 'border-emerald-500 bg-emerald-900/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'border-transparent bg-gray-800/60 opacity-80'">
                            <div class="w-12 h-12 rounded-full bg-[#121216] border-2 shrink-0 overflow-hidden flex items-center justify-center mb-2"
                                 :class="tagModalSelectedChars.has(c) ? 'border-emerald-400' : 'border-gray-600'">
                                <img v-if="customAvatars[c]" :src="customAvatars[c]" class="w-full h-full object-cover" />
                                <span v-else class="text-lg font-black" :class="tagModalSelectedChars.has(c) ? 'text-emerald-300' : 'text-gray-500'">{{ String(t(c)).substring(0,1) }}</span>
                            </div>
                            <span class="text-xs font-bold text-center leading-tight break-all" :class="tagModalSelectedChars.has(c) ? 'text-emerald-100' : 'text-gray-300'">{{ t(c) }}</span>
                        </div>
                    </div>
                </div>
                <button @click="saveTagAssignments" :disabled="!tagModalName.trim()" class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-lg">
                    💾 {{ t('儲存標籤設定') }}
                </button>
            </div>
        </div>
    </Teleport>

    <!-- 頭像裁切 Modal -->
    <Teleport to="body">
        <div v-if="cropState.show" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-[#121216] border border-gray-700 p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 relative w-full max-w-sm">
                <button @click="closeCrop" class="absolute top-4 right-4 text-gray-500 hover:text-white font-bold">✖</button>
                <template v-if="cropState.step === 'crop'">
                    <h3 class="text-lg font-bold text-gold">🖼️ {{ t('調整頭像顯示範圍') }}</h3>
                    <div class="w-48 h-48 border-2 border-dashed border-gray-600 rounded-xl relative overflow-hidden bg-[#0a0a0c] cursor-move shadow-inner"
                         @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag"
                         @touchstart.prevent="startDrag" @touchmove.prevent="onDrag" @touchend.prevent="stopDrag">
                        <img :src="cropState.imgUrl" draggable="false" class="absolute pointer-events-none origin-center max-w-none"
                             :style="{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${cropState.x}px), calc(-50% + ${cropState.y}px)) scale(${cropState.scale})` }" />
                    </div>
                    <div class="w-full flex items-center gap-2 px-2 mt-2">
                        <span class="text-xs text-gray-400">🔍</span>
                        <input type="range" v-model.number="cropState.scale" min="0.1" max="10" step="0.05" class="w-full accent-gold cursor-pointer">
                        <span class="text-xs text-gold font-mono w-10 text-right">{{ cropState.scale.toFixed(2) }}x</span>
                    </div>
                    <div class="flex gap-3 w-full mt-3">
                        <button @click="closeCrop" class="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg font-bold">{{ t('取消') }}</button>
                        <button @click="generatePreview" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold shadow-md">👁️ {{ t('預覽頭像') }}</button>
                    </div>
                </template>
                <template v-else-if="cropState.step === 'preview'">
                    <h3 class="text-lg font-bold text-emerald-400">✅ {{ t('預覽裁切結果') }}</h3>
                    <div class="w-32 h-32 rounded-full border-4 border-gray-700 overflow-hidden shadow-xl my-4 relative bg-[#121216]">
                        <img :src="cropState.previewUrl" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex gap-3 w-full mt-3">
                        <button @click="backToCrop" class="flex-1 bg-gray-800 text-gray-300 py-2 rounded-lg font-bold">⬅️ {{ t('重新調整') }}</button>
                        <button @click="confirmCropAndSave" class="flex-1 bg-gold text-black py-2 rounded-lg font-bold shadow-md">📥 {{ t('確認儲存') }}</button>
                    </div>
                </template>
            </div>
        </div>
    </Teleport>

    <!-- 🌟 新增自訂角色 Modal (含生存位/一般角色選擇) -->
    <Teleport to="body">
        <div v-if="showAddCharModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-[#121216] border border-gray-700 p-6 rounded-2xl shadow-2xl w-full max-w-sm relative flex flex-col gap-5">
                <div class="flex justify-between items-center border-b border-gray-800 pb-3">
                    <h3 class="text-xl font-bold text-emerald-400 flex items-center gap-2"><span>➕</span> {{ t('新增自訂角色') }}</h3>
                    <button @click="showAddCharModal = false" class="text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full font-bold flex items-center justify-center">✖</button>
                </div>
                
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block text-gray-300 text-sm font-bold mb-1.5">{{ t('角色名稱') }}</label>
                        <input v-model="newChar.name" type="text" class="w-full bg-[#0a0a0c] text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 outline-none font-bold" :placeholder="t('請輸入角色名稱')">
                    </div>
                    <div>
                        <label class="block text-gray-300 text-sm font-bold mb-1.5">{{ t('共鳴屬性') }}</label>
                        <select v-model="newChar.element" class="w-full bg-[#0a0a0c] text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 outline-none font-bold cursor-pointer">
                            <option v-for="elem in elementOptions" :key="elem" :value="elem">{{ t(elem) }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 text-sm font-bold mb-1.5">⏳ {{ t('角色定位 (可用次數)') }}</label>
                        <select v-model.number="newChar.roleMax" class="w-full bg-[#0a0a0c] text-amber-400 border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 outline-none font-bold cursor-pointer">
                            <option v-for="rOpt in roleTypeOptions" :key="rOpt.value" :value="rOpt.value">{{ t(rOpt.label) }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 text-sm font-bold mb-1.5">{{ t('星級') }}</label>
                        <select v-model.number="newChar.rarity" class="w-full bg-[#0a0a0c] text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 outline-none font-bold cursor-pointer">
                            <option value="5">5 ⭐ (金色)</option>
                            <option value="4">4 ⭐ (紫色)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-300 text-sm font-bold mb-1.5">{{ t('初始分類標籤 / 版本') }}</label>
                        <input v-model="newChar.gen" type="text" class="w-full bg-[#0a0a0c] text-white border border-gray-700 rounded-lg px-4 py-2.5 focus:border-emerald-500 outline-none font-bold" :placeholder="t('例如 3 或輸入文字標籤')">
                    </div>
                </div>

                <button @click="addCustomCharacter" class="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-lg tracking-wider">
                    ✅ {{ t('確認新增') }}
                </button>
            </div>
        </div>
    </Teleport>

    <!-- 🌟 角色實戰參數 / 武器 / 聲骸套裝 / 雙專屬槽位配置 Modal -->
    <Teleport to="body">
      <div v-if="showLoadoutModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 animate-fade-in">
        <div class="bg-[#121216] border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-gray-900/90 px-5 py-4 border-b border-gray-800 flex flex-wrap justify-between items-center gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⚔️</span>
              <div>
                <h3 class="text-lg font-black text-gold m-0">{{ t(loadoutChar) }} · {{ t('實戰裝備與雙專屬槽位') }}</h3>
                <div class="text-[11px] text-gray-400">
                  {{ t(currentCharMeta.element || '') }} · {{ t(currentCharMeta.weaponType || '') }} · Lv.90 基礎 生命 {{ currentCharMeta.baseHp }} / 攻擊 {{ currentCharMeta.baseAtk }} / 防禦 {{ currentCharMeta.baseDef }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button @click="triggerAvatarUpload(loadoutChar, $event)"
                      class="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                      :class="customAvatars[loadoutChar] ? 'bg-blue-900/40 border-blue-400/60 text-blue-300 hover:bg-blue-800/50' : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'">
                🖼️ {{ customAvatars[loadoutChar] ? t('重設/更換頭像') : t('自訂頭像') }}
              </button>
              <button v-if="getCharMeta(loadoutChar).isCustom" @click="deleteCustomCharacter(loadoutChar, $event)"
                      class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-900/40 border border-rose-500/50 text-rose-300 hover:bg-rose-800/60">
                🗑️ {{ t('刪除角色') }}
              </button>
              <button @click="showLoadoutModal = false" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-full font-bold flex items-center justify-center">✖</button>
            </div>
          </div>

          <!-- Slot 1 & Slot 2 Switcher -->
          <div class="px-5 pt-3 pb-2 bg-[#16161c] border-b border-gray-800 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button @click="selectLoadoutTab(0)" class="px-3.5 py-1.5 rounded-lg text-xs font-black border transition-all" :class="loadoutTab === 0 ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300 shadow' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'">
                📦 槽位 1 <span v-if="globalStore.charLoadouts[loadoutChar]?.activeSlot !== 1" class="ml-1 text-[10px] text-emerald-400">(啟用中)</span>
              </button>
              <button @click="selectLoadoutTab(1)" class="px-3.5 py-1.5 rounded-lg text-xs font-black border transition-all" :class="loadoutTab === 1 ? 'bg-cyan-600/30 border-cyan-400 text-cyan-300 shadow' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'">
                📦 槽位 2 <span v-if="globalStore.charLoadouts[loadoutChar]?.activeSlot === 1" class="ml-1 text-[10px] text-cyan-400">(啟用中)</span>
              </button>
              <input v-model="draftSlot.label" type="text" class="bg-gray-900 border border-gray-700 text-xs text-white px-2.5 py-1.5 rounded-lg w-32 md:w-40 outline-none focus:border-gold" placeholder="槽位名稱...">
            </div>
            <div class="flex items-center gap-2">
              <button @click="copyOtherSlotToDraft" class="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded text-[11px] font-bold">📋 複製另一槽位</button>
              <button @click="resetDraftToDefault" class="px-2.5 py-1 bg-rose-900/30 hover:bg-rose-800/40 text-rose-300 border border-rose-500/40 rounded text-[11px] font-bold">🔄 重置預設</button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
            <!-- Live Panel Summary -->
            <div v-if="draftEffectiveStats" class="bg-gradient-to-r from-[#1a1c24] to-[#14151b] p-3.5 rounded-xl border border-amber-500/30 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div><div class="text-[10px] text-gray-400">生命</div><div class="font-mono font-black text-sm text-white">{{ draftEffectiveStats.totalHp }}</div></div>
              <div><div class="text-[10px] text-gray-400">攻擊</div><div class="font-mono font-black text-sm text-amber-300">{{ draftEffectiveStats.totalAtk }}</div></div>
              <div><div class="text-[10px] text-gray-400">防禦</div><div class="font-mono font-black text-sm text-gray-200">{{ draftEffectiveStats.totalDef }}</div></div>
              <div><div class="text-[10px] text-gray-400">暴擊率</div><div class="font-mono font-black text-sm text-emerald-400">{{ draftEffectiveStats.critRate }}%</div></div>
              <div><div class="text-[10px] text-gray-400">暴擊傷害</div><div class="font-mono font-black text-sm text-rose-400">{{ draftEffectiveStats.critDmg }}%</div></div>
              <div><div class="text-[10px] text-gray-400">屬傷 / 無視防</div><div class="font-mono font-black text-xs text-cyan-300">{{ draftEffectiveStats.elemDmgPct }}% / {{ draftEffectiveStats.ignoreDefPct }}%</div></div>
            </div>

            <!-- Weapon, RC, Passives Toggle -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-900/50 p-3.5 rounded-xl border border-gray-800"
                 :style="{ borderLeft: '4px solid ' + selectedWeaponRarityMeta.borderHex }">
              <div class="md:col-span-6 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                  <label class="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <span>🗡️ 武器 ({{ currentCharMeta.weaponType }})</span>
                    <span class="px-1.5 py-0.5 rounded border text-[10px] font-black" :class="selectedWeaponRarityMeta.badgeClass">{{ selectedWeaponRarityMeta.label }}</span>
                  </label>
                  <label class="text-[10px] text-gray-400 flex items-center gap-1 cursor-pointer">
                    <input v-model="showAllWeaponTypes" type="checkbox" class="accent-gold"> 顯示全部武器
                  </label>
                </div>
                <select v-model.number="draftSlot.weaponId" class="bg-[#0a0a0c] text-white border rounded-lg px-2.5 py-2 text-xs font-bold outline-none focus:border-gold"
                        :style="{ borderColor: selectedWeaponRarityMeta.borderHex }">
                  <optgroup v-for="grp in weaponGroupsByRarity" :key="grp.star" :label="`${grp.meta.stars} ${grp.meta.label} (${grp.items.length}把)`">
                    <option v-for="w in grp.items" :key="w.id" :value="w.id">
                      {{ grp.meta.stars }} [{{ w.weaponType }}] {{ w.name }} (攻{{ w.baseAtk }} / {{ w.subStatKey }} {{ w.subStatVal }}%)
                    </option>
                  </optgroup>
                </select>
              </div>
              <div class="md:col-span-2 flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-300">精煉階數</label>
                <select v-model.number="draftSlot.weaponRank" class="bg-[#0a0a0c] text-amber-400 border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-bold outline-none focus:border-gold">
                  <option v-for="r in [1,2,3,4,5]" :key="r" :value="r">R{{ r }} ({{ r }}階)</option>
                </select>
              </div>
              <div class="md:col-span-2 flex flex-col gap-1">
                <label class="text-xs font-bold text-gray-300">共鳴鏈</label>
                <select v-model.number="draftSlot.rc" @change="focusedRcNode = Math.max(1, draftSlot.rc || 1)" class="bg-[#0a0a0c] text-emerald-400 border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-bold outline-none focus:border-gold">
                  <option v-for="c in [0,1,2,3,4,5,6]" :key="c" :value="c">S{{ c }} ({{ c }}鏈)</option>
                </select>
              </div>
              <div class="md:col-span-2 flex flex-col justify-end">
                <label class="flex items-center gap-1.5 bg-[#0a0a0c] border border-gray-700 px-2.5 py-2 rounded-lg text-[11px] font-bold text-cyan-300 cursor-pointer">
                  <input v-model="draftSlot.triggerPassives" type="checkbox" class="accent-cyan-400">
                  <span>實戰特效滿層</span>
                </label>
              </div>

              <!-- Interactive Resonance Chain S0..S6 Nodes -->
              <div class="md:col-span-12 bg-black/40 p-2.5 rounded-lg border border-gray-800/90 flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-[11px] font-black text-amber-300">🌟 共鳴鏈節點切換 (當前：{{ draftSlot.rc }}鏈 S{{ draftSlot.rc }})</span>
                  <div class="flex flex-wrap gap-1">
                    <button v-for="lvl in [0,1,2,3,4,5,6]" :key="lvl" type="button"
                            @click="draftSlot.rc = lvl; if (lvl > 0) focusedRcNode = lvl"
                            class="px-2 py-0.5 rounded text-[11px] font-black border transition-all"
                            :class="lvl === 0
                              ? (draftSlot.rc === 0 ? 'bg-gray-600 text-white border-gray-400' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500')
                              : (draftSlot.rc >= lvl ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-sm' : 'bg-gray-900/80 text-gray-500 border-gray-800 hover:border-gray-600')">
                      S{{ lvl }}
                    </button>
                  </div>
                </div>
                <div v-if="rcNodesForChar.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  <div v-for="node in rcNodesForChar" :key="node.idx"
                       @click="draftSlot.rc = node.idx; focusedRcNode = node.idx"
                       class="p-2 rounded border text-[10px] leading-snug cursor-pointer transition-all"
                       :class="draftSlot.rc >= node.idx ? 'bg-amber-950/30 border-amber-500/50 text-gray-200' : 'bg-gray-950/60 border-gray-800/70 text-gray-500 opacity-75 hover:opacity-100'">
                    <div class="font-black flex items-center justify-between mb-0.5" :class="draftSlot.rc >= node.idx ? 'text-amber-300' : 'text-gray-400'">
                      <span>S{{ node.idx }} · {{ node.name }}</span>
                      <span>{{ draftSlot.rc >= node.idx ? '✅ 已啟用' : '未解鎖' }}</span>
                    </div>
                    <div class="line-clamp-3">{{ node.desc }}</div>
                  </div>
                </div>
                <div v-else class="text-[10px] text-gray-500">此角色暫無資料庫共鳴鏈描述資料，仍可切換 S0~S6。</div>
              </div>

              <div v-if="selectedWeaponObj" class="md:col-span-12 text-[11px] text-gray-400 bg-black/40 p-2 rounded border border-gray-800/80 leading-relaxed flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 rounded border text-[10px] font-black" :class="selectedWeaponRarityMeta.badgeClass">{{ selectedWeaponRarityMeta.stars }}</span>
                  <span class="font-bold" :class="selectedWeaponRarityMeta.textClass">{{ selectedWeaponObj.name }} R{{ draftSlot.weaponRank }}：</span>
                </div>
                <div>{{ formatWeaponDesc(selectedWeaponObj, draftSlot.weaponRank) }}</div>
              </div>
            </div>

            <!-- 3 Simultaneous Echo Sets + 12 Cost Check & Main Echo -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-gray-900/50 p-3.5 rounded-xl border"
                 :class="echoValidation.isValid ? 'border-gray-800' : 'border-rose-500/80 bg-rose-950/20'">
              <div class="lg:col-span-8 flex flex-col gap-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <label class="text-xs font-bold text-emerald-400">🧩 聲骸套裝 (可同時攜帶 3 種套裝，含 2件/3件/5件套)</label>
                  <div class="flex items-center gap-2 text-[11px] font-black">
                    <span class="px-2 py-0.5 rounded border"
                          :class="echoValidation.isOverCost ? 'bg-rose-900/60 border-rose-400 text-rose-200 animate-pulse' : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300'">
                      Cost：{{ echoValidation.totalCost }} / 12
                    </span>
                    <span class="px-2 py-0.5 rounded border"
                          :class="echoValidation.isOverPieces || echoValidation.setsExceedCosts ? 'bg-rose-900/60 border-rose-400 text-rose-200' : 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300'">
                      套裝件數：{{ echoValidation.totalPieces }} / {{ echoValidation.activeCostSlots }} (上限5)
                    </span>
                  </div>
                </div>

                <!-- 3 Echo Set Slots -->
                <div class="grid grid-cols-1 gap-2">
                  <div v-for="(slotItem, sIdx) in draftSlot.echoSets" :key="sIdx"
                       class="bg-black/40 p-2 rounded-lg border border-gray-800/90 flex flex-col gap-1.5">
                    <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span class="text-[11px] font-black text-emerald-300 shrink-0 w-12">套裝 {{ sIdx + 1 }}</span>
                      <select v-model.number="slotItem.setId" @change="syncPrimaryEchoSetId"
                              class="flex-1 bg-[#0a0a0c] text-white border border-gray-700 rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-emerald-500">
                        <option :value="0">-- 不攜帶此套裝 --</option>
                        <option v-for="es in ECHO_SETS_DB" :key="es.id" :value="es.id">
                          {{ es.name }} ({{ (es.bonuses || []).map(b => b.count + 'pc').join('/') || (es.pcCount + 'pc') }})
                        </option>
                      </select>
                      <select v-model.number="slotItem.pieces" @change="syncPrimaryEchoSetId"
                              class="w-24 bg-[#0a0a0c] text-amber-300 border border-gray-700 rounded px-2 py-1.5 text-xs font-black outline-none focus:border-emerald-500">
                        <option :value="0">0 件</option>
                        <option v-for="cnt in [1,2,3,4,5]" :key="cnt" :value="cnt">{{ cnt }} 件</option>
                      </select>
                    </div>
                    <div v-if="slotItem.setId > 0 && getEchoSetById(slotItem.setId)" class="text-[10px] text-gray-400 leading-relaxed pl-1">
                      <div v-for="b in (getEchoSetById(slotItem.setId).bonuses || [])" :key="b.count"
                           :class="slotItem.pieces >= b.count ? 'text-emerald-300' : 'text-gray-500 line-through opacity-60'">
                        <span class="font-bold">{{ slotItem.pieces >= b.count ? '✅' : '○' }} {{ b.count }}pc：</span>{{ b.desc }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 5 Echo Cost Slots & Presets -->
                <div class="bg-black/40 p-2.5 rounded-lg border border-gray-800/90 flex flex-col gap-2">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-[11px] font-bold text-gray-300">⚖️ 5格聲骸 Cost 配重 (總計上限 12 Cost)</span>
                    <div class="flex items-center gap-1 text-[10px]">
                      <button type="button" @click="applyEchoCostPreset([4,3,3,1,1])" class="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-cyan-300 border border-gray-700 font-bold">43311 (12c)</button>
                      <button type="button" @click="applyEchoCostPreset([4,4,1,1,1])" class="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-amber-300 border border-gray-700 font-bold">44111 (11c)</button>
                      <button type="button" @click="applyEchoCostPreset([4,3,1,1,1])" class="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 font-bold">43111 (10c)</button>
                    </div>
                  </div>
                  <div class="grid grid-cols-5 gap-1.5">
                    <div v-for="(cVal, cIdx) in draftSlot.echoCosts" :key="cIdx" class="flex flex-col gap-0.5">
                      <span class="text-[9px] text-gray-500 text-center">{{ cIdx === 0 ? '首位#1' : '#' + (cIdx + 1) }}</span>
                      <select v-model.number="draftSlot.echoCosts[cIdx]"
                              class="bg-[#0a0a0c] text-center border border-gray-700 rounded py-1 text-xs font-mono font-black outline-none"
                              :class="echoValidation.isOverCost ? 'text-rose-300 border-rose-500/70' : 'text-cyan-300'">
                        <option :value="4">4C</option>
                        <option :value="3">3C</option>
                        <option :value="1">1C</option>
                        <option :value="0">0(空)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Validation Error Banner -->
                <div v-if="!echoValidation.isValid" class="bg-rose-950/70 border border-rose-500 text-rose-200 p-2.5 rounded-lg text-xs font-bold flex flex-col gap-0.5">
                  <div v-for="(err, ei) in echoValidation.errors" :key="ei">⚠️ {{ err }}</div>
                </div>
              </div>

              <div class="lg:col-span-4 flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-1">
                  <label class="text-xs font-bold text-purple-400">
                    👾 首位主聲骸
                    <span class="text-[10px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.5 rounded ml-1">
                      {{ showAllMainEchoes ? '全庫 ' + MAIN_ECHOES_DB.length + ' 隻' : '套裝內 ' + availableMainEchoesForDraft.length + ' 隻' }}
                    </span>
                  </label>
                  <label class="flex items-center gap-1 text-[10px] text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" v-model="showAllMainEchoes" class="accent-purple-500" />
                    跨套裝全部顯示
                  </label>
                </div>

                <!-- Quick-pick 4C Echo chips for the active Echo Set(s) -->
                <div v-if="!showAllMainEchoes && fourCostMainEchoesForDraft.length > 0" class="flex flex-wrap gap-1.5 bg-purple-950/20 p-2 rounded-lg border border-purple-500/30">
                  <span class="w-full text-[10px] text-purple-300 font-bold">⚡ 當前套裝 4C 主力快選：</span>
                  <button v-for="ec4 in fourCostMainEchoesForDraft" :key="ec4.id" type="button"
                          @click="selectQuickMainEcho(ec4)"
                          class="px-2 py-1 rounded text-[11px] font-black transition-all border"
                          :class="Number(draftSlot.mainEchoId) === Number(ec4.id)
                            ? 'bg-purple-600 text-white border-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                            : 'bg-[#0a0a0c] text-purple-200 border-purple-500/40 hover:border-purple-400'">
                    👑 {{ ec4.name }} ({{ ec4.mvPct }}%)
                  </button>
                </div>

                <select v-model.number="draftSlot.mainEchoId" @change="onMainEchoChange"
                        class="bg-[#0a0a0c] text-white border border-gray-700 rounded-lg px-2.5 py-2 text-xs font-bold outline-none focus:border-purple-500">
                  <option :value="0">-- 無 / 僅看套裝與副詞條 --</option>
                  <optgroup v-for="grp in mainEchoGroupsByCost" :key="grp.cost" :label="grp.label + ' (' + grp.items.length + ')'">
                    <option v-for="me in grp.items" :key="me.id" :value="me.id">
                      [{{ me.cost || 4 }}C·{{ me.element }}] {{ me.name }} ({{ me.mvPct }}%)
                    </option>
                  </optgroup>
                </select>
                <div v-if="selectedMainEchoObj" class="text-[11px] text-gray-400 bg-black/40 p-2 rounded border border-gray-800/80 leading-relaxed flex-1">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-500/40 text-[10px] font-black">{{ selectedMainEchoObj.cost || 4 }} Cost</span>
                    <span class="font-bold text-white">{{ selectedMainEchoObj.name }}</span>
                    <span class="text-[10px] text-gray-500">CD {{ selectedMainEchoObj.cd }}s</span>
                  </div>
                  {{ selectedMainEchoObj.desc }}
                </div>
              </div>
            </div>

            <!-- Echo Stat Grid -->
            <div class="bg-gray-900/50 p-3.5 rounded-xl border border-gray-800 space-y-3">
              <div class="text-xs font-bold text-cyan-300">📊 聲骸裝備合計詞條 (含 4C/3C/1C 主副詞條 · 已自動隱藏無用詞條)</div>
              <div>
                <div class="text-[11px] font-bold text-amber-300/90 mb-1.5">🎯 核心雙暴與屬傷</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div v-if="relevantEchoStats.critRate"><label class="block text-[11px] text-gray-300 mb-0.5">暴擊 %</label><input v-model.number="draftSlot.echoCritRate" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:border-emerald-400 outline-none"></div>
                  <div v-if="relevantEchoStats.critDmg"><label class="block text-[11px] text-gray-300 mb-0.5">暴擊傷害 %</label><input v-model.number="draftSlot.echoCritDmg" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:border-rose-400 outline-none"></div>
                  <div v-if="relevantEchoStats.elemDmgPct"><label class="block text-[11px] text-gray-300 mb-0.5">屬性傷害加成 %</label><input v-model.number="draftSlot.echoElemDmgPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-cyan-300 font-mono font-bold focus:border-cyan-400 outline-none"></div>
                </div>
              </div>
              <div>
                <div class="text-[11px] font-bold text-emerald-300/90 mb-1.5">📊 有效基礎屬性</div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div v-if="relevantEchoStats.atkPct"><label class="block text-[11px] text-gray-300 mb-0.5">大攻擊 %</label><input v-model.number="draftSlot.echoAtkPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"></div>
                  <div v-if="relevantEchoStats.atkFlat"><label class="block text-[11px] text-gray-300 mb-0.5">小攻擊 (固定)</label><input v-model.number="draftSlot.echoAtkFlat" type="number" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-amber-400 outline-none"></div>
                  <div v-if="relevantEchoStats.hpPct"><label class="block text-[11px] text-gray-300 mb-0.5">大生命 %</label><input v-model.number="draftSlot.echoHpPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold focus:border-emerald-400 outline-none"></div>
                  <div v-if="relevantEchoStats.hpFlat"><label class="block text-[11px] text-gray-300 mb-0.5">小生命 (固定)</label><input v-model.number="draftSlot.echoHpFlat" type="number" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-emerald-400 outline-none"></div>
                  <div v-if="relevantEchoStats.defPct"><label class="block text-[11px] text-gray-300 mb-0.5">大防禦 %</label><input v-model.number="draftSlot.echoDefPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-amber-200 font-mono font-bold focus:border-amber-400 outline-none"></div>
                  <div v-if="relevantEchoStats.defFlat"><label class="block text-[11px] text-gray-300 mb-0.5">小防禦 (固定)</label><input v-model.number="draftSlot.echoDefFlat" type="number" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-amber-400 outline-none"></div>
                  <div v-if="relevantEchoStats.er"><label class="block text-[11px] text-gray-300 mb-0.5">共鳴效率 %</label><input v-model.number="draftSlot.echoEr" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-400 outline-none"></div>
                </div>
              </div>
              <div v-if="relevantEchoStats.basicDmgPct || relevantEchoStats.heavyDmgPct || relevantEchoStats.skillDmgPct || relevantEchoStats.libDmgPct">
                <div class="text-[11px] font-bold text-cyan-300/90 mb-1.5">⚔️ 有效技能傷害加成</div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div v-if="relevantEchoStats.basicDmgPct"><label class="block text-[11px] text-gray-300 mb-0.5">普攻加成 %</label><input v-model.number="draftSlot.echoBasicDmgPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-400 outline-none"></div>
                  <div v-if="relevantEchoStats.heavyDmgPct"><label class="block text-[11px] text-gray-300 mb-0.5">重擊加成 %</label><input v-model.number="draftSlot.echoHeavyDmgPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-400 outline-none"></div>
                  <div v-if="relevantEchoStats.skillDmgPct"><label class="block text-[11px] text-gray-300 mb-0.5">共技加成 %</label><input v-model.number="draftSlot.echoSkillDmgPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-400 outline-none"></div>
                  <div v-if="relevantEchoStats.libDmgPct"><label class="block text-[11px] text-gray-300 mb-0.5">共解加成 %</label><input v-model.number="draftSlot.echoLibDmgPct" type="number" step="0.1" class="w-full bg-[#0a0a0c] border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-cyan-400 outline-none"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-900/90 px-5 py-3.5 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <span v-if="!echoValidation.isValid" class="text-xs font-bold text-rose-400">❌ {{ echoValidation.errors[0] }}</span>
            <span v-else class="text-[11px] text-emerald-400 font-bold">✅ 聲骸配重合法 ({{ echoValidation.totalCost }}/12 Cost · {{ echoValidation.totalPieces }}/5 件)</span>
            <div class="flex flex-wrap justify-end gap-3 ml-auto">
              <button @click="showLoadoutModal = false" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold">取消</button>
              <button @click="saveLoadoutAndActivate(false)" :disabled="!echoValidation.isValid" class="px-4 py-2 bg-blue-600/80 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold">僅儲存槽位 {{ loadoutTab + 1 }}</button>
              <button @click="saveLoadoutAndActivate(true)" :disabled="!echoValidation.isValid" class="px-5 py-2 bg-gold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-lg text-xs font-black shadow-lg">✅ 儲存並啟用槽位 {{ loadoutTab + 1 }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
</style>