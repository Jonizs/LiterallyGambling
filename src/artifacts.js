/* Artifacts: shelf trinkets that bend what the forge rolls. */
(function (global) {
  "use strict";

  var S = global.Stats;

  var MAX = 3;            // how many the shelf holds
  var ROLL_COST = 10000;  // and that much more again for every roll after

  // luck lifts a stat's swing: up is the good side, down the bad one. down is
  // a negative number, so +10 there is a *smaller* unlucky swing and -20 a
  // wider one. base lifts the stat the forge rolls around, for good.
  var DEFS = [
    { key: "candle-light", name: "Candle Light", icon: "artifact-candle",
      text: "Rarity luck +20",
      luck: { rarity: { up: 20 } } },
    { key: "bloodied-boot", name: "Bloodied Boot", icon: "artifact-boot",
      text: "E.Slots luck +1 and unluck +1",
      luck: { eslots: { up: 1, down: -1 } } },
    { key: "dry-rock", name: "Dry Rock", icon: "artifact-rock",
      text: "Rarity and quality unluck −10",
      luck: { rarity: { down: 10 }, quality: { down: 10 } } },
    { key: "electric-ring", name: "Electric Ring", icon: "artifact-ring",
      text: "Edition luck +1, rarity unluck −10",
      luck: { edition: { up: 1 }, rarity: { down: 10 } } },
    { key: "catacombs-amulet", name: "Catacombs Amulet", icon: "artifact-amulet",
      text: "Rarity and quality luck +20 and unluck +20",
      luck: { rarity: { up: 20, down: -20 }, quality: { up: 20, down: -20 } } },
    { key: "shapeshifter-doll", name: "Shapeshifter Doll", icon: "artifact-doll",
      text: "Awakened comes up twice as often, out of common's share",
      enchant: { awakened: 2 } },
    { key: "the-way", name: "The Way", icon: "artifact-way",
      text: "Pieces forged while it is on the shelf are worth 10% more, for good",
      valueMult: 1.1 },
    { key: "midas-scroll", name: "Midas' Scroll", icon: "artifact-scroll",
      text: "Rarity and quality +5, for good · takes no shelf space",
      permanent: true, base: { rarity: 5, quality: 5 } }
  ];

  function defFor(key) {
    for (var i = 0; i < DEFS.length; i++) {
      if (DEFS[i].key === key) return DEFS[i];
    }
    return null;
  }

  function emptyArtifacts() {
    return { owned: [], equipped: [], rolls: 0 };
  }

  function held(state) {
    return state.artifacts || (state.artifacts = emptyArtifacts());
  }

  function owns(state, key) {
    return held(state).owned.indexOf(key) >= 0;
  }

  function isEquipped(state, key) {
    var def = defFor(key);
    if (def && def.permanent) return owns(state, key);
    return held(state).equipped.indexOf(key) >= 0;
  }

  // Everything bending the forge right now: what is on the shelf, plus the
  // permanent pieces, which are in effect the moment they are found.
  function active(state) {
    return DEFS.filter(function (def) { return isEquipped(state, def.key); });
  }

  function equippedDefs(state) {
    return held(state).equipped.map(defFor).filter(Boolean);
  }

  function missing(state) {
    return DEFS.filter(function (def) { return !owns(state, def.key); });
  }

  function rollCost(state) {
    return ROLL_COST * (held(state).rolls + 1);
  }

  // A permanent artifact's lift lands on the base the forge rolls around, the
  // same place an upgrade's does.
  function applyBase(state, def) {
    if (!def.base) return;
    Object.keys(def.base).forEach(function (key) {
      state.base[key] = S.clamp(key, state.base[key] + def.base[key]);
    });
  }

  function roll(state) {
    var pool = missing(state);
    if (!pool.length) {
      return { ok: false, reason: "Every basic artifact is already yours." };
    }
    var cost = rollCost(state);
    if (state.silver < cost) {
      return { ok: false, reason: "Not enough silver. That roll costs " +
        cost.toLocaleString() + "." };
    }
    state.silver -= cost;
    held(state).rolls++;
    var def = pool[Math.floor(Math.random() * pool.length)];
    held(state).owned.push(def.key);
    applyBase(state, def);
    return { ok: true, def: def, cost: cost };
  }

  // Hanging one on the shelf. replaceKey names what comes off when the shelf
  // is full; without it a full shelf is refused so the smith can pick.
  function equip(state, key, replaceKey) {
    var def = defFor(key);
    if (!def) return { ok: false, reason: "No such artifact." };
    if (!owns(state, key)) return { ok: false, reason: "You do not have that one." };
    if (def.permanent) return { ok: false, reason: def.name + " is always in effect." };
    if (isEquipped(state, key)) return { ok: false, reason: def.name + " is on the shelf." };
    var shelf = held(state).equipped;
    if (shelf.length >= MAX) {
      var at = replaceKey ? shelf.indexOf(replaceKey) : -1;
      if (at < 0) return { ok: false, full: true, reason: "The shelf is full." };
      var off = defFor(shelf[at]);
      shelf[at] = key;
      return { ok: true, def: def, replaced: off };
    }
    shelf.push(key);
    return { ok: true, def: def };
  }

  function unequip(state, key) {
    var shelf = held(state).equipped;
    var at = shelf.indexOf(key);
    if (at < 0) return { ok: false, reason: "That one is not on the shelf." };
    shelf.splice(at, 1);
    return { ok: true, def: defFor(key) };
  }

  // The luck window a stat rolls in, with everything on the shelf counted.
  function luck(state, key) {
    var stat = S.STATS[key];
    var win = { up: stat.up, down: stat.down };
    active(state).forEach(function (def) {
      var lift = def.luck && def.luck[key];
      if (!lift) return;
      win.up += lift.up || 0;
      win.down += lift.down || 0;
    });
    if (win.down > 0) win.down = 0;
    if (win.up < 0) win.up = 0;
    return win;
  }

  // What a piece forged right now keeps as a sale multiplier, for good.
  function valueMult(state) {
    var out = 1;
    active(state).forEach(function (def) {
      if (def.valueMult) out *= def.valueMult;
    });
    return Math.round(out * 1000) / 1000;
  }

  // How much likelier one enchant is to come up.
  function enchantMult(state, key) {
    var out = 1;
    active(state).forEach(function (def) {
      if (def.enchant && def.enchant[key]) out *= def.enchant[key];
    });
    return out;
  }

  global.Artifacts = {
    DEFS: DEFS,
    MAX: MAX,
    ROLL_COST: ROLL_COST,
    emptyArtifacts: emptyArtifacts,
    defFor: defFor,
    owns: owns,
    isEquipped: isEquipped,
    active: active,
    equippedDefs: equippedDefs,
    missing: missing,
    rollCost: rollCost,
    applyBase: applyBase,
    roll: roll,
    equip: equip,
    unequip: unequip,
    luck: luck,
    valueMult: valueMult,
    enchantMult: enchantMult
  };
})(window);
