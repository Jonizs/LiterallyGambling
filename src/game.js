/* Game model: purse, materials, recipes and the forge roll. */
(function (global) {
  "use strict";

  var S = global.Stats;

  var MATERIALS = {
    wood:   { label: "Wood",   price: 4 },
    metal:  { label: "Metal",  price: 5 }
  };

  // perTier is the stat a tier-1 piece carries; tier multiplies it. combat is
  // the piece's own handling: it barely moves with tier, so it stays flat here
  // and takes only a gentle share of the quality and edition rolls.
  // level is the smith level the recipe unlocks at; xp is what a tier-1
  // Normal piece is worth at the bench.
  var RECIPES = [
    { key: "sword", name: "Weak Sword", kind: "weapon", icon: "sword",
      level: 1, xp: 15,
      perTier: { damage: 6, durability: 20 },
      combat: { speed: 0.85, crit: 5, critDamage: 150, pen: 0 },
      cost: { wood: 5, metal: 10 } },
    // Blades the smith has not learned yet: the bench shows the shape and
    // nothing else. mystery keeps them off the anvil whatever the level is.
    { key: "mystery-1", name: "???", kind: "weapon", icon: "sword-silhouette-1",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-2", name: "???", kind: "weapon", icon: "sword-silhouette-2",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-3", name: "???", kind: "weapon", icon: "sword-silhouette-3",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-4", name: "???", kind: "weapon", icon: "sword-silhouette-4",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} },
    { key: "mystery-5", name: "???", kind: "weapon", icon: "sword-silhouette-5",
      mystery: true, level: 99, xp: 0,
      perTier: { damage: 0, durability: 0 },
      combat: { speed: 1, crit: 0, critDamage: 150, pen: 0 },
      cost: {} }
  ];

  function recipeFor(key) {
    for (var i = 0; i < RECIPES.length; i++) {
      if (RECIPES[i].key === key) return RECIPES[i];
    }
    return RECIPES[0];
  }

  var STARTING_SILVER = 100;
  var STIPEND = 100;
  var STIPEND_COOLDOWN = 5 * 60 * 1000;
  var STARTING_LEVEL = 1;

  // Each level costs a third again as much as the one before it.
  var XP_BASE = 45, XP_GROWTH = 1.35;
  var XP_PER_TIER = 0.35; // extra share of a recipe's xp per tier above T1

  function xpToNext(level) {
    return Math.round(XP_BASE * Math.pow(XP_GROWTH, level - 1));
  }

  // A better piece teaches more: tier and finish both raise the bench xp.
  function xpFor(recipe, tierIndex, band) {
    return Math.max(1, Math.round(
      recipe.xp * (1 + (tierIndex - 1) * XP_PER_TIER) * (QUALITY_MULT[band] || 1)));
  }

  function grantXp(state, amount) {
    state.xp += amount;
    var levels = 0;
    while (state.xp >= xpToNext(state.level)) {
      state.xp -= xpToNext(state.level);
      state.level++;
      levels++;
    }
    return { amount: amount, levels: levels, level: state.level };
  }

  function xpPercent(state) {
    return Math.max(0, Math.min(100,
      Math.round(state.xp / xpToNext(state.level) * 100)));
  }

  function unlocked(state, recipe) {
    return !recipe.mystery && state.level >= recipe.level;
  }

  // Recipes the smith cannot forge yet, so the bench can show what is coming.
  function lockedRecipes(state) {
    return RECIPES.filter(function (recipe) {
      return !recipe.mystery && !unlocked(state, recipe);
    });
  }

  // Tier sets the base stat, quality scales it modestly, edition scales it
  // hard. Enchant slots change no stat - they only hold enchants later.
  var QUALITY_MULT = {
    Bad: 0.6, Normal: 1, Good: 1.2, Refined: 1.5, Pristine: 1.9, Legendary: 2.4
  };
  var EDITION_MULT = [1, 2, 3.5, 6, 10, 20];

  // Sale value is read off the stats the piece actually carries. Damage,
  // speed and crit are priced together as the damage a piece actually puts
  // out, so a fast piece and a hard-hitting one can be worth the same.
  var VALUE_PER = { dps: 5, armor: 5, durability: 1.2, armorPen: 2 };
  var PRICE_SCALE = 1.31; // one knob over the whole sale curve

  // Buyers pay for a piece that crits far beyond the damage a crit actually
  // adds, so crit chance is a real slice of the price rather than a rounding
  // error. PRICE_SCALE is set against it to keep a plain piece worth what it
  // was before.
  // The premium saturates rather than climbing forever: a piece that already
  // crits hard still gains from more crit, but never runs away with the
  // price. HALF is the crit weight that buys half of what is on offer.
  var CRIT_VALUE_CAP = 10;
  var CRIT_VALUE_HALF = 0.35;

  // Shares of the quality/edition roll the combat stats keep. Damage takes the
  // multiplier whole; speed and crit would run away if they did the same.
  var SPEED_SHARE = 0.2;
  var CRIT_SHARE = 0.5;
  var CRIT_PER_EDITION = 1.5;
  var CRIT_DMG_SHARE = 20;
  var CRIT_DMG_PER_EDITION = 10;
  var CRIT_CAP = 75; // percent, so a piece never crits every swing

  function round(value, places) {
    var factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }

  function statsFor(recipe, tierIndex, band, edition) {
    var quality = QUALITY_MULT[band] || 1;
    var mult = quality * (EDITION_MULT[edition] || 1);
    var per = recipe.perTier;
    var combat = recipe.combat;
    return {
      damage: per.damage ? Math.max(1, Math.round(per.damage * tierIndex * mult)) : 0,
      armor: per.armor ? Math.max(1, Math.round(per.armor * tierIndex * mult)) : 0,
      durability: Math.max(1, Math.round(per.durability * tierIndex * mult)),
      attackSpeed: round(combat.speed * (1 + (quality - 1) * SPEED_SHARE), 2),
      critChance: round(Math.min(CRIT_CAP,
        combat.crit * (1 + (quality - 1) * CRIT_SHARE) + edition * CRIT_PER_EDITION), 1),
      critDamage: Math.round(combat.critDamage + (quality - 1) * CRIT_DMG_SHARE +
        edition * CRIT_DMG_PER_EDITION),
      // Armour penetration is modelled but not rolled yet; every piece is 0.
      armorPen: Math.round(combat.pen)
    };
  }

  // Damage a piece lands per second on average, counting crits as the share
  // of swings they actually are.
  function damagePerSecond(item) {
    var critMult = 1 + (item.critChance / 100) * (item.critDamage / 100 - 1);
    return item.damage * item.attackSpeed * critMult;
  }

  // What the damage side of a piece is worth: its output, with crit counted
  // at the premium the market puts on it.
  function saleDamage(item) {
    var crit = (item.critChance / 100) * (item.critDamage / 100 - 1);
    var premium = 1 + (CRIT_VALUE_CAP - 1) * crit / (crit + CRIT_VALUE_HALF);
    return item.damage * item.attackSpeed * premium;
  }

  function sellPrice(item) {
    var value = saleDamage(item) * VALUE_PER.dps +
                item.armor * VALUE_PER.armor +
                item.durability * VALUE_PER.durability +
                item.armorPen * VALUE_PER.armorPen;
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
      level: STARTING_LEVEL,
      xp: 0,
      materials: { wood: 0, metal: 0 },
      // Ore and schematics from the resource yard, and the run that is out.
      resources: global.Gather.emptyResources(),
      gather: null,
      // Bars out of the smelter, and the batch that is burning.
      bars: global.Refine.emptyBars(),
      refine: null,
      inventory: [],
      upgrades: {},
      // When the guild last covered a broke smith.
      stipendAt: 0,
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

  // What the materials still missing for a recipe would cost at the shop.
  function shortfallCost(state, recipe) {
    return missingFor(state, recipe).reduce(function (sum, gap) {
      return sum + priceOf(gap.key, gap.short);
    }, 0);
  }

  // A smith who can neither forge nor buy what a piece needs is stuck for
  // good, so the guild covers the gap 50 silver at a time.
  function stipend(state, now) {
    var at = now || Date.now();
    if (!stuck(state)) return 0;
    if (at - state.stipendAt < STIPEND_COOLDOWN) return 0;
    state.silver += STIPEND;
    state.stipendAt = at;
    return STIPEND;
  }

  // How long until the guild will pay out again, in ms.
  function stipendWait(state, now) {
    return Math.max(0, STIPEND_COOLDOWN - ((now || Date.now()) - state.stipendAt));
  }

  function stuck(state) {
    return RECIPES.every(function (recipe) {
      if (!unlocked(state, recipe)) return true;
      if (canForge(state, recipe)) return false;
      return shortfallCost(state, recipe) > state.silver;
    });
  }

  function canForge(state, recipe) {
    return unlocked(state, recipe) && missingFor(state, recipe).length === 0;
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
    if (!unlocked(state, recipe)) {
      return { ok: false, reason: "Reach level " + recipe.level + " first." };
    }
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
      icon: recipe.icon,
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
      durability: stats.durability,
      attackSpeed: stats.attackSpeed,
      critChance: stats.critChance,
      critDamage: stats.critDamage,
      armorPen: stats.armorPen,
      enchants: []
    };
    state.inventory.unshift(item);
    return { ok: true, item: item, xp: grantXp(state, xpFor(recipe, tier.index, band)) };
  }

  global.Game = {
    MATERIALS: MATERIALS,
    RECIPES: RECIPES,
    STARTING_SILVER: STARTING_SILVER,
    STARTING_LEVEL: STARTING_LEVEL,
    createState: createState,
    xpToNext: xpToNext,
    xpFor: xpFor,
    grantXp: grantXp,
    xpPercent: xpPercent,
    unlocked: unlocked,
    lockedRecipes: lockedRecipes,
    damagePerSecond: damagePerSecond,
    saleDamage: saleDamage,
    CRIT_CAP: CRIT_CAP,
    priceOf: priceOf,
    buy: buy,
    STIPEND: STIPEND,
    STIPEND_COOLDOWN: STIPEND_COOLDOWN,
    stipend: stipend,
    stipendWait: stipendWait,
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
