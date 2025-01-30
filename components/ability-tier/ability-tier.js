class AbilityTier extends HTMLElement {
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./components/ability-tier/ability-tier.css";
    shadowRoot.appendChild(link);

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);
  }

  connectedCallback() {
    
  }
}

customElements.define("ability-tier", AbilityTier)