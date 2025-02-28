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
    this.#eval = this.#replaceStats(this.#formula);
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
