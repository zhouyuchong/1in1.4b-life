import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNewLife, stepNextYear, resolveChoice, startLifeAction } from '../src/services/lifeEngine.js';
import { debtChoice, debtSettlement, familyCapacity, DEBT_RULES } from '../src/services/debt.js';
import { advanceLifeState } from '../src/services/lifeState.js';
import { getLifeActions } from '../src/services/lifeActions.js';

globalThis.fetch = async url => {
  const file = new URL(`../public${url.split('?')[0]}`, import.meta.url);
  return fs.existsSync(file) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) } : { ok: false };
};
const life = (cash = -10000) => {
  const c = createNewLife();
  return { ...c, age: 30, health: 100, familyClass: '工薪温饱', finances: { ...c.finances, cash },
    lifeState: { ...c.lifeState, career: 'private', schooling: 'none' } };
};
const select = (c, text) => resolveChoice(c, c.pendingChoice.choice.options.find(o => o.text.includes(text)));

test('资金缺口先阻断年份；网贷按真实欠款记账，不能反复续借', async () => {
  let c = await stepNextYear(life());
  assert.equal(c.age, 30);
  assert.equal(c.pendingChoice.mode, 'debt');
  c = select(c, '网贷');
  assert.equal(c.finances.cash, 0);
  assert.equal(c.finances.onlineDebt, 10000);
  assert.equal(c.finances.onlineDueAge, 31);
  assert.equal(c.pendingChoice, null);
  assert.equal(c.history[0].cashChange, 10000);
  const choice = debtChoice({ ...c, finances: { ...c.finances, cash: -500 } });
  assert.ok(!choice.options.some(o => o.text.includes('网贷周转')));
  assert.equal(debtChoice({ ...life(), age: 17 }).options.some(o => o.text.includes('网贷周转')), false);
});

test('家庭借款有阶层差异、累计上限且不会在还钱后重置', async () => {
  assert.deepEqual(['低保特困', '工薪温饱', '小康中产', '高净值富裕'].map(familyClass => familyCapacity({ ...life(), familyClass })), [5000, 30000, 150000, 600000]);
  let c = await stepNextYear(life(-40000));
  c = select(c, '向家人借');
  assert.equal(c.finances.cash, -10000);
  assert.equal(c.finances.familyDebt, 30000);
  assert.equal(familyCapacity(c), 0);
  assert.equal(c.pendingChoice.mode, 'debt');
  assert.ok(!c.pendingChoice.choice.options.some(o => o.text.includes('向家人借')));
  assert.equal(familyCapacity({ ...c, finances: { ...c.finances, familyDebt: 0 } }), 0);
  assert.equal(familyCapacity({ ...life(), lifeState: { ...life().lifeState, fatherAlive: false, motherAlive: false } }), 0);
});

test('到期计息、优先还网贷再还家人，借款当年不计息', () => {
  let c = life(15000);
  c.finances = { ...c.finances, onlineDebt: 10000, onlineDueAge: 31, familyDebt: 8000 };
  assert.equal(debtSettlement(c).financeEffect.onlineDebt, 10000);
  c.age = 31;
  const entry = debtSettlement(c);
  assert.equal(entry.financeEffect.onlineDebt, 0);
  assert.equal(entry.financeEffect.familyDebt, 5000);
  assert.equal(entry.cashEffect, -15000);
  assert.equal(entry.ledger.reduce((sum, row) => sum + row.amount, 0), entry.cashEffect);
  assert.match(entry.text, /新增利息.*2,000/);
});

test('长期逾期即使余额非负也强制打工并关闭借款资格', async () => {
  let c = life(0);
  c.age = 32;
  c.finances = { ...c.finances, onlineDebt: 12000, onlineDueAge: 31 };
  const entry = debtSettlement(c);
  assert.equal(entry.financeEffect.onlineDebt, 14400);
  assert.equal(entry.financeEffect.creditBlocked, true);
  assert.equal(entry.effect.sanity, -15);
  c = await stepNextYear(c);
  assert.equal(c.pendingChoice.choice.options.length, 1);
  assert.match(c.pendingChoice.choice.options[0].text, /被迫进厂/);
  c = select(c, '被迫进厂');
  assert.equal(c.finances.forcedRecovery, true);
  assert.equal(c.finances.creditBlocked, true);
});

test('净负债达到上限强制还债，房贷单独计算，不能靠借新债绕过', async () => {
  let c = life(-DEBT_RULES.limit);
  c = await stepNextYear(c);
  assert.equal(c.pendingChoice.choice.options.length, 1);
  c = select(c, '被迫进厂');
  assert.equal(c.finances.cash, -DEBT_RULES.limit);
  assert.equal(c.finances.recovering, true);
  c = await stepNextYear(c);
  assert.equal(c.finances.cash, -22000);
  assert.equal(c.finances.recovering, true);
  c = await stepNextYear(c);
  assert.equal(c.finances.cash, 56000);
  assert.equal(c.finances.recovering, false);
  assert.ok(getLifeActions(c).length);
  assert.equal(debtChoice({ ...life(0), finances: { ...life(0).finances, cash: 0, mortgageDebt: 720000 } }), null);
});

test('兼职暂停原工资、主动行动与后续事件，结束后恢复待办', async t => {
  t.mock.method(Math, 'random', () => 0);
  let c = await stepNextYear(life());
  c.scheduledEvents = [{ text: '暂停后继续的项目', dueAge: 31, cashEffect: 0, effect: { knowledge: 1 } }];
  c = select(c, '暂停原计划');
  assert.deepEqual(getLifeActions(c), []);
  assert.equal(startLifeAction(c, 'study'), c);
  c = await stepNextYear(c);
  assert.equal(c.age, 31);
  assert.equal(c.finances.cash, 68000);
  assert.equal(c.finances.recovering, false);
  assert.equal(c.scheduledEvents[0].dueAge, 32);
  assert.doesNotMatch(c.history[0].text, /暂停后继续的项目/);
  assert.equal(c.history[0].events[0].ledger[0].amount, DEBT_RULES.workIncome);
  c = await stepNextYear(c);
  assert.match(c.history[0].text, /暂停后继续的项目/);
});

test('学业暂停推迟毕业；兼职期间照付房贷，亲人不会停止衰老', async () => {
  let c = life(); c.age = 21;
  c.lifeState = { ...c.lifeState, schooling: 'university', career: 'none', education: 'high_school', fatherFarewellAge: 22, housing: 'mortgaged', mortgageEndAge: 22 };
  c.finances = { ...c.finances, mortgageDebt: 24000, mortgageAnnualPayment: 24000, mortgageStartAge: 20 };
  c = await stepNextYear(c);
  c = select(c, '暂停原计划');
  c = await stepNextYear(c);
  assert.equal(c.lifeState.schooling, 'university');
  assert.equal(c.lifeState.education, 'high_school');
  assert.equal(c.lifeState.schoolingDelay, 1);
  assert.equal(c.lifeState.fatherAlive, false);
  assert.equal(c.finances.mortgageDebt, 0);
  assert.equal(c.lifeState.housing, 'owned');
  c = await stepNextYear(c);
  assert.equal(c.lifeState.education, 'bachelor');
  assert.equal(c.lifeState.schooling, 'none');
  assert.equal(advanceLifeState({ ...c.lifeState, career: 'private' }, 60).career, 'retired');
});

test('家庭资金危机不会给未成年人放贷或安排工厂劳动', async () => {
  let c = life(-2000); c.age = 10;
  c = await stepNextYear(c);
  assert.equal(c.pendingChoice.choice.options.some(o => /网贷周转|进厂/.test(o.text)), false);
  c = select(c, '由家人');
  c = await stepNextYear(c);
  assert.equal(c.history[0].events[0].ledger[0].label, '家人紧急增收');
  assert.equal(c.history[0].cashChange, 42000);
});
