export default class Character {
  #name = '';
  #class = '';
  #race = '';
  #gender = '';
  #uniqueTrait = '';

  constructor (name = '', type = '', race = '', gender = '') {
    this.#name = name;
    this.#class = type;
    this.#race = race;
    this.#gender = gender;
    this.strength = 10;
    this.agility = 10;
    this.perception = 10;
    this.vitality = 10;
    this.willpower = 10;
    this.legsDef = 0;
    this.knockbackChance = 0;
    this.abilityPoints = 0;
    this.shieldBlockChance = 10;
    this.maxBlockPower = 0;
    this.blockChance = 0;
    this.retaliation = 1; // TODO: change to 1.5 if Retaliation is taken.
    this.mainHandEfficiency = 100;
    this.offHandEfficiency = 100;
    this.openWeaponSkills = 0;
    this.bodyDef = 0;
    this.dodgeChance = 1;
    this.magicPower = 100;
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
    this.maxMP = 100;
    this.accuracy = 0;
    this.critChance = 0;
    this.critPower = 125;
    this.bonusRange = 0;
    this.miracleChance = 5;
    this.miraclePower = 25;
    this.rangedSkillLearned = 0; // TODO: Does it count all ranged abilities learnt?
  }
}
