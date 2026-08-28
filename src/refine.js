/* Refining: ore goes into an oven and comes back as bars, one for one. Two
   ovens burn side by side, a batch is as big as the ore allows, and the bars
   come out one per burn rather than all at the end. */
(function (global) {
  "use strict";

  var B = global.Batch;

  var OVENS = 2;

  // seconds is what a single ore takes; a batch is that times the count.
  // value is what one bar of the metal is reckoned to be worth in silver,
  // which is what rushing the burn is priced from.
  var ORES = [
    { key: "bronze",  label: "Bronze",  seconds: 5,  value: 25 },
    { key: "silver",  label: "Silver",  seconds: 15, value: 90 },
    { key: "gold",    label: "Gold",    seconds: 24, value: 140 },
    { key: "crystal", label: "Crystal", seconds: 90, value: 11500 }
  ];

  var RUSH_MULTIPLIER = 5;

  function find(key) {
    for (var i = 0; i < ORES.length; i++) {
      if (ORES[i].key === key) return ORES[i];
    }
    return null;
  }

  // An oven holds a batch job or null when it is out.
  function slot(state, index) {
    var job = state.ovens[index];
    if (!job) return null;
    var ore = find(job.key);
    if (!ore) { state.ovens[index] = null; return null; }
    return {
      ore: ore,
      qty: job.qty,
      taken: job.taken,
      ready: B.claimable(job, Date.now()),
      startedAt: job.startedAt,
      endsAt: B.endsAt(job)
    };
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

  // Time until the next bar drops, not until the whole batch is through.
  function remaining(state, index) {
    var job = state.ovens[index];
    return job ? B.nextIn(job, Date.now()) : 0;
  }

  function done(state, index) {
    var job = state.ovens[index];
    return !!job && B.claimable(job, Date.now()) > 0;
  }

  function batchSeconds(ore, qty) { return ore.seconds * qty; }

  // The ore is spent going in; stopping hands back only what has not been lit.
  function start(state, ore, qty) {
    qty = Math.floor(qty);
    if (qty <= 0) return { ok: false, reason: "Nothing to refine." };
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
      taken: 0,
      startedAt: Date.now(),
      unitMs: ore.seconds * 1000
    };
    return { ok: true, index: index, qty: qty };
  }

  // Carry off every bar that has finished so far; the rest keeps burning.
  function claim(state, index) {
    var job = state.ovens[index];
    if (!job) return { ok: false, reason: "That oven is out." };
    var ore = find(job.key);
    var count = B.claim(job, Date.now());
    if (!count) return { ok: false, reason: "Still burning." };
    state.bars[ore.key] += count;
    var left = job.qty - job.taken;
    if (!left) state.ovens[index] = null;
    return { ok: true, ore: ore, qty: count, left: left };
  }

  // The ore in the fire has to burn through; anything queued behind it comes
  // back to the yard.
  function stop(state, index) {
    var job = state.ovens[index];
    if (!job) return { ok: false, reason: "That oven is out." };
    var cancelled = B.stop(job, Date.now());
    if (!cancelled) return { ok: false, reason: "Only the last one is left." };
    var ore = find(job.key);
    state.resources[ore.key] += cancelled;
    return { ok: true, ore: ore, qty: cancelled };
  }

  // Everything still in the fire, priced at five times what it is worth.
  function rushCost(state, index) {
    var job = state.ovens[index];
    if (!job) return 0;
    var ore = find(job.key);
    var left = job.qty - B.finished(job, Date.now());
    return left * ore.value * RUSH_MULTIPLIER;
  }

  // Pays the fire out: every bar in the batch is ready to lift straight away.
  function rush(state, index) {
    var job = state.ovens[index];
    if (!job) return { ok: false, reason: "That oven is out." };
    var cost = rushCost(state, index);
    if (!cost) return { ok: false, reason: "The batch is already through." };
    if (state.silver < cost) {
      return { ok: false, reason: "Short " + (cost - state.silver) + " silver to rush." };
    }
    state.silver -= cost;
    job.startedAt = Date.now() - job.unitMs * job.qty;
    return { ok: true, ore: find(job.key), cost: cost };
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
    stop: stop,
    rush: rush,
    rushCost: rushCost,
    durationText: durationText,
    emptyOvens: emptyOvens,
    emptyBars: emptyBars
  };
})(window);
