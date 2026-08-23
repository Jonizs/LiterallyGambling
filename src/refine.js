/* Refining: ore goes into an oven and comes back as bars, one for one. Two
   ovens burn side by side, and one batch holds up to fifty ore. */
(function (global) {
  "use strict";

  var OVENS = 2;
  var MAX_BATCH = 50;

  // seconds is what a single ore takes; a batch is that times the count.
  var ORES = [
    { key: "bronze",  label: "Bronze",  seconds: 10 },
    { key: "silver",  label: "Silver",  seconds: 30 },
    { key: "gold",    label: "Gold",    seconds: 60 },
    { key: "crystal", label: "Crystal", seconds: 180 }
  ];

  function find(key) {
    for (var i = 0; i < ORES.length; i++) {
      if (ORES[i].key === key) return ORES[i];
    }
    return null;
  }

  // An oven holds {key, qty, endsAt} or null when it is out.
  function slot(state, index) {
    var job = state.ovens[index];
    if (!job) return null;
    var ore = find(job.key);
    if (!ore) { state.ovens[index] = null; return null; }
    return { ore: ore, qty: job.qty, endsAt: job.endsAt };
  }

  function freeSlot(state) {
    for (var i = 0; i < OVENS; i++) {
      if (!slot(state, i)) return i;
    }
    return -1;
  }

  function busy(state) {
    var count = 0;
    for (var i = 0; i < OVENS; i++) {
      if (slot(state, i)) count++;
    }
    return count;
  }

  function running(state) { return busy(state) > 0; }

  function remaining(state, index) {
    var job = slot(state, index);
    return job ? Math.max(0, job.endsAt - Date.now()) : 0;
  }

  function done(state, index) {
    var job = slot(state, index);
    return !!job && Date.now() >= job.endsAt;
  }

  function batchSeconds(ore, qty) { return ore.seconds * qty; }

  // The ore is spent going in, so a batch cannot be cancelled for a refund.
  function start(state, ore, qty) {
    qty = Math.floor(qty);
    if (qty <= 0) return { ok: false, reason: "Nothing to refine." };
    if (qty > MAX_BATCH) {
      return { ok: false, reason: "An oven holds " + MAX_BATCH + " at most." };
    }
    var index = freeSlot(state);
    if (index < 0) return { ok: false, reason: "Both ovens are burning." };
    if (state.resources[ore.key] < qty) {
      return { ok: false, reason: "Short " + (qty - state.resources[ore.key]) +
        " " + ore.label.toLowerCase() + " ore." };
    }
    state.resources[ore.key] -= qty;
    state.ovens[index] = {
      key: ore.key,
      qty: qty,
      startedAt: Date.now(),
      endsAt: Date.now() + batchSeconds(ore, qty) * 1000
    };
    return { ok: true, index: index, qty: qty };
  }

  function claim(state, index) {
    var job = slot(state, index);
    if (!job) return { ok: false, reason: "That oven is out." };
    if (Date.now() < job.endsAt) return { ok: false, reason: "Still burning." };
    state.bars[job.ore.key] += job.qty;
    state.ovens[index] = null;
    return { ok: true, ore: job.ore, qty: job.qty };
  }

  // 10s, 3m, 1h 40m — the shape a batch is quoted in.
  function durationText(seconds) {
    if (seconds < 60) return seconds + "s";
    var mins = Math.floor(seconds / 60);
    var rest = seconds % 60;
    if (mins < 60) return mins + "m" + (rest ? " " + rest + "s" : "");
    var hours = Math.floor(mins / 60);
    var restMins = mins % 60;
    return hours + "h" + (restMins ? " " + restMins + "m" : "");
  }

  function emptyOvens() {
    var out = [];
    for (var i = 0; i < OVENS; i++) out.push(null);
    return out;
  }

  function emptyBars() {
    var out = {};
    ORES.forEach(function (ore) { out[ore.key] = 0; });
    return out;
  }

  global.Refine = {
    OVENS: OVENS,
    MAX_BATCH: MAX_BATCH,
    ORES: ORES,
    find: find,
    slot: slot,
    freeSlot: freeSlot,
    busy: busy,
    running: running,
    remaining: remaining,
    done: done,
    batchSeconds: batchSeconds,
    start: start,
    claim: claim,
    durationText: durationText,
    emptyOvens: emptyOvens,
    emptyBars: emptyBars
  };
})(window);
