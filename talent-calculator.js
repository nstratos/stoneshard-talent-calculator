import './components/ability-tree-selector/ability-tree-selector.js';
import './components/ability-tree/ability-tree.js';
import './components/ability-pick/ability-pick.js';
import './components/stat-formula/stat-formula.js';
import './components/tooltip-description/tooltip-description.js';

import { APP_VERSION, APP_URL, REPO_NAME, REPO_OWNER } from './version.js';

class TalentCalculator extends HTMLElement {
  #treeMap = new Map();
  #level = 1;
  #abilityPoints = 2;
  #abilityStack = [];
  #showLevelOrderCheckbox = null;
  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: 'open' });

    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
  }

  #buildTreeMap() {
    const trees = this.querySelectorAll('ability-tree');
    trees.forEach(tree => {
      this.#treeMap.set(tree.getAttribute('id'), tree);
    });
  }

  connectedCallback() {
    this.#gtag('set', { 'app_version': APP_VERSION });
    this.#buildTreeMap();

    const exportButton = this.querySelector('#export-button');
    this.#buttonClickWithAnalytics(exportButton, () => {
      this.#export(APP_VERSION).then(build => {
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
      this.#copyToClipboard(APP_URL+'?build=');
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
    versionLink.innerHTML=`${APP_VERSION}`;
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
      var isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        patronsDialog.close();
      }
    });

    const patronsDialogConfirmButton = this.querySelector('#patrons-dialog button')
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
    this.#showLevelOrderCheckbox.addEventListener('click', () => this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked));
    // Hide level order overlay, if the checkbox is unchecked.
    this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked);

    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    showFormulasCheckbox.addEventListener('click', () => this.#showTooltipFormulas(showFormulasCheckbox.checked));

    this.#importFromURL();
  }

  #buttonClickWithAnalytics(button, callback = () => {}) {
    button.addEventListener('click', () => {
      callback();
      this.#gtag('event', 'button_click', {
        'button_id': button.Id,
        'app_version': APP_VERSION
      });
    });
  }

  #setLinkWithAnalytics(link, url, callback = () => {}) {
    link.href = url;
    link.addEventListener('click', () => {
      callback();
      this.#gtag('event', 'link_click', {
        'link_id': link.id,
        'link_url': link.href,
        'app_version': APP_VERSION
      });
    });
  }

  #handleAbilityTreeObtain(e) {
    if (this.#abilityPoints === 0) {
      return;
    }

    const abilityId = e.detail.id;
    const treeId = e.detail.treeId;

    const tree = this.#treeMap.get(treeId);
    const ability = tree.getAbilityMap().get(abilityId);
    ability.obtained = true;
    ability.setLevelObtainedAt(this.#level);

    this.#abilityStack.push(abilityId);
    this.#abilityPoints--;
    // When ability points become zero, we level up automatically for the user's convenience.
    if (this.#abilityPoints === 0) {
      this.#levelUp();
    }
  }

  #handleAbilityTreeRefund(e) {
    const abilityId = e.detail.id;
    const treeId = e.detail.treeId;
    // We only allow to refund the last obtained ability from the top of the stack.
    const lastAbilityId = this.#abilityStack[this.#abilityStack.length - 1];
    if (lastAbilityId !== abilityId) {
      return;
    }

    const tree = this.#treeMap.get(treeId);
    const ability = tree.getAbilityMap().get(abilityId);
    ability.obtained = false;
    ability.setLevelObtainedAt();

    this.#abilityStack.pop();
    this.#abilityPoints++;
    if (this.#abilityPoints === 2) {
      this.#levelDown();
    }
  }

  #levelUp() {
    if (this.#level === 30) {
      return;
    }
    this.#level++;
    this.#abilityPoints++;
  }

  #levelDown() {
    if (this.#level === 1) {
      return;
    }
    this.#level--;
    this.#abilityPoints--;
  }

  #showLevelOrderOverlay(show) {
    const abilities = this.querySelectorAll('ability-pick');
    abilities.forEach(ability => {
      if (show) {
        ability.showOverlayText();
      } else {
        ability.hideOverlayText();
      }
    });
  }

  #showTooltipFormulas(show) {
    const statFormulas = this.querySelectorAll('stat-formula');
    statFormulas.forEach(statFormula => {
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

    abilityTrees.forEach(tree => {
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
    navigator.clipboard.writeText(prefix+output.value);
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
    this.#decompress(bytes).then(json => {
      const talents = JSON.parse(json);
      if ('showOrder' in talents) {
        this.#showLevelOrderCheckbox.checked = talents.showOrder;
        this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked);
      }
      const abilityOrder = talents.order;
      // Replay clicking all abilities in order.
      abilityOrder.forEach(abilityId => {
        const abilityPick = this.querySelector(`#${abilityId}`);
        abilityPick.click();
      });
      this.#showTreesWithObtainedAbilities();
    });
  }

  #showTreesWithObtainedAbilities() {
    const trees = this.querySelectorAll('ability-tree');
    let selectedValues = [];
    trees.forEach(tree => {
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
        'build_code': encodedBuild,
        'app_version': APP_VERSION
      });
    }
  }

  #bytesToBase64Url(bytes) {
    return btoa(Array.from(new Uint8Array(bytes), b => String.fromCharCode(b)).join(''))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  
  #base64UrlToBytes(str) {
    const m = str.length % 4;
    return Uint8Array.from(atob(str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(str.length + (m === 0 ? 0 : 4 - m), '=')
    ), c => c.charCodeAt(0)).buffer;
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
    const compressedStream = stream.pipeThrough(
      new CompressionStream('gzip')
    );

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
    const decompressedStream = stream.pipeThrough(
      new DecompressionStream('gzip')
    );
  
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

customElements.define('talent-calculator', TalentCalculator)
