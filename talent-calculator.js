import './components/ability-tree-selector/ability-tree-selector.js';
import { AbilityTree } from './components/ability-tree/ability-tree.js';
import { AbilityPick } from './components/ability-pick/ability-pick.js';
import './components/stat-formula/stat-formula.js';
import './components/tooltip-description/tooltip-description.js';

import Character from './calculator/character.js';
import { STATS, STAT_RULES } from './calculator/stats.js';
import BuildLedger from './calculator/build-ledger.js';

import { APP_VERSION, APP_URL, REPO_NAME, REPO_OWNER } from './version.js';

/**
 * @typedef {import('./calculator/stats.js').StatKey} StatKey
 */

/**
 * Convenience-only soft cap for auto-leveling when AP gets to 0.
 * Not a hard level cap. Users can still level past this manually.
 *
 * @constant
 * @type {number}
 */
const AUTO_LEVEL_SOFT_CAP = 30;

class TalentCalculator extends HTMLElement {
  /** @type {string} */
  #profileId = 'custom';

  /** @type {Character} */
  #character = null;

  /** @type {BuildLedger} */
  #ledger = null;

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

  /** @type {HTMLElement} */
  #levelDisplay = null;

  /** @type {HTMLElement} */
  #levelIncButton = null;

  /** @type {HTMLElement} */
  #levelDecButton = null;

  /** @type {HTMLElement} */
  #abilityPointsDisplay = null;

  /** @type {HTMLElement} */
  #statPointsDisplay = null;

  /** @type {HTMLElement} */
  #strDisplay = null;

  /** @type {HTMLElement} */
  #agiDisplay = null;

  /** @type {HTMLElement} */
  #perDisplay = null;

  /** @type {HTMLElement} */
  #vitDisplay = null;

  /** @type {HTMLElement} */
  #wilDisplay = null;

  /** @type {HTMLElement} */
  #showLevelOrderCheckbox = null;

  /** @type {((e: MouseEvent) => void) | null} */
  #onAdjustClickBound = null;

  constructor() {
    super();

    this.#character = new Character();

    // Starting with 3 stat points to support pre-made characters.
    this.#ledger = new BuildLedger(3);

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
    this.#showLevelOrderCheckbox.addEventListener('change', () =>
      this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked),
    );
    // Hide level order overlay, if the checkbox is unchecked.
    this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked);

    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    showFormulasCheckbox.addEventListener('change', () =>
      this.#showTooltipFormulas(showFormulasCheckbox.checked),
    );

    this.#levelDisplay = this.querySelector('#level-output');
    this.#updateLevelDisplay();

    this.#statPointsDisplay = this.querySelector('#stat-points-display');
    this.#updateStatPointsDisplay();

    this.#abilityPointsDisplay = this.querySelector('#ability-points-display');
    this.#updateAbilityPointsDisplay();

    this.#strDisplay = this.querySelector('#str-display');
    this.#agiDisplay = this.querySelector('#agi-display');
    this.#perDisplay = this.querySelector('#per-display');
    this.#vitDisplay = this.querySelector('#vit-display');
    this.#wilDisplay = this.querySelector('#wil-display');
    this.#updateStatsDisplay();

    this.#levelIncButton = this.querySelector('button[data-scope="level"][data-action="inc"]');
    this.#levelDecButton = this.querySelector('button[data-scope="level"][data-action="dec"]');

    if (!this.#onAdjustClickBound) {
      this.#onAdjustClickBound = this.#onAdjustClick.bind(this);
      this.addEventListener('click', this.#onAdjustClickBound);
    }

    this.querySelectorAll('stat-formula').forEach(
      (statFormula) => (statFormula.character = this.#character),
    );
    this.querySelectorAll('ability-pick').forEach((abilityPick) => {
      abilityPick.character = this.#character;
      abilityPick.createTooltip();
      abilityPick.initAllFormulas();
    });

    this.#importFromURL();
  }

  disconnectedCallback() {
    if (this.#onAdjustClickBound) {
      this.removeEventListener('click', this.#onAdjustClickBound);
      this.#onAdjustClickBound = null;
    }
  }

  /**
   * Handles click events for stat and level adjustment buttons.
   *
   * Expected targets are buttons with:
   * - data-action="inc" | "dec"
   * - data-scope="stat" | "level"
   * - data-stat="str" | "agi" | ... (only for stats)
   *
   * @param {MouseEvent} e
   */
  #onAdjustClick(e) {
    const btn = e.target.closest('button[data-action][data-scope]');
    if (!btn || !this.contains(btn)) return;
    if (btn.disabled) return;

    const { action, scope, stat } = btn.dataset;

    if (scope === 'level') {
      action === 'inc' ? this.#requestLevelUp() : this.#requestLevelDown();
      return;
    }

    if (scope === 'stat') {
      action === 'inc' ? this.#requestStatUp(stat) : this.#requestStatDown(stat);
      return;
    }
  }

  #requestLevelUp() {
    const res = this.#ledger.levelUp();
    if (!res.ok) return;
    this.#refreshAfterLedgerChange();
  }

  #requestLevelDown() {
    const res = this.#ledger.levelDown();
    if (!res.ok) return;
    this.#refreshAfterLedgerChange();
  }

  /** @param {StatKey} stat */
  #requestStatUp(stat) {
    const res = this.#ledger.addStat(stat);
    if (!res.ok) return;
    this.#refreshAfterLedgerChange();
  }

  /** @param {StatKey} stat */
  #requestStatDown(stat) {
    const res = this.#ledger.refundStat(stat);
    if (!res.ok) return;
    this.#refreshAfterLedgerChange();
  }

  /**
   * @param {HTMLElement} el
   * @returns {StatKey}
   */
  #getStatKey(el) {
    const stat = el.dataset.stat;
    if (stat == null) throw new Error('Missing data-stat');
    return /** @type {any} */ (stat);
  }

  #updateStatPointsDisplay() {
    const remainingStatPoints = this.#ledger.remainingStatPoints;
    this.#statPointsDisplay.textContent = remainingStatPoints;

    const statIncButtons = this.querySelectorAll('button[data-scope="stat"][data-action="inc"]');
    const statDecButtons = this.querySelectorAll('button[data-scope="stat"][data-action="dec"]');

    const allocatedStats = this.#ledger.getAllocatedStats();

    statIncButtons.forEach((btn) => {
      /** @type {StatKey} */
      const stat = this.#getStatKey(btn);

      const currentValue = this.#character.getBaseStat(stat) + (allocatedStats[stat] ?? 0);

      btn.disabled = remainingStatPoints === 0 || currentValue >= STAT_RULES.MAX_VALUE;
    });

    statDecButtons.forEach((btn) => {
      /** @type {StatKey} */
      const stat = this.#getStatKey(btn);

      btn.disabled = (allocatedStats[stat] ?? 0) === 0;
    });
  }

  #updateAbilityPointsDisplay() {
    this.#abilityPointsDisplay.textContent = this.#ledger.remainingAbilityPoints;
  }

  #updateLevelDisplay() {
    this.#levelDisplay.textContent = this.#ledger.level;

    if (this.#levelIncButton) {
      this.#levelIncButton.disabled = false;
    }

    if (this.#levelDecButton) {
      this.#levelDecButton.disabled = !this.#ledger.canLevelDown();
    }
  }

  #updateStatsDisplay() {
    this.#strDisplay.textContent =
      this.#character.getBaseStat(STATS.STR) + this.#ledger.getAllocatedStat(STATS.STR);
    this.#agiDisplay.textContent =
      this.#character.getBaseStat(STATS.AGI) + this.#ledger.getAllocatedStat(STATS.AGI);
    this.#perDisplay.textContent =
      this.#character.getBaseStat(STATS.PER) + this.#ledger.getAllocatedStat(STATS.PER);
    this.#vitDisplay.textContent =
      this.#character.getBaseStat(STATS.VIT) + this.#ledger.getAllocatedStat(STATS.VIT);
    this.#wilDisplay.textContent =
      this.#character.getBaseStat(STATS.WIL) + this.#ledger.getAllocatedStat(STATS.WIL);
  }

  #updateStatIncreaseDisplay() {
    const makeStatIncreaseTemplate = (level, statKey) => {
      const token = statKey.toLowerCase();
      const abbr = statKey;

      return `<p class="stat-increase">
        <span>Lvl <span class="stat-increase-level">${level}</span></span>
        <span class="stat-increase-${token}">${abbr} <span class="up">⬆</span></span>
      </p>`;
    };

    const statIncreaseDisplay = this.querySelector('.stat-increase-order');
    const statEntries = this.#ledger.getStatIncreasesInOrder();

    statIncreaseDisplay.innerHTML = statEntries
      .map((entry) => makeStatIncreaseTemplate(entry.level, entry.stat))
      .join('');
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
    const abilityId = e.detail.id;

    let result = this.#ledger.addAbility(abilityId);

    // Convenience: if user tries to obtain with 0 AP, auto-level up once and retry.
    if (!result.ok && result.reason === 'no-ability-points') {
      if (this.#ledger.level < AUTO_LEVEL_SOFT_CAP) {
        this.#ledger.levelUp();
        result = this.#ledger.addAbility(abilityId);
      }
    }

    if (!result.ok) {
      console.warn('addAbility failed:', result);
      return;
    }

    const ability = this.#abilityPickMap.get(abilityId);
    if (!ability) return;

    ability.obtained = true;
    ability.setLevelObtainedAt(this.#ledger.level);

    this.#applyAbilitySideEffects(abilityId);

    this.#setLevelOrderForObtainedAbilities();
    this.#refreshAfterLedgerChange();
  }

  #handleAbilityTreeRefund(e) {
    const abilityId = e.detail.id;

    const res = this.#refundAbilityIncludingChildren(abilityId);
    if (!res.ok) return;

    this.#syncAbilityPicksFromLedger();
    this.#recomputeCharacterFromLedger();
    this.#refreshAfterLedgerChange();
  }

  /**
   * Refresh everything after a ledger change.
   */
  #refreshAfterLedgerChange() {
    this.#updateLevelDisplay();
    this.#updateAbilityPointsDisplay();
    this.#updateStatPointsDisplay();
    this.#updateStatsDisplay();
    this.#updateStatIncreaseDisplay();
    this.#updateAllFormulas();
  }

  /**
   * Applies derived character effects for a single obtained ability.
   * Must be safe to call during recompute.
   * @param {string} abilityId
   */
  #applyEffectsForAbility(abilityId) {
    if (abilityId === 'shields-8') {
      this.#character.retaliation = 1.5;
    }
    this.#updateOpenWeaponSkills(abilityId, () => this.#character.openWeaponSkills++);
  }

  /**
   * @param {string} abilityId
   */
  #applyAbilitySideEffects(abilityId) {
    this.#applyEffectsForAbility(abilityId);
    this.#updateShieldFormulas();
  }

  #refreshFromLedger() {
    this.#syncAbilityPicksFromLedger();

    this.#recomputeCharacterFromLedger();

    this.#refreshAfterLedgerChange();
    this.#showTreesWithObtainedAbilities();
  }

  #syncAbilityPicksFromLedger() {
    // Clear any obtained abilities first.
    for (const tree of this.#treeMap.values()) {
      for (const ability of tree.getAbilityMap().values()) {
        ability.obtained = false;
        ability.setLevelObtainedAt();
      }
    }

    // Apply abilities from ledger in obtained order.
    const obtained = this.#ledger.getObtainedAbilitiesInOrder();
    for (const { abilityId, level } of obtained) {
      const ability = this.#abilityPickMap.get(abilityId);
      if (!ability) continue;

      ability.obtained = true;
      ability.setLevelObtainedAt(level);
    }

    this.#setLevelOrderForObtainedAbilities();
  }

  #recomputeCharacterFromLedger() {
    this.#character.retaliation = 1;
    this.#character.openWeaponSkills = 0;

    const obtained = this.#ledger.getObtainedAbilitiesInOrder();
    for (const { abilityId } of obtained) {
      this.#applyEffectsForAbility(abilityId);
    }

    this.#updateShieldFormulas();
  }

  /**
   * Refund an ability and any obtained descendants that depend on it.
   * Returns the ids that were removed (including the root).
   *
   * @param {string} abilityId
   * @returns {{ ok: true, removedIds: string[] } | { ok: false, reason: 'not-found' | 'none-found' }}
   */
  #refundAbilityIncludingChildren(abilityId) {
    const rootAbilityPick = this.#abilityPickMap.get(abilityId);
    if (!rootAbilityPick) return { ok: false, reason: 'not-found' };
    if (!this.#ledger.hasAbility(abilityId)) return { ok: false, reason: 'none-found' };

    // Gather all ability IDs to remove in a Set, including children and their children.
    /** @type {Set<string>} */
    const abilityIdsToRemove = new Set([abilityId]);

    // Use a stack to keep track of any children to be removed.
    /** @type {AbilityPick[]} */
    const stack = [rootAbilityPick];

    while (stack.length > 0) {
      const pick = stack.pop();

      for (const childId of pick.childIds) {
        if (!this.#ledger.hasAbility(childId)) continue; // We only consider children that are currently obtained.
        if (abilityIdsToRemove.has(childId)) continue; // Avoid looping the same children.

        abilityIdsToRemove.add(childId);

        const childPick = this.#abilityPickMap.get(childId);
        if (childPick) stack.push(childPick);
      }
    }

    const removedIds = [...abilityIdsToRemove];

    const bulkRefund = this.#ledger.refundAbilities(removedIds);
    if (!bulkRefund.ok) return { ok: false, reason: bulkRefund.reason };

    return { ok: true, removedIds };
  }

  /**
   * Adjust the level order overlay of all abilities.
   * Useful when we refund one or more abilities.
   */
  #setLevelOrderForObtainedAbilities() {
    this.#ledger.getObtainedAbilitiesInOrder().forEach(({ abilityId, level }) => {
      const abilityPick = this.#abilityPickMap.get(abilityId);
      if (!abilityPick) return;
      abilityPick.setLevelObtainedAt(level);
    });
  }

  #updateAllFormulas() {
    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    this.querySelectorAll('ability-pick').forEach((abilityPick) =>
      abilityPick.evalAllFormulas(showFormulasCheckbox.checked),
    );
  }

  #updateShieldFormulas() {
    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    this.querySelectorAll('#shields-3, #shields-6').forEach((abilityPick) =>
      abilityPick.evalAllFormulas(showFormulasCheckbox.checked),
    );
  }

  #updateOpenWeaponSkills(abilityId, callback) {
    let correctWeaponryTypes = ['swords', 'axes', 'daggers', 'maces'];
    correctWeaponryTypes.forEach((correctWeaponryType) => {
      if (abilityId.startsWith(correctWeaponryType)) {
        callback();
      }
    });
    const showFormulasCheckbox = this.querySelector('#show-formulas-checkbox');
    const rightOnTargetAbilityPick = this.querySelector('#warfare-5');
    rightOnTargetAbilityPick.evalAllFormulas(showFormulasCheckbox.checked);
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
    if (this.#ledger.isEmpty()) {
      return '';
    }
    let talents = {
      format: 2,
      version: appVersion,
      showOrder: this.#showLevelOrderCheckbox.checked,
      profileId: this.#profileId,
      ledger: this.#ledger.toJSON(),
    };
    const json = JSON.stringify(talents);
    const compressedBytes = await this.#compress(json);
    return this.#bytesToBase64Url(compressedBytes);
  }

  async #import(build) {
    if (!build) return;

    let json = '';
    /** @type {any} */
    let talents;

    try {
      const bytes = this.#base64UrlToBytes(build);
      json = await this.#decompress(bytes);
      talents = JSON.parse(json);
    } catch (err) {
      console.warn('Import failed: could not decode build string', err);
      return;
    }

    /** @type {BuildLedger | null} */
    let nextLedger = null;

    try {
      // Detect newer format that uses the build ledger.
      if (talents?.format === 2 && talents.ledger) {
        nextLedger = BuildLedger.fromJSON(talents.ledger);
      }
      // Detect legacy format (ability order only).
      else if (Array.isArray(talents?.order)) {
        // Legacy builds start with 0 stat points and 2 ability points.
        const ledger = new BuildLedger(0, 2);

        const res = ledger.importLegacyAbilityOrder(talents.order);
        if (!res.ok) {
          console.warn('Legacy import failed:', res, 'JSON:', json);
          return;
        }

        nextLedger = ledger;
      } else {
        console.warn('Unrecognized build format:', talents, 'JSON:', json);
        return;
      }
    } catch (err) {
      console.warn('Import failed: invalid build payload', err, 'JSON:', json);
      return;
    }

    if ('showOrder' in talents) {
      this.#showLevelOrderCheckbox.checked = Boolean(talents.showOrder);
      this.#showLevelOrderOverlay(this.#showLevelOrderCheckbox.checked);
    }

    this.#profileId =
      typeof talents.profileId === 'string' && talents.profileId.length > 0
        ? talents.profileId
        : 'custom';

    this.#ledger = nextLedger;
    this.#refreshFromLedger();
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
    );
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
