// src/data/buffsAndLoadoutsDb.js — Nanoka v3.8.10 Verified Structured Buffs & Loadouts Dictionary
import {
  WEAPONS_DB,
  ECHO_SETS_DB,
  MAIN_ECHOES_DB,
  ROLE_SKILLS_DB,
  ROLE_RC_DB,
  ROLE_INHERENT_DB,
  DUAL_MODE_ROLES,
  PRESET_KEYBIND_ROTATIONS,
  getCharOffsetCapabilities,
  computeCharEffectiveStats,
  getDefaultSlotConfig,
  getMatrixBuffNodeMultiplier,
  getMatrixBuffsByVersion,
  calcRealSkillDamage,
  parseKeybindShorthandText,
  compileKeybindSectionToGrid
} from './combatDb.js';

import {
  ROLE_SKILL_TYPE_FIXES_DB,
  ROLE_DERIVED_SKILLS_DB,
  applySkillTypeFixesToDb,
  checkTriggeredDerivedSkills
} from './derivedSkillsDb.js';

// 立即套用 Nanoka 3.8 角色招式傷害類型修正表 (修正 62 位角色之普攻/重擊/共技/共解/聲骸歸類)
applySkillTypeFixesToDb(ROLE_SKILLS_DB);

/**
 * 1. Nanoka 5★/4★ 武器精確結構化詞條表 (R1 ~ R5 陣列索引 0 ~ 4)
 * 解決正則誤判「特定技能無視防禦/減抗」、「疊層未乘算」與「同奏/離場互斥分支」問題
 */
export const WEAPON_EXACT_OVERRIDES_DB = {
  // 馭冕鑄雷之權 (奧古斯塔專武): 攻擊+12~24%, 重擊傷害+20~40%, 重擊無視防禦 7.2%×5=36% ~ 12%×5=60%
  21010046: {
    atkPct: [12, 15, 18, 21, 24],
    heavyDmgPct: [20, 25, 30, 35, 40],
    heavyIgnoreDefPct: [36, 42, 48, 54, 60]
  },
  // 玉闕玄華 (心專武): 全屬傷+12~24%, 共技加深+36~72%, 共技無視導電抗 10~24%, 電磁效應加深+30~60%
  21050116: {
    allDmgPct: [12, 15, 18, 21, 24],
    skillAmpPct: [36, 45, 54, 63, 72],
    skillResShredPct: [10, 13.5, 17, 20.5, 24],
    anomalyAmpPct: [30, 37.5, 45, 52.5, 60]
  },
  // 存幀 (洛瑟菈專武): 攻擊+12~24%, 自身冷凝+30~60%, 全隊攻擊+24~48% (同名不可疊加，包含自身與隊友)
  21050086: {
    atkPct: [36, 45, 54, 63, 72],
    elemDmgPct: [30, 37.5, 45, 52.5, 60],
    teamAtkPct: [24, 30, 36, 42, 48]
  },
  // 幽冥的忘憂章 (弗洛洛專武): 攻擊+12~24%, 共技加成+32~64%, 聲骸加深+32~64%, 無視防禦 8~16%
  21050066: {
    atkPct: [12, 15, 18, 21, 24],
    skillDmgPct: [32, 40, 48, 56, 64],
    echoAmpPct: [32, 40, 48, 56, 64],
    ignoreDefPct: [8, 10, 12, 14, 16]
  },
  // 昭日譯註 (西格莉卡專武): 攻擊+12~24%, 聲骸加深+32~64%, 氣動無視防禦 10~20%
  21040066: {
    atkPct: [12, 15, 18, 21, 24],
    echoAmpPct: [32, 40, 48, 56, 64],
    ignoreDefPct: [10, 12.5, 15, 17.5, 20]
  },
  // 白晝之脊 (陸·赫斯專武): 攻擊+12~24%, 衍射+20~40%, 普攻加深+20~40%, 普攻無視防禦 10~20%
  21040056: {
    atkPct: [12, 15, 18, 21, 24],
    elemDmgPct: [20, 25, 30, 35, 40],
    basicAmpPct: [20, 25, 30, 35, 40],
    basicIgnoreDefPct: [10, 12.5, 15, 17.5, 20]
  },
  // 蜃影 (露西專武): 攻擊+12~24%, 衍射 20%×2=40~80%, 重擊加深+30~60%, 重擊無視防禦 10~20%
  21030056: {
    atkPct: [12, 15, 18, 21, 24],
    elemDmgPct: [40, 50, 60, 70, 80],
    heavyAmpPct: [30, 37.5, 45, 52.5, 60],
    heavyIgnoreDefPct: [10, 12.5, 15, 17.5, 20]
  },
  // 溢彩熒輝 (琳奈專武): 攻擊+12~24%, 普攻+36~72%, 全隊造成傷害 8%×3=24~48%
  21030046: {
    atkPct: [12, 15, 18, 21, 24],
    basicDmgPct: [36, 45, 54, 63, 72],
    allDmgPct: [24, 30, 36, 42, 48],
    teamElemDmgPct: [24, 30, 36, 42, 48]
  },
  // 光影雙生 (嘉貝莉娜專武): 攻擊+12~24%, 重擊加深+24~48%, 聲骸加深+24~48%, 無視防禦 8~16%
  21030036: {
    atkPct: [12, 15, 18, 21, 24],
    heavyAmpPct: [24, 30, 36, 42, 48],
    echoAmpPct: [24, 30, 36, 42, 48],
    ignoreDefPct: [8, 10, 12, 14, 16]
  },
  // 沉冥 (鎖暝專武): 攻擊+12~24%, 導電+30~60%; 副C給全隊【羈念】導電+24~48% (與主C站場【悵念】互斥)
  21020107: {
    atkPct: [12, 15, 18, 21, 24],
    elemDmgPct: [54, 67.5, 81, 94.5, 108], // 自身 30% + 羈念 24%
    teamElemDmgPct: [24, 30, 36, 42, 48]
  },
  // 天之蒼蒼 (秧秧·玄翎專武): 全屬傷+12~24%, 重擊加深+36~72%, 重擊無視防禦 12~24%
  21020096: {
    allDmgPct: [12, 15, 18, 21, 24],
    heavyAmpPct: [36, 45, 54, 63, 72],
    heavyIgnoreDefPct: [12, 15, 18, 21, 24]
  },
  // 灼霜 (緋雪專武): 攻擊+12~24%, 冷凝加深+28~56%, 共鳴解放無視防禦 10~20%, 霜漸效應加深+20~40%
  21020086: {
    atkPct: [12, 15, 18, 21, 24],
    elemAmpPct: [28, 35, 42, 49, 56],
    libIgnoreDefPct: [10, 12.5, 15, 17.5, 20],
    anomalyAmpPct: [20, 25, 30, 35, 40]
  },
  // 永遠的啟明星 (愛彌斯專武): 全屬傷+12~24%, 共解無視防禦 32~64%, 共解無視熱熔抗 10~30%
  21020076: {
    allDmgPct: [12, 15, 18, 21, 24],
    libIgnoreDefPct: [32, 40, 48, 56, 64],
    libResShredPct: [10, 15, 20, 25, 30]
  },
  // 裁竹 (仇遠專武): 攻擊+12~24%, 重擊 30%×2=60~120%, 全隊聲骸加成+20~40%
  21020066: {
    atkPct: [12, 15, 18, 21, 24],
    heavyDmgPct: [60, 75, 90, 105, 120],
    echoDmgPct: [20, 25, 30, 35, 40],
    teamEchoDmgPct: [20, 25, 30, 35, 40]
  },
  // 焰痕 (露帕專武): 攻擊+12~24%, 共解+24~48%, 全隊熱熔+24~48%
  21010036: {
    atkPct: [12, 15, 18, 21, 24],
    libDmgPct: [24, 30, 36, 42, 48],
    elemDmgPct: [24, 30, 36, 42, 48],
    teamElemDmgPct: [24, 30, 36, 42, 48]
  },
  // 贗作的矮星 (達妮婭專武): 攻擊+12~24%(自)+24~48%(全隊), 共解+36~72%
  21050076: {
    atkPct: [36, 45, 54, 63, 72],
    libDmgPct: [36, 45, 54, 63, 72],
    teamAtkPct: [24, 30, 36, 42, 48]
  },
  // 萬物持存的注釋 (尤諾專武): 攻擊+12~24%, 共解+20~40%, 共解無視防禦 7.2%×5=36~60%
  21040046: {
    atkPct: [12, 15, 18, 21, 24],
    libDmgPct: [20, 25, 30, 35, 40],
    libIgnoreDefPct: [36, 42, 48, 54, 60]
  },
  // 碎骨 (蕾貝卡專武): 攻擊+12~24%(自)+24~48%(全隊), 普攻 24%+12%=36~72%
  21030066: {
    atkPct: [36, 45, 54, 63, 72],
    basicDmgPct: [36, 45, 54, 63, 72],
    teamAtkPct: [24, 30, 36, 42, 48]
  },
  // 雲琅 (清宵專武): 攻擊+12~24%, 氣動 11.2%×5=56~112%, 氣動無視防禦 10~20%
  21020106: {
    atkPct: [12, 15, 18, 21, 24],
    elemDmgPct: [56, 70, 84, 98, 112],
    ignoreDefPct: [10, 12.5, 15, 17.5, 20]
  },
  // 曇切 (千咲專武): 攻擊+12~24%, 共解 8%×3=24~48%, 全隊全屬傷+24~48%
  21010056: {
    atkPct: [12, 15, 18, 21, 24],
    libDmgPct: [24, 30, 36, 42, 48],
    allDmgPct: [24, 30, 36, 42, 48],
    teamElemDmgPct: [24, 30, 36, 42, 48]
  },
  // 棲霞飲露 (穗穗專武): 生命+12~24%, 全隊攻擊+20~40%
  21050096: {
    hpPct: [12, 15, 18, 21, 24],
    atkPct: [20, 25, 30, 35, 40],
    teamAtkPct: [20, 25, 30, 35, 40]
  },
  // 星序協響 (守岸人專武): 生命+12~24%, 全隊攻擊+14~28%
  21050036: {
    hpPct: [12, 15, 18, 21, 24],
    atkPct: [14, 17.5, 21, 24.5, 28],
    teamAtkPct: [14, 17.5, 21, 24.5, 28]
  },
  // 安魂 (莉莉專武): 生命+12~24%, 同奏角色攻擊+16~32%, 登場角色聲骸傷害+24~48%
  21030076: {
    hpPct: [12, 15, 18, 21, 24],
    atkPct: [16, 20, 24, 28, 32],
    echoDmgPct: [24, 30, 36, 42, 48],
    teamAtkPct: [16, 20, 24, 28, 32],
    teamEchoDmgPct: [24, 30, 36, 42, 48]
  },
  // 千般渡 (景燃專武): 全屬傷+12~24%, 暴傷 4%×6=24~48%, 重擊暴率+12~24%, 重擊無視防禦 30~50%
  21010076: {
    allDmgPct: [12, 15, 18, 21, 24],
    critDmg: [24, 30, 36, 42, 48],
    heavyCritRate: [12, 15, 18, 21, 24],
    heavyIgnoreDefPct: [30, 35, 40, 45, 50]
  },
  // 宙算儀軌 (莫寧專武): 防禦+16~32%, 全隊暴傷+20~40%
  21010066: {
    defPct: [16, 20, 24, 28, 32],
    critDmg: [20, 25, 30, 35, 40],
    teamCritDmg: [20, 25, 30, 35, 40]
  }
};

/**
 * 2. Nanoka 37 套聲骸套裝精確結構化詞條表
 * 區分：自身常駐 (self) vs 延奏交接給下一位角色 (outroNext) vs 全隊共享 (team)
 */
export const ECHO_SET_EXACT_OVERRIDES_DB = {
  7:  { pc2: { healPct: 10 }, pc5: { atkPct: 15, teamAtkPct: 15 } }, // 隱世回光
  8:  { pc2: { er: 10 }, pc5: { outroTeamAtkPct: 22.5 } },           // 輕雲出月 (僅下一位登場角色+22.5%攻)
  12: { pc2: { elemDmgPct: 10 }, pc5: { outroTeamElemDmgPct: 15, outroTeamElemAttr: '湮滅' } }, // 幽夜隱匿之帷
  16: { pc2: { elemDmgPct: 10 }, pc5: { elemDmgPct: 30, teamElemDmgPct: 15, teamElemAttr: '氣動' } }, // 流雲逝盡之空
  18: { pc2: { elemDmgPct: 10 }, pc5: { elemDmgPct: 15, libDmgPct: 20, teamElemDmgPct: 15, teamElemAttr: '熱熔' } }, // 奔狼燎原之焰
  21: { pc3: { heavyDmgPct: 30, echoDmgPct: 16, teamEchoDmgPct: 16 } }, // 息界同調之律
  22: { pc3: { heavyCritRate: 20, echoCritRate: 20, elemDmgPct: 16 } }, // 焚羽獵魔之影 (重擊暴率+20%, 聲骸暴率+20%, 熱熔+16%)
  24: { pc2: { elemDmgPct: 10 }, pc5: { outroTeamAtkPct: 30 } },     // 逆光躍彩之約 (僅下一個變奏登場角色攻擊+15%+15%=30%)
  25: { pc2: { healPct: 10 }, pc5: { atkPct: 25, teamAtkPct: 25 } }, // 星構尋輝之環
  28: { pc2: { elemDmgPct: 10 }, pc5: { elemDmgPct: 10, outroTeamElemDmgPct: 25, outroTeamElemAttr: '熱熔' } }, // 斑駁粉飾之沫
  29: { pc2: { elemDmgPct: 10 }, pc5: { elemDmgPct: 15, echoCritRate: 20 } }, // 聽喚語義之願 (聲骸技能暴擊+20%, 氣動+15%)
  // 雪落無聲之願 (Set 30): 2pc 冷凝+10%; 5pc 霜漸冷凝+10%; 【落雪】二選一：主C自用共解+25%暴率 OR 副C延奏給下位角色+25%冷凝傷害
  30: {
    pc2: { elemDmgPct: 10 },
    pc5: {
      elemDmgPct: 10,
      critRateSelfMain: 25,
      outroTeamElemDmgPct: 25,
      outroTeamElemAttr: '冷凝'
    }
  },
  31: { pc2: { atkPct: 10 }, pc5: { tuneAmp: 20, teamTuneAmp: 20 } }, // 剪心輯夢之影
  // 羽落空塵之歌 (Set 33): 2pc 共效+10%; 5pc 虛湮角色得【玄翎之羽】(暴率+20%, 重擊+35%), 霜漸角色得【重明之羽】(全隊攻擊最高+25%)
  33: {
    pc2: { er: 10 },
    pc5: {
      xuyanBranch: { critRate: 20, heavyDmgPct: 35 },
      shuangjianBranch: { atkPctPerEr: 0.1, maxAtkPct: 25, teamAtkPctPerEr: 0.1, maxTeamAtkPct: 25 }
    }
  },
  37: { pc2: { elemDmgPct: 10 }, pc5: { elemDmgPct: 10, outroTeamElemDmgPct: 25, outroTeamElemAttr: '導電' } }, // 鏡影流電之瞬
  38: { pc2: { healPct: 10 }, pc5: { atkPct: 25, teamAtkPct: 25 } }  // 茜染懷想之花
};

/**
 * 3. Nanoka 首位聲骸 (Main Echo) 精確被動與延奏交接表
 * 嚴格分離「首位裝配自身常駐 (self)」與「施放延奏後下一位登場角色增益 (outroNext)」及「特定角色限定效果」
 */
export const MAIN_ECHO_EXACT_OVERRIDES_DB = {
  280045: { self: { elemDmgPct: 20, elemAttr: '導電' } }, // 共鳴迴響·天演溯心
  280044: { self: { elemDmgPct: 20, elemAttr: '氣動' } }, // 天傀劫煞
  280043: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '湮滅' } }, // 千傀重樓
  280042: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '熱熔' } }, // 萬囮牢·朽軀
  280041: { self: { critRate: 15, reqChars: ['露西', '蕾貝卡'] } }, // 共鳴迴響·夢魘亞當·碎骨
  280040: { self: {}, outroNext: { teamElemDmgPct: 12, elemAttr: '熱熔' } }, // 共鳴迴響·達妮婭 (延奏給下位熱熔+12%)
  280039: { self: { elemDmgPct: 12, libDmgPct: 12, elemAttr: '冷凝' } }, // 共鳴迴響·鳴式·虛造神型
  280038: { self: { elemDmgPct: 12, echoDmgPct: 20, elemAttr: '氣動' } }, // 無銘探索者
  280037: { self: { libDmgPct: 25, reqChars: ['愛彌斯'] } }, // 辛吉勒姆
  280036: { self: {}, outroNext: { teamElemDmgPct: 10 } }, // 海維夏 (延奏給下位全屬傷+10%)
  280034: { self: { er: 10 } }, // 爐芯機骸
  280033: { self: { elemDmgPct: 12, libDmgPct: 12, elemAttr: '湮滅' } }, // 共鳴迴響·鳴式·利維亞坦
  280032: { self: { elemDmgPct: 12, libDmgPct: 12, elemAttr: '氣動' } }, // 海之女
  280031: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '導電' } }, // 偽作的神王
  280030: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '氣動' } }, // 共鳴迴響·芬萊克
  280029: { self: { elemDmgPct: 12, echoDmgPct: 20, elemAttr: '湮滅' } }, // 夢魘·赫卡忒
  280028: { self: { elemDmgPct: 12, libDmgPct: 12, elemAttr: '熱熔' } }, // 榮耀獅像
  280027: { self: { elemDmgPct: 12 } }, // 夢魘·凱爾匹 (冷凝+12%, 氣動+12%)
  280026: { self: { elemDmgPct: 10, extraElemDmgPct: 10, reqExtraChars: ['卡提希婭', '風主', '漂泊者'] } }, // 共鳴迴響·芙露德莉斯
  280025: { self: { elemDmgPct: 12, elemAttr: '冷凝' } }, // 夢魘·輝螢軍勢
  280024: { self: { elemDmgPct: 12, elemAttr: '衍射' } }, // 夢魘·哀聲鷙
  280023: { self: { elemDmgPct: 12, skillDmgPct: 12, elemAttr: '熱熔' } }, // 夢魘·燎照之騎
  280022: { self: { elemDmgPct: 12, basicDmgPct: 12, elemAttr: '湮滅' } }, // 夢魘·無冠者
  280021: { self: { elemDmgPct: 12, skillDmgPct: 12, elemAttr: '導電' } }, // 夢魘·朔雷之鱗
  280020: { self: { elemDmgPct: 12, libDmgPct: 12, elemAttr: '導電' } }, // 夢魘·雲閃之鱗
  280019: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '湮滅' } }, // 夢魘·無常凶鷺
  280018: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '氣動' } }, // 夢魘·飛廉之猩
  280017: { self: { elemDmgPct: 12, basicDmgPct: 12, elemAttr: '湮滅' } }, // 羅蕾萊
  280015: { self: { elemDmgPct: 12, basicDmgPct: 12, elemAttr: '熱熔' } }, // 嘆息古龍
  280014: { self: { elemDmgPct: 12, skillDmgPct: 12, elemAttr: '冷凝' } }, // 異構武裝
  280013: { self: { er: 10, atkPct: 10 }, outroNext: { teamAtkPct: 10 } }, // 無歸的謬誤
  280012: { self: { skillDmgPct: 16 } }, // 角
  280010: { self: {}, outroNext: { teamElemDmgPct: 12 } }, // 無常凶鷺 (延奏給下位傷害+12%)
  280009: { self: { atkPct: 12 } }, // 聚械機偶
  722:    { self: { allDmgPct: 10 }, outroNext: { teamElemDmgPct: 10 } }, // 鳴鐘之龜
  200154: { self: {}, outroNext: { teamElemDmgPct: 12, elemAttr: '導電' } }, // 絕息魄
  200153: { self: { er: 10 } }, // 解形煞
  200134: { self: {}, outroNext: { teamAtkPct: 12 } }, // 迷朧幻蛾
  200131: { self: {}, outroNext: { teamElemDmgPct: 12, elemAttr: '冷凝' } }, // 格洛獁圖 (延奏給下位冷凝+12%)
  200117: { self: { elemDmgPct: 12, basicDmgPct: 12 } }, // 雙極·淵隕重鋒
  200116: { self: { elemDmgPct: 12, basicDmgPct: 12 } }, // 雙極·星升輝銃
  200098: { self: { elemDmgPct: 12, echoDmgPct: 20, elemAttr: '熱熔' } }, // 蝕脊龍
  200094: { self: { elemDmgPct: 12, libDmgPct: 12, elemAttr: '氣動' } }, // 角鱷
  200088: { self: { elemDmgPct: 12, heavyDmgPct: 12, elemAttr: '衍射' } }  // 榮光節使
};

export {
  WEAPONS_DB,
  ECHO_SETS_DB,
  MAIN_ECHOES_DB,
  ROLE_SKILLS_DB,
  ROLE_RC_DB,
  ROLE_INHERENT_DB,
  DUAL_MODE_ROLES,
  PRESET_KEYBIND_ROTATIONS,
  getCharOffsetCapabilities,
  computeCharEffectiveStats,
  getDefaultSlotConfig,
  getMatrixBuffNodeMultiplier,
  getMatrixBuffsByVersion,
  calcRealSkillDamage,
  parseKeybindShorthandText,
  compileKeybindSectionToGrid,
  ROLE_SKILL_TYPE_FIXES_DB,
  ROLE_DERIVED_SKILLS_DB,
  applySkillTypeFixesToDb,
  checkTriggeredDerivedSkills
};