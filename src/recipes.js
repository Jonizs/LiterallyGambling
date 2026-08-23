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
      perTier: { damage: 6.9, durability: 21 },
      combat: { speed: 0.85, crit: 5, critDamage: 150, pen: 0 },
      cost: { wood: 5, metal: 10 }, bars: { bronze: 2 } },
    { key: "dagger", name: "Dagger", kind: "weapon", icon: "dagger",
      level: 1, xp: 45,
      research: { resources: { rare: 1, common: 10, mold: 3 },
        alloys: { argentaurum: 3 } },
      perTier: { damage: 7.8, durability: 23 },
      combat: { speed: 0.85, crit: 5.5, critDamage: 165, pen: 0 },
      cost: { wood: 10, metal: 20 }, bars: { bronze: 3 },
      alloys: { argentaurum: 1 } },
    { key: "bloodbane", name: "Blood Bane", kind: "weapon", icon: "bloodbane",
      level: 1, xp: 90,
      research: { resources: { rare: 3, common: 25, mold: 10 },
        alloys: { argentaurum: 10, corinthium: 3, electrum: 1 } },
      perTier: { damage: 9.9, durability: 28 },
      combat: { speed: 0.85, crit: 5.25, critDamage: 157.5, pen: 5 },
      cost: { wood: 30, metal: 20 },
      alloys: { argentaurum: 5, corinthium: 1 } },
    // Blades the smith has not learned yet: the bench shows the shape and
    // nothing else. mystery keeps them off the anvil whatever the level is.
    { key: "mystery-1", name: "???", kind: "weapon", icon: "sword-silhouette-1",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-2", name: "???", kind: "weapon", icon: "sword-silhouette-2",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
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
