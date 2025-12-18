import './components/ability-tree-selector/ability-tree-selector.js';
import { AbilityTree } from './components/ability-tree/ability-tree.js';
import { AbilityPick } from './components/ability-pick/ability-pick.js';
import './components/stat-formula/stat-formula.js';
import './components/tooltip-description/tooltip-description.js';

import Character from './components/stat-formula/character.js';

import { APP_VERSION, APP_URL, REPO_NAME, REPO_OWNER } from './version.js';

/**
 * @typedef {typeof Character.Stats[keyof typeof Character.Stats]} StatConstValue
 */

/**
 * @typedef {Object} StatStackEntry
 * @property {number} level - The character level when this stat was increased.
 * @property {StatConstValue} stat - The increased stat.
 */

class TalentCalculator extends HTMLElement {
  /** @type {Character} */
  #character = null;

  /**
   * Maps tree IDs (e.g. swords) to AbilityTree elements.
   * @type {Map<string, AbilityTree>}
   */
  #treeMap = new Map();

  /**
   * Maps ability IDs (e.g. swords-1) to AbilityPick elements.
   * @type {Map<string, AbilityPick>}
   */
  #abilityPickMap = new Map();

  #levelDisplay = null;
  #statPointsDisplay = null;
  #strDisplay = null;
  #agiDisplay = null;
  #perDisplay = null;
  #vitDisplay = null;
  #wilDisplay = null;
  /** @type {StatStackEntry[]} */
  #statStack = [];
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
    trees.forEach(tree => {
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
    this.#gtag('set', { 'app_version': APP_VERSION });
    this.#buildTreeMap();
    this.#buildAbilityPickMap();

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

    this.addEventListener("str-up-request", () => {this.#increaseStat(Character.Stats.STR)});
    this.addEventListener("agi-up-request", () => {this.#increaseStat(Character.Stats.AGI)});
    this.addEventListener("per-up-request", () => {this.#increaseStat(Character.Stats.PER)});
    this.addEventListener("vit-up-request", () => {this.#increaseStat(Character.Stats.VIT)});
    this.addEventListener("wil-up-request", () => {this.#increaseStat(Character.Stats.WIL)});

    this.querySelectorAll('stat-formula').forEach(statFormula => statFormula.character = this.#character);
    this.querySelectorAll('ability-pick').forEach(abilityPick => {
      abilityPick.character = this.#character;
      abilityPick.createTooltip();
      abilityPick.initAllFormulas();
    });

    this.#importFromURL();
  }

  /**
   * @param {StatConstValue} stat
   */
  #increaseStat(stat) {
    if (this.#character.statPoints === 0) {
        return;
      }
      this.#character.statPoints--;
      this.#updateStatPointsDisplay();

      switch (stat) {
        case Character.Stats.STR: this.#character.strength++; break;
        case Character.Stats.AGI: this.#character.agility++; break;
        case Character.Stats.PER: this.#character.perception++; break;
        case Character.Stats.VIT: this.#character.vitality++; break;
        case Character.Stats.WIL: this.#character.willpower++; break;
      }

      this.#statStack.push({
        level: this.#character.level,
        stat: stat,
      });

      this.#updateStatsDisplay();
      this.#updateStatIncreaseDisplay();
      this.#updateAllFormulas();
  }

  #updateStatPointsDisplay() {
    this.#statPointsDisplay.textContent = this.#character.statPoints;
    if (this.#character.statPoints === 0) {
      this.querySelectorAll('.plus-button:not(#level-up-button)').forEach(statButton => {
        statButton.style.visibility = 'hidden';
      });
    } else {
      this.querySelectorAll(".plus-button:not(#level-up-button)").forEach(statButton => {
        if (this.#character.strength === 30 && statButton.id === 'up-str-button') return;
        if (this.#character.agility === 30 && statButton.id === 'up-agi-button') return;
        if (this.#character.perception === 30 && statButton.id === 'up-per-button') return;
        if (this.#character.vitality === 30 && statButton.id === 'up-vit-button') return;
        if (this.#character.willpower === 30 && statButton.id === 'up-wil-button') return;
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

  #updateStatIncreaseDisplay() {
    const makeStatIncreaseTemplate = (level, stat) => {
      return `<p class="stat-increase"><span>Lvl <span class="stat-increase-level">${level}</span></span> <span class="stat-increase-${stat.toLowerCase()}">${stat.toUpperCase()} <span class="up">⬆</span></span></p>`;
    }
    const statIncreaseDisplay = this.querySelector('.stat-increase-order');
    statIncreaseDisplay.innerHTML = this.#statStack.map(entry => makeStatIncreaseTemplate(entry.level, entry.stat))
      .join('');
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
    this.#setLevelAndAbilityPoints();
    this.#setLevelOrderForObtainedAbilities();
    this.#updateLevelDisplay();
    this.#updateStatPointsDisplay();
    
    if (abilityId === 'shields-8') this.#character.retaliation = 1.5;
    this.#updateShieldFormulas();
    this.#updateOpenWeaponSkills(abilityId, () => this.#character.openWeaponSkills++);
  }

  #handleAbilityTreeRefund(e) {
    const abilityId = e.detail.id;
    const treeId = e.detail.treeId;

    const tree = this.#treeMap.get(treeId);
    const ability = tree.getAbilityMap().get(abilityId);
    ability.obtained = false;
    ability.setLevelObtainedAt();

    this.#removeFromAbilityStackIncludingChildren(abilityId);
    this.#setLevelAndAbilityPoints();
    this.#setLevelOrderForObtainedAbilities();
    this.#updateLevelDisplay();
    this.#updateStatPointsDisplay();
    this.#updateStatsDisplay();
    this.#updateStatIncreaseDisplay();
    this.#updateAllFormulas();
    
    if (abilityId === 'shields-8') this.#character.retaliation = 1;
    this.#updateShieldFormulas();
    this.#updateOpenWeaponSkills(abilityId, () => this.#character.openWeaponSkills--);
  }

  /**
   * The level and ability points are calculated by looping the obtained abilities and implementing the following rules:
   * 
   * - The character starts at level 1 with 2 ability points.
   * - Every level up, the character gets 1 ability point.
   * - When an ability is obtained, the character spends 1 ability point.
   * - For the user's convenience, when ability points reach 0, the character levels up automatically.
   */
  #setLevelAndAbilityPoints() {
    let abilityPoints = 2;
    let level = 1;
    this.#abilityStack.forEach(abilityId => {
      abilityPoints--;
      if (abilityPoints === 0) {
        level++;
        abilityPoints++;
      }
    });
    this.#character.level = level;
    this.#character.abilityPoints = abilityPoints;
  }

  /**
   * @param {string} abilityId 
   */
  #removeFromAbilityStackIncludingChildren(abilityId) {
    const rootAbilityPick = this.#abilityPickMap.get(abilityId);
    if (!rootAbilityPick) return;

    // Gather all ability IDs to remove in a Set, including children and their children.
    const abilityIdsToRemove = new Set([abilityId]);

    // Use a stack to keep track of any children to be removed.
    const stack = [rootAbilityPick];
    while (stack.length > 0) {
      const pick = stack.pop();

      for (const childId of pick.childIds) {
        if (!this.#abilityStack.includes(childId)) continue; // We only consider children that are currently obtained.
        if (abilityIdsToRemove.has(childId)) continue; // Avoid looping the same children.

        abilityIdsToRemove.add(childId);

        const childPick = this.#abilityPickMap.get(childId);
        if (childPick) stack.push(childPick);
      }
    }

    this.#abilityStack = this.#abilityStack.filter(id => !abilityIdsToRemove.has(id));

    for (const id of abilityIdsToRemove) {
      const abilityPick = this.#abilityPickMap.get(id);
      if (!abilityPick) continue;
      abilityPick.obtained = false;
      abilityPick.setLevelObtainedAt();
    }
  }

  /**
   * Adjust the level order overlay of all abilities. 
   * Useful when we refund one or more abilities.
   */
  #setLevelOrderForObtainedAbilities() {
    let levelOrder = 0;
    this.#abilityStack.forEach(abilityId => {
      const abilityPick = this.#abilityPickMap.get(abilityId);
      abilityPick.setLevelObtainedAt(levelOrder === 0 ? 1 : levelOrder);
      levelOrder++;
    });
  }

  #updateAllFormulas() {
    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    this.querySelectorAll('ability-pick').forEach(abilityPick => abilityPick.evalAllFormulas(showFormulasCheckbox.checked));
  }

  #updateShieldFormulas() {
    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    this.querySelectorAll('#shields-3, #shields-6').forEach(abilityPick => abilityPick.evalAllFormulas(showFormulasCheckbox.checked));
  }

  #updateOpenWeaponSkills(abilityId, callback) {
    let correctWeaponryTypes = [
      'swords',
      'axes',
      'daggers',
      'maces'
    ]
    correctWeaponryTypes.forEach(correctWeaponryType => {
      if (abilityId.startsWith(correctWeaponryType)) {
        callback();
      }
    });
    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    const rightOnTargetAbilityPick = this.querySelector('#warfare-5');
    rightOnTargetAbilityPick.evalAllFormulas(showFormulasCheckbox.checked);
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
    const currentLevel = this.#character.level;
    this.#character.level--;
    this.#character.abilityPoints--;

    let statsToDecrease = this.#statStack.filter(entry => entry.level == currentLevel);
    statsToDecrease.forEach(statToDecrease => {
      switch (statToDecrease.stat) {
        case Character.Stats.STR: this.#character.strength--; break;
        case Character.Stats.AGI: this.#character.agility--; break;
        case Character.Stats.PER: this.#character.perception--; break;
        case Character.Stats.VIT: this.#character.vitality--; break;
        case Character.Stats.WIL: this.#character.willpower--; break;
      }
      this.#character.statPoints++;
    });
    this.#statStack = this.#statStack.filter(entry => entry.level < currentLevel);

    if (this.#character.statPoints === 0) {
      return;
    }
    this.#character.statPoints--;
  }

  #showLevelOrderOverlay(show) {
    /** @type {NodeListOf<AbilityPick>} */
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
      statOrder: this.#statStack,
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
      const statOrder = talents.statOrder;
      // Replay clicking all abilities in order.
      abilityOrder.forEach(abilityId => {
        const abilityPick = this.querySelector(`#${abilityId}`);
        abilityPick.click();
        // Replay clicking each stat to increase per level.
        const levelDisplay = this.querySelector('#level-display');
        let currentLevel = levelDisplay.textContent;
        if (currentLevel === '1') return;
        let statsToIncrease = statOrder.filter(entry => entry.level == currentLevel);
        statsToIncrease.forEach(statToIncrease => {
          switch (statToIncrease.stat) {
            case Character.Stats.STR: this.querySelector('#up-str-button').click(); break;
            case Character.Stats.AGI: this.querySelector('#up-agi-button').click(); break;
            case Character.Stats.PER: this.querySelector('#up-per-button').click(); break;
            case Character.Stats.VIT: this.querySelector('#up-vit-button').click(); break;
            case Character.Stats.WIL: this.querySelector('#up-wil-button').click(); break;
          }
        });
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
