import { riskChoice } from './boldRisk.js';
import { romanceChoice, socialChoice } from './relationships.js';

const cancel = { text: '先不改变，继续考虑', cancel: true };
const followUp = (text, condition) => ({ text, condition, effect: { knowledge: 2 } });
export function getLifeActions(character) {
  if (!character || character.age < 16 || character.isGameOver || character.finances.recovering || character.pendingChoice || character.lastActionAge === character.age) return [];
  const s = character.lifeState;
  return [
    ...(character.age >= 18 ? [{ id: 'risk', label: '大胆一搏', description: '复读、考研、跳槽与彩票' }] : []),
    { id: 'study', label: '进修学习', description: '报名课程，提升技能' },
    ...(character.age >= 18 && character.age < 60 && (s.schooling === 'none' || s.career === 'preparing') ? [{ id: 'career', label: '换条职业路', description: '求职、考编或创业' }] : []),
    ...(character.age >= 18 ? [{ id: 'housing', label: '调整居住', description: '租房、买房或卖房' }] : []),
    ...(character.age >= 22 && s.marriage === 'married' && s.parenthood !== 'parent' ? [{ id: 'family', label: '重议生育计划', description: '准备生育或继续暂缓' }] : []),
    { id: 'travel', label: '出去走走', description: '远行或附近散心' },
    { id: 'gift', label: '犒劳自己', description: '挑一份喜欢的礼物' },
    { id: 'hobby', label: '培养爱好', description: '音乐、摄影或运动' },
    { id: 'social', label: '结交与陪伴', description: '认识朋友、联系老友' },
    ...(character.age >= 18 && s.marriage !== 'married' ? [{ id: 'romance', label: '经营感情', description: '相识、约会与沟通' }] : []),
    { id: 'health', label: '照顾身体', description: '体检与运动计划' }
  ];
}
export function makeActionChoice(character, id) {
  if (!getLifeActions(character).some(action => action.id === id)) return null;
  const { age, lifeState: s, finances: f } = character;
  const choices = {
    risk: id === 'risk' ? riskChoice(character) : null,
    study: { title: '主动求变：给自己一次进修机会', description: '拿出时间与学费系统学习，积累下一次转向的能力。技能培训不会直接改变学历。', options: [
      { text: '报名技能课程，完成阶段项目', minCash: 6000, cashEffect: -6000, effect: { knowledge: 8, sanity: -2 }, tag: '持续进修', resultText: '你报了课程，开始把空闲时间投入练习。', followUp: followUp('进修后的项目练习有了成果，你整理出一份自己的作品集。') }
    ] },
    career: { title: '主动求变：重新选择职业方向', description: '备考期间也可以随时求职。游戏内最多备考至37岁，38岁起重新选择职业方向。', options: careerOptions(age, s.career) },
    housing: { title: '主动求变：重新安排住处', description: '居住选择会改变之后的房租、房贷和可用资金。以下为游戏中的固定房价模型。', options: ['family', 'renting'].includes(s.housing) ? [
      { text: '租一间更适合自己的房子', minCash: 6000, cashEffect: -6000, stateEffect: { housing: 'renting', mortgageEndAge: null }, effect: { sanity: 4 }, resultText: '你签了新的租约，之后按年支付租金。' },
      { text: '首付18万元购买90万元住房，余款分30年偿还', minCash: 180000, cashEffect: -180000, financeEffect: { propertyValue: 900000, mortgageDebt: 720000, mortgageAnnualPayment: 24000, mortgageStartAge: age }, stateEffect: { housing: 'mortgaged', mortgageEndAge: age + 30 }, effect: { sanity: -3 }, resultText: '你签下合同，住房与剩余贷款都记入了账本。' }
    ] : [
      { text: '卖房结清剩余贷款，转为租房生活', cashEffect: f.propertyValue - f.mortgageDebt - 10000, financeEffect: { propertyValue: 0, mortgageDebt: 0, mortgageAnnualPayment: 0, mortgageStartAge: null }, stateEffect: { housing: 'renting', mortgageEndAge: null }, effect: { sanity: 3 }, resultText: '你完成卖房并结清贷款，扣除交易支出后将余款留在手中，开始租房生活。' }
    ] },
    family: { title: '主动求变：重新讨论生育计划', description: '此前的决定不会被系统自动推翻。只有你在这里明确选择，才会改变计划。', options: [
      { text: '改变计划，准备好后迎接孩子', minCash: 15000, cashEffect: -15000, stateEffect: { parenthood: 'parent', childBirthAge: age }, effect: { sanity: 5, health: -3 }, resultText: '经过准备，你们迎来了孩子，之后的照护与生活支出会记入账本。' },
      { text: '继续暂缓，先经营好当下生活', cashEffect: 0, stateEffect: { parenthood: 'deferred' }, effect: { sanity: 2 }, resultText: '你们确认目前暂不生育，生活仍按没有孩子的安排继续。' }
    ] },
    travel: { title: '主动安排：看看更大的世界', description: '给自己放个假，按预算选择目的地。', options: [
      { text: '花3000元去向往的城市旅行', minCash: 3000, cashEffect: -3000, effect: { sanity: 8, knowledge: 2 }, resultText: '你花3000元走进陌生城市，看风景、尝小吃，把沿途的照片留作纪念。' },
      { text: '花200元去近郊一日游', minCash: 200, cashEffect: -200, effect: { sanity: 5, health: 2 }, resultText: '你花200元在近郊走了一天，带着轻松的心情回家。' },
      { text: '步行探索附近的免费公园', cashEffect: 0, effect: { sanity: 3, health: 2 }, resultText: '你在免费公园走走停停，发现熟悉的生活附近也藏着风景。' }
    ] },
    gift: { title: '主动安排：送自己一份礼物', description: '礼物不必昂贵，也可以是给自己留出一点时间。', options: [
      { text: '花600元买下惦记很久的礼物', minCash: 600, cashEffect: -600, effect: { sanity: 6 }, resultText: '你花600元买下喜欢的礼物，为自己这一年的努力认真庆祝。' },
      { text: '花50元买一本书或一束花', minCash: 50, cashEffect: -50, effect: { sanity: 3, knowledge: 1 }, resultText: '你花50元挑了一份小礼物，普通的一天有了仪式感。' },
      { text: '给自己写封信，留一个不被打扰的下午', cashEffect: 0, effect: { sanity: 3 }, resultText: '你给未来的自己写了一封信，也把这个下午留给了自己。' }
    ] },
    hobby: { title: '主动安排：培养一个自己的爱好', description: '爱好不一定要变成收入，喜欢本身就值得。', options: [
      ...['音乐', '摄影', '球类运动'].map(hobby => ({ text: `花800元开始学习${hobby}`, minCash: 800, cashEffect: -800, effect: { sanity: 5, knowledge: 2 }, tag: `${hobby}爱好者`, resultText: `你花800元置办入门用品，开始练习${hobby}。`, followUp: { text: `坚持了一年的${hobby}练习有了进步，你为这份属于自己的兴趣感到开心。`, cashEffect: 0, effect: { sanity: 4 } } })),
      { text: '用免费资源学习绘画和阅读', cashEffect: 0, effect: { sanity: 3, knowledge: 2 }, tag: '阅读绘画爱好者', resultText: '你从图书馆与免费教程开始，把阅读和画画变成了生活的一部分。' }
    ] },
    social: id === 'social' ? socialChoice(character) : null,
    romance: romanceChoice(character),
    health: { title: '主动求变：把健康放回日程', description: '你可以为身体留出一笔预算，也可以从不花钱的运动开始。', options: [
      { text: '做一次体检并调整作息', minCash: 1200, cashEffect: -1200, effect: { health: 5, sanity: 2 }, resultText: '你拿到体检报告，开始认真调整作息与饮食。' },
      { text: '坚持步行和居家锻炼', cashEffect: 0, effect: { health: 3, sanity: 2 }, resultText: '你从每天散步开始，把运动写进了自己的生活。' }
    ] }
  };
  return { ...choices[id], id: `action_${id}`, options: [...choices[id].options, cancel] };
}

// 年度备考抉择与主动职业选项共用，保证随时能退出。
export function careerOptions(age, currentCareer = 'preparing') {
  const leavingPreparation = ['preparing', 'unemployed'].includes(currentCareer);
  return [
    { text: '免费投简历并参加面试，寻找企业岗位', cashEffect: 0, effect: { sanity: -1 }, outcomes: [
      { weight: 0.65, stateEffect: { career: 'private', careerTrack: 'general' }, resultText: '经过面试，你拿到企业 offer，开始新的工作。' },
      { weight: 0.35, ...(leavingPreparation ? { stateEffect: { career: 'unemployed', careerTrack: 'general' } } : {}), resultText: leavingPreparation ? '你结束全职备考。这轮没有合适的 offer，接下来继续求职，也可以先做过渡工作。' : '这轮没有合适的 offer，你保留当前安排，也积累了面试经验。' }
    ] },
    { text: '投入一年全职备考，预留生活费', condition: { maxAge: 37 }, minCash: 36000, cashEffect: -6000, stateEffect: { career: 'preparing', careerTrack: 'general' }, effect: { knowledge: 5 }, resultText: '你支付6000元备考费用，另留生活预算，开始一年的备考计划。', followUp: {
      id: 'exam_result', text: '备考一年后，你参加了笔试和面试。', condition: { maxAge: 38, lifeState: { career: 'preparing' } }, outcomes: [
        { weight: 0.3, stateEffect: { career: 'public', careerTrack: 'public' }, resultText: '这次你通过了招录，正式走上公共部门岗位。', effect: { sanity: 6 } },
        { weight: 0.7, resultText: '这次没有入围，你可以主动重新求职；到了38岁，游戏会提醒你换一条职业路。', effect: { sanity: -3 } }
      ]
    } },
    { text: '拿出30000元启动资金，尝试小生意', minCash: 30000, cashEffect: -30000, outcomes: [
      { weight: 0.5, stateEffect: { career: 'self_employed', careerTrack: 'general' }, resultText: '第一批订单有了回头客，你开始靠自己的小生意谋生。' },
      { weight: 0.5, cashEffect: -10000, resultText: '试营业没能覆盖成本，在启动资金之外又亏损了10000元。你及时止损，保留原有职业安排。' }
    ] },
    { text: '先做一份过渡工作，恢复稳定节奏', cashEffect: 0, stateEffect: { career: 'worker', careerTrack: 'general' }, effect: { sanity: 3 }, resultText: '你找到一份过渡工作，先恢复收入，再慢慢寻找适合自己的方向。' }
  ].filter(option => age < 38 || option.condition?.maxAge !== 37);
}
