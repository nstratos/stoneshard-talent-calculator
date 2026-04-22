import test from 'node:test';
import assert from 'node:assert/strict';

import Character from './character.js';
import {
  computeAbilityTooltipValues,
  computeDisplayedArmorPenetration,
  computeDisplayedBackfireChance,
  computeDisplayedCooldown,
  computeDisplayedEnergyCost,
} from './ability-tooltip-values.js';

test('computeDisplayedCooldown rounds to the nearest whole number', () => {
  assert.equal(computeDisplayedCooldown(8, 76), 6);
  assert.equal(computeDisplayedCooldown(8, 56), 4);
  assert.equal(computeDisplayedCooldown(8, 60), 5);
});

test('computeDisplayedEnergyCost uses global and category-specific multipliers', () => {
  assert.equal(computeDisplayedEnergyCost(14, 76, 89), 9);
  assert.equal(computeDisplayedEnergyCost(14, 76, 93), 10);
  assert.equal(computeDisplayedEnergyCost(12, 76, 96), 9);
});

test('computeDisplayedBackfireChance is additive and clamps to zero', () => {
  assert.equal(computeDisplayedBackfireChance(10, -8.5), 1.5);
  assert.equal(computeDisplayedBackfireChance(10, -10.5), 0);
});

test('computeDisplayedArmorPenetration adds spell armor piercing', () => {
  assert.equal(computeDisplayedArmorPenetration(60, 1.5), 61.5);
});

test('computeAbilityTooltipValues applies spell tooltip rules together', () => {
  const character = new Character();
  character.abilitiesEnergyCost = 76;
  character.spellsEnergyCost = -7;
  character.cooldownsDuration = 76;
  character.backfireChance = -8.5;
  character.backfireDamage = 5;
  character.spellArmorPiercing = 1.5;

  const values = computeAbilityTooltipValues(
    {
      energy: 14,
      cooldown: 8,
      backfireChance: 10,
      armorPenetration: 60,
      isSpell: true,
    },
    character,
  );

  assert.deepEqual(values, {
    energy: 10,
    cooldown: 6,
    backfireChance: 1.5,
    backfireDamage: 1,
    armorPenetration: 61.5,
  });
});

test('computeAbilityTooltipValues uses skills energy cost for non-spells', () => {
  const character = new Character();
  character.abilitiesEnergyCost = 76;
  character.skillsEnergyCost = -4;
  character.cooldownsDuration = 76;

  const values = computeAbilityTooltipValues(
    {
      energy: 12,
      cooldown: 8,
      backfireChance: null,
      armorPenetration: 25,
      isSpell: false,
    },
    character,
  );

  assert.deepEqual(values, {
    energy: 9,
    cooldown: 6,
    backfireChance: null,
    backfireDamage: null,
    armorPenetration: 25,
  });
});
