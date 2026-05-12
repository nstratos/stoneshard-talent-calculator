/**
 * @typedef {import('./character.js').default} Character
 * @typedef {import('./stats.js').StatKey} StatKey
 *
 * @typedef {{
 *   level: number,
 *   attributePoints: number,
 *   attributes: StatKey[],
 * }} AbilityUnlockRequirements
 *
 * @typedef {{
 *   isSatisfied: boolean,
 *   remainingAttributePoints: number,
 * }} AbilityUnlockRequirementState
 */

/**
 * Computes the current display state for an ability unlock requirement.
 *
 * Attribute requirements use the combined invested points across all listed attributes.
 *
 * @param {AbilityUnlockRequirements} requirements
 * @param {Character} character
 * @param {number} currentLevel
 * @returns {AbilityUnlockRequirementState}
 */
export function computeAbilityUnlockRequirementState(requirements, character, currentLevel) {
  const isLevelSatisfied = currentLevel >= requirements.level;

  let investedAttributePoints = 0;
  for (const attribute of requirements.attributes) {
    investedAttributePoints += Math.max(
      character.getEffectiveStat(attribute) - character.getBaseStat(attribute),
      0,
    );
  }

  const remainingAttributePoints = Math.max(
    requirements.attributePoints - investedAttributePoints,
    0,
  );

  return {
    isSatisfied: isLevelSatisfied || remainingAttributePoints === 0,
    remainingAttributePoints,
  };
}
