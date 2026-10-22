// 游戏平衡参数：家庭优势代表可获得的辅导、信息与准备资源，不是现实录取率。
export const EDUCATION_RESOURCES = {
  '低保特困': { chanceBonus: -0.05, knowledgeBonus: -2 },
  '工薪温饱': { chanceBonus: 0, knowledgeBonus: 0 },
  '小康中产': { chanceBonus: 0.07, knowledgeBonus: 4 },
  '高净值富裕': { chanceBonus: 0.15, knowledgeBonus: 8 }
};
const GAOKAO_REGION_BONUS = {
  '优待相对最高': 0.05, '优待相对较高': 0.05,
  '相对温和': 0.025, '中等偏易': 0.025, '中等难度': 0,
  '中等偏难': -0.025, '竞争激烈': -0.025,
  '千军万马': -0.05, '极高难度': -0.05, '地狱模式': -0.075
};
export const educationResources = character => EDUCATION_RESOURCES[character.familyClass] || EDUCATION_RESOURCES['工薪温饱'];
export function examAdjustment(character, kind) {
  return educationResources(character).chanceBonus + (kind === 'gaokao' ? (GAOKAO_REGION_BONUS[character.city?.gaokaoDifficulty] || 0) : 0);
}
export const examChance = (base, character, kind, attempts = 0, cap = 0.95) => Math.round(Math.max(0.1, Math.min(cap,
  base + (character.knowledge - 50) * 0.004 + Math.min(attempts, 3) * 0.04 + examAdjustment(character, kind))) * 1000) / 1000;
export function examDetail(character, kind) {
  const family = educationResources(character).chanceBonus;
  const regional = kind === 'gaokao' ? examAdjustment(character, kind) - family : 0;
  const points = value => `${value >= 0 ? '+' : ''}${Number((value * 100).toFixed(1))}个百分点`;
  return `家庭教育资源修正${points(family)}${kind === 'gaokao' ? `，地区竞争修正${points(regional)}` : ''}；成功率还受认知与备考经历影响，均为游戏设定。`;
}

export function prepareEducationChoice(choice, character) {
  if (choice.id !== 'choice_age18_gaokao_major') return choice;
  const bonus = educationResources(character).knowledgeBonus;
  const options = choice.options.map(option => {
    if (option.stateEffect?.schooling !== 'university') return option;
    const selective = option.tag === '天坑名校生';
    const threshold = Math.max(0, (option.requirements?.knowledge ?? 45) - bonus);
    const success = examChance(selective ? 0.4 : 0.7, character, 'gaokao');
    return {
      ...option, text: `申请${selective ? '名校' : '本科'}：${option.text}`,
      requirements: { ...option.requirements, knowledge: threshold },
      detail: `${examDetail(character, 'gaokao')}所需认知${threshold}；未录取则选择大专就读，仍可主动复读。`,
      cashEffect: 0, effect: {}, stateEffect: {}, resultText: undefined,
      outcomes: [
        { weight: success, cashEffect: option.cashEffect, effect: option.effect, tag: option.tag,
          stateEffect: { ...option.stateEffect, universityTier: selective ? 'selective' : null }, resultText: option.resultText },
        { weight: 1 - success, cashEffect: 0, effect: { sanity: -5 }, tag: '高考未达目标',
          stateEffect: { schooling: 'college', careerTrack: 'general', universityTier: null },
          resultText: '这次考试与志愿申请没能达到目标，你接受了大专录取。你仍可以主动选择复读，争取下一次机会。' }
      ]
    };
  });
  if (['小康中产', '高净值富裕'].includes(character.familyClass)) {
    const success = examChance(0.65, character, 'gaokao');
    options.push({
      text: '申请自费中外合作本科，投入24万元覆盖四年学费',
      condition: { familyClass: ['小康中产', '高净值富裕'] },
      minCash: 240000, requirements: { knowledge: 35 },
      detail: `需要认知35、可用余额24万元。申请费1万元，录取后支付余下23万元；生活费另按年结算。四年后毕业才获得本科学历，未录取可先读大专或主动复读。${examDetail(character, 'gaokao')}`,
      cashEffect: -10000, effect: {}, outcomes: [
        { weight: success, cashEffect: -230000, effect: { sanity: 3 }, tag: '自费本科',
          stateEffect: { schooling: 'university', career: 'none', careerTrack: 'general', universityTier: null, schoolEndAge: character.age + 4, schoolingDelay: character.age - 18 },
          resultText: '通过入学考核，你被自费中外合作本科项目录取，共支付24万元学费，开始四年学习。学费已付清，生活支出仍按年结算。' },
        { weight: 1 - success, cashEffect: 0, effect: { sanity: -5 }, tag: '自费申请未录取',
          stateEffect: { schooling: 'college', careerTrack: 'general', universityTier: null },
          resultText: '自费本科申请未通过考核，花去1万元申请费。你接受大专录取，也可以主动复读。家庭资源没有保证录取结果。' }
      ]
    });
  }
  return { ...choice, description: `${choice.description}本科录取需要实际抽取考试结果，家庭教育资源影响认知门槛与成功率，地区竞争也计入高考。大专路线可直接选择。`, options };
}
