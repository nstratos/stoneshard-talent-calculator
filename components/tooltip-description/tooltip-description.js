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
   * Wiki skill data can be found here: https://stoneshard.com/wiki/Skill_data
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
    switch (tag.toLowerCase()) {
      case 'w':
        return `<strong>${this.#formula(param1)}</strong>`;
      case 'pos':
        return `<span class="buff">${this.#formula(param1)}</span>`;
      case 'neg':
        return `<span class="harm">${this.#formula(param1)}</span>`;
      case 'c':
        return `<span class="${param1.toLowerCase()}">${this.#formula(param2)}</span>`;
      default:
        return param2 || param1;
    }
  }

  #formula(text) {
    if (text.includes('(')) {
      let hasPlus = false;
      if (text.startsWith('+')) {
        hasPlus = true;
      }

      if (text.endsWith('%')) {
        const chomp = text.slice(0, -1);
        return `<stat-formula${hasPlus ? ' plus' : ''}>${chomp}</stat-formula>%`;
      }

      return `<stat-formula${hasPlus ? ' plus' : ''}>${text}</stat-formula>`;
    }
    return text;
  }
}

customElements.define('tooltip-description', TooltipDescription)