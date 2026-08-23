/* Compounding: bars go into a crucible and come out as an alloy. Three
   crucibles run side by side, and one batch makes up to ten alloys. */
(function (global) {
  "use strict";

  var CRUCIBLES = 3;
  var MAX_BATCH = 10;

  // cost is bars per alloy; seconds is the burn for one. A batch multiplies
  // both by the count.
  var ALLOYS = [
    { key: "argentaurum", name: "Argentaurum Alloy",
      cost: { bronze: 4, silver: 2 }, seconds: 45 },
    { key: "corinthium", name: "Corinthium Alloy",
      cost: { bronze: 10, gold: 1 }, seconds: 120 },
    { key: "chrono", name: "Chrono-Bronze Alloy",
      cost: { bronze: 20, crystal: 1 }, seconds: 600 },
    { key: "electrum", name: "Electrum Alloy",
      cost: { silver: 3, gold: 3 }, seconds: 180 },
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

  // A crucible holds {alloy, qty, endsAt} or null when it is cold.
  function slot(state, index) {
    var job = state.crucibles[index];
    if (!job) return null;
    var alloy = find(job.key);
    if (!alloy) { state.crucibles[index] = null; return null; }
    return { alloy: alloy, qty: job.qty, endsAt: job.endsAt };
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
      startedAt: Date.now(),
      endsAt: Date.now() + alloy.seconds * qty * 1000
    };
    return { ok: true, index: index, qty: qty };
  }

  function claim(state, index) {
    var job = slot(state, index);
    if (!job) return { ok: false, reason: "That crucible is cold." };
    if (Date.now() < job.endsAt) return { ok: false, reason: "Still compounding." };
    state.alloys[job.alloy.key] += job.qty;
    state.crucibles[index] = null;
    return { ok: true, alloy: job.alloy, qty: job.qty };
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
    affordable: affordable,
    missingFor: missingFor,
    start: start,
    claim: claim,
    emptyAlloys: emptyAlloys,
    emptyCrucibles: emptyCrucibles
  };
})(window);
