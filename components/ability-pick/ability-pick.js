const template = document.createElement("template")
template.innerHTML = `
  <div>
    <style>
      .ability-image {filter: grayscale(1);}
    </style>
    <slot class="ability-image" name="ability-image"></slot>
    <slot name="ability-text"></slot>
  </div>
`
const templateContent = template.content;

class AbilityPick extends HTMLElement {
  id = "0";
  #obtained = false;
  #innate = false;
  #parents = null;
  #childIds = [];
  #image = null;
  #overlayText = null;
  #overlayTextDisplay = "";
  
  static get observedAttributes() {
    return ["obtained"];
  }

  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: "open" });

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./components/ability-pick/ability-pick.css";
    shadowRoot.appendChild(link);

    if (this.hasAttribute("id")) {
      this.id = this.getAttribute("id");
    }
    if (this.hasAttribute("parents")) {
      this.#parents = this.#parseParentsAttribute(this.getAttribute("parents"));
    }
    if (this.hasAttribute("children")) {
      this.getAttribute("children").split(" ").forEach(childId => this.#childIds.push(childId));
    }
    if (this.hasAttribute("innate")) {
      this.#innate = true;
      this.#obtained = true;
    }

    const container = document.createElement("div");
    container.className = "ability-pick-container";
    
    this.#image = document.createElement("img");
    this.#image.className = "ability-pick-img"
    this.#image.src = "img/default.png";
    this.#image.alt = "Unknown ability";
    if (this.hasAttribute("img")) {
      this.#image.src = this.getAttribute("img");
      this.#image.alt = this.hasAttribute("title") ? this.getAttribute("title") : "";
    }
    container.appendChild(this.#image);

    this.#overlayText = document.createElement("div");
    this.#overlayText.className = "overlay-text";
    container.appendChild(this.#overlayText);

    shadowRoot.appendChild(container);
  }

  connectedCallback () {
    this.#overlayTextDisplay = this.#overlayText.style.display;
    this.#render();
  }

  #parseParentsAttribute(attribute) {
    if (!attribute) return null;

    function parseAttribute(value) {
        // Handle OR (`|`) first, as it has lower precedence than AND.
        if (value.includes("|")) {
            return {
                type: "OR",
                values: value.split("|").map(parseAttribute)
            };
        }

        // Handle AND (space-separated).
        if (value.includes(" ")) {
            return {
                type: "AND",
                values: value.split(" ").map(String)
            };
        }

        // Base case: Single value (convert to string).
        return String(value);
    }

    return parseAttribute(attribute);
  }

  setLevelObtainedAt(level) {
    if (!level) {
      this.#overlayText.innerHTML = ``;
      return;
    }
    this.#overlayText.innerHTML = `Lvl ${level}`;
  }

  obtain(level, abilityPoints, abilityStack) {
    if (this.#obtained) return;
    
    this.dispatchEvent(
      new CustomEvent('ability-pick-obtain', {
        detail: { id: this.id, level: level, abilityPoints: abilityPoints, abilityStack: abilityStack },
        bubbles: true,
      }),
    );
  }

  refund(level, abilityPoints, abilityStack) {
    if (!this.#obtained) return;
    if (this.#innate) return;

    this.dispatchEvent(
      new CustomEvent('ability-pick-refund', {
        detail: { id: this.id, level: level, abilityPoints: abilityPoints, abilityStack: abilityStack },
        bubbles: true,
      }),
    );
  }

  hideOverlayText() {
    this.#overlayText.style.display = "none";
  }

  showOverlayText() {
    this.#overlayText.style.display = this.#overlayTextDisplay;
  }

  #render() {
    this.style.opacity = this.obtained ? '1' : '0.5';
    this.#image.style.filter = this.obtained ? "grayscale(0) brightness(1)" : "grayscale(1) brightness(0.8)";
  }

  set obtained(value) {
    if (value) {
      this.setAttribute('obtained', '');
    } else {
      this.removeAttribute('obtained');
    }
  }

  get obtained() {
    return this.#obtained;
  }

  get innate() {
    return this.#innate;
  }

  get childIds() {
    return this.#childIds;
  }

  get parents() {
    return this.#parents;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'parents':
        break;
      case 'children':
        break;
      case 'obtained':
        this.#obtained = newValue !== null;
        break;
    }
    this.#render();
  }
}

customElements.define("ability-pick", AbilityPick)
