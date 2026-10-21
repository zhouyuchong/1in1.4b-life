// 人物以姓名和状态留存，后续相聚、告别都引用同一个人。
const names = ['林晓', '陈宇', '周宁', '许安', '刘畅', '沈悦', '吴桐', '赵晨', '苏晴', '何远'];
export function newFriend(character) {
  const friends = character.lifeState.friends || [];
  const name = names.find(name => !friends.some(friend => friend.name === name));
  if (!name) return null;
  return { name, metAge: character.age, deathAge: Math.max(character.age + 10, 68 + Math.floor(Math.random() * 16)), alive: true };
}
export function socialChoice(character) {
  const friends = character.lifeState.friends || [];
  const friend = newFriend(character);
  return { title: '主动安排：把时间留给朋友', description: '新朋友带来新的故事，老朋友也值得好好陪伴。', options: [
    ...(friend ? [{ text: '参加免费社区活动，认识新朋友', cashEffect: 0, stateEffect: { friends: [...friends, friend] }, effect: { sanity: 4 }, resultText: `${character.age}岁，你在社区活动中结识了${friend.name}，约好以后常联系。` }] : []),
    ...friends.filter(friend => friend.alive).map(friend => ({ text: `约朋友${friend.name}一起散步聊天`, cashEffect: 0, effect: { sanity: 5 }, resultText: `${character.age}岁，你和朋友${friend.name}一起度过了很开心的一天，临别时约好了下次再见。` })),
    { text: '给久未联系的人发一条问候', cashEffect: 0, effect: { sanity: 2 }, resultText: '你给久未联系的人发去问候，聊起彼此最近的生活。' }
  ] };
}
export function romanceChoice(character) {
  const dating = character.lifeState.relationship === 'dating';
  const partner = character.lifeState.partnerName || '程溪';
  return { id: `romance_${character.age}`, title: dating ? '感情中的下一步' : '相识的契机', condition: { minAge: 18, lifeState: { marriage: 'single' } }, description: dating ? `你和${partner}已经相处了一段时间，开始聊起各自的期待。` : '你在共同的活动中遇见了聊得来的人。是否开始一段关系，由你决定。', options: dating ? [
    { text: '认真沟通，继续了解彼此', cashEffect: 0, effect: { sanity: 4 }, resultText: `你和${partner}聊了很久，一起面对分歧，也分享了许多开心的小事。` },
    { text: '发现期待不同，好好告别', cashEffect: 0, stateEffect: { relationship: 'single', partnerName: null }, effect: { sanity: -2 }, resultText: `你和${partner}平静地结束了恋爱，带着对彼此的祝福回到自己的生活。` },
    ...(character.age >= 22 ? [{ text: '商量好未来，登记结婚', cashEffect: -2000, minCash: 2000, stateEffect: { marriage: 'married' }, effect: { sanity: 5 }, tag: '携手成家', resultText: `经过恋爱中的相处与磨合，你和${partner}决定结婚，花2000元简单庆祝。` }] : [])
  ] : [
    { text: '从约会开始，认真了解对方', cashEffect: 0, stateEffect: { relationship: 'dating', partnerName: partner }, effect: { sanity: 5 }, resultText: `你和${partner}从一起散步、聊天开始，慢慢确认心意，开始了恋爱。` },
    { text: '先做朋友，保持自己的生活节奏', cashEffect: 0, effect: { sanity: 2 }, resultText: '你没有急着进入恋爱，决定先做朋友，好好了解彼此。' }
  ] };
}
export function relationshipEvents(character) {
  const { age, lifeState: s } = character;
  const events = [];
  for (const [key, label, deadline] of [['fatherAlive', '父亲', s.fatherFarewellAge ?? 56], ['motherAlive', '母亲', s.motherFarewellAge ?? 61]]) {
    if (s[key] !== false && age >= deadline) events.push({ id: `farewell_${key}`, required: true, cashEffect: 0, stateEffect: { [key]: false }, effect: { sanity: -8 }, text: `${age}岁，${label}因年老与疾病离世。你与家人料理后事，翻看旧照片，慢慢学着与思念相处。` });
  }
  const friends = s.friends || [];
  const dying = friends.filter(friend => friend.alive && age >= friend.deathAge);
  for (const friend of dying) events.push({ id: `farewell_${friend.name}`, required: true, cashEffect: 0, stateEffect: { friends: friends.map(item => dying.includes(item) ? { ...item, alive: false } : item) }, effect: { sanity: -5 }, text: `${age}岁，你得知朋友${friend.name}去世的消息。你想起${friend.metAge}岁初识的那天，把共同的回忆认真写下。` });
  if ([7, 12, 19, 32, 51].includes(age)) {
    const friend = newFriend(character);
    if (friend) events.push({ id: `friend_met_${age}`, required: true, cashEffect: 0, stateEffect: { friends: [...friends.filter(item => !dying.includes(item)), ...dying.map(item => ({ ...item, alive: false })), friend] }, effect: { sanity: 3 }, text: `${age}岁，你${age < 18 ? '在校园活动中' : '在一次兴趣活动中'}结识了${friend.name}，从共同话题聊起，渐渐成为朋友。` });
  }
  const available = friends.filter(friend => friend.alive && age < friend.deathAge);
  if (available.length) {
    const friend = available[age % available.length];
    const memories = ['一起散步聊天，分享了最近的小确幸', '一起做饭，聊起当年相识时的趣事', '相约看了一场日落，互相打气', '通了很久的电话，听对方讲生活中的新变化'];
    events.push({ id: `friend_time_${age}`, cashEffect: 0, effect: { sanity: 3 }, text: `${age}岁，你和朋友${friend.name}${memories[age % memories.length]}，一起度过了很开心的时光。` });
  }
  if (s.relationship === 'dating' && s.marriage === 'single') events.push({ id: `dating_${age}`, cashEffect: 0, effect: { sanity: 3 }, text: `${age}岁，你和${s.partnerName}在日常相处中继续了解彼此，一起安排约会，也学着沟通分歧。` });
  return events;
}
