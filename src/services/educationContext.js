// 沿用地区数据库的相对竞争等级，叠加家庭资源；仅为游戏叙事估计，不是录取预测。
const REGIONAL_COMPETITION = {
  '优待相对最高': 0, '优待相对较高': 0,
  '相对温和': 1, '中等偏易': 1,
  '中等难度': 2, '中等偏难': 3,
  '竞争激烈': 3, '千军万马': 4, '极高难度': 4, '地狱模式': 5
};
const COMPETITION_LABELS = ['较缓和', '相对温和', '中等', '偏激烈', '激烈', '非常激烈'];
const PRESSURE_LABELS = ['较轻', '较轻', '中等', '偏高', '很高', '很高'];
const FAMILY_SUPPORT = {
  '低保特困': { relief: -1, label: '有限', description: '教育支出和试错成本更难承担，升学压力更大' },
  '工薪温饱': { relief: 0, label: '基础', description: '主要依靠学校教育与个人努力，家庭能够承担基础教育支出' },
  '小康中产': { relief: 1, label: '较充足', description: '家庭能够提供更多学习辅导与升学规划支持' },
  '高净值富裕': { relief: 3, label: '充足', description: '家庭能够提供优质辅导、升学规划与更多教育路径，缓解升学压力，但不保证录取名校' }
};

export function educationContext(character) {
  const support = FAMILY_SUPPORT[character.familyClass] || FAMILY_SUPPORT['工薪温饱'];
  const regionalLevel = REGIONAL_COMPETITION[character.city.gaokaoDifficulty];
  // 港澳等不同考试制度不强行折算为内地高考难度。
  if (regionalLevel === undefined) return {
    regionalCompetition: '不同教育制度', pressure: '依升学路径而定',
    familySupport: support.label, description: support.description
  };
  const pressureLevel = Math.max(0, Math.min(5, regionalLevel - support.relief));
  return {
    regionalCompetition: COMPETITION_LABELS[regionalLevel], pressure: PRESSURE_LABELS[pressureLevel],
    familySupport: support.label, description: support.description
  };
}
