/* Save file: the smith's progress kept in localStorage between visits. */
(function (global) {
  "use strict";

  var S = global.Stats, G = global.Game, E = global.Enchants,
      U = global.Upgrades;

  var KEY = "literallygambling.save";
  var VERSION = 1;
  var DEBOUNCE = 400; // ms of quiet before a write, so a strike writes once

  var timer = null;
  var lastSaved = 0;
  var available = null; // decided on first use: private modes can refuse

  function storage() {
    if (available === null) {
      try {
        global.localStorage.setItem(KEY + ".probe", "1");
        global.localStorage.removeItem(KEY + ".probe");
        available = true;
      } catch (err) {
        available = false;
      }
    }
    return available ? global.localStorage : null;
  }

  function num(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  function whole(value, fallback, min) {
    var n = Math.floor(num(value, fallback));
    return Math.max(min === undefined ? 0 : min, n);
  }

  // A batch job, as an oven or a crucible keeps it. Saves written before
  // batches paid out one at a time carry no unit time or taken count.
  function readJob(job, seconds) {
    var qty = whole(job.qty, 0, 1);
    return {
      key: job.key,
      qty: qty,
      taken: Math.min(qty, whole(job.taken, 0)),
      startedAt: whole(job.startedAt, 0),
      unitMs: whole(job.unitMs, seconds * 1000, 1)
    };
  }

  // ---- writing -------------------------------------------------------

  function snapshot(state) {
    return {
      version: VERSION,
      savedAt: Date.now(),
      smith: state.smith,
      silver: state.silver,
      level: state.level,
      xp: state.xp,
      materials: state.materials,
      resources: state.resources,
      gather: state.gather,
      bars: state.bars,
      known: state.known,
      ovens: state.ovens,
      alloys: state.alloys,
      crucibles: state.crucibles,
      parts: state.parts,
      artifacts: state.artifacts,
      inventory: state.inventory,
      upgrades: state.upgrades,
      base: state.base,
      stipendAt: state.stipendAt,
      nextId: state.nextId
    };
  }

  function save(state) {
    var store = storage();
    if (!store) return false;
    try {
      store.setItem(KEY, JSON.stringify(snapshot(state)));
      lastSaved = Date.now();
      return true;
    } catch (err) {
      return false;
    }
  }

  // Rapid actions (a strike reveals, a bulk sell) collapse into one write.
  function schedule(state) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      save(state);
    }, DEBOUNCE);
  }

  function flush(state) {
    if (timer) { clearTimeout(timer); timer = null; }
    return save(state);
  }

  // ---- reading -------------------------------------------------------

  // An item is rebuilt field by field: anything the save is missing or has
  // mangled falls back to what the recipe would forge, so a bad save costs
  // a piece at worst, never the whole file.
  function readItem(raw, state) {
    if (!raw || typeof raw !== "object") return null;
    var recipe = G.recipeFor(raw.recipe);
    if (!recipe || recipe.key !== raw.recipe) return null;
    var rarity = S.clamp("rarity", whole(raw.rarity, S.STATS.rarity.start));
    var quality = S.clamp("quality", whole(raw.quality, 0, S.STATS.quality.min));
    var edition = S.clamp("edition", whole(raw.edition, 0));
    var tier = S.tierAt(rarity);
    var band = S.qualityBandAt(quality).name;
    var rolled = G.statsFor(recipe, tier.index, band, edition);
    var slots = S.clamp("eslots", whole(raw.slots, 0));

    var item = {
      id: whole(raw.id, state.nextId, 1),
      name: recipe.name,
      recipe: recipe.key,
      icon: recipe.icon,
      kind: recipe.kind,
      rarity: rarity,
      tier: tier.name,
      quality: quality,
      band: band,
      slots: slots,
      edition: edition,
      editionName: S.editionAt(edition),
      // The stored numbers carry the enchants already worked into them, so
      // they are kept as they are; the fresh roll only fills a gap.
      damage: whole(raw.damage, rolled.damage),
      armor: whole(raw.armor, rolled.armor),
      durability: whole(raw.durability, rolled.durability, 1),
      attackSpeed: Math.max(0.01, num(raw.attackSpeed, rolled.attackSpeed)),
      critChance: Math.max(0, Math.min(G.CRIT_CAP,
        num(raw.critChance, rolled.critChance))),
      critDamage: whole(raw.critDamage, rolled.critDamage),
      armorPen: whole(raw.armorPen, rolled.armorPen),
      enchants: readEnchants(raw.enchants, slots)
    };
    if (raw.awakenable) item.awakenable = true;
    // The premium The Way worked into the piece, kept as it was forged.
    var value = num(raw.value, 1);
    if (value > 1) item.value = Math.min(4, value);
    // How many times this piece has been stripped, so the next reforge is
    // priced where it left off.
    if (raw.reforges) item.reforges = whole(raw.reforges, 0);
    // How many times each sanding block has been pressed on this piece, so
    // the next press is priced where the last one left off.
    if (raw.sanded && typeof raw.sanded === "object") {
      var sanded = {};
      global.Sand.BLOCKS.forEach(function (block) {
        var used = whole(raw.sanded[block.key], 0);
        if (used > 0) sanded[block.key] = used;
      });
      if (Object.keys(sanded).length) item.sanded = sanded;
    }
    return item;
  }

  // Enchants are rebuilt off the live definitions, so a renamed or retired
  // enchant drops out instead of showing a stale label.
  function readEnchants(raw, slots) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    raw.forEach(function (entry) {
      if (!entry || out.length >= slots) return;
      var def = E.defFor(entry.key);
      if (!def) return;
      var tier = Math.max(1, Math.min(def.maxTier, whole(entry.tier, 1, 1)));
      out.push({ key: def.key, name: def.name, rarity: def.rarity,
                 tier: tier, tiered: def.maxTier > 1,
                 text: E.describe(def, tier) });
    });
    return out;
  }

  function readUpgrades(raw, state) {
    if (!raw || typeof raw !== "object") return;
    U.UPGRADES.forEach(function (def) {
      var tier = Math.min(U.maxTier(def), whole(raw[def.key], 0));
      if (!tier) return;
      state.upgrades[def.key] = tier;
      // The upgrade's lift lives on the rolled base, so it is re-applied
      // here rather than trusting whatever base the save carried.
      U.apply(state, def, tier);
    });
  }

  // What has been found, what is on the shelf, and how many rolls have been
  // paid for. A permanent piece re-applies its lift, the same way an upgrade
  // does, rather than trusting the base the save carried.
  function readArtifacts(raw, state) {
    var A = global.Artifacts;
    if (!raw || typeof raw !== "object") return;
    if (Array.isArray(raw.owned)) {
      raw.owned.forEach(function (key) {
        var def = A.defFor(key);
        if (!def || A.owns(state, key)) return;
        state.artifacts.owned.push(key);
        A.applyBase(state, def);
      });
    }
    if (Array.isArray(raw.equipped)) {
      raw.equipped.forEach(function (key) {
        var def = A.defFor(key);
        if (!def || def.permanent || !A.owns(state, key)) return;
        if (state.artifacts.equipped.length >= A.MAX) return;
        if (state.artifacts.equipped.indexOf(key) < 0) state.artifacts.equipped.push(key);
      });
    }
    state.artifacts.rolls = whole(raw.rolls, 0);
  }

  function readBase(raw, state) {
    if (!raw || typeof raw !== "object") return;
    // Only a base above what the upgrades explain is honoured, so a save
    // cannot smuggle in stats that were never bought.
    Object.keys(state.base).forEach(function (key) {
      var value = raw[key];
      if (typeof value !== "number" || !isFinite(value)) return;
      state.base[key] = Math.max(state.base[key], S.clamp(key, Math.floor(value)));
    });
  }

  // Returns a fresh state carrying whatever the save could vouch for, or
  // null when there is nothing readable to load.
  function load() {
    var store = storage();
    if (!store) return null;
    var text;
    try {
      text = store.getItem(KEY);
    } catch (err) {
      return null;
    }
    if (!text) return null;

    var raw;
    try {
      raw = JSON.parse(text);
    } catch (err) {
      return null;
    }
    if (!raw || typeof raw !== "object" || raw.version !== VERSION) return null;

    var state = G.createState();
    state.smith = typeof raw.smith === "string" ? raw.smith.slice(0, 14) : "";
    state.silver = whole(raw.silver, G.STARTING_SILVER);
    state.level = Math.max(G.STARTING_LEVEL, whole(raw.level, G.STARTING_LEVEL, 1));
    state.xp = whole(raw.xp, 0);
    if (raw.materials && typeof raw.materials === "object") {
      Object.keys(state.materials).forEach(function (key) {
        state.materials[key] = whole(raw.materials[key], 0);
      });
    }
    if (raw.resources && typeof raw.resources === "object") {
      Object.keys(state.resources).forEach(function (key) {
        state.resources[key] = whole(raw.resources[key], 0);
      });
    }
    // A run left out finishes on its own clock, so only the end time matters.
    if (raw.gather && global.Gather.find(raw.gather.key)) {
      state.gather = {
        key: raw.gather.key,
        startedAt: whole(raw.gather.startedAt, 0),
        endsAt: whole(raw.gather.endsAt, 0)
      };
    }
    if (Array.isArray(raw.known)) {
      raw.known.forEach(function (key) {
        var recipe = global.Game.recipeFor(key);
        if (recipe.key === key && state.known.indexOf(key) < 0) state.known.push(key);
      });
    }
    if (raw.bars && typeof raw.bars === "object") {
      Object.keys(state.bars).forEach(function (key) {
        state.bars[key] = whole(raw.bars[key], 0);
      });
    }
    // Saves from before the second oven kept a single batch under "refine".
    var ovens = Array.isArray(raw.ovens) ? raw.ovens : [raw.refine];
    state.ovens.forEach(function (_, i) {
      var job = ovens[i], ore = job && global.Refine.find(job.key);
      if (!ore) return;
      state.ovens[i] = readJob(job, ore.seconds);
    });
    if (raw.alloys && typeof raw.alloys === "object") {
      Object.keys(state.alloys).forEach(function (key) {
        state.alloys[key] = whole(raw.alloys[key], 0);
      });
    }
    if (Array.isArray(raw.crucibles)) {
      state.crucibles.forEach(function (_, i) {
        var job = raw.crucibles[i], alloy = job && global.Compound.find(job.key);
        if (!alloy) return;
        state.crucibles[i] = readJob(job, alloy.seconds);
      });
    }
    if (raw.parts && typeof raw.parts === "object") {
      Object.keys(state.parts).forEach(function (key) {
        state.parts[key] = whole(raw.parts[key], 0);
      });
    }
    // A clock that has gone backwards must not hand out an extra payout.
    state.stipendAt = Math.min(whole(raw.stipendAt, 0), Date.now());
    readUpgrades(raw.upgrades, state);
    readArtifacts(raw.artifacts, state);
    readBase(raw.base, state);

    state.nextId = whole(raw.nextId, 1, 1);
    if (Array.isArray(raw.inventory)) {
      raw.inventory.forEach(function (entry) {
        var item = readItem(entry, state);
        if (item) state.inventory.push(item);
      });
    }
    // Ids must stay unique, whatever the file claimed.
    state.inventory.forEach(function (item) {
      if (item.id >= state.nextId) state.nextId = item.id + 1;
    });
    return state;
  }

  function clear() {
    if (timer) { clearTimeout(timer); timer = null; }
    var store = storage();
    if (!store) return false;
    try {
      store.removeItem(KEY);
      lastSaved = 0;
      return true;
    } catch (err) {
      return false;
    }
  }

  function exists() {
    var store = storage();
    if (!store) return false;
    try {
      return !!store.getItem(KEY);
    } catch (err) {
      return false;
    }
  }

  global.Save = {
    KEY: KEY,
    VERSION: VERSION,
    supported: function () { return !!storage(); },
    lastSaved: function () { return lastSaved; },
    load: load,
    save: save,
    schedule: schedule,
    flush: flush,
    clear: clear,
    exists: exists
  };
})(window);
