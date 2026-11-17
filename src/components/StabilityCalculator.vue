<script setup>
import { ref, computed, inject } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['update:show', 'apply-stability']);
const t = inject('t') || ((str) => str);

// 狀態管理
const records = ref([]);
const inputVal = ref('');
const targetTime = ref(25.0); // 預設理論排軸時間 (秒)

// 新增紀錄
const addRecord = () => {
    const val = parseFloat(inputVal.value);
    if (!isNaN(val) && val > 0) {
        records.value.push(val);
        inputVal.value = '';
    }
};

// 移除紀錄
const removeRecord = (index) => {
    records.value.splice(index, 1);
};

// 統計數據計算
const stats = computed(() => {
    if (records.value.length === 0) return null;
    
    const sum = records.value.reduce((a, b) => a + b, 0);
    const avg = sum / records.value.length;
    const min = Math.min(...records.value);
    const max = Math.max(...records.value);
    
    // 計算母體標準差 (Standard Deviation)
    const variance = records.value.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / records.value.length;
    const stdDev = Math.sqrt(variance);
    
    return { avg, min, max, stdDev };
});

// 最終操作達成率計算 (%)
// 公式：(理論時間 / 實際平均時間) * 100
const finalStability = computed(() => {
    if (!stats.value || !targetTime.value || targetTime.value <= 0) return 0;
    let pct = (targetTime.value / stats.value.avg) * 100;
    return Math.min(100, Math.max(0, pct)); // 鎖定在 0~100 之間
});

const handleApply = () => {
    emit('apply-stability', Math.round(finalStability.value));
    emit('update:show', false);
};

const close = () => {
    emit('update:show', false);
};
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div class="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                <h2 class="text-lg font-bold text-white flex items-center gap-2">
                    <span>⏱️</span> {{ t('實戰碼表與穩定度分析儀') }}
                </h2>
                <button @click="close" class="text-gray-400 hover:text-white transition-colors">
                    ✕
                </button>
            </div>

            <div class="p-5 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
                
                <div class="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-sm text-blue-200">
                    {{ t('輸入您多次實測該排軸的「實際耗時」，系統將自動為您評估操作誤差並換算為綜合穩定度 (達成率)。') }}
                </div>

                <div class="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                    <span class="text-sm font-bold text-gray-300">📐 {{ t('理論極限耗時 (秒)：') }}</span>
                    <input type="number" v-model.number="targetTime" step="0.1" min="1"
                           class="w-24 bg-gray-950 border border-gray-600 rounded px-2 py-1 text-emerald-400 font-mono text-center font-bold focus:outline-none focus:border-emerald-500">
                </div>

                <div class="flex gap-2">
                    <input type="number" v-model="inputVal" @keyup.enter="addRecord" :placeholder="t('輸入單次實測秒數 (例: 26.5)')" step="0.1"
                           class="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono">
                    <button @click="addRecord" 
                            class="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap">
                        + {{ t('記錄') }}
                    </button>
                </div>

                <div v-if="records.length > 0" class="flex flex-wrap gap-2 p-3 bg-gray-950 rounded-lg border border-gray-800 min-h-[60px] items-start">
                    <div v-for="(rec, idx) in records" :key="idx" 
                         class="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded text-sm font-mono flex items-center gap-1 group">
                        {{ rec.toFixed(1) }}s
                        <button @click="removeRecord(idx)" class="text-gray-500 hover:text-rose-400 group-hover:opacity-100 opacity-50 ml-1">✕</button>
                    </div>
                </div>
                <div v-else class="text-center text-gray-600 text-sm py-4 border border-dashed border-gray-700 rounded-lg">
                    {{ t('尚無數據，請在上方輸入實測秒數。') }}
                </div>

                <div v-if="stats" class="grid grid-cols-2 gap-3">
                    <div class="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col items-center">
                        <span class="text-xs text-gray-400 mb-1">{{ t('平均耗時') }}</span>
                        <span class="text-xl font-bold text-amber-400 font-mono">{{ stats.avg.toFixed(2) }}s</span>
                    </div>
                    <div class="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col items-center">
                        <span class="text-xs text-gray-400 mb-1">{{ t('標準差 (誤差區間)') }}</span>
                        <span class="text-xl font-bold text-rose-400 font-mono">±{{ stats.stdDev.toFixed(2) }}s</span>
                    </div>
                    <div class="col-span-2 bg-[#0a0a0c] p-4 rounded-lg border border-emerald-900/50 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-gray-300">📊 {{ t('換算操作達成率') }}</span>
                            <span class="text-[10px] text-gray-500">{{ t('理論') }} {{ targetTime }}s ÷ {{ t('實際') }} {{ stats.avg.toFixed(1) }}s</span>
                        </div>
                        <span class="text-3xl font-black text-emerald-400 font-mono drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                            {{ finalStability.toFixed(1) }}%
                        </span>
                    </div>
                </div>
            </div>

            <div class="bg-gray-800 px-4 py-3 border-t border-gray-700 flex justify-end gap-3">
                <button @click="records = []" v-if="records.length > 0" class="text-gray-400 hover:text-gray-200 text-sm mr-auto">
                    {{ t('清空數據') }}
                </button>
                <button @click="close" class="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors font-bold text-sm">
                    {{ t('取消') }}
                </button>
                <button @click="handleApply" :disabled="!stats"
                        class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg transition-colors font-bold shadow-lg">
                    {{ t('套用此穩定度') }}
                </button>
            </div>
        </div>
    </div>
</template>