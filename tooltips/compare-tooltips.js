// Build
// -----
//
// Build or rebuild the container after changing dependencies or the shared tooltip formatter:
//
// docker build -t compare-tooltips -f tooltips/Dockerfile .
//
// All skills
// ----------
//
// Compare the tooltips of all skills:
//
// docker run --rm -v ${PWD}/tooltips/stoneshard-tooltips-and-formulas.json:/src/stoneshard-tooltips-and-formulas.json -v ${PWD}/tooltips/compare-tooltips.js:/src/compare-tooltips.js -v ${PWD}/index.html:/src/index.html compare-tooltips
//
// Update the tooltips of all skills in index.html:
//
// docker run --rm -v ${PWD}/tooltips/stoneshard-tooltips-and-formulas.json:/src/stoneshard-tooltips-and-formulas.json -v ${PWD}/tooltips/compare-tooltips.js:/src/compare-tooltips.js -v ${PWD}/index.html:/src/index.html compare-tooltips --write
//
// One skill
// ---------
//
// Compare the tooltip of a single skill:
//
// docker run --rm -v ${PWD}/tooltips/stoneshard-tooltips-and-formulas.json:/src/stoneshard-tooltips-and-formulas.json -v ${PWD}/tooltips/compare-tooltips.js:/src/compare-tooltips.js -v ${PWD}/index.html:/src/index.html compare-tooltips armored_combat 0
//
// Update the tooltip of a single skill in index.html:
//
// docker run --rm -v ${PWD}/tooltips/stoneshard-tooltips-and-formulas.json:/src/stoneshard-tooltips-and-formulas.json -v ${PWD}/tooltips/compare-tooltips.js:/src/compare-tooltips.js -v ${PWD}/index.html:/src/index.html compare-tooltips --write armored_combat 0
//
// Note
// ----
//
// Without --write, the script only reports differences.
// With --write, it updates index.html and formats the result with Prettier.

import fs from 'fs';
import * as cheerio from 'cheerio';
import * as prettier from 'prettier';

import { stoneshardTooltipToHTML } from '../components/tooltip-description/stoneshard-tooltip-to-html.js';

/**
 * @typedef {Object.<string, SkillData[]>} GameData
 */

/**
 * @typedef {Object} SkillData
 * @property {SkillName} name
 * @property {SkillTooltip} tooltip
 * @property {FormulaMap} [formulas]
 * @property {boolean} is_passive
 * @property {SkillAttributes} [attributes]
 * @property {UnlockRequirements} [unlock_requirements]
 */

/**
 * @typedef {Object} SkillName
 * @property {string} english
 */

/**
 * @typedef {Object} SkillTooltip
 * @property {string} english
 */

/**
 * @typedef {Object.<string, string>} FormulaMap
 */

/**
 * @typedef {Object} SkillAttributes
 * @property {string} target
 * @property {string} energy
 * @property {string} cooldown
 * @property {string} fumble_chance
 * @property {string} armor_penetration
 * @property {string} spell
 */

/**
 * @typedef {Object} UnlockRequirements
 * @property {number} level
 * @property {number} attribute_points
 * @property {string[]} attributes
 */

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Load tooltips from game data.
  const gameDataJson = fs.readFileSync('./stoneshard-tooltips-and-formulas.json', 'utf-8');
  const gameData = JSON.parse(gameDataJson);

  // Load tooltips from index.html document.
  const html = fs.readFileSync('./index.html', 'utf-8');
  const cheerioOptions = {
    xml: {
      xmlMode: false,
      emptyAttrs: false,
      encodeEntities: 'utf8',
    },
  };
  const $ = cheerio.load(html, cheerioOptions);

  let haveChanges = false;
  if (args.scope === 'one') {
    haveChanges = compareOneSkillTooltip(gameData, $, args.treeName, args.skillIndex, args.write);
  } else if (args.scope === 'all') {
    haveChanges = compareAllSkillsTooltips(gameData, $, args.write);
  }

  if (haveChanges && args.write) {
    await formatAndWriteIndexHtml($);
  }
}

async function formatAndWriteIndexHtml($) {
  const prettierOptions = await prettier.resolveConfig('./index.html');

  const formattedHtml = await prettier.format($.html(), {
    ...prettierOptions,
    filepath: './index.html',
  });

  fs.writeFileSync('./index.html', formattedHtml, 'utf-8');
}

/**
 * Parses command-line arguments for compare mode versus write mode and optional single-skill scope.
 *
 * @param {string[]} argv
 * @returns {{write: boolean, scope: 'all'} | {write: boolean, scope: 'one', treeName: string, skillIndex: number}}
 */
function parseArgs(argv) {
  const write = argv.includes('--write');
  const positionalArgs = argv.filter((arg) => arg !== '--write');

  if (positionalArgs.length === 0) {
    return { write, scope: 'all' };
  }

  if (positionalArgs.length === 2) {
    const [treeName, skillIndexStr] = positionalArgs;
    const skillIndex = parseInt(skillIndexStr, 10);

    if (!treeName || isNaN(skillIndex)) {
      throw new Error('Usage: node compare-tooltips.js [--write] [<tree-name> <skill-index>]');
    }

    return { write, scope: 'one', treeName, skillIndex };
  }

  throw new Error('Usage: node compare-tooltips.js [--write] [<tree-name> <skill-index>]');
}

/**
 * Compares all skills in the game data against the matching abilities in index.html.
 * If write is enabled, updates any differing tooltip text or attributes in the DOM.
 *
 * @param {GameData} gameData
 * @param {import('cheerio').CheerioAPI} $
 * @param {boolean} write
 * @returns {boolean} True if any skill has tooltip or attribute differences.
 */
function compareAllSkillsTooltips(gameData, $, write) {
  let haveChanges = false;
  for (var treeName in gameData) {
    for (var skillIndexStr in gameData[treeName]) {
      const skillIndex = parseInt(skillIndexStr, 10);
      const skillChanged = compareOneSkillTooltip(gameData, $, treeName, skillIndex, write);
      haveChanges = skillChanged || haveChanges;
    }
  }

  return haveChanges;
}

/**
 * Compares one skill entry from the game data against the matching ability in index.html.
 * If write is enabled, updates any differing tooltip text or attributes in the DOM.
 *
 * @param {GameData} gameData
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} treeName
 * @param {number} skillIndex
 * @param {boolean} write
 * @returns {boolean} True if the skill has any tooltip or attribute differences.
 */
function compareOneSkillTooltip(gameData, $, treeName, skillIndex, write) {
  const tree = gameData[treeName];
  if (!tree) {
    throw new Error(`Could not find tree '${treeName}'`);
  }
  const skill = tree[skillIndex];
  if (!skill) {
    throw new Error(`Could not find skill on tree '${treeName}' with index ${skillIndex}`);
  }

  const englishTooltip = skill.tooltip.english;
  const formulaMap = skill.formulas;
  const gameDataHtmlTooltip = stoneshardTooltipToHTML(englishTooltip, formulaMap);

  const abilityPickID = `#${treeName}-${skillIndex + 1}`;
  const abilityPickElement = $(abilityPickID);
  if (abilityPickElement.length === 0) {
    throw new Error(`Element not found in HTML with ${abilityPickID}`);
  }

  const compareTitle = `---- Comparing: ${abilityPickID} = ${skill.name.english}`;

  // Compare tooltips.
  const tooltipChanged = compareTooltip(
    abilityPickElement,
    gameDataHtmlTooltip,
    compareTitle,
    write,
  );

  // Compare attributes.
  const attributesChanged = compareAttributes(abilityPickElement, skill, compareTitle, write);

  return tooltipChanged || attributesChanged;
}

/**
 * Compares an ability tooltip description with the game data version.
 * If write is enabled, updates the tooltip HTML in the DOM.
 *
 * @param {import('cheerio').Cheerio<any>} abilityPickElement
 * @param {string} gameDataHtmlTooltip
 * @param {string} compareTitle
 * @param {boolean} write
 * @returns {boolean} True if the tooltip differs from the HTML version.
 */
function compareTooltip(abilityPickElement, gameDataHtmlTooltip, compareTitle, write) {
  const abilityPickTooltip = abilityPickElement.find('div.tooltip-description').first();
  if (abilityPickTooltip.length === 0) {
    throw new Error(`Tooltip description not found in HTML with ${compareTitle}`);
  }

  const indexHtmlTooltip = abilityPickTooltip.html() ?? '';

  if (normalize(gameDataHtmlTooltip) !== normalize(indexHtmlTooltip)) {
    console.log(compareTitle);
    console.log(humanize(gameDataHtmlTooltip));
    if (write) {
      abilityPickTooltip.html(gameDataHtmlTooltip);
    }
    return true;
  }

  return false;
}

function normalize(s) {
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/<p>\s+/g, '<p>');
  s = s.replace(/\s+<\/p>/g, '</p>');
  return s;
}

// See Semantic Linefeeds.
function humanize(s) {
  const ind = '    ';
  s = s.replaceAll('<br>\n', `<br>\n${ind}`);
  s = s.replaceAll(' as well as ', `\n${ind}as well as `);
  s = s.replaceAll(' for each ', `\n${ind}for each `);
  s = s.replaceAll(' (but ', `\n${ind}(but `);
  s = s.replaceAll(' but ', `\n${ind}but `);
  s = s.replaceAll(' (if ', `\n${ind}(if `);
  s = s.replaceAll(' for <strong>', `\n${ind}for <strong>`);
  s = s.replaceAll(' with <strong>', `\n${ind}with <strong>`);
  s = s.replaceAll(' and ', `\n${ind}and `);
  s = s.replaceAll(', and ', `,\n${ind}and `);
  s = s.replaceAll(', ', `,\n${ind}`);
  s = s.replaceAll('. ', `.\n${ind}`);
  return s;
}

/**
 * Compares the HTML attributes of an ability with the game data values.
 * If write is enabled, updates the differing attributes in the DOM.
 *
 * @param {import('cheerio').Cheerio<any>} abilityPickElement
 * @param {SkillData} skill
 * @param {string} compareTitle
 * @param {boolean} write
 * @returns {boolean} True if any compared attribute differs from the HTML version.
 */
function compareAttributes(abilityPickElement, skill, compareTitle, write) {
  const unlockRequirementsChanged = compareUnlockRequirementAttributes(
    abilityPickElement,
    skill,
    compareTitle,
    write,
  );

  if (skill.is_passive) {
    return unlockRequirementsChanged;
  }

  const activeSkillAttributesChanged = compareActiveSkillAttributes(
    abilityPickElement,
    skill,
    compareTitle,
    write,
  );

  return unlockRequirementsChanged || activeSkillAttributesChanged;
}

function compareUnlockRequirementAttributes(abilityPickElement, skill, compareTitle, write) {
  const requirements = skill.unlock_requirements;
  const wantUnlockLevel = requirements ? String(requirements.level) : undefined;
  const wantUnlockAttributePoints = requirements
    ? String(requirements.attribute_points)
    : undefined;
  const wantUnlockAttributes = requirements ? requirements.attributes.join(' ') : undefined;

  let haveChanges = false;

  haveChanges =
    compareAndSyncAttribute(
      abilityPickElement,
      'unlock-level',
      wantUnlockLevel,
      compareTitle,
      write,
    ) || haveChanges;
  haveChanges =
    compareAndSyncAttribute(
      abilityPickElement,
      'unlock-attribute-points',
      wantUnlockAttributePoints,
      compareTitle,
      write,
    ) || haveChanges;
  haveChanges =
    compareAndSyncAttribute(
      abilityPickElement,
      'unlock-attributes',
      wantUnlockAttributes,
      compareTitle,
      write,
    ) || haveChanges;

  return haveChanges;
}

function compareActiveSkillAttributes(abilityPickElement, skill, compareTitle, write) {
  const haveTarget = abilityPickElement.attr('target');
  const haveEnergy = abilityPickElement.attr('energy');
  const haveCooldown = abilityPickElement.attr('cooldown');
  const haveBackfireChance = abilityPickElement.attr('backfire-chance');
  const haveArmorPenetration = abilityPickElement.attr('armor-penetration');
  const wantTarget = normalizeTarget(skill.attributes.target);
  const wantEnergy = skill.attributes.energy;
  const wantCooldown = skill.attributes.cooldown;
  const wantBackfireChance = skill.attributes.fumble_chance;
  const wantArmorPenetration = normalizeOptionalAttribute(skill.attributes.armor_penetration);

  let haveChanges = false;

  if (haveTarget !== wantTarget) {
    console.log(compareTitle);
    console.log('Have target:', haveTarget);
    console.log('Want target:', wantTarget);
    if (write) {
      abilityPickElement.attr('target', wantTarget);
    }
    haveChanges = true;
  }
  if (haveEnergy !== wantEnergy) {
    console.log(compareTitle);
    console.log('Have energy:', haveEnergy);
    console.log('Want energy:', wantEnergy);
    if (write) {
      abilityPickElement.attr('energy', wantEnergy);
    }
    haveChanges = true;
  }
  if (haveCooldown !== wantCooldown) {
    console.log(compareTitle);
    console.log('Have cooldown:', haveCooldown);
    console.log('Want cooldown:', wantCooldown);
    if (write) {
      abilityPickElement.attr('cooldown', wantCooldown);
    }
    haveChanges = true;
  }
  if (skill.attributes.spell === '1' && haveBackfireChance !== wantBackfireChance) {
    console.log(compareTitle);
    console.log('Have backfire chance:', haveBackfireChance);
    console.log('Want backfire chance:', wantBackfireChance);
    if (write) {
      abilityPickElement.attr('backfire-chance', wantBackfireChance);
    }
    haveChanges = true;
  }
  if (skill.attributes.spell === '1' && haveArmorPenetration !== wantArmorPenetration) {
    console.log(compareTitle);
    console.log('Have armor penetration:', haveArmorPenetration);
    console.log('Want armor penetration:', wantArmorPenetration);
    if (write) {
      setOrRemoveAttribute(abilityPickElement, 'armor-penetration', wantArmorPenetration);
    }
    haveChanges = true;
  }

  return haveChanges;
}

function compareAndSyncAttribute(element, attributeName, wantValue, compareTitle, write) {
  const haveValue = element.attr(attributeName);

  if (haveValue === wantValue) {
    return false;
  }

  console.log(compareTitle);
  console.log(`Have ${attributeName}:`, haveValue);
  console.log(`Want ${attributeName}:`, wantValue);

  if (write) {
    setOrRemoveAttribute(element, attributeName, wantValue);
  }

  return true;
}

function normalizeTarget(target) {
  return target.replace('Point', 'Tile');
}

function normalizeOptionalAttribute(value) {
  return value === 'x' ? undefined : value;
}

/**
 * Sets an attribute on an element, or removes it when the game data uses 'x' to mean no value.
 *
 * @param {import('cheerio').Cheerio<any>} element
 * @param {string} attributeName
 * @param {string | undefined} value
 * @returns {void}
 */
function setOrRemoveAttribute(element, attributeName, value) {
  if (value === undefined) {
    element.removeAttr(attributeName);
    return;
  }

  element.attr(attributeName, value);
}
