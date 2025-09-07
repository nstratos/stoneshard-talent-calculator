// Build the container once:
//
// docker build -t compare-tooltips -f tooltips/Dockerfile .
//
// Then run this script to compare the tooltips of all skills:
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

    const compareTitle = `---- Comparing: ${abilityPickID} = ${skill.name.english}`;

    // Compare tooltips.
    const abilityPickTooltip = abilityPickElement.querySelector('div.tooltip-description');
    const indexHtmlTooltip = abilityPickTooltip.innerHTML;
    compareTooltips(indexHtmlTooltip, gameDataHtmlTooltip, compareTitle);

    // Compare attributes.
    compareAttributes(abilityPickElement, skill, compareTitle);
}

function compareTooltips(indexHtmlTooltip, gameDataHtmlTooltip, compareTitle) {
    const normalize = (s) => s.replace(/\s+/g, " ").trim();

    // See Semantic Linefeeds.
    const humanize = (s) => {
        const ind = '    ';
        s = s.replaceAll("<br>\n", `<br>\n${ind}`);
        s = s.replaceAll(" as well as ", `\n${ind}as well as `);
        s = s.replaceAll(" for each ", `\n${ind}for each `);
        s = s.replaceAll(" (but ", `\n${ind}(but `);
        s = s.replaceAll(" but ", `\n${ind}but `);
        s = s.replaceAll(" (if ", `\n${ind}(if `);
        s = s.replaceAll(" for <strong>", `\n${ind}for <strong>`);
        s = s.replaceAll(" with <strong>", `\n${ind}with <strong>`);
        s = s.replaceAll(" and ", `\n${ind}and `);
        s = s.replaceAll(", and ", `,\n${ind}and `);
        s = s.replaceAll(", ", `,\n${ind}`);
        s = s.replaceAll(". ", `.\n${ind}`);
        return s;
    }

    if (normalize(gameDataHtmlTooltip) !== normalize(indexHtmlTooltip)) {
        console.log(compareTitle);
        console.log(humanize(gameDataHtmlTooltip));
    }
}

function compareAttributes(abilityPickElement, skill, compareTitle) {
    if (skill.is_passive) {
        return;
    }

    const haveTarget = abilityPickElement.getAttribute('target');
    const haveEnergy = abilityPickElement.getAttribute('energy');
    const haveCooldown = abilityPickElement.getAttribute('cooldown');
    const haveArmorPenetration = abilityPickElement.getAttribute('armor-penetration');
    const wantTarget = skill.attributes.target;
    const wantEnergy = skill.attributes.energy;
    const wantCooldown = skill.attributes.cooldown;
    const wantArmorPenetration = skill.attributes.armor_penetration === 'x' ? null : skill.attributes.armor_penetration;
    if (haveTarget !== wantTarget && haveTarget !== wantTarget.replace('Point', 'Tile')) {
        console.log(compareTitle);
        console.log("Have target:", haveTarget);
        console.log("Want target:", wantTarget);
    }
    if (haveEnergy !== wantEnergy) {
        console.log(compareTitle);
        console.log("Have energy:", haveEnergy);
        console.log("Want energy:", wantEnergy);
    }
    if (haveCooldown !== wantCooldown) {
        console.log(compareTitle);
        console.log("Have cooldown:", haveCooldown);
        console.log("Want cooldown:", wantCooldown);
    }
    if (skill.attributes.spell === '1' && (haveArmorPenetration !== wantArmorPenetration)) {
        console.log(compareTitle);
        console.log("Have armor penetration:", haveArmorPenetration);
        console.log("Want armor penetration:", wantArmorPenetration);
    }
}

function stoneshardTooltipToHTML(tooltipDescription, formulaMap) {
    if (!tooltipDescription.trim()) return '';

    if (!formulaMap) formulaMap = {};

    // Sort so that formulas with longer keys appear first to avoid the case where a formula like HP_Limit
    // would be applied before Max_HP_Limit and replace part of the longer formula.
    formulaMap = Object.fromEntries(
        Object.entries(formulaMap).sort(([keyA],[keyB]) => keyB.length - keyA.length)
    );

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
        html = html.replace(/<stat-formula>(.*?)<\/stat-formula>/g, (match, innerText) => {
            let formulaText = innerText;
            for (const [key, value] of Object.entries(formulaMap)) {
                formulaText = formulaText.replaceAll(key, value);
            }
            return `<stat-formula>${formulaText}</stat-formula>`;
        });
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
      ur: 'unholy',
      g: 'caustic'
    };
    return colorMap[colorCode] || 'unknown-tag';
}
