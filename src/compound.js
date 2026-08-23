/* Compounding: bars go into a crucible and come out as an alloy. Three
   crucibles run side by side, one batch makes up to ten alloys, and they are
   poured one per cook rather than all at the end. */
(function (global) {
  "use strict";

  var B = global.Batch;

  var CRUCIBLES = 3;
  var MAX_BATCH = 10;
  var RUSH_MULTIPLIER = 5;

  // cost is bars per alloy; seconds is the burn for one. A batch multiplies
  // both by the count. Listed shortest cook first.
  var ALLOYS = [
    { key: "argentaurum", name: "Argentaurum Alloy",
      cost: { bronze: 4, silver: 2 }, seconds: 45 },
    { key: "corinthium", name: "Corinthium Alloy",
      cost: { bronze: 10, gold: 1 }, seconds: 120 },
    { key: "electrum", name: "Electrum Alloy",
      cost: { silver: 3, gold: 3 }, seconds: 180 },
    { key: "chrono", name: "Chrono-Bronze Alloy",
      cost: { bronze: 20, crystal: 1 }, seconds: 600 },
    { key: "lunite", name: "Lunite Alloy",
      cost: { silver: 10, crystal: 2 }, seconds: 900 },
    { key: "midas", name: "Midas Alloy",
      cost: { gold: 10, crystal: 3 }, seconds: 2700 }
  ];

  function find(key) {
    for (var i = 0; i < ALLOYS.length; i++) {
      if (ALLOYS[i].key === key) return ALLOYS[i];
    }
    return null;
  }

  // A crucible holds a batch job or null when it is cold.
  function slot(state, index) {
    var job = state.crucibles[index];
    if (!job) return null;
    var alloy = find(job.key);
    if (!alloy) { state.crucibles[index] = null; return null; }
    return {
      alloy: alloy,
      qty: job.qty,
      taken: job.taken,
      ready: B.claimable(job, Date.now()),
      startedAt: job.startedAt,
      endsAt: B.endsAt(job)
    };
  }

  function freeSlot(state) {
    for (var i = 0; i < CRUCIBLES; i++) {
      if (!slot(state, i)) return i;
    }
    return -1;
  }

  function busy(state) {
    var count = 0;
    for (var i = 0; i < CRUCIBLES; i++) {
      if (slot(state, i)) count++;
    }
    return count;
  }

  function running(state) {
    return busy(state) > 0;
  }

  // Time to the next pour, not to the end of the batch.
  function remaining(state, index) {
    var job = state.crucibles[index];
    return job ? B.nextIn(job, Date.now()) : 0;
  }

  function done(state, index) {
    var job = state.crucibles[index];
    return !!job && B.claimable(job, Date.now()) > 0;
  }

  // The most of this alloy the bars on hand will cover, capped at the batch max.
  function affordable(state, alloy) {
    var most = MAX_BATCH;
    Object.keys(alloy.cost).forEach(function (bar) {
      most = Math.min(most, Math.floor(state.bars[bar] / alloy.cost[bar]));
    });
    return Math.max(0, most);
  }

  function missingFor(state, alloy, qty) {
    var short = [];
    Object.keys(alloy.cost).forEach(function (bar) {
      var need = alloy.cost[bar] * qty;
      if (state.bars[bar] < need) short.push((need - state.bars[bar]) + " " + bar);
    });
    return short;
  }

  function start(state, alloy, qty) {
    qty = Math.floor(qty);
    if (qty <= 0) return { ok: false, reason: "Nothing to compound." };
    if (qty > MAX_BATCH) {
      return { ok: false, reason: "A crucible holds " + MAX_BATCH + " at most." };
    }
    var index = freeSlot(state);
    if (index < 0) return { ok: false, reason: "Every crucible is full." };
    var short = missingFor(state, alloy, qty);
    if (short.length) return { ok: false, reason: "Short " + short.join(", ") + " bars." };

    Object.keys(alloy.cost).forEach(function (bar) {
      state.bars[bar] -= alloy.cost[bar] * qty;
    });
    state.crucibles[index] = {
      key: alloy.key,
      qty: qty,
      taken: 0,
      startedAt: Date.now(),
      unitMs: alloy.seconds * 1000
    };
    return { ok: true, index: index, qty: qty };
  }

  // Carry off every alloy poured so far; the rest keeps cooking.
  function claim(state, index) {
    var job = state.crucibles[index];
    if (!job) return { ok: false, reason: "That crucible is cold." };
    var alloy = find(job.key);
    var count = B.claim(job, Date.now());
    if (!count) return { ok: false, reason: "Still compounding." };
    state.alloys[alloy.key] += count;
    var left = job.qty - job.taken;
    if (!left) state.crucibles[index] = null;
    return { ok: true, alloy: alloy, qty: count, left: left };
  }

  // The pour underway has to finish; the bars for everything queued behind it
  // go back on the rack.
  function stop(state, index) {
    var job = state.crucibles[index];
    if (!job) return { ok: false, reason: "That crucible is cold." };
    var cancelled = B.stop(job, Date.now());
    if (!cancelled) return { ok: false, reason: "Only the last one is left." };
    var alloy = find(job.key);
    Object.keys(alloy.cost).forEach(function (bar) {
      state.bars[bar] += alloy.cost[bar] * cancelled;
    });
    return { ok: true, alloy: alloy, qty: cancelled };
  }

  // An alloy is worth the bars poured into it, so rushing a crucible is
  // priced off the same values the ovens use.
  function value(alloy) {
    var total = 0;
    Object.keys(alloy.cost).forEach(function (bar) {
      total += global.Refine.find(bar).value * alloy.cost[bar];
    });
    return total;
  }

  function rushCost(state, index) {
    var job = state.crucibles[index];
    if (!job) return 0;
    var left = job.qty - B.finished(job, Date.now());
    return left * value(find(job.key)) * RUSH_MULTIPLIER;
  }

  // Pours the rest of the batch at once, ready to lift.
  function rush(state, index) {
    var job = state.crucibles[index];
    if (!job) return { ok: false, reason: "That crucible is cold." };
    var cost = rushCost(state, index);
    if (!cost) return { ok: false, reason: "The batch is already poured." };
    if (state.silver < cost) {
      return { ok: false, reason: "Short " + (cost - state.silver) + " silver to rush." };
    }
    state.silver -= cost;
    job.startedAt = Date.now() - job.unitMs * job.qty;
    return { ok: true, alloy: find(job.key), cost: cost };
  }

  function emptyAlloys() {
    var out = {};
    ALLOYS.forEach(function (alloy) { out[alloy.key] = 0; });
    return out;
  }

  function emptyCrucibles() {
    var out = [];
    for (var i = 0; i < CRUCIBLES; i++) out.push(null);
    return out;
  }

  global.Compound = {
    CRUCIBLES: CRUCIBLES,
    MAX_BATCH: MAX_BATCH,
    ALLOYS: ALLOYS,
    find: find,
    slot: slot,
    freeSlot: freeSlot,
    busy: busy,
    running: running,
    remaining: remaining,
    done: done,
    affordable: affordable,
    missingFor: missingFor,
    start: start,
    claim: claim,
    stop: stop,
    value: value,
    rush: rush,
    rushCost: rushCost,
    emptyAlloys: emptyAlloys,
    emptyCrucibles: emptyCrucibles
  };
})(window);
