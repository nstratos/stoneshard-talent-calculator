import test from 'node:test';
import assert from 'node:assert/strict';

import { computeAbilityUnlockRequirementState } from './ability-unlock-requirements.js';
import Character from './character.js';
import { STATS } from './stats.js';

test('unlock requirement shows all required attribute points before any are invested', () => {
  const character = new Character();

  const state = computeAbilityUnlockRequirementState(
    {
      level: 10,
      attributePoints: 8,
      attributes: [STATS.STR, STATS.AGI],
    },
    character,
    1,
  );

  assert.deepEqual(state, {
    isSatisfied: false,
    remainingAttributePoints: 8,
  });
});

test('unlock requirement is satisfied by combined points across listed attributes', () => {
  const character = new Character();

  for (let i = 0; i < 4; i++) {
    character.applyStatIncrease(STATS.STR);
    character.applyStatIncrease(STATS.AGI);
  }

  const state = computeAbilityUnlockRequirementState(
    {
      level: 10,
      attributePoints: 8,
      attributes: [STATS.STR, STATS.AGI],
    },
    character,
    1,
  );

  assert.deepEqual(state, {
    isSatisfied: true,
    remainingAttributePoints: 0,
  });
});

test('reaching the required level satisfies the unlock requirement', () => {
  const character = new Character();

  const state = computeAbilityUnlockRequirementState(
    {
      level: 10,
      attributePoints: 8,
      attributes: [STATS.STR, STATS.AGI],
    },
    character,
    10,
  );

  assert.deepEqual(state, {
    isSatisfied: true,
    remainingAttributePoints: 8,
  });
});

test('remaining attribute points never drops below zero', () => {
  const character = new Character();

  for (let i = 0; i < 10; i++) {
    character.applyStatIncrease(STATS.STR);
  }

  const state = computeAbilityUnlockRequirementState(
    {
      level: 10,
      attributePoints: 8,
      attributes: [STATS.STR, STATS.AGI],
    },
    character,
    1,
  );

  assert.deepEqual(state, {
    isSatisfied: true,
    remainingAttributePoints: 0,
  });
});
