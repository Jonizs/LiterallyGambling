/* Part tiers: what a single part of a piece has been worked up to. Every part
   starts Earthbound and climbs from there, and the tier it sits at colours
   the whole bench while that part is open, as well as the callout the part
   is opened from. */
(function (global) {
  "use strict";

  // The ladder, bottom to top. Each tier carries the colours the menu wears
  // while a part of that tier is on the bench: ink for lettering, edge for
  // the boxes, back for what sits behind them, and glow for the light they
  // throw. The two-toned tiers - the tempered cyan and gold, and the void's
  // purple over dark blue - carry a second ink for what they are mixed with.
  var TIERS = [
    { index: 1, key: "earthbound", name: "Earthbound",
      ink: "#d98f52", ink2: "#b87333", edge: "rgba(217,143,82,.85)",
      back: "rgba(46,28,14,.55)", glow: "rgba(217,143,82,0.15)" },
    { index: 2, key: "quenched", name: "Quenched Steel",
      ink: "#f2f6fb", ink2: "#c9d3e0", edge: "rgba(242,246,251,.85)",
      back: "rgba(30,34,42,.55)", glow: "rgba(230,238,248,0.135)" },
    { index: 3, key: "flame", name: "Flame-Cleansed",
      ink: "#ff8a3d", ink2: "#e2452a", edge: "rgba(255,120,60,.9)",
      back: "rgba(56,20,10,.6)", glow: "rgba(255,110,40,0.165)" },
    { index: 4, key: "masterwork", name: "Masterwork Temper",
      ink: "#b9f0e8", ink2: "#ffe1a0", edge: "rgba(185,240,232,.9)",
      back: "rgba(16,42,44,.55)", glow: "rgba(255,225,160,0.15)" },
    { index: 5, key: "void", name: "Void-Touched",
      ink: "#b98cff", ink2: "#4b6bd8", edge: "rgba(150,110,255,.9)",
      back: "rgba(12,10,30,.7)", glow: "rgba(120,80,255,0.18)" }
  ];

  var FIRST = TIERS[0];

  function tierAt(index) {
    for (var i = 0; i < TIERS.length; i++) {
      if (TIERS[i].index === index) return TIERS[i];
    }
    return FIRST;
  }

  // What tier a named part of a piece sits at. Anything unworked is at the
  // bottom of the ladder.
  function tierOf(item, label) {
    var at = item && item.parts && item.parts[label];
    return tierAt(at || FIRST.index);
  }

  function setTier(item, label, index) {
    if (!item.parts) item.parts = {};
    item.parts[label] = tierAt(index).index;
  }

  global.PartTiers = {
    TIERS: TIERS,
    tierAt: tierAt,
    tierOf: tierOf,
    setTier: setTier
  };
})(window);
