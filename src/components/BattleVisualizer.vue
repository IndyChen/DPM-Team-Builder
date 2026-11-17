<!-- src/components/BattleVisualizer.vue -->
<script setup>
import { ref, computed, inject } from 'vue';

const props = defineProps({
  teams: Array,
  envConfig: Object,
  finalScoreMax: Number,
  finalScoreMin: Number,
  globalTraceMax: Array,
  globalTraceMin: Array
});

const t = inject('t') || ((str) => str);
const hoverData = ref({ 
  show: false, 
  x: 0, 
  cssX: 0, 
  time: '0.0', 
  scoreMax: 0, 
  scoreMin: 0, 
  diff: 0, 
  bossMax: '', 
  bossMin: '', 
  teamMax: '', 
  teamMin: '', 
  cycleMax: 1, 
  cycleMin: 1,
  phaseMax: '循環軸',
  phaseMin: '循環軸'
});
const zoomState = ref({ active: false, start: 0, end: 0, team: '' });

const maxTime = computed(() => {
    let t1 = props.globalTraceMax?.length ? props.globalTraceMax[props.globalTraceMax.length-1].globalTime : 120;
    let t2 = props.globalTraceMin?.length ? props.globalTraceMin[props.globalTraceMin.length-1].globalTime : 120;
    return Math.max(t1, t2, 1);
});
const maxScore = computed(() => Math.max(props.finalScoreMax || 1, props.finalScoreMin || 1, 1));

const activeStart = computed(() => zoomState.value.active ? zoomState.value.start : 0);
const activeEnd = computed(() => zoomState.value.active ? zoomState.value.end : maxTime.value);
const activeDuration = computed(() => Math.max(activeEnd.value - activeStart.value, 0.1));

const offsetMax = computed(() => zoomState.value.active ? (props.globalTraceMax.find(pt => pt.globalTime >= activeStart.value)?.currentScore || 0) : 0);
const offsetMin = computed(() => zoomState.value.active ? (props.globalTraceMin.find(pt => pt.globalTime >= activeStart.value)?.currentScore || 0) : 0);

const visibleTraceMax = computed(() => {
    if (!props.globalTraceMax || props.globalTraceMax.length === 0) return [];
    return props.globalTraceMax.filter(pt => pt.globalTime >= activeStart.value && pt.globalTime <= activeEnd.value);
});

const visibleTraceMin = computed(() => {
    if (!props.globalTraceMin || props.globalTraceMin.length === 0) return [];
    return props.globalTraceMin.filter(pt => pt.globalTime >= activeStart.value && pt.globalTime <= activeEnd.value);
});

const activeScoreBounds = computed(() => {
    if (!zoomState.value.active) return { min: 0, max: maxScore.value };
    
    let maxRelative = 0;
    const offMax = offsetMax.value;
    const offMin = offsetMin.value;
    
    visibleTraceMax.value.forEach(pt => {
        maxRelative = Math.max(maxRelative, pt.currentScore - offMax);
    });
    visibleTraceMin.value.forEach(pt => {
        maxRelative = Math.max(maxRelative, pt.currentScore - offMin);
    });

    let padding = maxRelative * 0.1 || 1000;
    return { min: 0, max: maxRelative + padding };
});

const getX = (time) => {
    let pct = (time - activeStart.value) / activeDuration.value;
    return Math.max(0, Math.min(1, pct)) * 100;
};

const getY = (score, offset = 0) => {
    let bounds = activeScoreBounds.value;
    let relativeScore = score - offset;
    let range = bounds.max - bounds.min || 1;
    let pct = (relativeScore - bounds.min) / range;
    pct = Math.max(0, Math.min(1, pct));
    return 100 - (pct * 100);
};

const buildAreaPath = (visibleTrace, offset) => {
    if (visibleTrace.length === 0) return '';
    let startX = getX(visibleTrace[0].globalTime);
    let d = `M ${startX},100 `;
    visibleTrace.forEach(pt => { d += `L ${getX(pt.globalTime)},${getY(pt.currentScore, offset)} `; });
    let endX = getX(visibleTrace[visibleTrace.length - 1].globalTime);
    d += `L ${endX},100 Z`;
    return d;
};

const buildLinePath = (visibleTrace, offset) => {
    if (visibleTrace.length === 0) return '';
    let d = '';
    visibleTrace.forEach((pt, idx) => {
        let px = getX(pt.globalTime), py = getY(pt.currentScore, offset);
        d += idx === 0 ? `M ${px},${py} ` : `L ${px},${py} `;
    });
    return d;
};

const areaMax = computed(() => buildAreaPath(visibleTraceMax.value, offsetMax.value));
const areaMin = computed(() => buildAreaPath(visibleTraceMin.value, offsetMin.value));
const lineMax = computed(() => buildLinePath(visibleTraceMax.value, offsetMax.value));
const lineMin = computed(() => buildLinePath(visibleTraceMin.value, offsetMin.value));

const xAxisTicks = computed(() => {
    let dur = activeDuration.value; 
    let step = 10;
    if (dur > 600) step = 120;       
    else if (dur > 300) step = 60;   
    else if (dur > 120) step = 30;   
    else if (dur > 60) step = 10;    
    else if (dur > 30) step = 5;     
    else step = 2;                   

    let ticks = []; 
    let start = Math.ceil(activeStart.value / step) * step;
    for (let tVal = start; tVal <= activeEnd.value; tVal += step) { 
        const displayTime = zoomState.value.active ? Math.round((tVal - activeStart.value) * 10) / 10 : tVal;
        ticks.push({ time: tVal, label: displayTime, x: getX(tVal) }); 
    }
    return ticks;
});

const yAxisTicks = computed(() => {
    let b = activeScoreBounds.value; let r = b.max - b.min;
    let prefix = zoomState.value.active ? '+' : '';
    return [
        { label: prefix + Math.round(b.max).toLocaleString(), y: 0 },
        { label: prefix + Math.round(b.min + r * 0.75).toLocaleString(), y: 25 },
        { label: prefix + Math.round(b.min + r * 0.5).toLocaleString(), y: 50 },
        { label: prefix + Math.round(b.min + r * 0.25).toLocaleString(), y: 75 },
        { label: prefix + Math.round(b.min).toLocaleString(), y: 100 }
    ];
});

const fixedScoreLines = [12000, 16000, 21000, 37000, 58000];

const visibleScoreThresholds = computed(() => {
    let bounds = activeScoreBounds.value;
    let lines = [];
    fixedScoreLines.forEach(score => {
        let relativeScore = score - offsetMin.value;
        if (relativeScore >= bounds.min && relativeScore <= bounds.max) {
            lines.push({ score: score, relativeScore: Math.round(relativeScore), yPct: getY(score, offsetMin.value) });
        }
    });
    return lines;
});

const teamSegments = computed(() => {
    if (!props.globalTraceMin || props.globalTraceMin.length === 0) return [];
    let segments = [];
    let currentTeam = props.globalTraceMin[0].teamC1;
    let currentStartTime = props.globalTraceMin[0].teamStartTime ?? 0;
    let startTime = 0;
    props.globalTraceMin.forEach((pt) => {
        const ptStart = pt.teamStartTime ?? 0;
        if (pt.teamC1 !== currentTeam || ptStart !== currentStartTime) {
            let endTime = ptStart > startTime ? ptStart : pt.globalTime;
            if (endTime > startTime) { 
                segments.push({ team: currentTeam, start: startTime, end: endTime, duration: endTime - startTime, widthPct: ((endTime - startTime) / maxTime.value) * 100 }); 
            }
            currentTeam = pt.teamC1;
            currentStartTime = ptStart;
            startTime = ptStart;
        }
    });
    const lastPt = props.globalTraceMin[props.globalTraceMin.length - 1];
    if (lastPt && lastPt.globalTime > startTime) {
        segments.push({ team: currentTeam, start: startTime, end: lastPt.globalTime, duration: lastPt.globalTime - startTime, widthPct: ((lastPt.globalTime - startTime) / maxTime.value) * 100 });
    }
    return segments;
});

const getTeamColor = (name) => {
    if (!name || name === '等待' || name === 'Wait') return '#4b5563';
    const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
    let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const handleZoom = (seg) => { 
    if (seg.team === '等待' || seg.team === 'Wait') return; 
    zoomState.value = { active: true, start: seg.start, end: seg.end, team: seg.team }; 
    hoverData.value.show = false; 
};
const resetZoom = () => { zoomState.value = { active: false, start: 0, end: 0, team: '' }; };

const findTracePoint = (tr, targetTime) => {
    if (!tr || !tr.length) return { currentScore: 0, currentBoss: '-', teamC1: '-', cycle: 1, phaseName: '循環軸' };
    let low = 0, high = tr.length - 1;
    let res = tr[0];
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        if (tr[mid].globalTime <= targetTime) {
            res = tr[mid];
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return res;
};

let mouseMoveRaf = null;
const handleMouseMove = (e) => {
    if (mouseMoveRaf) return;
    const clientX = e.clientX;
    const currentTarget = e.currentTarget;

    mouseMoveRaf = requestAnimationFrame(() => {
        mouseMoveRaf = null;
        if (!currentTarget) return;
        const rect = currentTarget.getBoundingClientRect();
        let px = (clientX - rect.left) / rect.width; 
        px = Math.max(0, Math.min(1, px));
        let targetTime = activeStart.value + (px * activeDuration.value);
        
        let sMax = findTracePoint(props.globalTraceMax, targetTime);
        let sMin = findTracePoint(props.globalTraceMin, targetTime);
        
        hoverData.value = {
            show: true, 
            x: px * 100, 
            cssX: Math.min(clientX - rect.left + 15, rect.width - 240),
            time: targetTime.toFixed(1), 
            teamTime: zoomState.value.active ? Math.max(0, targetTime - activeStart.value).toFixed(1) : null,
            scoreMax: Math.round(sMax.currentScore), 
            scoreMin: Math.round(sMin.currentScore),
            diff: Math.round(sMax.currentScore - sMin.currentScore), 
            bossMax: sMax.currentBoss, 
            bossMin: sMin.currentBoss,
            teamMax: sMax.teamC1, 
            teamMin: sMin.teamC1, 
            cycleMax: sMax.cycle || 1, 
            cycleMin: sMin.cycle || 1,
            phaseMax: sMax.phaseName || '循環軸',
            phaseMin: sMin.phaseName || '循環軸'
        };
    });
};
</script>

<template>
   <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-lg flex flex-col gap-2">
       
       <div class="flex justify-between items-center px-1 pb-1 border-b border-gray-800">
           <h3 class="text-emerald-400 font-bold flex items-center gap-2">
               <span>📈</span> {{ zoomState.active ? `${t('實戰局部檢視：')}${t(zoomState.team)} (${zoomState.start.toFixed(1)}s - ${zoomState.end.toFixed(1)}s)` : t('實戰全波次推演沙盤') }}
           </h3>
           <button @click="resetZoom" 
                   class="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all"
                   :class="zoomState.active ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'bg-gray-800 text-gray-400 hover:text-gray-200'">
               🌐 {{ t('全域展示視角') }}
           </button>
       </div>

       <div class="relative w-full h-80 bg-[#0a0a0c] rounded-lg border border-gray-700 overflow-hidden cursor-crosshair flex flex-col mt-1"
            @mousemove="handleMouseMove" @mouseleave="hoverData.show = false">
           
           <div class="absolute inset-0 opacity-[0.03]" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 20px 20px;"></div>

           <div class="absolute inset-0 pointer-events-none z-0">
               <div v-for="tick in xAxisTicks" :key="'gridX'+tick.time"
                    class="absolute top-0 bottom-0 border-l border-gray-700/50 flex flex-col justify-end"
                    :style="{ left: tick.x + '%' }">
                   <span class="text-[9px] text-gray-400 ml-1 mb-0.5 font-mono bg-[#0a0a0c]/70 px-0.5 rounded leading-none">{{ tick.label }}s</span>
               </div>
           </div>

           <div class="absolute inset-0 pointer-events-none z-0" style="height: 100%;">
               <div v-for="tick in yAxisTicks" :key="'gridY'+tick.label"
                    class="absolute w-full border-t border-gray-700/30 flex justify-end"
                    :style="{ top: tick.y + '%' }">
                   <span class="text-[9px] text-gray-500 font-mono bg-[#0a0a0c]/80 px-1 mr-1 z-10"
                         :style="{ marginTop: tick.y === 100 ? '-12px' : '-6px' }">
                       {{ tick.label }}
                   </span>
               </div>
           </div>

           <div class="absolute inset-0 pointer-events-none z-0" style="height: 100%;">
               <div v-for="(marker, i) in visibleScoreThresholds" :key="'scoreH'+i"
                    class="absolute w-full border-t-2 border-dashed border-rose-500/50 flex justify-start items-start"
                    :style="{ top: marker.yPct + '%' }">
                   <span class="text-[10px] text-rose-300 font-bold bg-[#0a0a0c]/90 px-2 py-0.5 rounded-br-lg border-b border-r border-rose-500/50 shadow-sm z-10 flex gap-2">
                       <span>{{ marker.score.toLocaleString() }} {{ t('獎勵線') }}</span>
                       <span v-if="zoomState.active" class="text-rose-400/80 font-mono text-[9px]">(+{{ marker.relativeScore.toLocaleString() }})</span>
                   </span>
               </div>
           </div>
           
           <svg preserveAspectRatio="none" viewBox="0 0 100 100" class="absolute inset-0 w-full h-full pb-0 pt-0 z-10 transition-all duration-300">
               <defs>
                   <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24" stop-opacity="0.35"/><stop offset="100%" stop-color="#fbbf24" stop-opacity="0.0"/></linearGradient>
                   <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.45"/><stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/></linearGradient>
               </defs>
               <path :d="areaMax" fill="url(#gradMax)" class="transition-all duration-300" />
               <path :d="lineMax" fill="none" stroke="#fbbf24" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-dasharray="3,3" class="transition-all duration-300" />
               <path :d="areaMin" fill="url(#gradMin)" class="transition-all duration-300" />
               <path :d="lineMin" fill="none" stroke="#10b981" stroke-width="2.5" vector-effect="non-scaling-stroke" class="transition-all duration-300" />
           </svg>

           <div v-if="hoverData.show" class="absolute top-0 bottom-0 border-l border-purple-500/80 border-dashed pointer-events-none z-20" :style="{ left: hoverData.x + '%' }"></div>

           <!-- 浮動資訊面板 -->
           <div v-show="hoverData.show" class="absolute top-7 pointer-events-none bg-[#121216]/95 backdrop-blur-md border border-purple-500 rounded-lg p-3 shadow-[0_10px_30px_rgba(0,0,0,0.9)] z-30 min-w-[220px]">
               <div class="text-gray-400 text-xs font-bold border-b border-gray-700 pb-1.5 mb-2 flex justify-between items-center">
                   <span>⏱️ {{ t('當前時間') }}: <span class="text-white font-mono">{{ (zoomState.active && hoverData.teamTime !== null) ? `${hoverData.teamTime}s (全域 ${hoverData.time}s)` : `${hoverData.time}s` }}</span></span>
                   <span v-if="zoomState.active" class="bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-500/40">
                       {{ t('局部放大') }}
                   </span>
               </div>
               
               <!-- 極限估算 -->
               <div class="flex flex-col mb-2 bg-amber-900/10 p-2 rounded border border-amber-900/30">
                   <div class="flex justify-between items-center mb-1">
                       <span class="text-amber-400 text-[11px] font-bold">📈 {{ t('極限') }} | {{ t(hoverData.teamMax) }}</span>
                       <span class="text-amber-400 font-mono font-bold">{{ hoverData.scoreMax.toLocaleString() }}</span>
                   </div>
                   <div class="text-amber-500 text-[10px] flex justify-between tracking-wide font-medium">
                       <span class="bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 text-amber-300 font-bold">
                           {{ hoverData.phaseMax }} · 第 {{ hoverData.cycleMax }} 循環
                       </span>
                       <span v-if="zoomState.active" class="text-amber-300 font-mono font-bold self-center">
                           +{{ Math.round(hoverData.scoreMax - offsetMax).toLocaleString() }}
                       </span>
                       <span class="self-center">{{ t('進度') }}: {{ hoverData.bossMax }}</span>
                   </div>
               </div>
               
               <!-- 保底估算 -->
               <div class="flex flex-col mb-1 bg-emerald-900/10 p-2 rounded border border-emerald-900/30">
                   <div class="flex justify-between items-center mb-1">
                       <span class="text-emerald-400 text-[11px] font-bold">🛡️ {{ t('保底') }} | {{ t(hoverData.teamMin) }}</span>
                       <span class="text-emerald-400 font-mono font-bold">{{ hoverData.scoreMin.toLocaleString() }}</span>
                   </div>
                   <div class="text-emerald-500 text-[10px] flex justify-between tracking-wide font-medium">
                       <span class="bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 text-emerald-300 font-bold">
                           {{ hoverData.phaseMin }} · 第 {{ hoverData.cycleMin }} 循環
                       </span>
                       <span v-if="zoomState.active" class="text-emerald-300 font-mono font-bold self-center">
                           +{{ Math.round(hoverData.scoreMin - offsetMin).toLocaleString() }}
                       </span>
                       <span class="self-center">{{ t('進度') }}: {{ hoverData.bossMin }}</span>
                   </div>
               </div>
           </div>
       </div>

       <div class="text-[11px] text-gray-400 mt-1 mb-0.5 flex items-center gap-1.5">
           <span class="text-yellow-500">💡</span> {{ t('點擊下方隊伍區塊可放大檢視該隊實戰區間 (動態 Y 軸比例)：') }}
       </div>

       <div class="w-full h-14 bg-gray-950 rounded-lg border border-gray-700 flex overflow-hidden shadow-inner p-1 gap-1 mt-1">
           <div v-for="(seg, i) in teamSegments" :key="'nav'+i"
                @click="handleZoom(seg)"
                class="h-full rounded-md flex flex-col items-center justify-center relative group transition-all duration-200"
                :class="[
                    (seg.team !== '等待' && seg.team !== 'Wait') ? 'cursor-pointer hover:brightness-125' : '',
                    zoomState.active && zoomState.team === seg.team ? 'ring-2 ring-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10' : '',
                    zoomState.active && zoomState.team !== seg.team ? 'opacity-40 grayscale-[50%]' : 'opacity-100'
                ]"
                :style="{ width: seg.widthPct + '%', backgroundColor: getTeamColor(seg.team) + '30' }">
               <div class="absolute top-0 left-0 w-full h-1" :style="{ backgroundColor: getTeamColor(seg.team) }"></div>
               <span class="text-sm font-bold text-white truncate px-1 mt-1">{{ t(seg.team) }}</span>
               <span class="text-[10px] text-gray-400 flex items-center gap-1 font-mono">⏱️ {{ seg.duration.toFixed(1) }}s</span>
           </div>
       </div>
   </div>
</template>