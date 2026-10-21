// 年度数据生成时补充事实条件与状态变更，确保重新生成不会丢失剧情约束。
const optionStates = {
  '重点高中做题家': { schooling: 'high_school' },
  '普高复活借读': { schooling: 'high_school' },
  '职校技术生': { schooling: 'vocational' },
  '少年务工': { schooling: 'none', career: 'worker' },
  '实用主义工科生': { schooling: 'university' },
  '天坑名校生': { schooling: 'university' },
  '铁饭碗预备军': { schooling: 'university', careerTrack: 'directed_public' },
  '专科逆袭派': { schooling: 'college' },
  '北上广深漂流者': { career: 'private', careerTrack: 'general', housing: 'renting' },
  '脱产考研战神': { career: 'preparing', careerTrack: 'general', housing: 'renting' },
  '考编上岸族': { career: 'public', careerTrack: 'public' },
  '灵活就业新青年': { career: 'self_employed', careerTrack: 'general', housing: 'renting' },
  '风口跃迁者': { career: 'private' },
  '归隐考编': { career: 'preparing' },
  '三十年房奴': { housing: 'mortgaged', mortgageEndAge: 57 },
  '不买房信徒': { housing: 'renting', mortgageEndAge: null },
  '晋升父母': { parenthood: 'parent', childBirthAge: 29 },
  '丁克先锋': { parenthood: 'childfree' },
  '职场老黄牛': { career: 'private' },
  '自救中年人': { career: 'self_employed', careerTrack: 'general' },
  '体制稳固': { career: 'public', careerTrack: 'public' },
  '中国式隔代奉献': { hasGrandchildren: true }
};
const condition = lifeState => ({ lifeState });
const event = (text, lifeState, effect = {}) => ({ text, condition: condition(lifeState), effect });
const school = { schooling: 'high_school' };
const university = { schooling: 'university' };
const employed = { career: ['worker', 'private', 'public', 'self_employed'] };
const parents = { parenthood: 'parent' };
const mortgage = { housing: 'mortgaged' };

export function connectLifeContent(age, data) {
  const { events, choices } = data;
  const gate = (index, state) => { events[index].condition = condition(state); };
  for (const choice of choices) {
    for (const option of choice.options) {
      if (optionStates[option.tag]) option.stateEffect = optionStates[option.tag];
    }
  }
  if ([16, 17, 18].includes(age)) {
    events.forEach((_, i) => gate(i, age === 18 ? { education: 'high_school', career: 'none' } : school));
    events.push(event(`${age}岁这一年，你在实训车间磨练手艺，慢慢掌握一门能安身立命的技术。`, { schooling: 'vocational' }, { knowledge: 3 }));
    events.push(event(`${age}岁这一年，你在工作中积累经验，领到工资后认真盘算生活开销。`, { career: 'worker' }, { wealth: 3, health: -1 }));
  }
  if (age === 17) choices[0].condition = condition(school);
  if (age === 18) {
    choices[0].condition = condition({ education: 'high_school', career: 'none' });
    // 志愿录取不等于已经完成大学学业。
    choices[0].options[0].resultText = '你收到了理工类院校的录取通知书，即将开始四年的专业学习。';
  }
  if ([19, 20, 21].includes(age)) {
    events.forEach((_, i) => gate(i, university));
    events.push(event('你在大专院校参加专业实训，在课程与实习中积累职业技能。', { schooling: 'college' }, { knowledge: 3 }));
    events.push(event('你在工作中熟悉业务，靠自己的劳动支付日常开销。', employed, { wealth: 2, knowledge: 1 }));
  }
  if (age === 22) {
    gate(0, { education: 'bachelor' });
    choices[0].condition = condition({ education: 'bachelor', careerTrack: 'general' });
    events.push(event('你已经走上工作岗位，这一年继续积累经验，逐渐找到了自己的节奏。', { education: ['junior_high', 'vocational', 'college'] }, { wealth: 2 }));
    events.push(event('完成定向培养后，你按约回到家乡岗位，正式开始工作。', { career: 'public', careerTrack: 'directed_public' }, { sanity: 4 }));
  }
  if (age === 23) {
    gate(0, { career: ['private', 'public'] });
    events[0].text = '你在工作中逐渐熟悉业务，也学会了与同事沟通、整理汇报材料。';
    gate(1, { housing: 'renting' });
  }
  if (age === 24) { gate(0, employed); events[0].text = '工作后的例行体检里，第一次出现了脂肪肝、颈椎和尿酸指标的警报。'; }
  if (age === 25) gate(1, { education: ['college', 'bachelor'] });
  if (age === 26) {
    gate(0, { career: 'private' });
    choices[0].condition = condition({ career: 'private' });
  }
  if (age === 27) {
    choices[0].condition = condition({ housing: ['family', 'renting'] });
    choices[0].description = '亲友催促你考虑买房。买房需要支付首付并承担后续还款；继续租房则保留资金，每年支付房租。';
    const [buy, rent] = choices[0].options;
    Object.assign(buy, { minCash: 180000, cashEffect: -180000, financeEffect: { propertyValue: 900000, mortgageDebt: 720000, mortgageAnnualPayment: 24000, mortgageStartAge: 27 } });
    Object.assign(rent, { cashEffect: 0, resultText: '你决定继续租房，保留手头积蓄，按自己的节奏安排居住。' });
  }
  if (age === 28) {
    events.forEach(e => { e.text = '你开始认真思考亲密关系与成家计划，衡量彼此的期待和生活成本。'; e.effect = { sanity: -1 }; });
    choices.push({
      id: 'choice_age28_marriage', title: '成家还是保持独立？',
      description: '是否进入婚姻，由你结合感情与生活安排做出决定。买房与否不会替你决定婚姻。',
      options: [
        { text: '与伴侣登记结婚，共同经营小家庭', effect: { wealth: -8, sanity: 3 }, stateEffect: { marriage: 'married' }, tag: '携手成家', resultText: '你们决定携手，开始共同承担生活中的责任。' },
        { text: '暂不结婚，按自己的节奏生活', effect: { sanity: 4 }, stateEffect: { marriage: 'single' }, tag: '独立生活', resultText: '你把时间留给自己，继续经营工作、朋友与个人生活。' }
      ]
    });
  }
  if (age === 29) {
    gate(0, { marriage: 'married' });
    choices[0].condition = condition({ marriage: 'married', parenthood: ['none', 'deferred'] });
    choices[0].description = '是否迎接新生命，由你们共同决定。选择生育后才会开始计算照护支出；暂缓和丁克都将继续保持无子女生活。';
    choices[0].options[0].cashEffect = -15000;
    choices[0].options[1].cashEffect = 0;
    choices[0].title = '生育抉择：养育孩子、丁克还是暂缓？';
    choices[0].options[1].text = '选择丁克：专注两个人的生活，不生育孩子';
    choices[0].options.push({ text: '暂缓生育，等准备充分后再考虑', cashEffect: 0, effect: { wealth: 3, sanity: 2 }, stateEffect: { parenthood: 'deferred' }, tag: '暂缓生育', resultText: '你们暂时没有孩子，约定将来再讨论。' });
    events.push(event('你按自己的节奏安排生活，把精力投入工作与兴趣，也与朋友保持来往。', { marriage: 'single' }, { sanity: 3 }));
  }
  if (age === 30) { gate(0, employed); gate(1, { marriage: 'married', parenthood: 'parent' }); }
  if (age === 31) gate(0, { career: ['private', 'public'] });
  if (age === 32) {
    gate(0, parents);
    events[0].condition.minChildAge = 3;
    events[0].condition.maxChildAge = 6;
    events.push(event('你们把时间留给彼此，安排了一次共同期待的出游。', { marriage: 'married', parenthood: ['childfree', 'deferred'] }, { sanity: 3 }));
  }
  if (age === 33) {
    gate(0, mortgage);
    events[0].text = '每月房贷如期扣款，银行短信成了最准时的闹钟。你认真安排收支，不敢轻易中断收入。';
    events.push(event('续租时你重新比较租金与通勤距离，精打细算每月房租。', { housing: 'renting' }, { wealth: -1, sanity: 1 }));
  }
  if (age === 34) gate(0, { career: ['private', 'public'] });
  if (age === 35) {
    gate(0, { career: 'private' });
    choices[0].description = '三十五岁，你开始重新审视职业方向：继续原来的岗位，还是换一种谋生方式？';
    choices[0].condition = condition(employed);
    choices[0].options[0].condition = condition({ career: 'private' });
    choices[0].options[0].text = '留在原公司调整岗位：降低预期，争取稳定收入';
    choices[0].options[2].condition = condition({ career: 'public' });
    events.push(event('三十五岁，你已经在自己的岗位积累了经验，也开始更加重视工作与生活的平衡。', { career: ['worker', 'public', 'self_employed'] }, { knowledge: 2 }));
  }
  if ([36, 37, 38, 39].includes(age)) {
    gate(0, employed);
    gate(1, mortgage);
    events[1].text = '按时偿还住房按揭，日子在柴米油盐中一天天流淌。';
    events.push(event('你继续安排租房预算，在居住成本和生活便利之间寻找平衡。', { housing: 'renting' }, { sanity: 1 }));
  }
  if (age === 40) {
    gate(0, parents);
    events[0].text = '孩子渐渐长大，有了自己的主意。你学着在疲惫的工作之余，耐心听孩子说话。';
    choices[0].options[0].text = '拿出积蓄并向亲友借款，尽力选择更好的治疗方案';
  }
  if (age === 48) {
    gate(0, parents);
    events[0].text = '孩子开始独自面对升学与未来的选择，你在一旁支持，努力给他们更多自主的空间。';
  }
  if (age === 55) { gate(0, parents); events[0].text = '孩子已经成年，开始独立安排生活，你仍然牵挂着他们的工作与住处。'; }
  if (age === 57) events.push(event('住房贷款已经还清，少了一笔固定月供，你终于可以重新安排积蓄。', { housing: 'owned' }, { sanity: 5 }));
  if (age === 60) {
    events[0].text = '到了六十岁，你开始放慢工作的脚步，盘点储蓄与社保缴费，安排下一阶段的生活。';
    events[0].stateEffect = { career: 'retired' };
    choices[0].title = '晚年生活：照顾家人还是经营自己的兴趣？';
    choices[0].description = '生活进入新的阶段，你开始安排自己的时间，选择更适合自己的晚年节奏。';
    choices[0].options[0].condition = { ...condition(parents), minChildAge: 22 };
    events[0].required = true;
  }
  if (age > 60 && events[0].text.includes('含饴弄孙')) {
    gate(0, { hasGrandchildren: true });
    events.push(event(`${age}岁这一年，你与老友散步聊天，照料花草，享受属于自己的日常。`, { hasGrandchildren: false }, { sanity: 3, health: -3 }));
  }
  if (age === 70) { gate(1, { hasGrandchildren: true }); events[1].text = '儿孙们逢年过节齐聚一堂，满堂欢笑，新的合影又挂上了客厅的墙面。'; }
  if (age >= 23 && age < 60) {
    events.push(event('你继续为考试做准备，在复习之外也认真安排生活开销。', { career: 'preparing' }, { knowledge: 2, wealth: -1 }));
  }
  if (age === 75) {
    gate(0, { marriage: 'married' });
    events.push(event('腿脚有些不利索了，你拄着拐杖在社区公园散步，和熟悉的邻居聊聊天。', { marriage: 'single' }, { health: -8, sanity: 2 }));
  }
  // 沉浸叙事与账单分开：还款、房租、奶粉支出统一由财务模型按当前事实生成。
  for (const e of events) {
    if (/每月房贷|偿还住房按揭|比较租金与通勤|继续安排租房预算/.test(e.text)) e.cashEffect = 0;
  }
  const extras = age < 7 ? [
    '你学会了一项新的生活小技能，家人把这个小小进步记了下来。',
    '一次家庭出游让你见到了熟悉街道之外的风景，对世界又多了一分好奇。',
    '你和同龄伙伴一起玩耍，第一次学着表达自己的想法。'
  ] : age < 18 ? [
    '你在图书馆翻到一本喜欢的书，开始对一种新的职业产生好奇。',
    '一场社区运动活动让你结识了新朋友，也发现了自己擅长的事情。',
    '你试着安排一周的学习与休息，发现给自己留出时间也很重要。'
  ] : age < 60 ? [
    '你参加了一次社区技能分享，听到了与自己经历不同的人生路径。',
    '一次与旧友的长谈，让你重新思考工作、收入与生活中真正想要的东西。',
    '你整理了一年的生活计划，把一个总被搁置的个人目标重新写了下来。',
    '你为家里做了一次收纳和修整，普通的日子也因此变得更舒适。'
  ] : [
    '你和朋友约了一次散步，聊起近来的生活，也约好了下次再见。',
    '你尝试了一项新的兴趣，发现慢下来之后仍然可以有新的开始。',
    '你整理旧照片和通信记录，把一段值得记住的经历认真写了下来。'
  ];
  extras.forEach((text, index) => events.push({ id: `extra_${age}_${index}`, text, cashEffect: 0, effect: {} }));
  const milestones = {
    18: '成年这一年，你开始独立了解身份证件、银行卡和个人信息保护，第一次认真考虑自己的责任。',
    22: '你为未来三年写下一份计划：想靠什么生活、想住在哪里，以及愿意为什么投入时间。',
    30: '三十岁的节点，你重新盘点积蓄与承诺，决定给未来留出一份应急余地。',
    40: '四十岁，你开始重新安排生活的轻重缓急，把身体、陪伴和稳定的收支放回日程。',
    50: '五十岁，你整理了重要证件与保障资料，开始为未来十年的生活做准备。',
    65: '六十五岁，你认真梳理医疗与日常照护的安排，希望把往后的日子过得更踏实。',
    80: '八十岁，你写下一段人生回忆。那些当年艰难做出的决定，最终组成了属于你的生活。'
  };
  if (milestones[age]) events.push({ id: `milestone_${age}`, text: milestones[age], required: true, cashEffect: 0, effect: {} });
  return data;
}
