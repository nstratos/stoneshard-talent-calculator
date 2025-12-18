import { AbilityPick } from '../../components/ability-pick/ability-pick.js';

/**
 * @class AbilityTree
 * @extends HTMLElement
 * 
 * Represents a single talent tree like swords or athletics.
 */
export class AbilityTree extends HTMLElement {
  #display = '';

  /**
   * @type {Map<string, AbilityPick>}
   */
  #abilityMap = new Map();

  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: 'open' });
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './components/ability-tree/ability-tree.css';
    shadowRoot.appendChild(link);

    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);
  }

  connectedCallback() {
    this.#display = this.style.display;
    this.#buildAbilityMap();

    this.addEventListener('ability-pick-obtain', (event) => this.#handleAbilityPickObtain(event));
    this.addEventListener('ability-pick-refund', (event) => this.#handleAbilityPickRefund(event));
  }

  #buildAbilityMap() {
    /** @type {NodeListOf<AbilityPick} */
    const abilities = this.querySelectorAll('ability-pick');
    abilities.forEach(ability => {
      this.#abilityMap.set(ability.getAttribute('id'), ability);
    });
  }

  #canObtain(id) {
    const ability = this.#abilityMap.get(id);
    if (!ability) return false;

    // If there are no parents, the ability can always be obtained.
    if (!ability.parents) {
      return true;
    }

    const abilityMap = this.#abilityMap;

    function checkParentType(parentValue) {
      if (typeof parentValue === 'string') {
        const parentId = parentValue;
        return abilityMap.get(parentId)?.obtained;
      }

      const { type, values } = parentValue;

      // All parent abilities must be obtained.
      if (type === 'AND') {
          return values.every(checkParentType); 
      // At least one parent must be obtained.
      } else if (type === 'OR') {
          return values.some(checkParentType); 
      }

      // Fallback for unknown types.
      return false; 
    }

    return checkParentType(ability.parents);
  }

  /**
   * Returns true if an ability can be refunded.
   * 
   * @param {string} abilityId 
   * @returns {boolean}
   */
  #canRefund(abilityId) {
    const ability = this.#abilityMap.get(abilityId);
    if (!ability) return false;
    if (!ability.obtained) return false;
    if (ability.innate) return false;
    
    return true;
  }

  #handleAbilityPickObtain(e) {
    const abilityId = e.detail.id;
    if (this.#canObtain(abilityId)) {
      this.dispatchEvent(
        new CustomEvent('ability-tree-obtain', {
          detail: { treeId: this.id, id: abilityId },
          bubbles: true,
        }),
      );
    }
  }

  #handleAbilityPickRefund(e) {
    const abilityId = e.detail.id;
    if (this.#canRefund(abilityId)) {
      this.dispatchEvent(
        new CustomEvent('ability-tree-refund', {
          detail: { treeId: this.id, id: abilityId },
          bubbles: true,
        }),
      );
    }
  }

  /** @returns {Map<string, AbilityPick>} */
  getAbilityMap() {
    return this.#abilityMap;
  }

  showTreeIfAnyAbilityIsObtained() {
    let anyAbilityObtained = false;
    const abilities = this.querySelectorAll('ability-pick');
    abilities.forEach(ability => {
      if (!ability.innate && ability.obtained) {
        anyAbilityObtained = true;
      }
    });
    if (anyAbilityObtained) {
      this.show();
    } else {
      this.hide();
    }
  }

  isVisible() {
    return this.style.display !== 'none';
  }

  hide() {
    this.style.display = 'none';
  }

  show() {
    this.style.display = this.#display;
  }
}

customElements.define(
  'ability-tree',
  AbilityTree
)
