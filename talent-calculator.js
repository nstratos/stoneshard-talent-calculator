import "./components/ability-tree-selector/ability-tree-selector.js";
import "./components/ability-tier/ability-tier.js";
import "./components/ability-tree/ability-tree.js";
import "./components/ability-pick/ability-pick.js";

import stylesheet from "./talent-calculator.css" with { type: "css" }

class TalentCalculator extends HTMLElement {
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    const slot = document.createElement("slot");
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
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

    this.querySelector('ability-tree-selector').addEventListener('change', () => {
      this.updateAbilityTreesVisibility();
    });

    this.querySelector('.select-all-button').addEventListener('click', () => {
      this.querySelector('ability-tree-selector').selectAll();
    });

    // Make sure to update the visibility of the ability trees when we get access to the slotted elements.
    this.slotElement.addEventListener("slotchange", () => {
      this.updateAbilityTreesVisibility();
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
    let selectedValues = [];
    trees.forEach(tree => {
      const id = tree.getAttribute("id");
      if (talents[id]) {
        tree.importAbilitiesObject(talents[id]);
      }
      if (tree.isVisible()) {
        selectedValues.push(tree.id);
      }
    });
    this.querySelector('ability-tree-selector').setSelectedValues(selectedValues);
  }

  updateAbilityTreesVisibility() {
    const abilityTreeSelector = this.querySelector('ability-tree-selector');
    const selectedValues = abilityTreeSelector.getSelectedValues();
    const abilityTrees = this.querySelectorAll("ability-tree");

    abilityTrees.forEach(tree => {
      if (selectedValues.includes(tree.id)) {
        tree.show();
      } else {
        tree.hide();
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