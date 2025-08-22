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
    this.shieldBlockChance = 0;
    this.maxBlockPower = 0;
    this.blockChance = 0;
    this.retaliation = 1;
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
    this.FireDamageDefault = 1;
    this.FireDamage = 2;
    this.ShockDamageDefault = 1;
    this.ShockDamage = 2;
    this.ArcaneDamageDefault = 1;
    this.ArcaneDamage = 2;
    this.maxMP = 100;
  }
}
