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
    if (!this.#source.trim()) return;
    
    if (this.hasAttribute('wiki')) {
      this.#result = this.#parseTooltipDescriptionWiki(this.#source);  
    } else if (this.hasAttribute('table')) {
      this.#result = this.#parseSkillTable(this.#source);  
    } else if (this.hasAttribute('modifiers')) {
        this.#result = this.#parseModifiers(this.#source);
    } else {
      this.#result = this.#parseTooltipDescription(this.#source);  
    }
    // Copy the result from the console and replace the description manually 
    // instead of using the element directly. Maybe in the future.
    console.log(this.#result); 
    this.innerHTML = this.#result;
  }

  /**
   * Parse lines from the game code where they mention the modifiers. Such a line looks like this:
   * 
   * ds_list_add(attribute, ds_map_find_value(global.attribute, "Magic_Power"), ds_map_find_value(global.attribute, "Electromantic_Power"), ds_map_find_value(global.attribute, "PRC"), ds_map_find_value(global.attribute, "Bonus_Range"))
   * 
   * @param {string} gmlCode 
   * @returns {string}
   */
  #parseModifiers(gmlCode) {
    const regex = /ds_map_find_value\(global\.attribute, ?"([^"]+)"\)/g;
    
    let modifiers = [];
    let match;
    while ((match = regex.exec(gmlCode)) !== null) {
      modifiers.push(match[1]);
    }
  
    const modifiersMap = {
      STR: 'Strength',
      AGL: 'Agility',
      PRC: 'Perception',
      VIT: 'Vitality',
      WIL: 'Willpower',
    }
    const formattedAttributes = modifiers.map(modifier => 
        modifiersMap[modifier] || modifier.replace(/_/g, ' ')
    );
  
    return `modifiers="${formattedAttributes.join(', ')}"`;
  }

  /**
   * Parses a skill string in table format taken from the game.
   * 
   * Example of skill string containing the columns: 
   * 
   * Discharge;o_discharge_birth;Target Point;7;2;8;0;0;0;0;0;normal;;spell;1;s_discharge_cast_;electromancy;0;1;;5;35;;;;;1;
   * 
   * Header names:
   * | Name       | Object             | Target      | Range | KD | MP | Reserv | Duration | AOE_Length | AOE_Width | is_movement | Pattern | Validators | Class | Bonus_Range | Starcast | Branch    | is_knockback | Crime | metacategory | FMB | AP | Attack | Stance | Charge | Maneuver | Spell |
   * | Flame_Ring | o_flame_ring_birth | Target Area | 1     | 8  | 16 | 10     | 0        | 11         | 11        | 0           | circle  |            | spell | 0           |          | pyromancy | 0            | 1     |              | 0   | 10 |        |        |        |          | 1     |
   * 
   * @param {string} skillTable 
   * @returns {string}
   */
  #parseSkillTable(skillTable) {
    if (!skillTable.trim()) return '';
    
    const data = skillTable.split(';');
    const skill = {
      name: data[0].trim(),
      target: data[2],
      range: data[3],
      cooldown: data[4],
      energy: data[5],
      class: data[13],
      branch: data[16],
      armorPenetration: data[21],
    };

    if (skill.target) {
      skill.target = skill.target.replace('Point', 'Tile');
    }
    
    let backfireDamageType = '';
    switch (skill.branch) {
      case 'pyromancy':
        backfireDamageType = 'fire';
        break;
      case 'geomancy':
        backfireDamageType = 'arcane';
        break;
      case 'electromancy':
        backfireDamageType = 'shock';
        break;
      case 'arcanistics':
        backfireDamageType = 'arcane';
        break;
    }
    return `
                key="${skill.name}"
                ${skill.class}
                target="${skill.target}"
                ${skill.range === '0' ? '' : `range="${skill.range}"`}
                energy="${skill.energy}"
                cooldown="${skill.cooldown}"
                ${skill.class==='spell'?
                `backfire-chance=""
                backfire-damage="0"
                backfire-damage-type="${backfireDamageType}"`:''}
                armor-penetration="${skill.armorPenetration}"`
  }

  #parseFormulas(lines) {
    const regex = /ds_map_replace\([^,]+,\s*"([^"]+)",\s*(.+)\)/g;
    let formulas = {};
    let match;
  
    while ((match = regex.exec(lines)) !== null) {
      const key = match[1];
      let value = match[2];
      value = value.replaceAll('owner.', '');
      value = value.replaceAll('math_round', '');
      formulas[key] = value;
    }
  
    return formulas;
  }

  /**
   * Take the formulas and the tooltip description and place them in the element body separated by an HTML comment. For example:
   * 
   *   formula line 1
   *   formula line 2
   *   <!--  -->
   *   tooltip description in supported languages
   * 
   * Example input:
   * 
   *   ds_map_replace(data, "My_formula", math_round(5 * owner.Magic_Power))
   *   <!--  -->
   *   example_tooltip;;Example tooltip with tag containing a formula e.g. ~p~\/*My_formula*\/ arcane damage~/~.;
   * 
   * Expected output:
   * 
   *   <p>Example tooltip with tag containing a formula e.g. <span class="arcane"><stat-formula>(5 * Magic_Power)</stat-formula> arcane damage</span>.</p>
   * 
   * Note that the formula is normaly enclosed in 'comment' tags. They are only escaped for this comment.
   * 
   * @param {string} tooltipDescription 
   * @returns {string}
   */
  #parseTooltipDescription(tooltipDescription) {
    if (!tooltipDescription.trim()) return '';

    let formulaMap = {};
    let description = tooltipDescription;
    if (tooltipDescription.includes('<!--  -->')) {
      const input = tooltipDescription.split('<!--  -->');
      const formulas = input[0];
      description = input[1];
      formulaMap = this.#parseFormulas(formulas);
      // Sort so that longer formulas appear first to avoid the case where a formula like HP_Limit
      // would be applied before Max_HP_Limit and replace part of the longer formula.
      formulaMap = Object.fromEntries(
        Object.entries(formulaMap).sort(([,a],[,b]) => b.length - a.length)
      );
    }
    const data = description.split(';');
    const tooltip = {
      key: data[0].trim(),
      russian: data[1],
      english: data[2],
      chinese: data[3],
      german: data[4],
      spanish: data[5],
      french: data[6],
      italian: data[7],
      portuguese: data[8],
      polish: data[9],
      turkish: data[10],
      japanese: data[11],
      korean: data[12],
    };

    let englishTooltip = tooltip.english
    .split('##')
    .map(paragraph => 
      `<p>${paragraph
        .trim()
        .replace(/#/g, '<br>\n')
        .replace(/~([a-z]+)~(.*?)~\/~/g, (match, color, text) => this.#replaceTag(color, text))
      }</p>\n\n`
    ).join('');

    if (formulaMap) {
      for (const [key, value] of Object.entries(formulaMap)) {
        englishTooltip = englishTooltip.replaceAll(key, value);
      }
    }
    return englishTooltip;
  }

  #replaceTag(color, text) {
    text = text.replace(/\/\*([^*]+)\*\//g, '<stat-formula>$1</stat-formula>');

    if (color === 'w') {
        return `<strong>${text}</strong>`;
    }
    return `<span class="${this.#getSpanClass(color)}">${text}</span>`;
  }

  #getSpanClass(colorCode) {
    const colorMap = {
      lg: 'buff',
      r: 'harm',
      b: 'energy',
      p: 'arcane',
      o: 'fire',
      ly: 'shock',
      bl: 'energy',
    };
    return colorMap[colorCode] || 'unknown-tag';
  }

  /**
   * Can read the tooltip description containing Wiki tags and replace them with HTML tags.
   * 
   * Wiki skill data can be found here: https://stoneshard.com/wiki/Skill_data
   * 
   * @param {string} tooltipDescription 
   * @returns {string}
   */
  #parseTooltipDescriptionWiki(tooltipDescription) {
    return tooltipDescription
      .split('<br><br>')
      .map(paragraph => `<p>${paragraph.trim().replace(/{{(\w+)\|([^|}]+)(?:\|([^}]+))?}}/g, (match, tag, param1, param2) => {
        return this.#replaceTagWiki(tag, param1, param2) || match;
      })}</p>\n\n`)
      .join('').replaceAll('<br>', '<br>\n');
  }

  #replaceTagWiki(tag, param1, param2) {
    switch (tag.toLowerCase()) {
      case 'w':
        return `<strong>${this.#formulaWiki(param1)}</strong>`;
      case 'pos':
        return `<span class="buff">${this.#formulaWiki(param1)}</span>`;
      case 'neg':
        return `<span class="harm">${this.#formulaWiki(param1)}</span>`;
      case 'c':
        switch (param1) {
          case 'w':
            return `<strong>${this.#formulaWiki(param2)}</strong>`;
          case '+':
            return `<span class="buff">${this.#formulaWiki(param2)}</span>`;
          case '-':
            return `<span class="harm">${this.#formulaWiki(param2)}</span>`;
        }
        return `<span class="${param1.toLowerCase()}">${this.#formulaWiki(param2)}</span>`;
      default:
        return param2 || param1;
    }
  }

  #formulaWiki(text) {
    if (text.includes('(') || this.#textIncludesStat(text)) {
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

  #textIncludesStat(text) {
    const stats = [
    'STR',
    'AGL',
    'PRC',
    'VIT',
    'WIL',
    'Legs_DEF',
    ];
  
    for (const stat of stats) {
      if (text.includes(stat)) {
        return true;
      }
    }
    return false;
  }
}

customElements.define('tooltip-description', TooltipDescription)
