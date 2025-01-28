import stylesheet from "./ability-pick.css" with { type: "css" }

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
  #parents = null;
  #childIds = [];
  #image = null;
  
  static get observedAttributes() {
    return ["obtained"];
  }
  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    if (this.hasAttribute("id")) {
      this.id = this.getAttribute("id");
    }
    if (this.hasAttribute("parents")) {
      this.#parents = this.parseParentsAttribute(this.getAttribute("parents"));
    }
    if (this.hasAttribute("children")) {
      this.getAttribute("children").split(" ").forEach(childId => this.#childIds.push(childId));
    }
    
    this.#image = document.createElement("img");
    this.#image.className = "ability-pick-img"
    this.#image.src = "img/default.png";
    this.#image.alt = "Unknown ability";
    if (this.hasAttribute("img")) {
      this.#image.src = this.getAttribute("img");
      this.#image.alt = this.hasAttribute("alt") ? this.getAttribute("alt") : "";
    }
    shadowRoot.appendChild(this.#image);

    
    
    //shadowRoot.appendChild(template.content.cloneNode(true))
    
  }

  parseParentsAttribute(attribute) {
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

  obtainAbility() {
    if (this.#obtained) return;
    
    this.dispatchEvent(
      new CustomEvent('ability-obtained', {
        detail: { id: this.id },
        bubbles: true,
      }),
    );
  }

  refundAbility() {
    if (!this.#obtained) return;

    this.dispatchEvent(
      new CustomEvent('ability-refunded', {
        detail: { id: this.id },
        bubbles: true,
      }),
    );
  }

  connectedCallback () {
    this.render();

    this.addEventListener("click", function() {
      this.obtainAbility();
    });
    this.addEventListener("contextmenu", function(event) {
      event.preventDefault();
      this.refundAbility();
    });
  }

  render() {
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
    this.render();
  }
}

customElements.define("ability-pick", AbilityPick)
