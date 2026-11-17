// src/core/i18n.js
import { ref } from 'vue';
import { zhCN, ja, en } from '../locales/dictionary.js';

// 🌟 1. 全域語系狀態 (預設繁中)
export const currentLang = ref(localStorage.getItem('ww_lang') || 'zh-TW');

// 🌟 2. 支援的語系清單 (供 UI 渲染按鈕文字使用)
export const langs = [
  { code: 'zh-TW', label: '繁' },
  { code: 'zh-CN', label: '简' },
  { code: 'ja', label: '日' },
  { code: 'en', label: 'EN' }
];

// 將從 dictionary 引入的各國字典綁定到對應的 key
const messages = {
  'zh-CN': zhCN,
  'ja': ja,
  'en': en
};

// 🌟 3. 初始化設定
export const initI18n = () => {
  const savedLang = localStorage.getItem('ww_lang');
  if (savedLang && langs.some(l => l.code === savedLang)) {
    currentLang.value = savedLang;
  }
};

// 🌟 4. 輪流切換語言功能 (繁 -> 简 -> 日 -> EN -> 繁)
export const cycleLang = () => {
  const currentIndex = langs.findIndex(l => l.code === currentLang.value);
  const nextIndex = (currentIndex + 1) % langs.length;
  currentLang.value = langs[nextIndex].code;
  localStorage.setItem('ww_lang', currentLang.value);
  // 切換語言後重整頁面，確保所有元件(包含選單與 placeholder)徹底重新渲染
  window.location.reload(); 
};

// 🌟 5. 核心翻譯函式
export const t = (key) => {
  if (!key) return '';
  // 繁中為基準，不需翻譯直接回傳
  if (currentLang.value === 'zh-TW') return key; 
  
  const dict = messages[currentLang.value];
  // 若該語系有對應的翻譯則回傳，否則 fallback 顯示原本的繁中
  return dict && dict[key] ? dict[key] : key; 
};