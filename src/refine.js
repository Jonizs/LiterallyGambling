/* Refining: ore goes into the smelter and comes back as bars, one for one.
   Each ore has its own burn time, and one batch runs at a time. */
(function (global) {
  "use strict";

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

  function running(state) {
    if (!state.refine) return null;
    var ore = find(state.refine.key);
    if (!ore) { state.refine = null; return null; }
    return { ore: ore, qty: state.refine.qty, endsAt: state.refine.endsAt };
  }

  function remaining(state) {
    var job = running(state);
    return job ? Math.max(0, job.endsAt - Date.now()) : 0;
  }

  function done(state) {
    var job = running(state);
    return !!job && Date.now() >= job.endsAt;
  }

  function batchSeconds(ore, qty) { return ore.seconds * qty; }

  // The ore is spent going in, so a batch cannot be cancelled for a refund.
  function start(state, ore, qty) {
    if (running(state)) return { ok: false, reason: "The smelter is busy." };
    qty = Math.floor(qty);
    if (qty <= 0) return { ok: false, reason: "Nothing to refine." };
    if (state.resources[ore.key] < qty) {
      return { ok: false, reason: "Short " + (qty - state.resources[ore.key]) +
        " " + ore.label.toLowerCase() + " ore." };
    }
    state.resources[ore.key] -= qty;
    state.refine = {
      key: ore.key,
      qty: qty,
      startedAt: Date.now(),
      endsAt: Date.now() + batchSeconds(ore, qty) * 1000
    };
    return { ok: true, qty: qty };
  }

  function claim(state) {
    var job = running(state);
    if (!job) return { ok: false, reason: "The smelter is empty." };
    if (Date.now() < job.endsAt) return { ok: false, reason: "Still burning." };
    state.bars[job.ore.key] += job.qty;
    state.refine = null;
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

  function emptyBars() {
    var out = {};
    ORES.forEach(function (ore) { out[ore.key] = 0; });
    return out;
  }

  global.Refine = {
    ORES: ORES,
    find: find,
    running: running,
    remaining: remaining,
    done: done,
    batchSeconds: batchSeconds,
    start: start,
    claim: claim,
    durationText: durationText,
    emptyBars: emptyBars
  };
})(window);
