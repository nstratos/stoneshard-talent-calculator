import stylesheet from "./ability-tree-selector.css" with { type: "css" }

class AbilityTreeSelector extends HTMLElement {
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
  }

  findSelectElement() {
    const slottedNodes = this.slotElement.assignedNodes({ flatten: true });
    return slottedNodes.find(node => node.tagName === "SELECT");
  }

  findSelectAllButton() {
    const slottedNodes = this.slotElement.assignedNodes({ flatten: true });
    return slottedNodes.find(node => node.classList?.contains("select-all-button"));
  }

  connectedCallback() {
    this.slotElement.addEventListener("slotchange", () => {
      const selectElement = this.findSelectElement();
      if (selectElement) {
        // Make sure the visibility is correct when the component is first rendered.
        this.updateAbilityTreeVisibility(selectElement);
        selectElement.addEventListener("change", () => this.updateAbilityTreeVisibility(selectElement));
      }

      const selectAllButton = this.findSelectAllButton();
      if (selectAllButton) {
        selectAllButton.addEventListener("click", () => {
          const selectElement = this.findSelectElement();
          if (selectElement) {
            // Select all options.
            Array.from(selectElement.options).forEach(option => (option.selected = true));
            this.updateAbilityTreeVisibility(selectElement);
          }
        });
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