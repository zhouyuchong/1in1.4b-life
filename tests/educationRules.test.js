import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNewLife, stepNextYear, resolveChoice, canSelectOption, startLifeAction, loadAgeData } from '../src/services/lifeEngine.js';
import { riskOptions } from '../src/services/boldRisk.js';
import { CITIES_DATA } from '../src/data/cities.js';

const city = CITIES_DATA.find(city => city.province === '山东省' && city.name === '菏泽市');
globalThis.fetch = async url => {
  const file = new URL(`../public${url.split('?')[0]}`, import.meta.url);
  return fs.existsSync(file) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) } : { ok: false };
};
function life(familyClass = '工薪温饱', age = 17, state = {}) {
  const c = createNewLife();
  return { ...c, age, city, familyClass, knowledge: 60, sanity: 100, health: 100,
    finances: { ...c.finances, cash: 1000000 },
    lifeState: { ...c.lifeState, education: 'junior_high', schooling: 'high_school', career: 'none', ...state } };
}
const optionWithTag = (c, tag) => c.pendingChoice.choice.options.find(option => option.tag === tag);

test('同等认知与同一次考试抽签，家庭资源可以实际改变首次高考录取结果', async t => {
  t.mock.method(Math, 'random', () => 0.7);
  const poor = await stepNextYear(life('低保特困'));
  const rich = await stepNextYear(life('高净值富裕'));
  const poorOption = optionWithTag(poor, '实用主义工科生');
  const richOption = optionWithTag(rich, '实用主义工科生');
  assert.ok(canSelectOption(poorOption, poor));
  assert.ok(canSelectOption(richOption, rich));
  assert.equal(resolveChoice(poor, poorOption).lifeState.schooling, 'college');
  const admitted = resolveChoice(rich, richOption);
  assert.equal(admitted.lifeState.schooling, 'university');
  assert.equal(admitted.lifeState.education, 'high_school');
});

test('家庭资源影响名校门槛；高资源同样有落榜风险，低资源仍能成功', async t => {
  t.mock.method(Math, 'random', () => 0.99);
  const poor = await stepNextYear(life('低保特困'));
  const rich = await stepNextYear(life('高净值富裕'));
  assert.equal(canSelectOption(optionWithTag(poor, '天坑名校生'), poor), false);
  assert.equal(canSelectOption(optionWithTag(rich, '天坑名校生'), rich), true);
  assert.equal(resolveChoice(rich, optionWithTag(rich, '天坑名校生')).lifeState.schooling, 'college');
  t.mock.method(Math, 'random', () => 0);
  const admitted = resolveChoice(poor, optionWithTag(poor, '实用主义工科生'));
  assert.equal(admitted.lifeState.schooling, 'university');
  assert.ok(admitted.tags.includes('实用主义工科生'));
});

test('地区竞争影响首次高考和复读，但不用于全国考研；年度数据缓存未被改写', async () => {
  const hard = await stepNextYear(life());
  const easyLife = life(); easyLife.city = { ...city, gaokaoDifficulty: '优待相对较高' };
  const easy = await stepNextYear(easyLife);
  assert.ok(optionWithTag(easy, '实用主义工科生').outcomes[0].weight > optionWithTag(hard, '实用主义工科生').outcomes[0].weight);
  const source = await loadAgeData(18);
  const original = source.choices.find(choice => choice.id === 'choice_age18_gaokao_major');
  assert.equal(original.options[0].requirements.knowledge, 50);
  assert.equal(original.options[0].outcomes, undefined);
  const graduate = c => riskOptions({ ...c, age: 25, lifeState: { ...c.lifeState, education: 'bachelor', schooling: 'none', career: 'private' } }).find(o => o.riskKind === 'graduate');
  assert.equal(graduate(easy).followUp.outcomes[0].weight, graduate(hard).followUp.outcomes[0].weight);
});

test('复读与考研实际抽取结果均受到家庭资源影响', async t => {
  t.mock.method(Math, 'random', () => 0.4);
  for (const kind of ['gaokao', 'graduate']) {
    const results = [];
    for (const familyClass of ['低保特困', '高净值富裕']) {
      let c = life(familyClass, kind === 'gaokao' ? 18 : 25, {
        education: kind === 'gaokao' ? 'high_school' : 'bachelor', schooling: 'none', career: kind === 'gaokao' ? 'none' : 'private'
      });
      c = startLifeAction(c, 'risk');
      const option = c.pendingChoice.choice.options.find(o => o.riskKind === kind && (kind === 'gaokao' || o.text.includes('全职')));
      c = resolveChoice(c, option);
      c = await stepNextYear(c);
      results.push(c.lifeState.schooling);
    }
    assert.deepEqual(results, kind === 'gaokao' ? ['college', 'university'] : ['none', 'graduate']);
  }
});

test('自费本科按背景、余额和学业门槛开放，不能绕过引擎校验', async () => {
  const rich = await stepNextYear(life('高净值富裕'));
  const option = rich.pendingChoice.choice.options.find(o => o.text.includes('自费中外合作'));
  assert.ok(option);
  assert.equal(canSelectOption(option, { ...rich, finances: { ...rich.finances, cash: 239999 } }), false);
  assert.equal(canSelectOption(option, { ...rich, knowledge: 34 }), false);
  const changedFamily = { ...rich, familyClass: '工薪温饱' };
  assert.equal(canSelectOption(option, changedFamily), false);
  assert.equal(resolveChoice(changedFamily, option), changedFamily);
  for (const familyClass of ['低保特困', '工薪温饱']) {
    const c = await stepNextYear(life(familyClass));
    assert.ok(!c.pendingChoice.choice.options.some(o => o.text.includes('自费中外合作')));
    assert.ok(c.pendingChoice.choice.options.some(o => o.stateEffect?.schooling === 'college' && canSelectOption(o, c)));
  }
});

test('自费本科录取实际扣24万元，四年学成才授予本科；失败只扣申请费', async t => {
  for (const random of [0, 0.99]) {
    t.mock.method(Math, 'random', () => random);
    let c = await stepNextYear(life('高净值富裕'));
    const option = c.pendingChoice.choice.options.find(o => o.text.includes('自费中外合作'));
    c = resolveChoice(c, option);
    assert.equal(c.history[0].events[0].cashChange, random === 0 ? -240000 : -10000);
    assert.equal(c.lifeState.education, 'high_school');
    assert.equal(c.lifeState.schooling, random === 0 ? 'university' : 'college');
    if (random === 0) {
      while (c.age < 22) {
        c = await stepNextYear(c);
        if (c.pendingChoice) c = resolveChoice(c, c.pendingChoice.choice.options.find(o => canSelectOption(o, c)));
        assert.equal(c.lifeState.education, c.age < 22 ? 'high_school' : 'bachelor');
      }
    }
  }
});

test('家庭考试修正不增加跳槽和彩票概率', () => {
  const options = familyClass => riskOptions(life(familyClass, 25, { education: 'bachelor', schooling: 'none', career: 'private' }));
  for (const kind of ['job', 'lottery']) {
    assert.deepEqual(options('低保特困').filter(o => o.riskKind === kind).map(o => o.outcomes.map(outcome => outcome.weight)), options('高净值富裕').filter(o => o.riskKind === kind).map(o => o.outcomes.map(outcome => outcome.weight)));
  }
});
