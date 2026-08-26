/* Forge upgrades: permanent lifts to the stats every strike rolls around. */
(function (global) {
  "use strict";

  var S = global.Stats;

  // costs is the price of each tier in turn, so the length sets how many
  // tiers an upgrade has. level is the smith level it unlocks at. stat is
  // what the tier lifts; an upgrade that lifts two carries stats instead.
  var UPGRADES = [
    { key: "polished-anvil", name: "Polished Anvil", stat: "rarity", per: 10,
      level: 1,
      costs: [400, 480, 540, 600, 680] },
    { key: "quality-control", name: "Quality Control", stat: "quality", per: 5,
      level: 5,
      costs: [650, 715, 780, 850, 915, 980, 1050, 1120, 1185, 1250] },
    { key: "psa-bribery", name: "PSA Bribery", stat: "edition", per: 1,
      level: 1,
      costs: [5000] },
    { key: "deep-thinking", name: "Deep Thinking", stat: "eslots", per: 1,
      level: 1,
      costs: [3500] },
    { key: "good-grip", name: "Good Grip", stats: ["rarity", "quality"], per: 5,
      level: 1,
      costs: [3000, 4000, 5000, 6000, 7000] },
    // A luck upgrade weights the enchant rarity roll instead of lifting a
    // stat: each tier multiplies those bands' odds, so common thins out.
    { key: "deep-luck", name: "Deep Luck", luck: { uncommon: 1.2, rare: 1.2 },
      level: 1,
      costs: [2500, 4000, 6000, 8500, 12000] }
  ];

  // Every upgrade reads as a list of stats, whether it lifts one or two.
  function statsOf(def) {
    if (def.stats) return def.stats;
    return def.stat ? [def.stat] : [];
  }

  // Puts a tier's lift on the base the forge rolls around.
  function apply(state, def, tiers) {
    statsOf(def).forEach(function (key) {
      state.base[key] = S.clamp(key, state.base[key] + def.per * tiers);
    });
  }

  function defFor(key) {
    for (var i = 0; i < UPGRADES.length; i++) {
      if (UPGRADES[i].key === key) return UPGRADES[i];
    }
    return null;
  }

  function unlocked(state, def) {
    return state.level >= (def.level || 1);
  }

  function maxTier(def) {
    return def.costs.length;
  }

  function tierOf(state, def) {
    return state.upgrades[def.key] || 0;
  }

  // null once every tier is built.
  function nextCost(state, def) {
    var tier = tierOf(state, def);
    return tier >= maxTier(def) ? null : def.costs[tier];
  }

  // How much an upgrade bends one enchant rarity's odds at its current tier.
  function luckMult(state, rarity) {
    var out = 1;
    UPGRADES.forEach(function (def) {
      if (!def.luck || !def.luck[rarity]) return;
      out *= Math.pow(def.luck[rarity], tierOf(state, def));
    });
    return out;
  }

  function trim(value) {
    return String(Math.round(value * 100) / 100);
  }

  function luckText(def, tiers) {
    return Object.keys(def.luck).map(function (rarity) {
      return rarity + " \u00d7" + trim(Math.pow(def.luck[rarity], tiers));
    }).join(", ");
  }

  function describe(def) {
    if (def.luck) {
      return "Enchant odds " + luckText(def, 1) + " per tier";
    }
    var labels = statsOf(def).map(function (key) { return S.STATS[key].label; });
    return "+" + def.per + " " + labels.join(" and ") + " per tier";
  }

  function built(state, def) {
    return tierOf(state, def) * def.per;
  }

  // What the tiers already bought add up to, as the panel says it.
  function builtText(state, def) {
    var tiers = tierOf(state, def);
    if (def.luck) return tiers ? luckText(def, tiers) : "nothing yet";
    var value = built(state, def);
    return (value > 0 ? "+" : "") + value;
  }

  function buy(state, def) {
    if (!unlocked(state, def)) {
      return { ok: false, reason: "Reach level " + def.level + " first." };
    }
    var cost = nextCost(state, def);
    if (cost === null) {
      return { ok: false, reason: def.name + " is finished." };
    }
    if (state.silver < cost) {
      return { ok: false, reason: "Not enough silver. That tier costs " + cost + "." };
    }
    state.silver -= cost;
    state.upgrades[def.key] = tierOf(state, def) + 1;
    // The lift lands on the base the forge rolls around, so the buff readout
    // and the strike forecast both pick it up for free.
    apply(state, def, 1);
    return { ok: true, cost: cost, tier: state.upgrades[def.key] };
  }

  global.Upgrades = {
    UPGRADES: UPGRADES,
    defFor: defFor,
    statsOf: statsOf,
    apply: apply,
    unlocked: unlocked,
    maxTier: maxTier,
    tierOf: tierOf,
    nextCost: nextCost,
    describe: describe,
    built: built,
    builtText: builtText,
    luckMult: luckMult,
    buy: buy
  };
})(window);
