import stylesheet from "./ability-tree.css" with { type: "css" }

class AbilityTree extends HTMLElement {
  #title = "";
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
    this.buildTree();

    this.addEventListener("ability-obtained", this.handleAbilityObtained)
    this.addEventListener("ability-refunded", this.handleAbilityRefunded)
  }

  buildTree() {
    const abilities = this.querySelectorAll("ability-toggle");
    abilities.forEach(ability => {
      const id = ability.getAttribute("id");
      let parents = [];
      if (ability.hasAttribute("parents")) {
        parents = ability.getAttribute("parents").split(" ");
      }
      let children = [];
      if (ability.hasAttribute("children")) {
        children = ability.getAttribute("children").split(" ");
      }
      
      this.abilityMap.set(id, {element: ability, parents, children});
    });
  }

  canObtain(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    if (ability.parents.length === 0) {
      return true;
    }

    // Check if all parents are obtained.
    return ability.parents.every(parentId => this.abilityMap.get(parentId)?.element.obtained);
  }

  canRefund(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    // Check if all children are refunded.
    return ability.children.every(childId => !this.abilityMap.get(childId)?.element.obtained);
  }

  obtainAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.element.obtained = true;
      console.log(`Ability ${id} obtained`, ability);
    }
  }

  refundAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.element.obtained = false;
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
}

customElements.define(
  "ability-tree",
  AbilityTree
)