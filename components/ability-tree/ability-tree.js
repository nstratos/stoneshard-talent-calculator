import stylesheet from "./ability-tree.css" with { type: "css" }

class AbilityTree extends HTMLElement {
  #title = "";
  #display = "";
  #connections;
  abilityMap = new Map();
  constructor() {
    super();
    
    let shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    if (this.hasAttribute("title")) {
      this.#title = this.getAttribute("title");
      const header = document.createElement("header");
      header.className = "ability-tree-header";
      const text = document.createElement("text");
      text.textContent = this.#title;
      header.appendChild(text)
      shadowRoot.appendChild(header);
    }

    const section = document.createElement("section");
    section.className = "ability-tree-body";

    this.#connections = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.#connections.classList.add("connections");
    this.#connections.setAttribute("style", `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;`);
    section.appendChild(this.#connections);

    const slot = document.createElement("slot");
    section.appendChild(slot)
    shadowRoot.appendChild(section);
  }

  connectedCallback() {
    this.#display = this.style.display;
    this.buildTree();
    this.calculateAndSetViewBox();
    this.drawConnections();

    this.addEventListener("ability-obtained", this.handleAbilityObtained);
    this.addEventListener("ability-refunded", this.handleAbilityRefunded);
  }

  buildTree() {
    const abilities = this.querySelectorAll("ability-toggle");
    abilities.forEach(ability => {
      this.abilityMap.set(ability.getAttribute("id"), ability);
    });
  }

  calculateAndSetViewBox() {
    const abilities = this.querySelectorAll('ability-toggle');

    if (abilities.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    abilities.forEach((toggle) => {
      const rect = toggle.getBoundingClientRect();

      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
      // console.log("minX", minX, "minY", minY, "maxX", maxX, "maxY", maxY);
    });

    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    this.#connections.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    this.#connections.setAttribute('width', width);
    this.#connections.setAttribute('height', height);
  }

  // drawConnections() {
  //   this.#connections.innerHTML = "";

  //   const abilities = this.querySelectorAll("ability-toggle");
  //   console.log(abilities);
  //   abilities.forEach(ability => {
  //     const id = ability.getAttribute("id");
  //     const parentsIds = ability.parentIds;
  //     parentsIds.forEach(parentId => {
  //       const parent = this.abilityMap.get(parentId);
  //       if (parent) {
  //         const parentRect = parent.getBoundingClientRect();
  //         console.log("parentRect", parentRect);
  //         const abilityRect = ability.getBoundingClientRect();
  //         console.log("abilityRect", abilityRect);
  //         const x1 = parentRect.x + parentRect.width / 2;
  //         const y1 = parentRect.y + parentRect.height / 2;
  //         const x2 = abilityRect.x + abilityRect.width / 2;
  //         const y2 = abilityRect.y + abilityRect.height / 2;
  //         this.drawConnection(x1, y1, x2, y2);
  //       }
  //     });
  //   });
  // }

  // drawConnections() {
  //   const container = this.shadowRoot.querySelector('.ability-tree-body');
  //   const containerRect = container.getBoundingClientRect();
  //   const slot = this.shadowRoot.querySelector('slot');
  //   const slottedElements = slot.assignedElements({ flatten: true });
  //   const toggles = slottedElements.filter(el => el.matches('.ability-toggle'));
  
  //   toggles.forEach(toggle => {
  //     const id = toggle.id;
  //     const children = toggle.getAttribute('children')?.split(' ') || [];
  //     const parentRect = toggle.getBoundingClientRect();
  
  //     // Calculate the center of the parent relative to the container
  //     const parentCenterX = parentRect.left + parentRect.width / 2 - containerRect.left;
  //     const parentCenterY = parentRect.top + parentRect.height / 2 - containerRect.top;
  
  //     children.forEach(childId => {
  //       const child = slottedElements.find(el => el.id === childId);
  //       if (child) {
  //         const childRect = child.getBoundingClientRect();
  
  //         // Calculate the center of the child relative to the container
  //         const childCenterX = childRect.left + childRect.width / 2 - containerRect.left;
  //         const childCenterY = childRect.top + childRect.height / 2 - containerRect.top;
  
  //         const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  //         line.setAttribute('x1', parentCenterX);
  //         line.setAttribute('y1', parentCenterY);
  //         line.setAttribute('x2', childCenterX);
  //         line.setAttribute('y2', childCenterY);
  //         line.setAttribute('stroke', 'red');
  //         line.setAttribute('stroke-width', '2');
  
  //         this.#connections.appendChild(line);
  //       }
  //     });
  //   });
  // }

  drawConnections() {
    const slot = this.shadowRoot.querySelector('slot');
    const slottedElements = slot.assignedElements({ flatten: true });
    const abilities = slottedElements.filter(el => el.matches('.ability-toggle'));
  
    abilities.forEach(ability => {
      const id = ability.id;
      const childIds = ability.childIds;
      const rect = ability.getBoundingClientRect();
      console.log("id", id, "rect", rect);
  
      childIds.forEach(childId => {
        const child = slottedElements.find(el => el.id === childId);
        if (child) {
          const childRect = child.getBoundingClientRect();
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', rect.left + rect.width / 2);
          console.log("id", id, "rect.left", rect.left, "rect.width", rect.width, "rect.width / 2", rect.width / 2);
          line.setAttribute('y1', rect.top + rect.height / 2);
          console.log("id", id, "rect.top", rect.top, "rect.height", rect.height, "rect.height / 2", rect.height / 2);
          line.setAttribute('x2', childRect.left + childRect.width / 2);
          line.setAttribute('y2', childRect.top + childRect.height / 2);
          line.setAttribute('stroke', 'red');
          line.setAttribute('stroke-width', '2');
          this.#connections.appendChild(line);
        }
      });
    });
  }
  

  // drawConnections() {
  //   const abilities = this.querySelectorAll('.ability-toggle');
  //   console.log("abilities", abilities);
  //   abilities.forEach(ability => {
  //     const id = ability.id;
  //     const childIds = ability.childIds;
  //     const rect = ability.getBoundingClientRect();
  //     console.log("ability", ability);
  
  //     childIds.forEach(childId => {
  //       const child = this.querySelector(`.ability-toggle[id="${childId}"]`);
  //       if (child) {
  //         const childRect = child.getBoundingClientRect();
  //         const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  //         line.setAttribute('x1', rect.left + rect.width / 2);
  //         line.setAttribute('y1', rect.top + rect.height / 2);
  //         line.setAttribute('x2', childRect.left + childRect.width / 2);
  //         line.setAttribute('y2', childRect.top + childRect.height / 2);
  //         line.setAttribute('stroke', 'red');
  //         line.setAttribute('stroke-width', '2');
  //         this.#connections.appendChild(line);
  //       }
  //     });
  //   });
  // }

  drawConnection(x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "red");
    line.setAttribute("stroke-width", "2");
    // this.#connections.setAttribute("viewBox", `200 1000 900 500`);
    this.#connections.appendChild(line);
  }

  canObtain(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    if (ability.parentIds.length === 0) {
      return true;
    }

    // Check if all parents are obtained.
    return ability.parentIds.every(parentId => this.abilityMap.get(parentId)?.obtained);
  }

  canRefund(id) {
    const ability = this.abilityMap.get(id);
    if (!ability) return false;

    // Check if all children are refunded.
    return ability.childIds.every(childId => !this.abilityMap.get(childId)?.obtained);
  }

  obtainAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.obtained = true;
      console.log(`Ability ${id} obtained`, ability);
    }
  }

  refundAbility(id) {
    const ability = this.abilityMap.get(id);
    if (ability) {
      ability.obtained = false;
      console.log(`Ability ${id} refunded`, ability);
    }
  }

  handleAbilityObtained(e) {
    const id = e.detail.id;
    if (this.canObtain(id)) {
      this.obtainAbility(id);
    }
  }

  handleAbilityRefunded(e) {
    const id = e.detail.id;
    if (this.canRefund(id)) {
      this.refundAbility(id);
    }
  }

  exportAbilitiesObject() {
    const abilities = this.querySelectorAll("ability-toggle");
    let o = {}
    abilities.forEach(ability => {
      o[ability.id] = ability.obtained ? 1 : 0;
    });
    
    return {id: this.id, abilities: o};
  }

  importAbilitiesObject(o) {
    const abilities = this.querySelectorAll("ability-toggle");
    abilities.forEach(ability => {
      ability.obtained = o[ability.id] === 1;
    });
  }

  hide() {
    this.style.display = "none";
  }

  show() {
    this.style.display = this.#display;
  }
}

customElements.define(
  "ability-tree",
  AbilityTree
)