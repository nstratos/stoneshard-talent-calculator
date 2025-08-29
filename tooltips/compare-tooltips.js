// Build container once:
//
// docker build -t compare-tooltips -f tooltips/Dockerfile .
//
// Then run this script to compare the tooltips of all skills using:
//
// docker run --rm -v ${PWD}/tooltips:/src/tooltips -v ${PWD}/tooltips/compare-tooltips.js:/src/compare-tooltips.js -v ${PWD}/index.html:/src/index.html compare-tooltips
//
// Or to compare the tooltip of a single skill:
//
// docker run --rm -v ${PWD}/tooltips:/src/tooltips -v ${PWD}/tooltips/compare-tooltips.js:/src/compare-tooltips.js -v ${PWD}/index.html:/src/index.html compare-tooltips armored_combat 0

import fs from "fs";
import { JSDOM } from "jsdom";

// Load tooltips from game data.
const gameDataJson = fs.readFileSync("./stoneshard-tooltips-and-formulas.json", "utf-8");
const gameData = JSON.parse(gameDataJson);

// Load tooltips from index.html document.
const html = fs.readFileSync("./index.html", "utf-8");
const dom = new JSDOM(html);
const document = dom.window.document;

if (process.argv.length > 2) {
     // argv[0] = node, argv[1] = scriptName, argv[2] = treeName, argv[3] = skillIndex
    const [, , treeName, skillIndexStr] = process.argv;
    const skillIndex = parseInt(skillIndexStr, 10);

    if (!treeName || isNaN(skillIndex)) {
        console.error("Usage: node compare-tooltips.js <tree-name> <skill-index>");
        process.exit(1);
    }

    compareOneSkillTooltip(gameData, document, treeName, skillIndex);
    process.exit(0);
}

compareAllSkillsTooltips(gameData, document);

function compareAllSkillsTooltips(gameData, document) {
    for (var treeName in gameData) {
        for (var skillIndexStr in gameData[treeName]) {
            const skillIndex = parseInt(skillIndexStr, 10);
            compareOneSkillTooltip(gameData, document, treeName, skillIndex)
        }
    }
}

function compareOneSkillTooltip(gameData, document, treeName, skillIndex) {
    const tree = gameData[treeName];
    if (!tree) {
        console.error(`Could not find tree '${treeName}'`);
        process.exit(1);
    }
    const skill = tree[skillIndex];
    if (!skill) {
        console.error(`Could not find skill on tree '${treeName}' with index ${skillIndex}`);
        process.exit(1);
    }

    const englishTooltip = skill.tooltip.english;
    const formulaMap = skill.formulas;
    const gameDataHtmlTooltip = stoneshardTooltipToHTML(englishTooltip, formulaMap);

    const abilityPickID = `#${treeName}-${skillIndex + 1}`;
    const abilityPickElement = document.querySelector(abilityPickID);
    if (!abilityPickElement) {
        console.error("Element not found in HTML with", abilityPickID);
        process.exit(1);
    }

    console.log(`---- Comparing: ${abilityPickID} = ${skill.name.english}`);

    // Compare tooltips.
    const abilityPickTooltip = abilityPickElement.querySelector('div.tooltip-description');
    const indexHtmlTooltip = abilityPickTooltip.innerHTML;
    compareTooltips(indexHtmlTooltip, gameDataHtmlTooltip);

    // Compare attributes.
    compareAttributes(abilityPickElement, skill);
}

function compareTooltips(indexHtmlTooltip, gameDataHtmlTooltip) {
    const normalize = (s) => s.replace(/\s+/g, " ").trim();

    if (normalize(gameDataHtmlTooltip) !== normalize(indexHtmlTooltip)) {
        console.log("HTML tooltip:", normalize(indexHtmlTooltip));
        console.log("");
        console.log("Converted tooltip:", normalize(gameDataHtmlTooltip));
        console.log("");
        console.log("Replace tooltip:", gameDataHtmlTooltip);
    }
}

function compareAttributes(abilityPickElement, skill) {
    if (skill.is_passive) {
        return;
    }

    const target = abilityPickElement.getAttribute('target');
    const energy = abilityPickElement.getAttribute('energy');
    const cooldown = abilityPickElement.getAttribute('cooldown');
    const convertedTarget = skill.attributes.target;
    const convertedEnergy = skill.attributes.energy;
    const convertedCooldown = skill.attributes.cooldown;
    if (target !== convertedTarget && target !== convertedTarget.replace('Point', 'Tile')) {
        console.log("Have target:", target);
        console.log("Want target:", convertedTarget);
    }
    if (energy !== convertedEnergy) {
        console.log("Have energy:", energy);
        console.log("Want energy:", convertedEnergy);
    }
    if (cooldown !== convertedCooldown) {
        console.log("Have cooldown:", cooldown);
        console.log("Want cooldown:", convertedCooldown);
    }
}

function stoneshardTooltipToHTML(tooltipDescription, formulaMap) {
    if (!tooltipDescription.trim()) return '';

    if (!formulaMap) formulaMap = {};
    

    let html = tooltipDescription
    .split('##')
    .map(paragraph => 
      `<p>${paragraph
        .trim()
        .replace(/#/g, '<br>\n')
        .replace(/~([a-z]+)~(.*?)~\/~/g, (match, color, text) => replaceTag(color, text))
      }</p>\n\n`
    ).join('');

    if (formulaMap) {
      for (const [key, value] of Object.entries(formulaMap)) {
        html = html.replaceAll(key, value);
      }
    }
    return html;
  }

  function replaceTag(color, text) {
    text = text.replace(/\/\*([^*]+)\*\//g, '<stat-formula>$1</stat-formula>');

    if (color === 'w') {
        return `<strong>${text}</strong>`;
    }
    return `<span class="${getSpanClass(color)}">${text}</span>`;
  }


function getSpanClass(colorCode) {
    const colorMap = {
      lg: 'buff',
      r: 'harm',
      b: 'energy',
      p: 'arcane',
      o: 'fire',
      y: 'geo',
      ly: 'shock',
      bl: 'energy',
    };
    return colorMap[colorCode] || 'unknown-tag';
}