/* Forge upgrades: permanent lifts to the stats every strike rolls around. */
(function (global) {
  "use strict";

  var S = global.Stats;

  // costs is the price of each tier in turn, so the length sets how many
  // tiers an upgrade has. level is the smith level it unlocks at.
  var UPGRADES = [
    { key: "polished-anvil", name: "Polished Anvil", stat: "rarity", per: 10,
      level: 1,
      costs: [400, 480, 540, 600, 680] },
    { key: "quality-control", name: "Quality Control", stat: "quality", per: 5,
      level: 5,
      costs: [650, 715, 780, 850, 915, 980, 1050, 1120, 1185, 1250] }
  ];

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

  function describe(def) {
    return "+" + def.per + " " + S.STATS[def.stat].label + " per tier";
  }

  function built(state, def) {
    return tierOf(state, def) * def.per;
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
    state.base[def.stat] = S.clamp(def.stat, state.base[def.stat] + def.per);
    return { ok: true, cost: cost, tier: state.upgrades[def.key] };
  }

  global.Upgrades = {
    UPGRADES: UPGRADES,
    defFor: defFor,
    unlocked: unlocked,
    maxTier: maxTier,
    tierOf: tierOf,
    nextCost: nextCost,
    describe: describe,
    built: built,
    buy: buy
  };
})(window);
