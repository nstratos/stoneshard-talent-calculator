import stylesheet from "./ability-tree.css" with { type: "css" }

class AbilityTree extends HTMLElement {
  abilityMap = new Map();
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];
    const wrapper = document.createElement("slot");
    shadowRoot.appendChild(wrapper);

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
      const tier = ability.getAttribute("tier");
      const parents = (ability.getAttribute("parents") || '').split(",")
      const children = (ability.getAttribute("children") || '').split(",")
      
      this.abilityMap.set(id, {element: ability, tier, parents, children});
    });
  }

  canObtain(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    if (ability.tier === "1") return true;

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
}

customElements.define(
  "ability-tree",
  AbilityTree
)