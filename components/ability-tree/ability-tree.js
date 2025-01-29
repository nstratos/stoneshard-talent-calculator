import stylesheet from "./ability-tree.css" with { type: "css" }

class AbilityTree extends HTMLElement {
  #title = "";
  #display = "";
  abilityMap = new Map();
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    if (this.hasAttribute("title")) {
      this.#title = this.getAttribute("title");
      const header = document.createElement("header");
      header.className = "ability-tree-header";
      const text = document.createElement("text");
      text.textContent = this.#title;
      header.appendChild(text)
      shadowRoot.appendChild(header);
    }

    const section = document.createElement("section");
    section.className = "ability-tree-body";
    const slot = document.createElement("slot");
    section.appendChild(slot)
    shadowRoot.appendChild(section);
  }

  connectedCallback() {
    this.#display = this.style.display;
    this.buildTree();

    this.addEventListener("ability-obtained", this.handleAbilityObtained);
    this.addEventListener("ability-refunded", this.handleAbilityRefunded);
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

  obtainAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.obtained = true;
      console.log(`Ability ${id} obtained`, ability);
    }
  }

  refundAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.obtained = false;
      console.log(`Ability ${id} refunded`, ability);
    }
  }

  handleAbilityObtained(e) {
    const id = e.detail.id;
    if (this.canObtain(id)) {
      this.obtainAbility(id);
    }
  }

  handleAbilityRefunded(e) {
    const id = e.detail.id;
    if (this.canRefund(id)) {
      this.refundAbility(id);
    }
  }

  exportAbilitiesObject() {
    const abilities = this.querySelectorAll("ability-pick");
    let o = {}
    abilities.forEach(ability => {
      o[ability.id] = ability.obtained ? 1 : 0;
    });
    
    return {id: this.id, abilities: o};
  }

  importAbilitiesObject(o) {
    let anyAbilitySelected = false;
    const abilities = this.querySelectorAll("ability-pick");
    abilities.forEach(ability => {
      ability.obtained = o[ability.id] === 1;
      if (ability.obtained) {
        anyAbilitySelected = true;
      }
    });
    if (anyAbilitySelected) {
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