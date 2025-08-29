import Character from './character.js';

class StatFormula extends HTMLElement {
  #character = null;
  #formula = '';
  #eval = '';
  #result = '';
  constructor() {
    super();

    this.#character = new Character();

    let shadowRoot = this.attachShadow({ mode: 'open' });
    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);
  }

  connectedCallback () {
    this.#formula = this.innerHTML;
    this.#eval = this.#replaceStats(this.#formula.replaceAll('math_round', 'Math.round'));
    this.#result = eval?.(`"use strict";(${this.#eval})`);
    if (this.hasAttribute('plus')) {
      this.#result = (this.#result <= 0 ? '' : '+') + this.#result; // Add plus sign in case of positive result.
    }
    this.innerHTML = this.#result;
  }

  #replaceStats(formula) {
    formula = formula.replaceAll('STR', this.#character.strength);
    formula = formula.replaceAll('AGL', this.#character.agility);
    formula = formula.replaceAll('PRC', this.#character.perception);
    formula = formula.replaceAll('VIT', this.#character.vitality);
    formula = formula.replaceAll('Vitality', this.#character.vitality);
    formula = formula.replaceAll('WIL', this.#character.willpower);
    formula = formula.replaceAll('Legs_DEF', this.#character.legsDef);
    formula = formula.replaceAll('Knockback Chance', this.#character.knockbackChance);
    formula = formula.replaceAll('AP', this.#character.abilityPoints);
    formula = formula.replaceAll('Shield BLK Chance', this.#character.shieldBlockChance);
    formula = formula.replaceAll('MAX_BLK_POW', this.#character.maxBlockPower);
    formula = formula.replaceAll('BLK_Chance', this.#character.blockChance);
    formula = formula.replaceAll('Retaliation', this.#character.retaliation);
    formula = formula.replaceAll('Main Hand Efficiency', this.#character.mainHandEfficiency);
    formula = formula.replaceAll('Off-Hand Efficiency', this.#character.offHandEfficiency);
    formula = formula.replaceAll('WPN_SKL', this.#character.openWeaponSkills);
    formula = formula.replaceAll('Body_DEF', this.#character.bodyDef);
    formula = formula.replaceAll('EVS', this.#character.dodgeChance);
    formula = formula.replaceAll('max(', 'Math.max(');
    formula = formula.replaceAll('Magic Power', this.#character.magicPower);
    formula = formula.replaceAll('Magic_Power', this.#character.magicPower);
    formula = formula.replaceAll('Pyromantic Power', this.#character.pyromanticPower);
    formula = formula.replaceAll('Pyromantic_Power', this.#character.pyromanticPower);
    formula = formula.replaceAll('Geomantic Power', this.#character.geomanticPower);
    formula = formula.replaceAll('Geomantic_Power', this.#character.geomanticPower);
    formula = formula.replaceAll('Electromantic Power', this.#character.electromanticPower);
    formula = formula.replaceAll('Electromantic_Power', this.#character.electromanticPower);
    formula = formula.replaceAll('Fire_DMG_Default', this.#character.FireDamageDefault);
    formula = formula.replaceAll('Fire_DMG', this.#character.FireDamage);
    formula = formula.replaceAll('Shock_DMG_Default', this.#character.ShockDamageDefault);
    formula = formula.replaceAll('Shock_DMG', this.#character.ShockDamage);
    formula = formula.replaceAll('Arcane_DMG_Default', this.#character.ArcaneDamageDefault);
    formula = formula.replaceAll('Arcane_DMG', this.#character.ArcaneDamage);
    formula = formula.replaceAll('Max MP', this.#character.maxMP);
    formula = formula.replaceAll('Max_MP', this.#character.maxMP);
    
    return formula;
  }

  showFormula() {
    this.innerHTML = this.#formula;
  }

  hideFormula() {
    this.innerHTML = this.#result;
  }
}

customElements.define('stat-formula', StatFormula)
