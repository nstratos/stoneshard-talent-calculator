import { STATS } from './stats.js';

/**
 * Main stat bonus rules are applied from the character's current effective stat values.
 *
 * - `perPoint` bonuses are applied once per stat point above the base value of 10.
 * - `perThreshold` bonuses are applied once for each reached threshold in 15/20/25/30.
 *
 * A bonus can either target a single character field or provide a custom `apply`
 * callback for cases that map to multiple fields.
 */

/**
 * @typedef {{
 *   amount: number,
 *   field?: string,
 *   apply?: (character: any, amount: number) => void
 * }} StatBonusRule
 */

export const MAIN_STAT_THRESHOLDS = Object.freeze([15, 20, 25, 30]);

export const MAIN_STAT_BONUSES = Object.freeze({
  [STATS.STR]: {
    perPoint: [
      { field: 'blockChance', amount: 1.5 },
      { field: 'weaponDamage', amount: 1.5 },
    ],
    perThreshold: [
      { field: 'bodypartDamage', amount: 7.5 },
      { field: 'critEfficiency', amount: 10 },
      { field: 'armorDamage', amount: 15 },
    ],
  },

  [STATS.AGI]: {
    perPoint: [
      { field: 'counterChance', amount: 1.5 },
      { field: 'fumbleChance', amount: -1.5 },
      { field: 'backfireChance', amount: -1.5 },
    ],
    perThreshold: [
      { field: 'dodgeChance', amount: 5 },
      {
        amount: 2.5,
        apply: (character, amount) => {
          // Hands Efficiency affects both main-hand and off-hand values.
          character.mainHandEfficiency += amount;
          character.offHandEfficiency += amount;
        },
      },
      { field: 'moveResistance', amount: 7.5 },
    ],
  },

  [STATS.PER]: {
    perPoint: [
      { field: 'accuracy', amount: 1.5 },
      { field: 'armorPenetration', amount: 1.5 },
    ],
    perThreshold: [
      { field: 'vision', amount: 1 },
      { field: 'bonusRange', amount: 1 },
      { field: 'critChance', amount: 5 },
      { field: 'miracleChance', amount: 5 },
    ],
  },

  [STATS.VIT]: {
    perPoint: [
      { field: 'maxEnergy', amount: 4 },
      { field: 'energyRestoration', amount: 2 },
    ],
    perThreshold: [
      { field: 'maxHealth', amount: 15 },
      { field: 'blockPowerRecovery', amount: 5 },
      { field: 'controlResistance', amount: 7.5 },
    ],
  },

  [STATS.WIL]: {
    perPoint: [
      { field: 'cooldownsDuration', amount: -1.5 },
      { field: 'abilitiesEnergyCost', amount: -1.5 },
    ],
    perThreshold: [
      { field: 'magicPower', amount: 7.5 },
      { field: 'painResistance', amount: 7.5 },
      { field: 'fortitude', amount: 7.5 },
    ],
  },
});

/**
 * Returns how many main-stat thresholds have been reached by the given stat value.
 *
 * For example:
 * - 14 => 0
 * - 15 => 1
 * - 20 => 2
 * - 30 => 4
 *
 * @param {number} statValue
 * @returns {number}
 */
export function countReachedMainStatThresholds(statValue) {
  return MAIN_STAT_THRESHOLDS.filter((threshold) => statValue >= threshold).length;
}

function applyBonus(character, bonus, times) {
  const totalAmount = bonus.amount * times;

  if (typeof bonus.apply === 'function') {
    bonus.apply(character, totalAmount);
    return;
  }

  character[bonus.field] += totalAmount;
}

/**
 * Applies all passive and threshold bonuses from the five main stats to the
 * already-recomputed character snapshot.
 *
 * This is meant to run after ledger stat increases have been applied.
 *
 * @param {import('./character.js').default} character
 */
export function applyMainStatBonuses(character) {
  for (const stat of Object.values(STATS)) {
    const rules = MAIN_STAT_BONUSES[stat];
    if (!rules) continue;

    const statValue = character.getEffectiveStat(stat);
    const thresholdCount = countReachedMainStatThresholds(statValue);
    const bonusPointCount = Math.max(statValue - 10, 0);

    for (const bonus of rules.perPoint) {
      applyBonus(character, bonus, bonusPointCount);
    }

    for (const bonus of rules.perThreshold) {
      applyBonus(character, bonus, thresholdCount);
    }
  }
}
