/* Item stat model: brackets, luck swings and clamping rules. */
(function (global) {
  "use strict";

  // Rarity 0-1000, in twenty even brackets. T20 is open-ended at the top.
  var TIERS = (function () {
    var list = [];
    for (var i = 0; i < 20; i++) {
      list.push({ name: "T" + (i + 1), index: i + 1, min: i * 50, max: i * 50 + 50 });
    }
    list[0].min = 0;
    return list;
  })();

  var QUALITY_BANDS = [
    { name: "Bad", min: -50, max: 0 },
    { name: "Normal", min: 1, max: 80 },
    { name: "Good", min: 81, max: 160 },
    { name: "Refined", min: 161, max: 250 },
    { name: "Pristine", min: 251, max: 360 },
    { name: "Legendary", min: 361, max: 400 }
  ];

  var EDITIONS = ["None", "EARTHY", "METAL", "CRIMSON", "FIERY", "UNGODLY"];

  // Each stat: starting value, hard limits, and the base luck swing.
  var STATS = {
    rarity:  { label: "Rarity",  start: 50, min: 0,   max: 1000, up: 150, down: -150 },
    quality: { label: "Quality", start: 0,  min: -50, max: 400,  up: 50,  down: -50 },
    eslots:  { label: "E.Slots", start: 0,  min: 0,   max: 6,    up: 1,   down: -1 },
    edition: { label: "Edition", start: 0,  min: 0,   max: 5,    up: 1,   down: -4 }
  };

  function clamp(key, value) {
    var s = STATS[key];
    return Math.max(s.min, Math.min(s.max, value));
  }

  // The luck swing a stat rolls in: the table's own, unless something has
  // widened it (an artifact on the shelf) and hands one in.
  function luckOf(key, luck) {
    var s = STATS[key];
    return luck || { up: s.up, down: s.down };
  }

  // The window a roll can land in: value plus the full luck swing, clamped.
  function rollRange(key, value, luck) {
    var win = luckOf(key, luck);
    return { low: clamp(key, value + win.down), high: clamp(key, value + win.up) };
  }

  function tierAt(rarity) {
    for (var i = 0; i < TIERS.length; i++) {
      if (rarity <= TIERS[i].max) return TIERS[i];
    }
    return TIERS[TIERS.length - 1];
  }

  function qualityBandAt(quality) {
    for (var i = 0; i < QUALITY_BANDS.length; i++) {
      if (quality <= QUALITY_BANDS[i].max) return QUALITY_BANDS[i];
    }
    return QUALITY_BANDS[QUALITY_BANDS.length - 1];
  }

  function editionAt(edition) {
    return EDITIONS[clamp("edition", edition)];
  }

  // Human-readable span, collapsing to a single name when both ends match.
  function span(lowName, highName) {
    return lowName === highName ? lowName : lowName + " – " + highName;
  }

  // What the current stats could produce, as label/value pairs for the UI.
  // luckFn, when handed in, gives the swing each stat is really rolling in.
  function forecast(values, luckFn) {
    function win(key) { return luckFn ? luckFn(key) : null; }
    var r = rollRange("rarity", values.rarity, win("rarity"));
    var q = rollRange("quality", values.quality, win("quality"));
    var e = rollRange("eslots", values.eslots, win("eslots"));
    var d = rollRange("edition", values.edition, win("edition"));
    return [
      { label: "Tier", value: span(tierAt(r.low).name, tierAt(r.high).name),
        detail: "rarity " + r.low + " to " + r.high },
      { label: "Quality", value: span(qualityBandAt(q.low).name, qualityBandAt(q.high).name),
        detail: "quality " + q.low + " to " + q.high },
      { label: "Enchant slots", value: e.low === e.high ? String(e.low) : e.low + " to " + e.high,
        detail: "of 6" },
      { label: "Edition", value: span(editionAt(d.low), editionAt(d.high)),
        detail: "edition " + d.low + " to " + d.high }
    ];
  }

  global.Stats = {
    TIERS: TIERS,
    QUALITY_BANDS: QUALITY_BANDS,
    EDITIONS: EDITIONS,
    STATS: STATS,
    clamp: clamp,
    luckOf: luckOf,
    rollRange: rollRange,
    tierAt: tierAt,
    qualityBandAt: qualityBandAt,
    editionAt: editionAt,
    forecast: forecast
  };
})(window);
