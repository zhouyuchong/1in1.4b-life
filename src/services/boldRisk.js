import { careerIncome, formatMoney } from './finances.js';

const chance = (base, character, attempts) => Math.round(Math.max(0.15, Math.min(0.85,
  base + (character.knowledge - 50) * 0.004 + Math.min(attempts, 3) * 0.04)) * 100) / 100;
const attemptsFor = (character, kind) => character.lifeState.riskAttempts?.[kind] || 0;
const attemptState = (character, kind) => ({ ...character.lifeState.riskAttempts, [kind]: attemptsFor(character, kind) + 1 });

export function graduateOption(character, fullTime = false) {
  const { age, lifeState: s } = character;
  const attempt = attemptsFor(character, 'graduate') + 1;
  const token = `graduate_${attempt}`;
  const success = chance(fullTime ? 0.38 : 0.25, character, attempt - 1);
  return {
    condition: { minAge: 21, maxAge: 35, lifeState: { education: 'bachelor', schooling: 'none', examPreparation: null } },
    riskKind: 'graduate', text: `考研再战 · 第${attempt}次：${fullTime ? '全职备考一年' : '在职备考一年'}`,
    minCash: fullTime ? 42000 : 6000, cashEffect: fullTime ? -12000 : -6000,
    detail: `${age + 1}岁公布结果，录取后读研3年、期间无工资；毕业后取得硕士学历，企业与公共岗位基础年收入提高。${fullTime ? '备考期间无工资，余额门槛含3万元生活预留。' : '备考期间保留工作收入。'}转向其他职业会结束此次备考。`,
    effect: { knowledge: fullTime ? 8 : 4, sanity: fullTime ? -6 : -4 },
    stateEffect: { riskAttempts: attemptState(character, 'graduate'), examPreparation: token,
      ...(fullTime ? { career: 'graduate_preparing', annualSalary: null } : {}) },
    resultText: `你开始了第${attempt}次考研${fullTime ? '全职' : '在职'}备考，结果将在下一年揭晓。`,
    followUp: { id: 'graduate_result', condition: { lifeState: { examPreparation: token } }, outcomes: [
      { weight: success, stateEffect: { schooling: 'graduate', schoolEndAge: age + 4, career: 'none', careerTrack: 'general', annualSalary: null, examPreparation: null }, effect: { sanity: 6 }, resultText: `第${attempt}次考研终于录取！你进入三年制研究生阶段，完成学业后才取得硕士学历。` },
      { weight: 1 - success, stateEffect: { examPreparation: null, ...(fullTime ? { career: 'unemployed' } : {}) }, effect: { sanity: -4 }, resultText: `第${attempt}次考研未能录取。${fullTime ? '你结束全职备考，可以先找工作，' : '你保留了原工作，'}也可以明年再试，复习经验会提高下一次胜算。` }
    ] }
  };
}

export function riskOptions(character) {
  const { age, lifeState: s } = character;
  if (age < 18) return [];
  const options = [];
  if (age <= 21 && s.education === 'high_school' && !s.examPreparation &&
    (s.schooling === 'none' || (age - (s.schoolingDelay || 0) === 18 && !s.schoolEndAge && ['university', 'college'].includes(s.schooling)))) {
    const attempt = attemptsFor(character, 'gaokao') + 1;
    const success = Math.min(0.7, chance(0.4, character, attempt - 1));
    const token = `gaokao_${attempt}`;
    options.push({ riskKind: 'gaokao', text: `高考复读 · 第${attempt}次：再给自己一年`, minCash: 45000, cashEffect: -15000,
      detail: `${age + 1}岁放榜。放弃当前入学或工作安排，备考无工资，另需预留3万元生活费。本科读4年，大专读3年；进入更好的本科后，毕业时企业与公共岗位基础年薪增加12000元。失败后可继续复读或求职。`,
      effect: { knowledge: 7, sanity: -5 },
      stateEffect: { riskAttempts: attemptState(character, 'gaokao'), examPreparation: token, schooling: 'gaokao_repeat', schoolEndAge: null, career: 'none', careerTrack: 'general', annualSalary: null },
      resultText: `你决定第${attempt}次复读，花15000元投入新一轮准备，暂时放下原来的安排。`,
      followUp: { id: 'gaokao_result', condition: { lifeState: { examPreparation: token } }, outcomes: [
        { weight: success, stateEffect: { schooling: 'university', universityTier: 'selective', education: 'high_school', schoolingDelay: age + 1 - 18, schoolEndAge: age + 5, examPreparation: null }, effect: { sanity: 7 }, resultText: `第${attempt}次复读取得明显进步，你被更好的本科院校录取。四年后取得本科学历，并提高后续企业与公共岗位的基础收入。` },
        { weight: 0.2, stateEffect: { schooling: 'college', schoolingDelay: age + 1 - 18, schoolEndAge: age + 4, examPreparation: null }, effect: { sanity: 1 }, resultText: `第${attempt}次复读小幅进步，你接受更适合自己的大专专业，开始三年学习。` },
        { weight: Math.max(0, 0.8 - success), stateEffect: { schooling: 'none', career: 'unemployed', examPreparation: null }, effect: { sanity: -6 }, resultText: `第${attempt}次复读发挥失常，没能进入目标学校。你可以在年龄窗口内再试，也可以开始工作。` }
      ] }
    });
  }
  if (age >= 21 && age <= 35 && s.education === 'bachelor' && s.schooling === 'none' && !s.examPreparation && s.career !== 'preparing') {
    if (['worker', 'private', 'public', 'self_employed'].includes(s.career)) options.push(graduateOption(character));
    options.push(graduateOption(character, true));
  }
  if (age >= 22 && age <= 55 && s.schooling === 'none' && ['worker', 'private', 'public', 'self_employed'].includes(s.career) && !s.examPreparation) {
    const attempt = attemptsFor(character, 'job') + 1;
    const salary = careerIncome(character);
    const success = chance(0.35, character, attempt - 1);
    for (const bold of [false, true]) {
      const target = Math.round(salary * (bold ? 1.4 : 1.2));
      options.push({ riskKind: 'job', text: `跳槽 · 第${attempt}次：${bold ? '裸辞冲刺更高薪岗位' : '拿到 offer 再离职'}`, minCash: bold ? 33000 : 1000, cashEffect: bold ? -3000 : -1000,
        detail: `当前年收入${formatMoney(salary)}。${bold ? '失败将失业、停止工资收入；门槛含3万元生活预留。' : '失败保留当前工作与薪资。'}成功后的薪资持续计入年度账本，直到再次换工作或退休。`,
        effect: { sanity: bold ? -5 : -2 }, stateEffect: { riskAttempts: attemptState(character, 'job') }, outcomes: [
          { weight: success, stateEffect: { career: 'private', careerTrack: 'general', annualSalary: target }, effect: { sanity: 5 }, resultText: `第${attempt}次跳槽成功，新岗位年薪${formatMoney(target)}，今后的年度工资按此结算。` },
          { weight: 1 - success, ...(bold ? { stateEffect: { career: 'unemployed', annualSalary: null, careerTrack: 'general' } } : {}), effect: { sanity: -3 }, resultText: `第${attempt}次跳槽没有拿到合适的 offer。${bold ? '你已离职，接下来没有工资收入，需要重新求职。' : '你继续留在原岗位，原薪资不变。'}面试经验留给下一次尝试。` }
        ] });
    }
  }
  const attempt = attemptsFor(character, 'lottery') + 1;
  options.push({ riskKind: 'lottery', text: `彩票 · 第${attempt}次：花20元试试手气`, minCash: 20, cashEffect: -20,
    detail: '每年最多一次，与其他主动行动共用机会。中奖率为游戏设定，每次独立抽取；认知、经历和购买次数不会提高中奖率。奖金为入账金额。',
    stateEffect: { riskAttempts: attemptState(character, 'lottery') }, outcomes: [
      { weight: 0.000001, cashEffect: 1000000, tag: '彩票大奖得主', resultText: `第${attempt}次买彩票，你意外中得100万元大奖，奖金已进入可用余额。` },
      { weight: 0.000999, cashEffect: 1000, resultText: `第${attempt}次买彩票，你中了1000元。` },
      { weight: 0.099, cashEffect: 10, resultText: `第${attempt}次买彩票，你中了10元小奖，扣除票钱仍花了10元。` },
      { weight: 0.9, resultText: `第${attempt}次买彩票，没有中奖，20元票钱留作了一次期待。` }
    ] });
  return options;
}

export function riskChoice(character) {
  return { title: '大胆一搏 · Bold & Risk', description: '押上时间、金钱或稳定的生活，争取另一种可能。机会按年龄与当前状态开放，可在以后年份重复尝试；与主动求变共用每年一次机会。高考复读18～21岁，考研21～35岁（本科毕业），跳槽22～55岁（已就业），彩票18岁起。以下概率均为游戏设定。', options: riskOptions(character) };
}
