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
    const output = this.querySelector('#export-output');
    this.querySelector('#export-button').addEventListener('click', () => {
      output.textContent = this.export();
    });

    this.querySelector('#copy-output-button').addEventListener('click', () => {
      this.copyToClipboard();
    });

    this.querySelector('#import-button').addEventListener('click', () => {
      const build = this.querySelector('#import-input').value;
      this.import(build);
    });
  }

  copyToClipboard() {
    const output = this.querySelector('#export-output');
    output.select();
    output.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(output.value);
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