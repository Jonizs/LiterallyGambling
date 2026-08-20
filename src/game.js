/* Game model: purse, materials, recipes and the forge roll. */
(function (global) {
  "use strict";

  var S = global.Stats;

  var MATERIALS = {
    wood:   { label: "Wood",   price: 4 },
    string: { label: "String", price: 3 },
    metal:  { label: "Metal",  price: 5 }
  };

  var RECIPES = [
    { key: "bow",    name: "Weak Bow",    cost: { wood: 10, string: 5 } },
    { key: "sword",  name: "Weak Sword",  cost: { wood: 5,  metal: 10 } },
    { key: "helmet", name: "Weak Helmet", cost: { metal: 8, string: 4 } },
    { key: "armor",  name: "Weak Armor",  cost: { metal: 15, string: 10 } },
    { key: "boots",  name: "Weak Boots",  cost: { metal: 10, string: 6 } }
  ];

  var STARTING_SILVER = 100;

  // Placeholder sale pricing - the shape is right, the numbers are not
  // balanced yet. Base value per piece, scaled by tier and quality band,
  // with a flat bonus per enchant slot and per edition step.
  var SELL_BASE = { bow: 20, sword: 25, helmet: 22, armor: 35, boots: 24 };
  var BAND_MULTIPLIER = {
    Bad: 0.5, Normal: 1, Good: 1.6, Refined: 2.4, Pristine: 3.4, Legendary: 5
  };
  var PRICE_SCALE = 2.5; // one knob over the whole sale curve

  function sellPrice(item) {
    var tierIndex = parseInt(item.tier.slice(1), 10) || 1;
    var base = SELL_BASE[item.recipe] || 20;
    var price = base * (1 + (tierIndex - 1) * 0.35) *
                (BAND_MULTIPLIER[item.band] || 1);
    price += item.slots * 12 + item.edition * 20;
    return Math.max(1, Math.round(price * PRICE_SCALE));
  }

  function sell(state, id) {
    for (var i = 0; i < state.inventory.length; i++) {
      if (state.inventory[i].id === id) {
        var item = state.inventory.splice(i, 1)[0];
        var price = sellPrice(item);
        state.silver += price;
        return { ok: true, item: item, price: price };
      }
    }
    return { ok: false, reason: "That piece is gone." };
  }

  function createState() {
    return {
      silver: STARTING_SILVER,
      materials: { wood: 0, string: 0, metal: 0 },
      inventory: [],
      // Base stats the forge rolls around. They are not spent by forging.
      base: {
        rarity: S.STATS.rarity.start,
        quality: S.STATS.quality.start,
        eslots: S.STATS.eslots.start,
        edition: S.STATS.edition.start
      },
      nextId: 1
    };
  }

  function priceOf(key, qty) {
    return MATERIALS[key].price * qty;
  }

  function buy(state, key, qty) {
    var cost = priceOf(key, qty);
    if (state.silver < cost) {
      return { ok: false, reason: "Not enough silver. That costs " + cost + "." };
    }
    state.silver -= cost;
    state.materials[key] += qty;
    return { ok: true, spent: cost };
  }

  // Materials still missing for a recipe, as {key, short} entries.
  function missingFor(state, recipe) {
    return Object.keys(recipe.cost).reduce(function (out, key) {
      var short = recipe.cost[key] - state.materials[key];
      if (short > 0) out.push({ key: key, short: short });
      return out;
    }, []);
  }

  function canForge(state, recipe) {
    return missingFor(state, recipe).length === 0;
  }

  // Every value in the luck window is equally likely, so a wider negative
  // side simply means bad results come up more often.
  function rollLuck(key) {
    var stat = S.STATS[key];
    var span = stat.up - stat.down + 1;
    return stat.down + Math.floor(Math.random() * span);
  }

  function rollStat(key, base) {
    return S.clamp(key, base + rollLuck(key));
  }

  function forge(state, recipe) {
    if (!canForge(state, recipe)) {
      return { ok: false, reason: "Missing materials." };
    }
    Object.keys(recipe.cost).forEach(function (key) {
      state.materials[key] -= recipe.cost[key];
    });

    var rarity = rollStat("rarity", state.base.rarity);
    var quality = rollStat("quality", state.base.quality);
    var item = {
      id: state.nextId++,
      name: recipe.name,
      recipe: recipe.key,
      rarity: rarity,
      tier: S.tierAt(rarity).name,
      quality: quality,
      band: S.qualityBandAt(quality).name,
      slots: rollStat("eslots", state.base.eslots),
      edition: 0,
      editionName: ""
    };
    item.edition = rollStat("edition", state.base.edition);
    item.editionName = S.editionAt(item.edition);
    state.inventory.unshift(item);
    return { ok: true, item: item };
  }

  global.Game = {
    MATERIALS: MATERIALS,
    RECIPES: RECIPES,
    STARTING_SILVER: STARTING_SILVER,
    createState: createState,
    priceOf: priceOf,
    buy: buy,
    missingFor: missingFor,
    canForge: canForge,
    sellPrice: sellPrice,
    sell: sell,
    rollLuck: rollLuck,
    rollStat: rollStat,
    forge: forge
  };
})(window);
