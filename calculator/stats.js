export const STATS = Object.freeze({
  STR: "STR",
  AGI: "AGI",
  PER: "PER",
  VIT: "VIT",
  WIL: "WIL",
});

/** @typedef {keyof typeof STATS} StatKey */

export const STAT_LABELS = Object.freeze({
    STR: "Strength",
    AGI: "Agility",
    PER: "Perception",
    VIT: "Vitality",
    WIL: "Willpower",
});

export const STAT_RULES = Object.freeze({
  MAX_VALUE: 30,
});