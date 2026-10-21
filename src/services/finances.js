// 游戏金额模型，单位为元；与真实收入预测无关。
export const formatMoney = value => `${value < 0 ? '−' : ''}¥${Math.round(Math.abs(value || 0)).toLocaleString('zh-CN')}`;
export const formatMoneyChange = value => `${value >= 0 ? '+' : '−'}${formatMoney(Math.abs(value))}`;
export const wealthUnit = age => age < 6 ? 1000 : age < 18 ? 2000 : 3000;
export function eventCashChange(event, age) {
  return event.cashEffect ?? (event.effect?.wealth || 0) * wealthUnit(age);
}
export function minimumCash(option, age) {
  return Math.max(option.minCash || 0, (option.requirements?.wealth || 0) * wealthUnit(age));
}
export function createFinances(familyClass) {
  return { cash: { '低保特困': 15000, '工薪温饱': 60000, '小康中产': 200000, '高净值富裕': 800000 }[familyClass], propertyValue: 0, mortgageDebt: 0, mortgageAnnualPayment: 0, mortgageStartAge: null };
}
export function applyMoney(character, event) {
  const cashChange = eventCashChange(event, character.age);
  const finances = { ...character.finances, ...event.financeEffect, cash: character.finances.cash + cashChange };
  return { finances, cashChange };
}
export function annualBudget(character) {
  const { lifeState: s, age, finances: f } = character;
  const income = age < 18 ? 0 : ({ worker: 66000, private: 108000, public: 84000, self_employed: 72000, retired: 36000 }[s.career] || 0);
  const living = age < 18 ? 0 : 30000;
  const rent = age >= 18 && s.housing === 'renting' ? 18000 : 0;
  const mortgagePayment = s.housing === 'mortgaged' ? (age > (f.mortgageStartAge ?? -1) ? Math.min(f.mortgageDebt, f.mortgageAnnualPayment) : 0) : s.housing === 'owned' ? f.mortgageDebt : 0;
  const childAge = s.childBirthAge === null ? null : age - s.childBirthAge;
  const childCost = s.parenthood === 'parent' && childAge !== null && childAge >= 0 && childAge < 18 ? (childAge < 3 ? 18000 : 12000) : 0;
  const items = [
    { label: age < 18 ? '家庭收支由父母安排' : s.career === 'retired' ? '养老金收入' : '工作收入', amount: income },
    { label: '日常生活支出', amount: -living },
    ...(rent ? [{ label: '全年房租', amount: -rent }] : []),
    ...(mortgagePayment ? [{ label: '全年住房还款（简化等额本金）', amount: -mortgagePayment }] : []),
    ...(childCost ? [{ label: childAge < 3 ? '奶粉、尿布与婴幼儿照护' : '子女生活与教育', amount: -childCost }] : [])
  ];
  return { items, cashChange: items.reduce((sum, item) => sum + item.amount, 0), mortgagePayment };
}
