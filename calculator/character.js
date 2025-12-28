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

  constructor(name = '', title = '', race = '', gender = '') {
    this.#name = name;
    this.#title = title;
    this.#race = race;
    this.#gender = gender;
    this.strength = 10;
    this.agility = 10;
    this.perception = 10;
    this.vitality = 10;
    this.willpower = 10;
    this.legsDef = 0;
    this.knockbackChance = 0;
    this.shieldBlockChance = 0;
    this.maxBlockPower = 0;
    this.blockChance = 0;
    this.retaliation = 1;
    this.mainHandEfficiency = 100;
    this.offHandEfficiency = 100;
    this.bodyDef = 0;
    this.dodgeChance = 1;
    this.magicPower = 100;
    this.miracleChance = 5;
    this.miraclePower = 25;
    this.backfireChance = 20;
    this.backfireDamage = 5;
    this.pyromanticPower = 0;
    this.geomanticPower = 0;
    this.electromanticPower = 0;
    this.arcanisticPower = 0;
    this.fireDamageDefault = 1;
    this.fireDamage = 2;
    this.shockDamageDefault = 1;
    this.shockDamage = 2;
    this.arcaneDamageDefault = 1;
    this.arcaneDamage = 2;
    this.hp = 100;
    this.maxHP = 100;
    this.mp = 100;
    this.maxMP = 100;
    this.accuracy = 0;
    this.critChance = 0;
    this.critPower = 125;
    this.bonusRange = 0;
    this.rangedSkillLearned = 0; // TODO: Does it count all ranged abilities learnt?
    this.openWeaponSkills = 0;
  }

  /**
   * Returns the base value of a stat before allocations.
   *
   * @param {StatKey} stat
   * @returns {number}
   */
  getBaseStat(stat) {
    if (stat === STATS.STR) return this.strength;
    if (stat === STATS.AGI) return this.agility;
    if (stat === STATS.PER) return this.perception;
    if (stat === STATS.VIT) return this.vitality;
    if (stat === STATS.WIL) return this.willpower;

    throw new Error(`Unknown stat: ${stat}`);
  }
}
