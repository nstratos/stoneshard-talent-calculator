import test from 'node:test';
import assert from 'node:assert/strict';

import BuildLedger from './build-ledger.js';
import { STATS } from './stats.js';

test('new ledger starts at level 1 with 2 ability points', () => {
  const ledger = new BuildLedger();

  assert.equal(ledger.level, 1);
  assert.equal(ledger.totalAbilityPointsEarned, 2);
  assert.equal(ledger.totalStatPointsEarned, 0);
});

test('cannot add more abilities than available points', () => {
  const ledger = new BuildLedger();

  ledger.addAbility('a');
  ledger.addAbility('b');

  const result = ledger.addAbility('c');

  assert.deepEqual(result, { ok: false, reason: 'no-ability-points' });
});

test('refundAbility removes an obtained ability', () => {
  const ledger = new BuildLedger();

  ledger.addAbility('a');

  const refund = ledger.refundAbility('a');

  assert.deepEqual(refund, { ok: true, removed: 1 });

  const again = ledger.refundAbility('a');
  assert.deepEqual(again, { ok: false, reason: 'not-found' });
});

test('addStat fails when no stat points are available', () => {
    const ledger = new BuildLedger();

    const result = ledger.addStat(STATS.STR);
    assert.deepEqual(result, { ok: false, reason: 'no-stat-points' });
});

test('undoLast returns empty when no allocations exist', () => {
    const ledger = new BuildLedger();

    const refund = ledger.undoLast();

    assert.deepEqual(refund, { ok: false, reason: 'empty' });
});


test('undoLast removes last allocation when it is a stat', () => {
    const ledger = new BuildLedger();

    // We need to level up before we can record a stat.
    ledger.levelUp();
    assert.equal(ledger.totalStatPointsEarned, 1);
    const result = ledger.addStat(STATS.STR);
    assert.deepEqual(result, { ok: true });

    const refund = ledger.undoLast();

    assert.deepEqual(refund, {
        ok: true,
        removed: 1,
        allocation: { type: 'stat', id: STATS.STR },
        level: 2
    });

    assert.deepEqual(ledger.undoLast(), { ok: false, reason: 'empty' });
});

test('undoLast removes last allocation when it is an ability', () => {
    const ledger = new BuildLedger();
    const result = ledger.addAbility('swords-1');
    assert.deepEqual(result, { ok: true });

    const refund = ledger.undoLast();

    assert.deepEqual(refund, {
        ok: true,
        removed: 1,
        allocation: { type: 'ability', id: 'swords-1' },
        level: 1
    });

    assert.deepEqual(ledger.undoLast(), { ok: false, reason: 'empty' });
});

test('refundAbilities returns none-found when no abilities are allocated', () => {
    const ledger = new BuildLedger();

    const refund = ledger.refundAbilities(['swords-1', 'swords-2']);

    assert.deepEqual(refund, {
        ok: false,
        reason: 'none-found'
    });
});

test('refundAbilities removes multiple abilities', () => {
    const ledger = new BuildLedger();
    assert.deepEqual(ledger.addAbility('swords-1'), { ok: true });
    assert.deepEqual(ledger.addAbility('swords-2'), { ok: true });

    const refund = ledger.refundAbilities(['swords-1', 'swords-2']);

    assert.deepEqual(refund, {
        ok: true,
        removed: 2
    });

    assert.deepEqual(
        ledger.refundAbilities(['swords-1']),
        { ok: false, reason: 'none-found' }
    );
});
