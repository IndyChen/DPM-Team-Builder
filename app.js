// --- 1. 介面與高精度逐詞翻譯引擎 ---
function switchTab(pageId, btnElement) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    btnElement.classList.add('active');
}

// 採用你建議的「逐詞替換」方法！建立精準的詞彙對應表，徹底解決錯位問題。
const translationList = [
    ["鳴潮矩陣編隊工具", "鸣潮矩阵编队工具"],
    ["數據庫設計與邏輯", "数据库设计与逻辑"],
    ["報錯與意見回饋", "报错与意见反馈"],
    ["第一步：角色與排軸設定", "第一步：角色与排轴设定"],
    ["第二步：矩陣編隊與實戰推演", "第二步：矩阵编队与实战推演"],
    ["歡迎使用！點此查看「頁面操作指南」與「未來展望」", "欢迎使用！点此查看「页面操作指南」与「未来展望」"],
    ["當前頁面：角色與排軸設定", "当前页面：角色与排轴设定"],
    ["選擇角色：請在下方勾選您目前擁有的角色，系統會自動計算您可用的組隊次數。", "选择角色：请在下方勾选您目前拥有的角色，系统会自动计算您可用的组队次数。"],
    ["篩選排軸難度：根據您的手法，勾選您有把握的排軸難度", "筛选排轴难度：根据您的手法，勾选您有把握的排轴难度"],
    ["系統只會顯示您可以組建的隊伍。", "系统只会显示您可以组建的队伍。"],
    ["微調穩定性：若您的手法容易失誤，可以透過拉桿微調「全局」或「各難度」的達成率，系統將自動折算您的實戰傷害下限。", "微调稳定性：若您的手法容易失误，可以透过拉杆微调「全局」或「各难度」的达成率，系统将自动折算您的实战伤害下限。"],
    ["下一頁預告：矩陣編隊與實戰推演", "下一页预告：矩阵编队与实战推演"],
    ["完成設定後，點擊右下角按鈕前往下一頁。", "完成设定后，点击右下角按钮前往下一页。"],
    ["您可以在該頁面進行「一鍵自動編隊」，或是手動排兵布陣。", "您可以在该页面进行「一键自动编队」，或是手动排兵布阵。"],
    ["該頁面亦提供硬核的「實戰分數反推與無損洗牌重排」功能，幫助您找出最優的出戰順序。", "该页面亦提供硬核的「实战分数反推与无损洗牌重排」功能，帮助您找出最优的出战顺序。"],
    ["開發者備註 & 下期預告 (v4.8 展望)：", "开发者备注 & 下期预告 (v4.8 展望)："],
    ["因目前系統尚缺乏精確的「動態傷害曲線」數據，當前版本的一鍵編制與實戰重排，是採用相對傻瓜式的「平滑均傷」演算法。", "因目前系统尚缺乏精确的「动态伤害曲线」数据，当前版本的一键编制与实战重排，是采用相对傻瓜式的「平滑均伤」演算法。"],
    ["我們深知實戰中「爆發前置」與「平滑出傷」在殘血收尾時的巨大差異。因此，我們將在下個大版本 (v4.8) 嘗試實裝：", "我们深知实战中「爆发前置」与「平滑出伤」在残血收尾时的巨大差异。因此，我们将在下个大版本 (v4.8) 尝试实装："],
    ["1. 【自訂各軸傷害折線】：允許您自訂排軸的傷害模型（例如：按照每秒產生多少百分比的「累加曲線」去拉動，或是設定「第幾秒會產生幾 % 的總傷」的爆發模型）。", "1. 【自订各轴伤害折线】：允许您自订排轴的伤害模型（例如：按照每秒产生多少百分比的「累加曲线」去拉动，或是设定「第几秒会产生几 % 的总伤」的爆发模型）。"],
    ["2. 【自訂循環次數】：讓傷害與耗時計算以完整的 Rotation 循環為單位。", "2. 【自订循环次数】：让伤害与耗时计算以完整的 Rotation 循环为单位。"],
    ["這將讓編隊與殘血推演的精準度產生質的飛躍，敬請期待！", "这会让编队与残血推演的精准度产生质的飞跃，敬请期待！"],
    ["點此查看版本更新說明", "点此查看版本更新说明"],
    ["【v4.7.4 無損洗牌與防呆升級版】", "【v4.7.4 无损洗牌与防呆升级版】"],
    ["無損實戰洗牌：完全記憶表單隊員，推算真實 DPS 後無損重排，絕不覆寫或清空原隊伍！", "无损实战洗牌：完全记忆表单队员，推算真实 DPS 后无损重排，绝不覆写或清空原队伍！"],
    ["防呆選單與血量鎖定：終點王改為下拉選單，殘血輸入強制鎖定 0.01% ~ 100% 防呆修正。", "防呆选单与血量锁定：终点王改为下拉选单，残血输入强制锁定 0.01% ~ 100% 防呆修正。"],
    ["一鍵重設預設 DPS：新增按鈕可快速清除分數覆寫，復原排軸的系統預設值。", "一键重设预设 DPS：新增按钮可快速清除分数覆写，复原排轴的系统预设值。"],
    ["雙檔分離與分頁 UI：將畫面與邏輯徹底分離，大幅提升效能與介面清爽度。", "双档分离与分页 UI：将画面与逻辑彻底分离，大幅提升效能与介面清爽度。"],
    ["【v4.7.0 ~ 4.7.3 近期版本更新概略】", "【v4.7.0 ~ 4.7.3 近期版本更新概略】"],
    ["(4.7.3) 實裝實戰反推最佳化、序列王血量代數反解引擎與大數據貢獻問卷。", "(4.7.3) 实装实战反推最佳化、序列王血量代数反解引擎与大数据贡献问卷。"],
    ["(4.7.2) 實裝「動態壓軸」一鍵編制邏輯。", "(4.7.2) 实装「动态压轴」一键编制逻辑。"],
    ["(4.7.1) 新增「內建軸穩定性計算器」，支援實測耗時統計分析。", "(4.7.1) 新增「内建轴稳定性计算器」，支援实测耗时统计分析。"],
    ["(4.7.0) 實裝「手法折損全局與微調拉桿」及無預設 DPS 自訂覆寫功能。", "(4.7.0) 实装「手法折损全局与微调拉杆」及无预设 DPS 自订覆写功能。"],
    ["如果您只是想知道手邊的角色能組出什麼最高分的隊伍，請直接點擊表格上方的", "如果您只是想知道手边的角色能组出什么最高分的队伍，请直接点击表格上方的"],
    ["系統會自動幫您配好隊伍。", "系统会自动帮您配好队伍。"],
    ["【第二步：實戰反推與無損洗牌 (進階功能)】", "【第二步：实战反推与无损洗牌 (进阶功能)】"],
    ["請先按照您在遊戲中實際出戰的順序，將隊伍排在表格上。", "请先按照您在游戏中实际出战的顺序，将队伍排在表格上。"],
    ["在表格內的「實戰得分」欄位，填入該隊打完結算的總分。", "在表格内的「实战得分」栏位，填入该队打完结算的总分。"],
    ["勾選該隊伍遭遇抗性的是第幾隻王", "勾选该队伍遭遇抗性的是第几只王"],
    ["若該隊伍沒把王打死，請在「🎯終:」下拉選單選擇終點王", "若该队伍没把王打死，请在「🎯终:」下拉选单选择终点王"],
    ["並在「🩸剩:」輸入剩餘血量 %。系統會自動將其加入代數校正池。", "并在「🩸剩:」输入剩余血量 %。系统会自动将其加入代数校正池。"],
    ["系統會精準扣除轉場動畫延遲與抗性干擾，推算真實", "系统会精准扣除转场动画延迟与抗性干扰，推算真实"],
    ["最重要的是：系統會「完全記憶」您表單上的隊伍成員，並依據算出的真實 DPS，為您無損地重新排序最佳出戰順序！", "最重要的是：系统会「完全记忆」您表单上的队伍成员，并依据算出的真实 DPS，为您无损地重新排序最佳出战顺序！"],
    ["若想還原實戰反推造成的分數覆寫，可點擊該隊伍選單下方的", "若想还原实战反推造成的分数覆写，可点击该队伍选单下方的"],
    ["將您本次排出的矩陣波次與分數傳送給開發者，協助校正王血量公式！", "将您本次排出的矩阵波次与分数传送给开发者，协助校正王血量公式！"],
    ["當您填寫表格中的「終點王殘血反解」與分數後，系統會統計並代數反解出真實血量。若單隻王收集滿 3 筆樣本，且與預設血量偏差 > 3% (置信度 < 97%)，將會於下方提示供您一鍵校正。", "当您填写表格中的「终点王残血反解」与分数后，系统会统计并代数反解出真实血量。若单只王收集满 3 笔样本，且与预设血量偏差 > 3% (置信度 < 97%)，将会于下方提示供您一键校正。"],
    ["提示：在表格內填寫【實戰得分】並點擊反推，系統會自動修改該隊伍的「自訂 DPS」。若要還原，請點擊該隊伍下方的「🔄 重設預設 DPS」。", "提示：在表格内填写【实战得分】并点击反推，系统会自动修改该队伍的「自订 DPS」。若要还原，请点击该队伍下方的「🔄 重设预设 DPS」。"],
    ["點此查看「實戰編隊與推演功能」操作指南", "点此查看「实战编队与推演功能」操作指南"],
    ["點擊展開", "点击展开"],
    ["前往下一步：編隊與推演", "前往下一步：编队与推演"],
    ["【第一步：一鍵理論編隊】", "【第一步：一键理论编队】"],
    ["依排軸難度微調各別穩定性", "依排轴难度微调各别稳定性"],
    ["全局操作達成率", "全局操作达成率"],
    ["自動依難度換算折損", "自动依难度换算折损"],
    ["搜尋擁有角色", "搜寻拥有角色"],
    ["搜尋排軸角色", "搜寻排轴角色"],
    ["清空角色勾選", "清空角色勾选"],
    ["清空所有排軸", "清空所有排轴"],
    ["依據理論最高", "依据理论最高"],
    ["自動為您滿編", "自动为您满编"],
    ["根據表格分數反推真實", "根据表格分数反推真实"],
    ["現有隊伍無損洗牌", "现有队伍无损洗牌"],
    ["為最優順序！", "为最优顺序！"],
    ["一鍵編制", "一键编制"],
    ["理論推演", "理论推演"],
    ["依實戰得分反推與無損重排", "依实战得分反推与无损重排"],
    ["重設編制", "重设编制"],
    ["截圖分享", "截图分享"],
    ["貢獻實戰大數據", "贡献实战大数据"],
    ["剩餘可用次數", "剩余可用次数"],
    ["隊伍編排", "队伍编排"],
    ["極限上限16隊", "极限上限16队"],
    ["矩陣實戰接力推演與環境設定", "矩阵实战接力推演与环境设定"],
    ["影響分數與轉場計算", "影响分数与转场计算"],
    ["計分比例(分/萬)", "计分比例(分/万)"],
    ["每 1 萬傷害等於多少分數", "每 1 万伤害等于多少分数"],
    ["預設", "预设"],
    ["得1分", "得1分"],
    ["均血(萬)", "均血(万)"],
    ["後續成長(%)", "后续成长(%)"],
    ["以後每階血量成長率", "以后每阶血量成长率"],
    ["抗性減傷(%)", "抗性减伤(%)"],
    ["當隊伍遭遇抗性王時，降低的DPS百分比", "当队伍遭遇抗性王时，降低的DPS百分比"],
    ["轉場耗時(秒)", "转场耗时(秒)"],
    ["擊殺BOSS後的出場動畫延遲", "击杀BOSS后的出场动画延迟"],
    ["單隊時限(秒)", "单队时限(秒)"],
    ["進階：個別 BOSS 血量覆寫與代數反解校正面板", "进阶：个别 BOSS 血量覆写与代数反解校正面板"],
    ["主輸出篩選", "主输出筛选"],
    ["世代", "世代"],
    ["推薦配隊快速填入", "推荐配队快速填入"],
    ["填入下一空位", "填入下一空位"],
    ["當前編隊 矩陣接力推演總分", "当前编队 矩阵接力推演总分"],
    ["隊伍", "队伍"],
    ["位置 1 (主C)", "位置 1 (主C)"],
    ["位置 2 (副C)", "位置 2 (副C)"],
    ["位置 3 (生存)", "位置 3 (生存)"],
    ["實戰得分 / 殘血反解與抗性", "实战得分 / 残血反解与抗性"],
    ["推演戰果 (接力波次進度)", "推演战果 (接力波次进度)"],
    ["填寫檢測數據與環境加權", "填写检测数据与环境加权"],
    ["真實", "真实"],
    ["當期屬性增傷加權", "当期属性增伤加权"],
    ["取消", "取消"],
    ["清除自訂", "清除自订"],
    ["儲存", "储存"],
    ["實戰手法穩定性檢測", "实战手法稳定性检测"],
    ["基準理論耗時", "基准理论耗时"],
    ["實測耗時紀錄", "实测耗时纪录"],
    ["以逗號分隔", "以逗号分隔"],
    ["執行檢測分析", "执行检测分析"],
    ["平均耗時", "平均耗时"],
    ["節奏標準差", "节奏标准差"],
    ["綜合穩定性", "综合稳定性"],
    ["關閉", "关闭"],
    ["套用至全局拉桿", "套用至全局拉杆"],
    ["數據提供", "数据提供"],
    ["整理", "整理"],
    ["流量統計", "流量统计"],
    ["第一步", "第一步"],
    ["角色", "角色"],
    ["排軸", "排轴"],
    ["設定", "设定"],
    ["第二步", "第二步"],
    ["實戰", "实战"],
    ["推演", "推演"],
    ["全局", "全局"],
    ["輪椅", "轮椅"],
    ["進階", "进阶"],
    ["中等", "中等"],
    ["極難", "极难"],
    ["非主流", "非主流"],
    ["一般角色", "一般角色"],
    ["生存位", "生存位"],
    ["主輸出", "主输出"],
    ["副C/輔助", "副C/辅助"],
    ["生存/輔助", "生存/辅助"],
    ["適配推薦", "适配推荐"],
    ["其他角色", "其他角色"],
    ["耗盡", "耗尽"],
    ["在隊", "在队"],
    ["理論最大", "理论最大"],
    ["剩餘可排", "剩余可排"],
    ["無預設", "无预设"],
    ["點擊自訂", "点击自订"],
    ["選擇推薦配隊", "选择推荐配队"],
    ["無DPS", "无DPS"],
    ["無法推演", "无法推演"],
    ["請先排滿該隊伍的成員", "请先排满该队伍的成员"],
    ["找不到此組合的排軸資料", "找不到此组合的排轴资料"],
    ["已清除該隊伍排軸的自訂", "已清除该队伍排轴的自订"],
    ["恢復系統預設值", "恢复系统预设值"],
    ["請先在上方勾選擁有的角色", "请先在上方勾选拥有的角色"],
    ["以解鎖可組建的排軸", "以解锁可组建的排轴"],
    ["套用校正", "套用校正"],
    ["已成功校正為平均值", "已成功校正为平均值"],
    ["號?", "号?"],
    ["抗性王", "抗性王"],
    ["打完結算給的總分", "打完结算给的总分"],
    ["實戰得分", "实战得分"],
    ["下限", "下限"],
    ["上限", "上限"],
    ["將清空當前編隊並自動生成極限陣容，確定執行？", "将清空当前编队并自动生成极限阵容，确定执行？"],
    ["一鍵配置完成！共組建", "一键配置完成！共组建"],
    ["沒有空白隊伍了！", "没有空白队伍了！"],
    ["確定清空編隊表嗎？", "确定清空编队表吗？"],
    ["您即將匿名提交當前表單上的數據，是否繼續？", "您即将匿名提交当前表单上的数据，是否继续？"],
    ["請先填寫實戰得分！", "请先填写实战得分！"],
    ["請先完成至少一支滿編隊伍！", "请先完成至少一支满编队伍！"],
    ["實得分", "实得分"],
    ["推演編隊表", "推演编队表"],
    ["總分預估", "总分预估"],
    ["生成時間", "生成时间"],
    ["冷凝", "冷凝"], ["熱熔", "热熔"], ["導電", "导电"], ["氣動", "气动"], ["衍射", "衍射"], ["湮滅", "湮灭"],
    ["漂泊者", "漂泊者"], ["維里奈", "维里奈"], ["守岸人", "守岸人"], ["今汐", "今汐"], ["長離", "长离"], 
    ["忌炎", "忌炎"], ["相里要", "相里要"], ["椿", "椿"], ["折枝", "折枝"], ["吟霖", "吟霖"], 
    ["卡卡羅", "卡卡罗"], ["安可", "安可"], ["凌陽", "凌阳"], ["鑒心", "鉴心"], ["散華", "散华"], 
    ["白芷", "白芷"], ["熾霞", "炽霞"], ["秧秧", "秧秧"], ["丹瑾", "丹瑾"], ["釉瑚", "釉瑚"], 
    ["桃祈", "桃祈"], ["秋水", "秋水"], ["莫特斐", "莫特斐"], ["淵武", "渊武"], ["燈燈", "灯灯"], 
    ["珂萊塔", "珂莱塔"], ["洛可可", "洛可可"], ["菲比", "菲比"], ["布蘭特", "布兰特"], ["坎特蕾拉", "坎特蕾拉"], 
    ["贊妮", "赞妮"], ["夏空", "夏空"], ["卡提希婭", "卡提希娅"], ["露帕", "露帕"], ["弗洛洛", "弗洛洛"], 
    ["奧古斯塔", "奥古斯塔"], ["尤諾", "尤诺"], ["嘉貝莉娜", "嘉贝莉娜"], ["仇遠", "仇远"], ["千咲", "千咲"], 
    ["卜靈", "卜灵"], ["琳奈", "琳奈"], ["莫寧", "莫宁"], ["陸·赫斯", "陆·赫斯"], ["愛彌斯", "爱弥斯"], 
    ["西格莉卡", "西格莉卡"], ["光主", "光主"], ["暗主", "暗主"], ["風主", "风主"],
    ["常規", "常规"], ["錯輪", "错轮"], ["死告", "死告"], ["龍切", "龙切"], ["離火", "离火"], 
    ["雙延", "双延"], ["奶套", "奶套"], ["轉聚暴", "转聚暴"], ["雙下", "双下"], ["劍切", "剑切"], 
    ["雙錨", "双锚"], ["錯延", "错延"], ["旋踢", "旋踢"], ["基礎", "基础"], ["後", "后"],
    ["第", "第"], ["終", "终"], ["剩", "剩"], ["分", "分"], ["版", "版"], ["星", "星"], ["隊", "队"], ["次", "次"]
];

// 非常重要：將翻譯字典按照「字串長度由長到短」排序，確保長句先被替換，不會被短詞截斷破壞
translationList.sort((a, b) => b[0].length - a[0].length);

let isSimp = false;
function t(str) { 
    if (!isSimp || !str || typeof str !== 'string') return str; 
    let result = str;
    for (let i = 0; i < translationList.length; i++) {
        result = result.split(translationList[i][0]).join(translationList[i][1]);
    }
    return result;
}

function translateDOM(node) {
    let walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while(n = walker.nextNode()) {
        if (n.parentNode.tagName === 'SCRIPT' || n.parentNode.tagName === 'STYLE') continue;
        if (n.nodeValue.trim() !== '') {
            if (n.originalValue === undefined) n.originalValue = n.nodeValue;
            n.nodeValue = isSimp ? t(n.originalValue) : n.originalValue;
        }
    }
    document.querySelectorAll('input[placeholder], textarea[placeholder], option').forEach(el => {
        if (el.tagName === 'OPTION' && el.label) {
            if (el.originalLabel === undefined) el.originalLabel = el.label;
            el.label = isSimp ? t(el.originalLabel) : el.originalLabel;
        }
        if (el.placeholder) {
            if (el.originalPlaceholder === undefined) el.originalPlaceholder = el.placeholder;
            el.placeholder = isSimp ? t(el.originalPlaceholder) : el.originalPlaceholder;
        }
    });
}

function toggleLang() { 
    isSimp = !isSimp; 
    document.getElementById('lang-toggle').innerText = isSimp ? "繁" : "简"; 
    try { localStorage.setItem('ww_lang', isSimp ? 'zh-CN' : 'zh-TW'); } catch(e){} 
    renderCheckboxes();
    renderRotations();
    updateTracker();
    translateDOM(document.body);
}

// --- 2. 核心資料庫 ---
const charData = {
    "漂泊者": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, "維里奈": { max: 2, rarity: 5, gen: 1, type: "生存位 (可用 2 次)" }, 
    "守岸人": { max: 2, rarity: 5, gen: 1, type: "生存位 (可用 2 次)" }, "今汐": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "長離": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, "忌炎": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" },
    "相里要": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, "椿": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "折枝": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, "吟霖": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "卡卡羅": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, "安可": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" },
    "凌陽": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, "鑒心": { max: 1, rarity: 5, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "白芷": { max: 2, rarity: 4, gen: 1, type: "生存位 (可用 2 次)" }, "散華": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "熾霞": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, "秧秧": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" },
    "丹瑾": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, "釉瑚": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "桃祈": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, "秋水": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "莫特斐": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, "淵武": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" },
    "燈燈": { max: 1, rarity: 4, gen: 1, type: "一般角色 (可用 1 次)" }, 
    "珂萊塔": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "洛可可": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, 
    "菲比": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "布蘭特": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, 
    "坎特蕾拉": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "贊妮": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" },
    "夏空": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "卡提希婭": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, 
    "露帕": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "弗洛洛": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, 
    "奧古斯塔": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "尤諾": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, 
    "嘉貝莉娜": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "仇遠": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, 
    "千咲": { max: 1, rarity: 5, gen: 2, type: "一般角色 (可用 1 次)" }, "卜靈": { max: 2, rarity: 4, gen: 2, type: "生存位 (可用 2 次)" }, 
    "琳奈": { max: 1, rarity: 5, gen: 3, type: "一般角色 (可用 1 次)" }, "莫寧": { max: 2, rarity: 5, gen: 3, type: "生存位 (可用 2 次)" }, 
    "陸·赫斯": { max: 1, rarity: 5, gen: 3, type: "一般角色 (可用 1 次)" }, "愛彌斯": { max: 1, rarity: 5, gen: 3, type: "一般角色 (可用 1 次)" },
    "西格莉卡": { max: 1, rarity: 5, gen: 3, type: "一般角色 (可用 1 次)" }
};

const charAttrMap = {
    "凌陽": "冷凝", "散華": "冷凝", "白芷": "冷凝", "折枝": "冷凝", "釉瑚": "冷凝", "珂萊塔": "冷凝",
    "熾霞": "熱熔", "安可": "熱熔", "莫特斐": "熱熔", "長離": "熱熔", "布蘭特": "熱熔", "露帕": "熱熔", "嘉貝莉娜": "熱熔", "莫寧": "熱熔", "愛彌斯": "熱熔",
    "卡卡羅": "導電", "吟霖": "導電", "淵武": "導電", "相里要": "導電", "燈燈": "導電", "奧古斯塔": "導電", "卜靈": "導電",
    "風主": "氣動", "秧秧": "氣動", "忌炎": "氣動", "鑒心": "氣動", "秋水": "氣動", "夏空": "氣動", "卡提希婭": "氣動", "尤諾": "氣動", "仇遠": "氣動", "西格莉卡": "氣動",
    "光主": "衍射", "維里奈": "衍射", "今汐": "衍射", "守岸人": "衍射", "贊妮": "衍射", "菲比": "衍射", "琳奈": "衍射", "陸·赫斯": "衍射",
    "暗主": "湮滅", "丹瑾": "湮滅", "桃祈": "湮滅", "椿": "湮滅", "洛可可": "湮滅", "坎特蕾拉": "湮滅", "弗洛洛": "湮滅", "千咲": "湮滅"
};

const characterOrder = ["漂泊者", "秧秧", "熾霞", "白芷", "散華", "桃祈", "丹瑾", "秋水", "莫特斐", "淵武", "維里奈", "安可", "卡卡羅", "凌陽", "鑒心", "忌炎", "吟霖", "今汐", "長離", "折枝", "相里要", "守岸人", "釉瑚", "椿", "燈燈", "珂萊塔", "洛可可", "菲比", "布蘭特", "坎特蕾拉", "贊妮", "夏空", "卡提希婭", "露帕", "弗洛洛", "奧古斯塔", "尤諾", "嘉貝莉娜", "仇遠", "千咲", "卜靈", "琳奈", "莫寧", "陸·赫斯", "愛彌斯", "西格莉卡"];

const teamDB = {
    "椿": [
        { c2:"散華", c3:"守岸人", dps:5.59, rot:"常規", diff:"🟩" }, { c2:"洛可可", c3:"守岸人", dps:6.35, rot:"上限", diff:"⭐" }, { c2:"洛可可", c3:"守岸人", dps:5.95, rot:"常規", diff:"🔵" },
        { c2:"丹瑾", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"丹瑾", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "暗主": [
        { c2:"琳奈", c3:"守岸人", dps:7.10, rot:"錯亂2min軸", diff:"⭐" }, { c2:"琳奈", c3:"守岸人", dps:6.77, rot:"錯輪", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:5.48, rot:"常規", diff:"🟩" },
        { c2:"散華", c3:"守岸人", dps:6.16, rot:"錯輪", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:5.40, rot:"常規", diff:"🟩" },
        { c2:"洛可可", c3:"守岸人", dps:6.48, rot:"常規", diff:"🔵" }, { c2:"洛可可", c3:"守岸人", dps:5.60, rot:"常規", diff:"🟩" },
        { c2:"丹瑾", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"丹瑾", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "今汐": [
        { c2:"坎特蕾拉", c3:"守岸人", dps:6.07, rot:"常規", diff:"🔵" }, { c2:"折枝", c3:"守岸人", dps:6.38, rot:"常規", diff:"⭐" }, { c2:"折枝", c3:"守岸人", dps:5.85, rot:"常規", diff:"🔵" },
        { c2:"折枝", c3:"卜靈", dps:5.77, rot:"常規", diff:"🔵" }, { c2:"吟霖", c3:"守岸人", dps:6.45, rot:"錯輪", diff:"⭐" }, { c2:"吟霖", c3:"守岸人", dps:5.73, rot:"常規", diff:"🔵" },
        { c2:"莫特斐", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"莫特斐", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"布蘭特", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"布蘭特", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"莫特斐", c3:"卜靈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"淵武", c3:"卜靈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"燈燈", c3:"淵武", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"桃祈", c3:"淵武", dps:0, rot:"非主流", diff:"🧩" }, { c2:"淵武", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"淵武", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "安可": [
        { c2:"露帕", c3:"莫寧", dps:6.47, rot:"常規上限", diff:"🔵" }, { c2:"露帕", c3:"守岸人", dps:6.25, rot:"6鏈", diff:"🔵" }, { c2:"露帕", c3:"守岸人", dps:5.79, rot:"常規", diff:"🔵" },
        { c2:"散華", c3:"守岸人", dps:5.50, rot:"錯輪", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:5.00, rot:"常規", diff:"🟩" },
        { c2:"長離", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"露帕", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"熾霞", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"熾霞", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "長離": [
        { c2:"露帕", c3:"莫寧", dps:7.20, rot:"極限", diff:"⭐" }, { c2:"露帕", c3:"莫寧", dps:6.90, rot:"錯輪", diff:"⭐" }, { c2:"露帕", c3:"莫寧", dps:6.40, rot:"常規", diff:"🔵" },
        { c2:"露帕", c3:"守岸人", dps:6.01, rot:"7離火", diff:"⭐" }, { c2:"露帕", c3:"守岸人", dps:5.83, rot:"6離火", diff:"🔵" }, { c2:"露帕", c3:"守岸人", dps:5.63, rot:"5離火", diff:"🟩" },
        { c2:"散華", c3:"守岸人", dps:4.81, rot:"錯輪", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:4.20, rot:"常規", diff:"🟩" },
        { c2:"布蘭特", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"布蘭特", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"吟霖", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"吟霖", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"暗主", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"暗主", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"秧秧", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"秧秧", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"秧秧", c3:"卜靈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "忌炎": [
        { c2:"夏空", c3:"守岸人", dps:7.81, rot:"龍切", diff:"⭐" }, { c2:"夏空", c3:"守岸人", dps:6.79, rot:"常規", diff:"⭐" }, { c2:"夏空", c3:"尤諾", dps:6.55, rot:"常規", diff:"🔵" },
        { c2:"莫特斐", c3:"守岸人", dps:5.85, rot:"常規", diff:"⭐" }, { c2:"莫特斐", c3:"守岸人", dps:5.60, rot:"常規", diff:"🔵" },
        { c2:"莫特斐", c3:"釉瑚", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "相里要": [
        { c2:"琳奈", c3:"守岸人", dps:6.28, rot:"常規", diff:"🔵" }, { c2:"吟霖", c3:"守岸人", dps:5.25, rot:"常規", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:4.58, rot:"錯輪", diff:"🔵" },
        { c2:"長離", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "卡卡羅": [
        { c2:"琳奈", c3:"守岸人", dps:7.65, rot:"6鏈死告", diff:"⚠️" }, { c2:"琳奈", c3:"守岸人", dps:7.53, rot:"6鏈死告", diff:"⭐" }, { c2:"琳奈", c3:"守岸人", dps:7.20, rot:"6鏈死告", diff:"🔵" },
        { c2:"琳奈", c3:"守岸人", dps:6.40, rot:"4死告", diff:"⭐" }, { c2:"琳奈", c3:"守岸人", dps:6.10, rot:"常規", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:5.80, rot:"基礎", diff:"🟩" },
        { c2:"吟霖", c3:"守岸人", dps:6.10, rot:"6鏈", diff:"⭐" }, { c2:"吟霖", c3:"守岸人", dps:5.72, rot:"6鏈", diff:"🔵" }, { c2:"吟霖", c3:"守岸人", dps:5.07, rot:"4死告", diff:"⭐" },
        { c2:"吟霖", c3:"守岸人", dps:4.65, rot:"常規", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:4.13, rot:"常規", diff:"🔵" },
        { c2:"長離", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"莫特斐", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"莫特斐", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "凌陽": [
        { c2:"琳奈", c3:"守岸人", dps:5.18, rot:"常規", diff:"🔵" }, { c2:"折枝", c3:"守岸人", dps:5.08, rot:"6鏈", diff:"🔵" }, { c2:"折枝", c3:"守岸人", dps:4.32, rot:"常規", diff:"🔵" },
        { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"白芷", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "弗洛洛": [
        { c2:"坎特蕾拉", c3:"莫寧", dps:9.02, rot:"1鏈", diff:"🔵" }, { c2:"坎特蕾拉", c3:"莫寧", dps:8.57, rot:"常規", diff:"🔵" }, { c2:"嘉貝莉娜", c3:"仇遠", dps:8.55, rot:"極限", diff:"⭐" },
        { c2:"坎特蕾拉", c3:"守岸人", dps:8.00, rot:"常規", diff:"🔵" }, { c2:"坎特蕾拉", c3:"仇遠", dps:7.96, rot:"常規", diff:"🔵" }, { c2:"坎特蕾拉", c3:"洛可可", dps:7.51, rot:"常規", diff:"🔵" },
        { c2:"仇遠", c3:"守岸人", dps:7.86, rot:"常規", diff:"🔵" }, { c2:"卜靈", c3:"守岸人", dps:5.56, rot:"常規", diff:"🔵" }, { c2:"燈燈", c3:"守岸人", dps:5.56, rot:"常規", diff:"🔵" }
    ],
    "坎特蕾拉": [
        { c2:"散華", c3:"守岸人", dps:5.73, rot:"1鏈", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:5.37, rot:"錯輪", diff:"🔵" }
    ],
    "千咲": [
        { c2:"琳奈", c3:"守岸人", dps:6.40, rot:"常規", diff:"🔵" }, { c2:"洛可可", c3:"守岸人", dps:4.51, rot:"常規", diff:"🔵" }
    ],
    "贊妮": [
        { c2:"菲比", c3:"光主", dps:9.15, rot:"極限", diff:"⭐" }, { c2:"菲比", c3:"光主", dps:8.39, rot:"常規", diff:"🔵" }, { c2:"菲比", c3:"千咲", dps:8.34, rot:"奶套", diff:"🔵" },
        { c2:"菲比", c3:"守岸人", dps:7.95, rot:"常規", diff:"🔵" }, { c2:"菲比", c3:"守岸人", dps:7.18, rot:"基礎", diff:"🟩" }, { c2:"光主", c3:"守岸人", dps:4.78, rot:"常規", diff:"🔵" }
    ],
    "菲比": [
        { c2:"光主", c3:"琳奈", dps:6.52, rot:"常規", diff:"🔵" }, { c2:"光主", c3:"守岸人", dps:5.60, rot:"常規", diff:"🔵" }
    ],
    "嘉貝莉娜": [
        { c2:"露帕", c3:"莫寧", dps:8.56, rot:"極限", diff:"⭐" }, { c2:"露帕", c3:"莫寧", dps:7.84, rot:"常規", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:8.26, rot:"常規", diff:"🔵" },
        { c2:"露帕", c3:"布蘭特", dps:9.15, rot:"雙錨錯延", diff:"⚠️" }, { c2:"露帕", c3:"布蘭特", dps:8.80, rot:"雙錨", diff:"⭐" }, { c2:"露帕", c3:"布蘭特", dps:8.31, rot:"單錨", diff:"⚠️" },
        { c2:"露帕", c3:"布蘭特", dps:7.67, rot:"常規", diff:"🔵" }, { c2:"仇遠", c3:"守岸人", dps:8.68, rot:"4旋踢", diff:"⚠️" }, { c2:"仇遠", c3:"守岸人", dps:8.11, rot:"極限", diff:"⭐" },
        { c2:"仇遠", c3:"守岸人", dps:7.77, rot:"常規", diff:"🔵" }, { c2:"露帕", c3:"守岸人", dps:8.02, rot:"極限", diff:"⭐" }, { c2:"露帕", c3:"守岸人", dps:7.35, rot:"常規", diff:"🔵" },
        { c2:"露帕", c3:"長離", dps:7.67, rot:"極限", diff:"⭐" }, { c2:"露帕", c3:"長離", dps:6.72, rot:"常規", diff:"🔵" }, { c2:"莫特斐", c3:"守岸人", dps:5.73, rot:"常規", diff:"🔵" }
    ],
    "布蘭特": [
        { c2:"露帕", c3:"莫寧", dps:8.35, rot:"常規", diff:"🔵" }, { c2:"露帕", c3:"莫寧", dps:7.53, rot:"下限", diff:"🔵" }, { c2:"露帕", c3:"莫寧", dps:7.20, rot:"基礎", diff:"🟩" },
        { c2:"露帕", c3:"長離", dps:7.74, rot:"雙錨", diff:"⭐" }, { c2:"露帕", c3:"長離", dps:7.57, rot:"極限", diff:"⭐" }, { c2:"露帕", c3:"長離", dps:7.05, rot:"單錨", diff:"🔵" },
        { c2:"露帕", c3:"守岸人", dps:7.73, rot:"改軸", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:5.43, rot:"常規", diff:"🔵" }
    ],
    "露帕": [
        { c2:"琳奈", c3:"守岸人", dps:5.68, rot:"常規", diff:"🔵" }
    ],
    "卡提希婭": [
        { c2:"夏空", c3:"千咲", dps:11.00, rot:"劍切", diff:"⚠️" }, { c2:"夏空", c3:"千咲", dps:9.72, rot:"極限", diff:"⭐" }, { c2:"夏空", c3:"千咲", dps:9.01, rot:"常規", diff:"🔵" },
        { c2:"夏空", c3:"風主", dps:9.30, rot:"劍切", diff:"⭐" }, { c2:"夏空", c3:"風主", dps:8.47, rot:"雙下", diff:"⭐" }, { c2:"夏空", c3:"風主", dps:8.20, rot:"常規", diff:"🔵" },
        { c2:"散華", c3:"風主", dps:6.39, rot:"常規", diff:"🔵" }, { c2:"風主", c3:"卜靈", dps:6.39, rot:"常規", diff:"🔵" }
    ],
    "尤諾": [
        { c2:"琳奈", c3:"夏空", dps:8.67, rot:"常規", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:9.20, rot:"極限", diff:"⭐" }, { c2:"琳奈", c3:"守岸人", dps:8.41, rot:"常規", diff:"🔵" },
        { c2:"琳奈", c3:"莫寧", dps:8.47, rot:"極限", diff:"⭐" }, { c2:"琳奈", c3:"莫寧", dps:8.10, rot:"常規", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:7.90, rot:"基礎", diff:"🟩" },
        { c2:"夏空", c3:"守岸人", dps:7.92, rot:"極限", diff:"⭐" }, { c2:"夏空", c3:"守岸人", dps:7.45, rot:"常規", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:5.03, rot:"常規", diff:"🔵" }
    ],
    "夏空": [
        { c2:"千咲", c3:"守岸人", dps:7.64, rot:"極限", diff:"⭐" }, { c2:"千咲", c3:"守岸人", dps:7.38, rot:"常規", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:6.23, rot:"錯輪", diff:"🔵" },
        { c2:"散華", c3:"守岸人", dps:5.53, rot:"基礎", diff:"🟩" }
    ],
    "仇遠": [
        { c2:"弗洛洛", c3:"守岸人", dps:8.34, rot:"仇3鏈", diff:"🔵" }, { c2:"夏空", c3:"守岸人", dps:5.65, rot:"夏雙延", diff:"🔵" }, { c2:"夏空", c3:"守岸人", dps:5.54, rot:"仇雙延", diff:"🔵" },
        { c2:"莫特斐", c3:"守岸人", dps:5.25, rot:"常規", diff:"🔵" }
    ],
    "奧古斯塔": [
        { c2:"尤諾", c3:"琳奈", dps:8.50, rot:"2旋1升", diff:"🔵" }, { c2:"尤諾", c3:"守岸人", dps:9.05, rot:"2旋4升", diff:"⭐" }, { c2:"尤諾", c3:"守岸人", dps:8.79, rot:"2旋3升", diff:"⭐" },
        { c2:"尤諾", c3:"守岸人", dps:8.28, rot:"2旋1升", diff:"🔵" }, { c2:"尤諾", c3:"守岸人", dps:7.67, rot:"2旋", diff:"🟩" }, { c2:"莫特斐", c3:"守岸人", dps:7.35, rot:"4旋1升", diff:"⭐" },
        { c2:"莫特斐", c3:"守岸人", dps:7.00, rot:"3旋1升", diff:"🔵" }
    ],
    "珂萊塔": [
        { c2:"琳奈", c3:"莫寧", dps:6.98, rot:"常規", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:7.08, rot:"常規", diff:"🔵" }, { c2:"布蘭特", c3:"守岸人", dps:6.71, rot:"極限", diff:"⭐" },
        { c2:"折枝", c3:"守岸人", dps:6.45, rot:"常規", diff:"🔵" }, { c2:"燈燈", c3:"守岸人", dps:6.17, rot:"常規", diff:"🔵" }, { c2:"卜靈", c3:"守岸人", dps:6.17, rot:"常規", diff:"🔵" },
        { c2:"散華", c3:"守岸人", dps:5.53, rot:"錯輪", diff:"🔵" }
    ],
    "陸·赫斯": [
        { c2:"琳奈", c3:"莫寧", dps:8.55, rot:"1鏈", diff:"🔵" }, { c2:"琳奈", c3:"守岸人", dps:8.37, rot:"常規", diff:"🔵" }, { c2:"散華", c3:"莫寧", dps:6.32, rot:"1鏈", diff:"🔵" },
        { c2:"散華", c3:"守岸人", dps:6.19, rot:"常規", diff:"🔵" }, { c2:"散華", c3:"維里奈", dps:5.33, rot:"常規", diff:"🔵" }
    ],
    "琳奈": [
        { c2:"散華", c3:"守岸人", dps:5.46, rot:"極限", diff:"⭐" }, { c2:"散華", c3:"守岸人", dps:4.30, rot:"常規", diff:"🔵" }
    ],
    "愛彌斯": [
        { c2:"琳奈", c3:"莫寧", dps:10.50, rot:"雙處", diff:"⭐" }, { c2:"琳奈", c3:"莫寧", dps:9.50, rot:"常規", diff:"🔵" }, { c2:"弗洛洛", c3:"莫寧", dps:9.04, rot:"1鏈", diff:"🔵" },
        { c2:"琳奈", c3:"守岸人", dps:8.35, rot:"常規", diff:"🔵" }, { c2:"琳奈", c3:"千咲", dps:8.15, rot:"常規", diff:"🔵" }, { c2:"露帕", c3:"莫寧", dps:8.72, rot:"常規", diff:"🔵" },
        { c2:"露帕", c3:"千咲", dps:7.89, rot:"極限", diff:"⭐" }, { c2:"千咲", c3:"莫寧", dps:7.68, rot:"轉聚暴", diff:"🔵" }, { c2:"千咲", c3:"莫寧", dps:7.28, rot:"常規", diff:"🔵" },
        { c2:"露帕", c3:"嘉貝莉娜", dps:8.62, rot:"常規", diff:"🔵" }, { c2:"露帕", c3:"布蘭特", dps:8.56, rot:"常規", diff:"🔵" }, { c2:"露帕", c3:"長離", dps:7.76, rot:"常規", diff:"🔵" },
        { c2:"長離", c3:"莫寧", dps:7.04, rot:"極限", diff:"⭐" }, { c2:"長離", c3:"莫寧", dps:6.11, rot:"常規", diff:"🔵" }, { c2:"露帕", c3:"守岸人", dps:7.48, rot:"常規", diff:"🔵" },
        { c2:"鑒心", c3:"莫寧", dps:5.08, rot:"2鏈", diff:"🔵" }, { c2:"鑒心", c3:"守岸人", dps:5.08, rot:"2鏈", diff:"🔵" }, { c2:"散華", c3:"守岸人", dps:4.62, rot:"常規", diff:"🔵" }
    ],
    "光主": [
        { c2:"秧秧", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"秧秧", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"吟霖", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"吟霖", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"莫特斐", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"莫特斐", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "熾霞": [
        { c2:"長離", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"長離", c3:"露帕", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "秋水": [
        { c2:"夏空", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"夏空", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"夏空", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "燈燈": [
        { c2:"吟霖", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"吟霖", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"秧秧", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"秧秧", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "丹瑾": [
        { c2:"莫特斐", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"莫特斐", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"暗主", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" },
        { c2:"暗主", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "折枝": [
        { c2:"散華", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"散華", c3:"白芷", dps:0, rot:"非主流", diff:"🧩" }
    ],
    "散華": [
        { c2:"折枝", c3:"守岸人", dps:0, rot:"非主流", diff:"🧩" }, { c2:"折枝", c3:"維里奈", dps:0, rot:"非主流", diff:"🧩" }, { c2:"折枝", c3:"白芷", dps:0, rot:"非主流", diff:"🧩" }
    ]
};

const dpsData = [];
let rotIdCounter = 0;
for (let c1 in teamDB) {
    teamDB[c1].forEach(tData => {
        dpsData.push({ id: 'rot_' + rotIdCounter++, c1: c1, c2: tData.c2, c3: tData.c3, dps: tData.dps, rot: tData.rot, diff: tData.diff, gen: charData[c1]?charData[c1].gen:1 });
    });
}

// --- 全域變數 ---
let ownedCharacters = new Set();
let checkedRotations = new Set();
let show5Star = true, show4Star = true, showG1 = true, showG2 = true, showG3 = true;
let customStatsMap = {};
const noRecChars = new Set(["莫特斐", "秧秧", "桃祈", "淵武", "釉瑚"]);
let diffStability = { '⚠️': 100, '⭐': 100, '🔵': 100, '🟩': 100, '🧩': 100 };
let bossHPMap = {};
let bossHPHistory = {};

// --- 3. 核心工具與防呆 ---
function clampHpPct(el) {
    let val = parseFloat(el.value);
    if (isNaN(val)) { el.value = ''; return; }
    if (val < 0.01) el.value = 0.01;
    if (val > 100) el.value = 100;
}

function resetRowDps(btn) {
    let row = btn.closest('tr');
    let ss = row.querySelectorAll('select.char-select');
    let c1 = ss[0].value, c2 = ss[1].value, c3 = ss[2].value;
    if (!c1 || !c2 || !c3) return alert(t("請先排滿該隊伍的成員。"));
    
    let possibleRots = dpsData.filter(d => d.c1 === c1 && d.c2 === c2 && d.c3 === c3);
    if(possibleRots.length > 0) {
        possibleRots.forEach(r => { delete customStatsMap[r.id]; });
        try { localStorage.setItem('ww_custom_stats', JSON.stringify(customStatsMap)); } catch(e){}
        row.querySelector('.score-input').value = ""; // 清除實戰分數框
        renderRotations();
        updateTracker();
        alert(t("🔄 已清除該隊伍排軸的自訂 DPS，恢復系統預設值。"));
    } else {
        alert(t("找不到此組合的排軸資料。"));
    }
}

function getBase(n) { return ['光主', '暗主', '風主'].includes(n) ? '漂泊者' : n; }
function isOwned(n) { return ['光主', '暗主', '風主'].includes(n) ? ownedCharacters.has('漂泊者') : ownedCharacters.has(n); }

function toggleRarity(s) { 
    s == 5 ? show5Star = !show5Star : show4Star = !show4Star; 
    document.getElementById(`btn-${s}star`).classList.toggle(`active-${s}star`, s==5?show5Star:show4Star);
    filterCharacters(); 
}
function toggleGen(g) { 
    if(g==1) showG1=!showG1; if(g==2) showG2=!showG2; if(g==3) showG3=!showG3;
    document.getElementById(`btn-g${g}`).classList.toggle('active-gen', g==1?showG1:g==2?showG2:showG3);
    filterCharacters(); 
}

// --- 4. 畫面渲染 ---
function renderCheckboxes() {
    const grid = document.getElementById('roster-setup');
    grid.innerHTML = '<div id="roster-grid"></div>';
    const container = document.getElementById('roster-grid');
    characterOrder.forEach(name => {
        let label = document.createElement('label');
        label.className = 'checkbox-item';
        label.style.borderLeft = charData[name].rarity === 5 ? '4px solid #d4af37' : '4px solid #9b59b6';
        label.innerHTML = `<input type="checkbox" value="${name}" ${ownedCharacters.has(name)?'checked':''} onchange="updateOwnedCharacters()"> ${t(name)}`;
        container.appendChild(label);
    });
    filterCharacters();
}

function filterCharacters() {
    let q = document.getElementById('char-search').value.toLowerCase();
    let qTrad = q; 
    document.querySelectorAll('.checkbox-item').forEach(l => {
        let name = l.querySelector('input').value, d = charData[name];
        let searchTarget = name.toLowerCase() + t(name).toLowerCase();
        if (searchTarget.includes('漂泊者')) searchTarget += ' 光主 暗主 風主';
        let m = searchTarget.includes(qTrad) && ((d.rarity==5 && show5Star) || (d.rarity==4 && show4Star)) && ((d.gen==1 && showG1) || (d.gen==2 && showG2) || (d.gen==3 && showG3));
        l.style.display = m ? 'flex' : 'none';
    });
}

function rosterCheckboxButton() {
    const visibleBoxes = Array.from(document.querySelectorAll('#roster-setup .checkbox-item')).filter(l => l.style.display !== 'none').map(l => l.querySelector('input'));
    if(!visibleBoxes.length) return;
    const anyChecked = visibleBoxes.some(i => i.checked);
    visibleBoxes.forEach(i => i.checked = !anyChecked);
    updateOwnedCharacters();
}

function updateOwnedCharacters() {
    ownedCharacters.clear();
    document.querySelectorAll('#roster-setup input:checked').forEach(i => ownedCharacters.add(i.value));
    updateTracker();
}

function updateMasterSkill() {
    let val = parseInt(document.getElementById('skill-slider').value);
    document.getElementById('skill-display').innerText = val + '%';
    diffStability['⚠️'] = Math.max(0, 100 - (100 - val) * 1.8); diffStability['⭐'] = Math.max(0, 100 - (100 - val) * 1.4);
    diffStability['🔵'] = Math.max(0, 100 - (100 - val) * 1.1); diffStability['🟩'] = Math.max(0, 100 - (100 - val) * 0.8); diffStability['🧩'] = Math.max(0, 100 - (100 - val) * 1.0);
    document.getElementById('slider-diff-4').value = diffStability['⚠️']; document.getElementById('val-diff-4').innerText = diffStability['⚠️'].toFixed(0) + '%';
    document.getElementById('slider-diff-3').value = diffStability['⭐']; document.getElementById('val-diff-3').innerText = diffStability['⭐'].toFixed(0) + '%';
    document.getElementById('slider-diff-2').value = diffStability['🔵']; document.getElementById('val-diff-2').innerText = diffStability['🔵'].toFixed(0) + '%';
    document.getElementById('slider-diff-1').value = diffStability['🟩']; document.getElementById('val-diff-1').innerText = diffStability['🟩'].toFixed(0) + '%';
    document.getElementById('slider-diff-5').value = diffStability['🧩']; document.getElementById('val-diff-5').innerText = diffStability['🧩'].toFixed(0) + '%';
    renderRotations(); updateTracker();
}

function updateSubSkill(diffKey, sliderId, valId) {
    let val = parseInt(document.getElementById(sliderId).value);
    diffStability[diffKey] = val; document.getElementById(valId).innerText = val + '%';
    renderRotations(); updateTracker();
}

function getRotDpsRange(d) {
    let buffMult = customStatsMap[d.id] && customStatsMap[d.id].buff ? 1 + (customStatsMap[d.id].buff / 100) : 1;
    if (customStatsMap[d.id]) {
        let s = customStatsMap[d.id]; let max = s.dps * buffMult;
        return { min: Math.max(0, max * (s.stability / 100)), max: max, isCustom: true };
    } else {
        let max = d.dps * buffMult;
        if (max === 0) return { min: 0, max: 0, isCustom: false };
        let diffKey = '🧩';
        if (d.diff.includes('⚠️')) diffKey = '⚠️'; else if (d.diff.includes('⭐')) diffKey = '⭐';
        else if (d.diff.includes('🔵')) diffKey = '🔵'; else if (d.diff.includes('🟩')) diffKey = '🟩';
        let stab = diffStability[diffKey] !== undefined ? diffStability[diffKey] : 100;
        return { min: Math.max(0, max * (stab / 100)), max: max, isCustom: false };
    }
}

// --- 5. Modals 系統 ---
let currentEditRotId = null;
function openStatsModal(e, rotId) {
    e.preventDefault(); e.stopPropagation(); currentEditRotId = rotId;
    let d = dpsData.find(x => x.id === rotId);
    document.getElementById('stats-modal-rot').innerText = `${t(d.c1)} + ${t(d.c2)} + ${t(d.c3)} (${t(d.rot)})`;
    let stats = customStatsMap[rotId];
    if (stats) {
        document.getElementById('stats-dps').value = stats.dps; document.getElementById('stats-stab').value = stats.stability; document.getElementById('stats-buff').value = stats.buff || 0;
    } else {
        document.getElementById('stats-dps').value = d.dps > 0 ? d.dps : '';
        let diffKey = '🧩';
        if (d.diff.includes('⚠️')) diffKey = '⚠️'; else if (d.diff.includes('⭐')) diffKey = '⭐';
        else if (d.diff.includes('🔵')) diffKey = '🔵'; else if (d.diff.includes('🟩')) diffKey = '🟩';
        document.getElementById('stats-stab').value = diffStability[diffKey].toFixed(0); document.getElementById('stats-buff').value = 0;
    }
    document.getElementById('stats-modal').style.display = 'flex';
}

function closeStatsModal() { document.getElementById('stats-modal').style.display = 'none'; currentEditRotId = null; }
function clearStatsModal() {
    if (currentEditRotId) { delete customStatsMap[currentEditRotId]; try { localStorage.setItem('ww_custom_stats', JSON.stringify(customStatsMap)); } catch(e) {} renderRotations(); updateTracker(); }
    closeStatsModal();
}
function saveStatsModal() {
    let dpsVal = parseFloat(document.getElementById('stats-dps').value), stabVal = parseFloat(document.getElementById('stats-stab').value), buffVal = parseFloat(document.getElementById('stats-buff').value) || 0;
    if (isNaN(dpsVal) || isNaN(stabVal)) { alert(t("請輸入有效的數字！")); return; }
    if (currentEditRotId) { customStatsMap[currentEditRotId] = { dps: dpsVal, stability: Math.min(100, Math.max(0, stabVal)), buff: buffVal }; try { localStorage.setItem('ww_custom_stats', JSON.stringify(customStatsMap)); } catch(e) {} renderRotations(); updateTracker(); }
    closeStatsModal();
}

let lastCalculatedStability = 100;
function openCalcModal() { document.getElementById('calc-modal').style.display = 'flex'; document.getElementById('calc-result').style.display = 'none'; }
function closeCalcModal() { document.getElementById('calc-modal').style.display = 'none'; }
function calculateStability() {
    let baseTime = parseFloat(document.getElementById('calc-base-time').value);
    let times = document.getElementById('calc-times').value.split(/[\n,]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (isNaN(baseTime) || baseTime <= 0 || times.length < 2) { alert(t("請確認資料正確並輸入至少2筆。")); return; }
    let n = times.length, mean = times.reduce((a, b) => a + b, 0) / n, stdDev = Math.sqrt(times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n);
    let stability = Math.max(0, Math.min(100, ((baseTime / mean) * 100) - (stdDev * 1.5)));
    lastCalculatedStability = Math.round(stability);
    document.getElementById('calc-res-mean').innerText = mean.toFixed(2) + ' 秒'; document.getElementById('calc-res-std').innerText = stdDev.toFixed(2) + ' 秒';
    document.getElementById('calc-res-stab').innerText = lastCalculatedStability + ' %'; document.getElementById('calc-result').style.display = 'block';
}
function applyCalculatedStability() { document.getElementById('skill-slider').value = lastCalculatedStability; updateMasterSkill(); closeCalcModal(); }

function renderRotations() {
    const container = document.getElementById('rotation-setup');
    const valid = dpsData.filter(d => isOwned(d.c1) && isOwned(d.c2) && isOwned(d.c3));
    if(!valid.length) { container.innerHTML = `<p style="color:#888; font-style:italic;">${t("請先在上方勾選擁有的角色，以解鎖可組建的排軸...")}</p>`; return; }
    let groups = {}; valid.forEach(d => { if(!groups[d.c1]) groups[d.c1] = []; groups[d.c1].push(d); });
    let html = '';
    for(let c1 in groups) {
        html += `<div style="margin-bottom:15px; padding:12px; background:#1e1e24; border-radius:5px; border-left: 3px solid #d4af37;"><strong style="color: #d4af37;">🎯 ${t("主輸出")}：${t(c1)}</strong><div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:8px;">`;
        groups[c1].sort((a,b) => getRotDpsRange(b).min - getRotDpsRange(a).min).forEach(d => {
            let r = getRotDpsRange(d);
            let dpsStr = (r.max > 0 || r.isCustom) ? `[${r.min.toFixed(2)}~${r.max.toFixed(2)}w]` : t('[無預設/點擊自訂]'); 
            let colorStyle = r.isCustom ? 'color: #00ffaa; text-decoration: underline; text-decoration-style: dashed;' : (r.min < r.max ? 'color: #ffaa00;' : 'color: #fff;');
            if(r.max === 0 && !r.isCustom) colorStyle = 'color: #888; text-decoration: underline; text-decoration-style: dashed;';
            html += `<div style="background:#2b2b36; padding:6px 10px; border-radius:4px; font-size:0.9em; border: 1px solid #444; display:inline-flex; align-items:center; gap:5px;">
                        <input type="checkbox" id="chk_${d.id}" value="${d.id}" ${checkedRotations.has(d.id)?'checked':''} onchange="updateRotationState()">
                        <label for="chk_${d.id}" style="cursor:pointer; margin:0;">${t(d.diff)}</label>
                        <span onclick="openStatsModal(event, '${d.id}')" style="cursor:pointer; font-weight:bold; ${colorStyle}; padding:0 4px;" title="${t('點擊輸入數據或加權')}">${dpsStr}</span>
                        <label for="chk_${d.id}" style="cursor:pointer; margin:0;">${t(d.c2)} / ${t(d.c3)} (${t(d.rot)})</label>
                    </div>`;
        });
        html += `</div></div>`;
    }
    container.innerHTML = html;
}

function filterRotations() {
    let q = document.getElementById('rot-search').value.toLowerCase();
    document.querySelectorAll('#rotation-setup input[type="checkbox"]').forEach(i => {
        let container = i.closest('div');
        container.style.display = container.innerText.toLowerCase().includes(q) ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('#rotation-setup > div').forEach(group => { group.style.display = Array.from(group.querySelectorAll('div > div')).some(l => l.style.display !== 'none') ? 'block' : 'none'; });
}

function toggleAllRotations() {
    const visibleBoxes = Array.from(document.querySelectorAll('#rotation-setup input[type="checkbox"]')).filter(i => i.closest('div').style.display !== 'none');
    if(!visibleBoxes.length) return;
    const anyChecked = visibleBoxes.some(i => i.checked);
    visibleBoxes.forEach(i => i.checked = !anyChecked);
    updateRotationState();
}

function toggleDifficulty(diff) {
    const visibleBoxes = Array.from(document.querySelectorAll('#rotation-setup input[type="checkbox"]')).filter(i => i.closest('div').style.display !== 'none' && i.closest('div').innerText.includes(diff));
    if(!visibleBoxes.length) return;
    const allChecked = visibleBoxes.every(i => i.checked);
    visibleBoxes.forEach(i => i.checked = !allChecked);
    updateRotationState();
}

function updateRotationState() {
    checkedRotations.clear(); document.querySelectorAll('#rotation-setup input:checked').forEach(i => checkedRotations.add(i.value)); updateTracker();
}

let activePresetAttrs = new Set(); let activePresetGens = new Set();
function togglePresetAttr(attr) { activePresetAttrs.has(attr) ? activePresetAttrs.delete(attr) : activePresetAttrs.add(attr); document.querySelector(`button[data-attr="${attr}"]`).classList.toggle(`active-attr-${attr}`); updateTracker(); }
function togglePresetGen(gen) { activePresetGens.has(gen) ? activePresetGens.delete(gen) : activePresetGens.add(gen); document.querySelector(`button[data-gen="${gen}"]`).classList.toggle(`active-gen`); updateTracker(); }

function buildOptionsHTML(slotType, v1, v2, v3, curRaw, used, teamBases) {
    let html = `<option value="">-- ${slotType==1 ? t('主輸出') : slotType==2 ? t('副C/輔助') : t('生存/輔助')} --</option>`;
    let recs = new Map();
    let hasContext = (slotType === 1 && (v2 || v3)) || (slotType === 2 && (v1 || v3)) || (slotType === 3 && (v1 || v2));

    let availableDisplayChars = [];
    for (let name of ownedCharacters) { if (name === '漂泊者') { availableDisplayChars.push('光主', '暗主', '風主'); } else { availableDisplayChars.push(name); } }

    dpsData.forEach(d => {
        let match = false;
        if (hasContext) {
            match = true;
            if (slotType !== 1 && v1 && d.c1 !== v1) match = false;
            if (slotType !== 2 && v2 && d.c2 !== v2) match = false;
            if (slotType !== 3 && v3 && d.c3 !== v3) match = false;
        } else {
            if (slotType === 1 && checkedRotations.has(d.id)) match = true;
            if (slotType !== 1 && checkedRotations.has(d.id)) match = true;
        }

        if(match) {
            let target = slotType==1 ? d.c1 : slotType==2 ? d.c2 : d.c3;
            let isBlacklisted = (slotType === 1) && noRecChars.has(target);
            if(availableDisplayChars.includes(target) && !isBlacklisted) {
                let c1Avail = (slotType === 1) ? true : (d.c1 === v1 || (used[getBase(d.c1)]||0) < (charData[getBase(d.c1)]?.max||1));
                let c2Avail = (slotType === 2) ? true : (d.c2 === v2 || (used[getBase(d.c2)]||0) < (charData[getBase(d.c2)]?.max||1));
                let c3Avail = (slotType === 3) ? true : (d.c3 === v3 || (used[getBase(d.c3)]||0) < (charData[getBase(d.c3)]?.max||1));
                if (!recs.has(target)) recs.set(target, { maxDPS: 0, buildable: false });
                let data = recs.get(target);
                if (c1Avail && c2Avail && c3Avail) { data.buildable = true; let r = getRotDpsRange(d); if (r.min > data.maxDPS) data.maxDPS = r.min; }
            }
        }
    });

    if(recs.size > 0) {
        html += `<optgroup label="🔥 ${t('適配推薦')}">`;
        Array.from(recs.entries()).sort((a,b)=>b[1].maxDPS - a[1].maxDPS).forEach(([name, data]) => {
            let b = getBase(name), u = used[b]||0, m = charData[b]?.max||1, isEx = u >= m && getBase(curRaw)!==b;
            if(slotType==1 && isEx) return; 
            let dpsStr = (data.buildable && data.maxDPS > 0) ? `(${t('保底')} ${data.maxDPS.toFixed(2)}w)` : '';
            let tag = isEx ? ` 🛑[${t('耗盡')}]` : teamBases.has(b) && getBase(curRaw)!==b ? ` 🛑[${t('在隊')}]` : "";
            html += `<option value="${name}" ${tag?"disabled":""}>⭐ ${t(name)} ${dpsStr}${tag}</option>`;
        });
        html += '</optgroup>';
    }
    
    html += `<optgroup label="🔸 ${t('其他角色')}">`;
    let validOthers = availableDisplayChars.filter(name => {
        if (recs.has(name)) return false; 
        let b = getBase(name); return !(used[b] >= (charData[b]?.max || 1) && getBase(curRaw) !== b); 
    });

    validOthers.sort((a, b) => {
        if (slotType === 3) {
            let isSurvA = (charData[getBase(a)]?.type || "").includes("生存位") ? 1 : 0;
            let isSurvB = (charData[getBase(b)]?.type || "").includes("生存位") ? 1 : 0;
            if (isSurvA !== isSurvB) return isSurvB - isSurvA;
        }
        return characterOrder.indexOf(getBase(a)) - characterOrder.indexOf(getBase(b));
    });

    validOthers.forEach(name => {
        let b = getBase(name), inTeam = teamBases.has(b) && getBase(curRaw)!==b;
        html += `<option value="${name}" ${inTeam?'disabled':''}>${t(name)}${inTeam?` 🛑[${t('在隊')}]`:''}</option>`;
    });
    html += '</optgroup>'; return html;
}

function getMaxTeams(usedObj) {
    let baseRemains = {};
    for(let name of ownedCharacters) {
        let b = getBase(name);
        if(charData[b] && baseRemains[b]===undefined) { let r = charData[b].max - (usedObj[b]||0); if(r>0) baseRemains[b] = r; }
    }
    let counts = Object.values(baseRemains); let teams = 0;
    while(counts.length >= 3) { counts.sort((a,b)=>b-a); counts[0]--; counts[1]--; counts[2]--; teams++; counts = counts.filter(c=>c>0); }
    return Math.min(16, teams);
}

// --- 6. 血量反解與矩陣環境 ---
function initBossHPMap() {
    let env = { r1_hp: parseFloat(document.getElementById('env-r1').value) || 400.89, r2_hp: parseFloat(document.getElementById('env-r2').value) || 783.56, r3_hp: parseFloat(document.getElementById('env-r3').value) || 1384.9, growth: (parseFloat(document.getElementById('env-growth').value) || 5) / 100 };
    try {
        let stored = localStorage.getItem('ww_boss_hp'); if (stored) bossHPMap = JSON.parse(stored);
        let hist = localStorage.getItem('ww_boss_hp_history'); if (hist) bossHPHistory = JSON.parse(hist);
    } catch(e) {}

    for (let r = 1; r <= 10; r++) {
        for (let i = 1; i <= 4; i++) {
            let key = `R${r}-${i}`;
            if (!bossHPMap[key] || bossHPMap[key].isDefault) {
                let hp = (r === 1) ? env.r1_hp : (r === 2 && i === 1) ? 546.67 : (r === 2) ? env.r2_hp : (r === 3) ? env.r3_hp : env.r3_hp * (1 + env.growth * ((r - 4) * 4 + i));
                bossHPMap[key] = { value: hp, isDefault: true };
            }
        }
    }
    renderIndividualHPPanel();
}

function renderIndividualHPPanel() {
    let container = document.getElementById('individual-hp-container');
    if (!container) return;
    let html = '';
    for (let r = 1; r <= 10; r++) {
        for (let i = 1; i <= 4; i++) {
            let key = `R${r}-${i}`, data = bossHPMap[key], btnHtml = '';
            if (bossHPHistory[key] && bossHPHistory[key].length >= 3) {
                let avg = bossHPHistory[key].reduce((a, b) => a + b, 0) / bossHPHistory[key].length;
                if (Math.abs(avg - getBaseEnvHP(r, i)) / getBaseEnvHP(r, i) > 0.03 && data.isDefault) {
                    btnHtml = `<button class="btn-calib" onclick="applyCalibratedHP('${key}', ${avg})">⚠️ ${t('套用校正')}: ${avg.toFixed(1)}W</button>`;
                }
            }
            html += `<div class="hp-item"><span class="hp-label">${key}</span><input type="number" class="hp-input ${!data.isDefault?'calibrated':''}" id="hp_${key}" value="${data.value.toFixed(2)}" step="10" onchange="manualUpdateHP('${key}')">${btnHtml}</div>`;
        }
    }
    container.innerHTML = html;
}

function getBaseEnvHP(r, index) {
    let env = getEnvSettings();
    if (r === 1) return env.r1_hp; if (r === 2) return index === 1 ? 546.67 : env.r2_hp; if (r === 3) return env.r3_hp;
    return env.r3_hp * (1 + env.growth * ((r - 4) * 4 + index));
}

function getBossMaxHP(r, index) { return bossHPMap[`R${r}-${index}`] ? bossHPMap[`R${r}-${index}`].value : 400; }
function manualUpdateHP(key) {
    let val = parseFloat(document.getElementById(`hp_${key}`).value);
    if (!isNaN(val) && val > 0) { bossHPMap[key] = { value: val, isDefault: false }; try { localStorage.setItem('ww_boss_hp', JSON.stringify(bossHPMap)); } catch(e) {} renderIndividualHPPanel(); updateTracker(); }
}
function applyCalibratedHP(key, avgValue) {
    bossHPMap[key] = { value: avgValue, isDefault: false }; try { localStorage.setItem('ww_boss_hp', JSON.stringify(bossHPMap)); } catch(e) {}
    renderIndividualHPPanel(); updateTracker(); alert(t("已成功校正為平均值") + `：${avgValue.toFixed(2)} ` + t("萬") + `！`);
}
function resetIndividualHP() { bossHPMap = {}; bossHPHistory = {}; try { localStorage.removeItem('ww_boss_hp'); localStorage.removeItem('ww_boss_hp_history'); } catch(e) {} initBossHPMap(); }

function getEnvSettings() {
    return {
        scoreRatio: parseFloat(document.getElementById('env-ratio').value) || 10,
        r1_hp: parseFloat(document.getElementById('env-r1').value) || 400.89, r2_hp: parseFloat(document.getElementById('env-r2').value) || 783.56,
        r3_hp: parseFloat(document.getElementById('env-r3').value) || 1384.9, growth: (parseFloat(document.getElementById('env-growth').value) || 5) / 100,
        transTime: parseFloat(document.getElementById('env-trans').value) || 1.5, battleTime: parseFloat(document.getElementById('env-time').value) || 120,
        resPenalty: parseFloat(document.getElementById('env-res').value) || 40
    };
}

// --- 7. 初始化與表格邏輯 ---
function initBoard() {
    const b = document.getElementById('team-board');
    let rOpts = `<option value="">R?</option>` + Array.from({length:10}, (_,i)=>`<option value="${i+1}">R${i+1}</option>`).join('');
    let idxOpts = `<option value="">${t("號?")}</option>` + [1,2,3,4].map(idx=>`<option value="${idx}">${idx}</option>`).join('');
    
    for(let i=1; i<=16; i++) {
        let tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-weight:bold; color:#d4af37;">${t("第")} ${i} ${t("隊")}</td>
                        <td><select class="char-select" onchange="updateTracker()"></select></td>
                        <td><select class="char-select" onchange="updateTracker()"></select></td>
                        <td>
                            <select class="char-select" onchange="updateTracker()"></select>
                            <button onclick="resetRowDps(this)" class="btn-reset-dps">🔄 ${t('重設預設')} DPS</button>
                        </td>
                        <td style="font-size:0.85em; text-align:center;">
                            <input type="number" class="score-input" placeholder="${t('實戰得分')}" title="${t('打完結算給的總分')}"><br>
                            <div style="display:flex; justify-content:center; align-items:center; gap:2px; margin-bottom:4px; background:#1e2b24; padding:3px; border-radius:4px; border:1px solid #00ffaa;">
                                <span style="color:#00ffaa; font-weight:bold;">🎯${t('終')}:</span>
                                <select class="hp-calc-select end-boss-r">${rOpts}</select>
                                <span style="color:#00ffaa;">-</span>
                                <select class="hp-calc-select end-boss-idx">${idxOpts}</select>
                                <span style="color:#00ffaa; margin-left:2px;">🩸${t('剩')}:</span>
                                <input type="number" class="hp-calc-input end-boss-hp" placeholder="%" onblur="clampHpPct(this)">
                            </div>
                            <div class="res-chk-group">
                                <span style="color:#888;">${t('抗性王')}:</span>
                                <label><input type="checkbox" class="res-chk-1" onchange="updateTracker()">[1]</label>
                                <label><input type="checkbox" class="res-chk-2" onchange="updateTracker()">[2]</label>
                                <label><input type="checkbox" class="res-chk-3" onchange="updateTracker()">[3]</label>
                                <label><input type="checkbox" class="res-chk-4" onchange="updateTracker()">[4]</label>
                            </div>
                        </td>
                        <td class="relay-result" style="font-size:0.85em; text-align:left; padding-left:15px; border-left:2px solid #00ffaa;">-</td>`;
        b.appendChild(tr);
    }
}

function updateTracker() {
    initBossHPMap();
    let used = {}; for(let n in charData) used[n] = 0;
    document.querySelectorAll('.char-select').forEach(s => { if(s.value) used[getBase(s.value)]++; });
    
    document.querySelectorAll('#team-board tr').forEach(row => {
        let ss = row.querySelectorAll('select.char-select'), v1=ss[0].value, v2=ss[1].value, v3=ss[2].value;
        let bases = new Set([v1,v2,v3].filter(x=>x).map(x=>getBase(x)));
        ss.forEach((s, i) => {
            let h = buildOptionsHTML(i+1, v1, v2, v3, s.value, used, bases);
            if(s.innerHTML !== h) { let old = s.value; s.innerHTML = h; s.value = old; }
            s.classList.toggle('error', s.value && used[getBase(s.value)] > charData[getBase(s.value)].max);
        });
    });

    const tracker = document.getElementById('tracker');
    tracker.innerHTML = `<div style="background:#3f3f4e;padding:12px;border-radius:8px;margin-bottom:15px;border:1px solid #d4af37;text-align:center;">
        📊 ${t("理論最大")}：<span style="color:#4caf50;font-weight:bold;font-size:1.2em;">${getMaxTeams({})}</span> <span style="color:#aaa;">${t("隊")}</span> | ⏳ ${t("剩餘可排")}：<span style="color:#ffb300;font-weight:bold;font-size:1.2em;">${getMaxTeams(used)}</span> <span style="color:#aaa;">${t("隊")}</span>
    </div>`;

    let groups = { "生存位 (可用 2 次)": [], "一般角色 (可用 1 次)": [] };
    ownedCharacters.forEach(name => { let base = getBase(name); if(charData[base]) groups[charData[base].type].push(name); });
    for(let type in groups) {
        if(groups[type].length === 0) continue;
        tracker.innerHTML += `<div class="type-title">${t(type.split(" ")[0])} <span style="font-size:0.8em; color:#888;">${t(type.substring(type.indexOf("(")))}</span></div>`;
        groups[type].sort((a,b) => {
            let rA = charData[getBase(a)].max - (used[getBase(a)]||0), rB = charData[getBase(b)].max - (used[getBase(b)]||0);
            if(rA > 0 && rB <= 0) return -1; if(rA <= 0 && rB > 0) return 1; return characterOrder.indexOf(a) - characterOrder.indexOf(b);
        });
        groups[type].forEach(name => {
            let rem = charData[getBase(name)].max - (used[getBase(name)]||0);
            tracker.innerHTML += `<div class="char-row"><span>${t(name)}</span><span class="count-badge ${rem<=0?'count-empty':''}">${rem<=0?t('耗盡'):rem}</span></div>`;
        });
    }

    const ps = document.getElementById('preset-select');
    let ph = `<option value="">-- ${t("選擇推薦配隊")} --</option>`;
    dpsData.filter(d => checkedRotations.has(d.id) && isOwned(d.c1) && isOwned(d.c2) && isOwned(d.c3) && 
        (activePresetAttrs.size===0 || activePresetAttrs.has(charAttrMap[d.c1]||"未知")) &&
        (activePresetGens.size===0 || activePresetGens.has(d.gen.toString()))
    ).forEach(d => {
        let r = getRotDpsRange(d), dpsStr = (r.max > 0 || r.isCustom) ? `${r.min.toFixed(2)}~${r.max.toFixed(2)}w` : t('無DPS');
        ph += `<option value="${d.c1},${d.c2},${d.c3}">${t(d.c1)} + ${t(d.c2)} + ${t(d.c3)} (${dpsStr})</option>`;
    });
    ps.innerHTML = ph;

    // 雙軌推演引擎
    let env = getEnvSettings(), current_r_min = 1, current_index_min = 1, current_hp_min = getBossMaxHP(1, 1), current_r_max = 1, current_index_max = 1, current_hp_max = getBossMaxHP(1, 1), totalMatrixScoreMin = 0, totalMatrixScoreMax = 0;

    document.querySelectorAll('#team-board tr').forEach(row => {
        let ss = row.querySelectorAll('select.char-select'), c1 = ss[0].value, c2 = ss[1].value, c3 = ss[2].value;
        let resTd = row.querySelector('.relay-result'), chk_res = [row.querySelector('.res-chk-1').checked, row.querySelector('.res-chk-2').checked, row.querySelector('.res-chk-3').checked, row.querySelector('.res-chk-4').checked];

        if (c1 && c2 && c3) {
            let possibleRots = dpsData.filter(d => d.c1 === c1 && d.c2 === c2 && d.c3 === c3 && checkedRotations.has(d.id));
            if (possibleRots.length > 0) {
                possibleRots.sort((a,b) => getRotDpsRange(b).min - getRotDpsRange(a).min);
                let dpsRange = getRotDpsRange(possibleRots[0]);
                if (dpsRange.max <= 0) { resTd.innerHTML = `<span style="color:#d32f2f;">${t("DPS過低")}<br>${t("無法推演")}</span>`; return; }

                let simulate = (hp, r, idx, dps) => {
                    let t_left = env.battleTime, dmg = 0, startStr = `R${r}-${idx}(${(hp/getBossMaxHP(r,idx)*100).toFixed(0)}%)`;
                    while (t_left > 0) {
                        let eff_dps = dps * (chk_res[idx - 1] ? (1 - env.resPenalty / 100) : 1);
                        if (eff_dps <= 0) break;
                        let ttk = hp / eff_dps;
                        if (ttk <= t_left) { dmg += hp; t_left -= (ttk + env.transTime); idx++; if (idx > 4) { r++; idx = 1; } hp = getBossMaxHP(r, idx); } 
                        else { dmg += eff_dps * t_left; hp -= eff_dps * t_left; t_left = 0; }
                    }
                    return { hp, r, idx, dmg, endStr: `R${r}-${idx}(${(hp/getBossMaxHP(r,idx)*100).toFixed(0)}%)`, startStr };
                };

                let resMin = simulate(current_hp_min, current_r_min, current_index_min, dpsRange.min);
                current_hp_min = resMin.hp; current_r_min = resMin.r; current_index_min = resMin.idx; totalMatrixScoreMin += resMin.dmg * env.scoreRatio;

                let resMax = simulate(current_hp_max, current_r_max, current_index_max, dpsRange.max);
                current_hp_max = resMax.hp; current_r_max = resMax.r; current_index_max = resMax.idx; totalMatrixScoreMax += resMax.dmg * env.scoreRatio;

                resTd.innerHTML = `<div style="line-height:1.4;"><span style="color:#aaa;">${t("下限")}:</span> <span style="color:#ffaa00;">${resMin.startStr} ➔ ${resMin.endStr}</span><br><span style="color:#aaa;">${t("上限")}:</span> <span style="color:#00ffaa;">${resMax.startStr} ➔ ${resMax.endStr}</span><br><span style="color:#cf00ff; font-weight:bold;">${Math.floor(resMin.dmg * env.scoreRatio).toLocaleString()} ~ ${Math.floor(resMax.dmg * env.scoreRatio).toLocaleString()} ${t("分")}</span></div>`;
            } else { resTd.innerHTML = "-"; }
        } else { resTd.innerHTML = "-"; }
    });

    document.getElementById('matrix-total-score').innerText = `${Math.floor(totalMatrixScoreMin).toLocaleString()} ~ ${Math.floor(totalMatrixScoreMax).toLocaleString()} ` + t("分");
    saveData();
}

// --- 8. 無損洗牌與代數反解 ---
function reverseInferAndOptimize() {
    initBossHPMap();
    let env = getEnvSettings(), currentTeams = [], rows = document.querySelectorAll('#team-board tr'), start_r = 1, start_idx = 1, start_hp = getBossMaxHP(1, 1);

    rows.forEach((row) => {
        let ss = row.querySelectorAll('select.char-select'), c1 = ss[0].value, c2 = ss[1].value, c3 = ss[2].value;
        let scoreInput = row.querySelector('.score-input').value, ebR = row.querySelector('.end-boss-r').value, ebIdx = row.querySelector('.end-boss-idx').value, ebHp = row.querySelector('.end-boss-hp').value;
        let chk_res = [row.querySelector('.res-chk-1').checked, row.querySelector('.res-chk-2').checked, row.querySelector('.res-chk-3').checked, row.querySelector('.res-chk-4').checked];

        if (c1) { 
            let rotId = null, calculatedMinDps = 0;
            let possibleRots = dpsData.filter(d => d.c1 === c1 && d.c2 === c2 && d.c3 === c3 && checkedRotations.has(d.id));
            if (possibleRots.length > 0) { possibleRots.sort((a,b) => getRotDpsRange(b).min - getRotDpsRange(a).min); rotId = possibleRots[0].id; }

            let actualScore = parseFloat(scoreInput);
            if (!isNaN(actualScore) && actualScore > 0 && rotId) {
                let dmg_left = actualScore / env.scoreRatio, kills = 0, effective_dmg_sum = 0, tmp_r = start_r, tmp_idx = start_idx, tmp_hp = start_hp, dmgDealtToKilledBosses = 0;

                while (dmg_left > 0) {
                    let r_factor = chk_res[tmp_idx - 1] ? (1 - env.resPenalty / 100) : 1; if (r_factor <= 0) r_factor = 0.1; 
                    if (dmg_left >= tmp_hp) {
                        dmg_left -= tmp_hp; dmgDealtToKilledBosses += tmp_hp; effective_dmg_sum += (tmp_hp / r_factor);
                        kills++; tmp_idx++; if (tmp_idx > 4) { tmp_r++; tmp_idx = 1; } tmp_hp = getBossMaxHP(tmp_r, tmp_idx);
                    } else {
                        effective_dmg_sum += (dmg_left / r_factor);
                        let ebRInt = parseInt(ebR), ebIdxInt = parseInt(ebIdx), ebHpPct = parseFloat(ebHp);
                        if (!isNaN(ebRInt) && !isNaN(ebIdxInt) && !isNaN(ebHpPct) && ebRInt === tmp_r && ebIdxInt === tmp_idx && ebHpPct >= 0.01 && ebHpPct <= 100) {
                            let dmgDoneToEndBoss = (actualScore / env.scoreRatio) - dmgDealtToKilledBosses;
                            let trueTotalHP = dmgDoneToEndBoss / (1 - (ebHpPct / 100));
                            let hKey = `R${ebRInt}-${ebIdxInt}`;
                            if (!bossHPHistory[hKey]) bossHPHistory[hKey] = []; bossHPHistory[hKey].push(trueTotalHP);
                        }
                        tmp_hp -= dmg_left; dmg_left = 0;
                    }
                }
                
                let effective_time = env.battleTime - (kills * env.transTime);
                let trueBaseDps = effective_time > 0 ? (effective_dmg_sum / effective_time) : 0;

                if (trueBaseDps > 0) {
                    let currStats = customStatsMap[rotId] || { stability: 100, buff: 0 };
                    customStatsMap[rotId] = { dps: trueBaseDps, stability: currStats.stability, buff: currStats.buff };
                    calculatedMinDps = trueBaseDps * (currStats.stability / 100);
                }
                start_r = tmp_r; start_idx = tmp_idx; start_hp = tmp_hp;
            } else if (rotId) { calculatedMinDps = getRotDpsRange(possibleRots[0]).min; }
            
            currentTeams.push({ c1, c2, c3, scoreInput, ebR, ebIdx, ebHp, chk_res, calculatedMinDps });
        }
    });
    
    try { localStorage.setItem('ww_custom_stats', JSON.stringify(customStatsMap)); localStorage.setItem('ww_boss_hp_history', JSON.stringify(bossHPHistory)); } catch(e) {}
    renderIndividualHPPanel(); renderRotations();

    if (currentTeams.length > 0) {
        currentTeams.sort((a, b) => b.calculatedMinDps - a.calculatedMinDps);
        document.querySelectorAll('.char-select, .score-input, .end-boss-r, .end-boss-idx, .end-boss-hp').forEach(el => el.value = "");
        document.querySelectorAll('input[type="checkbox"][class^="res-chk"]').forEach(c => c.checked = false);

        currentTeams.forEach((tData, index) => {
            let row = rows[index];
            if(row) {
                let ss = row.querySelectorAll('select.char-select');
                if(ss[0].querySelector(`option[value="${tData.c1}"]`) == null) ss[0].innerHTML += `<option value="${tData.c1}">${tData.c1}</option>`;
                if(ss[1].querySelector(`option[value="${tData.c2}"]`) == null) ss[1].innerHTML += `<option value="${tData.c2}">${tData.c2}</option>`;
                if(ss[2].querySelector(`option[value="${tData.c3}"]`) == null) ss[2].innerHTML += `<option value="${tData.c3}">${tData.c3}</option>`;
                ss[0].value = tData.c1; ss[1].value = tData.c2; ss[2].value = tData.c3;
                row.querySelector('.score-input').value = tData.scoreInput || ""; row.querySelector('.end-boss-r').value = tData.ebR || "";
                row.querySelector('.end-boss-idx').value = tData.ebIdx || ""; row.querySelector('.end-boss-hp').value = tData.ebHp || "";
                row.querySelector('.res-chk-1').checked = tData.chk_res[0]; row.querySelector('.res-chk-2').checked = tData.chk_res[1];
                row.querySelector('.res-chk-3').checked = tData.chk_res[2]; row.querySelector('.res-chk-4').checked = tData.chk_res[3];
            }
        });
        alert(t("✅ 實戰反推與無損洗牌完成！"));
    }
    updateTracker();
}

function autoBuildMaxDpsTeams() {
    if(!confirm(t("將清空當前編隊並自動生成極限陣容，確定執行？"))) return;
    let validTeams = dpsData.filter(d => checkedRotations.has(d.id) && isOwned(d.c1) && isOwned(d.c2) && isOwned(d.c3));
    validTeams.sort((a, b) => getRotDpsRange(b).min - getRotDpsRange(a).min);
    let charUsageCount = {}; for(let n in charData) charUsageCount[n] = 0;
    let finalOptimizedTeams = [];

    for (let team of validTeams) {
        let b1 = getBase(team.c1), b2 = getBase(team.c2), b3 = getBase(team.c3);
        let u1 = charUsageCount[b1] || 0, u2 = charUsageCount[b2] || 0, u3 = charUsageCount[b3] || 0;
        if (u1 < (charData[b1]?.max||1) && u2 < (charData[b2]?.max||1) && u3 < (charData[b3]?.max||1)) {
            if (b1 === b2 || b1 === b3 || b2 === b3) continue;
            finalOptimizedTeams.push(team); charUsageCount[b1]=u1+1; charUsageCount[b2]=u2+1; charUsageCount[b3]=u3+1;
        }
        if (finalOptimizedTeams.length >= 16) break;
    }

    document.querySelectorAll('.char-select, .score-input, .end-boss-hp, .end-boss-r, .end-boss-idx').forEach(el => el.value="");
    document.querySelectorAll('input[type="checkbox"][class^="res-chk"]').forEach(c => c.checked=false);
    
    let rows = document.querySelectorAll('#team-board tr');
    finalOptimizedTeams.forEach((tData, index) => {
        if(rows[index]) {
            let ss = rows[index].querySelectorAll('select.char-select');
            ss[0].innerHTML = `<option value="${tData.c1}">${tData.c1}</option>`;
            ss[1].innerHTML = `<option value="${tData.c2}">${tData.c2}</option>`;
            ss[2].innerHTML = `<option value="${tData.c3}">${tData.c3}</option>`;
            ss[0].value = tData.c1; ss[1].value = tData.c2; ss[2].value = tData.c3;
        }
    });
    updateTracker(); alert(t(`一鍵配置完成！共組建 `) + finalOptimizedTeams.length + t(` 隊。`));
}

function applyPreset() {
    let val = document.getElementById('preset-select').value; if(!val) return;
    let cs = val.split(','), rows = document.querySelectorAll('#team-board tr'), applied = false;
    for(let r of rows) {
        let ss = r.querySelectorAll('select.char-select');
        if(!ss[0].value && !ss[1].value && !ss[2].value) { ss[0].value=cs[0]; ss[1].value=cs[1]; ss[2].value=cs[2]; applied = true; break; }
    }
    if(!applied) alert(t("沒有空白隊伍了！")); updateTracker();
}

function resetTeams() { 
    if(!confirm(t("確定清空編隊表嗎？"))) return;
    document.querySelectorAll('.char-select, .score-input, .end-boss-hp, .end-boss-r, .end-boss-idx').forEach(el => el.value="");
    document.querySelectorAll('input[type="checkbox"][class^="res-chk"]').forEach(c => c.checked=false);
    updateTracker(); 
}

function saveData() {
    try {
        localStorage.setItem('ww_roster', JSON.stringify([...ownedCharacters]));
        localStorage.setItem('ww_rotations', JSON.stringify([...checkedRotations]));
        let teams = []; document.querySelectorAll('#team-board tr').forEach(r => teams.push([...r.querySelectorAll('select.char-select')].map(s=>s.value)));
        localStorage.setItem('ww_teams', JSON.stringify(teams));
    } catch(e) {}
}

function submitToGoogleForm() {
    if(!confirm(t("您即將匿名提交當前表單上的數據，是否繼續？"))) return;
    let dataParams = []; let rows = document.querySelectorAll('#team-board tr');
    dataParams.push("主C,副C,生存,實戰分數,終點王R,終點王隻數,剩餘血量%,王1抗,王2抗,王3抗,王4抗");
    rows.forEach((r) => {
        let ss = r.querySelectorAll('select.char-select'), score = r.querySelector('.score-input').value, ebR = r.querySelector('.end-boss-r').value, ebIdx = r.querySelector('.end-boss-idx').value, ebHp = r.querySelector('.end-boss-hp').value;
        if(ss[0].value && ss[1].value && ss[2].value && score) {
            let res1 = r.querySelector('.res-chk-1').checked ? 1 : 0, res2 = r.querySelector('.res-chk-2').checked ? 1 : 0, res3 = r.querySelector('.res-chk-3').checked ? 1 : 0, res4 = r.querySelector('.res-chk-4').checked ? 1 : 0;
            dataParams.push(`${ss[0].value},${ss[1].value},${ss[2].value},${score},${ebR},${ebIdx},${ebHp},${res1},${res2},${res3},${res4}`);
        }
    });
    if (dataParams.length === 1) return alert(t("請先填寫實戰得分！"));
    let csvReport = dataParams.join('\n');
    window.open(`https://docs.google.com/forms/d/e/1FAIpQLSfB2g_uLwL7D2O1uUuM1iEaWkO7q29Xm9eG-8yPqg6Vw/viewform?usp=pp_url&entry.956555135=${encodeURIComponent(csvReport)}`, '_blank');
}

function exportImage() {
    const rows = document.querySelectorAll('#team-board tr'); let completed = [];
    rows.forEach((r, i) => {
        let ss = r.querySelectorAll('select.char-select'), resTd = r.querySelector('.relay-result'), score = r.querySelector('.score-input').value;
        if(ss[0].value && ss[1].value && ss[2].value) {
            let resText = resTd.innerText.replace(/\n/g, ' | '), finalScore = score ? `${t('實得分')}: ${score}` : resText;
            completed.push({id: i+1, c1: ss[0].value, c2: ss[1].value, c3: ss[2].value, res: finalScore});
        }
    });
    if(!completed.length) return alert(t("請先完成至少一支滿編隊伍！"));
    let box = document.createElement('div'); box.style = "position:absolute; left:-9999px; background:#1e1e24; color:#fff; padding:30px; border-radius:15px; width:1000px; font-family:'Segoe UI',sans-serif;";
    let h = `<h2 style="color:#d4af37; text-align:center; border-bottom:2px solid #d4af37; padding-bottom:10px;">${t("鳴潮矩陣實戰推演編隊表")}</h2><table style="width:100%; border-collapse:collapse; margin-top:20px; text-align:center; font-size:1.1em;">`;
    h += `<tr style="background:#3f3f4e; color:#d4af37;"><th>${t("關卡")}</th><th>${t("主輸出")}</th><th>${t("副C/輔助")}</th><th>${t("生存/輔助")}</th><th style="color:#00ffaa;">${t("推演戰果 / 實戰得分")}</th></tr>`;
    completed.forEach(tData => h += `<tr><td style="border:1px solid #555; padding:15px; font-weight:bold; color:#4caf50;">${t("第")} ${tData.id} ${t("隊")}</td><td style="border:1px solid #555; padding:15px;">${t(tData.c1)}</td><td style="border:1px solid #555; padding:15px;">${t(tData.c2)}</td><td style="border:1px solid #555; padding:15px;">${t(tData.c3)}</td><td style="border:1px solid #555; padding:15px; font-size:0.85em; text-align:left;">${tData.res}</td></tr>`);
    box.innerHTML = h + `</table><div style="margin-top:20px; text-align:right; color:#888; font-size:0.9em;">${t("總分預估")}：${document.getElementById('matrix-total-score').innerText} | ${t("生成時間")}：${new Date().toLocaleString()}</div>`;
    document.body.appendChild(box);
    html2canvas(box, { backgroundColor: '#1e1e24', scale: 2 }).then(c => { let l = document.createElement('a'); l.download = '鳴潮矩陣推演編隊表.png'; l.href = c.toDataURL('image/png'); l.click(); document.body.removeChild(box); });
}

// --- 9. 初始化啟動引擎 ---
function initializeApp() {
    initBoard();
    try { isSimp = localStorage.getItem('ww_lang') === 'zh-CN'; } catch(e){}
    if (isSimp) document.getElementById('lang-toggle').innerText = "繁";
    
    try {
        const sr = localStorage.getItem('ww_roster');
        if (sr) {
            let parsed = JSON.parse(sr);
            if (Array.isArray(parsed)) { ownedCharacters.clear(); parsed.forEach(name => { if (charData[name] || ['光主','暗主','風主'].includes(name)) ownedCharacters.add(name); }); }
        } else { ownedCharacters = new Set(Object.keys(charData)); }
    } catch(e) { ownedCharacters = new Set(Object.keys(charData)); }

    try {
        const srot = localStorage.getItem('ww_rotations');
        if (srot) {
            let parsed = JSON.parse(srot);
            if (Array.isArray(parsed)) { checkedRotations.clear(); const validIds = new Set(dpsData.map(d => d.id)); parsed.forEach(id => { if (validIds.has(id)) checkedRotations.add(id); }); }
        } else { checkedRotations = new Set(dpsData.map(d => d.id)); }
    } catch(e) { checkedRotations = new Set(dpsData.map(d => d.id)); }

    try { let stored = localStorage.getItem('ww_custom_stats'); if (stored) customStatsMap = JSON.parse(stored); } catch(e) {}

    document.getElementById('skill-slider').value = 100; updateMasterSkill();
    
    renderCheckboxes(); renderRotations();
    
    try {
        const st = localStorage.getItem('ww_teams');
        if (st) {
            const pt = JSON.parse(st);
            document.querySelectorAll('#team-board tr').forEach((r, i) => {
                if (pt[i]) {
                    let ss = r.querySelectorAll('select.char-select');
                    if (pt[i][0]) { ss[0].innerHTML = `<option value="${pt[i][0]}">${t(pt[i][0])}</option>`; ss[0].value = pt[i][0]; }
                    if (pt[i][1]) { ss[1].innerHTML = `<option value="${pt[i][1]}">${t(pt[i][1])}</option>`; ss[1].value = pt[i][1]; }
                    if (pt[i][2]) { ss[2].innerHTML = `<option value="${pt[i][2]}">${t(pt[i][2])}</option>`; ss[2].value = pt[i][2]; }
                }
            });
        }
    } catch(e) {}
    
    updateTracker(); 
    // 預設切換到第一頁
    document.querySelectorAll('.tab-btn')[0].click();
    translateDOM(document.body);
}

initializeApp();
