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
    console.log();
    this.#eval = this.#replaceStats(this.#formula);
    this.#result = eval(this.#eval);
    console.log(`${this.#formula} = ${this.#result}`);
    this.innerHTML = this.#result;
  }

  #replaceStats(formula) {
    formula = formula.replaceAll('STR', this.#character.strength);
    formula = formula.replaceAll('AGL', this.#character.agility);
    formula = formula.replaceAll('PRC', this.#character.perception);
    formula = formula.replaceAll('VIT', this.#character.vitality);
    formula = formula.replaceAll('WIL', this.#character.willpower);
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