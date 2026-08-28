/* Gathering runs: a resource yard job started with silver and time, and the
   ore it hands back when the clock is up. */
(function (global) {
  "use strict";

  // Everything an operation can hand back, in the order it is shown.
  var RESOURCES = {
    bronze:  { label: "Bronze ore" },
    silver:  { label: "Silver ore" },
    gold:    { label: "Gold ore" },
    crystal: { label: "Crystal ore" },
    common:  { label: "Common schematic" },
    mold:    { label: "Gear mold" },
    rare:    { label: "Rare schematic" },
    epic:    { label: "Epic schematic" }
  };

  // low/high is the range rolled, both ends included. chance, where it is
  // set, is the odds the entry is rolled at all.
  var OPERATIONS = [
    { key: "simple", name: "Simple operations", level: 2,
      cost: 200, minutes: 1,
      yields: [
        { key: "bronze", low: 4, high: 6 },
        { key: "silver", low: 1, high: 2 }
      ] },
    { key: "cavern", name: "Cavern explorer", level: 7,
      cost: 2500, minutes: 8,
      yields: [
        { key: "bronze", low: 20, high: 28 },
        { key: "silver", low: 6, high: 10 },
        { key: "gold", low: 2, high: 8 },
        { key: "rare", low: 1, high: 1, chance: 0.5 }
      ] },
    { key: "drill", name: "Drill mining", level: 15,
      cost: 30000, minutes: 20,
      yields: [
        { key: "bronze", low: 220, high: 310 },
        { key: "silver", low: 45, high: 57 },
        { key: "gold", low: 25, high: 40 },
        { key: "rare", low: 1, high: 3 },
        { key: "crystal", low: 1, high: 2 },
        { key: "epic", low: 1, high: 1, chance: 0.3 }
      ] },
    { key: "crystal", name: "Crystal excavation", level: 22,
      cost: 75000, minutes: 40,
      yields: [
        { key: "crystal", low: 6, high: 8 },
        { key: "rare", low: 1, high: 3 },
        { key: "epic", low: 1, high: 1 }
      ] }
  ];

  function find(key) {
    for (var i = 0; i < OPERATIONS.length; i++) {
      if (OPERATIONS[i].key === key) return OPERATIONS[i];
    }
    return null;
  }

  function unlocked(state, op) { return state.level >= op.level; }

  function running(state) {
    if (!state.gather) return null;
    var op = find(state.gather.key);
    if (!op) { state.gather = null; return null; }
    return { op: op, endsAt: state.gather.endsAt };
  }

  function remaining(state) {
    var job = running(state);
    return job ? Math.max(0, job.endsAt - Date.now()) : 0;
  }

  function done(state) {
    var job = running(state);
    return !!job && Date.now() >= job.endsAt;
  }

  function start(state, op) {
    if (running(state)) return { ok: false, reason: "A run is already out." };
    if (!unlocked(state, op)) {
      return { ok: false, reason: "Unlocks at smith level " + op.level + "." };
    }
    if (state.silver < op.cost) {
      return { ok: false, reason: "Short " + (op.cost - state.silver) + " silver." };
    }
    state.silver -= op.cost;
    state.gather = {
      key: op.key,
      startedAt: Date.now(),
      endsAt: Date.now() + op.minutes * 60000
    };
    return { ok: true, cost: op.cost };
  }

  // Cutting the wait short costs five times what the run itself cost.
  var RUSH_MULTIPLIER = 5;

  function rushCost(op) { return op.cost * RUSH_MULTIPLIER; }

  // Pays the crew to come straight back: the haul is still rolled on collect.
  function rush(state) {
    var job = running(state);
    if (!job) return { ok: false, reason: "Nothing is out." };
    if (Date.now() >= job.endsAt) return { ok: false, reason: "The run is already back." };
    var cost = rushCost(job.op);
    if (state.silver < cost) {
      return { ok: false, reason: "Short " + (cost - state.silver) + " silver to rush." };
    }
    state.silver -= cost;
    state.gather.endsAt = Date.now();
    return { ok: true, op: job.op, cost: cost };
  }

  function roll(entry) {
    if (entry.chance !== undefined && Math.random() >= entry.chance) return 0;
    return entry.low + Math.floor(Math.random() * (entry.high - entry.low + 1));
  }

  // The haul is rolled at collection, so a tab left open cannot be re-rolled.
  function claim(state) {
    var job = running(state);
    if (!job) return { ok: false, reason: "Nothing is out." };
    if (Date.now() < job.endsAt) return { ok: false, reason: "The run is not back yet." };

    var haul = [];
    job.op.yields.forEach(function (entry) {
      var qty = roll(entry);
      if (qty <= 0) return;
      state.resources[entry.key] += qty;
      haul.push({ key: entry.key, qty: qty });
    });
    state.gather = null;
    return { ok: true, op: job.op, haul: haul };
  }

  // 1m, 15m, 2h — the same shape the operation is written in.
  function durationText(minutes) {
    if (minutes < 60) return minutes + "m";
    var hours = minutes / 60;
    var rest = minutes % 60;
    return Math.floor(hours) + "h" + (rest ? " " + rest + "m" : "");
  }

  // Counts down to zero: 1h 04m 09s, 4m 09s, 9s.
  function clockText(ms) {
    var secs = Math.ceil(ms / 1000);
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    if (h) return h + "h " + pad(m) + "m " + pad(s) + "s";
    if (m) return m + "m " + pad(s) + "s";
    return s + "s";
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function yieldText(entry) {
    var span = entry.low === entry.high ? String(entry.low) : entry.low + "–" + entry.high;
    var text = span + " " + RESOURCES[entry.key].label.toLowerCase();
    if (entry.chance !== undefined) {
      text = Math.round(entry.chance * 100) + "% for " + text;
    }
    return text;
  }

  function emptyResources() {
    var out = {};
    Object.keys(RESOURCES).forEach(function (key) { out[key] = 0; });
    return out;
  }

  global.Gather = {
    RESOURCES: RESOURCES,
    OPERATIONS: OPERATIONS,
    find: find,
    unlocked: unlocked,
    running: running,
    remaining: remaining,
    done: done,
    start: start,
    rush: rush,
    rushCost: rushCost,
    claim: claim,
    durationText: durationText,
    clockText: clockText,
    yieldText: yieldText,
    emptyResources: emptyResources
  };
})(window);
