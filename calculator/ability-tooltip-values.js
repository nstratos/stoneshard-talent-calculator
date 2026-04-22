function roundDisplayedDecimal(value) {
  return Number(value.toFixed(3));
}

/**
 * @typedef {Object} AbilityTooltipBaseValues
 * @property {number | null} energy
 * @property {number | null} cooldown
 * @property {number | null} backfireChance
 * @property {number | null} armorPenetration
 * @property {boolean} isSpell
 */

/**
 * @typedef {Object} AbilityTooltipDisplayValues
 * @property {number | null} energy
 * @property {number | null} cooldown
 * @property {number | null} backfireChance
 * @property {number | null} backfireDamage
 * @property {number | null} armorPenetration
 */

/**
 * @param {number | null} baseCooldown
 * @param {number} cooldownsDuration
 * @returns {number | null}
 */
export function computeDisplayedCooldown(baseCooldown, cooldownsDuration) {
  if (baseCooldown == null) return null;

  return Math.max(0, Math.round((baseCooldown * cooldownsDuration) / 100));
}

/**
 * @param {number | null} baseEnergyCost
 * @param {number} abilitiesEnergyCost
 * @param {number} categoryEnergyCostMultiplier
 * @returns {number | null}
 */
export function computeDisplayedEnergyCost(
  baseEnergyCost,
  abilitiesEnergyCost,
  categoryEnergyCostMultiplier,
) {
  if (baseEnergyCost == null) return null;

  return Math.max(
    0,
    Math.round((baseEnergyCost * abilitiesEnergyCost * categoryEnergyCostMultiplier) / 10000),
  );
}

/**
 * @param {number | null} baseBackfireChance
 * @param {number} characterBackfireChance
 * @returns {number | null}
 */
export function computeDisplayedBackfireChance(baseBackfireChance, characterBackfireChance) {
  if (baseBackfireChance == null) return null;

  return Math.max(0, roundDisplayedDecimal(baseBackfireChance + characterBackfireChance));
}

/**
 * @param {number | null} displayedEnergyCost
 * @param {number} backfireDamagePercent
 * @returns {number | null}
 */
export function computeDisplayedBackfireDamage(displayedEnergyCost, backfireDamagePercent) {
  if (displayedEnergyCost == null) return null;

  return Math.max(0, Math.round((displayedEnergyCost * backfireDamagePercent) / 100));
}

/**
 * @param {number | null} baseArmorPenetration
 * @param {number} bonusArmorPenetration
 * @returns {number | null}
 */
export function computeDisplayedArmorPenetration(baseArmorPenetration, bonusArmorPenetration) {
  if (baseArmorPenetration == null) return null;

  return Math.max(0, roundDisplayedDecimal(baseArmorPenetration + bonusArmorPenetration));
}

/**
 * @param {AbilityTooltipBaseValues} base
 * @param {import('./character.js').default} character
 * @returns {AbilityTooltipDisplayValues}
 */
export function computeAbilityTooltipValues(base, character) {
  const isSpell = base.isSpell;
  const categoryEnergyCostMultiplier = isSpell
    ? 100 + character.spellsEnergyCost
    : 100 + character.skillsEnergyCost;

  const energy = computeDisplayedEnergyCost(
    base.energy,
    character.abilitiesEnergyCost,
    categoryEnergyCostMultiplier,
  );
  const cooldown = computeDisplayedCooldown(base.cooldown, character.cooldownsDuration);
  const backfireChance = isSpell
    ? computeDisplayedBackfireChance(base.backfireChance, character.backfireChance)
    : null;
  const backfireDamage = isSpell
    ? computeDisplayedBackfireDamage(energy, character.backfireDamage)
    : null;
  const armorPenetrationBonus = isSpell ? character.spellArmorPiercing : 0;
  const armorPenetration = computeDisplayedArmorPenetration(
    base.armorPenetration,
    armorPenetrationBonus,
  );

  return {
    energy,
    cooldown,
    backfireChance,
    backfireDamage,
    armorPenetration,
  };
}
