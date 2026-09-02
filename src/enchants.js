/* Enchants: the tables, the offer roll and how a chosen one lands on a piece. */
(function (global) {
  "use strict";

  var G = global.Game;

  // Every stat an enchant can touch, and the places each is rounded to once
  // it has been multiplied.
  // Nothing in the book is armour, so no enchant touches an armour stat -
  // "all stats" means everything a weapon actually carries.
  var ROUND = {
    damage: 0, durability: 0, attackSpeed: 2,
    critChance: 1, critDamage: 0, armorPen: 0
  };
  var ALL_STATS = Object.keys(ROUND);

  // Short enough that a full effect fits on one enchant card.
  var LABEL = {
    damage: "Damage", durability: "Durability",
    attackSpeed: "Atk speed", critChance: "C. chance",
    critDamage: "C. damage", armorPen: "A. pen"
  };

  var COST_SHARE = 0.55; // of the piece's sale price, paid to roll the offer
  var OFFER_SIZE = 3;
  var REFORGE_GROWTH = 1.2; // each reforge of the same piece costs this much more

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
    { key: "honed", name: "Honed", rarity: "common", maxTier: 3,
      effect: function (t) { return { damage: per(0.36, t) }; } },
    { key: "tempered", name: "Tempered", rarity: "common", maxTier: 2,
      effect: function (t) { return { durability: per(0.8, t) }; } },
    { key: "swift", name: "Swift", rarity: "common", maxTier: 3,
      effect: function (t) { return { attackSpeed: per(0.22, t) }; } },
    { key: "piercing", name: "Piercing", rarity: "common", maxTier: 2,
      effect: function (t) {
        return { armorPen: per(0.9, t), damage: per(0.15, t) };
      } },

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
    { key: "titanic", name: "Titanic", rarity: "uncommon", maxTier: 3,
      effect: function (t) { return { damage: per(0.62, t) }; } },
    { key: "executioner", name: "Executioner", rarity: "uncommon", maxTier: 3,
      effect: function (t) {
        return { critChance: per(0.5, t), critDamage: per(0.6, t) };
      } },
    { key: "warded", name: "Warded", rarity: "uncommon", maxTier: 2,
      effect: function (t) {
        return { durability: per(1.3, t), armorPen: per(0.85, t) };
      } },

    // --- rare --------------------------------------------------------------
    { key: "godly", name: "Godly", rarity: "rare", maxTier: 3,
      effect: function (t) { return { all: per(0.33, t) }; } },
    { key: "reinforced", name: "Reinforced", rarity: "rare", maxTier: 3,
      effect: function (t) { return { durability: per(3.2, t) }; } },
    { key: "bladed", name: "Bladed", rarity: "rare", maxTier: 3,
      effect: function (t) {
        return { damage: per(0.85, t), critDamage: per(0.61, t) };
      } },
    { key: "mythic", name: "Mythic", rarity: "rare", maxTier: 3,
      effect: function (t) { return { all: per(0.42, t) }; } }
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

  // The table's odds bent by whatever luck upgrades have been built. The
  // multiplied bands take their share out of common, which is left alone.
  function rarityOdds(state) {
    var U = global.Upgrades;
    if (!state || !U || !U.luckMult) return RARITY_ODDS;
    var sum = 0;
    var bent = RARITY_ODDS.map(function (band) {
      var chance = band.chance * U.luckMult(state, band.value);
      sum += chance;
      return { value: band.value, chance: chance };
    });
    return bent.map(function (band) {
      return { value: band.value, chance: band.chance / sum * 100 };
    });
  }

  // An artifact can make one enchant come up more often. The extra share is
  // taken out of common, so nothing else in the table moves.
  function bentEnchant(state) {
    var A = global.Artifacts;
    if (!state || !A) return null;
    for (var i = 0; i < DEFS.length; i++) {
      var def = DEFS[i];
      var mult = A.enchantMult(state, def.key);
      if (mult <= 1) continue;
      var band = rarityOdds(state).filter(function (entry) {
        return entry.value === def.rarity;
      })[0];
      if (!band) continue;
      var pool = DEFS.filter(function (other) {
        return other.rarity === def.rarity;
      });
      return { def: def, bonus: band.chance / pool.length * (mult - 1) };
    }
    return null;
  }

  // Common's share, less whatever the doll has taken out of it.
  function bentOdds(state, bonus) {
    return rarityOdds(state).map(function (band) {
      return band.value === "common"
        ? { value: band.value, chance: Math.max(0, band.chance - bonus) }
        : band;
    });
  }

  function rollOne(taken, state) {
    var bent = bentEnchant(state);
    var bonus = bent ? bent.bonus : 0;
    if (bonus > 0 && taken.indexOf(bent.def.key) < 0 && Math.random() * 100 < bonus) {
      var def = bent.def;
      var tier = Math.min(def.maxTier, pick(TIER_ODDS));
      return { key: def.key, name: def.name, rarity: def.rarity, tier: tier,
        tiered: def.maxTier > 1, text: describe(def, tier) };
    }
    var rarity = pick(bentOdds(state, bonus));
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

  // A piece never gets the same enchant twice: what it already carries is
  // taken before the offer is rolled, so those cannot come up again.
  function rollOffer(state, item) {
    var taken = item ? item.enchants.map(function (e) { return e.key; }) : [];
    var out = [];
    for (var i = 0; i < OFFER_SIZE; i++) {
      var entry = rollOne(taken, state);
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
    return { ok: true, cost: cost, choices: rollOffer(state, item) };
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
    var already = item.enchants.some(function (e) { return e.key === entry.key; });
    if (already) {
      return { ok: false, reason: def.name + " is already on that piece." };
    }
    var mult = multipliersFor(def, entry.tier);
    Object.keys(mult).forEach(function (stat) {
      // A stat the piece does not carry stays where it is; a weapon does not
      // grow armour off an "all stats" enchant.
      if (!item[stat]) return;
      item[stat] = round(item[stat] * mult[stat], ROUND[stat]);
    });
    // Anything over "crits every swing" is worked into the crit instead.
    G.spillCrit(item);
    item.enchants.push(entry);
    return { ok: true, entry: entry };
  }

  // What one slot of an offer is worth landing on: a rarity's odds split
  // evenly between the enchants in it, since the pick inside a rarity is even.
  function odds(state) {
    return rarityOdds(state).map(function (band) {
      var pool = DEFS.filter(function (def) { return def.rarity === band.value; });
      return {
        rarity: band.value,
        chance: Math.round(band.chance * 10) / 10,
        each: Math.round(band.chance / pool.length * 10) / 10,
        entries: pool.map(function (def) {
          return {
            key: def.key, name: def.name, maxTier: def.maxTier,
            text: describe(def, def.maxTier)
          };
        })
      };
    });
  }

  // Tier odds as they actually land: anything past an enchant's top tier is
  // clamped down onto it, so a two-tier enchant takes III's share into II.
  function tierOdds(maxTier) {
    var out = [];
    TIER_ODDS.forEach(function (entry) {
      var tier = Math.min(maxTier, entry.value);
      var seen = out.filter(function (o) { return o.value === tier; })[0];
      if (seen) seen.chance += entry.chance;
      else out.push({ value: tier, chance: entry.chance });
    });
    return out;
  }

  // --- reforging -----------------------------------------------------------
  // Stripping a piece back to the stats it was forged with, then rolling
  // again. The first strip costs what a normal roll would; each one after
  // that on the same piece costs a fifth again as much.
  function reforgeCost(item) {
    var base = Math.max(1, Math.round(G.sellPrice(bare(item)) * COST_SHARE));
    return Math.round(base * Math.pow(REFORGE_GROWTH, item.reforges || 0));
  }

  // A copy of the piece with its enchants lifted off, for pricing.
  function bare(item) {
    var stats = G.baseStatsOf(item), copy = {};
    Object.keys(item).forEach(function (key) { copy[key] = item[key]; });
    Object.keys(stats).forEach(function (key) { copy[key] = stats[key]; });
    copy.enchants = [];
    return copy;
  }

  // Strips the chosen enchants and rebuilds the piece: back to the stats it
  // was forged with, then whatever was kept laid on again.
  function reforge(state, item, indexes) {
    var wanted = (indexes || []).filter(function (i) {
      return i >= 0 && i < item.enchants.length;
    });
    if (!wanted.length) return { ok: false, reason: "Nothing picked to strip." };
    var cost = reforgeCost(item);
    if (state.silver < cost) {
      return { ok: false, reason: "Not enough silver. Reforging costs " + cost + "." };
    }
    state.silver -= cost;

    var kept = item.enchants.filter(function (entry, i) {
      return wanted.indexOf(i) < 0;
    });
    var stats = G.baseStatsOf(item);
    Object.keys(stats).forEach(function (key) { item[key] = stats[key]; });
    item.enchants = [];
    kept.forEach(function (entry) { apply(item, entry); });
    item.reforges = (item.reforges || 0) + 1;
    return { ok: true, cost: cost, removed: wanted.length, kept: kept.length };
  }

  function label(entry) {
    var roman = ["", "I", "II", "III"];
    return entry.tiered ? entry.name + " " + roman[entry.tier] : entry.name;
  }

  global.Enchants = {
    DEFS: DEFS,
    RARITY_ODDS: RARITY_ODDS,
    rarityOdds: rarityOdds,
    TIER_ODDS: TIER_ODDS,
    COST_SHARE: COST_SHARE,
    OFFER_SIZE: OFFER_SIZE,
    defFor: defFor,
    describe: describe,
    rollOffer: rollOffer,
    slotsLeft: slotsLeft,
    costFor: costFor,
    odds: odds,
    tierOdds: tierOdds,
    REFORGE_GROWTH: REFORGE_GROWTH,
    reforgeCost: reforgeCost,
    reforge: reforge,
    canEnchant: canEnchant,
    buyOffer: buyOffer,
    apply: apply,
    label: label
  };
})(window);
