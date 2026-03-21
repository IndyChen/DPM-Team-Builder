# 🌊 鳴潮矩陣編隊工具 (Wuthering Waves Doubled Pawns Matrix Team Builder)

![Version](https://img.shields.io/badge/version-v4.8.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Web_Browser-success.svg)
![Tech Stack](https://img.shields.io/badge/tech-HTML_|_CSS_|_JS-orange.svg)
![License](https://img.shields.io/badge/license-CC_BY--NC--SA_4.0-green.svg)

專為《鳴潮》(Wuthering Waves)「矩陣疊兵」模式設計的純前端開源編隊與 DPS 計算輔助工具。
提供全角色的配隊數據查閱，內建 **「雙引擎編隊最佳化」**、**「120秒接力推演引擎」** 與 **「魔法資料解析器」**，協助玩家在有限的角色池與疲勞值內，計算出符合自身手感的合適通關陣容。

🌐 **[點此直接使用工具 (Live Demo)](https://indychen.github.io/DPM-Team-Builder/)**

---

聲明：本專案在 v4.6.3 後使用了 Google Analytics 工具追蹤網頁使用量，但不會有增設廣告之動作。

---

## ✨ 核心特色功能 (Key Features)

### 🤖 雙引擎編隊最佳化 (DP + Beam Search Optimization)
系統會根據玩家勾選的角色與候選隊伍數量，自動選擇「狀態壓縮 DP」或「束式搜索 (Beam Search)」演算法。在考量疲勞衝突率的前提下，計算出整體得分最高的不衝突陣容，並提供運算時間預估與搜尋深度設定。

### 🌌 120 秒實戰接力推演 (Matrix Relay Simulation)
支援動態軸長與首輪暖機特化 (First Duration)。輸入全局抗性設定、專屬增益標籤、王血量與轉場耗時，系統會模擬接力賽，並以冪函數曲線計算殘血收尾時間，顯示各隊打完 120 秒的精確進度波次與預估得分。

### 🔄 實戰反推與數據代數校正 (Reverse Engineering & Auto-Calibration)
輸入結算得分後，系統將扣除全局抗性與轉場時間，推算「基礎 DPS」，並與理論區間比對進行動態校正。
環境設定支援「實測傷害代數反解」，使用者輸入實測基礎傷害與衰減傷害後，系統將自動反算真實減傷係數。

### 🪄 內嵌式魔法解析器 (Magic Parser)
支援直接貼上動作排軸文字數據，系統將自動提取出傷時間與傷害，計算最大爆發佔比，並擬合出專屬的 K 值 (非線性曲線指數) 與預設 DPS，無縫寫入自訂編隊。

### 🎲 蒙地卡羅模擬 (Monte Carlo Simulation)
內建 10,000 次亂數抽樣功能。使用者可為特定角色設定核心暴擊率與未暴擊損失，系統將精算出火力下限期望值。

### 💾 雲端備份與多組記憶 (Local Storage & Backup)
支援自訂命名並儲存最多 10 套常用的深塔編隊陣容，可隨時無縫讀取切換。搭配「數據總管」功能，可產生/匯入備份代碼，實現跨裝置資料同步。

### 🎯 實戰手法折損與穩定性計算 (Combat Stability System)
系統依據排軸難度設定失誤懲罰權重。結合內建的統計學檢定工具，使用者可輸入打樁的「多次實測耗時」，由系統計算出標準差 (σ) 與綜合穩定性評分 (%)，並套用至全域 DPS 折損計算。

### 🖱️ 拖曳互動與繁簡切換 (Drag & Drop & i18n)
沙盤表格支援滑鼠拖曳排序，提供自由切換的顯示數量上限 (3~16隊)。內建字典映射技術，支援繁體/簡體中文無縫切換。

---

## 🚀 快速上手 (How to Use)

1. **勾選擁有角色**：在頂部選單勾選目前擁有的角色。
2. **配置實戰排軸**：
   * 在清單中勾選預計操作的排軸，或利用「新增自訂」的魔法解析器匯入新數據。
   * 利用「穩定性計算器」或「折損拉桿」設定操作達成率。
3. **矩陣推演與編隊**：
   * 點擊「🔥 一鍵極限編制」，選擇演算法由系統計算最佳陣容。
   * 填入「實戰得分」，點擊「🔄 無損洗牌反推」進行數據校正與重排。
   * 將編排完成的隊伍透過「💾 記憶當前實戰」儲存。
4. **匯出分享**：點擊「📷 截圖分享」，將編排的矩陣圖匯出成圖片。

---

## 🐛 報錯與意見回饋 (Feedback & Issues)
若發現工具錯誤，或欲提供新的 DPS 數據與隊伍，歡迎透過 [GitHub Issues](https://github.com/IndyChen/DPM-Team-Builder/issues) 提交。系統內建自動報錯擷取功能，可直接發送 Email 回報。

---

## 📊 數據來源與鳴謝 (Credits)
* **數據庫設計與邏輯架構**：由 AI 輔助設計與演算優化。
* **數據提供**：QuichilOvO、南邊
* **整理與維護**：Kolton

---

## 📜 授權聲明 (License)

本專案採用 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-TW)** (姓名標示-非商業性-相同方式分享) 授權條款。

- **免費開源**：歡迎自由 Fork、修改與分享。
- **非商業利用**：禁止將本專案用於任何形式的營利行為（包含販售、植入廣告或放入付費牆）。
- **自願性贊助**：在遵守非商業條款的前提下，衍生專案的貢獻者可放置個人的自願性贊助連結。
