import stylesheet from "./ability-toggle.css" with { type: "css" }

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

class AbilityToggle extends HTMLElement {
  id = "0";
  enabled = false;
  obtained = false;
  parents = new Map();
  children = new Map();
  #image = null;
  
  static get observedAttributes() {
    return ["enabled", "obtained", "parents", "children"];
  }
  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    if (this.hasAttribute("id")) {
      this.id = this.getAttribute("id");
    }
    if (this.hasAttribute("enabled")) {
      this.enabled = true;
    }
    if (this.hasAttribute("parents")) {
      this.getAttribute("parents").split(",").forEach(element => this.parents.set(element, false));
    }
    if (this.hasAttribute("children")) {
      this.getAttribute("children").split(",").forEach(element => this.children.set(element, false));
    }
    console.log("id=", this.id, "->", this.parents);
    
    this.#image = document.createElement("img");
    this.#image.className = "ability-toggle-img"
    this.#image.src = "img/default.png";
    this.#image.alt = "Unknown ability";
    if (this.hasAttribute("img")) {
      this.#image.src = this.getAttribute("img");
      this.#image.alt = this.hasAttribute("alt") ? this.getAttribute("alt") : "";
    }
    shadowRoot.appendChild(this.#image);

    
    
    //shadowRoot.appendChild(template.content.cloneNode(true))
    
  }

  obtainAbility() {
    if (this.enabled === false) {
      return;
    }
    if (this.obtained === true) {
      return;
    }
    this.obtained = true
    this.#image.style.filter = "grayscale(0) brightness(1)";
    this.dispatchEvent(
      new CustomEvent('ability-obtained', {
        detail: {
          id: this.id,
          obtained: this.obtained,
        },
        bubbles: true,
      }),
    );
  }

  removeAbility() {
    if (this.enabled === false) {
      return;
    }
    if (this.obtained === false) {
      return;
    }
    this.obtained = false;
    this.#image.style.filter = "grayscale(1) brightness(0.8)";
    this.dispatchEvent(
      new CustomEvent('ability-removed', {
        detail: {
          id: this.id,
          obtained: this.obtained,
        },
        bubbles: true,
      }),
    );
  }

  connectedCallback () {
    this.addEventListener("click", function(event) {
      event.preventDefault();
      this.obtainAbility();
    });
    this.addEventListener("contextmenu", function(event) {
      event.preventDefault();
      this.removeAbility();
    });
    this.addEventListener("obtained-abilities", this.handleObtainedAbilities);
  }

  handleObtainedAbilities(event) {
    console.log("id=", this.id, this.parents);
    console.log("obtained abilities = ", event.detail.obtainedAbilities);
    this.enableIfAllParentsAreObtained(event.detail.obtainedAbilities);
    this.disableIfAnyChildIsObtained(event.detail.obtainedAbilities);
    
    console.log("id=", this.id, this.parents);
    console.log("id=", this.id, "enabled=", this.enabled);
  }

  enableIfAllParentsAreObtained(obtainedAbilities) {
    for (let key of this.parents.keys()) {
      this.parents.set(key, obtainedAbilities.get(key) ?? false)
    }
    const values = [...this.parents.values()]
    if (!values.includes(false)) {
      this.enabled = true;
    } 
  }

  disableIfAnyChildIsObtained(obtainedAbilities) {
    for (let key of this.children.keys()) {
      this.children.set(key, obtainedAbilities.get(key) ?? false)
    }
    const values = [...this.children.values()]
    if (values.includes(true)) {
      this.enabled = false;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'parents':
        console.log('++++ parents changed.');
        break;
      case 'children':
        console.log('++++ children changed.');
        break;
    }
    console.log(name, '++++ changed.');
  }
}

customElements.define(
  "ability-toggle",
  AbilityToggle
)
