/* Part tiers: what a single part of a piece has been worked up to. Every part
   starts Earthbound and climbs from there, and the tier it sits at colours
   the whole bench while that part is open, as well as the callout the part
   is opened from. */
(function (global) {
  "use strict";

  // The ladder, bottom to top. A tier's two colours are carried as a pair -
  // ink/ink2, edge/edge2, glow/glow2 - and the boxes run from the first into
  // the second across their width; the lettering itself stays flat.
  // The ladder, bottom to top. Each tier carries the colours the menu wears
  // while a part of that tier is on the bench: ink for lettering, edge for
  // the boxes, back for what sits behind them, and glow for the light they
  // throw. The two-toned tiers - the tempered cyan and gold, and the void's
  // purple over dark blue - carry a second ink for what they are mixed with.
  var TIERS = [
    { index: 1, key: "earthbound", name: "Earthbound",
      ink: "#d98f52", ink2: "#b87333",
      edge: "rgba(217,143,82,.85)", edgem: "rgba(200,128,64,.85)",
      edge2: "rgba(184,115,51,.85)",
      back: "rgba(46,28,14,.55)",
      glow: "rgba(217,143,82,0.15)", glowm: "rgba(200,128,64,0.15)",
      glow2: "rgba(184,115,51,0.15)" },
    // Quenched steel is not white paper: it is cold, blued metal coming out
    // of the barrel, pale at one end and steel blue at the other.
    { index: 2, key: "quenched", name: "Quenched Steel",
      ink: "#e6eef8", ink2: "#8ba6c6",
      edge: "rgba(230,238,248,.85)", edgem: "rgba(174,196,220,.85)",
      edge2: "rgba(139,166,198,.9)",
      back: "rgba(22,28,38,.62)",
      glow: "rgba(226,238,252,0.14)", glowm: "rgba(160,190,222,0.15)",
      glow2: "rgba(110,150,196,0.16)" },
    // The fire itself: white-gold at the heart, orange through the middle,
    // and ember red at the edge of the flame.
    { index: 3, key: "flame", name: "Flame-Cleansed",
      ink: "#ffd24a", ink2: "#d92b12",
      edge: "rgba(255,210,74,.95)", edgem: "rgba(255,122,26,.95)",
      edge2: "rgba(217,43,18,.95)",
      back: "rgba(48,14,6,.66)",
      glow: "rgba(255,200,70,0.2)", glowm: "rgba(255,110,25,0.22)",
      glow2: "rgba(200,30,12,0.2)" },
    { index: 4, key: "masterwork", name: "Masterwork Temper",
      ink: "#b9f0e8", ink2: "#ffe1a0",
      edge: "rgba(185,240,232,.9)", edgem: "rgba(220,233,196,.9)",
      edge2: "rgba(255,225,160,.9)",
      back: "rgba(16,42,44,.55)",
      glow: "rgba(185,240,232,0.15)", glowm: "rgba(220,233,196,0.15)",
      glow2: "rgba(255,225,160,0.15)" },
    // The void: near-black ground with the purple burning through it and the
    // deep blue underneath.
    { index: 5, key: "void", name: "Void-Touched",
      ink: "#c39dff", ink2: "#3f5ec9",
      edge: "rgba(163,110,255,.95)", edgem: "rgba(74,44,140,.95)",
      edge2: "rgba(63,94,201,.9)",
      back: "rgba(5,3,14,.9)",
      glow: "rgba(150,90,255,0.24)", glowm: "rgba(20,10,40,0.3)",
      glow2: "rgba(50,70,190,0.22)" }
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
