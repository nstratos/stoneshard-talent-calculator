import { STATS } from './stats.js';

/**
 * @typedef {import('./stats.js').StatKey} StatKey
 */

export default class Character {
  #name = '';
  #title = '';
  #race = '';
  #gender = '';
  #uniqueTrait = '';
  /** @type {Record<StatKey, number>} */
  #baseStats = {
    [STATS.STR]: 10,
    [STATS.AGI]: 10,
    [STATS.PER]: 10,
    [STATS.VIT]: 10,
    [STATS.WIL]: 10,
  };

  constructor(name = '', title = '', race = '', gender = '') {
    this.#name = name;
    this.#title = title;
    this.#race = race;
    this.#gender = gender;
    this.resetComputedStats();
  }

  resetComputedStats() {
    this.strength = this.#baseStats[STATS.STR];
    this.agility = this.#baseStats[STATS.AGI];
    this.perception = this.#baseStats[STATS.PER];
    this.vitality = this.#baseStats[STATS.VIT];
    this.willpower = this.#baseStats[STATS.WIL];

    // Combat
    this.mainHandDamage = 7; // flat value
    this.offHandDamage = 0; // flat value
    this.weaponDamage = 100;
    this.mainHandEfficiency = 100;
    this.offHandEfficiency = 100;
    this.bodypartDamage = 0;
    this.armorDamage = 0;
    this.armorPenetration = 0;
    this.spellArmorPiercing = 0;

    this.accuracy = 80;
    this.spellAccuracy = 90;
    this.critChance = 1;
    this.critEfficiency = 25; // Stored as bonus percent; game displays +25%.
    this.counterChance = 1;
    this.fumbleChance = 20;

    this.skillsEnergyCost = 0;
    this.spellsEnergyCost = 0;
    this.abilitiesEnergyCost = 100;
    this.cooldownsDuration = 100;
    this.maxVision = 12; // flat value
    this.vision = 12; // flat value
    this.bonusRange = 0; // Threshold bonus is flat +1, but the game displays this as %.

    this.bleedChance = 0;
    this.dazeChance = 0;
    this.stunChance = 0;
    this.knockbackChance = 0;
    this.immobilizationChance = 0;
    this.staggerChance = 0;

    this.lifeDrain = 0;
    this.energyDrain = 0;

    // Survival
    this.health = 100; // flat value; in the game, it shows as: 100/100; The second 100 must be max health.
    this.maxHealth = 100; // flat value
    this.healthRestoration = 10;
    this.healingEfficiency = 100;

    this.energy = 100; // flat value; in the game, it shows as: 100/100
    this.maxEnergy = 100; // flat value
    this.energyRestoration = 20;

    this.protection = 0; // flat value
    this.blockChance = 0;
    this.blockPower = 0; // flat value; in the game, it shows as: 0/0; The second 0 must be max block power.
    this.maxBlockPower = 0; // flat value
    this.blockPowerRecovery = 0;

    this.dodgeChance = 1;
    this.critAvoidance = 0;
    this.fortitude = 0;

    this.bleedResistance = 0;
    this.controlResistance = 0;
    this.moveResistance = 0;

    this.hungerResistance = 0;
    this.intoxicationResistance = 0;
    this.painResistance = 0;
    this.fatigueResistance = 0;

    this.experienceGain = 100;
    this.reputationGain = 100;

    // Damage Resistance
    this.damageTaken = 100;
    this.damageReflection = 0;

    this.physicalResistance = 0;
    this.natureResistance = 0;
    this.magicResistance = 0;

    this.slashingResistance = 0;
    this.piercingResistance = 0;
    this.crushingResistance = 0;
    this.rendingResistance = 0;

    this.fireResistance = 0;
    this.poisonResistance = 0;
    this.frostResistance = 0;
    this.shockResistance = 0;
    this.causticResistance = 0;

    this.arcaneResistance = 0;
    this.sacredResistance = 0;
    this.unholyResistance = 0;
    this.psionicResistance = 0;

    // Magic
    this.magicPower = 100;
    this.miracleChance = 5;
    this.miraclePotency = 25; // Stored as bonus percent; game displays +25%.
    this.backfireChance = 20;
    this.backfireDamage = 5;

    this.pyromanticPower = 0;
    this.geomanticPower = 0;
    this.venomanticPower = 0;
    this.cryomanticPower = 0;
    this.electromanticPower = 0;

    this.arcanisticPower = 0;
    this.astromanticPower = 0;
    this.psimanticPower = 0;

    // The following fields do not appear on the character sheet.
    this.fireDamageDefault = 1;
    this.fireDamage = 2;
    this.shockDamageDefault = 1;
    this.shockDamage = 2;
    this.arcaneDamageDefault = 1;
    this.arcaneDamage = 2;

    this.bodyDef = 0;
    this.legsDef = 0;

    this.shieldBlockChance = 0;
    this.retaliation = 1;

    this.rangedSkillLearned = 0; // TODO: Does it count all ranged abilities learnt?
    this.openWeaponSkills = 0;
    this.openWeaponOneHandSkills = 0;
  }

  /**
   * Returns the base value of a stat before allocations.
   *
   * @param {StatKey} stat
   * @returns {number}
   */
  getBaseStat(stat) {
    const value = this.#baseStats[stat];
    if (value != null) return value;

    throw new Error(`Unknown stat: ${stat}`);
  }

  /**
   * Returns the current computed value of a stat.
   *
   * @param {StatKey} stat
   * @returns {number}
   */
  getEffectiveStat(stat) {
    if (stat === STATS.STR) return this.strength;
    if (stat === STATS.AGI) return this.agility;
    if (stat === STATS.PER) return this.perception;
    if (stat === STATS.VIT) return this.vitality;
    if (stat === STATS.WIL) return this.willpower;

    throw new Error(`Unknown stat: ${stat}`);
  }

  /**
   * Applies one ledger-allocated stat increase.
   *
   * @param {StatKey} stat
   */
  applyStatIncrease(stat) {
    if (stat === STATS.STR) this.strength++;
    else if (stat === STATS.AGI) this.agility++;
    else if (stat === STATS.PER) this.perception++;
    else if (stat === STATS.VIT) this.vitality++;
    else if (stat === STATS.WIL) this.willpower++;
    else throw new Error(`Unknown stat: ${stat}`);
  }

  /**
   * Syncs current resources to their computed maximums.
   *
   * The calculator currently models a fully healthy / fully energized character
   * rather than tracking damage or spent energy across recomputes.
   */
  syncCurrentResourcesToMaximums() {
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
  }
}
