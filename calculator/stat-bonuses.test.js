import test from 'node:test';
import assert from 'node:assert/strict';

import Character from './character.js';
import { applyMainStatBonuses, countReachedMainStatThresholds } from './stat-bonuses.js';
import { STATS } from './stats.js';

function makeCharacterWithStat(stat, value) {
  const character = new Character();

  for (let i = 10; i < value; i++) {
    character.applyStatIncrease(stat);
  }

  applyMainStatBonuses(character);
  return character;
}

test('countReachedMainStatThresholds counts thresholds at 15, 20, 25, and 30', () => {
  assert.equal(countReachedMainStatThresholds(14), 0);
  assert.equal(countReachedMainStatThresholds(15), 1);
  assert.equal(countReachedMainStatThresholds(20), 2);
  assert.equal(countReachedMainStatThresholds(25), 3);
  assert.equal(countReachedMainStatThresholds(30), 4);
});

test('main stat per-point bonuses start above 10 rather than at the base value', () => {
  const baseCharacter = makeCharacterWithStat(STATS.STR, 10);
  const increasedCharacter = makeCharacterWithStat(STATS.STR, 11);

  assert.equal(baseCharacter.blockChance, 0);
  assert.equal(baseCharacter.weaponDamage, 100);

  assert.equal(increasedCharacter.blockChance, 1.5);
  assert.equal(increasedCharacter.weaponDamage, 101.5);
});

test('agility threshold bonuses apply at 15', () => {
  const character = makeCharacterWithStat(STATS.AGI, 15);

  assert.equal(character.dodgeChance, 6);
  assert.equal(character.mainHandEfficiency, 102.5);
  assert.equal(character.offHandEfficiency, 102.5);
  assert.equal(character.moveResistance, 7.5);
});

test('perception threshold bonuses apply at 15', () => {
  const character = makeCharacterWithStat(STATS.PER, 15);

  assert.equal(character.vision, 13);
  assert.equal(character.bonusRange, 1);
  assert.equal(character.critChance, 6);
  assert.equal(character.miracleChance, 10);
});

test('vitality bonuses apply both per point and at thresholds', () => {
  const character = makeCharacterWithStat(STATS.VIT, 15);

  assert.equal(character.maxEnergy, 120);
  assert.equal(character.energyRestoration, 30);
  assert.equal(character.maxHealth, 115);
  assert.equal(character.blockPowerRecovery, 5);
  assert.equal(character.controlResistance, 7.5);
});

test('willpower bonuses apply both per point and at thresholds', () => {
  const character = makeCharacterWithStat(STATS.WIL, 15);

  assert.equal(character.cooldownsDuration, 92.5);
  assert.equal(character.abilitiesEnergyCost, 92.5);
  assert.equal(character.magicPower, 107.5);
  assert.equal(character.painResistance, 7.5);
  assert.equal(character.fortitude, 7.5);
});
