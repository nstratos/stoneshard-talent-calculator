class AbilityTree extends HTMLElement {
  #display = "";
  abilityMap = new Map();
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./components/ability-tree/ability-tree.css";
    shadowRoot.appendChild(link);

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);
  }

  connectedCallback() {
    this.#display = this.style.display;
    this.buildTree();

    this.addEventListener("ability-pick-obtain", this.handleAbilityPickObtain);
    this.addEventListener("ability-pick-refund", this.handleAbilityPickRefund);
  }

  buildTree() {
    const abilities = this.querySelectorAll("ability-pick");
    abilities.forEach(ability => {
      this.abilityMap.set(ability.getAttribute("id"), ability);
    });
  }

  canObtain(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    // If there are no parents, the ability can always be obtained.
    if (!ability.parents) {
      return true;
    }

    const abilityMap = this.abilityMap;

    function checkParentType(parentValue) {
      if (typeof parentValue === "string") {
        const parentId = parentValue;
        return abilityMap.get(parentId)?.obtained;
      }

      const { type, values } = parentValue;

      // All parent abilities must be obtained.
      if (type === "AND") {
          return values.every(checkParentType); 
      // At least one parent must be obtained.
      } else if (type === "OR") {
          return values.some(checkParentType); 
      }

      // Fallback for unknown types.
      return false; 
    }

    return checkParentType(ability.parents);
  }

  canRefund(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    return ability.childIds.every(childId => {
      const child = this.abilityMap.get(childId);
      // If the child is not obtained, we can refund.
      if (!child || !child.obtained) return true; 

      // If the child has no parents or parents use AND logic, we block refund.
      if (!child.parents || child.parents.type === 'AND') return false;

      // If the child's parents use OR logic, we check if any other parent is obtained and in that case, refund is allowed.
      return child.parents.values.some(parentId => parentId !== id && this.abilityMap.get(parentId)?.obtained);
    });
  }

  #obtainAbility(id, level) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.obtained = true;
      ability.setLevelObtainedAt(level);
      this.dispatchEvent(
        new CustomEvent('ability-tree-obtain', {
          detail: { treeId: this.id, id: ability.id },
          bubbles: true,
        }),
      );
    }
  }

  #refundAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.obtained = false;
      ability.setLevelObtainedAt();
      this.dispatchEvent(
        new CustomEvent('ability-tree-refund', {
          detail: { treeId: this.id, id: ability.id },
          bubbles: true,
        }),
      );
    }
  }

  handleAbilityPickObtain(e) {
    if (e.detail.abilityPoints === 0) {
      return;
    }
    const id = e.detail.id;
    if (this.canObtain(id)) {
      this.#obtainAbility(id, e.detail.level);
    }
  }

  handleAbilityPickRefund(e) {
    const refundAbilityId = e.detail.id;
    const abilityStack = e.detail.abilityStack;
    // We only allow to refund the last obtained ability from the top of the stack.
    const lastAbilityId = abilityStack[abilityStack.length - 1];
    if (lastAbilityId !== refundAbilityId) {
      return;
    }
    if (this.canRefund(refundAbilityId)) {
      this.#refundAbility(refundAbilityId);
    }
  }

  showTreeIfAnyAbilityIsObtained() {
    let anyAbilityObtained = false;
    const abilities = this.querySelectorAll("ability-pick");
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
    return this.style.display !== "none";
  }

  hide() {
    this.style.display = "none";
  }

  show() {
    this.style.display = this.#display;
  }
}

customElements.define(
  "ability-tree",
  AbilityTree
)