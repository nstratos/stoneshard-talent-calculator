import assert from 'node:assert/strict';
import test from 'node:test';

import { stoneshardTooltipToHTML } from './stoneshard-tooltip-to-html.js';

test('stoneshardTooltipToHTML preserves formula keys while replacing formula text', () => {
  const tooltip = 'Deals ~o~/*Fire_Damage*/ Fire Damage~/~ with ~w~/*Hit_Chance*/%~/~ Accuracy.';
  const formulaMap = {
    Fire_Damage: '(7 * Magic_Power / 100)',
    Hit_Chance: '100',
  };

  assert.equal(
    stoneshardTooltipToHTML(tooltip, formulaMap),
    '<p>Deals <span class="fire"><stat-formula formula-key="Fire_Damage">(7 * Magic_Power / 100)</stat-formula> Fire Damage</span> with <strong><stat-formula formula-key="Hit_Chance">100</stat-formula>%</strong> Accuracy.</p>\n\n',
  );
});

test('stoneshardTooltipToHTML replaces longer formula keys first', () => {
  const tooltip = 'Limits damage to ~w~/*Max_HP_Limit*/~/~.';
  const formulaMap = {
    HP_Limit: '16',
    Max_HP_Limit: 'math_round(20 * Magic_Power / 100)',
  };

  assert.equal(
    stoneshardTooltipToHTML(tooltip, formulaMap),
    '<p>Limits damage to <strong><stat-formula formula-key="Max_HP_Limit">math_round(20 * Magic_Power / 100)</stat-formula></strong>.</p>\n\n',
  );
});
