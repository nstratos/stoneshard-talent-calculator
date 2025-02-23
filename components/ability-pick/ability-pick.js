class AbilityPick extends HTMLElement {
  #obtained = false;
  #innate = false;
  #parents = null;
  #childIds = [];
  #image = null;
  #overlayText = null;
  #overlayTextDisplay = '';

  // Touch devices.
  #isTouchMove = false;
  #isLongPress = false;
  #longPressDuration = 800;
  #longPressTimer = null;
  
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
    if (this.hasAttribute('img')) {
      this.#image.src = this.getAttribute('img');
      this.#image.alt = this.hasAttribute('title') ? this.getAttribute('title') : '';
    }
    container.appendChild(this.#image);

    this.#overlayText = document.createElement('div');
    this.#overlayText.className = 'overlay-text';
    container.appendChild(this.#overlayText);

    shadowRoot.appendChild(container);
  }

  connectedCallback () {
    this.#overlayTextDisplay = this.#overlayText.style.display;
    this.addEventListener('click', () => this.#handleClick());
    this.addEventListener('contextmenu', (e) => this.#handleContextMenu(e));
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

  #render() {
    this.style.opacity = this.obtained ? '1' : '0.5';
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
