import { formatMoney } from './finances.js';

import { DEBT_RULES, FAMILY_LIMITS } from './debtRules.js';
export { DEBT_RULES, FAMILY_LIMITS } from './debtRules.js';
export const unsecuredDebt = f => Math.max(0, (f.onlineDebt || 0) + (f.familyDebt || 0) - f.cash);
export function familyCapacity(character) {
  if (!character.lifeState.fatherAlive && !character.lifeState.motherAlive) return 0;
  return Math.max(0, (FAMILY_LIMITS[character.familyClass] || 0) - (character.finances.familyBorrowed || 0));
}
export function debtChoice(character) {
  const f = character.finances;
  const severe = (f.onlineDebt || 0) > 0 && character.age >= f.onlineDueAge + DEBT_RULES.severeOverdueYears;
  const forced = unsecuredDebt(f) >= DEBT_RULES.limit || severe;
  if (f.recovering || (!forced && f.cash >= 0)) return null;
  const gap = Math.max(0, -f.cash);
  const family = Math.min(gap, familyCapacity(character));
  const online = Math.min(gap, DEBT_RULES.onlineLimit);
  return {
    id: 'debt_crisis', title: forced ? '债务危机：被迫停下原来的生活' : '余额告急：先填上资金缺口',
    description: `当前余额 ${formatMoney(f.cash)}，网贷欠款 ${formatMoney(f.onlineDebt || 0)}，家人借款 ${formatMoney(f.familyDebt || 0)}。无抵押净负债达到 ${formatMoney(DEBT_RULES.limit)} 或网贷逾期满一年，将强制打工还债。${forced ? '你已触发强制还债，借新债无法解除危机。' : `家庭背景「${character.familyClass}」剩余可借 ${formatMoney(familyCapacity(character))}（累计额度，用尽不恢复；父母均离世后不可再借）。`}`,
    options: [
      ...(!forced && online > 0 && character.age >= 18 && !f.creditBlocked && !(f.onlineDebt > 0) ? [{
        text: `网贷周转 ${formatMoney(online)}：年息${DEBT_RULES.annualRate * 100}%，${character.age + DEBT_RULES.termYears}岁到期`, cashEffect: online,
        financeEffect: { onlineDebt: online, onlineDueAge: character.age + DEBT_RULES.termYears },
        description: '到期自动用结余还本付息；逾期持续损伤健康和心力，逾期满一年强制打工并永久关闭网贷资格。',
        resultText: '你借入网贷。每年计息，到期自动用结余还款；逾期会承受催收压力，逾期满一年会失去借款资格并被迫打工。',
        effect: { sanity: -3 }
      }] : []),
      ...(!forced && family > 0 ? [{
        text: `向家人借 ${formatMoney(family)}，免息、以后用结余归还`, cashEffect: family,
        financeEffect: { familyDebt: (f.familyDebt || 0) + family, familyBorrowed: (f.familyBorrowed || 0) + family },
        effect: { sanity: -2 }, resultText: '家人拿出能力范围内的积蓄帮你周转。这笔钱仍需归还，家庭也无法无限兜底。'
      }] : []),
      { text: forced ? (character.age < 16 ? '家庭陷入财务困境，暂停学业共同重建' : '被迫进厂，暂停原计划直到还清欠款') : (character.age < 16 ? '由家人紧急增收，暂停学业渡过难关' : '暂停原计划，做一年兼职周转'),
        description: `占用下一整年，暂停工作、学业和后续事项。16岁起打工年收入${formatMoney(DEBT_RULES.workIncome)}，成年人基本生活费18000元，其他账单照付；16岁以下由家人增收。`,
        cashEffect: 0, financeEffect: { recovering: true, forcedRecovery: forced, creditBlocked: Boolean(f.creditBlocked || severe) },
        effect: { sanity: forced ? -12 : -4 }, tag: forced ? '债务重建' : '兼职周转',
        resultText: `从下一年起，原有工作、学习、备考及后续事项暂停，暂停期间不叠加原工资。16岁起打工年收入${DEBT_RULES.workIncome}元、基本生活费18000元，其余账单照付；16岁以下由家人增收。结余优先还网贷，再还家人。兼职一年后可重新安排，强制还债则持续到欠款清偿。`
      }
    ]
  };
}

// 每年只在全部生活账单之后结算一次；借款当年不计息。
export function debtSettlement(character) {
  const f = character.finances;
  const interest = (f.onlineDebt || 0) > 0 && character.age >= f.onlineDueAge ? Math.ceil(f.onlineDebt * DEBT_RULES.annualRate) : 0;
  let onlineDebt = (f.onlineDebt || 0) + interest;
  let available = Math.max(0, f.cash);
  const onlinePayment = character.age >= f.onlineDueAge ? Math.min(available, onlineDebt) : 0;
  onlineDebt -= onlinePayment; available -= onlinePayment;
  const familyPayment = Math.min(available, f.familyDebt || 0);
  const familyDebt = (f.familyDebt || 0) - familyPayment;
  const overdue = onlineDebt > 0 && character.age >= f.onlineDueAge;
  const severe = overdue && character.age >= f.onlineDueAge + DEBT_RULES.severeOverdueYears;
  const ledger = [
    ...(onlinePayment ? [{ label: '偿还网贷本息', amount: -onlinePayment }] : []),
    ...(familyPayment ? [{ label: '归还家人借款', amount: -familyPayment }] : [])
  ];
  return {
    text: `债务结算：${interest ? `网贷新增利息 ${formatMoney(interest)}，计入欠款。` : ''}${overdue ? (severe ? '长期逾期，借款资格关闭，必须暂停原计划打工还债。' : '网贷到期未还清，催收与资金压力影响了健康和心力。') : '按结余偿还借款。'}`,
    cashEffect: -onlinePayment - familyPayment, ledger,
    financeEffect: { onlineDebt, familyDebt, onlineDueAge: onlineDebt ? f.onlineDueAge : null, creditBlocked: Boolean(f.creditBlocked || severe) },
    effect: overdue ? { sanity: severe ? -15 : -8, health: severe ? -5 : -2 } : {}
  };
}
