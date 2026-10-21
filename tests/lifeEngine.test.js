import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNewLife, stepNextYear, resolveChoice, checkCondition, canSelectOption, evaluateLifeSummary, startLifeAction } from '../src/services/lifeEngine.js';
import { annualBudget } from '../src/services/finances.js';
import { getLifeActions } from '../src/services/lifeActions.js';
import { advanceLifeState } from '../src/services/lifeState.js';

// 使用实际年度文件，覆盖内容与引擎之间的契约。
globalThis.fetch = async url => {
  const file = new URL(`../public${url.split('?')[0]}`, import.meta.url);
  return fs.existsSync(file) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) } : { ok: false };
};
const data = (age, kind) => JSON.parse(fs.readFileSync(new URL(`../public/data/ages/age_${age}/${kind}.json`, import.meta.url)));
const life = () => ({ ...createNewLife(), knowledge: 90, wealth: 90, health: 100, finances: { cash: 1000000, propertyValue: 0, mortgageDebt: 0, mortgageAnnualPayment: 0 } });
async function until(character, age, tags = []) {
  while (character.age < age && !character.isGameOver) {
    character = await stepNextYear(character);
    if (character.pendingChoice) {
      const options = character.pendingChoice.choice.options.filter(o => canSelectOption(o, character));
      const option = tags.map(tag => options.find(o => o.tag === tag)).find(Boolean) || options[0];
      assert.ok(option, `no option at age ${character.age}`);
      character = resolveChoice(character, option);
    }
  }
  return character;
}

test('丁克与租房贯穿成年至晚年，且过滤同年事件', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = await until(life(), 29, ['不买房信徒', '丁克先锋']);
  assert.equal(character.lifeState.marriage, 'married');
  assert.equal(character.lifeState.parenthood, 'childfree');
  assert.equal(character.lifeState.housing, 'renting');
  character = await until(character, 80);
  const adultHistory = character.history.filter(h => h.age >= 30).map(h => h.text).join('\n');
  assert.doesNotMatch(adultHistory, /孩子|幼子|儿孙|孙辈|含饴弄孙|每月房贷|偿还住房按揭|按揭贷款/);
  assert.equal(character.lifeState.hasGrandchildren, false);
  assert.equal(character.finances.mortgageDebt, 0);
});

test('养育孩子、按揭、贷款还清和隔代照料承接选择', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = await until(life(), 33, ['三十年房奴', '晋升父母']);
  assert.equal(character.lifeState.parenthood, 'parent');
  assert.equal(character.lifeState.housing, 'mortgaged');
  assert.match(character.history.find(h => h.age === 32).text, /孩子/);
  assert.ok(character.history[0].events.some(event => event.ledger?.some(row => /住房还款/.test(row.label))));
  character = await until(character, 57);
  assert.equal(character.lifeState.housing, 'owned');
  assert.equal(character.lifeState.mortgageEndAge, null);
  character = await until(character, 60, ['中国式隔代奉献']);
  assert.equal(character.lifeState.hasGrandchildren, true);
  assert.equal(character.lifeState.career, 'retired');
});

test('保持单身不会被安排婚礼、生育选择、孩子或老伴', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = await until(life(), 28, ['独立生活']);
  assert.equal(character.lifeState.marriage, 'single');
  assert.doesNotMatch(character.history[0].text, /举办了婚礼|两个人开始/);
  character = await until(character, 80);
  const history = character.history.filter(h => h.age >= 29).map(h => h.text).join('\n');
  assert.doesNotMatch(history, /你们夫妇|生育抉择|孩子|幼子|老伴|孙辈|儿孙|含饴弄孙/);
});

test('暂缓生育保持无子女，不会自行转为父母', async t => {
  t.mock.method(Math, 'random', () => 0);
  const character = await until(life(), 60, ['暂缓生育']);
  assert.equal(character.lifeState.parenthood, 'deferred');
  assert.equal(character.lifeState.hasGrandchildren, false);
  assert.doesNotMatch(character.history.filter(h => h.age >= 30).map(h => h.text).join('\n'), /孩子|幼子|孙辈/);
});

test('职校与少年务工路线不会自动参加普高选科或进入大学', async t => {
  t.mock.method(Math, 'random', () => 0);
  for (const tag of ['职校技术生', '少年务工']) {
    const character = await until(life(), 25, [tag]);
    assert.equal(character.lifeState.career, 'worker');
    assert.equal(character.lifeState.education, tag === '职校技术生' ? 'vocational' : 'junior_high');
    const history = character.history.filter(h => h.age >= 16).map(h => h.text).join('\n');
    assert.doesNotMatch(history, /高考考场|高二|大学校门|学士服|大学室友|大三|志愿大博弈/);
  }
});

test('学历只在完成学习后更新，大专与本科按各自学制毕业', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = await until(life(), 18, ['专科逆袭派']);
  assert.equal(character.lifeState.education, 'high_school');
  assert.equal(character.lifeState.schooling, 'college');
  assert.equal(evaluateLifeSummary(character).eduPercentile, 40);
  character = await until(character, 22);
  assert.equal(character.lifeState.education, 'college');
  assert.doesNotMatch(character.history[0].text, /学士服/);
  const bachelor = await until(life(), 22);
  assert.equal(bachelor.lifeState.education, 'bachelor');
});

test('体制内路线不遭遇民企裁员，非体制内不能凭认知分晋升副科', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = await until(life(), 35, ['考编上岸族', '体制稳固']);
  assert.equal(character.lifeState.career, 'public');
  assert.doesNotMatch(character.history.find(h => h.age === 26).text, /裁员|行业大洗牌|职场大洗牌/);
  const publicOption = data(35, 'choices')[0].options.find(o => o.tag === '体制稳固');
  assert.equal(canSelectOption(publicOption, { ...life(), lifeState: { ...life().lifeState, career: 'private' } }), false);
  character = await until(life(), 26, ['归隐考编']);
  assert.equal(character.lifeState.career, 'preparing');
  const at35 = await until(character, 35);
  assert.notEqual(at35.lifeState.career, 'public');
});

test('引擎拒绝不属于当前抉择、事实不符或数值门槛不符的选项', async () => {
  let character = life();
  character.age = 34;
  character.lifeState.career = 'private';
  character = await stepNextYear(character);
  const publicOption = character.pendingChoice.choice.options.find(o => o.tag === '体制稳固');
  assert.equal(resolveChoice(character, publicOption), character);
  assert.equal(resolveChoice(character, { effect: { wealth: 100 } }), character);
  const option = character.pendingChoice.choice.options[0];
  const poor = { ...character, wealth: 0, finances: { ...character.finances, cash: 0 }, pendingChoice: { ...character.pendingChoice, choice: { options: [{ ...option, requirements: { wealth: 20 } }] } } };
  assert.equal(resolveChoice(poor, poor.pendingChoice.choice.options[0]), poor);
});

test('当年选择改变事实后，重新筛选配套事件及其数值效果', () => {
  const option = { text: '不生育', stateEffect: { parenthood: 'childfree' } };
  const character = life();
  character.pendingChoice = { choice: { options: [option] }, annualEvents: [
    { text: '孩子入园', condition: { lifeState: { parenthood: 'parent' } }, effect: { wealth: -50 } },
    { text: '安排自己的生活', condition: { lifeState: { parenthood: 'childfree' } }, effect: { sanity: 2 } }
  ] };
  const result = resolveChoice(character, option);
  assert.equal(result.wealth, character.wealth);
  assert.match(result.history[0].text, /安排自己的生活/);
  assert.doesNotMatch(result.history[0].text, /孩子入园/);
});

test('事件条件支持严格布尔与枚举，贷款到期只影响按揭住房', () => {
  const character = life();
  assert.equal(checkCondition({ lifeState: { hasGrandchildren: false } }, character), true);
  assert.equal(checkCondition({ lifeState: { housing: ['renting', 'owned'] } }, character), false);
  assert.equal(advanceLifeState({ ...character.lifeState, housing: 'renting', mortgageEndAge: null }, 57).housing, 'renting');
  assert.equal(advanceLifeState({ ...character.lifeState, housing: 'mortgaged', mortgageEndAge: 57 }, 56).housing, 'mortgaged');
});

test('200 条随机人生均可结束，且不出现无子女家庭或无贷款住房的专属事件', async t => {
  let seed = 20261021;
  t.mock.method(Math, 'random', () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  });
  for (let n = 0; n < 200; n++) {
    let character = createNewLife();
    for (let step = 0; step < 90 && !character.isGameOver; step++) {
      character = await stepNextYear(character);
      if (character.pendingChoice) {
        const options = character.pendingChoice.choice.options.filter(o => canSelectOption(o, character));
        assert.ok(options.length);
        character = resolveChoice(character, options[Math.floor(Math.random() * options.length)]);
      }
      const item = character.history[0];
      if (item.age >= 30 && character.lifeState.parenthood !== 'parent') {
        assert.doesNotMatch(item.text, /孩子|幼子|孙辈|儿孙|含饴弄孙/);
      }
      if (item.age >= 30 && character.lifeState.housing !== 'mortgaged') {
        assert.doesNotMatch(item.text, /每月房贷|偿还住房按揭|按揭贷款/);
      }
      for (const key of ['wealth', 'health', 'knowledge', 'sanity']) {
        assert.ok(Number.isFinite(character[key]) && character[key] >= 0 && character[key] <= 100);
      }
    }
    assert.equal(character.isGameOver, true);
    assert.ok(evaluateLifeSummary(character).title);
  }
});

test('暂缓生育、不买房的所有成年年份都没有奶粉和房贷账单', async t => {
  t.mock.method(Math, 'random', () => 0.4);
  const character = await until(life(), 80, ['不买房信徒', '暂缓生育']);
  const receipts = character.history.filter(year => year.age >= 29).flatMap(year => year.events || []);
  assert.equal(character.lifeState.parenthood, 'deferred');
  for (const receipt of receipts) {
    assert.doesNotMatch(receipt.text, /奶粉费|支付奶粉|偿还住房按揭|每月房贷/);
    for (const row of receipt.ledger || []) assert.doesNotMatch(row.label, /奶粉|子女|住房还款/);
  }
});

test('每年呈现2到3条不重复叙事，支出明细可逐项核对', async t => {
  t.mock.method(Math, 'random', () => 0.8);
  let character = life();
  character = await until(character, 14);
  for (const year of character.history.filter(year => year.age > 0)) {
    const narratives = year.events.filter(event => !event.ledger);
    assert.ok(narratives.length >= 2 && narratives.length <= (year.isChoice ? 4 : 3));
    assert.equal(new Set(narratives.map(event => event.text)).size, narratives.length);
    assert.equal(year.cashChange, year.events.reduce((sum, event) => sum + event.cashChange, 0));
    for (const entry of year.events.filter(event => event.ledger)) assert.equal(entry.cashChange, entry.ledger.reduce((sum, row) => sum + row.amount, 0));
  }
  const years = [...character.history].reverse();
  let balance = 1000000;
  for (const year of years.slice(1)) { balance += year.cashChange; assert.equal(year.cashAfter, balance); }
  assert.equal(character.finances.cash, balance);
});

test('取消求变不会消费机会、扣款或再结算年度账单', () => {
  let character = life(); character.age = 30;
  const before = character;
  character = startLifeAction(character, 'health');
  assert.equal(character.pendingChoice.mode, 'action');
  const result = resolveChoice(character, character.pendingChoice.choice.options.find(option => option.cancel));
  assert.equal(result.finances.cash, before.finances.cash);
  assert.equal(result.history, before.history);
  assert.equal(result.lastActionAge, null);
  assert.ok(getLifeActions(result).length);
});

test('进修只扣一次学费，一年只能行动一次，次年触发后续事件', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = life(); character.age = 30;
  const cash = character.finances.cash;
  character = startLifeAction(character, 'study');
  character = resolveChoice(character, character.pendingChoice.choice.options[0]);
  assert.equal(character.finances.cash, cash - 6000);
  assert.equal(character.history[0].events.length, 1);
  assert.equal(character.lastActionAge, 30);
  assert.equal(startLifeAction(character, 'study'), character);
  assert.equal(character.scheduledEvents.length, 1);
  character = await stepNextYear(character);
  assert.match(character.history[0].text, /作品集/);
  assert.equal(character.scheduledEvents.length, 0);
  assert.ok(getLifeActions(character).length);
});

test('主动买房后可卖房结贷，之后只生成租金账单', () => {
  let character = life(); character.age = 30;
  character.lifeState.housing = 'renting';
  character = startLifeAction(character, 'housing');
  character = resolveChoice(character, character.pendingChoice.choice.options[1]);
  assert.equal(character.finances.cash, 820000);
  assert.equal(character.finances.mortgageDebt, 720000);
  assert.equal(character.lifeState.mortgageEndAge, 60);
  const loan = annualBudget({ ...character, age: 31 });
  assert.equal(loan.mortgagePayment, 24000);
  character = { ...character, age: 31 };
  character = startLifeAction(character, 'housing');
  character = resolveChoice(character, character.pendingChoice.choice.options[0]);
  assert.equal(character.finances.cash, 990000);
  assert.equal(character.finances.mortgageDebt, 0);
  assert.equal(character.finances.propertyValue, 0);
  assert.equal(character.lifeState.housing, 'renting');
  assert.equal(annualBudget(character).mortgagePayment, 0);
  assert.ok(annualBudget(character).items.some(row => row.label === '全年房租'));
});

test('奶粉费按实际生育时间计算，暂缓生育不会被动开始扣费', () => {
  let character = life(); character.age = 40;
  character.lifeState = { ...character.lifeState, marriage: 'married', parenthood: 'deferred' };
  assert.ok(!annualBudget(character).items.some(row => /奶粉|子女/.test(row.label)));
  character = startLifeAction(character, 'family');
  character = resolveChoice(character, character.pendingChoice.choice.options[0]);
  assert.equal(character.lifeState.childBirthAge, 40);
  assert.ok(annualBudget(character).items.some(row => /奶粉/.test(row.label)));
  assert.ok(annualBudget({ ...character, age: 43 }).items.some(row => /子女/.test(row.label)));
  assert.ok(!annualBudget({ ...character, age: 58 }).items.some(row => /奶粉|子女/.test(row.label)));
});

test('缺钱时仍可取消或免费锻炼，有成本的操作由引擎拒绝', () => {
  let character = life(); character.age = 30; character.finances.cash = -1000;
  character = startLifeAction(character, 'health');
  const [paid, free, cancel] = character.pendingChoice.choice.options;
  assert.equal(canSelectOption(paid, character), false);
  assert.equal(canSelectOption(free, character), true);
  assert.equal(canSelectOption(cancel, character), true);
  assert.equal(resolveChoice(character, paid), character);
  assert.equal(resolveChoice(character, free).finances.cash, -1000);
});

test('考编有真实的成功与落选结果，不会在付费时立刻获得编制', async t => {
  for (const random of [0, 0.99]) {
    const mock = t.mock.method(Math, 'random', () => random);
    let character = life(); character.age = 30; character.lifeState.career = 'private'; character.lifeState.schooling = 'none';
    character = startLifeAction(character, 'career');
    character = resolveChoice(character, character.pendingChoice.choice.options[1]);
    assert.equal(character.lifeState.career, 'preparing');
    character = await stepNextYear(character);
    assert.equal(character.lifeState.career, random === 0 ? 'public' : 'preparing');
    assert.match(character.history[0].text, random === 0 ? /通过了招录/ : /没有入围/);
    mock.mock.restore();
  }
});

test('30年还款后本金结清，金额余额不会被限制到0至100', async t => {
  t.mock.method(Math, 'random', () => 0);
  let character = life();
  character.finances.cash = 5000000;
  character = await until(character, 27, ['三十年房奴']);
  assert.equal(character.finances.mortgageDebt, 720000);
  for (let age = 28; age <= 57; age++) {
    character.health = 100;
    character = await until(character, age, ['独立生活']);
  }
  assert.equal(character.finances.mortgageDebt, 0);
  assert.equal(character.lifeState.housing, 'owned');
  assert.ok(character.finances.cash > 100);
});

test('100条包含主动求变的人生可完成，逐笔资金与期末余额相符', async t => {
  let seed = 10923;
  t.mock.method(Math, 'random', () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; });
  for (let n = 0; n < 100; n++) {
    let character = createNewLife();
    for (let step = 0; step < 90 && !character.isGameOver; step++) {
      character = await stepNextYear(character);
      if (character.pendingChoice) {
        const options = character.pendingChoice.choice.options.filter(option => canSelectOption(option, character));
        character = resolveChoice(character, options[Math.floor(Math.random() * options.length)]);
      }
      const actions = getLifeActions(character);
      if (actions.length && Math.random() < 0.7) {
        character = startLifeAction(character, actions[Math.floor(Math.random() * actions.length)].id);
        const options = character.pendingChoice.choice.options.filter(option => canSelectOption(option, character));
        character = resolveChoice(character, options[Math.floor(Math.random() * options.length)]);
      }
      assert.ok(Number.isFinite(character.finances.cash));
      assert.ok(character.finances.mortgageDebt >= 0);
      const rows = character.history[0].events;
      if (rows) {
        assert.equal(character.history[0].cashChange, rows.reduce((sum, row) => sum + row.cashChange, 0));
        assert.equal(rows.at(-1).cashAfter, character.history[0].cashAfter);
      }
      if (character.lifeState.parenthood !== 'parent') assert.ok(!annualBudget(character).items.some(row => /奶粉|子女/.test(row.label)));
      if (character.lifeState.housing === 'renting') assert.equal(annualBudget(character).mortgagePayment, 0);
    }
    assert.equal(character.isGameOver, true);
  }
});
