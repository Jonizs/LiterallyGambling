/* Game model: purse, materials, recipes and the forge roll. */
(function (global) {
  "use strict";

  var S = global.Stats;

  var MATERIALS = {
    wood:   { label: "Wood",   price: 4 },
    string: { label: "String", price: 3 },
    metal:  { label: "Metal",  price: 5 }
  };

  // perTier is the stat a tier-1 piece carries; tier multiplies it.
  var RECIPES = [
    { key: "bow", name: "Weak Bow", kind: "weapon",
      perTier: { damage: 5, durability: 16 }, cost: { wood: 10, string: 5 } },
    { key: "sword", name: "Weak Sword", kind: "weapon",
      perTier: { damage: 6, durability: 20 }, cost: { wood: 5, metal: 10 } },
    { key: "helmet", name: "Weak Helmet", kind: "armor",
      perTier: { armor: 3, durability: 18 }, cost: { metal: 8, string: 4 } },
    { key: "armor", name: "Weak Armor", kind: "armor",
      perTier: { armor: 6, durability: 30 }, cost: { metal: 15, string: 10 } },
    { key: "boots", name: "Weak Boots", kind: "armor",
      perTier: { armor: 2.5, durability: 15 }, cost: { metal: 10, string: 6 } }
  ];

  function recipeFor(key) {
    for (var i = 0; i < RECIPES.length; i++) {
      if (RECIPES[i].key === key) return RECIPES[i];
    }
    return RECIPES[0];
  }

  var STARTING_SILVER = 100;

  // Tier sets the base stat, quality scales it modestly, edition scales it
  // hard. Enchant slots change no stat - they only hold enchants later.
  var QUALITY_MULT = {
    Bad: 0.6, Normal: 1, Good: 1.2, Refined: 1.5, Pristine: 1.9, Legendary: 2.4
  };
  var EDITION_MULT = [1, 2, 3.5, 6, 10, 20];

  // Sale value is read off the stats the piece actually carries.
  var VALUE_PER = { damage: 4, armor: 5, durability: 0.4 };
  var PRICE_SCALE = 2.5; // one knob over the whole sale curve

  function statsFor(recipe, tierIndex, band, edition) {
    var mult = (QUALITY_MULT[band] || 1) * (EDITION_MULT[edition] || 1);
    var per = recipe.perTier;
    return {
      damage: per.damage ? Math.max(1, Math.round(per.damage * tierIndex * mult)) : 0,
      armor: per.armor ? Math.max(1, Math.round(per.armor * tierIndex * mult)) : 0,
      durability: Math.max(1, Math.round(per.durability * tierIndex * mult))
    };
  }

  function sellPrice(item) {
    var value = item.damage * VALUE_PER.damage +
                item.armor * VALUE_PER.armor +
                item.durability * VALUE_PER.durability;
    return Math.max(1, Math.round(value * PRICE_SCALE));
  }

  function inventoryValue(state) {
    return state.inventory.reduce(function (sum, item) {
      return sum + sellPrice(item);
    }, 0);
  }

  function sellAll(state) {
    var count = state.inventory.length;
    if (!count) return { ok: false, reason: "Nothing to sell." };
    var total = inventoryValue(state);
    state.inventory.length = 0;
    state.silver += total;
    return { ok: true, count: count, total: total };
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
    var tier = S.tierAt(rarity);
    var band = S.qualityBandAt(quality).name;
    var edition = rollStat("edition", state.base.edition);
    var stats = statsFor(recipe, tier.index, band, edition);
    var item = {
      id: state.nextId++,
      name: recipe.name,
      recipe: recipe.key,
      kind: recipe.kind,
      rarity: rarity,
      tier: tier.name,
      quality: quality,
      band: band,
      slots: rollStat("eslots", state.base.eslots),
      edition: edition,
      editionName: S.editionAt(edition),
      damage: stats.damage,
      armor: stats.armor,
      durability: stats.durability
    };
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
    statsFor: statsFor,
    recipeFor: recipeFor,
    QUALITY_MULT: QUALITY_MULT,
    EDITION_MULT: EDITION_MULT,
    sell: sell,
    sellAll: sellAll,
    inventoryValue: inventoryValue,
    rollLuck: rollLuck,
    rollStat: rollStat,
    forge: forge
  };
})(window);
