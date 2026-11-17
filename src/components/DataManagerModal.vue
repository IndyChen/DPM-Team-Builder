<!-- src/components/DataManagerModal.vue -->
<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import { globalStore, initStore } from '../core/store.js';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close']);
const t = inject('t') || ((str) => str);

const currentTab = ref('custom'); 
const storageUsage = ref('0 KB');
const storagePct = ref(0);
const importCode = ref('');

const tabConfig = {
  custom: { id: 'custom', icon: '⚔️', label: '自訂排軸', colorText: 'text-amber-400', border: 'border-amber-500/50', activeBg: 'bg-gray-800' },
  lineups: { id: 'lineups', icon: '💾', label: '記憶編隊', colorText: 'text-purple-400', border: 'border-purple-500/50', activeBg: 'bg-gray-800' },
  hp: { id: 'hp', icon: '🎯', label: '血量校正', colorText: 'text-red-400', border: 'border-red-500/50', activeBg: 'bg-gray-800' },
  backup: { id: 'backup', icon: '📦', label: '備份與還原', colorText: 'text-emerald-400', border: 'border-emerald-500/50', activeBg: 'bg-gray-800' }
};
const activeTheme = computed(() => tabConfig[currentTab.value]);

const localCustomRots = ref([]);
const localMemories = ref([]);
const localHpMap = ref({});

const updateStorageInfo = () => {
  let total = 0;
  for (let key in localStorage) { 
      if (localStorage.hasOwnProperty(key)) { total += ((localStorage[key].length + key.length) * 2); }
  }
  let kb = total / 1024;
  storageUsage.value = kb.toFixed(1) + ' KB';
  storagePct.value = Math.min(100, (kb / 5120) * 100); 
};

const loadLocalData = () => {
    try { 
        localCustomRots.value = JSON.parse(localStorage.getItem('ww_custom_rotations_v2') || '[]'); 
    } catch(e) { 
        localCustomRots.value = []; 
    }
    try { 
        const mems = JSON.parse(localStorage.getItem('ww_lineup_memories') || '[]'); 
        localMemories.value = mems.length ? mems : Array.from({ length: 10 }, () => ({ name: t('空存檔'), data: null, timestamp: null }));
    } catch(e) {}
    try { 
        const legacyHp = JSON.parse(localStorage.getItem('ww_boss_hp') || '{}');
        const envObj = JSON.parse(localStorage.getItem('ww_env_global') || '{}');
        const envHp = (envObj && envObj.customHpMap) ? envObj.customHpMap : {};
        const storeHp = (globalStore.envConfig && globalStore.envConfig.customHpMap) ? globalStore.envConfig.customHpMap : {};
        localHpMap.value = { ...legacyHp, ...envHp, ...storeHp };
    } catch(e) {}
};

onMounted(() => { 
    if (props.show) { 
        updateStorageInfo(); 
        loadLocalData(); 
    } 
});

watch(() => props.show, (newVal) => { 
    if (newVal) { 
        updateStorageInfo(); 
        loadLocalData(); 
        currentTab.value = 'custom'; 
    } 
});

const deleteCustomRot = (id) => {
    if(!confirm(t('確定要刪除這個自訂排軸嗎？此操作無法復原。'))) return;
    localCustomRots.value = localCustomRots.value.filter(r => r.id !== id);
    localStorage.setItem('ww_custom_rotations_v2', JSON.stringify(localCustomRots.value));
    updateStorageInfo();
    initStore();
    alert(t('✅ 刪除成功！'));
};

const clearMemorySlot = (index) => {
    if(!confirm(t('確定要清空這個記憶插槽嗎？'))) return;
    localMemories.value[index] = { name: t('空存檔'), data: null, timestamp: null };
    localStorage.setItem('ww_lineup_memories', JSON.stringify(localMemories.value));
    updateStorageInfo();
};

const deleteHpRecord = (key) => {
    if(!confirm(t('確定要刪除 {key} 的血量校正嗎？').replace('{key}', key))) return;
    delete localHpMap.value[key];
    try {
        const legacyHp = JSON.parse(localStorage.getItem('ww_boss_hp') || '{}');
        if (legacyHp && legacyHp[key] !== undefined) {
            delete legacyHp[key];
            localStorage.setItem('ww_boss_hp', JSON.stringify(legacyHp));
        }
    } catch (e) {}
    try {
        const envObj = JSON.parse(localStorage.getItem('ww_env_global') || '{}');
        if (envObj && envObj.customHpMap && envObj.customHpMap[key] !== undefined) {
            delete envObj.customHpMap[key];
            localStorage.setItem('ww_env_global', JSON.stringify(envObj));
        }
    } catch (e) {}
    if (globalStore.envConfig && globalStore.envConfig.customHpMap) delete globalStore.envConfig.customHpMap[key];
    window.dispatchEvent(new CustomEvent('ww-env-updated'));
    updateStorageInfo();
};

const factoryReset = () => {
  if (!confirm(t("⚠️ 嚴重警告：\n這將會徹底刪除您所有的本機數據！確定要恢復初始狀態嗎？"))) return;
  localStorage.clear(); 
  alert(t("✅ 所有數據已清除，系統即將重新啟動。")); 
  window.location.reload();
};

const recoverLegacyData = () => {
    let recovered = 0;
    const oldRoster = localStorage.getItem('ww_roster');
    if (oldRoster && (!localStorage.getItem('ww_owned_chars') || localStorage.getItem('ww_owned_chars') === '{}')) {
        localStorage.setItem('ww_owned_chars', oldRoster); 
        recovered++;
    }

    const oldRots = localStorage.getItem('ww_custom_rotations');
    if (oldRots) {
        try {
            let parsed = JSON.parse(oldRots);
            let currentV2 = JSON.parse(localStorage.getItem('ww_custom_rotations_v2') || '[]');
            let needsSave = false;
            parsed.forEach(old => {
                if (!currentV2.some(v2 => v2.rot === old.rot && v2.c1 === old.c1)) {
                    currentV2.push({
                        id: Date.now().toString() + Math.random().toString().substring(2,6),
                        c1: old.c1, c2: old.c2, c3: old.c3,
                        rot: old.rot, diff: old.diff || '🔵',
                        dps: old.dps, duration: old.duration || 25,
                        totalDmg: old.totalDmg || (old.dps * 25), gridData: old.gridData || []
                    });
                    needsSave = true;
                }
            });
            if (needsSave) { 
                localStorage.setItem('ww_custom_rotations_v2', JSON.stringify(currentV2)); 
                recovered++; 
            }
        } catch(e) {}
    }

    const oldLineups = localStorage.getItem('ww_saved_lineups');
    if (oldLineups) {
        try {
            let parsed = JSON.parse(oldLineups);
            let currentMemories = JSON.parse(localStorage.getItem('ww_lineup_memories') || '[]');
            let needsSave = false;
            if (currentMemories.length === 0 || currentMemories.every(m => m.data === null)) {
                let newMemories = Array.from({ length: 10 }, () => ({ name: t('空存檔'), data: null, timestamp: null }));
                parsed.slice(0, 10).forEach((oldL, i) => {
                    if (oldL && oldL.teams) {
                        newMemories[i] = {
                            name: oldL.name || `${t('舊存檔')} ${i+1}`, timestamp: t('從舊版尋回'),
                            data: oldL.teams.map(t => ({
                                c1: t.c1||'', c2: t.c2||'', c3: t.c3||'', rotId: t.rotId||'',
                                score: t.score||'', inputMode: 'score', endBoss: 'R1-1', endHpPct: null,
                                scoreMax: 0, scoreMin: 0, reportMax: '', reportMin: ''
                            }))
                        };
                        needsSave = true;
                    }
                });
                if (needsSave) { 
                    localStorage.setItem('ww_lineup_memories', JSON.stringify(newMemories)); 
                    recovered++; 
                }
            }
        } catch(e) {}
    }

    if (recovered > 0) {
        alert(t('✅ 成功尋回並無損升級了 {count} 項舊版資料！請重新整理頁面。').replace('{count}', recovered)); 
        window.location.reload();
    } else {
        alert(t('ℹ️ 系統掃描完畢，沒有發現遺失的舊版資料，或資料已經是最新的 v4 格式。'));
    }
};

const generateExportCode = () => {
    const backupKeys = [ 
        'ww_custom_characters',
        'ww_owned_chars', 'ww_saved_lineups_v4', 'ww_lineup_memories', 
        'ww_custom_rotations_v2', 'ww_custom_stats', 'ww_char_crit_rates', 'ww_char_loadouts',
        'ww_disabled_rots', 'ww_env_global', 'ww_boss_hp', 'ww_boss_hp_history', 
        'ww_char_stamina_bytes', 'ww_rover_config', 'ww_char_custom_tags' 
    ];
    const backupData = {};
    backupKeys.forEach(key => { 
        const data = localStorage.getItem(key); 
        if (data && data !== '{}') {
            try { backupData[key] = JSON.parse(data); } catch (e) {}
        }
    });
    const jsonStr = JSON.stringify({ version: 'v4.9.3', type: 'full_backup', data: backupData });
    importCode.value = btoa(unescape(encodeURIComponent(jsonStr)));
    navigator.clipboard.writeText(importCode.value).catch(() => {});
    alert(t('✅ 全域備份代碼已產生並複製！'));
};

const confirmImport = () => {
    let code = importCode.value.trim().replace(/\s/g, '');
    if (!code) return alert(t('❌ 請輸入備份代碼。'));
    if(!confirm(t('這將會覆寫您目前所有的設定，確定執行嗎？'))) return;

    let parsed = null;
    try { parsed = JSON.parse(decodeURIComponent(atob(code))); } 
    catch (e1) {
        try { parsed = JSON.parse(decodeURIComponent(escape(atob(code)))); } 
        catch (e2) { 
            try { parsed = JSON.parse(atob(code)); } 
            catch (e3) {} 
        }
    }

    if (!parsed) return alert(t('❌ 解析失敗，請確認代碼是否為完整的備份字串。'));

    try {
        if (parsed.type === 'full_backup' && parsed.data) {
            Object.keys(parsed.data).forEach(key => { 
                localStorage.setItem(key, JSON.stringify(parsed.data[key])); 
            });
        } else if (parsed.customTeams || parsed.customStats || parsed.envSettings) {
            if (parsed.customTeams) localStorage.setItem('ww_custom_rotations_v2', JSON.stringify(parsed.customTeams));
            if (parsed.customStats) localStorage.setItem('ww_custom_stats', JSON.stringify(parsed.customStats));
            if (parsed.envSettings) localStorage.setItem('ww_env_global', JSON.stringify(parsed.envSettings));
            if (parsed.bossHPMap) localStorage.setItem('ww_boss_hp', JSON.stringify(parsed.bossHPMap));
            if (parsed.bossHp) localStorage.setItem('ww_boss_hp_history', JSON.stringify(parsed.bossHp));
            
            if (parsed.roster && Array.isArray(parsed.roster)) {
                localStorage.setItem('ww_roster', JSON.stringify(parsed.roster)); 
                localStorage.setItem('ww_owned_chars', JSON.stringify(parsed.roster));
            }
        } else { 
            throw new Error('未知的資料格式'); 
        }

        alert(t('✅ 數據已完整還原與升級！即將重新載入頁面。')); 
        window.location.reload();
    } catch(err) { 
        alert(t('❌ 寫入資料時發生錯誤：') + err.message); 
    }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div class="bg-[#121216] w-full max-w-4xl rounded-2xl border border-gray-700 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh] overflow-hidden">
        
        <div class="px-6 py-5 bg-gradient-to-r from-gray-900 to-transparent flex justify-between items-center border-b border-gray-800">
          <h3 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center gap-3 tracking-wide">
            <span class="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">⚙️</span> {{ t('數據總管與備份') }}
          </h3>
          <button @click="emit('close')" class="text-gray-500 hover:text-white hover:bg-gray-800 p-2 rounded-full transition-all flex items-center justify-center w-8 h-8">✖</button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          <div class="mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex flex-col gap-3 relative overflow-hidden group">
            <div class="flex justify-between items-center text-xs font-bold tracking-wider relative z-10">
              <span class="text-gray-400 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {{ t('本機存儲空間使用量') }}</span>
              <span class="text-gray-500"><span class="text-emerald-400 text-base font-mono">{{ storageUsage }}</span> / 5120 KB ({{ storagePct.toFixed(1) }}%)</span>
            </div>
            <div class="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden shadow-inner relative z-10">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000 ease-out" :style="`width: ${storagePct}%`"></div>
            </div>
            
            <div class="mt-2 text-right">
                <button @click="recoverLegacyData" class="text-xs text-amber-500 hover:text-amber-300 underline decoration-amber-500/30 underline-offset-4 transition-colors">
                    🛟 {{ t('遺失了以前的設定？點擊一鍵尋回並升級舊版資料') }}
                </button>
            </div>
          </div>

          <div class="flex items-end px-2 border-b-2 transition-colors duration-300 overflow-x-auto custom-scrollbar pb-1" :class="activeTheme.border">
            <button v-for="(cfg, key) in tabConfig" :key="key"
                    @click="currentTab = key"
                    class="relative px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 z-0 whitespace-nowrap"
                    :class="currentTab === key ? `${cfg.activeBg} ${cfg.colorText} border-t-2 border-l-2 border-r-2 ${cfg.border} z-10 translate-y-[2px] pb-[12px] shadow-[0_-4px_15px_rgba(0,0,0,0.3)]` : 'bg-gray-900 text-gray-500 hover:text-gray-300 border-t border-l border-r border-gray-800 mr-1 opacity-80 hover:opacity-100 hover:bg-gray-800'">
              <span>{{ cfg.icon }}</span> {{ t(cfg.label) }}
            </button>
          </div>

          <div class="bg-gray-800 border-x-2 border-b-2 rounded-b-xl rounded-tr-xl p-6 min-h-[350px] transition-colors duration-300 shadow-xl" :class="activeTheme.border">
            
            <!-- 自訂排軸管理 -->
            <div v-show="currentTab === 'custom'" class="animate-fade-in flex flex-col gap-3">
                <div v-if="localCustomRots.length === 0" class="text-center py-10 text-gray-500 italic">{{ t('您目前沒有儲存任何自訂排軸。') }}</div>
                <div v-for="rot in localCustomRots" :key="rot.id" class="bg-gray-900/80 border border-gray-700 p-3 rounded-lg flex justify-between items-center hover:border-amber-500/50 transition-colors">
                    <div class="flex flex-col">
                        <span class="text-amber-400 font-bold">{{ t(rot.rot) }}</span>
                        <span class="text-xs text-gray-400 mt-1">{{ t('陣容') }}: {{ t(rot.c1) }}{{ rot.c2 ? ' + '+t(rot.c2) : '' }}{{ rot.c3 ? ' + '+t(rot.c3) : '' }} | {{ t('秒傷') }}: {{ rot.dps }}w | {{ t('軸長') }}: {{ rot.duration }}s</span>
                    </div>
                    <button @click="deleteCustomRot(rot.id)" class="text-gray-500 hover:text-red-400 px-3 py-1 rounded bg-black/30 hover:bg-red-900/30 transition-colors text-sm">{{ t('刪除') }}</button>
                </div>
            </div>

            <!-- 記憶編隊插槽 -->
            <div v-show="currentTab === 'lineups'" class="animate-fade-in flex flex-col gap-3">
                <div v-for="(mem, idx) in localMemories" :key="idx" class="bg-gray-900/80 border border-gray-700 p-3 rounded-lg flex justify-between items-center" :class="mem.data ? 'hover:border-purple-500/50' : 'opacity-60'">
                    <div class="flex flex-col">
                        <span class="font-bold" :class="mem.data ? 'text-purple-300' : 'text-gray-600'">{{ idx + 1 }}. {{ mem.name }}</span>
                        <span class="text-[10px] mt-1" :class="mem.data ? 'text-purple-500/80' : 'text-gray-600'">{{ mem.timestamp || t('空插槽') }}</span>
                    </div>
                    <button v-if="mem.data" @click="clearMemorySlot(idx)" class="text-gray-500 hover:text-red-400 px-3 py-1 rounded bg-black/30 hover:bg-red-900/30 transition-colors text-sm">{{ t('清空') }}</button>
                </div>
            </div>

            <!-- 血量校正清單 -->
            <div v-show="currentTab === 'hp'" class="animate-fade-in flex flex-col gap-3">
                <div v-if="Object.keys(localHpMap).length === 0" class="text-center py-10 text-gray-500 italic">{{ t('目前沒有任何自訂的血量校正紀錄。') }}</div>
                <div v-for="(val, key) in localHpMap" :key="key" class="bg-gray-900/80 border border-gray-700 p-3 rounded-lg flex justify-between items-center hover:border-red-500/50 transition-colors">
                    <div class="flex items-center gap-4">
                        <span class="bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-1 rounded font-mono text-sm font-bold">{{ key }}</span>
                        <span class="text-gray-300 font-bold">{{ t('校正為') }} <span class="text-white">{{ val }}</span> {{ t('萬血量') }}</span>
                    </div>
                    <button @click="deleteHpRecord(key)" class="text-gray-500 hover:text-red-400 px-3 py-1 rounded bg-black/30 hover:bg-red-900/30 transition-colors text-sm">{{ t('刪除還原') }}</button>
                </div>
            </div>
            
            <!-- 全域備份與還原 -->
            <div v-show="currentTab === 'backup'" class="flex flex-col gap-4 animate-fade-in">
              <textarea v-model="importCode" rows="4" :placeholder="t('在此貼上全域備份代碼...')" class="w-full bg-[#0a0a0c] text-emerald-400 border border-gray-700 rounded-lg p-4 font-mono text-xs focus:outline-none focus:border-emerald-500"></textarea>
              <div class="flex gap-3">
                <button @click="generateExportCode" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors shadow-lg">📥 {{ t('產生備份碼並複製') }}</button>
                <button @click="confirmImport" class="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-bold transition-colors shadow-lg">📤 {{ t('還原覆蓋') }}</button>
              </div>
            </div>
            
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-800 bg-gray-900/50 flex justify-end">
          <button @click="factoryReset" class="text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30 px-6 py-2 rounded-lg font-bold text-sm transition-colors">⚠️ {{ t('徹底清除所有數據') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #164e63; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
</style>