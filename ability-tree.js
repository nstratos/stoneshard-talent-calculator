import stylesheet from "./ability-tree.css" with { type: "css" }

class AbilityTree extends HTMLElement {
  obtainedAbilities = new Map();
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];
    const wrapper = document.createElement("slot");
    shadowRoot.appendChild(wrapper);

  }
  connectedCallback() {
    this.addEventListener("ability-obtained", this.handleAbilityObtained)
    this.addEventListener("ability-removed", this.handleAbilityRemoved)
    // let bb = this.querySelectorAll("ability-toggle");
    let bb = this.children;
    for (let ability of bb) {
      console.log("tree-> ", ability.id, ability.obtained);
      console.log("tree-> ", ability.getAttribute("id"), ability.getAttribute("obtained"));
      console.log(ability);
      this.obtainedAbilities.set(ability.getAttribute("id"), ability.getAttribute("obtained") ?? false);
    }
    
  }

  handleAbilityObtained(event) {
    this.obtainedAbilities.set(event.detail.id, true);
    for (let ability of this.childNodes) {
      // this.parents.set(key, event.detail.obtainedAbilities.get(key))
      this.publishObtainedAbilities(ability);
    }
    // this.childNodes.forEach(this.publishObtainedAbilities);
    
    // console.log(this.obtainedAbilities);
  }

  handleAbilityRemoved(event) {
    this.obtainedAbilities.set(event.detail.id, false);
    for (let ability of this.childNodes) {
      this.publishObtainedAbilities(ability);
    }
  }

  publishObtainedAbilities(target) {
    const event = new CustomEvent("obtained-abilities", {
      detail: {
        obtainedAbilities: this.obtainedAbilities,
      },
    });
    target.dispatchEvent(event);
  }
}

customElements.define(
  "ability-tree",
  AbilityTree
)