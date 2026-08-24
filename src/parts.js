/* Parts: the fittings a piece is built from. They are soldered together on
   the anvil rather than hammered, and spent by the recipes that call for
   them. Cost draws on the same pools a recipe does, plus other parts. */
(function (global) {
  "use strict";

  var PARTS = [
    { key: "bloodinfusion", name: "Blood Infusion", part: true,
      icon: "part-blood",
      cost: { paper: 50 },
      resources: { rare: 1 },
      alloys: { electrum: 1, corinthium: 3 } },
    { key: "metalhandle", name: "Metal Handle", part: true,
      icon: "part-handle",
      cost: { wood: 20, paper: 10 },
      resources: { common: 5 },
      alloys: { argentaurum: 10 } },
    { key: "electricblade", name: "Electric Blade", part: true,
      icon: "part-electric",
      cost: { paper: 20, metal: 10 },
      resources: { rare: 2, common: 10 },
      alloys: { electrum: 5, chrono: 1 } },
    { key: "thunderspearhead", name: "Thunder Spearhead", part: true,
      icon: "part-thunder",
      cost: { metal: 50 },
      resources: { epic: 1, rare: 3 },
      alloys: { electrum: 10, lunite: 2, corinthium: 20 } },
    { key: "midasedge", name: "Midas Edge", part: true,
      icon: "part-midas",
      resources: { epic: 2, rare: 10 },
      alloys: { midas: 1, lunite: 3, chrono: 5, corinthium: 30 },
      parts: { electricblade: 1 } }
  ];

  function find(key) {
    for (var i = 0; i < PARTS.length; i++) {
      if (PARTS[i].key === key) return PARTS[i];
    }
    return null;
  }

  function emptyParts() {
    var out = {};
    PARTS.forEach(function (part) { out[part.key] = 0; });
    return out;
  }

  global.Parts = { LIST: PARTS, find: find, emptyParts: emptyParts };
})(window);
