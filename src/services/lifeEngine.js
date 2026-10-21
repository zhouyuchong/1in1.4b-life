import { rollBirthCity } from '../data/cities.js';

// 内存缓存加载过的年份文件，避免重复网络请求
const ageDataCache = new Map();

/**
 * 动态加载指定年龄的数据
 */
export async function loadAgeData(age) {
  if (ageDataCache.has(age)) {
    return ageDataCache.get(age);
  }

  try {
    const [eventsRes, choicesRes] = await Promise.all([
      fetch(`/data/ages/age_${age}/events.json`).catch(() => null),
      fetch(`/data/ages/age_${age}/choices.json`).catch(() => null)
    ]);

    const events = (eventsRes && eventsRes.ok) ? await eventsRes.json() : [];
    const choices = (choicesRes && choicesRes.ok) ? await choicesRes.json() : [];

    const data = { events, choices };
    ageDataCache.set(age, data);
    return data;
  } catch (err) {
    console.warn(`Failed to load age ${age} data:`, err);
    return { events: [], choices: [] };
  }
}

/**
 * 初始化角色天命生成
 */
export function createNewLife() {
  const birth = rollBirthCity();
  const { city, isRural, householdType } = birth;

  // 性别按中国出生人口性别比（约 108:100）
  const gender = Math.random() < 0.52 ? '男' : '女';

  // 家庭阶层分布（五等分位模型）
  const classRoll = Math.random();
  let familyClass = '工薪温饱';
  let initialWealth = 45;
  let parentsJob = '普通职工 / 进城务工';

  if (classRoll < 0.15) {
    familyClass = '低保特困';
    initialWealth = 15;
    parentsJob = isRural ? '留守务农' : '零工劳动者';
  } else if (classRoll < 0.45) {
    familyClass = '工薪温饱';
    initialWealth = 35;
    parentsJob = isRural ? '外出务工 / 农忙' : '基层销售 / 工厂工人';
  } else if (classRoll < 0.80) {
    familyClass = '小康中产';
    initialWealth = 60;
    parentsJob = '体制内基层 / 教师 / 企业白领';
  } else {
    familyClass = '高净值富裕';
    initialWealth = 85;
    parentsJob = '私营企业主 / 核心骨干 / 投资人';
  }

  // 基础智力与健康
  const initialKnowledge = Math.floor(35 + Math.random() * 25);
  const initialHealth = Math.floor(75 + Math.random() * 20);
  const initialSanity = Math.floor(70 + Math.random() * 20);

  // 初始标签
  const tags = [
    householdType,
    city.province,
    city.name,
    familyClass,
    `高考省份:${city.gaokaoDifficulty}`
  ];

  if (isRural) {
    tags.push('乡土根基');
  }

  return {
    age: 0,
    gender,
    city,
    isRural,
    householdType,
    familyClass,
    parentsJob,
    wealth: initialWealth,
    health: initialHealth,
    knowledge: initialKnowledge,
    sanity: initialSanity,
    tags,
    history: [
      {
        age: 0,
        text: `天命降生：你出生在【${city.province}·${city.name}】（${householdType}），性别【${gender}】。家庭背景为【${familyClass}】，父母职业：${parentsJob}。高考竞争预估：${city.gaokaoDifficulty}。`,
        tag: '降生'
      }
    ],
    isGameOver: false,
    deathReason: null,
    pendingChoice: null
  };
}

/**
 * 校验事件或抉择的前置条件
 */
function checkCondition(cond, character) {
  if (!cond) return true;

  if (cond.gender && cond.gender !== character.gender) return false;
  if (cond.isRural !== undefined && cond.isRural !== character.isRural) return false;
  if (cond.familyClass && cond.familyClass !== character.familyClass) return false;
  if (cond.minWealth !== undefined && character.wealth < cond.minWealth) return false;
  if (cond.maxWealth !== undefined && character.wealth > cond.maxWealth) return false;
  if (cond.minKnowledge !== undefined && character.knowledge < cond.minKnowledge) return false;
  if (cond.minHealth !== undefined && character.health < cond.minHealth) return false;

  return true;
}

/**
 * 推进一年
 */
export async function stepNextYear(character) {
  if (character.isGameOver || character.pendingChoice) {
    return character;
  }

  const nextAge = character.age + 1;

  // 暮年或健康耗尽判断
  if (character.health <= 0 || nextAge > 85) {
    return {
      ...character,
      age: Math.min(nextAge, 85),
      isGameOver: true,
      deathReason: character.health <= 0 ? '因身体严重透支与疾病溘然长逝' : '寿终正寝，走完了平凡而厚重的一生'
    };
  }

  // 加载当年的数据
  const { events, choices } = await loadAgeData(nextAge);

  // 筛选可用抉择
  const availableChoices = choices.filter(c => checkCondition(c.condition, character));

  // 筛选可用日常事件
  const availableEvents = events.filter(e => checkCondition(e.condition, character));
  let chosenEvent = null;
  if (availableEvents.length > 0) {
    const idx = Math.floor(Math.random() * availableEvents.length);
    chosenEvent = availableEvents[idx];
  } else {
    chosenEvent = {
      text: `${nextAge}岁这一年，生活在柴米油盐与岁月的流淌中平淡度过。`,
      effect: {}
    };
  }

  // 如果当年有重大抉择，中断推演，等待玩家决策
  if (availableChoices.length > 0) {
    const activeChoice = availableChoices[0];
    return {
      ...character,
      age: nextAge,
      pendingChoice: {
        choice: activeChoice,
        annualEvent: chosenEvent
      }
    };
  }

  // 无抉择，直接结算当年
  const effect = chosenEvent.effect || {};
  const updatedWealth = Math.max(0, Math.min(100, character.wealth + (effect.wealth || 0)));
  const updatedHealth = Math.max(0, Math.min(100, character.health + (effect.health || 0)));
  const updatedKnowledge = Math.max(0, Math.min(100, character.knowledge + (effect.knowledge || 0)));
  const updatedSanity = Math.max(0, Math.min(100, character.sanity + (effect.sanity || 0)));

  const newHistoryItem = {
    age: nextAge,
    text: chosenEvent.text,
    effect
  };

  const isDied = updatedHealth <= 0;

  return {
    ...character,
    age: nextAge,
    wealth: updatedWealth,
    health: updatedHealth,
    knowledge: updatedKnowledge,
    sanity: updatedSanity,
    history: [newHistoryItem, ...character.history],
    isGameOver: isDied,
    deathReason: isDied ? '因身体多项指标衰竭抱憾离世' : null,
    pendingChoice: null
  };
}

/**
 * 玩家做出选择
 */
export function resolveChoice(character, option) {
  if (!character.pendingChoice) return character;

  const { annualEvent } = character.pendingChoice;
  const effect = option.effect || {};
  const eventEffect = annualEvent?.effect || {};

  const totalDeltaWealth = (effect.wealth || 0) + (eventEffect.wealth || 0);
  const totalDeltaHealth = (effect.health || 0) + (eventEffect.health || 0);
  const totalDeltaKnowledge = (effect.knowledge || 0) + (eventEffect.knowledge || 0);
  const totalDeltaSanity = (effect.sanity || 0) + (eventEffect.sanity || 0);

  const updatedWealth = Math.max(0, Math.min(100, character.wealth + totalDeltaWealth));
  const updatedHealth = Math.max(0, Math.min(100, character.health + totalDeltaHealth));
  const updatedKnowledge = Math.max(0, Math.min(100, character.knowledge + totalDeltaKnowledge));
  const updatedSanity = Math.max(0, Math.min(100, character.sanity + totalDeltaSanity));

  const updatedTags = [...character.tags];
  if (option.tag && !updatedTags.includes(option.tag)) {
    updatedTags.push(option.tag);
  }

  const logText = `【抉择：${option.text}】 ${option.resultText || ''} ${annualEvent ? `（${annualEvent.text}）` : ''}`;

  const newHistoryItem = {
    age: character.age,
    text: logText,
    tag: option.tag,
    isChoice: true,
    effect: {
      wealth: totalDeltaWealth,
      health: totalDeltaHealth,
      knowledge: totalDeltaKnowledge,
      sanity: totalDeltaSanity
    }
  };

  const isDied = updatedHealth <= 0;

  return {
    ...character,
    wealth: updatedWealth,
    health: updatedHealth,
    knowledge: updatedKnowledge,
    sanity: updatedSanity,
    tags: updatedTags,
    history: [newHistoryItem, ...character.history],
    pendingChoice: null,
    isGameOver: isDied,
    deathReason: isDied ? '因生活重大变故身心衰竭离世' : null
  };
}

/**
 * 终局人生评价算法
 */
export function evaluateLifeSummary(character) {
  const { age, wealth, knowledge, sanity, health, tags, isRural } = character;

  // 财富超越百分比（基于中国居民可支配收入五等分位估算）
  let wealthPercentile = Math.min(99, Math.max(5, Math.floor(wealth * 1.05)));

  // 学历/认知超越百分比（全国大专及以上学历占总人口约 15%~18%）
  let eduPercentile = 40;
  if (tags.includes('天坑名校生') || tags.includes('重点高中做题家') || knowledge > 75) {
    eduPercentile = 92;
  } else if (tags.includes('实用主义工科生') || tags.includes('铁饭碗预备军') || knowledge > 60) {
    eduPercentile = 78;
  } else if (tags.includes('专科逆袭派') || knowledge > 45) {
    eduPercentile = 55;
  } else if (tags.includes('职校技术生') || tags.includes('少年务工')) {
    eduPercentile = 25;
  }

  // 寿命超越百分比（以全国平均预期寿命 78.6 岁为基准）
  let longevityPercentile = Math.min(98, Math.max(5, Math.round((age / 78.6) * 60)));
  if (age >= 80) longevityPercentile = 92;
  if (age >= 85) longevityPercentile = 98;

  // 生成终生成就称号
  let title = '平凡坚韧的赶路人';
  if (tags.includes('三十年房奴') && wealth > 50) {
    title = '掏空六个钱包的房奴业主';
  } else if (tags.includes('考编上岸族') || tags.includes('体制稳固')) {
    title = '风雨不惊的体制定海神针';
  } else if (tags.includes('北上广深漂流者') && wealth > 60) {
    title = '闯荡大都会的奋斗先锋';
  } else if (tags.includes('天坑名校生') && knowledge > 70) {
    title = '象牙塔里的求索做题家';
  } else if (tags.includes('留守儿童') && wealth > 50) {
    title = '走出大山的逆流少年';
  } else if (sanity > 80 && health > 70) {
    title = '知足常乐的生活哲人';
  } else if (tags.includes('少年务工') || tags.includes('职校技术生')) {
    title = '手握技术的一线实干家';
  }

  return {
    title,
    age,
    wealthPercentile,
    eduPercentile,
    longevityPercentile,
    sanityScore: sanity,
    summaryDesc: `你在【${character.city.name}】开启了这段十四亿分之一的际遇。这一生你历经 ${age} 载春秋，无论是时代的洪流还是柴米油盐的琐碎，你都认真而用力地活过。`
  };
}
