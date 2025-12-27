import Character from '../../calculator/character.js';

class StatFormula extends HTMLElement {
  /**
   * @type {Character}
   */
  #character = null;

  set character(character) {
    this.#character = character;
  }

  #abilityPick = null;

  set abilityPick(pick) {
    this.#abilityPick = pick;
  }

  get abilityPick() {
    return this.#abilityPick;
  }

  #formula = '';
  #eval = '';
  #result = '';
  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: 'open' });
    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);
  }

  connectedCallback () {
    this.#formula = this.innerHTML;
  }

  #replaceStats(formula) {
    if (this.#character) {
      formula = formula.replaceAll('STR', this.#character.strength);
      formula = formula.replaceAll('AGL', this.#character.agility);
      formula = formula.replaceAll('PRC', this.#character.perception);
      formula = formula.replaceAll('VIT', this.#character.vitality);
      formula = formula.replaceAll('Vitality', this.#character.vitality);
      formula = formula.replaceAll('WIL', this.#character.willpower);
      formula = formula.replaceAll('Legs_DEF', this.#character.legsDef);
      formula = formula.replaceAll('Knockback_Chance', this.#character.knockbackChance);
      formula = formula.replaceAll('AP', this.#character.abilityPoints);
      formula = formula.replaceAll('Shield_Block_Chance', this.#character.shieldBlockChance);
      formula = formula.replaceAll('Block_PowerMax', this.#character.maxBlockPower);
      formula = formula.replaceAll('Block_Chance', this.#character.blockChance);
      formula = formula.replaceAll('Retaliation', this.#character.retaliation);
      formula = formula.replaceAll('Mainhand_Efficiency', this.#character.mainHandEfficiency);
      formula = formula.replaceAll('Offhand_Efficiency', this.#character.offHandEfficiency);
      formula = formula.replaceAll('Body_DEF', this.#character.bodyDef);
      formula = formula.replaceAll('EVS', this.#character.dodgeChance);
      formula = formula.replaceAll('max(', 'Math.max('); // TODO: move inside evalFormula
      formula = formula.replaceAll('Magic Power', this.#character.magicPower);
      formula = formula.replaceAll('Magic_Power', this.#character.magicPower);
      formula = formula.replaceAll('Pyromantic Power', this.#character.pyromanticPower);
      formula = formula.replaceAll('Pyromantic_Power', this.#character.pyromanticPower);
      formula = formula.replaceAll('Geomantic Power', this.#character.geomanticPower);
      formula = formula.replaceAll('Geomantic_Power', this.#character.geomanticPower);
      formula = formula.replaceAll('Electromantic Power', this.#character.electromanticPower);
      formula = formula.replaceAll('Electromantic_Power', this.#character.electromanticPower);
      formula = formula.replaceAll('Arcanistic Power', this.#character.arcanisticPower);
      formula = formula.replaceAll('Arcanistic_Power', this.#character.arcanisticPower);
      formula = formula.replaceAll('Fire_DMG_Default', this.#character.fireDamageDefault);
      formula = formula.replaceAll('Fire_DMG', this.#character.fireDamage);
      formula = formula.replaceAll('Shock_DMG_Default', this.#character.shockDamageDefault);
      formula = formula.replaceAll('Shock_DMG', this.#character.shockDamage);
      formula = formula.replaceAll('Arcane_DMG_Default', this.#character.arcaneDamageDefault);
      formula = formula.replaceAll('Arcane_DMG', this.#character.arcaneDamage);
      formula = formula.replaceAll('HP', this.#character.hp);
      formula = formula.replaceAll('max_hp', this.#character.maxHP);
      formula = formula.replaceAll('MP', this.#character.mp);
      formula = formula.replaceAll('max_mp', this.#character.maxMP);
      formula = formula.replaceAll('Miracle_Chance', this.#character.miracleChance);
      formula = formula.replaceAll('Miracle_Power', this.#character.miraclePower);
      formula = formula.replaceAll('ranged_skill_learned', this.#character.rangedSkillLearned);
      formula = formula.replaceAll('open_weapon_skills', this.#character.openWeaponSkills);
    }
    if (this.#abilityPick) {
      formula = formula.replaceAll('Miscast_Chance', this.abilityPick.backfireChance);
    }
    
    return formula;
  }

  evalFormula() {
    this.#eval = this.#replaceStats(this.#formula.replaceAll('math_round', 'Math.round'));
    this.#result = eval?.(`"use strict";(${this.#eval})`);
    if (this.hasAttribute('plus')) {
      this.#result = (this.#result <= 0 ? '' : '+') + this.#result; // Add plus sign in case of positive result.
    }
    this.innerHTML = this.#result;
  }

  showFormula() {
    this.innerHTML = this.#formula;
  }

  hideFormula() {
    this.innerHTML = this.#result;
  }
}

customElements.define('stat-formula', StatFormula)
