import { STATS } from './stats.js';

/**
 * Types
 * -----
 * @typedef {import('./stats.js').StatKey} StatKey
 * @typedef {{ type: 'ability', id: string } | { type: 'stat', id: StatKey }} Allocation
 * @typedef {{ allocations: Allocation[] }} LevelEntry
 */

export default class BuildLedger {
  /** @type {(null | LevelEntry)[]} */
  #levels;

  /** @type {number} */
  #startingStatPoints;

  /** @type {number} */
  #startingAbilityPoints;

  constructor(startingStatPoints = 0, startingAbilityPoints = 2) {
    if (startingStatPoints < 0 || startingAbilityPoints < 0) {
      throw new Error('Starting points must be non-negative');
    }
    this.#startingStatPoints = startingStatPoints;
    this.#startingAbilityPoints = startingAbilityPoints;

    // Index 0 is unused. Level 1 is essentially #levels[1].
    this.#levels = [null, { allocations: [] }];
  }

  /**
   * Returns the total number of ability points earned in all levels.
   *
   * A character starts with `startingAbilityPoints` ability points at level 1 and gains +1 per level after.
   *
   * @returns {number}
   */
  get totalAbilityPointsEarned() {
    return this.#startingAbilityPoints + (this.level - 1);
  }

  /**
   * Returns the total number of stat points earned in all levels.
   *
   * A character starts with `startingStatPoints` stat points at level 1 and gains +1 per level after.
   *
   * @returns {number}
   */
  get totalStatPointsEarned() {
    return this.#startingStatPoints + (this.level - 1);
  }

  /**
   * Returns the current level of the build.
   *
   * @returns {number}
   */
  get level() {
    return this.#levels.length - 1;
  }

  /**
   * Returns the number of ability points currently available to spend.
   * @returns {number}
   */
  get remainingAbilityPoints() {
    return this.totalAbilityPointsEarned - this.#countAllocations('ability');
  }

  /**
   * Returns the number of stat points currently available to spend.
   * @returns {number}
   */
  get remainingStatPoints() {
    return this.totalStatPointsEarned - this.#countAllocations('stat');
  }

  /**
   * Advances the character by one level.
   *
   * Ability and stat points are derived from the character's level:
   * - At level 1, the character has 2 ability points and 0 stat points.
   * - Each additional level increases both totals by 1.
   *
   * @returns {{ ok: true }}
   */
  levelUp() {
    this.#levels.push({ allocations: [] });
    return { ok: true };
  }

  /**
   * Levels down the character by one level, only if there are no allocations on the current level.
   *
   * @returns {{ ok: true } | { ok: false, reason: 'min-level' | 'not-empty' }}
   */
  levelDown() {
    if (this.level === 1) {
      return { ok: false, reason: 'min-level' };
    }

    if (this.#levels[this.level].allocations.length !== 0) {
      return { ok: false, reason: 'not-empty' };
    }

    this.#levels.pop();
    return { ok: true };
  }

  /**
   * Returns true it's possible to level down.
   *
   * @returns {boolean}
   */
  canLevelDown() {
    if (this.level === 1) {
      return false;
    }

    if (this.#levels[this.level].allocations.length !== 0) {
      return false;
    }

    return true;
  }

  /**
   * Adds an obtained ability to the build at the current level.
   *
   * @param {string} abilityId
   * @returns {{ ok: true } | { ok: false, reason: 'duplicate' | 'no-ability-points' }}
   */
  addAbility(abilityId) {
    const levelEntry = this.#levels[this.level];
    if (levelEntry == null) throw new Error(`level ${this.level} does not exist`);
    if (this.#isAbilityAllocated(abilityId)) {
      return { ok: false, reason: 'duplicate' };
    }

    const remainingAbilityPoints =
      this.totalAbilityPointsEarned - this.#countAllocations('ability');
    if (remainingAbilityPoints <= 0) {
      return { ok: false, reason: 'no-ability-points' };
    }

    levelEntry.allocations.push({ type: 'ability', id: abilityId });
    return { ok: true };
  }

  /**
   * Returns true if an ability is already allocated.
   *
   * @param {string} abilityId
   * @returns {boolean}
   */
  #isAbilityAllocated(abilityId) {
    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      for (const allocation of this.#levels[lvl].allocations) {
        if (allocation.type === 'ability' && allocation.id === abilityId) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Returns the number of stats or abilities allocated in the build.
   *
   * @param {'stat' | 'ability'} allocationType
   * @returns {number}
   */
  #countAllocations(allocationType) {
    let n = 0;
    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      for (const allocation of this.#levels[lvl].allocations) {
        if (allocation.type === allocationType) n++;
      }
    }
    return n;
  }

  /**
   * Adds an increased stat to the build at the current level.
   *
   * @param {StatKey} stat
   * @returns {{ ok: true } | { ok: false, reason: 'no-stat-points' }}
   */
  addStat(stat) {
    const levelEntry = this.#levels[this.level];
    if (levelEntry == null) throw new Error(`level ${this.level} does not exist`);

    const remainingStatPoints = this.totalStatPointsEarned - this.#countAllocations('stat');
    if (remainingStatPoints <= 0) {
      return { ok: false, reason: 'no-stat-points' };
    }

    levelEntry.allocations.push({ type: 'stat', id: stat });
    return { ok: true };
  }

  /**
   * Refunds one stat point of the given stat from the current level entry.
   *
   * @param {StatKey} stat
   * @returns {{ ok: true, removed: 1 } | { ok: false, reason: 'not-found' }}
   */
  refundStatInCurrentLevel(stat) {
    const levelEntry = this.#levels[this.level];
    if (levelEntry == null) throw new Error(`level ${this.level} does not exist`);

    for (let i = levelEntry.allocations.length - 1; i >= 0; i--) {
      if (levelEntry.allocations[i].type === 'stat' && levelEntry.allocations[i].id === stat) {
        levelEntry.allocations.splice(i, 1);

        return { ok: true, removed: 1 };
      }
    }

    return { ok: false, reason: 'not-found' };
  }

  /**
   * Refunds one stat point of the given stat, scanning from the highest level down.
   *
   * @param {StatKey} stat
   * @returns {{ ok: true, removed: 1, level: number } | { ok: false, reason: 'not-found' }}
   */
  refundStat(stat) {
    for (let lvl = this.level; lvl >= 1; lvl--) {
      const levelEntry = this.#levels[lvl];
      for (let i = levelEntry.allocations.length - 1; i >= 0; i--) {
        const a = levelEntry.allocations[i];
        if (a.type === 'stat' && a.id === stat) {
          levelEntry.allocations.splice(i, 1);
          return { ok: true, removed: 1, level: lvl };
        }
      }
    }

    return { ok: false, reason: 'not-found' };
  }

  /**
   * Returns true if at least one point of the given stat is allocated anywhere.
   *
   * @param {StatKey} stat
   * @returns {boolean}
   */
  canRefundStat(stat) {
    return this.getAllocatedStat(stat) > 0;
  }

  /**
   * Removes the most recently-added allocation (ability or stat), scanning from the highest level down.
   *
   * @returns {{ ok: true, removed: 1, allocation: Allocation, level: number } | { ok: false, reason: 'empty' }}
   */
  undoLast() {
    for (let lvl = this.level; lvl >= 1; lvl--) {
      if (this.#levels[lvl].allocations.length > 0) {
        const levelEntry = this.#levels[lvl];
        const allocation = levelEntry.allocations.pop();

        return { ok: true, removed: 1, allocation: allocation, level: lvl };
      }
    }

    return { ok: false, reason: 'empty' };
  }

  /**
   * Refunds an obtained ability.
   *
   * @param {string} abilityId
   * @returns {{ ok: true, removed: 1 } | { ok: false, reason: 'not-found' }}
   */
  refundAbility(abilityId) {
    for (let lvl = this.level; lvl >= 1; lvl--) {
      const levelEntry = this.#levels[lvl];
      for (let i = levelEntry.allocations.length - 1; i >= 0; i--) {
        if (
          levelEntry.allocations[i].type === 'ability' &&
          levelEntry.allocations[i].id === abilityId
        ) {
          levelEntry.allocations.splice(i, 1);

          return { ok: true, removed: 1 };
        }
      }
    }

    return { ok: false, reason: 'not-found' };
  }

  /**
   * Refunds multiple abilities at once (e.g. when refunding an ability out of order).
   *
   * @param {string[]} abilityIds
   * @returns {{ ok: true, removed: number } | { ok: false, reason: 'none-found' }}
   */
  refundAbilities(abilityIds) {
    let removed = 0;
    const toRemove = new Set(abilityIds);

    for (let lvl = this.level; lvl >= 1; lvl--) {
      const levelEntry = this.#levels[lvl];
      for (let i = levelEntry.allocations.length - 1; i >= 0; i--) {
        if (
          levelEntry.allocations[i].type === 'ability' &&
          toRemove.has(levelEntry.allocations[i].id)
        ) {
          levelEntry.allocations.splice(i, 1);
          removed++;
        }
      }
    }

    if (removed === 0) {
      return { ok: false, reason: 'none-found' };
    }
    return { ok: true, removed: removed };
  }

  /**
   * Returns the total number of points allocated to the given stat.
   *
   * @param {StatKey} stat
   * @returns {number}
   */
  getAllocatedStat(stat) {
    let total = 0;

    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      for (const allocation of this.#levels[lvl].allocations) {
        if (allocation.type === 'stat' && allocation.id === stat) {
          total++;
        }
      }
    }

    return total;
  }

  /**
   * Returns all allocated stat totals keyed by stat.
   *
   * @returns {Record<StatKey, number>}
   */
  getAllocatedStats() {
    const totals = {};

    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      for (const allocation of this.#levels[lvl].allocations) {
        if (allocation.type === 'stat') {
          totals[allocation.id] = (totals[allocation.id] ?? 0) + 1;
        }
      }
    }

    return totals;
  }

  /**
   * Returns abilities in the order they were obtained, with the level they were obtained at.
   * @returns {{ abilityId: string, level: number }[]}
   */
  getObtainedAbilitiesInOrder() {
    /** @type {{ abilityId: string, level: number }[]} */
    const out = [];
    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      for (const a of this.#levels[lvl].allocations) {
        if (a.type === 'ability') out.push({ abilityId: a.id, level: lvl });
      }
    }
    return out;
  }

  /**
   * Returns stat increases in the order they were allocated, with the level they were allocated at.
   * @returns {{ level: number, stat: StatKey }[]}
   */
  getStatIncreasesInOrder() {
    /** @type {{ level: number, stat: StatKey }[]} */
    const out = [];
    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      for (const a of this.#levels[lvl].allocations) {
        if (a.type === 'stat') out.push({ level: lvl, stat: a.id });
      }
    }
    return out;
  }

  /**
   * Returns true if an ability is allocated anywhere in the build.
   * @param {string} abilityId
   * @returns {boolean}
   */
  hasAbility(abilityId) {
    return this.#isAbilityAllocated(abilityId);
  }

  /**
   * Returns true if a stat is allocated in the current level.
   * @param {StatKey} stat
   * @returns {boolean}
   */
  hasStatInCurrentLevel(stat) {
    for (const allocation of this.#levels[this.level].allocations) {
      if (allocation.type === 'stat' && allocation.id === stat) {
        return true;
      }
    }
    return false;
  }

  /**
   * @returns {{
   *   startingStatPoints: number,
   *   startingAbilityPoints: number,
   *   levels: (null | { allocations: Allocation[] })[]
   * }}
   */
  toJSON() {
    return {
      startingStatPoints: this.#startingStatPoints,
      startingAbilityPoints: this.#startingAbilityPoints,
      levels: this.#levels.map((lvl) =>
        lvl == null ? null : { allocations: lvl.allocations.slice() },
      ),
    };
  }

  /**
   * @param {any} data
   * @returns {BuildLedger}
   */
  static fromJSON(data) {
    if (data == null || typeof data !== 'object') {
      throw new Error('Invalid ledger JSON: expected object');
    }

    const startingStatPoints =
      typeof data.startingStatPoints === 'number' ? data.startingStatPoints : 0;

    const startingAbilityPoints =
      typeof data.startingAbilityPoints === 'number' ? data.startingAbilityPoints : 2;

    if (!Number.isFinite(startingStatPoints) || startingStatPoints < 0) {
      throw new Error('Invalid ledger JSON: startingStatPoints must be a non-negative number');
    }
    if (!Number.isFinite(startingAbilityPoints) || startingAbilityPoints < 0) {
      throw new Error('Invalid ledger JSON: startingAbilityPoints must be a non-negative number');
    }

    if (!Array.isArray(data.levels)) {
      throw new Error('Invalid ledger JSON: levels must be an array');
    }

    const ledger = new BuildLedger(startingStatPoints, startingAbilityPoints);

    /** @type {(null | LevelEntry)[]} */
    const levels = [];
    levels[0] = null;

    for (let i = 1; i < data.levels.length; i++) {
      const lvl = data.levels[i];
      // If we somehow get null for level > 0, change to empty allocations entry.
      if (lvl == null) {
        levels[i] = { allocations: [] };
        continue;
      }

      if (typeof lvl !== 'object' || !Array.isArray(lvl.allocations)) {
        throw new Error(`Invalid ledger JSON: levels[${i}] must have allocations[]`);
      }

      /** @type {Allocation[]} */
      const allocations = [];

      for (let j = 0; j < lvl.allocations.length; j++) {
        const a = lvl.allocations[j];
        if (a == null || typeof a !== 'object') {
          throw new Error(`Invalid ledger JSON: levels[${i}].allocations[${j}] must be an object`);
        }

        if (a.type === 'ability') {
          if (typeof a.id !== 'string' || a.id.length === 0) {
            throw new Error(`Invalid ledger JSON: ability id must be a non-empty string`);
          }
          allocations.push({ type: 'ability', id: a.id });
          continue;
        }

        if (a.type === 'stat') {
          if (typeof a.id !== 'string') {
            throw new Error(`Invalid ledger JSON: stat id must be a string`);
          }
          if (!(a.id in STATS)) {
            throw new Error(`Invalid ledger JSON: unknown stat key "${a.id}"`);
          }
          allocations.push({ type: 'stat', id: /** @type {any} */ (a.id) });
          continue;
        }

        throw new Error(`Invalid ledger JSON: unknown allocation type "${a.type}"`);
      }

      levels[i] = { allocations };
    }

    if (levels.length < 2) {
      levels[1] = { allocations: [] };
    }

    ledger.#levels = levels;

    // Pop any trailing empty levels.
    while (ledger.level > 1 && ledger.#levels[ledger.level].allocations.length === 0) {
      ledger.#levels.pop();
    }

    return ledger;
  }

  /**
   * Returns true if the build has no allocations (abilities or stats).
   * @returns {boolean}
   */
  isEmpty() {
    for (let lvl = 1; lvl < this.#levels.length; lvl++) {
      if (this.#levels[lvl].allocations.length > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Imports legacy builds where level 1 has 2 abilities and then 1 per level,
   * by spending ability points immediately and leveling up when remaining points hit 0.
   *
   * @param {string[]} abilityOrder
   * @returns {{ ok: true } | { ok: false, reason: 'duplicate' | 'no-ability-points', abilityId: string }}
   */
  importLegacyAbilityOrder(abilityOrder) {
    for (let i = 0; i < abilityOrder.length; i++) {
      const abilityId = abilityOrder[i];

      const res = this.addAbility(abilityId);
      if (!res.ok) return { ok: false, reason: res.reason, abilityId };

      const hasMore = i < abilityOrder.length - 1;
      if (hasMore && this.remainingAbilityPoints === 0) {
        this.levelUp();
      }
    }
    return { ok: true };
  }
}
