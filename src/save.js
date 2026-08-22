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

  // ---- writing -------------------------------------------------------

  function snapshot(state) {
    return {
      version: VERSION,
      savedAt: Date.now(),
      silver: state.silver,
      level: state.level,
      xp: state.xp,
      materials: state.materials,
      inventory: state.inventory,
      upgrades: state.upgrades,
      base: state.base,
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
      state.base[def.stat] = S.clamp(def.stat, state.base[def.stat] + tier * def.per);
    });
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
    state.silver = whole(raw.silver, G.STARTING_SILVER);
    state.level = Math.max(G.STARTING_LEVEL, whole(raw.level, G.STARTING_LEVEL, 1));
    state.xp = whole(raw.xp, 0);
    if (raw.materials && typeof raw.materials === "object") {
      Object.keys(state.materials).forEach(function (key) {
        state.materials[key] = whole(raw.materials[key], 0);
      });
    }
    readUpgrades(raw.upgrades, state);
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
