import './components/ability-tree-selector/ability-tree-selector.js';
import { AbilityTree } from './components/ability-tree/ability-tree.js';
import { AbilityPick } from './components/ability-pick/ability-pick.js';
import './components/stat-formula/stat-formula.js';
import './components/tooltip-description/tooltip-description.js';
import Character from './components/stat-formula/character.js';

import { APP_VERSION, APP_URL, REPO_NAME, REPO_OWNER } from './version.js';

class TalentCalculator extends HTMLElement {
  /** @type {Character} */
  #character = null;

  /**
   * Maps tree IDs (e.g. swords) to AbilityTree elements.
   * @type {Map<string, AbilityTree>}
   */
  #treeMap = new Map();
  #character = null;
  #levelDisplay = null;
  #statPointsDisplay = null;
  #strDisplay = null;
  #agiDisplay = null;
  #perDisplay = null;
  #vitDisplay = null;
  #wilDisplay = null;
  #abilityStack = [];
  #showLevelOrderCheckbox = null;
  constructor() {
    super();

    this.#character = new Character();

    let shadowRoot = this.attachShadow({ mode: 'open' });

    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
  }

  #buildTreeMap() {
    /** @type {NodeListOf<AbilityTree} */
    const trees = this.querySelectorAll('ability-tree');
    trees.forEach((tree) => {
      this.#treeMap.set(tree.getAttribute('id'), tree);
    });
  }

  #buildAbilityPickMap() {
    for (const tree of this.#treeMap.values()) {
      for (const [id, abilityPick] of tree.getAbilityMap()) {
        this.#abilityPickMap.set(id, abilityPick);
      }
    }
  }

  connectedCallback() {
    this.#gtag('set', { app_version: APP_VERSION });
    this.#buildTreeMap();
    this.#buildAbilityPickMap();

    const exportButton = this.querySelector('#export-button');
    this.#buttonClickWithAnalytics(exportButton, () => {
      this.#export(APP_VERSION).then((build) => {
        const output = this.querySelector('#export-output');
        output.textContent = build;
      });
    });

    const copyOutputButton = this.querySelector('#copy-output-button');
    this.#buttonClickWithAnalytics(copyOutputButton, () => {
      this.#copyToClipboard();
    });

    const shareButton = this.querySelector('#share-button');
    this.#buttonClickWithAnalytics(shareButton, () => {
      this.#copyToClipboard(APP_URL + '?build=');
    });

    const importButton = this.querySelector('#import-button');
    this.#buttonClickWithAnalytics(importButton, () => {
      const build = this.querySelector('#import-input').value;
      this.#import(build);
    });

    this.querySelector('ability-tree-selector').addEventListener('change', () => {
      this.#updateAbilityTreesVisibility();
    });

    const selectAllButton = this.querySelector('#select-all-button');
    this.#buttonClickWithAnalytics(selectAllButton, () => {
      this.querySelector('ability-tree-selector').selectAll();
    });

    const showSelectedButton = this.querySelector('#show-selected-button');
    this.#buttonClickWithAnalytics(showSelectedButton, () => {
      this.#showTreesWithObtainedAbilities();
    });

    // Make sure to update the visibility of the ability trees when we get access to the slotted elements.
    this.slotElement.addEventListener('slotchange', () => {
      this.#updateAbilityTreesVisibility();
    });

    const logoLink = this.querySelector('.app-header #stoneshard-logo-link');
    this.#setLinkWithAnalytics(logoLink, APP_URL);

    const repoUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
    const sponsorUrl = `https://github.com/sponsors/${REPO_OWNER}?o=esb`;
    const versionUrl = `${repoUrl}/releases`;
    const issuesUrl = `${repoUrl}/issues`;
    const manualUrl = `${repoUrl}?tab=readme-ov-file#usage`;

    const versionLink = this.querySelector('.app-header #app-version-link');
    versionLink.innerHTML = `${APP_VERSION}`;
    this.#setLinkWithAnalytics(versionLink, versionUrl);

    const sponsorLink = this.querySelector('nav #sponsor-link');
    this.#setLinkWithAnalytics(sponsorLink, sponsorUrl);

    const openIssueLink = this.querySelector('nav #open-issue-link');
    this.#setLinkWithAnalytics(openIssueLink, issuesUrl);

    const manualLink = this.querySelector('nav #manual-link');
    this.#setLinkWithAnalytics(manualLink, manualUrl);

    const patronsDialog = this.querySelector('nav #patrons-dialog');
    patronsDialog.addEventListener('click', (e) => {
      // Close modal only if we click outside the dialog.
      var rect = patronsDialog.getBoundingClientRect();
      var isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        patronsDialog.close();
      }
    });

    const patronsDialogConfirmButton = this.querySelector('#patrons-dialog button');
    patronsDialogConfirmButton.addEventListener('click', () => {
      patronsDialog.close();
    });

    const patronsButton = this.querySelector('nav #patrons-button');
    this.#buttonClickWithAnalytics(patronsButton, () => {
      patronsDialog.showModal();
    });

    this.addEventListener('ability-tree-obtain', (e) => this.#handleAbilityTreeObtain(e));
    this.addEventListener('ability-tree-refund', (e) => this.#handleAbilityTreeRefund(e));

    this.#showLevelOrderCheckbox = this.querySelector('#show-level-order-checkbox');
    this.#showLevelOrderCheckbox.addEventListener('click', () =>
      this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked),
    );
    // Hide level order overlay, if the checkbox is unchecked.
    this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked);

    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    showFormulasCheckbox.addEventListener('click', () => this.#showTooltipFormulas(showFormulasCheckbox.checked));

    this.#levelDisplay = this.querySelector('#level-display');
    this.#updateLevelDisplay();
    // this.addEventListener("level-up-request", () => {
    //   this.#levelUp()
    //   this.#updateLevelDisplay();
    //   this.#updateStatPointsDisplay();
    // });

    this.#statPointsDisplay = this.querySelector('#stat-points-display');
    this.#updateStatPointsDisplay();

    this.#strDisplay = this.querySelector('#str-display');
    this.#agiDisplay = this.querySelector('#agi-display');
    this.#perDisplay = this.querySelector('#per-display');
    this.#vitDisplay = this.querySelector('#vit-display');
    this.#wilDisplay = this.querySelector('#wil-display');
    this.#updateStatsDisplay();

    this.addEventListener("str-up-request", () => {
      this.#increaseStat(() => {this.#character.strength++;});
    });
    this.addEventListener("agi-up-request", () => {
      this.#increaseStat(() => {this.#character.agility++;});
    });
    this.addEventListener("per-up-request", () => {
      this.#increaseStat(() => {this.#character.perception++;});
    });
    this.addEventListener("vit-up-request", () => {
      this.#increaseStat(() => {this.#character.vitality++;});
    });
    this.addEventListener("wil-up-request", () => {
      this.#increaseStat(() => {this.#character.willpower++;});
    });

    this.#importFromURL();
  }

  #increaseStat(increaseStatCallback) {
    if (this.#character.statPoints === 0) {
        return;
      }
      this.#character.statPoints--;
      this.#updateStatPointsDisplay();
      increaseStatCallback();
      this.#updateStatsDisplay();
  }

  #updateStatPointsDisplay() {
    this.#statPointsDisplay.textContent = this.#character.statPoints;
    if (this.#character.statPoints === 0) {
      this.querySelectorAll('.plus-button:not(#level-up-button)').forEach(statButton => {
        statButton.style.visibility = 'hidden';
      });
    } else {
      this.querySelectorAll(".plus-button:not(#level-up-button)").forEach(statButton => {
        statButton.style.visibility = 'visible';
      });
    }
  }

  #updateLevelDisplay() {
    this.#levelDisplay.textContent = this.#character.level;
  }

  #updateStatsDisplay() {
    this.#strDisplay.textContent = this.#character.strength;
    this.#agiDisplay.textContent = this.#character.agility;
    this.#perDisplay.textContent = this.#character.perception;
    this.#vitDisplay.textContent = this.#character.vitality;
    this.#wilDisplay.textContent = this.#character.willpower;
  }

  #buttonClickWithAnalytics(button, callback = () => {}) {
    button.addEventListener('click', () => {
      callback();
      this.#gtag('event', 'button_click', {
        button_id: button.Id,
        app_version: APP_VERSION,
      });
    });
  }

  #setLinkWithAnalytics(link, url, callback = () => {}) {
    link.href = url;
    link.addEventListener('click', () => {
      callback();
      this.#gtag('event', 'link_click', {
        link_id: link.id,
        link_url: link.href,
        app_version: APP_VERSION,
      });
    });
  }

  #handleAbilityTreeObtain(e) {
    if (this.#character.abilityPoints === 0) {
      return;
    }

    const abilityId = e.detail.id;
    const treeId = e.detail.treeId;

    const tree = this.#treeMap.get(treeId);
    const ability = tree.getAbilityMap().get(abilityId);
    ability.obtained = true;
    ability.setLevelObtainedAt(this.#character.level);

    this.#abilityStack.push(abilityId);
    this.#character.abilityPoints--;
    // When ability points become zero, we level up automatically for the user's convenience.
    if (this.#character.abilityPoints === 0) {
      this.#levelUp();
      this.#updateLevelDisplay();
      this.#updateStatPointsDisplay();
    }
  }

  #handleAbilityTreeRefund(e) {
    const abilityId = e.detail.id;
    const treeId = e.detail.treeId;

    const tree = this.#treeMap.get(treeId);
    const ability = tree.getAbilityMap().get(abilityId);
    ability.obtained = false;
    ability.setLevelObtainedAt();

    this.#abilityStack.pop();
    this.#character.abilityPoints++;
    if (this.#character.abilityPoints === 2) {
      this.#levelDown();
      this.#updateLevelDisplay();
      this.#updateStatPointsDisplay();
    }
  }

  #levelUp() {
    if (this.#character.level === 30) {
      return;
    }
    this.#character.level++;
    this.#character.abilityPoints++;
    this.#character.statPoints++;
  }

  #levelDown() {
    if (this.#character.level === 1) {
      return;
    }
    this.#character.level--;
    this.#character.abilityPoints--;
    this.#character.statPoints--;
  }

  #showLevelOrderOverlay(show) {
    /** @type {NodeListOf<AbilityPick>} */
    const abilities = this.querySelectorAll('ability-pick');
    abilities.forEach((ability) => {
      if (show) {
        ability.showOverlayText();
      } else {
        ability.hideOverlayText();
      }
    });
  }

  #showTooltipFormulas(show) {
    const statFormulas = this.querySelectorAll('stat-formula');
    statFormulas.forEach((statFormula) => {
      if (show) {
        statFormula.showFormula();
      } else {
        statFormula.hideFormula();
      }
    });
  }

  #updateAbilityTreesVisibility() {
    const abilityTreeSelector = this.querySelector('ability-tree-selector');
    const selectedValues = abilityTreeSelector.getSelectedValues();
    const abilityTrees = this.querySelectorAll('ability-tree');

    abilityTrees.forEach((tree) => {
      if (selectedValues.includes(tree.id)) {
        tree.show();
      } else {
        tree.hide();
      }
    });
  }

  #copyToClipboard(prefix = '') {
    const output = this.querySelector('#export-output');
    output.select();
    output.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(prefix + output.value);
  }

  async #export(appVersion) {
    if (this.#abilityStack.length === 0) {
      return '';
    }
    let talents = {
      version: appVersion,
      showOrder: this.#showLevelOrderCheckbox.checked,
      order: this.#abilityStack,
    };
    const json = JSON.stringify(talents);
    const compressedBytes = await this.#compress(json);
    return this.#bytesToBase64Url(compressedBytes);
  }

  #import(build) {
    if (build === '') return;

    const bytes = this.#base64UrlToBytes(build);
    this.#decompress(bytes).then((json) => {
      const talents = JSON.parse(json);
      if ('showOrder' in talents) {
        this.#showLevelOrderCheckbox.checked = talents.showOrder;
        this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked);
      }
      const abilityOrder = talents.order;
      // Replay clicking all abilities in order.
      abilityOrder.forEach((abilityId) => {
        const abilityPick = this.querySelector(`#${abilityId}`);
        abilityPick.click();
      });
      this.#showTreesWithObtainedAbilities();
    });
  }

  #showTreesWithObtainedAbilities() {
    const trees = this.querySelectorAll('ability-tree');
    let selectedValues = [];
    trees.forEach((tree) => {
      tree.showTreeIfAnyAbilityIsObtained();
      if (tree.isVisible()) {
        selectedValues.push(tree.id);
      }
    });
    this.querySelector('ability-tree-selector').setSelectedValues(selectedValues);
  }

  #gtag(...args) {
    if (typeof gtag === 'function') {
      gtag(...args);
    } else {
      console.warn('Google Analytics (gtag library) not found.');
    }
  }

  #importFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encodedBuild = params.get('build');
    if (encodedBuild) {
      this.#import(encodedBuild);
      this.#gtag('event', 'build_view', {
        build_code: encodedBuild,
        app_version: APP_VERSION,
      });
    }
  }

  #bytesToBase64Url(bytes) {
    return btoa(Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  #base64UrlToBytes(str) {
    const m = str.length % 4;
    return Uint8Array.from(
      atob(
        str
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(str.length + (m === 0 ? 0 : 4 - m), '='),
      ),
      (c) => c.charCodeAt(0),
    ).buffer;
  }

  // Compress and decompress functions from https://evanhahn.com/javascript-compression-streams-api-with-strings/

  /**
   * Convert a string to its UTF-8 bytes and compress it.
   *
   * @param {string} str
   * @returns {Promise<Uint8Array>}
   */
  async #compress(str) {
    // Convert the string to a byte stream.
    const stream = new Blob([str]).stream();

    // Create a compressed stream.
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of compressedStream) {
      chunks.push(chunk);
    }
    return await this.#concatUint8Arrays(chunks);
  }

  /**
   * Decompress bytes into a UTF-8 string.
   *
   * @param {Uint8Array} compressedBytes
   * @returns {Promise<string>}
   */
  async #decompress(compressedBytes) {
    // Convert the bytes to a stream.
    const stream = new Blob([compressedBytes]).stream();

    // Create a decompressed stream.
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));

    // Read all the bytes from this stream.
    const chunks = [];
    for await (const chunk of decompressedStream) {
      chunks.push(chunk);
    }
    const stringBytes = await this.#concatUint8Arrays(chunks);

    // Convert the bytes to a string.
    return new TextDecoder().decode(stringBytes);
  }

  /**
   * Combine multiple Uint8Arrays into one.
   *
   * @param {ReadonlyArray<Uint8Array>} uint8arrays
   * @returns {Promise<Uint8Array>}
   */
  async #concatUint8Arrays(uint8arrays) {
    const blob = new Blob(uint8arrays);
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

customElements.define('talent-calculator', TalentCalculator);

window.addEventListener("DOMContentLoaded", () => {
  const calculator = document.querySelector("talent-calculator");

  // const levelUpButton = document.getElementById("level-up-button");
  // levelUpButton.addEventListener("click", () => {
  //   calculator.dispatchEvent(new CustomEvent("level-up-request"));
  // });

  const upStrButton = document.getElementById("up-str-button");
  upStrButton.addEventListener("click", () => {
    calculator.dispatchEvent(new CustomEvent("str-up-request"));
  });
  const upAgiButton = document.getElementById("up-agi-button");
  upAgiButton.addEventListener("click", () => {
    calculator.dispatchEvent(new CustomEvent("agi-up-request"));
  });
  const upPerButton = document.getElementById("up-per-button");
  upPerButton.addEventListener("click", () => {
    calculator.dispatchEvent(new CustomEvent("per-up-request"));
  });
  const upVitButton = document.getElementById("up-vit-button");
  upVitButton.addEventListener("click", () => {
    calculator.dispatchEvent(new CustomEvent("vit-up-request"));
  });
  const upWilButton = document.getElementById("up-wil-button");
  upWilButton.addEventListener("click", () => {
    calculator.dispatchEvent(new CustomEvent("wil-up-request"));
  });
});