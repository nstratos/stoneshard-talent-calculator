import test from 'node:test';
import assert from 'node:assert/strict';

import Character from './character.js';
import { STATS } from './stats.js';

test('resetComputedStats restores effective stats to their base values', () => {
  const character = new Character();

  character.applyStatIncrease(STATS.STR);
  character.applyStatIncrease(STATS.WIL);

  assert.equal(character.getEffectiveStat(STATS.STR), 11);
  assert.equal(character.getEffectiveStat(STATS.WIL), 11);

  character.resetComputedStats();

  assert.equal(character.getBaseStat(STATS.STR), 10);
  assert.equal(character.getBaseStat(STATS.WIL), 10);
  assert.equal(character.getEffectiveStat(STATS.STR), 10);
  assert.equal(character.getEffectiveStat(STATS.WIL), 10);
});

test('applyStatIncrease changes only the effective value of the targeted stat', () => {
  const character = new Character();

  character.applyStatIncrease(STATS.AGI);
  character.applyStatIncrease(STATS.AGI);
  character.applyStatIncrease(STATS.PER);

  assert.equal(character.getBaseStat(STATS.AGI), 10);
  assert.equal(character.getBaseStat(STATS.PER), 10);
  assert.equal(character.getEffectiveStat(STATS.AGI), 12);
  assert.equal(character.getEffectiveStat(STATS.PER), 11);
  assert.equal(character.getEffectiveStat(STATS.STR), 10);
});
