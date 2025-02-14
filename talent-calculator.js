import './components/ability-tree-selector/ability-tree-selector.js';
import './components/ability-tree/ability-tree.js';
import './components/ability-pick/ability-pick.js';

import { APP_VERSION, REPO_URL, APP_URL } from './version.js';

class TalentCalculator extends HTMLElement {
  #level = 1;
  #abilityPoints = 2;
  #abilityStack = [];
  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: 'open' });

    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);

    this.slotElement = slot;
  }

  connectedCallback() {
    const output = this.querySelector('#export-output');
    this.querySelector('#export-button').addEventListener('click', () => {
      this.#export().then(build => {
        output.textContent = build;
      });
    });

    this.querySelector('#copy-output-button').addEventListener('click', () => {
      this.#copyToClipboard();
    });

    this.querySelector('#share-button').addEventListener('click', () => {
      this.#copyToClipboard(APP_URL+'?build=');
    });

    this.querySelector('#import-button').addEventListener('click', () => {
      const build = this.querySelector('#import-input').value;
      this.#import(build);
    });

    this.querySelector('ability-tree-selector').addEventListener('change', () => {
      this.#updateAbilityTreesVisibility();
    });

    this.querySelector('#select-all-button').addEventListener('click', () => {
      this.querySelector('ability-tree-selector').selectAll();
    });

    this.querySelector('#show-selected-button').addEventListener('click', () => {
      this.#showTreesWithObtainedAbilities();
    });

    // Make sure to update the visibility of the ability trees when we get access to the slotted elements.
    this.slotElement.addEventListener('slotchange', () => {
      this.#updateAbilityTreesVisibility();
    });


    this.#gtag('set', { 'app_version': APP_VERSION });

    const versionLink = this.querySelector('.app-header #app-version-link');
    versionLink.innerHTML=`${APP_VERSION}`;
    versionLink.href = REPO_URL;
    versionLink.addEventListener('click', () => {
      this.#gtag('event', 'click_version_link', {
        'repo_url': versionLink.href,
        'app_version': APP_VERSION
      });
    });
    
    const logoLink = this.querySelector('.app-header #stoneshard-logo-link');
    logoLink.href = APP_URL;
    logoLink.addEventListener('click', () => {
      this.#gtag('event', 'click_stoneshard_logo', {
        'repo_url': logoLink.href,
        'app_version': APP_VERSION
      });
    });

    // Track all button clicks.
    this.addEventListener('click', (e) => {
      if (e.target.matches('button')) {
        const buttonId = e.target.id;
        if (buttonId) {
          this.#gtag('event', 'button_click', {
            'button_id': buttonId,
            'app_version': APP_VERSION
          });
        }
      }
    });

    const abilities = this.querySelectorAll('ability-pick');
    abilities.forEach(ability => {
      ability.addEventListener('click', () => {
        ability.obtain(this.#level, this.#abilityPoints, this.#abilityStack);
      });

      ability.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        ability.refund(this.#level, this.#abilityPoints, this.#abilityStack);
      });
    });

    this.addEventListener('ability-tree-obtain', (event) => this.#handleAbilityTreeObtain(event));
    this.addEventListener('ability-tree-refund', () => this.#handleAbilityTreeRefund());

    const showLevelOrderCheckbox = this.querySelector('#show-level-order-checkbox');
    showLevelOrderCheckbox.addEventListener('click', () => this.#showLevelOrderOverlay(showLevelOrderCheckbox.checked));

    this.#importFromURL();
  }

  #handleAbilityTreeObtain(e) {
    this.#abilityStack.push(e.detail.id);
    this.#abilityPoints--;
    // When ability points become zero, we level up automatically for the user's convenience.
    if (this.#abilityPoints === 0) {
      this.#levelUp();
    }
  }

  #handleAbilityTreeRefund() {
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

  async #export() {
    if (this.#abilityStack.length === 0) {
      return '';
    }
    let talents = {version: APP_VERSION, order: this.#abilityStack};
    const json = JSON.stringify(talents);
    const compressedBytes = await this.#compress(json);
    return this.#bytesToBase64Url(compressedBytes);
  }

  #import(build) {
    if (build === '') return;

    const bytes = this.#base64UrlToBytes(build);
    this.#decompress(bytes).then(json => {
      const talents = JSON.parse(json);
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
