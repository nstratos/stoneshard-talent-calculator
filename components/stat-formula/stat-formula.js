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