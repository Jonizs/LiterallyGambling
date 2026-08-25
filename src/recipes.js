/* The recipe book: every piece the forge can turn out, and what it costs. */
(function (global) {
  "use strict";

  // perTier is the stat a tier-1 piece carries; tier multiplies it. combat is
  // the piece's own handling: it barely moves with tier, so it stays flat here
  // and takes only a gentle share of the quality and edition rolls.
  // level is the smith level the recipe unlocks at; xp is what a tier-1
  // Normal piece is worth at the bench.
  var RECIPES = [
    { key: "sword", name: "Weak Sword", kind: "weapon", icon: "sword",
      level: 1, xp: 15,
      perTier: { damage: 6, durability: 20 },
      combat: { speed: 0.85, crit: 5, critDamage: 150, pen: 0 },
      cost: { wood: 5, metal: 10 } },
    // Worked out at the experimentation bench. research is what learning the
    // recipe costs; until it is paid the blade cannot go on the anvil.
    // Every one of them is quoted against the Weak Sword.
    { key: "lance", name: "Knight's Lance", kind: "weapon", icon: "lance",
      level: 1, xp: 25,
      research: { resources: { common: 5, mold: 3 }, bars: { bronze: 5 } },
      perTier: { damage: 10.3, durability: 29 },
      combat: { speed: 0.94, crit: 5, critDamage: 150, pen: 0 },
      cost: { wood: 5, metal: 10 }, bars: { bronze: 2 } },
    { key: "dagger", name: "Dagger", kind: "weapon", icon: "dagger",
      level: 1, xp: 45,
      research: { resources: { rare: 1, common: 10, mold: 3 },
        alloys: { argentaurum: 3 } },
      perTier: { damage: 30.6, durability: 83 },
      combat: { speed: 1.15, crit: 6, critDamage: 180, pen: 0 },
      cost: { wood: 10, metal: 20 }, bars: { bronze: 3 },
      alloys: { argentaurum: 1 } },
    { key: "bloodbane", name: "Blood Bane", kind: "weapon", icon: "bloodbane",
      level: 1, xp: 90,
      research: { resources: { rare: 3, common: 25, mold: 10 },
        alloys: { argentaurum: 10, corinthium: 3, electrum: 1 },
        parts: { bloodinfusion: 1 } },
      perTier: { damage: 151.7, durability: 396 },
      combat: { speed: 1.06, crit: 5.5, critDamage: 165, pen: 10 },
      cost: { wood: 30, metal: 20 },
      alloys: { argentaurum: 5, corinthium: 1 } },
    { key: "zeus", name: "Zeus' Wrath", kind: "weapon", icon: "zeus",
      level: 1, xp: 160,
      research: { resources: { rare: 6, common: 30, mold: 15 },
        alloys: { electrum: 15, chrono: 3 },
        parts: { electricblade: 1, metalhandle: 1 } },
      perTier: { damage: 268, durability: 640 },
      combat: { speed: 1.12, crit: 7, critDamage: 190, pen: 15 },
      cost: { metal: 40, wood: 10 },
      alloys: { electrum: 3, corinthium: 5 },
      parts: { metalhandle: 1 } },
    { key: "crackbolt", name: "Crackbolt", kind: "weapon", icon: "crackbolt",
      level: 1, xp: 240,
      research: { resources: { epic: 1, rare: 8, mold: 10 },
        alloys: { electrum: 45, lunite: 3, argentaurum: 100 },
        parts: { thunderspearhead: 1, metalhandle: 1 } },
      perTier: { damage: 385, durability: 720 },
      combat: { speed: 1.35, crit: 12, critDamage: 210, pen: 20 },
      cost: { metal: 35 },
      alloys: { electrum: 5, corinthium: 10, argentaurum: 25 },
      parts: { metalhandle: 1 } },
    { key: "anduril", name: "Midas' Anduril", kind: "weapon", icon: "anduril",
      level: 1, xp: 340,
      research: { resources: { mold: 30 },
        alloys: { midas: 3, lunite: 3, corinthium: 75, argentaurum: 125 },
        parts: { midasedge: 1, electricblade: 1, metalhandle: 2 } },
      perTier: { damage: 540, durability: 980 },
      combat: { speed: 1.2, crit: 10, critDamage: 220, pen: 25 },
      cost: { metal: 85 },
      alloys: { lunite: 1, chrono: 1, corinthium: 25, argentaurum: 55 },
      parts: { metalhandle: 2 } },
    // Blades the smith has not learned yet: the bench shows the shape and
    // nothing else. mystery keeps them off the anvil whatever the level is.
    { key: "mystery-3", name: "???", kind: "weapon", icon: "sword-silhouette-3",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-4", name: "???", kind: "weapon", icon: "sword-silhouette-4",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-5", name: "???", kind: "weapon", icon: "sword-silhouette-5",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} }
  ];

  global.Recipes = { LIST: RECIPES };
})(window);
