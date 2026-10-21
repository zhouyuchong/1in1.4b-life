import fs from 'fs';
import path from 'path';

const agesDir = path.resolve('public/data/ages');

if (!fs.existsSync(agesDir)) {
  fs.mkdirSync(agesDir, { recursive: true });
}

// 建立具有强烈社会真实感和时代代表性的核心年龄事件与抉择定义
const richAgesData = {
  0: {
    events: [
      { text: "伴随着清脆的啼哭声，你降生在这片拥有十四亿人口的土地上。", effect: { sanity: 0 } },
      { text: "护士在产房外的白板上写下了你的出生体重和身长，全家人在门外焦急等候。", effect: { sanity: 2 } },
      { text: "居委会/村委会提醒父母抓紧时间去派出所上户口、办理新生儿城乡居民医保。", effect: { health: 2 } }
    ],
    choices: []
  },
  1: {
    events: [
      { text: "满周岁了，家里举行了热闹的抓周仪式，你抓起了一根算盘（或者一支笔），长辈们笑得合不拢嘴。", effect: { sanity: 3 } },
      { text: "妈妈按照接种本带你去社区卫生院接种一类免费疫苗，你哇哇大哭。", effect: { health: 3 } },
      { condition: { isRural: true }, text: "老家村里的同龄小孩大多是由爷爷奶奶用米糊和普通奶粉喂养长大。", effect: { wealth: 0 } },
      { condition: { isRural: false }, text: "父母在母婴群里货比三家，对比各种进口一段二段奶粉的DHA和益生菌成分。", effect: { wealth: -2 } }
    ],
    choices: [
      {
        id: "choice_age1_milk",
        title: "口粮与奶粉选择",
        description: "面临断奶期，家里在为你挑选奶粉时产生了分歧。进口奶粉一罐要三四百元，普通平价奶粉只需几十元。",
        sourceCase: "真实背景：母婴安全与普通工薪家庭育儿成本痛点",
        options: [
          {
            text: "咬牙买高端进口奶粉：为了宝宝大脑发育，父母缩减其他开支",
            requirements: {},
            effect: { wealth: -5, health: 3, sanity: -2 },
            tag: "精细化喂养",
            resultText: "父母每个月的一半工资都换成了奶粉罐，你的肠胃被呵护得很好，但家里开销骤紧。"
          },
          {
            text: "选择性价比平价国产品牌：相信新国标严格检验，省下钱过日子",
            requirements: {},
            effect: { wealth: 2, health: 1, sanity: 2 },
            tag: "实用喂养",
            resultText: "你喝着国标奶粉白白胖胖地长大，父母的钱包压力小了很多。"
          }
        ]
      }
    ]
  },
  2: {
    events: [
      { text: "你学会了喊爸爸妈妈，脚步蹒跚地追着家里的宠物或影子跑。", effect: { sanity: 5, health: 2 } },
      { text: "父母开始为生活奔波，常常天不亮就出门上班，夜晚疲惫归来。", effect: { sanity: -1 } },
      { condition: { isRural: true }, text: "村头的小卖部成了村里留守儿童聚集的地方，父母开始商量要不要外出进城务工。", effect: {} }
    ],
    choices: [
      {
        id: "choice_age2_migrant",
        title: "外出务工的离别抉择",
        description: "为了生计，父母打算去沿海经济发达城市打工。但大城市房租高、公办学校难进，带不带你成了一个揪心的难题。",
        sourceCase: "真实背景：中国数千万留守儿童与流动儿童家庭现实",
        condition: { isRural: true },
        options: [
          {
            text: "留守老家：由爷爷奶奶在村里抚养，父母按月寄生活费回来",
            requirements: {},
            effect: { wealth: 5, sanity: -10, health: -2 },
            tag: "留守儿童",
            resultText: "绿皮火车开动时，你在站台哭得声嘶力竭。往后的童年里，父母只是电话免提里那熟悉又陌生的声音。"
          },
          {
            text: "随迁进城：无论多苦也带在身边，挤在城中村几平米的出租屋里",
            requirements: {},
            effect: { wealth: -8, sanity: 8, knowledge: 3 },
            tag: "流动儿童",
            resultText: "你跟着父母来到了大城市，虽然一家人挤在潮湿昏暗的城中村单间，但每天晚上都能闻到妈妈做的热饭香。"
          }
        ]
      }
    ]
  },
  3: {
    events: [
      { text: "3岁达到入园年龄，家长们开始在各大家长群打听附近幼儿园的口碑与师资。", effect: { sanity: -2 } },
      { text: "你有了自己的小小社交圈，学会了和同龄小朋友分享玩具和饼干。", effect: { sanity: 4 } }
    ],
    choices: [
      {
        id: "choice_age3_kindergarten",
        title: "入园难：摇号、私立还是普通托儿班？",
        description: "公立幼儿园每月只需几百元但名额紧张需要摇号，优质民办双语每月四五千，普通弄堂托儿所条件简陋。",
        sourceCase: "真实背景：学前教育资源分布与入园难入园贵现象",
        options: [
          {
            text: "全力冲刺公办园摇号：如果落选中签就多方托关系求人",
            requirements: {},
            effect: { wealth: 3, sanity: -3, knowledge: 2 },
            tag: "公立娃",
            resultText: "经过一番折腾和焦急等待，你成功摇中了公立普惠园，规范的伙食和宽敞的操场让父母安心不少。"
          },
          {
            text: "狠心读高端私立双语幼儿园：不能让孩子输在起跑线上",
            requirements: { wealth: 45 },
            effect: { wealth: -15, sanity: 2, knowledge: 8 },
            tag: "精英启蒙",
            resultText: "外教老师每天教你简单的英文儿歌，你学会了流利的日常打招呼，父母看着高昂的缴费单默默叹气。"
          },
          {
            text: "就近送普通民办/村办托儿所：离家近接送方便，能吃饱玩开心就行",
            requirements: {},
            effect: { wealth: 0, sanity: 5, knowledge: -2 },
            tag: "散养童年",
            resultText: "托儿所里虽然玩具陈旧，但老师对大家很温和，你每天在院子里玩泥巴无忧无虑。"
          }
        ]
      }
    ]
  },
  4: {
    events: [
      { text: "你开始展现出对外部世界无穷的好奇心，每天都在不停追问十万个为什么。", effect: { knowledge: 3, sanity: 3 } },
      { text: "邻居家给小孩报了少儿乐高和逻辑思维班，家长群里掀起了一轮晒打卡热潮。", effect: { sanity: -2 } },
      { condition: { isRural: true }, text: "在老家田埂上抓蟋蟀、看星星，大自然是你最好的启蒙乐园。", effect: { health: 4, sanity: 6 } }
    ],
    choices: []
  },
  5: {
    events: [
      { text: "距离幼升小只剩一年，同龄小朋友不少已经开始突击识字量和百以内加减法。", effect: { sanity: -3 } },
      { text: "你在公园里学会了骑带辅助轮的童车，摔倒了拍拍泥土自己站了起来。", effect: { health: 3, sanity: 2 } }
    ],
    choices: [
      {
        id: "choice_age5_youxiaoxianjie",
        title: "幼小衔接与鸡娃抉择",
        description: "小学一年级零起点教学政策推行，但许多家长担心不提前学进校会跟不上进度被老师约谈。",
        sourceCase: "真实背景：超前教育焦虑与素质启蒙博弈",
        options: [
          {
            text: "提前报幼小衔接班：硬背拼音与100以内加减法，做题打卡",
            requirements: {},
            effect: { sanity: -6, knowledge: 8, wealth: -4 },
            tag: "幼升小抢跑",
            resultText: "你每天要坐在书桌前背半小时拼音字母，常常眼泪汪汪，但识字量已经达到一千多字。"
          },
          {
            text: "坚持快乐童年：多带去户外运动，培养好奇心与生活自理能力",
            requirements: {},
            effect: { sanity: 8, health: 5, knowledge: 2 },
            tag: "快乐童年",
            resultText: "你在泥土和阳光下茁壮成长，身体结实性格开朗，虽然认字不多，但动手能力极强。"
          }
        ]
      }
    ]
  },
  6: {
    events: [
      { text: "6周岁到了法定入学年龄！全家开始对照学区划片政策核实户口与房产证一致性。", effect: { sanity: -2 } },
      { text: "你背上了人生中第一个崭新的书包，胸前挂着水壶，对小学生活充满敬畏与向往。", effect: { sanity: 4 } }
    ],
    choices: [
      {
        id: "choice_age6_school_district",
        title: "小学划片：老破小学区房 vs 普通就近入学",
        description: "面对教育资源的巨大差异，是否要借钱买挂户口的“老破小学区房”，还是直接就近在普通对口小学就读？",
        sourceCase: "真实背景：学区房溢价与教育均等化改革",
        options: [
          {
            text: "倾全家之力买名校学区房/找关系择校：不惜背负高额房贷",
            requirements: { wealth: 50 },
            effect: { wealth: -25, sanity: -8, knowledge: 10 },
            tag: "学区房金童",
            resultText: "全家挤在四五十平米的老破小里省吃俭用，你如愿踏入了全区升学率最高的热门重点小学。"
          },
          {
            text: "就近直升对口普通小学：放平心态，相信只要孩子努力哪里都能成才",
            requirements: {},
            effect: { wealth: 2, sanity: 5, knowledge: 3 },
            tag: "普通小学",
            resultText: "你走路上学只需要五分钟，学校虽然设施普通，但没有夸张的攀比之风，大家玩得很开心。"
          }
        ]
      }
    ]
  },
  7: {
    events: [
      { text: "正式成为一年级小学生！第一次上早自习，学会了端正坐姿，举手发言。", effect: { knowledge: 4 } },
      { text: "每晚辅导作业成了全家血压升高的时刻：拼音声调分不清，看图写话写三个字磨蹭两小时。", effect: { sanity: -5 } }
    ],
    choices: []
  },
  8: {
    events: [
      { text: "二年级举行入队仪式，在队旗下你光荣戴上了鲜艳的红领巾，兴奋得一整天舍不得摘下来。", effect: { sanity: 6 } },
      { text: "期末考试发成绩单，拿到双百分的小朋友得到了大盒水彩笔作为奖励。", effect: { knowledge: 3 } }
    ],
    choices: []
  },
  9: {
    events: [
      { text: "三年级分水岭到来！语文阅读理解和数学应用题难度陡增，许多同学的分数开始出现明显下滑。", effect: { knowledge: 3, sanity: -3 } },
      { text: "同桌悄悄去上了周末的奥数思维班，你发现他解题的速度快得惊人。", effect: { sanity: -2 } }
    ],
    choices: [
      {
        id: "choice_age9_aoshu",
        title: "奥数班与课外补习班热潮",
        description: "三年级是小升初掐尖暗流涌动的开端，许多家长开始四处托人给孩子报名校外的神秘“占坑班”与奥数竞赛。",
        sourceCase: "真实背景：双减政策前的全民奥数热与校外教培大狂欢",
        options: [
          {
            text: "加入补习大军：周六周天排满奥数和英语培优班，疯狂刷题",
            requirements: {},
            effect: { wealth: -8, sanity: -8, knowledge: 10 },
            tag: "鸡娃战车",
            resultText: "你的周末被一张张奥数讲义填满，虽然解出了鸡兔同笼和流水行船，但眼里常常带着黑眼圈。"
          },
          {
            text: "拒绝课外鸡血：完成学校作业即可，把课余时间留给体育和阅读",
            requirements: {},
            effect: { wealth: 2, sanity: 8, health: 5, knowledge: 2 },
            tag: "自主成长",
            resultText: "你读完了厚厚的整套《十万个为什么》和儿童名著，每天下午在操场打羽毛球，体能出色。"
          }
        ]
      }
    ]
  },
  10: {
    events: [
      { text: "班里不少同学拥有了自己的电话手表或者旧智能手机，大家课间都在聊热门网络游戏和短视频梗。", effect: { sanity: 2 } },
      { text: "学校开始强调护眼防控近视，每天做两次眼保健操，还要定期做视力筛查。", effect: { health: 1 } }
    ],
    choices: [
      {
        id: "choice_age10_phone",
        title: "智能手机与游戏防沉迷危机",
        description: "在身边同学的影响下，你极度渴望拥有一台属于自己的手机。父母担心影响视力和成绩，展开了家庭博弈。",
        sourceCase: "真实背景：未成年人网络沉迷与家庭管控难题",
        options: [
          {
            text: "软磨硬泡获得手机使用权：沉迷于短视频刷题与热门竞技手游",
            requirements: {},
            effect: { sanity: 6, health: -4, knowledge: -4 },
            tag: "网瘾少年",
            resultText: "你成了班上的游戏高手，甚至偷偷用家长的支付密码抽过几次限定皮肤，成绩有了下滑苗头。"
          },
          {
            text: "严格遵守使用约定：每天限时半小时，主要用于查资料和阅读",
            requirements: {},
            effect: { sanity: 2, knowledge: 5, health: 2 },
            tag: "自律模范",
            resultText: "你学会了利用互联网查找自然科普纪录片和编程小游戏，养成了极好的自控力。"
          }
        ]
      }
    ]
  },
  11: {
    events: [
      { text: "小学五年级，小升初的气氛陡然紧张起来，民办摇号和公立划片的消息在家长群满天飞。", effect: { sanity: -3 } },
      { text: "身高开始进入快速生长期，衣服和鞋子一年就小了一个码。", effect: { health: 4 } }
    ],
    choices: []
  },
  12: {
    events: [
      { text: "小学毕业，迈入初中大门！十三门功课扑面而来，书包变得沉甸甸的。", effect: { knowledge: 5, sanity: -2 } },
      { text: "初一开设了晚自习，放学走出校门时，夜色早已深沉，街边的路灯拉长了少年的身影。", effect: { sanity: -2 } }
    ],
    choices: []
  },
  13: {
    events: [
      { text: "初二被老师们称为“两极分化的凶险之年”，几何代数与物理拉开了巨大的成绩鸿沟。", effect: { knowledge: 3, sanity: -3 } },
      { text: "青春期悄然降临，变声、长痘、心底萌生出对隔壁班某个身影的一丝青涩好感与悸动。", effect: { sanity: 4 } },
      { text: "班主任开始严抓早恋苗头，在班会上三令五申“不要让青春期的冲动毁了中考”。", effect: { sanity: -2 } }
    ],
    choices: []
  },
  14: {
    events: [
      { text: "初三最后倒计时，学校组织了声势浩大的中考百日冲刺誓师大会，“不苦不累，初三无味”横幅高挂。", effect: { sanity: -4 } },
      { text: "每天傍晚操场上都是狂练立定跳远、引体向上和千米跑的同学，为了体育中考满分拼尽全力。", effect: { health: 5, sanity: -3 } }
    ],
    choices: []
  },
  15: {
    events: [
      { text: "六月盛夏，蝉鸣声声中，你迎来了决定命运的第一道分水岭——中考！", effect: { sanity: -5 } }
    ],
    choices: [
      {
        id: "choice_age15_zhongkao",
        title: "关键人生分流：中考五五分流与职普抉择",
        description: "根据当地中考录取比例，普高升学率仅在50%-60%左右。成绩单公布后，你的分数踩在普高录取线边缘。",
        sourceCase: "真实背景：全国中考职普分流制度改革引发的千万家庭升学焦虑",
        options: [
          {
            text: "奋力考入公办重点高中：拿到通往好大学的入场券",
            requirements: { knowledge: 55 },
            effect: { knowledge: 12, sanity: -5, wealth: -2 },
            tag: "重点高中做题家",
            resultText: "你如愿拿到了省示范高中的大红录取通知书！父母在亲友群里发红包庆祝，你即将面对更残酷的高中题海。"
          },
          {
            text: "分数不够，家庭花高价托关系进入普通/民办私立高中借读搏一把",
            requirements: { wealth: 35 },
            effect: { wealth: -15, knowledge: 5, sanity: -4 },
            tag: "普高复活借读",
            resultText: "父母掏出了几万块钱赞助费和昂贵学费，叮嘱你：'这是咱家砸锅卖铁给你争取的机会，高中一定要脱层皮拼出来！'"
          },
          {
            text: "接受命运分流，进入中等职业技术学校/技校学习实用技术",
            requirements: {},
            effect: { knowledge: -2, wealth: 2, sanity: 5 },
            tag: "职校技术生",
            resultText: "你踏入了职业中专，选择了汽修/数控/幼教等热门专业。虽然告别了传统学术象牙塔，但你提前掌握了安身立命的一技之长。"
          },
          {
            text: "索性不再升学，跟着同乡长辈进厂打工或在小吃店当学徒",
            requirements: {},
            effect: { wealth: 8, knowledge: -10, sanity: 0, health: -3 },
            tag: "少年务工",
            resultText: "十五岁的你收拾行李登上了开往工业园区的绿皮车，在流水线机器的轰鸣声中提前步入成人的辛劳世界。"
          }
        ]
      }
    ]
  },
  16: {
    events: [
      { text: "高中生活拉开大幕，早上5点半起床跑操背单词，晚上10点半自习熄灯，衡水模式般的作息成为日常。", effect: { knowledge: 6, sanity: -5, health: -2 } },
      { text: "月考排名大榜贴在年级走廊上，哪怕差一分都能甩下几十名同学，走廊里弥漫着无声的硝烟。", effect: { sanity: -3 } }
    ],
    choices: []
  },
  17: {
    events: [
      { text: "高二新高考选科分班！是选纯理工【物化生】硬核冲刺工科，还是选【史政地】文科大组？", effect: { knowledge: 4 } },
      { text: "自习课上低头刷题，抬头看着窗外金黄的夕阳，在草稿纸边缘写下对未来的模糊畅想。", effect: { sanity: 3 } }
    ],
    choices: [
      {
        id: "choice_age17_xuanke",
        title: "新高考选科：硬核工科还是兴趣文史？",
        description: "在专业覆盖率高达95%的“物理+化学”与个人更感兴趣的文史类之间，你必须做出选科取舍。",
        sourceCase: "真实背景：新高考改革选科博弈与专业限报政策",
        options: [
          {
            text: "选【物化生/物化地】大工科组合：哪怕再难啃，也要抢占绝大多数理工专业报读资格",
            requirements: {},
            effect: { knowledge: 8, sanity: -6 },
            tag: "理工做题派",
            resultText: "你在力学受力分析和有机化学反应方程式里痛苦煎熬，但获得了几乎无限的大学工科填报范围。"
          },
          {
            text: "选【史政地/史政生】文科组合：为了更高的卷面分数和考公考编优势",
            requirements: {},
            effect: { knowledge: 5, sanity: 3 },
            tag: "文史博览派",
            resultText: "你沉浸在近代史与政治哲学的逻辑脉络中，虽然能选的专业范围受限，但文字功底越发深厚。"
          }
        ]
      }
    ]
  },
  18: {
    events: [
      { text: "六月七日，警车开道，全城静音，横幅高挂。你走进了决定人生航向的高考考场！", effect: { sanity: -6 } }
    ],
    choices: [
      {
        id: "choice_age18_gaokao_major",
        title: "高考放榜与张雪峰式志愿大博弈",
        description: "分数出炉！面对厚厚的《志愿填报指南》，家庭会议争论不休：是选名校天坑专业、还是普通大学就业硬技能，抑或考公王道？",
        sourceCase: "真实背景：2023年全国志愿填报大讨论（生化环材 vs 计算机电气 vs 警校军校考公）",
        options: [
          {
            text: "信奉张雪峰实用主义：死磕计算机/软件/电子电气，或者冲警校保编制就业",
            requirements: { knowledge: 50 },
            effect: { wealth: 8, sanity: -4, knowledge: 6 },
            tag: "实用主义工科生",
            resultText: "你报考了理工类院校的王牌硬核专业。大学四年虽然代码和高数满天飞，但毕业时手握硬技能底气十足。"
          },
          {
            text: "宁要名校凤尾：为了985/211名校光环，接受调剂到生化环材、哲学等冷门天坑专业",
            requirements: { knowledge: 65 },
            effect: { sanity: 4, knowledge: 8, wealth: -2 },
            tag: "天坑名校生",
            resultText: "你如愿拿到了知名大学的大红通知书，朋友圈点赞破百，但入学后才发现保研和跨考转行的竞争异常惨烈。"
          },
          {
            text: "求稳为先：报考公费师范生或医学定向生，图一个家乡编制与终身铁饭碗",
            requirements: {},
            effect: { wealth: 2, sanity: 8, knowledge: 4 },
            tag: "铁饭碗预备军",
            resultText: "父母在全村大摆升学宴，你提前锁定了体制内稳定工作，虽然没有大富大贵的想象空间，但一生安稳少波折。"
          },
          {
            text: "成绩不理想，报考全日制大专院校，专注实训技能与专升本",
            requirements: {},
            effect: { wealth: 0, sanity: 2, knowledge: 2 },
            tag: "专科逆袭派",
            resultText: "你在大专院校里钻研实操技能，课余时间泡在图书馆自习室，默默准备两年后的专升本统一考试。"
          }
        ]
      }
    ]
  },
  19: {
    events: [
      { text: "拖着行李箱跨入大学校门，接受半个月烈日下的军训洗礼，认识了来自五湖四海的室友。", effect: { sanity: 6, health: 3 } },
      { text: "第一次离开父母独自生活，学会了精打细算每月一千多元的生活费，兼职送过快递或做家教。", effect: { wealth: 2, sanity: 1 } }
    ],
    choices: []
  },
  20: {
    events: [
      { text: "大二阶段，每天背四六级核心词汇红宝书，周末在驾校烈日下练倒车入库。", effect: { knowledge: 5, sanity: -2 } },
      { text: "校园里开始有一段清纯甜蜜的校园恋爱，一起在自习室占座、在操场月光下散步聊天。", effect: { sanity: 8 } }
    ],
    choices: []
  },
  21: {
    events: [
      { text: "大三下学期，迷茫与焦虑如影随形。自习室里渐渐被考研占座的厚重考研政治、肖八肖四填满。", effect: { sanity: -5 } },
      { text: "身边有人开始海投简历面试大厂暑期实习，有人每天在打卡背行测申论常识。", effect: { knowledge: 4 } }
    ],
    choices: []
  },
  22: {
    events: [
      { text: "毕业季来临！穿着学士服抛起帽子，毕业聚餐上大家抱头痛哭，随后各奔东西踏入现实风浪。", effect: { sanity: 2 } }
    ],
    choices: [
      {
        id: "choice_age22_graduation",
        title: "毕业分水岭：400万人考研、大厂秋招还是回家省考？",
        description: "应届生求职市场竞争白热化，面对名校学历贬值和招聘HC紧缩，你必须决定自己入世的第一站。",
        sourceCase: "真实背景：千万高校毕业生就业形势与考研考公热潮",
        options: [
          {
            text: "杀入一线城市大厂/外企：接受996高强度工作，争取高薪起步与大城市视野",
            requirements: { knowledge: 50 },
            effect: { wealth: 15, sanity: -10, health: -6 },
            tag: "北上广深漂流者",
            resultText: "你拿到了年薪十多万的offer，在城郊合租了一个单间，正式加入了每天挤一小时地铁早高峰的通勤大军。"
          },
          {
            text: "全职备战考研二战/三战：不甘心本科学历，誓要冲进名校研究生",
            requirements: { wealth: 25 },
            effect: { wealth: -10, sanity: -12, knowledge: 10 },
            tag: "脱产考研战神",
            resultText: "你在大学城附近租了一间廉价自习室，每天复习12小时，承受着同龄人已在领工资的巨大心理压力。"
          },
          {
            text: "回老家二三线城市考公考编：直奔选调生、事业单位与国企稳妥上岸",
            requirements: {},
            effect: { wealth: 3, sanity: 6, health: 3 },
            tag: "考编上岸族",
            resultText: "你回到了家乡城市，虽然月薪三四千，但住家里吃热饭，下班没有夺命连环call，生活节奏怡然自得。"
          },
          {
            text: "灵活就业：做自媒体博主、做兼职或外卖骑手过渡，等待转机",
            requirements: {},
            effect: { wealth: 5, sanity: 0, health: -4 },
            tag: "灵活就业新青年",
            resultText: "你穿上骑手马甲或在出租屋架起补光灯剪辑视频，风里来雨里去，体验到了生活的酸甜苦辣。"
          }
        ]
      }
    ]
  },
  23: {
    events: [
      { text: "职场第一年试用期，小心翼翼回复微信群里每一个“收到”，学会了做精美的汇报PPT。", effect: { knowledge: 4, sanity: -3 } },
      { text: "租房踩坑：遇到了无良二房东扣押金，或者隔断房半夜隔音极差，搬了一次精疲力竭的家。", effect: { wealth: -4, sanity: -4 } }
    ],
    choices: []
  },
  24: {
    events: [
      { text: "入职两周年体检，体检报告上第一次出现了轻度脂肪肝、颈椎曲度变直和尿酸偏高警报。", effect: { health: -6, sanity: -2 } },
      { text: "过年回家，发现父母头上的白发明显变多了，原本挺拔的脊背也有些微驼。", effect: { sanity: -3 } }
    ],
    choices: []
  },
  25: {
    events: [
      { text: "25岁一过，家庭聚会上的话题彻底从“工作怎么样”变成了“谈对象没有？什么时候结婚？”", effect: { sanity: -4 } },
      { text: "参加了大学室友的婚礼，随出去六百元份子钱，看着台上的新人，开始认真思考成家成本。", effect: { wealth: -2 } }
    ],
    choices: []
  },
  26: {
    events: [
      { text: "行业周期剧烈波动，身边的同行公司传出裁员风声，部门正在推行“降本增效”优化考核。", effect: { sanity: -5 } }
    ],
    choices: [
      {
        id: "choice_age26_industry_storm",
        title: "职场大洗牌：教培转型、互联网优化与职业重塑",
        description: "你所在的行业遭遇政策调整或业务收缩，面临降薪轮岗或者拿赔偿离职转行的人生十字路口。",
        sourceCase: "真实背景：双减落地、互联网大厂裁员与房地产行业深度调整",
        options: [
          {
            text: "坚守岗位主动卷起来：加班挑大梁，向领导证明自己的不可替代性",
            requirements: {},
            effect: { wealth: 5, sanity: -12, health: -8 },
            tag: "卷王幸存者",
            resultText: "在一轮又一轮裁员中你活了下来，职级上升了一级，但经常性失眠脱发让你身心俱疲。"
          },
          {
            text: "拿着N+1赔偿转行：换到新能源、出海、国企等新增长赛道重新起跑",
            requirements: { knowledge: 40 },
            effect: { wealth: 6, sanity: 2, knowledge: 5 },
            tag: "风口跃迁者",
            resultText: "你勇敢清零了过去的经验，投身新兴产业，虽然起步待遇不如从前，但踩中了新的上升通道。"
          },
          {
            text: "心灰意冷，辞职返乡备考体制内编制：用体制内的确定性抵御外界风浪",
            requirements: {},
            effect: { wealth: -6, sanity: 8, health: 4 },
            tag: "归隐考编",
            resultText: "你退掉了大城市的合租房，回到老家县城闭关刷题，远离了深夜钉钉工作群的窒息感。"
          }
        ]
      }
    ]
  },
  27: {
    events: [
      { text: "27岁，到了中国传统观念里谈婚论嫁的硬指标关口，父母和亲戚开始安排各种相亲局。", effect: { sanity: -3 } }
    ],
    choices: [
      {
        id: "choice_age27_house",
        title: "终极人生拷问：掏空六个钱包上车房贷？",
        description: "相亲对象提出“不买房不结婚”，父母愿意拿出毕生积蓄养老钱帮你凑齐首付，但你将背负每月大几千、长达三十年的房贷月供。",
        sourceCase: "真实背景：高房价周期下的青年置业与六个钱包社会讨论",
        options: [
          {
            text: "掏空六个钱包买房上车：背负30年房贷，换取婚姻门票与城市归属感",
            requirements: { wealth: 20 },
            effect: { wealth: -20, sanity: -8, health: -3 },
            tag: "三十年房奴",
            resultText: "你签下了厚厚的购房合同，成为了光荣的业主。但从此你不敢轻易换工作，不敢生大病，每个月工资一发就扣给银行。"
          },
          {
            text: "坚持租房不买房：保住父母养老钱和自身现金流，对抗资产泡沫",
            requirements: {},
            effect: { wealth: 10, sanity: 6 },
            tag: "不买房信徒",
            resultText: "你顶住了亲友的嘲讽与压力，手头握有充裕流动资金，但不得不经常忍受搬家和丈母娘的冷言冷语。"
          }
        ]
      }
    ]
  },
  28: {
    events: [
      { text: "举办了婚礼，从彩礼三金到婚宴司仪酒席，一番繁琐折腾下来，双方精疲力竭。", effect: { wealth: -8, sanity: 2 } },
      { text: "两个人开始共同经营一个小家庭，柴米油盐、水电物业费成了每日的真实生活账本。", effect: { sanity: 3 } }
    ],
    choices: []
  },
  29: {
    events: [
      { text: "亲友长辈开始频繁催生：“趁着我们身体硬朗还能帮你们带带娃，赶紧生一个吧！”", effect: { sanity: -3 } }
    ],
    choices: [
      {
        id: "choice_age29_baby",
        title: "生育大抉择：生一胎、备孕还是丁克？",
        description: "面对昂贵的月嫂费用、奶粉尿不湿开销以及女性职场发展困境，你们夫妇必须决定是否迎来下一代。",
        sourceCase: "真实背景：全国出生人口变化与育儿成本压力",
        options: [
          {
            text: "迎接新生命：生下宝宝，开启为人父母的甜蜜与重担",
            requirements: {},
            effect: { wealth: -12, sanity: 5, health: -4 },
            tag: "晋升父母",
            resultText: "伴随着产房外的啼哭，你从孩子变成了保护孩子的山。虽然半夜起夜喂奶换尿布极其崩溃，但看着他的笑容一切都值了。"
          },
          {
            text: "选择丁克或延后生育：先专注自身事业发展与生活品质",
            requirements: {},
            effect: { wealth: 6, sanity: 4, health: 2 },
            tag: "丁克先锋",
            resultText: "你们把精力和财力留给了两个人环游世界和自我提升，虽然承受了老一辈的非议，但享有极高生活自由度。"
          }
        ]
      }
    ]
  },
  30: {
    events: [
      { text: "三十而立。某天深夜下班坐在车里或楼下长椅上，你抽了一支烟，静静发呆了十分钟。", effect: { sanity: -3 } },
      { text: "你猛然发现自己成了家庭唯一的顶梁柱：上有渐渐年迈多病的双亲，下有牙牙学语的幼子，身边是疲惫的伴侣。", effect: { sanity: -2 } }
    ],
    choices: []
  },
  31: {
    events: [
      { text: "职场上你已经成为了业务熟手，学会了在办公室政治与各方利益间游刃有余。", effect: { knowledge: 3 } },
      { text: "给父母买了百万医疗险，但在核保时发现父亲已经有了高血压而不得不除外承保。", effect: { wealth: -2, sanity: -2 } }
    ],
    choices: []
  },
  32: {
    events: [
      { text: "孩子开始面临入园上托班，学区房与升学的话题在同龄同事间再次循环成为热议焦点。", effect: { sanity: -3 } },
      { text: "发现自己越来越喝不惯冰水，保温杯里泡上了枸杞，下班回家只想静静躺平。", effect: { health: 1 } }
    ],
    choices: []
  },
  33: {
    events: [
      { text: "每月房贷车贷如期而至扣款，银行短信成了最准时的闹钟。你不敢迟到，更不敢轻易提离职。", effect: { sanity: -3 } }
    ],
    choices: []
  },
  34: {
    events: [
      { text: "部门招进了一批刚毕业的00后新人，年轻、精力无限、能熬夜加班，薪资成本还只有你的一半。", effect: { sanity: -4 } }
    ],
    choices: []
  },
  35: {
    events: [
      { text: "35岁生日这天，你盯着工位上的电脑屏幕，职场传说中的“35岁分水岭”真实降临在自己头上。", effect: { sanity: -5 } }
    ],
    choices: [
      {
        id: "choice_age35_crisis",
        title: "35岁职场分水岭与自救",
        description: "猎聘招聘软件上不少岗位明确写着“年龄35周岁以下”，公司架构调整，你所在的业务线面临裁撤。",
        sourceCase: "真实背景：中国职场35岁年龄门槛与中年群体求职自救",
        options: [
          {
            text: "降薪求稳转型管理/业务骨干：放低身段争取留存，保住社保和月供",
            requirements: {},
            effect: { wealth: -4, sanity: -6, health: -4 },
            tag: "职场老黄牛",
            resultText: "你接受了调岗降薪，忍气吞声成了办公室里最随和耐造的骨干，用妥协换取了家庭每月的口粮钱。"
          },
          {
            text: "中年灵活再就业：做自媒体/开网约车/做小生意，打造副业收入",
            requirements: {},
            effect: { wealth: 3, sanity: 3, health: -6 },
            tag: "自救中年人",
            resultText: "你白天四处拜访客户，晚上开着电车在城市里接单穿梭，虽然起早贪黑，但不再看任何HR的白眼。"
          },
          {
            text: "如果在体制内/事业单位：资历到期平稳晋升中层副科，享受稳定的安全垫",
            requirements: { knowledge: 45 },
            effect: { wealth: 4, sanity: 8, health: 3 },
            tag: "体制稳固",
            resultText: "体制内的优势在35岁之后展露无遗，你端着保温杯批改公文，没有中年失业恐慌，生活波澜不惊。"
          }
        ]
      }
    ]
  },
  40: {
    events: [
      { text: "四十不惑。孩子升入初中，叛逆期撞上了你的中年疲惫期，家里经常爆发关门巨响。", effect: { sanity: -4 } },
      { text: "母亲突发心脑血管疾病住院，你连夜在医院走廊陪护陪床，闻着消毒水气味百感交集。", effect: { wealth: -6, health: -4, sanity: -5 } }
    ],
    choices: [
      {
        id: "choice_age40_medical",
        title: "因病致贫与大病筹款困境",
        description: "家中老人罹患重症需要自费进口靶向药和重症监护室（ICU），每日开销数千上万元，社保报销有限。",
        sourceCase: "真实背景：大病医疗支出压力与水滴筹互助社会现象",
        options: [
          {
            text: "砸锅卖铁上最好的自费治疗方案：哪怕借钱甚至抵押房产，尽最大孝道",
            requirements: { wealth: 30 },
            effect: { wealth: -25, sanity: 5, health: -4 },
            tag: "倾家尽孝",
            resultText: "老人病情稳定出院，你掏空了全家积蓄并背负了亲友借款，但良心上得到了极大宽慰。"
          },
          {
            text: "发起水滴筹大病众筹并配合医保目录内保守治疗：量力而行守护全家生存底线",
            requirements: {},
            effect: { wealth: -8, sanity: -4 },
            tag: "保守守护",
            resultText: "你在朋友圈转发了筹款链接，得到了昔日同学同事的相助，虽然满心辛酸，但全家没有陷入彻底绝境。"
          }
        ]
      }
    ]
  },
  48: {
    events: [
      { text: "你的孩子站在了高考考场门外，如同当年的你一样。你站在考场外焦急张望，时光仿佛完成了一个轮回。", effect: { sanity: 4 } },
      { text: "自己身体的多项指标也在衰退，老花镜第一次架上了鼻梁。", effect: { health: -5 } }
    ],
    choices: []
  },
  55: {
    events: [
      { text: "孩子大学毕业步入社会，为他们在异乡的租房和就业操碎了心。", effect: { sanity: -2 } },
      { text: "开始认真盘算自己的社保累计缴费年限和退休金测算表。", effect: { wealth: 2 } }
    ],
    choices: []
  },
  60: {
    events: [
      { text: "到了法定退休年龄，正式办理退休手续，领到了人生第一笔退休养老金。", effect: { sanity: 8 } }
    ],
    choices: [
      {
        id: "choice_age60_retirement",
        title: "退休与晚年轨迹：帮带孙辈还是候鸟旅居？",
        description: "退休后每月有固定养老金到账，子女希望你们前往大城市帮忙照料刚出生的孙辈做家务。",
        sourceCase: "真实背景：中国式隔代抚养与银发一族晚年选择",
        options: [
          {
            text: "前往子女城市带孙辈：做“老漂族”，买菜做饭接送放学，全心奉献下一代",
            requirements: {},
            effect: { sanity: 3, health: -4, wealth: -4 },
            tag: "中国式隔代奉献",
            resultText: "你在大城市的陌生小区里推着婴儿车，虽然腰酸背痛没有朋友，但看着孙辈一天天长大满心欣慰。"
          },
          {
            text: "留在老家过独立晚年：养花种菜、跳广场舞、下棋钓鱼，享受属于自己的晚年",
            requirements: {},
            effect: { sanity: 9, health: 5, wealth: 2 },
            tag: "自在银发族",
            resultText: "你和老友们组建了合唱团，清晨打太极下午打麻将，退休生活充实而快活。"
          }
        ]
      }
    ]
  },
  70: {
    events: [
      { text: "七十古来稀。身边的一些老同学、老邻居的名字渐渐被相框黑纱覆盖，生命的钟摆越来越响。", effect: { sanity: -4, health: -8 } },
      { text: "儿孙们逢年过节齐聚一堂，满堂欢笑，四世同堂的合影挂满了客厅最显眼的墙面。", effect: { sanity: 10 } }
    ],
    choices: []
  },
  75: {
    events: [
      { text: "腿脚有些不利索了，出门需要拄着拐杖，老伴和你互相搀扶着在社区公园散步晒太阳。", effect: { health: -8, sanity: 2 } },
      { text: "社区医生上门做老年人健康随访量血压，夸你心态好。", effect: { health: 2 } }
    ],
    choices: []
  },
  80: {
    events: [
      { text: "八十杖朝之年。回望这一生，经历了国家腾飞的风云变幻，经历了生老病死的酸甜苦辣。", effect: { sanity: 10 } },
      { text: "在一个平静温暖的清晨或黄昏，你安详地闭上了双眼，完成了在这片土地上的十四亿分之一的旅程。", effect: { health: -20 } }
    ],
    choices: []
  }
};

// 常见年份默认生成库（基于年龄特点）
function getDefaultEventsForAge(age) {
  if (age <= 6) {
    return [
      { text: `${age}岁这一年，你在家人的细心呵护下健康成长，学会了许多新事物。`, effect: { health: 2, sanity: 2 } },
      { text: "逢年过节收到了长辈给的压岁钱，虽然照例被妈妈以'帮你存着'的名义收走了。", effect: { wealth: 1 } }
    ];
  } else if (age <= 12) {
    return [
      { text: `${age}岁这一年，每天背着书包上学放学，校门口的文具店和小吃摊是你童年最快乐的据点。`, effect: { knowledge: 2, sanity: 1 } },
      { text: "期末考试拿到了不错的成绩，吃了一顿肯德基或平时舍不得吃的大餐作为奖励。", effect: { sanity: 3 } }
    ];
  } else if (age <= 18) {
    return [
      { text: `${age}岁这一年，课桌上的参考书和试卷堆得高过头顶，在无数个刷题的深夜里憧憬着外面的大千世界。`, effect: { knowledge: 3, sanity: -2 } },
      { text: "偶尔周日能睡个懒觉，吃一碗热腾腾的牛肉面，就是学生时代最朴素的幸福。", effect: { sanity: 3, health: 1 } }
    ];
  } else if (age <= 25) {
    return [
      { text: `${age}岁这一年，你在学业与初入职场的摸索中迅速蜕变，体会到了成年人世界的规则与不易。`, effect: { knowledge: 2, wealth: 2 } },
      { text: "周末和三五好友约着吃一顿路边摊烧烤，吐槽生活琐事，畅谈远大抱负。", effect: { sanity: 4 } }
    ];
  } else if (age <= 40) {
    return [
      { text: `${age}岁这一年，工作和家庭像两架转动的发条，推着你马不停蹄地向前奔跑。`, effect: { wealth: 3, health: -2, sanity: -1 } },
      { text: "按时缴存五险一金和按揭贷款，日子在平淡而坚韧的柴米油盐中一天天流淌。", effect: { wealth: 1 } }
    ];
  } else if (age <= 60) {
    return [
      { text: `${age}岁这一年，你看淡了许多年轻时的执念，更加珍视身心健康和平安是福的真谛。`, effect: { sanity: 2, health: -2 } },
      { text: "定期体检，和老友相约喝茶散步，家庭关系渐趋和睦稳固。", effect: { sanity: 3 } }
    ];
  } else {
    return [
      { text: `${age}岁这一年，含饴弄孙，品茗养花，享受着晚年平静祥和的光景。`, effect: { sanity: 3, health: -3 } },
      { text: "晒着温暖的冬日暖阳，听着收音机里的老歌，心中一片安宁。", effect: { sanity: 4 } }
    ];
  }
}

// 遍历生成 0 到 80 年的所有独立目录和规范 JSON
let generatedCount = 0;
for (let age = 0; age <= 80; age++) {
  const dirName = `age_${age}`;
  const targetDir = path.join(agesDir, dirName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ageData = richAgesData[age] || {
    events: getDefaultEventsForAge(age),
    choices: []
  };

  fs.writeFileSync(
    path.join(targetDir, 'events.json'),
    JSON.stringify(ageData.events, null, 2),
    'utf-8'
  );

  fs.writeFileSync(
    path.join(targetDir, 'choices.json'),
    JSON.stringify(ageData.choices || [], null, 2),
    'utf-8'
  );

  generatedCount++;
}

console.log(`Successfully created ${generatedCount} year directories under public/data/ages/ from age_0 to age_80!`);
