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
    const abilities = this.querySelectorAll("ability-toggle");
    abilities.forEach(ability => {
      this.abilityMap.set(ability.getAttribute("id"), ability);
    });
  }

  canObtain(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    if (ability.parentIds.length === 0) {
      return true;
    }

    // Check if all parents are obtained.
    return ability.parentIds.every(parentId => this.abilityMap.get(parentId)?.obtained);
  }

  canRefund(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    // Check if all children are refunded.
    return ability.childIds.every(childId => !this.abilityMap.get(childId)?.obtained);
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
    const abilities = this.querySelectorAll("ability-toggle");
    let o = {}
    abilities.forEach(ability => {
      o[ability.id] = ability.obtained ? 1 : 0;
    });
    
    return {id: this.id, abilities: o};
  }

  importAbilitiesObject(o) {
    const abilities = this.querySelectorAll("ability-toggle");
    abilities.forEach(ability => {
      ability.obtained = o[ability.id] === 1;
    });
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