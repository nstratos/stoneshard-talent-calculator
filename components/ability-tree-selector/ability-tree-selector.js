class AbilityTreeSelector extends HTMLElement {
  #selectElement;
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: 'open' });
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './components/ability-tree-selector/ability-tree-selector.css';
    shadowRoot.appendChild(link);

    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
  }

  connectedCallback() {
    this.slotElement.addEventListener('slotchange', () => {
      const slottedNodes = this.slotElement.assignedNodes({ flatten: true });
      const selectElement = slottedNodes.find(node => node.tagName === 'SELECT');
      if (!selectElement) {
        console.error('AbilityTreeSelector: No select element found in slot');
        return;
      }
      this.#selectElement = selectElement;
    });
  }

  selectAll() {
      Array.from(this.#selectElement.options).forEach(option => (option.selected = true));
      this.dispatchEvent(new Event('change'));
  }

  setSelectedValues(selectedValues) {
    Array.from(this.#selectElement.options).forEach(option => {
      if (selectedValues.includes(option.value)) {
        option.selected = true;
      } else {
        option.selected = false;
      }
    });
    this.dispatchEvent(new Event('change'));
  }

  getSelectedValues() {
    return Array.from(this.#selectElement.selectedOptions).map(option => option.value);
  }
}

customElements.define('ability-tree-selector', AbilityTreeSelector)
