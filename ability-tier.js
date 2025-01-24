import stylesheet from "./ability-tier.css" with { type: "css" }

class AbilityTier extends HTMLElement {
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

customElements.define("ability-tier", AbilityTier)