import stylesheet from "./talent-calculator.css" with { type: "css" }

class TalentCalculator extends HTMLElement {
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);
  }

  connectedCallback() {
    
  }
}

customElements.define("talent-calculator", TalentCalculator)