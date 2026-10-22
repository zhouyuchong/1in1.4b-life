// 仅为游戏平衡参数，不代表现实授信、利率或破产制度。
export const DEBT_RULES = { onlineLimit: 50000, annualRate: 0.2, termYears: 1, severeOverdueYears: 1, workIncome: 96000 };
export const FAMILY_LIMITS = { '低保特困': 5000, '工薪温饱': 30000, '小康中产': 150000, '高净值富裕': 600000 };
export const FAMILY_DEBT_LIMITS = { '低保特困': 30000, '工薪温饱': 100000, '小康中产': 300000, '高净值富裕': 1000000 };

export const debtLimit = character => FAMILY_DEBT_LIMITS[character.familyClass] ?? FAMILY_DEBT_LIMITS['工薪温饱'];
