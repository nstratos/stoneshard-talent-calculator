import stylesheet from "./talent-calculator.css" with { type: "css" }

class TalentCalculator extends HTMLElement {
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);

    const button = document.createElement("button");
    button.textContent = "Export";
    button.onclick = () => {
      console.log("talents exported:", this.export());
    };
    shadowRoot.appendChild(button);

    const importButton = document.createElement("button");
    importButton.textContent = "Import";
    importButton.onclick = () => {
      this.importFromURL();
    };
    shadowRoot.appendChild(importButton);
  }

  connectedCallback() {
    
  }

  export() {
    let talents = {};
    const trees = this.querySelectorAll('ability-tree');
    trees.forEach(tree => {
      const o = tree.exportAbilitiesObject();
      talents[o.id] = o.abilities;
    });
    return btoa(JSON.stringify(talents));
  }

  import(build) {
    const talents = JSON.parse(atob(build));
    const trees = this.querySelectorAll('ability-tree');
    trees.forEach(tree => {
      const id = tree.getAttribute("id");
      if (talents[id]) {
        tree.importAbilitiesObject(talents[id]);
      }
    });
  }

  importFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encodedBuild = params.get('build');
    console.log("encodedBuild", encodedBuild);
    if (encodedBuild) {
      this.import(encodedBuild);
    }
  }
}



customElements.define("talent-calculator", TalentCalculator)