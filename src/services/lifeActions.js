const cancel = { text: '先不改变，继续考虑', cancel: true };
const followUp = (text, condition) => ({ text, condition, effect: { knowledge: 2 } });
export function getLifeActions(character) {
  if (!character || character.age < 16 || character.isGameOver || character.pendingChoice || character.lastActionAge === character.age) return [];
  const s = character.lifeState;
  return [
    { id: 'study', label: '进修学习', description: '报名课程，提升技能' },
    ...(character.age >= 18 && character.age < 60 && s.schooling === 'none' ? [{ id: 'career', label: '换条职业路', description: '求职、考编或创业' }] : []),
    ...(character.age >= 18 ? [{ id: 'housing', label: '调整居住', description: '租房、买房或卖房' }] : []),
    ...(character.age >= 22 && s.marriage === 'married' && s.parenthood !== 'parent' ? [{ id: 'family', label: '重议生育计划', description: '准备生育或继续暂缓' }] : []),
    { id: 'health', label: '照顾身体', description: '体检与运动计划' }
  ];
}
export function makeActionChoice(character, id) {
  if (!getLifeActions(character).some(action => action.id === id)) return null;
  const { age, lifeState: s, finances: f } = character;
  const choices = {
    study: { title: '主动求变：给自己一次进修机会', description: '拿出时间与学费系统学习，积累下一次转向的能力。技能培训不会直接改变学历。', options: [
      { text: '报名技能课程，完成阶段项目', minCash: 6000, cashEffect: -6000, effect: { knowledge: 8, sanity: -2 }, tag: '持续进修', resultText: '你报了课程，开始把空闲时间投入练习。', followUp: followUp('进修后的项目练习有了成果，你整理出一份自己的作品集。') }
    ] },
    career: { title: '主动求变：重新选择职业方向', description: '改变需要投入，也可能不如预期。先决定你愿意承担的成本。', options: [
      { text: '投简历、参加面试，争取新的企业岗位', minCash: 2000, cashEffect: -2000, effect: { sanity: -2 }, outcomes: [
        { weight: 0.65, stateEffect: { career: 'private', careerTrack: 'general' }, resultText: '经过几轮面试，你拿到新 offer，转入企业岗位。', followUp: followUp('新工作满一年，你逐渐熟悉了业务与同事。', { lifeState: { career: 'private' } }) },
        { weight: 0.35, resultText: '这轮面试没有收到合适的 offer，你保留原来的安排，也积累了求职经验。' }
      ] },
      { text: '投入一年全职备考，暂时离开工作岗位', condition: { maxAge: 58 }, minCash: 36000, cashEffect: -6000, stateEffect: { career: 'preparing', careerTrack: 'general' }, effect: { knowledge: 5 }, resultText: '你留出生活费，开始一年的备考计划。', followUp: { text: '备考一年后，你参加了笔试和面试。', outcomes: [
        { weight: 0.3, stateEffect: { career: 'public', careerTrack: 'public' }, resultText: '这次你通过了招录，正式走上公共部门岗位。', effect: { sanity: 6 } },
        { weight: 0.7, resultText: '这次没有入围，你可以继续准备，也可以主动重新求职。', effect: { sanity: -3 } }
      ] } },
      { text: '拿出启动资金，尝试自己的小生意', minCash: 30000, cashEffect: -30000, outcomes: [
        { weight: 0.5, stateEffect: { career: 'self_employed', careerTrack: 'general' }, resultText: '第一批订单有了回头客，你开始靠自己的小生意谋生。' },
        { weight: 0.5, cashEffect: -10000, resultText: '试营业没能覆盖成本，又亏损了1万元。你及时止损，保留原有职业安排。' }
      ] }
    ] },
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
    health: { title: '主动求变：把健康放回日程', description: '你可以为身体留出一笔预算，也可以从不花钱的运动开始。', options: [
      { text: '做一次体检并调整作息', minCash: 1200, cashEffect: -1200, effect: { health: 5, sanity: 2 }, resultText: '你拿到体检报告，开始认真调整作息与饮食。' },
      { text: '坚持步行和居家锻炼', cashEffect: 0, effect: { health: 3, sanity: 2 }, resultText: '你从每天散步开始，把运动写进了自己的生活。' }
    ] }
  };
  return { ...choices[id], id: `action_${id}`, options: [...choices[id].options, cancel] };
}
