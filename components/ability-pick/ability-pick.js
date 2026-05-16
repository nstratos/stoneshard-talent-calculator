import Character from '../../calculator/character.js';
import { computeAbilityTooltipValues } from '../../calculator/ability-tooltip-values.js';
import { computeAbilityUnlockRequirementState } from '../../calculator/ability-unlock-requirements.js';
import { STAT_LABELS } from '../../calculator/stats.js';

/**
 * @class AbilityPick
 * @extends HTMLElement
 *
 * Represents an obtainable ability in the talent tree.
 */
export class AbilityPick extends HTMLElement {
  /**
   * @type {Character}
   */
  #character = null;

  set character(character) {
    this.#character = character;
  }

  #container = null;

  #obtained = false;
  #innate = false;
  #parents = null;
  /** @type {string[]} */
  #childIds = [];
  #image = null;
  #levelOrderOverlayElement = null;
  #lockedOverlayElement = null;
  #levelObtainedAt = null;
  #isLevelOrderOverlayEnabled = true;
  #isLockedByUnlockRequirements = false;

  // Touch devices
  #isTouchMove = false;
  #isLongPress = false;
  #longPressDuration = 800;
  #longPressTimer = null;

  // Tooltip
  #tooltip = null;
  #label = '';
  #requires = '';
  #modifiers = [];
  #isAttack = false;
  #isStance = false;
  #isCharge = false;
  #isManeuver = false;
  #isSpell = false;
  #isPassive = false;
  #targetType = '';
  #range = '';
  #backfireChance = null;
  #backfireDamageType = '';
  #armorPenetration = null;
  #energy = null;
  #cooldown = null;
  #unlockLevel = null;
  #unlockAttributePoints = null;
  #unlockAttributes = [];
  #tooltipValues = null;
  #unlockRequirementsSectionElement = null;
  #unlockRequirementAttributePointsElement = null;
  #energyValueElement = null;
  #cooldownValueElement = null;
  #backfireChanceValueElement = null;
  #backfireDamageValueElement = null;
  #armorPenetrationValueElement = null;

  get backfireChance() {
    return this.#tooltipValues?.backfireChance ?? 0;
  }

  static get observedAttributes() {
    return ['obtained'];
  }

  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: 'open' });

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './components/ability-pick/ability-pick.css';
    shadowRoot.appendChild(link);

    if (this.hasAttribute('id')) {
      this.id = this.getAttribute('id');
    }
    if (this.hasAttribute('parents')) {
      this.#parents = this.#parseParentsAttribute(this.getAttribute('parents'));
    }
    if (this.hasAttribute('children')) {
      this.getAttribute('children')
        .split(' ')
        .forEach((childId) => this.#childIds.push(childId));
    }
    if (this.hasAttribute('innate')) {
      this.#innate = true;
      this.#obtained = true;
    }

    this.#container = document.createElement('div');
    this.#container.className = 'ability-pick-container';

    this.#image = document.createElement('img');
    this.#image.className = 'ability-pick-img';
    this.#image.src = 'img/default.png';
    this.#image.alt = 'Unknown ability';
    if (this.hasAttribute('label')) {
      this.#label = this.getAttribute('label');
    }
    if (this.hasAttribute('img')) {
      this.#image.src = this.getAttribute('img');
      this.#image.alt = this.#label;
    }
    this.#container.appendChild(this.#image);

    this.#lockedOverlayElement = document.createElement('img');
    this.#lockedOverlayElement.className = 'locked-overlay';
    this.#lockedOverlayElement.src = 'img/abilities/ability_locked_overlay.png';
    this.#lockedOverlayElement.alt = '';
    this.#lockedOverlayElement.setAttribute('aria-hidden', 'true');
    this.#lockedOverlayElement.hidden = true;
    this.#container.appendChild(this.#lockedOverlayElement);

    this.#levelOrderOverlayElement = document.createElement('div');
    this.#levelOrderOverlayElement.className = 'level-order-overlay';
    this.#levelOrderOverlayElement.setAttribute('aria-hidden', 'true');
    this.#levelOrderOverlayElement.hidden = true;
    this.#container.appendChild(this.#levelOrderOverlayElement);

    shadowRoot.appendChild(this.#container);
  }

  /**
   * This is meant to be called by talent-calculator after Character has been injected.
   */
  createTooltip() {
    this.#tooltip = this.#createTooltip(this.#label, this.#image.src, this.#character);
    this.#tooltip.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      clearTimeout(this.#longPressTimer);
      this.hideTooltip();
    });
    this.#container.appendChild(this.#tooltip);
  }

  connectedCallback() {
    this.addEventListener('click', () => this.#handleClick());
    this.addEventListener('contextmenu', (e) => this.#handleContextMenu(e));
    this.addEventListener('mouseover', () => this.showTooltip());
    this.addEventListener('mouseout', () => this.hideTooltip());
    this.addEventListener('touchstart', (e) => this.#onTouchStart(e));
    this.addEventListener('touchend', (e) => this.#onTouchEnd(e));
    this.addEventListener('touchmove', () => this.#onTouchMove());
    this.#render();
  }

  initAllFormulas() {
    this.querySelectorAll('stat-formula').forEach((statFormula) => {
      statFormula.abilityPick = this;
      statFormula.evalFormula();
    });
  }

  evalAllFormulas(show) {
    this.#updateTooltipValues();

    this.querySelectorAll('stat-formula').forEach((statFormula) => {
      statFormula.evalFormula();
      if (show) {
        statFormula.showFormula();
      } else {
        statFormula.hideFormula();
      }
    });
  }

  #handleClick() {
    if (this.obtained) {
      this.refund();
      return;
    }
    this.obtain();
  }

  #handleContextMenu(e) {
    e.preventDefault();
    this.refund();
  }

  #onTouchStart(e) {
    e.preventDefault();
    this.#isLongPress = false;
    this.#longPressTimer = setTimeout(() => {
      this.#isLongPress = true;
      this.#handleLongPress();
    }, this.#longPressDuration);
  }

  #onTouchEnd(e) {
    e.preventDefault();
    clearTimeout(this.#longPressTimer);

    if (this.#isLongPress) return;

    if (!this.#isTouchMove) {
      this.#handleTap();
    }
    this.#isTouchMove = false;
  }

  #onTouchMove() {
    clearTimeout(this.#longPressTimer);
    this.#isTouchMove = true;
  }

  #handleTap() {
    if (this.obtained) {
      this.refund();
      return;
    }
    this.obtain();
  }

  #handleLongPress() {
    this.showTooltip(true);
  }

  #parseParentsAttribute(attribute) {
    if (!attribute) return null;

    function parseAttribute(value) {
      // Handle OR (`|`) first, since it is the lowest-precedence operator.
      if (value.includes('|')) {
        return {
          type: 'OR',
          values: value.split('|').map(parseAttribute),
        };
      }

      // Handle AND (space-separated).
      if (value.includes(' ')) {
        return {
          type: 'AND',
          values: value.split(' ').map(String),
        };
      }

      // Base case: Single value (convert to string).
      return String(value);
    }

    return parseAttribute(attribute);
  }

  setLevelObtainedAt(level) {
    if (level === null || level === undefined) {
      this.#levelObtainedAt = null;
      this.#levelOrderOverlayElement.textContent = '';
    } else {
      this.#levelObtainedAt = level;
      this.#levelOrderOverlayElement.textContent = `Lvl ${level}`;
    }

    this.#renderOverlays();
  }

  obtain() {
    if (this.#obtained) return;

    this.dispatchEvent(
      new CustomEvent('ability-pick-obtain', {
        detail: { id: this.id },
        bubbles: true,
      }),
    );
  }

  refund() {
    if (!this.#obtained) return;
    if (this.#innate) return;

    this.dispatchEvent(
      new CustomEvent('ability-pick-refund', {
        detail: { id: this.id },
        bubbles: true,
      }),
    );
  }

  disableLevelOrderOverlay() {
    this.#isLevelOrderOverlayEnabled = false;
    this.#renderOverlays();
  }

  enableLevelOrderOverlay() {
    this.#isLevelOrderOverlayEnabled = true;
    this.#renderOverlays();
  }

  hideTooltip() {
    this.#tooltip.style.visibility = 'hidden';
    this.#tooltip.style.opacity = 0;
  }

  showTooltip(touch = false) {
    if (!touch) {
      this.#adjustTooltipPosition();
    }
    this.#tooltip.style.visibility = 'visible';
    this.#tooltip.style.opacity = 1;
  }

  /**
   * Each tooltip should be positioned based on its attribute
   * (tooltip-left, tooltip-right, tooltip-top, tooltip-bottom).
   * Nevertheless, in case the edges of the tooltip exceed the window,
   * this function attempts to adjust the tooltip's position.
   */
  #adjustTooltipPosition(distance = '120%') {
    const tooltipTextRect = this.#tooltip.querySelector('.tooltip-text').getBoundingClientRect();
    const x1 = tooltipTextRect.x;
    const x2 = tooltipTextRect.x + tooltipTextRect.width;

    // Position tooltip to the right of the ability pick,
    // if it exceeds the left of the window.
    if (x1 < 0) {
      this.#tooltip.style.left = distance;
      this.#tooltip.style.right = 'auto';
    }
    // Position tooltip to the left of the ability pick,
    // if it exceeds the right of the window.
    if (x2 > window.outerWidth) {
      this.#tooltip.style.left = 'auto';
      this.#tooltip.style.right = distance;
    }
  }

  /**
   * @param {string} label
   * @param {string} imageSrc
   * @param {Character} character
   */
  #createTooltip(label, imageSrc, character) {
    const tooltip = document.createElement('div');
    tooltip.id = `${this.id}-tooltip`;
    tooltip.className = 'tooltip';
    if (this.hasAttribute('tooltip-right')) {
      tooltip.classList.add('tooltip-right');
    }
    if (this.hasAttribute('tooltip-left')) {
      tooltip.classList.add('tooltip-left');
    }
    if (this.hasAttribute('tooltip-top')) {
      tooltip.classList.add('tooltip-top');
    }
    if (this.hasAttribute('tooltip-top-right')) {
      tooltip.classList.add('tooltip-top-right');
    }
    if (this.hasAttribute('tooltip-mid-right')) {
      tooltip.classList.add('tooltip-mid-right');
    }
    if (this.hasAttribute('tooltip-top-left')) {
      tooltip.classList.add('tooltip-top-left');
    }
    if (this.hasAttribute('tooltip-mid-left')) {
      tooltip.classList.add('tooltip-mid-left');
    }
    if (this.hasAttribute('tooltip-bottom')) {
      tooltip.classList.add('tooltip-bottom');
    }
    if (this.hasAttribute('tooltip-bottom-right')) {
      tooltip.classList.add('tooltip-bottom-right');
    }
    if (this.hasAttribute('tooltip-bottom-left')) {
      tooltip.classList.add('tooltip-bottom-left');
    }

    if (this.hasAttribute('requires')) {
      this.#requires = this.getAttribute('requires');
    }
    if (this.hasAttribute('modifiers')) {
      this.#modifiers = this.getAttribute('modifiers').split(',');
    }
    if (this.hasAttribute('target')) {
      this.#targetType = this.getAttribute('target');
    }
    if (this.hasAttribute('range')) {
      this.#range = this.getAttribute('range');
    }
    this.#backfireChance = this.#parseOptionalNumberAttribute('backfire-chance');
    if (this.hasAttribute('backfire-damage-type')) {
      this.#backfireDamageType = this.getAttribute('backfire-damage-type');
    }
    this.#armorPenetration = this.#parseOptionalNumberAttribute('armor-penetration');
    this.#energy = this.#parseOptionalNumberAttribute('energy');
    this.#cooldown = this.#parseOptionalNumberAttribute('cooldown');
    this.#unlockLevel = this.#parseOptionalNumberAttribute('unlock-level');
    this.#unlockAttributePoints = this.#parseOptionalNumberAttribute('unlock-attribute-points');
    this.#unlockAttributes = this.#parseUnlockAttributesAttribute();
    if (this.hasAttribute('passive')) {
      this.#isPassive = true;
    }
    if (this.hasAttribute('attack')) {
      this.#isAttack = true;
    }
    if (this.hasAttribute('stance')) {
      this.#isStance = true;
    }
    if (this.hasAttribute('charge')) {
      this.#isCharge = true;
    }
    if (this.hasAttribute('maneuver')) {
      this.#isManeuver = true;
    }
    if (this.hasAttribute('spell')) {
      this.#isSpell = true;
    }
    const abilityTypes = [
      ['Attack', this.#isAttack],
      ['Stance', this.#isStance],
      ['Charge', this.#isCharge],
      ['Maneuver', this.#isManeuver],
      ['Spell', this.#isSpell],
      ['Active', this.#innate],
      ['Passive', this.#isPassive],
    ];

    const abilityType = abilityTypes
      .filter(([_, value]) => value === true)
      .map(([key]) => key)
      .join(' / ');

    this.#tooltipValues = computeAbilityTooltipValues(this.#getBaseTooltipValues(), character);

    let basePath = '/stoneshard-talent-calculator';
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      basePath = '';
    }

    let costsTemplate = '';
    if (!this.#isPassive) {
      costsTemplate = `
        <div class="right">
          ${this.#energy != null && this.#energy !== 0 ? `<span data-role="energy-value">${this.#tooltipValues.energy}</span> <img class="text-icon" alt="energy icon" src="${basePath}/img/tooltip/energy-icon.png" decoding="async" width="15" height="12">` : ''}
          ${this.#cooldown != null && this.#cooldown !== 0 ? `<span data-role="cooldown-value">${this.#tooltipValues.cooldown}</span> <img class="text-icon" alt="cooldown icon" src="${basePath}/img/tooltip/cooldown-icon.png" decoding="async" width="9" height="12">` : ''}
        </div>
      `;
    }

    let headerTemplate = `
      <header>
        <img alt="${label}" src="${imageSrc}" decoding="async" title="${label}" width="64" height="62" class="tooltip-image">
        <h2>${label}</h2>
        <span class="ability-type ${this.#isPassive ? 'passive' : ''}">${abilityType}</span>
        ${costsTemplate}
        <hr>
      </header>
    `;

    function makeAbilityStatTemplate(abilityStatName, value, options = {}) {
      if (value == null) return '';
      const { isPercent = false, theme = '', valueRole = '' } = options;
      const valueAttr = valueRole ? ` data-role="${valueRole}"` : '';
      let span = `<span${valueAttr}>${value}</span>`;
      if (theme) {
        span = `<span class="${theme}"><span${valueAttr}>${value}</span>${isPercent ? '%' : ''}</span>`;
      } else if (isPercent) {
        span = `${span}%`;
      }

      return `
        <div class="float-container">
          <div class="left">${abilityStatName}</div><div class="right">${span}</div>
        </div>
      `;
    }

    let targetTypeTemplate = makeAbilityStatTemplate('Type', this.#targetType);

    let rangeTemplate = '';
    if (this.#range) {
      rangeTemplate = makeAbilityStatTemplate('Range', this.#range);
    }

    let addLine = false;

    let backfireChanceTemplate = '';
    if (this.#backfireChance != null) {
      backfireChanceTemplate = makeAbilityStatTemplate(
        'Backfire Chance',
        this.#tooltipValues.backfireChance,
        {
          isPercent: true,
          theme: 'harm',
          valueRole: 'backfire-chance-value',
        },
      );
      addLine = true;
    }

    let backfireDamageTemplate = '';
    if (this.#isSpell) {
      backfireDamageTemplate = makeAbilityStatTemplate(
        'Backfire Damage',
        this.#tooltipValues.backfireDamage,
        {
          theme: this.#backfireDamageType,
          valueRole: 'backfire-damage-value',
        },
      );
      addLine = true;
    }

    let armorPenetrationTemplate = '';
    if (this.#armorPenetration != null) {
      armorPenetrationTemplate = makeAbilityStatTemplate(
        'Armor Penetration',
        this.#tooltipValues.armorPenetration,
        {
          isPercent: true,
          valueRole: 'armor-penetration-value',
        },
      );
      addLine = true;
    }

    let modifiersTemplate = '';
    if (this.#modifiers.length > 0) {
      modifiersTemplate = `<p><span class="modifiers">Modified by:</span> ${this.#modifiers.join(', ')}</p>`;
      addLine = true;
    }

    let requiresTemplate = '';
    if (this.#requires) {
      requiresTemplate = `<p><span class="requires">- ${this.#requires}</span></p>`;
      addLine = true;
    }

    const unlockRequirementsTemplate = this.#createUnlockRequirementsTemplate();

    tooltip.innerHTML = `
      <section class="tooltip-text">
        ${headerTemplate}
        ${targetTypeTemplate}
        ${rangeTemplate}
        ${backfireChanceTemplate}
        ${backfireDamageTemplate}
        ${armorPenetrationTemplate}
        ${modifiersTemplate}
        ${requiresTemplate}
        ${addLine ? '<hr>' : ''}
        <slot name="description"></slot>
        ${unlockRequirementsTemplate}
      </section>
    `;

    this.#energyValueElement = tooltip.querySelector('[data-role="energy-value"]');
    this.#cooldownValueElement = tooltip.querySelector('[data-role="cooldown-value"]');
    this.#backfireChanceValueElement = tooltip.querySelector('[data-role="backfire-chance-value"]');
    this.#backfireDamageValueElement = tooltip.querySelector('[data-role="backfire-damage-value"]');
    this.#armorPenetrationValueElement = tooltip.querySelector(
      '[data-role="armor-penetration-value"]',
    );
    this.#unlockRequirementsSectionElement = tooltip.querySelector(
      '[data-role="unlock-requirements-section"]',
    );
    this.#unlockRequirementAttributePointsElement = tooltip.querySelector(
      '[data-role="unlock-requirement-attribute-points"]',
    );

    return tooltip;
  }

  #createUnlockRequirementsTemplate() {
    if (
      this.#unlockLevel == null ||
      this.#unlockAttributePoints == null ||
      this.#unlockAttributes.length === 0
    ) {
      return '';
    }

    const attributes = this.#unlockAttributes
      .map((attribute) => {
        const label = STAT_LABELS[attribute] ?? attribute;
        return `<span class="unlock-requirement-value">${label}</span>`;
      })
      .join(', ');

    return `
      <section data-role="unlock-requirements-section">
        <hr>
        <p class="unlock-requirements">
          Read the corresponding treatise to unlock this Ability, reach level <span class="unlock-requirement-value">${this.#unlockLevel}</span> or invest at least <span class="unlock-requirement-value" data-role="unlock-requirement-attribute-points">${this.#unlockAttributePoints}</span> more points into the following attributes: ${attributes}.
        </p>
      </section>
    `;
  }

  #parseOptionalNumberAttribute(name) {
    if (!this.hasAttribute(name)) return null;

    const value = this.getAttribute(name);
    if (value == null || value === '') return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  #parseUnlockAttributesAttribute() {
    if (!this.hasAttribute('unlock-attributes')) return [];

    return this.getAttribute('unlock-attributes').split(/\s+/).filter(Boolean);
  }

  #hasUnlockRequirements() {
    return (
      this.#unlockLevel != null &&
      this.#unlockAttributePoints != null &&
      this.#unlockAttributes.length > 0
    );
  }

  /**
   * @param {number} currentLevel
   */
  updateUnlockRequirements(currentLevel) {
    const unlockRequirementState = this.#getUnlockRequirementState(currentLevel);
    if (!unlockRequirementState) {
      this.#setLockedByUnlockRequirements(false);
      return;
    }

    this.#setLockedByUnlockRequirements(!unlockRequirementState.isSatisfied);
    this.#updateUnlockRequirementsTooltip(unlockRequirementState);
  }

  #updateUnlockRequirementsTooltip(unlockRequirementState) {
    if (unlockRequirementState.isSatisfied) {
      this.hideUnlockRequirements();
      return;
    }
    this.showUnlockRequirements();

    if (this.#unlockRequirementAttributePointsElement) {
      this.#unlockRequirementAttributePointsElement.textContent =
        unlockRequirementState.remainingAttributePoints;
    }
  }

  showUnlockRequirements() {
    if (!this.#unlockRequirementsSectionElement) return;

    this.#unlockRequirementsSectionElement.hidden = false;
  }

  hideUnlockRequirements() {
    if (!this.#unlockRequirementsSectionElement) return;

    this.#unlockRequirementsSectionElement.hidden = true;
  }

  #getUnlockRequirementState(currentLevel) {
    if (!this.#character || !this.#hasUnlockRequirements()) {
      return null;
    }

    return computeAbilityUnlockRequirementState(
      {
        level: this.#unlockLevel,
        attributePoints: this.#unlockAttributePoints,
        attributes: this.#unlockAttributes,
      },
      this.#character,
      currentLevel,
    );
  }

  #setLockedByUnlockRequirements(isLocked) {
    this.#isLockedByUnlockRequirements = isLocked;
    this.#render();
  }

  #getBaseTooltipValues() {
    return {
      energy: this.#energy,
      cooldown: this.#cooldown,
      backfireChance: this.#backfireChance,
      armorPenetration: this.#armorPenetration,
      isSpell: this.#isSpell,
    };
  }

  #updateTooltipValues() {
    if (!this.#character) return;

    this.#tooltipValues = computeAbilityTooltipValues(
      this.#getBaseTooltipValues(),
      this.#character,
    );

    if (this.#energyValueElement && this.#tooltipValues.energy != null) {
      this.#energyValueElement.textContent = this.#tooltipValues.energy;
    }

    if (this.#cooldownValueElement && this.#tooltipValues.cooldown != null) {
      this.#cooldownValueElement.textContent = this.#tooltipValues.cooldown;
    }

    if (this.#backfireChanceValueElement && this.#tooltipValues.backfireChance != null) {
      this.#backfireChanceValueElement.textContent = this.#tooltipValues.backfireChance;
    }

    if (this.#backfireDamageValueElement && this.#tooltipValues.backfireDamage != null) {
      this.#backfireDamageValueElement.textContent = this.#tooltipValues.backfireDamage;
    }

    if (this.#armorPenetrationValueElement && this.#tooltipValues.armorPenetration != null) {
      this.#armorPenetrationValueElement.textContent = this.#tooltipValues.armorPenetration;
    }
  }

  #render() {
    const tooltipDescription = this.querySelector('.tooltip-description');
    if (tooltipDescription) {
      tooltipDescription.style.display = 'block';
    }

    const isLocked = this.#isLockedByUnlockRequirements && !this.obtained;
    this.#image.classList.toggle('obtained', this.obtained);
    this.#image.classList.toggle('locked', isLocked);
    this.#renderOverlays();
  }

  #renderOverlays() {
    const showLockedOverlay = this.#isLockedByUnlockRequirements && !this.obtained;
    const hasLevelOrderText = this.#levelObtainedAt !== null;
    this.#lockedOverlayElement.hidden = !showLockedOverlay;

    const showLevelOrderOverlay =
      !showLockedOverlay && this.#isLevelOrderOverlayEnabled && hasLevelOrderText;

    this.#levelOrderOverlayElement.hidden = !showLevelOrderOverlay;
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

  get innate() {
    return this.#innate;
  }

  /**
   * @returns {string[]}
   */
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
    this.#render();
  }
}

customElements.define('ability-pick', AbilityPick);
