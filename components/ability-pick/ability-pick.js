class AbilityPick extends HTMLElement {
  #obtained = false;
  #innate = false;
  #parents = null;
  #childIds = [];
  #image = null;
  #overlayText = null;
  #overlayTextDisplay = '';

  // Touch devices
  #isTouchMove = false;
  #isLongPress = false;
  #longPressDuration = 800;
  #longPressTimer = null;

  // Tooltip
  #tooltip = null;
  #title = '';
  #requires = '';
  #modifiedBy = [];
  #primaryType = '';
  #secondaryType = '';
  #targetType = '';
  #range = '';
  #backfireChance = '';
  #backfireDamage = '';
  #backfireDamageType = '';
  #energy = '';
  #cooldown = '';
  #isPassive = false;

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
      this.getAttribute('children').split(' ').forEach(childId => this.#childIds.push(childId));
    }
    if (this.hasAttribute('innate')) {
      this.#innate = true;
      this.#obtained = true;
    }

    const container = document.createElement('div');
    container.className = 'ability-pick-container';
    
    this.#image = document.createElement('img');
    this.#image.className = 'ability-pick-img'
    this.#image.src = 'img/default.png';
    this.#image.alt = 'Unknown ability';
    if (this.hasAttribute('title')) {
      this.#title = this.getAttribute('title');
    }
    if (this.hasAttribute('img')) {
      this.#image.src = this.getAttribute('img');
      this.#image.alt = this.#title;
    }
    container.appendChild(this.#image);

    this.#overlayText = document.createElement('div');
    this.#overlayText.className = 'overlay-text';
    container.appendChild(this.#overlayText);

    this.#tooltip = this.#createTooltip(this.#title, this.#image.src);
    this.#tooltip.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      clearTimeout(this.#longPressTimer);
      this.hideTooltip();
    });
    container.appendChild(this.#tooltip);

    shadowRoot.appendChild(container);
  }

  connectedCallback () {
    this.#overlayTextDisplay = this.#overlayText.style.display;
    this.addEventListener('click', () => this.#handleClick());
    this.addEventListener('contextmenu', (e) => this.#handleContextMenu(e));
    this.addEventListener('mouseover', () => this.showTooltip());
    this.addEventListener('mouseout', () => this.hideTooltip());
    this.addEventListener('touchstart', (e) => this.#onTouchStart(e));
    this.addEventListener('touchend', (e) => this.#onTouchEnd(e));
    this.addEventListener('touchmove', () => this.#onTouchMove());
    this.#render();
  }

  #handleClick() {
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
    this.showTooltip();
  }

  #parseParentsAttribute(attribute) {
    if (!attribute) return null;

    function parseAttribute(value) {
        // Handle OR (`|`) first, as it has lower precedence than AND.
        if (value.includes('|')) {
            return {
                type: 'OR',
                values: value.split('|').map(parseAttribute)
            };
        }

        // Handle AND (space-separated).
        if (value.includes(' ')) {
            return {
                type: 'AND',
                values: value.split(' ').map(String)
            };
        }

        // Base case: Single value (convert to string).
        return String(value);
    }

    return parseAttribute(attribute);
  }

  setLevelObtainedAt(level) {
    if (!level) {
      this.#overlayText.innerHTML = ``;
      return;
    }
    this.#overlayText.innerHTML = `Lvl ${level}`;
  }

  obtain() {
    if (this.#obtained) return;
    
    this.dispatchEvent(
      new CustomEvent('ability-pick-obtain', {
        detail: { id: this.id},
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

  hideOverlayText() {
    this.#overlayText.style.display = 'none';
  }

  showOverlayText() {
    this.#overlayText.style.display = this.#overlayTextDisplay;
  }

  hideTooltip() {
    this.#tooltip.style.visibility = 'hidden';
    this.#tooltip.style.opacity = 0;
  }

  showTooltip() {
    this.#adjustTooltipPosition();
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
    const tooltipRect = this.#tooltip.getBoundingClientRect();
    const x1 = tooltipRect.x;
    const x2 = tooltipRect.x + tooltipRect.width;
    const y1 = tooltipRect.y;
    const y2 = tooltipRect.y + tooltipRect.height;

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
    // Position tooltip to the bottom of the ability pick,
    // if it exceeds the top of the window.
    if (y1 < 0) {
      this.#tooltip.style.top = distance;
      this.#tooltip.style.bottom = 'auto';
    }
    // Position tooltip to the top of the ability pick,
    // if it exceeds the bottom of the window.
    if (y2 > window.outerHeight) {
      this.#tooltip.style.top = 'auto';
      this.#tooltip.style.bottom = distance;
    }
  }

  #createTooltip(title, imageSrc) {
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
    if (this.hasAttribute('tooltip-bottom')) {
      tooltip.classList.add('tooltip-bottom');
    }
    
    if (this.hasAttribute('requires')) {
      this.#requires = this.getAttribute('requires');
    }
    if (this.hasAttribute('modified-by')) {
      this.#modifiedBy = this.getAttribute('modified-by').split(' ');
    }
    if (this.hasAttribute('target-type')) {
      this.#targetType = this.getAttribute('target-type');
    }
    if (this.hasAttribute('range')) {
      this.#range = this.getAttribute('range');
    }
    if (this.hasAttribute('backfire-chance')) {
      this.#backfireChance = this.getAttribute('backfire-chance');
    }
    if (this.hasAttribute('backfire-damage')) {
      this.#backfireDamage = this.getAttribute('backfire-damage');
    }
    if (this.hasAttribute('backfire-damage-type')) {
      this.#backfireDamageType = this.getAttribute('backfire-damage-type');
    }
    if (this.hasAttribute('energy')) {
      this.#energy = this.getAttribute('energy');
    }
    if (this.hasAttribute('cooldown')) {
      this.#cooldown = this.getAttribute('cooldown');
    }
    if (this.hasAttribute('passive')) {
      this.#isPassive = true;
      this.#primaryType = 'Passive';
    }
    if (this.hasAttribute('primary-type')) {
      this.#primaryType = this.getAttribute('primary-type');
    }
    if (this.hasAttribute('secondary-type')) {
      this.#secondaryType = this.getAttribute('secondary-type');
    }
    let abilityType = this.#primaryType;
    if (this.#secondaryType) {
      abilityType = abilityType + ' / ' + this.#secondaryType;
    }

    let costsTemplate = '';
    if (!this.#isPassive && this.#energy && this.#cooldown) {
      costsTemplate = `
        <div class="right">
          ${this.#energy} <img class="text-icon" alt="energy icon" src="../../img/tooltip/energy-icon.png" decoding="async" width="15" height="12">
          ${this.#cooldown} <img class="text-icon" alt="cooldown icon" src="../../img/tooltip/cooldown-icon.png" decoding="async" width="9" height="12">
        </div>
      `
    }

    let headerTemplate = `
      <header>
        <img alt="${title}" src="${imageSrc}" decoding="async" title="${title}" width="64" height="62" class="tooltip-image">
        <h2>${title}</h2>
        <span class="ability-type ${this.#isPassive ? 'passive' : ''}">${abilityType}</span>
        ${costsTemplate}
        <hr>
      </header>
    `;

    function makeAbilityStatTemplate(abilityStatName, value, theme) {
      if (!value) return '';

      let span = `${value}`;
      if (theme) {
        span = `<span class="${theme}">${value}<span></span>`
      }
      
      return `
        <div class="float-container">
          <div class="left">${abilityStatName}</div><div class="right">${span}</div>
        </div>
      `
    }
    
    let targetTypeTemplate = makeAbilityStatTemplate('Type', this.#targetType);

    let rangeTemplate = '';
    if (this.#range) {
      rangeTemplate = makeAbilityStatTemplate('Range', this.#range);
    }

    let addLine = false;

    let backfireChanceTemplate = '';
    if (this.#backfireChance) {
      backfireChanceTemplate = makeAbilityStatTemplate('Backfire Chance', this.#backfireChance, 'harm');
      addLine = true;
    }

    let backfireDamageTemplate = '';
    if (this.#backfireDamage) {
      backfireDamageTemplate = makeAbilityStatTemplate('Backfire Damage', this.#backfireDamage, this.#backfireDamageType);
      addLine = true;
    }

    let modifiedByTemplate = '';
    if (this.#modifiedBy.length > 0) {
      modifiedByTemplate = `<p><span class="modified-by">Modified by:</span> ${this.#modifiedBy.join(', ')}</p>`;
      addLine = true;
    }

    let requiresTemplate = '';
    if (this.#requires) {
      requiresTemplate = `<p><span class="requires">- ${this.#requires}</span></p>`;
      addLine = true;
    }
    
    tooltip.innerHTML = `
      <section class="tooltip-text">
        ${headerTemplate}
        ${targetTypeTemplate}
        ${rangeTemplate}
        ${backfireChanceTemplate}
        ${backfireDamageTemplate}
        ${modifiedByTemplate}
        ${requiresTemplate}
        ${addLine ? '<hr>' : ''}
        <slot name="description"></slot>
      </section>
    `

    return tooltip;
  }

  #render() {
    const tooltipDescription = this.querySelector('.tooltip-description');
    if (tooltipDescription) {
      tooltipDescription.style.display = 'block';
    }
    this.#image.style.opacity = this.obtained ? '1' : '0.5';
    this.#image.style.filter = this.obtained ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.8)';
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

customElements.define('ability-pick', AbilityPick)
