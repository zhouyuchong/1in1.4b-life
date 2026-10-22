import test from 'node:test';
import assert from 'node:assert/strict';
import { educationContext } from '../src/services/educationContext.js';
import { createNewLife } from '../src/services/lifeEngine.js';
import { CITIES_DATA } from '../src/data/cities.js';

const heze = CITIES_DATA.find(city => city.province === '山东省' && city.name === '菏泽市');

test('菏泽富裕家庭保留地区竞争差异，同时用家庭资源缓解个人压力', () => {
  assert.ok(heze);
  const wealthy = educationContext({ city: heze, familyClass: '高净值富裕' });
  const working = educationContext({ city: heze, familyClass: '工薪温饱' });
  assert.equal(wealthy.regionalCompetition, '非常激烈');
  assert.equal(working.regionalCompetition, wealthy.regionalCompetition);
  assert.equal(wealthy.familySupport, '充足');
  assert.equal(wealthy.pressure, '中等');
  assert.equal(working.pressure, '很高');
  assert.match(wealthy.description, /不保证录取名校/);
  assert.equal(heze.gaokaoDifficulty, '地狱模式');
});

test('同一地区的家庭背景有不同支持，资源有限的家庭压力更高', () => {
  const city = { gaokaoDifficulty: '中等难度' };
  const results = ['低保特困', '工薪温饱', '小康中产', '高净值富裕'].map(familyClass => educationContext({ city, familyClass }));
  assert.deepEqual(results.map(context => context.familySupport), ['有限', '基础', '较充足', '充足']);
  assert.deepEqual(results.map(context => context.pressure), ['偏高', '中等', '较轻', '较轻']);
});

test('家庭资源没有抹去地区差异，港澳不强行计算内地高考压力', () => {
  const character = { city: { gaokaoDifficulty: '优待相对较高' }, familyClass: '工薪温饱' };
  assert.equal(educationContext(character).pressure, '较轻');
  for (const city of CITIES_DATA) {
    const result = educationContext({ city, familyClass: '高净值富裕' });
    assert.ok(result.pressure);
    if (city.gaokaoDifficulty === '特区教育制度') assert.equal(result.pressure, '依升学路径而定');
  }
});

test('出生文案区分地区、家庭支持和个人压力，保留地区原始标签', t => {
  t.mock.method(Math, 'random', () => 0.9);
  const character = createNewLife();
  const context = educationContext(character);
  const text = character.history[0].text;
  assert.equal(character.familyClass, '高净值富裕');
  assert.ok(text.includes(`地区高考竞争：${context.regionalCompetition}`));
  assert.ok(text.includes(`家庭教育支持：${context.familySupport}`));
  assert.ok(text.includes(`个人升学压力预估：${context.pressure}`));
  assert.doesNotMatch(text, /高考竞争预估：|地狱模式/);
  assert.ok(character.tags.includes(`高考省份:${character.city.gaokaoDifficulty}`));
});
