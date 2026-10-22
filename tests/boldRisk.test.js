import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNewLife, startLifeAction, resolveChoice, stepNextYear, canSelectOption, evaluateLifeSummary } from '../src/services/lifeEngine.js';
import { riskOptions } from '../src/services/boldRisk.js';
import { annualBudget, careerIncome } from '../src/services/finances.js';
import { advanceLifeState } from '../src/services/lifeState.js';

globalThis.fetch = async url => {
  const path = new URL(`../public${url.split('?')[0]}`, import.meta.url);
  return fs.existsSync(path) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(path, 'utf8')) } : { ok: false };
};
function life(age = 25, state = {}) {
  const c = createNewLife();
  return { ...c, age, knowledge: 70, health: 100, finances: { ...c.finances, cash: 1000000 }, lifeState: { ...c.lifeState, education: 'bachelor', schooling: 'none', career: 'private', ...state } };
}
function act(c, kind, index = 0) {
  c = startLifeAction(c, 'risk');
  return resolveChoice(c, c.pendingChoice.choice.options.filter(o => o.riskKind === kind)[index]);
}
async function next(c) {
  c = await stepNextYear(c);
  if (c.pendingChoice) c = resolveChoice(c, c.pendingChoice.choice.options.find(o => canSelectOption(o, c) && !o.followUp));
  return c;
}

test('四类机会按年龄学历就业状态开放，取消不扣钱也不记录尝试', () => {
  assert.equal(riskOptions(life(17)).length, 0);
  assert.ok(riskOptions(life(18, { education: 'high_school', schooling: 'college', career: 'none' })).some(o => o.riskKind === 'gaokao'));
  assert.ok(!riskOptions(life(22, { education: 'high_school' })).some(o => o.riskKind === 'gaokao'));
  assert.ok(!riskOptions(life(36)).some(o => o.riskKind === 'graduate'));
  assert.ok(!riskOptions(life(56)).some(o => o.riskKind === 'job'));
  assert.ok(!riskOptions(life(25, { schooling: 'graduate' })).some(o => o.riskKind === 'graduate' || o.riskKind === 'job'));
  let c = startLifeAction(life(), 'risk');
  const cash = c.finances.cash;
  c = resolveChoice(c, c.pendingChoice.choice.options.find(o => o.cancel));
  assert.equal(c.finances.cash, cash);
  assert.deepEqual(c.lifeState.riskAttempts, {});
  assert.equal(c.lastActionAge, null);
});

test('复读失败可以次年再试，成功后延迟四年毕业而非22岁自动毕业', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  let c = act(life(18, { education: 'high_school', schooling: 'university', career: 'none' }), 'gaokao');
  assert.equal(c.lifeState.schooling, 'gaokao_repeat');
  assert.equal(careerIncome(c), 0);
  assert.equal(c.lifeState.education, 'high_school');
  c = await next(c);
  assert.equal(c.lifeState.schooling, 'none');
  assert.equal(c.lifeState.riskAttempts.gaokao, 1);
  const firstChance = riskOptions(life(19, { education: 'high_school' })).find(o => o.riskKind === 'gaokao').followUp.outcomes[0].weight;
  assert.ok(riskOptions(c).find(o => o.riskKind === 'gaokao').followUp.outcomes[0].weight > firstChance);
  t.mock.method(Math, 'random', () => 0);
  c = act(c, 'gaokao');
  c = await next(c);
  assert.equal(c.age, 20);
  assert.equal(c.lifeState.schooling, 'university');
  assert.equal(c.lifeState.schoolEndAge, 24);
  while (c.age < 23) c = await next(c);
  assert.equal(c.lifeState.education, 'high_school');
  c = await next(c);
  assert.equal(c.lifeState.education, 'bachelor');
  assert.equal(c.lifeState.schooling, 'none');
  assert.equal(c.lifeState.riskAttempts.gaokao, 2);
  assert.equal(careerIncome(c), 120000);
});

test('复读中间结果读大专，三年后取得学历', async t => {
  t.mock.method(Math, 'random', () => 0.6);
  let c = act(life(18, { education: 'high_school', schooling: 'none', career: 'none' }), 'gaokao');
  c = await next(c);
  assert.equal(c.lifeState.schooling, 'college');
  assert.equal(c.lifeState.schoolEndAge, 22);
  assert.equal(advanceLifeState(c.lifeState, 21).education, 'high_school');
  assert.equal(advanceLifeState(c.lifeState, 22).education, 'college');
});

test('全职考研失败不会误入考编，可重复；录取后满三年取得硕士并提高收入', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  let c = act(life(29), 'graduate', 1);
  assert.equal(c.lifeState.career, 'graduate_preparing');
  assert.equal(careerIncome(c), 0);
  c = await next(c);
  assert.equal(c.lifeState.career, 'unemployed');
  assert.equal(c.lifeState.education, 'bachelor');
  t.mock.method(Math, 'random', () => 0);
  c = act(c, 'graduate');
  c = await next(c);
  assert.equal(c.lifeState.schooling, 'graduate');
  assert.equal(c.lifeState.education, 'bachelor');
  assert.equal(careerIncome(c), 0);
  while (c.age < 33) c = await next(c);
  assert.equal(c.lifeState.education, 'bachelor');
  c = await next(c);
  assert.equal(c.lifeState.education, 'master');
  assert.equal(careerIncome(c), 132000);
  assert.equal(evaluateLifeSummary(c).eduPercentile, 97);
  assert.match(c.history[0].text, /硕士毕业/);
});

test('在职考研失败保留薪资，换工作后旧考试结果不覆盖新职业', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  let c = act(life(29, { annualSalary: 150000 }), 'graduate');
  assert.equal(careerIncome(c), 150000);
  c = await next(c);
  assert.equal(careerIncome(c), 150000);
  assert.equal(c.lifeState.examPreparation, null);
  c = act(c, 'graduate');
  c.age++;
  c = startLifeAction(c, 'career');
  c = resolveChoice(c, c.pendingChoice.choice.options.find(o => o.stateEffect?.career === 'worker'));
  t.mock.method(Math, 'random', () => 0);
  c = await next(c);
  assert.equal(c.lifeState.career, 'worker');
  assert.equal(c.lifeState.schooling, 'none');
  assert.equal(c.lifeState.annualSalary, null);
});

test('跳槽成功工资持续进账，可再次跳槽；退休后不叠加原薪资', async t => {
  t.mock.method(Math, 'random', () => 0);
  let c = act(life(30), 'job');
  assert.equal(careerIncome(c), 129600);
  for (let i = 0; i < 2; i++) {
    c = await next(c);
    assert.equal(annualBudget(c).items[0].amount, 129600);
    assert.equal(c.history[0].events.find(e => e.ledger).ledger[0].amount, 129600);
  }
  c = act(c, 'job');
  assert.equal(careerIncome(c), 155520);
  assert.equal(c.lifeState.riskAttempts.job, 2);
  c.lifeState = advanceLifeState(c.lifeState, 60);
  assert.equal(careerIncome(c), 36000);
});

test('稳妥跳槽失败保留工作，裸辞失败停止工资，余额门槛由引擎校验', t => {
  t.mock.method(Math, 'random', () => 0.99);
  const safe = act(life(), 'job');
  assert.equal(careerIncome(safe), 108000);
  const bold = act(life(), 'job', 1);
  assert.equal(bold.lifeState.career, 'unemployed');
  assert.equal(careerIncome(bold), 0);
  const c = startLifeAction({ ...life(), finances: { ...life().finances, cash: 20 } }, 'risk');
  const option = c.pendingChoice.choice.options.find(o => o.riskKind === 'job');
  assert.equal(resolveChoice(c, option), c);
});

test('彩票四个分支精确入账，不能同年刷奖，重复次数不提高概率', t => {
  for (const [roll, gain] of [[0, 999980], [0.0005, 980], [0.05, -10], [0.99, -20]]) {
    t.mock.method(Math, 'random', () => roll);
    const initial = life();
    let c = act(initial, 'lottery');
    assert.equal(c.finances.cash - initial.finances.cash, gain);
    assert.equal(c.lifeState.riskAttempts.lottery, 1);
    assert.equal(startLifeAction(c, 'risk'), c);
    c = { ...c, age: c.age + 1 };
    const odds = riskOptions(c).find(o => o.riskKind === 'lottery').outcomes.map(o => o.weight);
    assert.deepEqual(odds, [0.000001, 0.000999, 0.099, 0.9]);
    c = act(c, 'lottery');
    assert.equal(c.lifeState.riskAttempts.lottery, 2);
  }
});

test('还债暂停顺延考试录取与毕业时间，已有研究生学业同步延期', async t => {
  t.mock.method(Math, 'random', () => 0);
  let c = act(life(30), 'graduate', 1);
  c.finances.recovering = true;
  c = await next(c);
  assert.equal(c.lifeState.career, 'graduate_preparing');
  assert.equal(c.scheduledEvents[0].dueAge, 32);
  c = await next(c);
  assert.equal(c.lifeState.schooling, 'graduate');
  assert.equal(c.lifeState.schoolEndAge, 35);
  c.finances.recovering = true;
  c = await next(c);
  assert.equal(c.lifeState.schoolEndAge, 36);
  assert.equal(advanceLifeState(c.lifeState, 35).education, 'bachelor');
  assert.equal(advanceLifeState(c.lifeState, 36).education, 'master');
});

test('年度毕业考研选项也进入真实考研，不能录取为公共岗位', async t => {
  t.mock.method(Math, 'random', () => 0);
  let c = life(21, { education: 'high_school', schooling: 'university', career: 'none' });
  c = await stepNextYear(c);
  c = resolveChoice(c, c.pendingChoice.choice.options.find(o => o.tag === '脱产考研战神'));
  assert.equal(c.lifeState.career, 'graduate_preparing');
  c = await next(c);
  assert.equal(c.lifeState.schooling, 'graduate');
  assert.equal(c.lifeState.career, 'none');
});
