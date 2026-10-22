import { prepareEducationChoice } from './educationRules.js';
import { educationContext } from './educationContext.js';
import { graduateOption } from './boldRisk.js';
import { debtChoice, debtSettlement, unsecuredDebt, debtLimit, DEBT_RULES } from './debt.js';
import { createFinances, applyMoney, eventCashChange, minimumCash, annualBudget } from './finances.js';
import { relationshipEvents, romanceChoice } from './relationships.js';
import { makeActionChoice, careerOptions } from './lifeActions.js';
import { rollBirthCity } from '../data/cities.js';
import { createLifeState, advanceLifeState, matchesLifeState } from './lifeState.js';

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
      fetch(`/data/ages/age_${age}/events.json?v=life-v4`, { cache: 'no-store' }).catch(() => null),
      fetch(`/data/ages/age_${age}/choices.json?v=life-v4`, { cache: 'no-store' }).catch(() => null)
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

  const education = educationContext({ city, familyClass });

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
    lifeState: createLifeState(),
    gender,
    city,
    isRural,
    householdType,
    familyClass,
    parentsJob,
    wealth: initialWealth,
    finances: createFinances(familyClass),
    lastActionAge: null,
    scheduledEvents: [],
    health: initialHealth,
    knowledge: initialKnowledge,
    sanity: initialSanity,
    tags,
    history: [
      {
        age: 0,
        text: `天命降生：你出生在【${city.province}·${city.name}】（${householdType}），性别【${gender}】。家庭背景为【${familyClass}】，父母职业：${parentsJob}。地区高考竞争：${education.regionalCompetition}；家庭教育支持：${education.familySupport}；个人升学压力预估：${education.pressure}（游戏设定）。${education.description}。`,
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
export function checkCondition(cond, character) {
  if (!cond) return true;
  if (!matchesLifeState(cond.lifeState, character.lifeState)) return false;

  if (cond.minAge !== undefined && character.age < cond.minAge) return false;
  if (cond.maxAge !== undefined && character.age > cond.maxAge) return false;
  const childAge = character.lifeState.childBirthAge === null ? -1 : character.age - character.lifeState.childBirthAge;
  if (cond.minChildAge !== undefined && childAge < cond.minChildAge) return false;
  if (cond.maxChildAge !== undefined && childAge > cond.maxChildAge) return false;

  if (cond.gender && cond.gender !== character.gender) return false;
  if (cond.isRural !== undefined && cond.isRural !== character.isRural) return false;
  if (cond.familyClass && !(Array.isArray(cond.familyClass) ? cond.familyClass.includes(character.familyClass) : cond.familyClass === character.familyClass)) return false;
  if (cond.minWealth !== undefined && character.wealth < cond.minWealth) return false;
  if (cond.maxWealth !== undefined && character.wealth > cond.maxWealth) return false;
  if (cond.minKnowledge !== undefined && character.knowledge < cond.minKnowledge) return false;
  if (cond.minHealth !== undefined && character.health < cond.minHealth) return false;

  return true;
}

// 界面与引擎共用资格校验，防止绕过禁用按钮或提交无效选项。
export function canSelectOption(option, character) {
  return checkCondition(option.condition, character) &&
    (minimumCash(option, character.age) === 0 || character.finances.cash >= minimumCash(option, character.age)) &&
    Object.entries(option.requirements || {}).every(([key, value]) =>
      key === 'wealth' || (Number.isFinite(character[key]) && character[key] >= value)
    );
}

function selectAnnualEvents(events, character) {
  const recentTexts = new Set(character.history.filter(row => row.age >= character.age - 5).flatMap(row => (row.events || [row]).map(event => event.text)));
  const pool = events.filter(event => checkCondition(event.condition, character) && (event.required || !recentTexts.has(event.text)));
  const selected = pool.filter(event => event.required);
  const candidates = pool.filter(event => !event.required);
  const count = 2 + Math.floor(Math.random() * 2);
  // 每年优先保留一条当前年龄/路线的事件，通用生活片段只用于补充。
  const contextual = candidates.filter(event => !event.id?.startsWith('extra_'));
  if (contextual.length && selected.length < count) {
    const event = contextual[Math.floor(Math.random() * contextual.length)];
    selected.push(event);
    candidates.splice(candidates.indexOf(event), 1);
  }
  while (selected.length < count && candidates.length) {
    const [event] = candidates.splice(Math.floor(Math.random() * candidates.length), 1);
    if (!selected.some(item => item.text === event.text)) selected.push(event);
  }
  return selected.length ? selected : [{ text: `${character.age}岁这一年，你在平淡的日常里继续前行。`, effect: {} }];
}

function drawOutcome(entry, age) {
  if (!entry.outcomes) return entry;
  let roll = Math.random() * entry.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  const outcome = entry.outcomes.find(outcome => (roll -= outcome.weight) < 0) || entry.outcomes.at(-1);
  const effect = { ...entry.effect };
  for (const [key, value] of Object.entries(outcome.effect || {})) effect[key] = (effect[key] || 0) + value;
  return { ...entry, ...outcome, effect,
    stateEffect: { ...entry.stateEffect, ...outcome.stateEffect },
    cashEffect: eventCashChange(entry, age) + eventCashChange(outcome, age)
  };
}

function applyEntry(character, rawEntry) {
  const entry = drawOutcome(rawEntry, character.age);
  // 换职业会结束原备考，旧考试结果不能覆盖新工作；薪资随岗位一起更换。
  const stateEffect = { ...entry.stateEffect };
  if (Object.hasOwn(stateEffect, 'career') || Object.hasOwn(stateEffect, 'schooling')) {
    if (!Object.hasOwn(stateEffect, 'examPreparation')) stateEffect.examPreparation = null;
    if (Object.hasOwn(stateEffect, 'career') && !Object.hasOwn(stateEffect, 'annualSalary')) stateEffect.annualSalary = null;
  }
  const { finances, cashChange } = applyMoney(character, entry);
  const effect = entry.effect || {};
  const next = { ...character, finances, lifeState: { ...character.lifeState, ...stateEffect } };
  for (const key of ['wealth', 'health', 'knowledge', 'sanity']) {
    next[key] = Math.max(0, Math.min(100, character[key] + (effect[key] || 0)));
  }
  if (entry.tag && !next.tags.includes(entry.tag)) next.tags = [...next.tags, entry.tag];
  if (entry.followUp) next.scheduledEvents = [...next.scheduledEvents.filter(event => !entry.followUp.id || event.id !== entry.followUp.id), { ...entry.followUp, dueAge: character.age + 1 }];
  if (next.health <= 0) Object.assign(next, { isGameOver: true, deathReason: '因身体多项指标衰竭抱憾离世' });
  const text = entry.resultText || entry.text;
  return { next, record: { text, effect, cashChange, cashAfter: finances.cash, ledger: entry.ledger, tag: entry.tag, isMajor: Boolean(entry.required) } };
}

function recordYear(character, records, choice = null) {
  const effect = {};
  for (const record of records) for (const [key, value] of Object.entries(record.effect)) effect[key] = (effect[key] || 0) + value;
  const item = {
    age: character.age, text: records.map(record => record.text).join(' '), events: records,
    effect, cashChange: records.reduce((sum, record) => sum + record.cashChange, 0),
    cashAfter: character.finances.cash, isChoice: Boolean(choice), tag: choice?.tag
  };
  return { ...character, history: [item, ...character.history], pendingChoice: null };
}

function enforceDebt(character) {
  if (character.isGameOver) return character;
  const choice = debtChoice(character);
  return choice ? { ...character, pendingChoice: { choice, mode: 'debt' } } : character;
}

function settleDebt(character, records) {
  if (character.isGameOver || !(character.finances.onlineDebt > 0 || character.finances.familyDebt > 0)) return character;
  const { next, record } = applyEntry(character, debtSettlement(character));
  records.push(record);
  return next;
}

function finishYear(character, events, choice = null, priorRecords = []) {
  const records = [...priorRecords];
  const commit = entry => {
    const { next, record } = applyEntry(character, entry);
    character = next; records.push(record);
  };
  if (choice) commit({ ...choice, text: `【抉择：${choice.text}】 ${choice.resultText || ''}`, resultText: undefined });
  // 选择后的事实用于筛选每条事件；不会把此前抽到的育儿或还款文案直接拼进结果。
  if (!character.isGameOver) for (const event of selectAnnualEvents([...events, ...relationshipEvents(character)], character)) {
    if (!checkCondition(event.condition, character)) continue;
    commit(event);
    if (character.isGameOver) break;
  }
  if (!character.isGameOver) {
    const budget = annualBudget(character);
    commit({ text: '这一年的收入与生活账单', cashEffect: budget.cashChange, ledger: budget.items,
      financeEffect: { mortgageDebt: Math.max(0, character.finances.mortgageDebt - budget.mortgagePayment) } });
  }
  character = settleDebt(character, records);
  return enforceDebt(recordYear(character, records, choice));
}

// 暂停期间，考试、录取后的毕业日期和学业年龄一起顺延。
function postponeScheduledEvent(event) {
  return {
    ...event, dueAge: event.dueAge + 1,
    outcomes: event.outcomes?.map(outcome => {
      if (!outcome.stateEffect?.schoolEndAge) return outcome;
      const stateEffect = { ...outcome.stateEffect, schoolEndAge: outcome.stateEffect.schoolEndAge + 1 };
      if (stateEffect.schoolingDelay !== undefined) stateEffect.schoolingDelay++;
      return { ...outcome, stateEffect };
    })
  };
}

export async function stepNextYear(character) {
  if (character.isGameOver || character.pendingChoice) return character;
  const crisis = enforceDebt(character);
  if (crisis.pendingChoice) return crisis;
  const age = character.age + 1;
  if (character.health <= 0 || age > 85) return { ...character, age: Math.min(age, 85), isGameOver: true,
    deathReason: character.health <= 0 ? '因身体严重透支与疾病溘然长逝' : '寿终正寝，走完了平凡而厚重的一生' };
  if (character.finances.recovering) {
    // 暂停整个年度：不触发毕业、考试结果、普通抉择或原岗位收入。
    character = { ...character, age,
      lifeState: { ...character.lifeState, schoolingDelay: (character.lifeState.schoolingDelay || 0) + (character.lifeState.schooling !== 'none' ? 1 : 0),
        schoolEndAge: character.lifeState.schoolEndAge ? character.lifeState.schoolEndAge + 1 : null },
      scheduledEvents: character.scheduledEvents.map(postponeScheduledEvent) };
    const budget = annualBudget(character);
    const { next, record } = applyEntry(character, { text: '你暂停原计划，用这一年打工增收、压缩生活开支。', cashEffect: budget.cashChange, ledger: budget.items,
      financeEffect: { mortgageDebt: Math.max(0, character.finances.mortgageDebt - budget.mortgagePayment) }, effect: { health: -3, sanity: -2 } });
    const records = [record];
    character = next;
    for (const event of relationshipEvents(character).filter(event => event.id.startsWith('farewell_'))) {
      const result = applyEntry(character, event);
      character = result.next; records.push(result.record);
      if (character.isGameOver) break;
    }
    // 房贷和退休仍按真实年龄推进，不随暂停的学业延期。
    if (age >= 60) character = { ...character, lifeState: { ...character.lifeState, career: 'retired' } };
    if (character.lifeState.housing === 'mortgaged' && character.finances.mortgageDebt === 0) {
      character = { ...character, lifeState: { ...character.lifeState, housing: 'owned', mortgageEndAge: null } };
    }
    character = settleDebt(character, records);
    const severe = character.finances.onlineDebt > 0 && age >= character.finances.onlineDueAge + DEBT_RULES.severeOverdueYears;
    const forced = character.finances.forcedRecovery || severe || unsecuredDebt(character.finances) >= debtLimit(character);
    const cleared = character.finances.cash >= 0 && !(character.finances.onlineDebt > 0 || character.finances.familyDebt > 0);
    character = { ...character, finances: { ...character.finances, forcedRecovery: forced && !cleared, recovering: forced && !cleared } };
    return enforceDebt(recordYear(character, records));
  }
  // 只顺延基础学业的年龄剧情；成年进修不能重放婚育等早年节点。
  const schoolContentAge = age - (character.lifeState.schoolingDelay || 0);
  const contentAge = ['preschool', 'primary', 'junior_high', 'high_school', 'vocational', 'college', 'university'].includes(character.lifeState.schooling) && schoolContentAge <= 22 ? schoolContentAge : age;
  const previousSchooling = character.lifeState.schooling;
  character = { ...character, age, lifeState: advanceLifeState(character.lifeState, age) };
  const loaded = await loadAgeData(contentAge);
  const events = [...loaded.events];
  if (['graduate', 'university', 'college'].includes(previousSchooling) && character.lifeState.schooling === 'none') {
    events.push({ required: true, text: previousSchooling === 'graduate' ? '你完成三年研究生学业，硕士毕业。新的学历将提高后续企业与公共岗位的基础收入。' : '你完成了学业，正式取得毕业学历，开始寻找自己的职业方向。', cashEffect: 0, effect: { sanity: 4 } });
  }
  const choices = loaded.choices.map(choice => {
    // 如果 choice 带有 optionPool，从备选池随机抽取 2-3 个选项展示
    if (choice.optionPool && choice.optionPool.length > 0) {
      const pool = choice.optionPool.filter(opt => !opt.condition || checkCondition(opt.condition, character));
      const required = pool.filter(opt => opt.required);
      const optional = pool.filter(opt => !opt.required);
      // 随机打乱可选项
      for (let i = optional.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optional[i], optional[j]] = [optional[j], optional[i]];
      }
      const drawCount = Math.min(optional.length, Math.max(0, (2 + Math.floor(Math.random() * 2)) - required.length));
      choice = { ...choice, options: [...required, ...optional.slice(0, drawCount)] };
    }
    return { ...choice, options: choice.options.map(option =>
      option.tag === '脱产考研战神' ? { ...graduateOption(character, true), tag: option.tag } : option) };
  }).map(choice => prepareEducationChoice(choice, character));
  // 先公布上一年的备考结果，再决定本年是否继续，转行后旧备考结果不会覆盖新职业。
  const priorRecords = [];
  const due = character.scheduledEvents.filter(event => event.dueAge <= age);
  character = { ...character, scheduledEvents: character.scheduledEvents.filter(event => event.dueAge > age) };
  for (const entry of due) {
    if (!checkCondition(entry.condition, character)) continue;
    const { next, record } = applyEntry(character, entry);
    character = next; priorRecords.push(record);
    if (character.isGameOver) return recordYear(character, priorRecords);
  }
  const schooling = character.lifeState.schooling;
  if (['gaokao_repeat', 'graduate'].includes(schooling) || character.lifeState.examPreparation) {
    events.push({ required: true, text: schooling === 'graduate' ? '你在研究生阶段完成课程与课题，学历将在完成三年学业后更新。' : '你按计划继续复习，为下一次考试积累准备。', cashEffect: 0, effect: { knowledge: 2 } });
  }
  const preparing = character.lifeState.career === 'preparing';
  // 到38岁必须离开全职备考；即使本年只看事件，也不会继续扣备考年份。
  if (preparing && age >= 38) character = { ...character, lifeState: { ...character.lifeState, career: 'unemployed' } };
  const careerChoice = preparing ? { id: `career_review_${age}`, title: age >= 38 ? '38岁：为职业换一条路' : '今年还要继续全职备考吗？', description: age >= 38 ? '游戏内全职备考阶段到此结束。选择求职、过渡工作或小生意，重新安排生活。' : '过去的投入不必成为继续的理由。你可以继续一年，也可以现在开始求职。', options: careerOptions(age) } : null;
  const relationshipChoice = [20, 23, 26, 28, 31, 36].includes(age) && character.lifeState.marriage === 'single' ? romanceChoice(character) : null;
  const choice = careerChoice || [...choices, ...(relationshipChoice ? [relationshipChoice] : [])].find(c => !(character.lifeState.schooling === 'graduate' && c.id === 'choice_age22_graduation') && checkCondition(c.condition, character) && c.options.some(option => canSelectOption(option, character)));
  if (!choice) return finishYear(character, events, null, priorRecords);
  if (priorRecords.length) character = recordYear(character, priorRecords);
  return { ...character, pendingChoice: { choice, annualEvents: events, mode: 'annual' } };
}

export function startLifeAction(character, id) {
  const choice = makeActionChoice(character, id);
  return choice ? { ...character, pendingChoice: { choice, mode: 'action' } } : character;
}

export function resolveChoice(character, option) {
  if (!character.pendingChoice || character.isGameOver) return character;
  if (!character.pendingChoice.choice.options.includes(option) || !canSelectOption(option, character)) return character;
  if (character.pendingChoice.mode === 'debt') {
    const { next, record } = applyEntry(character, option);
    return enforceDebt(recordYear(next, [record], option));
  }
  if (character.pendingChoice.mode === 'action') {
    if (option.cancel) return { ...character, pendingChoice: null };
    const { next, record } = applyEntry(character, option);
    return enforceDebt(recordYear({ ...next, lastActionAge: character.age }, [record], option));
  }
  return finishYear(character, character.pendingChoice.annualEvents || [character.pendingChoice.annualEvent].filter(Boolean), option);
}

/**
 * 终局人生评价算法
 */
export function evaluateLifeSummary(character) {
  const { age, wealth, knowledge, sanity, health, tags, isRural } = character;

  // 财富超越百分比（基于中国居民可支配收入五等分位估算）
  let wealthPercentile = Math.min(99, Math.max(5, Math.floor(wealth * 1.05)));

  // 根据已经完成的学历估算；在读、认知分数和历史标签不等于取得学历。
  const eduPercentile = {
    none: 10, primary: 15, junior_high: 25, vocational: 35,
    high_school: 40, college: 78, bachelor: 92, master: 97
  }[character.lifeState.education] ?? 10;

  // 寿命超越百分比（以全国平均预期寿命 78.6 岁为基准）
  let longevityPercentile = Math.min(98, Math.max(5, Math.round((age / 78.6) * 60)));
  if (age >= 80) longevityPercentile = 92;
  if (age >= 85) longevityPercentile = 98;

  // 生成终生成就称号
  let title = '平凡坚韧的赶路人';
  if (['mortgaged', 'owned'].includes(character.lifeState.housing) && tags.includes('三十年房奴') && wealth > 50) {
    title = '掏空六个钱包的房奴业主';
  } else if (character.lifeState.career === 'public' || (character.lifeState.career === 'retired' && ['public', 'directed_public'].includes(character.lifeState.careerTrack))) {
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
