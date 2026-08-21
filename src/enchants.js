/* Enchants: the tables, the offer roll and how a chosen one lands on a piece. */
(function (global) {
  "use strict";

  var G = global.Game;

  // Every stat an enchant can touch, and the places each is rounded to once
  // it has been multiplied.
  var ROUND = {
    damage: 0, armor: 0, durability: 0, attackSpeed: 2,
    critChance: 1, critDamage: 0, armorPen: 0
  };
  var ALL_STATS = Object.keys(ROUND);

  var LABEL = {
    damage: "Damage", armor: "Armor", durability: "Durability",
    attackSpeed: "Attack speed", critChance: "Crit chance",
    critDamage: "Crit damage", armorPen: "Armor pen"
  };

  var COST_SHARE = 0.5; // of the piece's sale price, paid to roll the offer
  var OFFER_SIZE = 3;

  var RARITY_ODDS = [
    { value: "common", chance: 85 },
    { value: "uncommon", chance: 10 },
    { value: "rare", chance: 5 }
  ];

  // Rolled for anything with tiers, then clamped to what that enchant goes
  // up to - so a two-tier enchant lands on its top tier 35% of the time.
  var TIER_ODDS = [
    { value: 1, chance: 65 },
    { value: 2, chance: 25 },
    { value: 3, chance: 10 }
  ];

  // "1.2x per tier" stacks the gain, not the multiplier: 1.2 at T1, 1.4 at T2.
  function per(gain, tier) {
    return 1 + gain * tier;
  }

  var DEFS = [
    // --- common ------------------------------------------------------------
    { key: "prospect", name: "Prospect", rarity: "common", maxTier: 3,
      effect: function (t) { return { critChance: per(1.34, t) }; } },
    { key: "sharp", name: "Sharp", rarity: "common", maxTier: 3,
      effect: function (t) { return { damage: per(0.4, t) }; } },
    { key: "careful", name: "Careful", rarity: "common", maxTier: 2,
      effect: function (t) { return { durability: per(0.7, t) }; } },
    { key: "deep-cuts", name: "Deep Cuts", rarity: "common", maxTier: 1,
      effect: function () { return { critDamage: 1.9 }; } },

    // --- uncommon ----------------------------------------------------------
    { key: "critical", name: "Critical", rarity: "uncommon", maxTier: 3,
      effect: function (t) {
        return { critChance: per(0.55, t), critDamage: per(0.55, t) };
      } },
    { key: "worthy", name: "Worthy", rarity: "uncommon", maxTier: 1,
      effect: function () { return { all: 1.22 }; } },
    { key: "rested", name: "Rested", rarity: "uncommon", maxTier: 3,
      effect: function (t) {
        return { damage: per(0.55, t), durability: per(0.55, t) };
      } },

    // --- rare --------------------------------------------------------------
    { key: "awakened", name: "Awakened", rarity: "rare", maxTier: 1,
      note: "Lets the piece be awakened.",
      effect: function () { return {}; } },
    { key: "godly", name: "Godly", rarity: "rare", maxTier: 3,
      effect: function (t) { return { all: per(0.33, t) }; } },
    { key: "reinforced", name: "Reinforced", rarity: "rare", maxTier: 3,
      effect: function (t) { return { durability: per(3.2, t) }; } },
    { key: "bladed", name: "Bladed", rarity: "rare", maxTier: 3,
      effect: function (t) {
        return { damage: per(0.85, t), critDamage: per(0.61, t) };
      } }
  ];

  function defFor(key) {
    for (var i = 0; i < DEFS.length; i++) {
      if (DEFS[i].key === key) return DEFS[i];
    }
    return null;
  }

  // "all" is shorthand for the whole stat sheet.
  function multipliersFor(def, tier) {
    var raw = def.effect(tier);
    if (raw.all === undefined) return raw;
    var out = {};
    ALL_STATS.forEach(function (stat) { out[stat] = raw.all; });
    return out;
  }

  function trim(value) {
    return String(Math.round(value * 100) / 100);
  }

  // Read straight off the multipliers, so the wording cannot drift from what
  // the enchant actually does.
  function describe(def, tier) {
    if (def.note) return def.note;
    var mult = multipliersFor(def, tier);
    var stats = Object.keys(mult);
    if (stats.length === ALL_STATS.length) {
      return "All stats ×" + trim(mult.damage);
    }
    return stats.map(function (stat) {
      return LABEL[stat] + " ×" + trim(mult[stat]);
    }).join(", ");
  }

  function pick(odds) {
    var roll = Math.random() * 100, sum = 0;
    for (var i = 0; i < odds.length; i++) {
      sum += odds[i].chance;
      if (roll < sum) return odds[i].value;
    }
    return odds[odds.length - 1].value;
  }

  function rollOne(taken) {
    var rarity = pick(RARITY_ODDS);
    var pool = DEFS.filter(function (def) {
      return def.rarity === rarity && taken.indexOf(def.key) < 0;
    });
    // A rarity can run dry inside one offer; widen rather than repeat.
    if (!pool.length) {
      pool = DEFS.filter(function (def) { return taken.indexOf(def.key) < 0; });
    }
    var def = pool[Math.floor(Math.random() * pool.length)];
    var tier = Math.min(def.maxTier, pick(TIER_ODDS));
    return {
      key: def.key, name: def.name, rarity: def.rarity,
      tier: tier, tiered: def.maxTier > 1, text: describe(def, tier)
    };
  }

  function rollOffer() {
    var taken = [], out = [];
    for (var i = 0; i < OFFER_SIZE; i++) {
      var entry = rollOne(taken);
      taken.push(entry.key);
      out.push(entry);
    }
    return out;
  }

  function slotsLeft(item) {
    return item.slots - item.enchants.length;
  }

  function costFor(item) {
    return Math.max(1, Math.round(G.sellPrice(item) * COST_SHARE));
  }

  function canEnchant(state, item) {
    return slotsLeft(item) > 0 && state.silver >= costFor(item);
  }

  // The silver buys the roll, not the enchant: the three that come back are
  // what the piece has to choose from.
  function buyOffer(state, item) {
    if (slotsLeft(item) <= 0) {
      return { ok: false, reason: "No enchant slots left on that piece." };
    }
    var cost = costFor(item);
    if (state.silver < cost) {
      return { ok: false, reason: "Not enough silver. That roll costs " + cost + "." };
    }
    state.silver -= cost;
    return { ok: true, cost: cost, choices: rollOffer() };
  }

  function round(value, places) {
    var factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }

  function apply(item, entry) {
    var def = defFor(entry.key);
    if (!def) return { ok: false, reason: "That enchant is gone." };
    if (slotsLeft(item) <= 0) {
      return { ok: false, reason: "No enchant slots left on that piece." };
    }
    var mult = multipliersFor(def, entry.tier);
    Object.keys(mult).forEach(function (stat) {
      // A stat the piece does not carry stays where it is; a weapon does not
      // grow armour off an "all stats" enchant.
      if (!item[stat]) return;
      item[stat] = round(item[stat] * mult[stat], ROUND[stat]);
      if (stat === "critChance") {
        item[stat] = Math.min(G.CRIT_CAP, item[stat]);
      }
    });
    if (def.key === "awakened") item.awakenable = true;
    item.enchants.push(entry);
    return { ok: true, entry: entry };
  }

  function label(entry) {
    var roman = ["", "I", "II", "III"];
    return entry.tiered ? entry.name + " " + roman[entry.tier] : entry.name;
  }

  global.Enchants = {
    DEFS: DEFS,
    RARITY_ODDS: RARITY_ODDS,
    TIER_ODDS: TIER_ODDS,
    COST_SHARE: COST_SHARE,
    OFFER_SIZE: OFFER_SIZE,
    defFor: defFor,
    describe: describe,
    rollOffer: rollOffer,
    slotsLeft: slotsLeft,
    costFor: costFor,
    canEnchant: canEnchant,
    buyOffer: buyOffer,
    apply: apply,
    label: label
  };
})(window);
