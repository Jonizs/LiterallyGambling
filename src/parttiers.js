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
    { index: 3, key: "masterwork", name: "Masterwork Temper",
      ink: "#b9f0e8", ink2: "#ffe1a0",
      edge: "rgba(185,240,232,.9)", edgem: "rgba(220,233,196,.9)",
      edge2: "rgba(255,225,160,.9)",
      back: "rgba(16,42,44,.55)",
      glow: "rgba(185,240,232,0.15)", glowm: "rgba(220,233,196,0.15)",
      glow2: "rgba(255,225,160,0.15)" },
    // The fire itself: white-gold at the heart, orange through the middle,
    // and ember red at the edge of the flame.
    { index: 4, key: "flame", name: "Flame-Cleansed",
      ink: "#ffd24a", ink2: "#d92b12",
      edge: "rgba(255,210,74,.95)", edgem: "rgba(255,122,26,.95)",
      edge2: "rgba(217,43,18,.95)",
      back: "rgba(48,14,6,.66)",
      glow: "rgba(255,200,70,0.2)", glowm: "rgba(255,110,25,0.22)",
      glow2: "rgba(200,30,12,0.2)" },
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

  // What a part carries. Base power is the one number the tier is read off;
  // the rest say how well the part is made. A part starts with no power to
  // it, badly balanced, and full of inclusions.
  var START = { power: 0, weight: 10, purity: 5, temper: 0 };
  var MAX_POWER = 1000;
  var BAND = MAX_POWER / TIERS.length;   // base power to a rung of the ladder

  // How well the weight sits in the part, worst to perfect.
  var WEIGHTS = [
    { at: 90, name: "Perfect" }, { at: 70, name: "Good" },
    { at: 50, name: "Normal" }, { at: 30, name: "Bad" },
    { at: 0, name: "Worst" }
  ];
  // Grain size in ASTM: the smaller the number, the cleaner the steel.
  var PURITIES = [
    { under: 0.05, name: "Perfect" }, { under: 0.5, name: "High-Purity" },
    { under: 1, name: "Refined" }, { under: 2, name: "Standard" },
    { under: 3, name: "Impure" }, { under: Infinity, name: "Brittle" }
  ];
  // What the part is out by when it comes off the anvil: heat one way or the
  // other, and give one way or the other. Balanced is nought on both.
  var SYNERGY = { thermal: [4, 5], flex: [18, 20] };

  function num(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  function clamp(value, low, high) {
    return Math.min(high, Math.max(low, value));
  }

  function tenth(value) { return Math.round(value * 10) / 10; }

  function roll(range) {
    var size = range[0] + Math.random() * (range[1] - range[0]);
    return tenth(Math.random() < 0.5 ? -size : size);
  }

  function tierAt(index) {
    for (var i = 0; i < TIERS.length; i++) {
      if (TIERS[i].index === index) return TIERS[i];
    }
    return FIRST;
  }

  // The rung base power puts a part on: a band of the ladder each.
  function tierFor(power) {
    var at = Math.floor(clamp(num(power, 0), 0, MAX_POWER) / BAND) + 1;
    return tierAt(Math.min(at, TIERS.length));
  }

  function weightGrade(pct) {
    for (var i = 0; i < WEIGHTS.length; i++) {
      if (pct >= WEIGHTS[i].at) return WEIGHTS[i].name;
    }
    return WEIGHTS[WEIGHTS.length - 1].name;
  }

  function purityGrade(astm) {
    for (var i = 0; i < PURITIES.length; i++) {
      if (astm < PURITIES[i].under) return PURITIES[i].name;
    }
    return PURITIES[PURITIES.length - 1].name;
  }

  // Everything a named part of a piece carries, written back onto the piece
  // so what a part was rolled is what it keeps. Saves from before a part had
  // readings of its own kept nothing but its tier.
  function stateOf(item, label) {
    if (!item) return read({});
    if (!item.parts) item.parts = {};
    var at = item.parts[label];
    if (typeof at === "number") at = { power: (at - 1) * BAND };
    var state = read(at && typeof at === "object" ? at : {});
    item.parts[label] = state;
    return state;
  }

  function read(at) {
    return {
      power: clamp(num(at.power, START.power), 0, MAX_POWER),
      weight: clamp(num(at.weight, START.weight), 0, 100),
      purity: clamp(num(at.purity, START.purity), 0, 5),
      temper: clamp(num(at.temper, START.temper), 0, 100),
      thermal: num(at.thermal, null) === null
        ? roll(SYNERGY.thermal) : tenth(at.thermal),
      flex: num(at.flex, null) === null ? roll(SYNERGY.flex) : tenth(at.flex)
    };
  }

  // What tier a named part of a piece sits at. Anything unworked is at the
  // bottom of the ladder.
  function tierOf(item, label) {
    return tierFor(stateOf(item, label).power);
  }

  // Put a part on a rung: the bottom of that rung's band of base power.
  function setTier(item, label, index) {
    var state = stateOf(item, label);
    state.power = (tierAt(index).index - 1) * BAND;
    return state;
  }

  global.PartTiers = {
    TIERS: TIERS,
    MAX_POWER: MAX_POWER,
    tierAt: tierAt,
    tierFor: tierFor,
    tierOf: tierOf,
    stateOf: stateOf,
    setTier: setTier,
    weightGrade: weightGrade,
    purityGrade: purityGrade
  };
})(window);
