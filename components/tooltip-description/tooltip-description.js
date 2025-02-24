class TooltipDescription extends HTMLElement {
  #source = '';
  #result = '';
  constructor() {
    super();

    let shadowRoot = this.attachShadow({ mode: 'open' });
    const slot = document.createElement('slot');
    shadowRoot.appendChild(slot);
  }

  connectedCallback () {
    this.#source = this.innerHTML;
    this.#result = this.#parseTooltipDescription(this.#source);
    // Copy the result from the console and replace the description manually 
    // instead of using the element directly. Maybe in the future.
    console.log(this.#result); 
    this.innerHTML = this.#result;
  }

  /**
   * Can read the tooltip description containing Wiki tags and replace them with HTML tags.
   * 
   * @param {string} tooltipDescription 
   * @returns {string}
   */
  #parseTooltipDescription(tooltipDescription) {
    return tooltipDescription
      .split('<br><br>')
      .map(paragraph => `<p>${paragraph.trim().replace(/{{(\w+)\|([^|}]+)(?:\|([^}]+))?}}/g, (match, tag, param1, param2) => {
        return this.#replaceTag(tag, param1, param2) || match;
      })}</p>\n\n`)
      .join('').replaceAll('<br>', '<br>\n');
  }

  #replaceTag(tag, param1, param2) {
    switch (tag) {
      case 'W':
        return `<strong>${this.#formula(param1)}</strong>`;
      case 'Pos':
        return `<span class="buff">${this.#formula(param1)}</span>`;
      case 'Neg':
        return `<span class="harm">${this.#formula(param1)}</span>`;
      case 'c':
        return `<span class="${param1.toLowerCase()}">${this.#formula(param2)}</span>`;
      default:
        return param2 || param1;
    }
  }

  #formula(text) {
    if (text.includes('(')) {
      if (text.startsWith('+')) {
        return `<stat-formula plus>${text}</stat-formula>`;  
      }
      if (text.endsWith('%')) {
        const chomp = text.slice(0, -1);
        return `<stat-formula>${chomp}</stat-formula>%`;
      }
      return `<stat-formula>${text}</stat-formula>`;
    }
    return text;
  }
}

customElements.define('tooltip-description', TooltipDescription)