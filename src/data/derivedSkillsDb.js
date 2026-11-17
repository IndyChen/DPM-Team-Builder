// Auto-generated from gemini-4-carbon full 65-character Nanoka 3.8 + client text audit.
// Records exact text-verified damage types (skillTypeFixes) and unlockable/triggerable derived skills (ROLE_DERIVED_SKILLS_DB).

export const ROLE_SKILL_TYPE_FIXES_DB = {
  "散華": [
    {
      "name": "無明心音·冰川爆炸傷害",
      "currentType": "重擊",
      "correctType": "共技",
      "note": "共鳴回路【無明心音】冰綻：重擊爆裂會引爆【冰棘】、【冰棱】和【冰川】，冰綻造成的傷害為共鳴技能傷害。"
    },
    {
      "name": "無明心音·冰棱爆炸傷害",
      "currentType": "重擊",
      "correctType": "共技",
      "note": "共鳴回路【無明心音】冰綻：冰綻造成的傷害為共鳴技能傷害。"
    },
    {
      "name": "無明心音·冰棘爆炸傷害",
      "currentType": "重擊",
      "correctType": "共技",
      "note": "共鳴回路【無明心音】冰綻：冰綻造成的傷害為共鳴技能傷害。"
    }
  ],
  "凌陽": [
    {
      "name": "常態·凜凜威風拳·起勢·縱地金光傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "本地將重擊（145.73%）誤標為起勢·縱地金光且標為普攻；常態重擊與回路【重擊·起勢·縱地金光】均屬重擊傷害。"
    },
    {
      "name": "形神合一·技能傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "Lv.10倍率172.37%對應共鳴回路【重擊·起勢·縱地金光】，施放重擊時觸發，為重擊傷害。"
    },
    {
      "name": "形神合一·狂態·搖光金獅舞第一段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路【行獅】：凌陽的普攻替換為普攻狂態·搖光金獅舞，屬普攻傷害。"
    },
    {
      "name": "形神合一·狂態·搖光金獅舞第二段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路【行獅】：凌陽的普攻替換為普攻狂態·搖光金獅舞，屬普攻傷害。"
    },
    {
      "name": "形神合一·凌雲式·腿打連環傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路【行獅】：短按普攻施放「普攻凌雲式·腿打連環」，屬普攻傷害。"
    },
    {
      "name": "形神合一·登樓·尾墜千斤傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路【空中攻擊·登樓·尾墜千斤】：空中下落攻擊在鳴潮中歸類為普攻傷害。"
    }
  ],
  "折枝": [
    {
      "name": "虛實境趣·墨鶴傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放【虛實境趣】：召喚墨鶴進行協同攻擊，造成冷凝傷害，「此次傷害為普攻傷害」。"
    }
  ],
  "珂萊塔": [
    {
      "name": "緘默執行·限制性策略傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊【重擊·限制性策略】：【靈萃】充滿時施放的重擊替換為限制性策略，屬重擊傷害。"
    },
    {
      "name": "新浪潮時代·技能傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴解放【新浪潮時代】：對範圍內目標造成冷凝傷害，「此次傷害為共鳴技能傷害」。"
    },
    {
      "name": "新浪潮時代·死兆傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴解放【死兆】：使用銃槍射擊並召喚4枚晶體攻擊目標，「此次傷害為共鳴技能傷害」。"
    },
    {
      "name": "新浪潮時代·致死以終傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴解放【致死以終】：對範圍內目標造成冷凝傷害，「此次傷害為共鳴技能傷害」。"
    }
  ],
  "穗穗": [
    {
      "name": "穗搖金·重明枕露傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "重明枕露與飛燕裁風文本皆為「消耗耐力進行空中下落攻擊」，無視為共鳴技能傷害說明，下落攻擊屬普攻傷害"
    },
    {
      "name": "穗搖金·飛燕裁風傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "飛燕裁風文本為「消耗耐力進行空中下落攻擊」，無視為共鳴技能傷害說明，下落攻擊屬普攻傷害"
    }
  ],
  "熾霞": [
    {
      "name": "英魂熾火流·熱壓彈傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「共鳴技能·咔咔壓制」原文明確寫道：持續消耗【熱壓彈】攻擊目標，造成熱熔傷害，此次傷害為共鳴技能傷害"
    },
    {
      "name": "英魂熾火流·轟轟傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「共鳴技能·轟轟」原文明確寫道：造成熱熔傷害，此次傷害為共鳴技能傷害"
    }
  ],
  "安可": [
    {
      "name": "黑咩大暴走·黑咩·胡鬧第一段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「普攻·黑咩·胡鬧」原文明確寫道：此次傷害為普攻傷害"
    },
    {
      "name": "黑咩大暴走·黑咩·胡鬧第二段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「普攻·黑咩·胡鬧」原文明確寫道：此次傷害為普攻傷害"
    },
    {
      "name": "黑咩大暴走·黑咩·胡鬧第三段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「普攻·黑咩·胡鬧」原文明確寫道：此次傷害為普攻傷害"
    },
    {
      "name": "黑咩大暴走·黑咩·胡鬧第四段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「普攻·黑咩·胡鬧」原文明確寫道：此次傷害為普攻傷害"
    },
    {
      "name": "黑咩大暴走·黑咩·狂熱傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴解放「共鳴技能·黑咩·狂熱」原文明確寫道：此次傷害為共鳴技能傷害"
    },
    {
      "name": "黑咩大暴走·黑咩·閃避反擊傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「黑咩·閃避反擊」原文明確寫道：此次傷害為普攻傷害"
    }
  ],
  "莫特斐": [
    {
      "name": "即興發揮·瞄準傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「重擊」段落描述進入瞄準狀態射擊，屬於重擊傷害"
    },
    {
      "name": "即興發揮·瞄準完全蓄力傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「重擊」段落描述蓄力完成後攻擊目標，屬於重擊傷害"
    }
  ],
  "布蘭特": [
    {
      "name": "起錨！·下落攻擊傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能「空中下落攻擊」原文明確寫道：消耗耐力進行空中下落攻擊，造成熱熔傷害，此次傷害為普攻傷害"
    }
  ],
  "露帕": [
    {
      "name": "燃星·空中攻擊·焰襲傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「空中攻擊·焰襲」原文明確寫道：消耗耐力攻擊目標，造成熱熔傷害，此次傷害為重擊傷害"
    },
    {
      "name": "焰狼宣告·此刻，讓火焰延燃賽場傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴回路「共鳴技能·此刻，讓火焰延燃賽場」原文明確寫道：造成熱熔傷害，此次傷害為共鳴技能傷害"
    },
    {
      "name": "榮光歡酣於火·破敵傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴解放內子技能標題為「共鳴技能·破敵」，且無視為共鳴解放傷害之描述，應為共鳴技能傷害"
    },
    {
      "name": "你在看哪裡？·技能傷害",
      "currentType": "共解",
      "correctType": "變奏",
      "note": "「你在看哪裡？」為基礎變奏技能，僅強化版「你無法逃離！」才視為共鳴解放傷害"
    }
  ],
  "嘉貝莉娜": [
    {
      "name": "獵魔扳機·普攻第一段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「普攻」原文明確寫道：普攻第1段、普攻第2段、普攻第3段傷害為重擊傷害"
    },
    {
      "name": "獵魔扳機·普攻第二段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「普攻」原文明確寫道：普攻第1段、普攻第2段、普攻第3段傷害為重擊傷害"
    },
    {
      "name": "獵魔扳機·普攻第三段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「普攻」原文明確寫道：普攻第1段、普攻第2段、普攻第3段傷害為重擊傷害"
    },
    {
      "name": "獵魔扳機·閃避反擊·血債將償傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "「閃避反擊·血債將償」原文明確寫道：此次傷害為重擊傷害"
    },
    {
      "name": "獵魔扳機·空中攻擊·槍彈暴雨下落攻擊傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "「空中攻擊·槍彈暴雨」原文明確寫道：短按普攻消耗耐力進行空中下落攻擊，此次傷害為重擊傷害"
    },
    {
      "name": "獵魔扳機·空中攻擊·槍彈暴雨持續掃射傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "「空中攻擊·槍彈暴雨」原文明確寫道：按住普攻對正下方目標進行掃射，此次傷害為重擊傷害"
    },
    {
      "name": "邊緣翼動·共鳴技能·迫近傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "「共鳴技能·迫近」原文明確寫道：造成熱熔傷害，此次傷害為重擊傷害"
    },
    {
      "name": "邊緣翼動·共鳴技能·惡翼揚升傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "「共鳴技能·惡翼揚升」原文明確寫道：造成熱熔傷害，此次傷害視為重擊傷害"
    },
    {
      "name": "超閾限·重擊·煉羽裁決第三段傷害",
      "currentType": "重擊",
      "correctType": "聲骸",
      "note": "共鳴回路「重擊·煉羽裁決」原文明確寫道：進行最多3段的連續攻擊，第3段傷害為聲骸技能傷害"
    }
  ],
  "莫寧": [
    {
      "name": "質能等價·諧振場傷害",
      "currentType": "重擊",
      "correctType": "共解",
      "note": "共鳴回路「質能等價」明確記載：展開諧振場時，造成熱熔傷害，此次傷害為共鳴解放傷害（且Lv10倍率應為39.77%*5=198.85%，本地誤填治療量20.24%且後續三項倍率錯位）。"
    }
  ],
  "愛彌斯": [
    {
      "name": "共赴長航·普攻·機兵第一段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "「普攻·機兵」為構型切換後的普攻招式，文本無視為共鳴技能傷害之描述，屬於普攻傷害。"
    },
    {
      "name": "共赴長航·普攻·機兵第二段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "「普攻·機兵」屬於普攻傷害。"
    },
    {
      "name": "共赴長航·普攻·機兵第三段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "「普攻·機兵」屬於普攻傷害。"
    },
    {
      "name": "共赴長航·普攻·機兵第四段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "「普攻·機兵」屬於普攻傷害。"
    },
    {
      "name": "共赴長航·空中攻擊·機兵傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "「空中攻擊·機兵」為消耗耐力進行空中下落攻擊，屬於普攻傷害。"
    },
    {
      "name": "共赴長航·閃避反擊·機兵傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "「閃避反擊·機兵」為成功閃避後短按普攻，屬於普攻傷害。"
    }
  ],
  "達妮婭": [
    {
      "name": "泡沫蜜餌·放逐·幻滅之形第一段傷害",
      "currentType": "共技",
      "correctType": "共解",
      "note": "共鳴技能「放逐·幻滅之形」段落記載：該技能傷害為共鳴解放傷害。"
    },
    {
      "name": "泡沫蜜餌·放逐·幻滅之形第二段傷害",
      "currentType": "共技",
      "correctType": "共解",
      "note": "共鳴技能「放逐·幻滅之形」明確記載：放逐·幻滅之形第2段消耗所有【黯核】造成熱熔傷害，該技能傷害為共鳴解放傷害。"
    },
    {
      "name": "「天衣無縫」·蝕域每次傷害",
      "currentType": "共技",
      "correctType": "共解",
      "note": "共鳴回路「天衣無縫」明確記載：蝕域每4秒發動1次攻擊，對目標造成熱熔傷害。該技能傷害為共鳴解放傷害。"
    }
  ],
  "景燃": [
    {
      "name": "死生徘徊·普攻·攝召第三段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「死生徘徊」記載：施放普攻·攝召第3段時可獲得50點【炁】，且此傷害為重擊傷害。"
    },
    {
      "name": "死生徘徊·普攻·攝召第四段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「死生徘徊」記載：施放普攻·攝召第4段時可獲得50點【炁】，且此傷害為重擊傷害。"
    },
    {
      "name": "死生徘徊·普攻·滅煞第三段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「死生徘徊」記載：施放普攻·滅煞第3段時可獲得50點【炁】，且此傷害為重擊傷害。"
    },
    {
      "name": "死生徘徊·普攻·滅煞第四段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「死生徘徊」記載：施放普攻·滅煞第4段時可獲得50點【炁】，且此傷害為重擊傷害。"
    },
    {
      "name": "死生徘徊·閃避反擊·探幽傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「死生徘徊」記載：施放閃避反擊·探幽時可獲得100點【炁】，且此傷害為重擊傷害。"
    },
    {
      "name": "死生徘徊·閃避反擊·守明傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊「死生徘徊」記載：施放閃避反擊·守明時可獲得100點【炁】，且此傷害為重擊傷害。"
    },
    {
      "name": "撞煞·黃泉渡傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "共鳴技能「撞煞」記載：施放共鳴技能·黃泉渡，攻擊目標，造成熱熔傷害，本次傷害為重擊傷害。"
    },
    {
      "name": "撞煞·往生送傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "共鳴技能「撞煞」記載：施放共鳴技能·往生送，攻擊目標，造成熱熔傷害，本次傷害為重擊傷害。"
    },
    {
      "name": "萬鬼同葬傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放「萬鬼同葬」記載：攻擊目標，造成熱熔傷害，本次傷害為重擊傷害。"
    },
    {
      "name": "萬鬼同葬·魑魅魍魎傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放「萬鬼同葬」記載：召喚魑魅魍魎進行攻擊，造成熱熔傷害，本次傷害為重擊傷害。"
    }
  ],
  "卡卡羅": [
    {
      "name": "幻影蝕刻·獵犬劍技·狂噬影獄第一段",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「幻影蝕刻」記載：普攻·獵犬劍技·狂噬影獄進行最多5段的連續攻擊，造成導電傷害，此次傷害為普攻傷害。"
    },
    {
      "name": "幻影蝕刻·獵犬劍技·狂噬影獄第二段",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「幻影蝕刻」記載：普攻·獵犬劍技·狂噬影獄，此次傷害為普攻傷害。"
    },
    {
      "name": "幻影蝕刻·獵犬劍技·狂噬影獄第三段",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「幻影蝕刻」記載：普攻·獵犬劍技·狂噬影獄，此次傷害為普攻傷害。"
    },
    {
      "name": "幻影蝕刻·獵犬劍技·狂噬影獄第四段",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「幻影蝕刻」記載：普攻·獵犬劍技·狂噬影獄，此次傷害為普攻傷害。"
    },
    {
      "name": "幻影蝕刻·獵犬劍技·狂噬影獄第五段",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「幻影蝕刻」記載：普攻·獵犬劍技·狂噬影獄，此次傷害為普攻傷害。"
    },
    {
      "name": "幻影蝕刻·重擊傷害",
      "currentType": "重擊",
      "correctType": "共解",
      "note": "共鳴解放「幻影蝕刻」記載：殺戮武裝下重擊的傷害提升，此次傷害為共鳴解放傷害。"
    },
    {
      "name": "幻影蝕刻·「必要的手段」傷害",
      "currentType": "共解",
      "correctType": "變奏",
      "note": "共鳴解放「幻影蝕刻」記載：狀態結束後下次變奏技能替換為變奏技能「必要的手段」，此次傷害為變奏技能傷害。"
    },
    {
      "name": "獵殺使命·「死告」傷害",
      "currentType": "重擊",
      "correctType": "共解",
      "note": "共鳴回路「獵殺使命」記載：施放重擊「死告」時，消耗5點【殺意】，造成導電傷害，此次傷害為共鳴解放傷害。"
    }
  ],
  "吟霖": [
    {
      "name": "千面魅影傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "共鳴回路「千面魅影」明確記載：千面魅影造成的傷害為重擊傷害。"
    }
  ],
  "淵武": [
    {
      "name": "沉雷藏鋒·掀雷傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路與固有技能「決電」明確記載：「共鳴技能掀雷」，由共鳴技能雷之楔在【鋒芒】充滿時施放，屬於共鳴技能傷害。"
    }
  ],
  "今汐": [
    {
      "name": "萬物一心·凌霄·普攻第一段傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「萬物一心」明確記載：普攻替換為普攻凌霄·普攻，造成衍射傷害，此次傷害為共鳴技能傷害。"
    },
    {
      "name": "萬物一心·凌霄·普攻第二段傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「萬物一心」明確記載：普攻凌霄·普攻，此次傷害為共鳴技能傷害。"
    },
    {
      "name": "萬物一心·凌霄·普攻第三段傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「萬物一心」明確記載：普攻凌霄·普攻，此次傷害為共鳴技能傷害。"
    },
    {
      "name": "萬物一心·凌霄·普攻第四段傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「萬物一心」明確記載：普攻凌霄·普攻，此次傷害為共鳴技能傷害。"
    },
    {
      "name": "萬物一心·凌霄·閃避反擊傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路「萬物一心」記載：閃避反擊替換為閃避反擊凌霄·閃避反擊，造成衍射傷害（並無「此次傷害為共鳴技能傷害」描述，保留常態閃避反擊之普攻傷害類型）。"
    }
  ],
  "相里要": [
    {
      "name": "思維矩陣·樞機·勘破第一段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「思維矩陣」原文寫明「普攻和重擊替換為普攻樞機·勘破，進行最多3段連續攻擊，造成導電傷害」，未聲明視為共鳴解放傷害（僅閃避反擊知無定形聲明為共鳴解放傷害）。"
    },
    {
      "name": "思維矩陣·樞機·勘破第二段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「思維矩陣」原文寫明「普攻和重擊替換為普攻樞機·勘破」，屬普攻傷害而非共鳴解放傷害。"
    },
    {
      "name": "思維矩陣·樞機·勘破第三段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「思維矩陣」原文寫明「普攻和重擊替換為普攻樞機·勘破」，屬普攻傷害而非共鳴解放傷害。"
    },
    {
      "name": "思維矩陣·一相萬殊傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴解放「思維矩陣」原文寫明「共鳴技能基本推衍替換為共鳴技能一相萬殊，造成導電傷害」，且RC3亦稱其為「共鳴技能一相萬殊」，未聲明視為共鳴解放傷害（僅應刃、萬方法則、解裂重構聲明為共鳴解放傷害）。"
    }
  ],
  "奧古斯塔": [
    {
      "name": "逐狩·共鳴技能·不敗恆陽·迅擊傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "共鳴回路「曜陽如我」原文寫明「共鳴技能·斬鋒替換為共鳴技能·不敗恆陽·迅擊，造成導電傷害」，屬共鳴技能傷害（註：本地localSkills存在名稱與倍率錯位，53.68%實為重擊·爍雷·後撤倍率）。"
    },
    {
      "name": "斬鋒·閃避反擊·爍雷·後撤傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "常態攻擊「逐狩」原文寫明「閃避反擊·爍雷·後撤，施放時造成導電傷害，此次傷害為重擊傷害」（註：本地條目名稱拼接錯位，其倍率656.1%實為共鳴技能「斬鋒」Lv10之218.70%*3）。"
    },
    {
      "name": "曜陽如我·共鳴解放·誓鋒不殞傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放「共鳴解放·誓鋒不殞」原文寫明「此次傷害為重擊傷害」；且本地倍率865.83%對應之「共鳴技能·不敗恆陽·落襲」原文亦寫明「此次傷害為重擊傷害」，兩者皆為重擊傷害。"
    }
  ],
  "卜靈": [
    {
      "name": "雷炁化生·飛雷訣·歸一傷害",
      "currentType": "共技",
      "correctType": "共解",
      "note": "共鳴回路「雷炁化生」原文寫明「共鳴解放·飛雷訣替換為共鳴解放·飛雷訣·歸一」，且RC1亦寫明「共鳴解放·飛雷訣·歸一」，故屬共鳴解放傷害而非共鳴技能傷害。"
    },
    {
      "name": "雷炁化生·五雷蕩煞陣持續傷害",
      "currentType": "共技",
      "correctType": "共解",
      "note": "【五雷蕩煞陣】為「共鳴解放·飛雷訣·歸一」生成的持續領域傷害，隸屬該共鳴解放子技能且無其他傷害類型覆寫，故為共鳴解放傷害。"
    }
  ],
  "心": [
    {
      "name": "萬相流轉，此心自明·重擊·應世相·步紅塵傷害",
      "currentType": "重擊",
      "correctType": "共技",
      "note": "共鳴回路「萬相流轉，此心自明」之「重擊·應世相·步紅塵」原文明確寫明「對目標造成導電傷害，此次傷害為共鳴技能傷害」。"
    },
    {
      "name": "萬相流轉，此心自明·重擊·照世相·臨寰宇傷害",
      "currentType": "重擊",
      "correctType": "共技",
      "note": "共鳴回路「萬相流轉，此心自明」之「重擊·照世相·臨寰宇」原文明確寫明「對目標造成導電傷害，此次傷害為共鳴技能傷害」。"
    }
  ],
  "尤諾": [
    {
      "name": "祭者獨步·月環·普攻第一段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "月環·普攻無特殊傷害類型描述，僅月弓·普攻為共鳴解放傷害"
    },
    {
      "name": "祭者獨步·月環·普攻第二段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "月環·普攻無特殊傷害類型描述，僅月弓·普攻為共鳴解放傷害"
    },
    {
      "name": "祭者獨步·月環·普攻第三段傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "月環·普攻無特殊傷害類型描述，僅月弓·普攻為共鳴解放傷害"
    },
    {
      "name": "祭者獨步·空中攻擊",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "常態空中下落攻擊無特殊描述，視為普攻傷害"
    },
    {
      "name": "祭者獨步·月環·閃避反擊",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "月環·閃避反擊無特殊傷害類型描述，僅月弓·閃避反擊為共鳴解放傷害"
    },
    {
      "name": "先覺賦格·原初的律動傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴技能原初的律動無特殊傷害類型描述，為共鳴技能傷害"
    },
    {
      "name": "先覺賦格·告終的喧響傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴技能告終的喧響無特殊傷害類型描述，為共鳴技能傷害"
    },
    {
      "name": "先覺賦格·未終的喧響傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "共鳴技能未終的喧響無特殊傷害類型描述，為共鳴技能傷害"
    }
  ],
  "仇遠": [
    {
      "name": "質黑相青·閃避反擊傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "閃避反擊原文：此次傷害視為重擊傷害（且本地倍率165.61實際對應重擊，閃避反擊Lv10應為278.36%）"
    },
    {
      "name": "質黑相青·不辭遠傷害",
      "currentType": "普攻",
      "correctType": "聲骸",
      "note": "共鳴技能不辭遠原文：此次傷害視為聲骸技能傷害"
    },
    {
      "name": "萬鈞一斷傷害",
      "currentType": "共解",
      "correctType": "聲骸",
      "note": "共鳴解放萬鈞一斷原文：此次傷害視為聲骸技能傷害"
    },
    {
      "name": "攻其必救·技能傷害",
      "currentType": "變奏",
      "correctType": "重擊",
      "note": "變奏技能攻其必救原文：此次傷害視為重擊傷害"
    }
  ],
  "西格莉卡": [
    {
      "name": "羅伊近身格鬥技·大砰砰！傷害",
      "currentType": "共技",
      "correctType": "聲骸",
      "note": "共鳴技能大嘭嘭！原文：本次傷害為聲骸技能傷害"
    },
    {
      "name": "羅伊近身格鬥技·日靈幫幫忙傷害",
      "currentType": "共技",
      "correctType": "聲骸",
      "note": "共鳴技能日靈幫幫忙原文：本次傷害為聲骸技能傷害"
    },
    {
      "name": "在那浩瀚中·符語日靈傷害",
      "currentType": "共技",
      "correctType": "聲骸",
      "note": "共鳴回路符語日靈原文：本次傷害為聲骸技能傷害"
    }
  ],
  "維里奈": [
    {
      "name": "空中攻擊·星星花綻放第一段傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "共鳴回路原文：空中攻擊星星花綻放命中目標時，造成衍射傷害，此次傷害為普攻傷害"
    },
    {
      "name": "空中攻擊·星星花綻放第二段傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "共鳴回路原文：空中攻擊星星花綻放命中目標時，造成衍射傷害，此次傷害為普攻傷害"
    },
    {
      "name": "空中攻擊·星星花綻放第三段傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "共鳴回路原文：空中攻擊星星花綻放命中目標時，造成衍射傷害，此次傷害為普攻傷害"
    }
  ],
  "燈燈": [
    {
      "name": "前路領航·紅燈·重擊傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "常態攻擊紅燈·重擊原文：消耗耐力，啾啾和燈燈一同下砸，攻擊目標，造成導電傷害，此次傷害為普攻傷害"
    },
    {
      "name": "信號閃耀·紅燈聚光·重擊傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "紅燈聚光模式提升紅燈·重擊傷害倍率，繼承紅燈·重擊的「此次傷害為普攻傷害」判定"
    }
  ],
  "守岸人": [
    {
      "name": "故此證明·啟迪傷害",
      "currentType": "共解",
      "correctType": "共技",
      "note": "變奏技能原文：『此次傷害為共鳴技能傷害』"
    },
    {
      "name": "群星漫響·耀星·蝶傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路原文：常態攻擊命中生成坍縮核演化為耀星·蝶，未聲明其他類型，隨常態攻擊歸為普攻傷害"
    },
    {
      "name": "群星漫響·演繹傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "共鳴回路原文：『持有5段【實論數據】時，施放重擊將消耗所有【實論數據】…造成衍射傷害』，為強化重擊"
    },
    {
      "name": "群星漫響·衍變傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴回路原文：『持有5段【實論數據】時，施放空中攻擊將消耗所有【實論數據】，造成衍射傷害』，為強化空中攻擊（普攻）"
    }
  ],
  "菲比": [
    {
      "name": "追尋光芒之所·【鏡之環】折射聖輝傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能原文：『普攻、閃避反擊命中【鏡之環】時會折射聖輝…此次傷害為普攻傷害』"
    },
    {
      "name": "追尋光芒之所·夏彌爾之星第一段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能原文：『普攻替換為普攻夏彌爾之星…此次傷害為普攻傷害』"
    },
    {
      "name": "追尋光芒之所·夏彌爾之星第二段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能原文：『普攻替換為普攻夏彌爾之星…此次傷害為普攻傷害』"
    },
    {
      "name": "追尋光芒之所·夏彌爾之星第三段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能原文：『普攻替換為普攻夏彌爾之星…此次傷害為普攻傷害』"
    },
    {
      "name": "交錯星輝的祝禱·聖禱赦罪傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "共鳴回路原文：『重擊聖禱赦罪：長按普攻，造成衍射傷害』，屬於重擊傷害"
    }
  ],
  "千咲": [
    {
      "name": "解弦視界·萬理歸塵·每點【鋸環殘響】增加倍率",
      "currentType": "共技",
      "correctType": "共解",
      "note": "共鳴回路原文：每消耗1點【鋸環殘響】增加下一次鋸環·終結傷害倍率，而鋸環·終結『該技能傷害為共鳴解放傷害』"
    }
  ],
  "琳奈": [
    {
      "name": "色光混合律·普攻·視覺衝擊傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "共鳴回路技能名為『普攻·視覺衝擊』，短按普攻或共鳴技能施放，未聲明為重擊傷害，屬於普攻傷害"
    },
    {
      "name": "泛彩流光·綺彩巡遊·地面重擊傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "常態攻擊原文：『綺彩巡遊·地面重擊…此次傷害為普攻傷害』"
    },
    {
      "name": "爆炸噴塗·普攻·向著多彩的明天！傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放原文：施放爆炸噴塗後短按普攻施放『普攻·向著多彩的明天！』，未聲明為共鳴解放傷害，屬於普攻傷害"
    },
    {
      "name": "泛彩流光·綺彩巡遊·空中重擊傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "常態攻擊原文：『綺彩巡遊·空中重擊…此次傷害為普攻傷害』"
    }
  ],
  "露西": [
    {
      "name": "鎖定執行緒·普攻·執行緒撕裂第一段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊原文：『普攻·線程撕裂：進行最多4段的連續攻擊，造成衍射傷害，本次傷害為重擊傷害』"
    },
    {
      "name": "鎖定執行緒·普攻·執行緒撕裂第二段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊原文：『普攻·線程撕裂：進行最多4段的連續攻擊，造成衍射傷害，本次傷害為重擊傷害』"
    },
    {
      "name": "鎖定執行緒·普攻·執行緒撕裂第三段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊原文：『普攻·線程撕裂：進行最多4段的連續攻擊，造成衍射傷害，本次傷害為重擊傷害』"
    },
    {
      "name": "鎖定執行緒·普攻·執行緒撕裂第四段傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "常態攻擊原文：『普攻·線程撕裂：進行最多4段的連續攻擊，造成衍射傷害，本次傷害為重擊傷害』"
    },
    {
      "name": "協議突破·共鳴技能·死鎖傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "共鳴技能原文：『施放共鳴技能·死鎖對目標造成衍射傷害同時附加【駭破·偏移】，此次傷害為重擊傷害』"
    },
    {
      "name": "共鳴解放·網路行者·覆寫篡改傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放原文：『對所有標記目標發起覆寫篡改，造成衍射傷害並退出協議界面，此次傷害為重擊傷害』"
    },
    {
      "name": "網路行者·欺騙程式·集群入侵傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放原文：『欺騙程式·集群入侵…對周圍的標記目標造成衍射傷害，此次傷害為重擊傷害』"
    },
    {
      "name": "網路行者·欺騙程式·突觸熔融傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放原文：『欺騙程式·突觸熔融…對一定範圍內的所有標記目標造成衍射傷害，此次傷害為重擊傷害』"
    },
    {
      "name": "網路行者·共鳴解放·暗網深潛·覆寫篡改傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放原文：暗網深潛『擁有共鳴解放·網路行者的所有效果，並使覆寫篡改傷害倍率大幅提升』，覆寫篡改此次傷害為重擊傷害"
    }
  ],
  "桃祈": [
    {
      "name": "重器藏鋒·後發制人傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "長按普攻進入磐岩守勢觸發之重擊分支，固有技能「巋然」、共鳴回路「攻防轉換」與共鳴鏈4均明確稱其為「重擊後發制人」"
    }
  ],
  "椿": [
    {
      "name": "育種·重擊傷害",
      "currentType": "重擊",
      "correctType": "普攻",
      "note": "固有技能「溫床」明確記載：「重擊修枝傷害視為普攻傷害。」"
    },
    {
      "name": "盛放與凋零的輪舞·紅椿盛綻傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能「紅椿盛綻」明確記載：「造成湮滅傷害，並進入盛綻狀態，此次傷害為普攻傷害。」"
    },
    {
      "name": "盛放與凋零的輪舞·蔓舞第一段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「普攻和重擊修枝替換為普攻蔓舞，進行最多4段的連續攻擊，造成湮滅傷害，此次傷害為普攻傷害」"
    },
    {
      "name": "盛放與凋零的輪舞·蔓舞第二段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「普攻和重擊修枝替換為普攻蔓舞，進行最多4段的連續攻擊，造成湮滅傷害，此次傷害為普攻傷害」"
    },
    {
      "name": "盛放與凋零的輪舞·蔓舞第三段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「普攻和重擊修枝替換為普攻蔓舞，進行最多4段的連續攻擊，造成湮滅傷害，此次傷害為普攻傷害」"
    },
    {
      "name": "盛放與凋零的輪舞·蔓舞第四段傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「普攻和重擊修枝替換為普攻蔓舞，進行最多4段的連續攻擊，造成湮滅傷害，此次傷害為普攻傷害」"
    },
    {
      "name": "盛放與凋零的輪舞·燼華蔓舞傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「施放普攻燼華蔓舞，造成湮滅傷害」，固有技能「侵占」亦明確歸類為「普攻燼華蔓舞」"
    },
    {
      "name": "盛放與凋零的輪舞·黯蕊獵心傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「施放黯蕊獵心時，將會攻擊目標，造成湮滅傷害，此次傷害為普攻傷害」"
    },
    {
      "name": "盛放與凋零的輪舞·旋舞傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「跳躍替換為普攻旋舞，短按跳躍，將會消耗耐力攻擊目標，造成湮滅傷害，此次傷害為普攻傷害」"
    },
    {
      "name": "盛放與凋零的輪舞·償贖傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "盛綻狀態明確記載：「閃避反擊替換為閃避反擊償贖，成功閃避後一定時間內短按普攻，將會攻擊目標，造成湮滅傷害，此次傷害為普攻傷害」"
    }
  ],
  "洛可可": [
    {
      "name": "即興喜劇，開場·技能傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放「即興喜劇，開場」明確記載：「對目標造成湮滅傷害，此次傷害為重擊傷害。」"
    }
  ],
  "坎特蕾拉": [
    {
      "name": "虛像陷落·浮潛幻海傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能分類為「重擊·浮潛幻海」：「擁有【迷離】時，重擊替換為浮潛幻海」，屬重擊傷害而非普攻傷害。"
    },
    {
      "name": "幽影共舞·驚醒傷害",
      "currentType": "共技",
      "correctType": "普攻",
      "note": "共鳴技能「迷夢」明確記載：「目標受到傷害時，將觸發一次驚醒，造成湮滅傷害，並清除迷夢，此次傷害為普攻傷害。」"
    },
    {
      "name": "海面之下·陷溺傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「陷溺」明確記載：「攻擊目標，造成湮滅傷害，並為隊伍中所有角色附加瀰漫，此次傷害為普攻傷害。」"
    },
    {
      "name": "海面之下·瀰漫傷害",
      "currentType": "共解",
      "correctType": "普攻",
      "note": "共鳴解放「瀰漫」明確記載：「召喚織夢水母對目標進行協同攻擊，造成湮滅傷害，此次傷害為普攻傷害。」"
    }
  ],
  "弗洛洛": [
    {
      "name": "生與死的樂章·譜曲終末傷害",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "常態攻擊「譜曲終末」明確記載：「停滯並牽引附近目標，造成湮滅傷害，本次傷害為共鳴技能傷害。」"
    },
    {
      "name": "生與死的樂章·每層餘響增加倍率",
      "currentType": "普攻",
      "correctType": "共技",
      "note": "附屬於「譜曲終末」（「每層餘響可使本次傷害倍率額外增加」），該技能明確記載「本次傷害為共鳴技能傷害」。"
    },
    {
      "name": "致命組歌·永生組歌傷害",
      "currentType": "變奏",
      "correctType": "共技",
      "note": "變奏技能分支「永生組歌」明確記載：「施放永生組歌，停滯目標，造成湮滅傷害，本次傷害為共鳴技能傷害。」"
    }
  ],
  "秧秧": [
    {
      "name": "風羽為刃·風吟傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能文本歸類為「重擊·風吟」，屬於重擊傷害"
    },
    {
      "name": "覆聲裁羽·風襲傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "共鳴迴路文本歸類為「重擊·風襲」，屬於重擊傷害"
    }
  ],
  "秋水": [
    {
      "name": "真假參半·瞄準傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能文本歸類為「重擊：進入瞄準狀態」，瞄準射擊屬於重擊傷害"
    },
    {
      "name": "真假參半·瞄準完全蓄力傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能文本歸類為「重擊：進入瞄準狀態...蓄力完成後攻擊目標」，屬於重擊傷害"
    }
  ],
  "忌炎": [
    {
      "name": "孤槍止戈·凌空擊傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能文本明確標註為「重擊·凌空擊」，屬於重擊傷害"
    },
    {
      "name": "孤槍止戈·潛淵斬傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能文本明確標註為「重擊·潛淵斬」，屬於重擊傷害"
    },
    {
      "name": "蒼躣八荒·謀定·破陣之槍第一段傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放文本明確寫明「重擊·破陣之槍...此次傷害為重擊傷害」"
    },
    {
      "name": "蒼躣八荒·謀定·破陣之槍第二段傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放文本明確寫明「重擊·破陣之槍...此次傷害為重擊傷害」"
    },
    {
      "name": "蒼躣八荒·謀定·破陣之槍第三段傷害",
      "currentType": "共解",
      "correctType": "重擊",
      "note": "共鳴解放文本明確寫明「重擊·破陣之槍...此次傷害為重擊傷害」"
    }
  ],
  "夏空": [
    {
      "name": "四拍的舞曲·瞄準完全蓄力傷害",
      "currentType": "普攻",
      "correctType": "重擊",
      "note": "技能文本明確記載：蓄力完成後攻擊目標，造成氣動傷害，此次傷害為重擊傷害。"
    },
    {
      "name": "風與詩樂的交響·四拍重奏傷害",
      "currentType": "共技",
      "correctType": "重擊",
      "note": "技能名稱為「重擊·四拍重奏」，且固有技能「黎那汐塔之風」與4鏈明確記載其為重擊傷害。"
    }
  ]
};

export const ROLE_DERIVED_SKILLS_DB = {
  "散華": [
    {
      "name": "無明心音·冰川爆炸傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "無明心音·爆裂|重擊·爆裂|焦瞑凍土",
      "skillType": "共技",
      "mvPct": 139.17,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "重擊爆裂引爆共鳴解放生成的【冰川】，造成139.17%冷凝傷害，視為共鳴技能傷害（RC5消失時也會自動爆炸）。"
    },
    {
      "name": "無明心音·冰棱爆炸傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "無明心音·爆裂|重擊·爆裂|朔雪永凍",
      "skillType": "共技",
      "mvPct": 79.53,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "重擊爆裂引爆共鳴技能生成的【冰棱】，造成79.53%冷凝傷害，視為共鳴技能傷害。"
    },
    {
      "name": "無明心音·冰棘爆炸傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "無明心音·爆裂|重擊·爆裂|凜刺",
      "skillType": "共技",
      "mvPct": 59.65,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "重擊爆裂引爆變奏技能生成的【冰棘】，造成59.65%冷凝傷害，視為共鳴技能傷害。"
    }
  ],
  "白芷": [
    {
      "name": "刹那合彌·頻隙迴響協同傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "刹那合彌",
      "skillType": "共解",
      "mvPct": 4.07,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "共鳴解放【刹那合彌】產生4段頻隙迴響，每2.5秒進行1次協同攻擊，Lv.10倍率為4.07%生命上限（localSkills誤植了治療倍率2.51%）。"
    },
    {
      "name": "被追溯的本源·頻隙迴響額外傷害",
      "source": "rc4",
      "minRc": 4,
      "triggerPattern": "刹那合彌|頻隙迴響",
      "skillType": "共解",
      "mvPct": 1.2,
      "hits": 1,
      "maxTriggersPerLoop": 6,
      "fixedCrit": false,
      "note": "共鳴鏈4：頻隙迴響增加2段（共6段），且每段額外造成白芷1.20%生命值上限的冷凝傷害。"
    }
  ],
  "凌陽": [
    {
      "name": "勤修苦練，鋸牙磨礪·額外傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "飛身式·翻山越澗",
      "skillType": "共技",
      "mvPct": 248.64,
      "hits": 1,
      "maxTriggersPerLoop": 5,
      "fixedCrit": false,
      "note": "固有技能2：行獅狀態下施放普攻後3秒內，下次飛身式·翻山越澗（165.76%）額外造成1次150%倍率的冷凝傷害（248.64%），此次傷害為共鳴技能傷害。"
    },
    {
      "name": "留痕·踏雪點星",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|留痕·踏雪點星",
      "skillType": "延奏",
      "mvPct": 587.94,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能：釋放衝擊波，造成凌陽587.94%攻擊的冷凝傷害。"
    },
    {
      "name": "躡罡踏斗，七星懸朗·額外傷害",
      "source": "rc5",
      "minRc": 5,
      "triggerPattern": "奮進·獅子奮迅|俱足萬行",
      "skillType": "共解",
      "mvPct": 200,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴鏈5：施放共鳴解放奮進·獅子奮迅，俱足萬行時，額外造成凌陽200%攻擊的冷凝傷害。"
    }
  ],
  "折枝": [
    {
      "name": "虛實境趣·墨鶴協同攻擊",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "虛實境趣",
      "skillType": "普攻",
      "mvPct": 65.21,
      "hits": 1,
      "maxTriggersPerLoop": 21,
      "fixedCrit": false,
      "note": "共鳴解放：在場角色造成傷害時召喚墨鶴協同攻擊，Lv.10倍率65.21%，視為普攻傷害，最多21隻（RC2增至27隻）。"
    },
    {
      "name": "經營位置·額外墨鶴協同攻擊",
      "source": "rc5",
      "minRc": 5,
      "triggerPattern": "虛實境趣|墨鶴",
      "skillType": "普攻",
      "mvPct": 91.29,
      "hits": 1,
      "maxTriggersPerLoop": 9,
      "fixedCrit": false,
      "note": "共鳴鏈5：虛實境趣持續期間每召喚3隻墨鶴，額外召喚1隻墨鶴造成墨鶴140%的傷害（65.21%*1.4=91.294%），此次傷害為普攻傷害（27隻墨鶴可觸發9次）。"
    },
    {
      "name": "傳移摹寫·額外白鶴傷害",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "神來之筆|極意·神來之筆",
      "skillType": "普攻",
      "mvPct": 357.86,
      "hits": 1,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "共鳴鏈6：施放神來之筆或極意·神來之筆時，額外召喚一隻白鶴，造成等同於神來之筆120%的傷害（298.22%*1.2=357.864%），此次傷害為普攻傷害。"
    }
  ],
  "珂萊塔": [
    {
      "name": "致辭",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|致辭",
      "skillType": "延奏",
      "mvPct": 794.2,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能【致辭】：攻擊目標，造成珂萊塔794.2%攻擊的冷凝傷害。"
    },
    {
      "name": "碎璃鏡花",
      "source": "rc3",
      "minRc": 3,
      "triggerPattern": "延奏|致辭",
      "skillType": "延奏",
      "mvPct": 1032.18,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴鏈3【延奏技能碎璃鏡花】：施放延奏技能致辭後，額外進行一次攻擊，造成珂萊塔1032.18%攻擊的冷凝傷害。"
    }
  ],
  "緋雪": [
    {
      "name": "重擊·寒簇·常世身",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "重擊·寒簇|寒簇·常世身",
      "skillType": "共解",
      "mvPct": 317.23,
      "hits": 3,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "localSkills為空，特補核心派生：【心念】滿300點長按普攻施放，Lv.10倍率79.31%*2+158.61%=317.23%，「此次傷害為共鳴解放傷害」。"
    },
    {
      "name": "重擊·枯霜·預求身",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "重擊·枯霜|枯霜·預求身",
      "skillType": "共解",
      "mvPct": 616.33,
      "hits": 9,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "【淬寒·枯霜】滿時施放，Lv.10倍率15.41%*8+493.05%=616.33%，「此次傷害為共鳴解放傷害」。"
    },
    {
      "name": "普攻·居合",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "居合架勢|普攻·居合",
      "skillType": "共解",
      "mvPct": 473.06,
      "hits": 5,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "共鳴回路【萬世霜天】：居合架勢後短按普攻消耗100寒意施放，Lv.10倍率283.82%+47.31%*4=473.06%，「此次傷害為共鳴解放傷害」。"
    },
    {
      "name": "預求我身·歸刃（滿層鍛雪）",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "預求我身·歸刃|歸刃",
      "skillType": "共解",
      "mvPct": 3379.77,
      "hits": 2,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "預求身終結技：基礎傷害(198.81%+795.24%=994.05%) + 3點【鍛雪·歸刃】(795.24%*3=2385.72%) = 3379.77%，共鳴解放傷害。"
    }
  ],
  "洛瑟菈": [
    {
      "name": "記憶宮殿·遺忘",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "普攻·溯念留形第三段|溯念留形",
      "skillType": "聲骸",
      "mvPct": 285.48,
      "hits": 1,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "共鳴回路【遺忘】：施放普攻·溯念留形第3段期間每隔一段時間消耗1張【照片】（上限3張）自動施放1次遺忘，Lv.10倍率285.48%；處於共鳴模態·聲骸時視為聲骸技能傷害（處於共鳴模態·霜漸時則為普攻傷害）。"
    }
  ],
  "熾霞": [
    {
      "name": "延奏技能·躍焰",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|躍焰",
      "skillType": "延奏",
      "mvPct": 530,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能躍焰：釋放衝擊波，對範圍內的目標造成熾霞530.00%攻擊的熱熔傷害（localSkills缺失）"
    }
  ],
  "安可": [
    {
      "name": "延奏技能·熱場",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|熱場",
      "skillType": "延奏",
      "mvPct": 707.04,
      "hits": 4,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能熱場：生成地炎持續灼燒，每1.5秒造成安可176.76%攻擊的熱熔傷害，持續6秒（共4跳=707.04%）"
    }
  ],
  "莫特斐": [
    {
      "name": "暴烈終曲·加強音（協同攻擊）",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "暴烈終曲|普攻|重擊",
      "skillType": "共解",
      "mvPct": 31.81,
      "hits": 1,
      "maxTriggersPerLoop": 28,
      "fixedCrit": false,
      "note": "共鳴解放浮翼狂想期間（10秒，RC4延長至17秒），登場角色普攻命中打出1發、重擊命中打出2發加強音（每發31.81%共解傷害），冷卻0.35秒"
    },
    {
      "name": "孤獨的練習曲·加強音",
      "source": "rc1",
      "minRc": 1,
      "triggerPattern": "共鳴技能|激昂變奏|怒火賦格",
      "skillType": "共解",
      "mvPct": 63.62,
      "hits": 2,
      "maxTriggersPerLoop": 5,
      "fixedCrit": false,
      "note": "RC1：浮翼狂想持續期間，登場角色施放共鳴技能時，協同打出2發共鳴解放加強音（31.81%*2=63.62%）"
    },
    {
      "name": "葬送的四重奏·加強音",
      "source": "rc5",
      "minRc": 5,
      "triggerPattern": "激昂變奏|怒火賦格",
      "skillType": "共解",
      "mvPct": 63.62,
      "hits": 4,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "RC5：共鳴技能激昂變奏和怒火賦格命中時，協同打出4發共鳴解放加強音，此次傷害降低50%（31.81%*4*0.5=63.62%）"
    }
  ],
  "布蘭特": [
    {
      "name": "掠奪歡聲與笑顏·爆炸",
      "source": "rc2",
      "minRc": 2,
      "triggerPattern": "延奏|航向確定",
      "skillType": "普攻",
      "mvPct": 440,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "RC2：延奏技能後20秒內，激活延奏的角色施放共鳴技能命中時產生爆炸，造成440%熱熔傷害，此次傷害為普攻傷害，每秒1次，最多2次"
    },
    {
      "name": "船長答：狂歡即世界！·再燃",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "火焰歸亡曲",
      "skillType": "普攻",
      "mvPct": 566.61,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "RC6：施放火焰歸亡曲後在原地產生一次再燃，造成等同於火焰歸亡曲30%的熱熔傷害（基礎1888.71%*30%=566.61%，若計入RC3倍率+42%則為804.59%），此次傷害為普攻傷害"
    }
  ],
  "露帕": [
    {
      "name": "此刻，讓火焰延燃賽場",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "狼舞的決意|共鳴解放",
      "skillType": "共技",
      "mvPct": 211.75,
      "hits": 2,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放狼舞的決意或狼舞的決意·極後8秒內切人，隊友施放共鳴解放時露帕協同攻擊（42.35%+169.40%=211.75%），此次傷害為共鳴技能傷害，最多觸發1次"
    }
  ],
  "莫寧": [
    {
      "name": "質能等價·諧振場傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "位勢轉換|歸斂",
      "skillType": "共解",
      "mvPct": 198.85,
      "hits": 5,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "進入廣域觀測模式（重擊·位勢轉換或變奏技能·歸斂）時展開諧振場，造成39.77%*5=198.85%熱熔傷害，此次傷害為共鳴解放傷害。"
    },
    {
      "name": "質能等價·震諧響應·粒子射流",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "諧度破壞|震諧·干涉",
      "skillType": "共技",
      "mvPct": 298.22,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "隊伍中角色對目標造成【諧度破壞】傷害並使其進入【震諧·干涉】狀態時，莫寧施放震諧響應·粒子射流，Lv10倍率298.22%（RC5倍率提升160%），同一目標每8秒1次，視為震諧傷害。"
    }
  ],
  "愛彌斯": [
    {
      "name": "為寂靜賦形·光翼共奏追加傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "光翼共奏·降臨|光翼共奏·登台",
      "skillType": "共技",
      "mvPct": 109.35,
      "hits": 1,
      "maxTriggersPerLoop": 20,
      "fixedCrit": false,
      "note": "處於共鳴模態·震諧時，施放共鳴技能光翼共奏期間額外造成5次震諧傷害（星屑共振狀態下提升至10次，可施放2次光翼共奏共20次），每次Lv10倍率109.35%（RC6固定80%暴擊/275%暴傷）。"
    },
    {
      "name": "為寂靜賦形·震諧響應·星爆",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "諧度破壞|震諧·干涉",
      "skillType": "共技",
      "mvPct": 596.43,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "處於共鳴模態·震諧時，隊伍中角色對目標造成【諧度破壞】傷害並使其進入【震諧·干涉】狀態時觸發，Lv10倍率596.43%，同一目標每8秒1次，視為震諧傷害。"
    }
  ],
  "達妮婭": [
    {
      "name": "「天衣無縫」·蝕域",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "帷幕終景·幻滅之形",
      "skillType": "共解",
      "mvPct": 136.33,
      "hits": 1,
      "maxTriggersPerLoop": 7,
      "fixedCrit": false,
      "note": "施放共鳴解放帷幕終景·幻滅之形後生成蝕域，持續30秒，每4秒（RC4縮短至3秒，最多10次）發動1次攻擊，Lv10每次136.33%熱熔傷害，為共鳴解放傷害。"
    }
  ],
  "景燃": [
    {
      "name": "萬鬼同葬·魑魅魍魎",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "重擊·劫魄|重擊·踏罡",
      "skillType": "重擊",
      "mvPct": 83.51,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "處於熒惑狀態（萬鬼同葬後持續15秒）時，重擊·劫魄或重擊·踏罡造成傷害時召喚魑魅魍魎進行攻擊，Lv10倍率83.51%（RC6倍率提升80%），本次傷害為重擊傷害，每次重擊觸發1次。"
    },
    {
      "name": "收山出煞",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|收山出煞",
      "skillType": "延奏",
      "mvPct": 795,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能：造成景燃795%攻擊的熱熔傷害。"
    },
    {
      "name": "萬鬼同行·魑魅魍魎",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "萬鬼同葬|劫魄|踏罡|攝召|滅煞|陰蝕骨|陽焚身|黃泉渡|往生送",
      "skillType": "重擊",
      "mvPct": 83.51,
      "hits": 1,
      "maxTriggersPerLoop": 8,
      "fixedCrit": false,
      "note": "RC6「恩仇了了，後文有期」：進入熒惑狀態後獲得萬鬼同行15秒，景燃登場造成傷害時召喚魑魅魍魎（基礎Lv10倍率83.51%，另受RC6魑魅魍魎倍率提升80%加成），本次傷害為重擊傷害，間隔1秒，最多召喚8次。"
    }
  ],
  "卡卡羅": [
    {
      "name": "掠影奇襲",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|掠影奇襲",
      "skillType": "延奏",
      "mvPct": 587.94,
      "hits": 2,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能：召喚獵殺影支援共鳴者，造成卡卡羅195.98%+391.96%=587.94%攻擊的導電傷害。"
    },
    {
      "name": "最後通牒·獵殺影協同攻擊",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "死告",
      "skillType": "共解",
      "mvPct": 200,
      "hits": 2,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "RC6「最後通牒」：施放重擊「死告」時，召喚2個獵殺影進行協同攻擊，每個造成100.00%攻擊的導電傷害（共200%），此次傷害為共鳴解放傷害。"
    }
  ],
  "吟霖": [
    {
      "name": "磁殛咆哮·磁殛爆發",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "懸絲華刃舞|普攻|閃避反擊",
      "skillType": "共技",
      "mvPct": 19.89,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "施放磁殛咆哮進入磁殛狀態（10秒）後，每段普攻和閃避反擊命中目標時觸發1次磁殛爆發，Lv10倍率19.89%，最多觸發4次。"
    },
    {
      "name": "千面魅影·審判之雷",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "千面魅影|懲罰印記",
      "skillType": "共技",
      "mvPct": 78.64,
      "hits": 1,
      "maxTriggersPerLoop": 18,
      "fixedCrit": false,
      "note": "千面魅影命中縛罪標記目標替換為懲罰印記（18秒），目標受到傷害時降下審判之雷，Lv10倍率78.64%（RC3倍率提升55%），每秒最多觸發1次，此次傷害為共鳴技能傷害。"
    },
    {
      "name": "正義的踐行·疾霆昭彰",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "破天雷滅擊|懸絲華刃舞|普攻",
      "skillType": "共技",
      "mvPct": 419.59,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "RC6「正義的踐行」：施放共鳴解放破天雷滅擊後的30秒內，吟霖的普攻命中目標時額外觸發疾霆昭彰，造成419.59%攻擊的導電傷害，每段普攻觸發1次，最多4次，此次傷害為共鳴技能傷害。"
    }
  ],
  "淵武": [
    {
      "name": "拳震凌武·雷之楔協同攻擊",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "拳震凌武|雷之楔",
      "skillType": "共技",
      "mvPct": 7.96,
      "hits": 1,
      "maxTriggersPerLoop": 10,
      "fixedCrit": false,
      "note": "登場角色處於雷池內攻擊命中目標時，雷之楔進行協同攻擊，Lv10倍率7.96%防禦（RC3額外+20%防禦），每1.2秒可觸發1次。"
    },
    {
      "name": "拳震凌武·雷之楔引爆",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "萬壑雷|寂土重明",
      "skillType": "共技",
      "mvPct": 59.65,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "施放共鳴回路萬壑雷及共鳴解放寂土重明時立刻引爆場上的雷之楔，Lv10倍率59.65%防禦，此次傷害為共鳴技能傷害。"
    },
    {
      "name": "沉雷藏鋒·掀雷",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "鋒芒|雷之楔",
      "skillType": "共技",
      "mvPct": 39.77,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "【鋒芒】充滿時，共鳴技能雷之楔施放掀雷，Lv10基礎倍率39.77%防禦（固有技能「決電」使其傷害倍率提升40%），為共鳴技能傷害。"
    }
  ],
  "相里要": [
    {
      "name": "鏈式",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|鏈式|链式",
      "skillType": "延奏",
      "mvPct": 237.63,
      "hits": 1,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "延奏技能原文：下一位登場角色普攻命中目標時，相里要將攻擊目標，造成相里要237.63%攻擊的導電傷害，持續8秒，每2秒可觸發1次，最多可觸發3次（RC5倍率增加222%）。"
    },
    {
      "name": "卓異的門生·衍構模體",
      "source": "rc1",
      "minRc": 1,
      "triggerPattern": "萬方法則|万方法则",
      "skillType": "共解",
      "mvPct": 306.34,
      "hits": 6,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "共鳴鏈1原文：施放共鳴技能萬方法則時，額外生成6個衍構模體攻擊目標，傷害倍率為共鳴技能萬方法則(638.20%)的8%(單發51.056%，6發合計306.34%)，此次傷害為共鳴解放傷害（若計入RC6萬方法則倍率提升76%，則隨母技能同步放大）。"
    }
  ],
  "奧古斯塔": [
    {
      "name": "赫日威臨·不朽者之肅",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "赫日威臨|赫日威临|烈陽|烈阳",
      "skillType": "重擊",
      "mvPct": 1192.93,
      "hits": 12,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴解放「至日的征伐」原文：施放9次赫日威臨·烈陽後或俯首之刻結束時自動施放赫日威臨·不朽者之肅，造成導電傷害（Lv10：238.58%+894.65%+5.97%*10=1192.93%），此次傷害為重擊傷害（RC3倍率提升25%）。"
    },
    {
      "name": "共鳴技能·不敗恆陽·躍空",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "不敗恆陽·迅擊|不败恒阳·迅击",
      "skillType": "共技",
      "mvPct": 278.35,
      "hits": 3,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴回路「曜陽如我」派生二段：施放共鳴技能·不敗恆陽·迅擊時短按普攻或共鳴技能施放，Lv10倍率222.67%+27.84%*2=278.35%。"
    },
    {
      "name": "共鳴技能·不敗恆陽·落襲",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "不敗恆陽·躍空|不败恒阳·跃空",
      "skillType": "重擊",
      "mvPct": 865.83,
      "hits": 2,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴回路「曜陽如我」派生三段：施放共鳴技能·不敗恆陽·躍空時短按普攻或共鳴技能施放，Lv10倍率86.59%+779.24%=865.83%，原文寫明「此次傷害為重擊傷害」（RC3倍率提升25%）。"
    },
    {
      "name": "怒霆",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "爍雷·旋切|烁雷·旋切|爍雷·升拳|烁雷·升拳",
      "skillType": "重擊",
      "mvPct": 200,
      "hits": 2,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "共鳴鏈6原文：施放重擊·爍雷·旋切、重擊·爍雷·升拳過程中，會在原地額外引發【怒霆】，造成兩次奧古斯塔攻擊100%的導電傷害（合計200%），此次傷害為重擊傷害。"
    }
  ],
  "卜靈": [
    {
      "name": "五雷蕩煞陣持續傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "飛雷訣·歸一|飞雷诀·归一",
      "skillType": "共解",
      "mvPct": 19.89,
      "hits": 1,
      "maxTriggersPerLoop": 12,
      "fixedCrit": false,
      "note": "共鳴回路「雷炁化生」原文：施放共鳴解放·飛雷訣·歸一時在目標位置生成【五雷蕩煞陣】，每2秒對範圍內所有目標造成19.89%(Lv10)導電傷害並添加2層【電磁效應】，持續24秒（單輪最多12跳）。"
    }
  ],
  "麗貝卡": [
    {
      "name": "戰術閃避·獵手閃避成功傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "戰術閃避·獵手|战术闪避·猎手",
      "skillType": "普攻",
      "mvPct": 148.71,
      "hits": 1,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "常態攻擊「混搭戰術」原文：使用戰術閃避·獵手成功閃避時，額外造成導電傷害（Lv10：148.71%，RC1倍率提升50%）。"
    },
    {
      "name": "狂歡時間！·大煙花！",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "狂歡時間|狂欢时间|31型重機槍|31型重机枪",
      "skillType": "共解",
      "mvPct": 636.2,
      "hits": 2,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴解放「狂歡時間！」原文：【31型重機槍】模式持續時間結束時或【過載】達到上限時，自動施放大煙花！，造成導電傷害（Lv10：63.62%+572.58%=636.20%，RC3倍率提升60%）。"
    },
    {
      "name": "駭破響應·熔觸",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "諧度破壞|谐度破坏|駭破·干涉|骇破·干涉",
      "skillType": "共技",
      "mvPct": 2358.89,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "共鳴回路「我要認真了！」與「駭破·熔觸」原文：隊伍中的角色對目標造成【諧度破壞】傷害並使其進入【駭破·干涉】狀態時，麗貝卡觸發駭破響應·熔觸（Lv10：2358.89%），同一目標每8秒僅可受到1次該傷害。註：原文寫明「此次傷害為駭破傷害」，因合法枚舉限制暫填共技。"
    },
    {
      "name": "好搭檔·機槍塔",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|好搭檔|好搭档",
      "skillType": "延奏",
      "mvPct": 2.5,
      "hits": 1,
      "maxTriggersPerLoop": 28,
      "fixedCrit": false,
      "note": "延奏技能「好搭檔」原文：召喚機槍塔持續攻擊敵人，持續14秒，每次攻擊造成2.5%的導電傷害（可被露西強化，傷害倍率提升250%，持續時間變為4秒）。"
    },
    {
      "name": "也許……·額外傷害",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "噠噠噠|哒哒哒|砰砰砰",
      "skillType": "普攻",
      "mvPct": 900,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "共鳴鏈6原文：麗貝卡施放重擊·噠噠噠！·獵手、重擊·砰砰砰！·鐵膽期間，額外造成一次900%的導電傷害，此次傷害為普攻傷害。"
    }
  ],
  "漂泊者": [
    {
      "name": "延奏技能·喚聲",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|喚聲",
      "skillType": "延奏",
      "mvPct": 429.9,
      "hits": 3,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能「喚聲」：召喚湮滅場攻擊目標，每2秒對範圍內目標造成143.3%攻擊的湮滅傷害，持續6秒（共3段合計429.9%）。"
    },
    {
      "name": "萬物寂聽·暗湧普攻第五段額外傷害",
      "source": "rc5",
      "minRc": 5,
      "triggerPattern": "暗流·普攻第五段|強化普攻第五段|普攻第五段",
      "skillType": "普攻",
      "mvPct": 114.08,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "共鳴鏈5：處於暗湧狀態時第5段普攻可額外造成一次湮滅傷害，此次傷害為第5段普攻傷害的50%（Lv.10暗流·普攻第五段228.15%×50%=114.075%）。"
    }
  ],
  "心": [
    {
      "name": "普攻·照世相·活字心鎖",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "普攻·照世相第二段|重擊·照世相|重击·照世相|閃避反擊·照世相|闪避反击·照世相|共鳴技能·照世相|共鸣技能·照世相",
      "skillType": "普攻",
      "mvPct": 41.84,
      "hits": 2,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "常態攻擊「萬相生華」原文：施放普攻·照世相第1段時生成活字心鎖，施放普攻·照世相第2段、重擊·照世相、閃避反擊·照世相、共鳴技能·照世相期間令活字心鎖崩解，造成20.92%*2=41.84%(Lv10)導電傷害。"
    },
    {
      "name": "引樞作清輝·飛闕",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "轉相|转相",
      "skillType": "共解",
      "mvPct": 11.37,
      "hits": 1,
      "maxTriggersPerLoop": 21,
      "fixedCrit": false,
      "note": "共鳴解放「引樞作清輝」原文：施放轉相時獲得21層敕令（持續45秒），隊伍中在場角色造成傷害後每秒自動消耗1層敕令，從萬相神宮召喚飛闕進行協同攻擊，造成11.37%(Lv10)導電傷害。"
    },
    {
      "name": "身作千燈",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|身作千燈|身作千灯",
      "skillType": "延奏",
      "mvPct": 100,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "延奏技能「身作千燈」原文：攻擊目標，造成100%的導電傷害（共鳴模態·同奏下可透過同奏與滿協奏觸發）。"
    }
  ],
  "鎖瞑": [
    {
      "name": "共鳴技能·解傘形·赤芒瞬閃",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "攏傘形·破隙|拢伞形·破隙",
      "skillType": "共技",
      "mvPct": 157.51,
      "hits": 4,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "共鳴技能「攏傘形·破隙」原文：開傘向前衝擊的一定時間內受到敵方目標攻擊，免疫此次傷害並停滯周圍目標，隨後施放共鳴技能·解傘形·赤芒瞬閃（Lv10：47.25%+23.63%*2+63.00%=157.51%）。"
    },
    {
      "name": "共鳴解放·淒雨瘴雷",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|傘機鳴動|伞机鸣动|重鎖獄瘴|重锁狱瘴",
      "skillType": "共解",
      "mvPct": 59.65,
      "hits": 1,
      "maxTriggersPerLoop": 6,
      "fixedCrit": false,
      "note": "共鳴解放「暝傘形·重鎖獄瘴」原文：施放共鳴解放獲得同奏，施放延奏技能時若擁有同奏，隊伍中在場角色造成傷害時召喚雷痕進行協同攻擊，造成59.65%(Lv10)導電傷害，每秒最多1道，共可召喚6道，持續8秒。"
    }
  ],
  "尤諾": [
    {
      "name": "晦渡為明·延奏傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|晦渡為明",
      "skillType": "延奏",
      "mvPct": 100,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能：攻擊目標造成100%的氣動傷害"
    }
  ],
  "仇遠": [
    {
      "name": "穿林打葉·短按技能傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "穿林打葉|共鳴技能",
      "skillType": "聲骸",
      "mvPct": 215.52,
      "hits": 3,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "共鳴技能短按：造成71.84%*3=215.52%氣動傷害，此次傷害視為聲骸技能傷害"
    },
    {
      "name": "出其不趨·延奏傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|出其不趨",
      "skillType": "聲骸",
      "mvPct": 100,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能：造成仇遠自身100%攻擊的氣動傷害，此次傷害視為聲骸技能傷害"
    },
    {
      "name": "荷蓑出林",
      "source": "rc3",
      "minRc": 3,
      "triggerPattern": "荷蓑出林|穿林打葉",
      "skillType": "聲骸",
      "mvPct": 500,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "RC3：協奏能量充滿且不處於【淋漓醉墨】狀態下共鳴技能替換為荷蓑出林，造成500%氣動傷害，視為聲骸技能傷害"
    },
    {
      "name": "新筠墜籜",
      "source": "rc3",
      "minRc": 3,
      "triggerPattern": "新筠墜籜|延奏|出其不趨",
      "skillType": "聲骸",
      "mvPct": 500,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "RC3：施放荷蓑出林後下次延奏技能替換為新筠墜籜，造成500%氣動傷害，視為聲骸技能傷害"
    },
    {
      "name": "如是我聞·退出淋漓醉墨傷害",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "答劍·忠烈死節|淋漓醉墨",
      "skillType": "聲骸",
      "mvPct": 600,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "RC6：退出【淋漓醉墨】狀態且為登場角色時，對範圍內敵人造成600%氣動傷害，視為聲骸技能傷害"
    }
  ],
  "西格莉卡": [
    {
      "name": "在那浩瀚中·符語爆破",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "重擊·符語本源|符語本源",
      "skillType": "聲骸",
      "mvPct": 588.34,
      "hits": 3,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "消耗【符文·期望】+【符文·答問】施放重擊·符語本源時追加符語爆破（117.67%+205.92%+264.75%=588.34%），為聲骸技能傷害"
    },
    {
      "name": "在那浩瀚中·符語鏈刃",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "重擊·符語本源|符語本源",
      "skillType": "聲骸",
      "mvPct": 397.58,
      "hits": 7,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "消耗兩枚【符文·期望】施放重擊·符語本源時追加符語鏈刃（49.70%*4+66.26%*3=397.58%），為聲骸技能傷害"
    },
    {
      "name": "在那浩瀚中·符語日靈",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "重擊·符語本源|符語本源",
      "skillType": "聲骸",
      "mvPct": 397.54,
      "hits": 6,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "消耗兩枚【符文·答問】施放重擊·符語本源時追加符語日靈（39.76%+59.63%*4+119.26%=397.54%），為聲骸技能傷害"
    },
    {
      "name": "在這一瞬間·延奏傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|在這一瞬間",
      "skillType": "延奏",
      "mvPct": 795,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能：攻擊目標，造成西格莉卡795%攻擊的氣動傷害"
    }
  ],
  "清宵": [
    {
      "name": "巨闕滅跡",
      "source": "rc1",
      "minRc": 1,
      "triggerPattern": "普攻·弦劍|空中攻擊·弦劍|普攻·曇體仙身",
      "skillType": "普攻",
      "mvPct": 400,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "RC1（及RC6再獲得）：普攻·弦劍、空中攻擊·弦劍、普攻·曇體仙身造成傷害後移除清邪劍訣觸發巨闕滅跡，造成400%氣動傷害，本次傷害為普攻傷害"
    }
  ],
  "維里奈": [
    {
      "name": "草木生長·協同攻擊",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "草木生長|普攻|重擊|共鳴技能|變奏",
      "skillType": "共解",
      "mvPct": 9.95,
      "hits": 1,
      "maxTriggersPerLoop": 12,
      "fixedCrit": false,
      "note": "共鳴解放光合標記持續12秒：附近隊伍中所有角色攻擊命中攜帶光合標記目標時進行協同攻擊（9.95%），每秒可觸發1次"
    },
    {
      "name": "豐收的喜悅·協同攻擊",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "重擊·星星花綻放|空中攻擊·星星花綻放|星星花綻放",
      "skillType": "共解",
      "mvPct": 9.95,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "RC6：重擊星星花綻放及空中攻擊星星花綻放命中目標時觸發1次協同攻擊，傷害等同於共鳴解放光合標記（9.95%）"
    }
  ],
  "燈燈": [
    {
      "name": "燈光探照·登場前撲",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "專項派送|變奏|登場",
      "skillType": "共技",
      "mvPct": 181.32,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴技能描述：燈燈登場時會施放一次不消耗耐力的前撲（181.32%）"
    },
    {
      "name": "前路領航·飛星",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "黃燈·疾奔|加速|黃燈",
      "skillType": "普攻",
      "mvPct": 63.62,
      "hits": 1,
      "maxTriggersPerLoop": 6,
      "fixedCrit": false,
      "note": "黃燈·疾奔狀態下自動釋放飛星攻擊被鎖定的敵人（63.62%），此次傷害為普攻傷害"
    },
    {
      "name": "信號閃耀·強光",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "強化後撤|強化·後撤",
      "skillType": "普攻",
      "mvPct": 81.52,
      "hits": 1,
      "maxTriggersPerLoop": 6,
      "fixedCrit": false,
      "note": "施放強化·後撤進入黃燈聚光模式期間，飛星替換為強光（81.52%），施放6次強光後退出，為普攻傷害"
    },
    {
      "name": "信號閃耀·強光穿射",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "延奏|護航",
      "skillType": "普攻",
      "mvPct": 298.24,
      "hits": 4,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放延奏技能時消耗全部【光能】，每25點1段最多4段（74.56%*4=298.24%，RC5滿光能倍率提升100%），此次傷害為普攻傷害"
    }
  ],
  "守岸人": [
    {
      "name": "混沌理論·黯星·蝶傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "混沌理論",
      "skillType": "共技",
      "mvPct": 156.55,
      "hits": 5,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放共鳴技能混沌理論召喚5隻黯星·蝶自動追蹤目標，單隻Lv10倍率31.31%，共5隻總計156.55%"
    },
    {
      "name": "群星漫響·耀星·蝶傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "普攻|下落攻擊|演繹|衍變",
      "skillType": "普攻",
      "mvPct": 186.45,
      "hits": 5,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "常態攻擊生成坍縮核（上限5枚），6秒後或施放演繹/衍變/滿核普攻立即演化為耀星·蝶，單隻Lv10倍率37.29%，5隻共186.45%"
    },
    {
      "name": "故此證明·洞悉傷害（必定暴擊）",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "洞悉",
      "skillType": "共解",
      "mvPct": 58.92,
      "hits": 3,
      "maxTriggersPerLoop": 1,
      "fixedCrit": true,
      "note": "解限星域期間變奏技能替換為洞悉，Lv10倍率19.64%*3=58.92%，此次傷害為共鳴解放傷害，並且必定暴擊"
    }
  ],
  "菲比": [
    {
      "name": "追尋光芒之所·二段傳送傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "追尋光芒之所",
      "skillType": "共技",
      "mvPct": 125.26,
      "hits": 2,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放共鳴技能召喚【鏡之環】後一定時間內短按共鳴技能可傳送至【鏡之環】位置，造成衍射傷害（與技能傷害同為62.63%*2=125.26%）"
    },
    {
      "name": "追尋光芒之所·【鏡之環】折射聖輝",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "普攻|閃避反擊",
      "skillType": "普攻",
      "mvPct": 29.84,
      "hits": 2,
      "maxTriggersPerLoop": 6,
      "fixedCrit": false,
      "note": "處於【鏡之環】外時普攻、閃避反擊命中【鏡之環】折射聖輝，造成14.92%*2=29.84%普攻傷害，每0.5秒可觸發一次"
    },
    {
      "name": "延奏技能·傾聽之心傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|傾聽之心",
      "skillType": "延奏",
      "mvPct": 528.41,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能對周圍目標造成總計528.41%衍射傷害（赦罪狀態下傷害倍率提升255%）"
    },
    {
      "name": "共鳴鏈6·鏡之環附帶重擊·星輝",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "追尋光芒之所",
      "skillType": "重擊",
      "mvPct": 248.07,
      "hits": 3,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "RC6：赦罪狀態、告解狀態下，施放共鳴技能召喚【鏡之環】時，向【鏡之環】位置附帶一次重擊星輝（82.69%*3=248.07%），不消耗【福音】"
    }
  ],
  "贊妮": [
    {
      "name": "延奏技能·來日道標傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|來日道標",
      "skillType": "延奏",
      "mvPct": 150,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能造成150%衍射傷害並清空【烈陽餘燼】（每層使該傷害提升10%），同時視為【光噪效應】傷害"
    }
  ],
  "琳奈": [
    {
      "name": "震諧響應·光譜解析",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "諧度破壞|震諧·干涉",
      "skillType": "普攻",
      "mvPct": 1880.75,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "隊伍角色對目標造成【諧度破壞】傷害並使其進入【震諧·干涉】狀態時，琳奈施放震諧響應·光譜解析（Lv10倍率1880.75%，震諧傷害），同一目標每8秒1次"
    },
    {
      "name": "延奏技能·有空一起兜風！傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|有空一起兜風",
      "skillType": "延奏",
      "mvPct": 100,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能造成100%衍射傷害"
    }
  ],
  "陸·赫斯": [
    {
      "name": "所有隕落在此重逢·日髓陣列爆炸",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "斬殺日冕·曜|判決大地裂響",
      "skillType": "普攻",
      "mvPct": 153.45,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放斬殺日冕·曜在地上形成日髓陣列，5秒後自動爆炸或由判決大地裂響落地立即引爆，造成153.45%衍射傷害，此傷害為普攻傷害"
    },
    {
      "name": "延奏技能·致瀕死以答傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|致瀕死以答",
      "skillType": "延奏",
      "mvPct": 500,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能造成陸·赫斯500%攻擊的衍射傷害"
    }
  ],
  "露西": [
    {
      "name": "共鳴技能·有效載荷追加攻擊",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "有效載荷",
      "skillType": "共技",
      "mvPct": 70.17,
      "hits": 3,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "有效載荷突進命中目標時自動施放追加攻擊，Lv10倍率40.09%+10.03%+20.05%=70.17%"
    },
    {
      "name": "駭破響應·數據崩解",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "諧度破壞|駭破·干涉",
      "skillType": "共技",
      "mvPct": 1367.75,
      "hits": 5,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "隊伍角色對目標造成【諧度破壞】傷害使其進入【駭破·干涉】時觸發，Lv10倍率1094.19%+68.39%*4=1367.75%（此次傷害為駭破傷害，同一目標每8秒1次）"
    },
    {
      "name": "共鳴鏈2·脈衝干擾額外重擊傷害",
      "source": "rc2",
      "minRc": 2,
      "triggerPattern": "脈衝干擾",
      "skillType": "重擊",
      "mvPct": 450,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "RC2：施放共鳴技能·脈衝干擾後額外造成1次450%的衍射傷害，該次傷害為重擊傷害"
    }
  ],
  "莉莉": [
    {
      "name": "墜於幻夢搖籃·夢縛持續傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "墜於幻夢搖籃",
      "skillType": "共解",
      "mvPct": 19.89,
      "hits": 1,
      "maxTriggersPerLoop": 10,
      "fixedCrit": false,
      "note": "施放共鳴解放進入夢鄉期間移動可控制夢縛進行攻擊，單次Lv10倍率19.89%（切換至其他角色後停止夢縛攻擊）"
    },
    {
      "name": "花滿夢土·重擊·夢之童話的落幕",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "編織的夢之童話",
      "skillType": "重擊",
      "mvPct": 35.79,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "重擊·編織的夢之童話結束後自動施放（或滿300點夢鈴的禱聲提前施放），Lv10倍率35.79%"
    },
    {
      "name": "花滿夢土·重擊·夢之魘影的終結",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "編織的夢之魘影",
      "skillType": "重擊",
      "mvPct": 35.79,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "重擊·編織的夢之魘影結束後自動施放（或滿300點夢鈴的禱聲提前施放），Lv10倍率35.79%"
    }
  ],
  "椿": [
    {
      "name": "延奏技能·纏繞",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "延奏|纏繞",
      "skillType": "延奏",
      "mvPct": 329.24,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能「纏繞」：攻擊目標，造成椿329.24%攻擊的湮滅傷害。"
    },
    {
      "name": "延奏技能·纏繞（一日花額外傷害）",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "一日花",
      "skillType": "延奏",
      "mvPct": 459.02,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "延奏技能「纏繞」：施放共鳴回路一日花後，下次延奏技能纏繞額外造成椿459.02%攻擊的湮滅傷害。"
    },
    {
      "name": "共鳴回路·永生花",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "一日花|永生花",
      "skillType": "普攻",
      "mvPct": 1262.45,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴鏈6：施放一日花後15秒內協奏能量充滿時可施放永生花，造成共鳴回路一日花100%的湮滅傷害（Lv.10為1262.45%），此次傷害為普攻傷害，每25秒可施放1次。"
    }
  ],
  "洛可可": [
    {
      "name": "普攻·構築現實",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "即興喜劇|道具師的自我修養·第三段|幻想照進現實",
      "skillType": "重擊",
      "mvPct": 357.86,
      "hits": 1,
      "maxTriggersPerLoop": 5,
      "fixedCrit": false,
      "note": "共鳴鏈6：施放共鳴解放後12秒內，普攻幻想照進現實第3段落地後進入飛躍幻想狀態，短按普攻施放普攻構築現實，造成第3段100%的傷害（Lv.10為357.86%），此次傷害為重擊傷害，落地後再次進入飛躍幻想狀態。"
    }
  ],
  "坎特蕾拉": [
    {
      "name": "幽影共舞·驚醒",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "斑駁幻夢|感知汲取|陷溺",
      "skillType": "普攻",
      "mvPct": 198.81,
      "hits": 1,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "處於迷夢的目標受到坎特蕾拉傷害時觸發一次驚醒（Lv.10為198.81%；共鳴鏈2使陷溺亦可附加迷夢且驚醒倍率提升245%），此次傷害為普攻傷害。"
    },
    {
      "name": "海面之下·瀰漫（織夢水母協同）",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "海面之下|陷溺",
      "skillType": "普攻",
      "mvPct": 305.34,
      "hits": 21,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放共鳴解放陷溺後附加瀰漫，在場角色造成傷害時每秒召喚1隻織夢水母協同攻擊，共可召喚21隻（Lv.10為14.54%×21=305.34%），此次傷害為普攻傷害。"
    },
    {
      "name": "投到倒影的懷裡·瀰漫額外水母",
      "source": "rc5",
      "minRc": 5,
      "triggerPattern": "海面之下|陷溺|瀰漫",
      "skillType": "普攻",
      "mvPct": 72.7,
      "hits": 5,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴鏈5：共鳴解放瀰漫的織夢水母最大召喚數增加5隻（Lv.10額外14.54%×5=72.7%），此次傷害為普攻傷害。"
    }
  ],
  "弗洛洛": [
    {
      "name": "強化攻擊·赫卡忒（後台聲骸觸發）",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "往日深淵的圓舞曲|聲骸",
      "skillType": "聲骸",
      "mvPct": 347.93,
      "hits": 2,
      "maxTriggersPerLoop": 10,
      "fixedCrit": false,
      "note": "共鳴解放指揮狀態期間弗洛洛不為登場角色時，隊伍中角色施放聲骸技能觸發強化攻擊·赫卡忒（Lv.10弦樂/彩樂347.93%、管樂330.53%），最多觸發10次，本次傷害為聲骸技能傷害。"
    },
    {
      "name": "未完成的曲目·額外強化攻擊·赫卡忒",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "往日深淵的圓舞曲|延奏|未完成的曲目",
      "skillType": "聲骸",
      "mvPct": 347.93,
      "hits": 2,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "延奏技能「未完成的曲目」：弗洛洛處於指揮狀態時施放此技能並切換至其他角色時，赫卡忒將額外施放2次強化攻擊·赫卡忒（單次弦樂/彩樂347.93%），本次傷害為聲骸技能傷害。"
    },
    {
      "name": "重世幻象·赫卡忒",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "亡與死的樂章|永不消逝的夢囈",
      "skillType": "聲骸",
      "mvPct": 216.42,
      "hits": 1,
      "maxTriggersPerLoop": 6,
      "fixedCrit": false,
      "note": "共鳴鏈6：施放亡與死的樂章、永不消逝的夢囈期間，召喚赫卡忒施放1次重世幻象·赫卡忒，造成弗洛洛攻擊216.42%的湮滅傷害並獲得8層餘響，本次傷害為聲骸技能傷害。"
    }
  ],
  "秧秧·玄翎": [
    {
      "name": "裁羽寂萬音·玄翎之影",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "劍式流轉·蒼|劍式流轉·羽",
      "skillType": "重擊",
      "mvPct": 337.98,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "施放裁羽寂萬音時獲得聲聲流轉狀態（不可疊加），施放共鳴技能·劍式流轉·蒼或羽時召喚玄翎之影造成337.98%湮滅傷害（此次傷害為重擊傷害），召喚後移除狀態。"
    },
    {
      "name": "玄翎之影·抗墜",
      "source": "rc1",
      "minRc": 1,
      "triggerPattern": "劍式流轉·蒼|劍式流轉·羽",
      "skillType": "重擊",
      "mvPct": 337.98,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "RC1：施放共鳴技能·劍式流轉·蒼、共鳴技能·劍式流轉·羽時，召喚玄翎之影·抗墜，造成337.98%湮滅傷害，此次傷害為重擊傷害。"
    },
    {
      "name": "玄翎之影·貫珠",
      "source": "rc2",
      "minRc": 2,
      "triggerPattern": "普攻·蒼劍式|普攻·羽劍式",
      "skillType": "重擊",
      "mvPct": 337.98,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "RC2：脫離戰鬥狀態達到4秒獲得1層貫珠，施放普攻·蒼劍式或普攻·羽劍式時召喚玄翎之影·貫珠造成337.98%湮滅傷害（此次傷害為重擊傷害），僅首輪開戰觸發1次，常規持續DPM循環為0次。"
    },
    {
      "name": "玄翎之影·止如槁木",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "劍式流轉·蒼|劍式流轉·羽",
      "skillType": "重擊",
      "mvPct": 337.98,
      "hits": 1,
      "maxTriggersPerLoop": 5,
      "fixedCrit": true,
      "note": "RC6：施放劍式流轉·蒼或羽時獲得止如槁木（冷卻25秒），持續期間秧秧·玄翎在場且隊伍附加異常效應後，召喚玄翎之影·止如槁木造成337.98%湮滅傷害（重擊傷害，必定暴擊），間隔1秒，最多5次。"
    }
  ],
  "秋水": [
    {
      "name": "零失誤演繹·重擊必暴（完全蓄力）",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "重擊瞄準完全蓄力命中（每30秒最多觸發1次必定暴擊）",
      "skillType": "重擊",
      "mvPct": 80.52,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": true,
      "note": "固有技能1：秋水的重擊必定暴擊，每30秒可觸發1次（若計算器直接對原技能上必暴Buff則無需重複計算倍率）"
    },
    {
      "name": "移位戲法·霧化彈（6顆全中）",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "施放共鳴技能移位戲法時在幻影周圍生成6顆霧化子彈",
      "skillType": "共技",
      "mvPct": 357.9,
      "hits": 6,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "localSkills單顆倍率為59.65%，實戰一次技能生成6顆共357.9%（1鏈CD減至6秒可放2次）"
    },
    {
      "name": "霧色掩護·霧化子彈（6點霧滴全消耗）",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "迷霧潛行狀態下消耗最多6點霧滴生成6顆霧化子彈",
      "skillType": "共技",
      "mvPct": 357.9,
      "hits": 6,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "localSkills單顆倍率為59.65%，上限6點霧滴全打滿為6顆共357.9%"
    },
    {
      "name": "霧化轉場·額外子彈（普攻穿霧）",
      "source": "rc3",
      "minRc": 3,
      "triggerPattern": "普攻或空中攻擊穿過霧氣時額外生成2顆子彈",
      "skillType": "普攻",
      "mvPct": 48.04,
      "hits": 2,
      "maxTriggersPerLoop": 5,
      "fixedCrit": false,
      "note": "3鏈：共造成當次普攻或空中攻擊的50%傷害；此處mvPct以Lv10普攻五段總倍率(460.74%)之平均值約96.08%的50%估算，或依具體穿霧段數動態乘算0.5"
    }
  ],
  "忌炎": [
    {
      "name": "克己·協同攻擊",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "延奏離場後，下一位登場角色重擊命中目標時觸發（每秒1次，最多2次）",
      "skillType": "延奏",
      "mvPct": 313.4,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "延奏技能：單次313.40%，最多觸發2次（總計626.80%）；5鏈時每次倍率增加120%"
    }
  ],
  "鑒心": [
    {
      "name": "風儀拳術·第一段傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "普攻第一段",
      "skillType": "普攻",
      "mvPct": 69.46,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "localSkills為空，補齊Lv10基礎技能數據"
    },
    {
      "name": "風儀拳術·第二段傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "普攻第二段",
      "skillType": "普攻",
      "mvPct": 133.18,
      "hits": 3,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "Lv10：26.64%*2 + 79.90% = 133.18%"
    },
    {
      "name": "風儀拳術·第三段傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "普攻第三段",
      "skillType": "普攻",
      "mvPct": 167,
      "hits": 4,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "Lv10：41.75%*4 = 167.00%"
    },
    {
      "name": "風儀拳術·第四段傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "普攻第四段",
      "skillType": "普攻",
      "mvPct": 113.4,
      "hits": 1,
      "maxTriggersPerLoop": 4,
      "fixedCrit": false,
      "note": "Lv10：113.40%"
    },
    {
      "name": "風儀拳術·重擊傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "常態消耗耐力重擊",
      "skillType": "重擊",
      "mvPct": 126.07,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "Lv10：126.07%"
    },
    {
      "name": "風儀拳術·空中攻擊傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "空中下落攻擊",
      "skillType": "普攻",
      "mvPct": 123.27,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "Lv10：123.27%"
    },
    {
      "name": "風儀拳術·閃避反擊傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "成功閃避後短按普攻",
      "skillType": "普攻",
      "mvPct": 244.95,
      "hits": 3,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "Lv10：40.83%*2 + 163.29% = 244.95%"
    },
    {
      "name": "靜氣循行·行氣反擊傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "架勢姿態受擊或3鏈持續2.5秒後施放",
      "skillType": "共技",
      "mvPct": 334.6,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "Lv10：334.60%（2鏈可使用次數+1）"
    },
    {
      "name": "靜氣循行·降氣反擊傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "架勢姿態主動鬆開共鳴技能施放",
      "skillType": "共技",
      "mvPct": 258.73,
      "hits": 1,
      "maxTriggersPerLoop": 2,
      "fixedCrit": false,
      "note": "Lv10：258.73%"
    },
    {
      "name": "滌淨力場·共鳴解放持續傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "施放共鳴解放後風場持續牽引傷害（持續3.12秒）",
      "skillType": "共解",
      "mvPct": 29.83,
      "hits": 1,
      "maxTriggersPerLoop": 10,
      "fixedCrit": false,
      "note": "Lv10單跳29.83%，持續3.12秒約造成8~10跳傷害"
    },
    {
      "name": "滌淨力場·共鳴解放炸裂傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "共鳴解放風場消失時炸裂",
      "skillType": "共解",
      "mvPct": 636.2,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "Lv10：636.20%"
    },
    {
      "name": "掌息之要·技能傷害",
      "source": "skill",
      "minRc": 0,
      "triggerPattern": "變奏登場施放",
      "skillType": "變奏",
      "mvPct": 169,
      "hits": 4,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "Lv10：33.80%*3 + 67.60% = 169.00%"
    },
    {
      "name": "混元氣旋·運氣持續傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "氣滿長按普攻進入運氣狀態期間持續傷害",
      "skillType": "重擊",
      "mvPct": 24.86,
      "hits": 1,
      "maxTriggersPerLoop": 15,
      "fixedCrit": false,
      "note": "共鳴迴路「重擊·混元氣旋」，Lv10單跳24.86%"
    },
    {
      "name": "混元氣旋·衝拳傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "未達到小周天時中斷運氣狀態施放",
      "skillType": "重擊",
      "mvPct": 248.52,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴迴路「重擊·混元氣旋」，Lv10：248.52%（6鏈快軸核心觸發技）"
    },
    {
      "name": "混元氣旋·小周天震氣傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "運氣達到小周天階段時觸發",
      "skillType": "重擊",
      "mvPct": 139.17,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴迴路「重擊·混元氣旋」，Lv10：139.17%"
    },
    {
      "name": "混元氣旋·大周天·內震氣傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "運氣達到大周天·內階段時觸發",
      "skillType": "重擊",
      "mvPct": 377.74,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴迴路「重擊·混元氣旋」，Lv10：377.74%"
    },
    {
      "name": "混元氣旋·大周天·外震氣傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "運氣達到大周天·外階段時觸發",
      "skillType": "重擊",
      "mvPct": 516.91,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴迴路「重擊·混元氣旋」，Lv10：516.91%"
    },
    {
      "name": "混元氣旋·推手傷害",
      "source": "forte",
      "minRc": 0,
      "triggerPattern": "小周天或大周天·內中斷運氣狀態時施放",
      "skillType": "重擊",
      "mvPct": 218.7,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "共鳴迴路「重擊·混元氣旋」，Lv10：218.70%"
    },
    {
      "name": "向己而生·特殊行氣反擊",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "重擊·混元氣旋期間施展衝拳後，5秒內施放強化共鳴技能",
      "skillType": "重擊",
      "mvPct": 556.67,
      "hits": 1,
      "maxTriggersPerLoop": 1,
      "fixedCrit": false,
      "note": "6鏈專屬衍生技：雖為強化共鳴技能，但文本明確指定「此次傷害為重擊傷害」"
    }
  ],
  "夏空": [
    {
      "name": "終曲未終·音律獨奏傷害",
      "source": "rc6",
      "minRc": 6,
      "triggerPattern": "夏空或合奏音影進入音律獨奏狀態時",
      "skillType": "共解",
      "mvPct": 220,
      "hits": 1,
      "maxTriggersPerLoop": 3,
      "fixedCrit": false,
      "note": "夏空或合奏音影在進入音律獨奏狀態時對周圍目標造成220%的氣動傷害，視為共鳴解放傷害。"
    }
  ]
};

export function applySkillTypeFixesToDb(roleSkillsDb) {
  if (!roleSkillsDb || typeof roleSkillsDb !== 'object') return 0;
  let count = 0;
  for (const [roleKey, fixes] of Object.entries(ROLE_SKILL_TYPE_FIXES_DB)) {
    const list = roleSkillsDb[roleKey];
    if (!Array.isArray(list)) continue;
    for (const fix of fixes) {
      const target = list.find(s => s && s.name === fix.name);
      if (target) {
        target.actionType = target.actionType || target.skillType;
        if (target.skillType !== fix.correctType) {
          target.skillType = fix.correctType;
          count++;
        }
        target.damageTypeNote = fix.note;
      }
    }
  }
  return count;
}

export function checkTriggeredDerivedSkills(charName, gridNodes = [], rc = 0) {
  if (!charName) return [];
  const baseName = String(charName).replace(/\(.*\)|（.*）|S\d+/g, '').trim();
  const list = ROLE_DERIVED_SKILLS_DB[baseName] || ROLE_DERIVED_SKILLS_DB[charName] || [];
  if (!list.length || !Array.isArray(gridNodes) || gridNodes.length === 0) return [];

  const effRc = Number(rc) || 0;
  const triggered = [];

  for (const d of list) {
    if (effRc < (d.minRc || 0)) continue;
    let re = null;
    if (d.triggerPattern) {
      try {
        re = new RegExp(d.triggerPattern);
      } catch {
        re = null;
      }
    }
    let matchCount = 0;
    let alreadyInGrid = false;
    for (const n of gridNodes) {
      if (!n) continue;
      const act = `${n.action || ''} ${n.skill || ''}`;
      if (act.includes(d.name)) alreadyInGrid = true;
      const nodeChar = String(n.char || '').replace(/\(.*\)|（.*）|S\d+/g, '').trim();
      if (nodeChar && nodeChar !== baseName) continue;
      if (re && re.test(act)) matchCount++;
    }
    if (matchCount > 0) {
      triggered.push({
        ...d,
        triggers: Math.min(d.maxTriggersPerLoop || 1, matchCount),
        alreadyInGrid
      });
    }
  }
  return triggered;
}
