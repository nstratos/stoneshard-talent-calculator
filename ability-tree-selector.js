import stylesheet from "./ability-tree-selector.css" with { type: "css" }
import "./ability-tree.js";

class AbilityTreeSelector extends HTMLElement {
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
  }

  connectedCallback() {
    this.slotElement.addEventListener("slotchange", () => {
      // Access the <select> element from the slotted content.
      const slottedNodes = this.slotElement.assignedNodes({ flatten: true });
      const selectElement = slottedNodes.find(node => node.tagName === "SELECT");

      if (selectElement) {
        // Make sure the visibility is correct when the component is first rendered.
        this.updateAbilityTreeVisibility(selectElement);

        selectElement.addEventListener("change", () => this.updateAbilityTreeVisibility(selectElement));
      }
    });
  }

  updateAbilityTreeVisibility(selectElement) {
    const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);

    const abilityTrees = document.querySelectorAll("ability-tree");

    abilityTrees.forEach(tree => {
      if (selectedOptions.includes(tree.id)) {
        tree.show();
      } else {
        tree.hide();
      }
    });
  }
}

customElements.define("ability-tree-selector", AbilityTreeSelector)