/* Game model: purse, materials, recipes and the forge roll. */
(function (global) {
  "use strict";

  var S = global.Stats;

  var MATERIALS = {
    wood:   { label: "Wood",   price: 4 },
    metal:  { label: "Metal",  price: 5 },
    // level, where it is set, is the smith level the shop starts stocking it.
    paper:  { label: "Paper",  price: 25, level: 2 }
  };

  var RECIPES = global.Recipes.LIST;

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
    return !recipe.mystery && state.level >= recipe.level && known(state, recipe);
  }

  // Recipes still behind a level, so the bench can show what is coming. A
  // recipe waiting on the experimentation bench is not waiting on a level.
  function lockedRecipes(state) {
    return RECIPES.filter(function (recipe) {
      return !recipe.mystery && !recipe.research && !unlocked(state, recipe);
    });
  }

  // Tier sets the base stat, quality scales it modestly, edition scales it
  // hard. Enchant slots change no stat - they only hold enchants later.
  var QUALITY_MULT = {
    Bad: 0.6, Normal: 1, Good: 1.2, Refined: 1.5, Pristine: 1.9, Legendary: 2.4
  };
  var EDITION_MULT = [1, 2, 3.5, 6, 10, 20];

  // What a stat sheet is worth on the market. Damage, speed and crit are
  // priced together as the damage a piece actually puts out, so a fast piece
  // and a hard-hitting one can be worth the same.
  var VALUE_PER = { dps: 5, armor: 5, durability: 1.2, armorPen: 2 };

  // The sale is anchored to what the piece cost to build rather than to the
  // stats it happens to carry: a forge on a bare bench turns the recipe's
  // margin of its materials back, and the roll leans that a little. SALE_POW
  // compresses the lean, so an UNGODLY T7 blade fetches a couple of times a
  // plain one instead of a hundred times — the gamble pays off in what a good
  // piece can be enchanted, awakened and polished into, not in what it fetches
  // straight off the anvil.
  //
  // The bar a roll is measured against never moves: it is a piece rolled dead
  // on the bench a smith starts at. Upgrades therefore raise what every forge
  // returns — they are bought with silver and paid back in margin. A recipe's
  // own margin is what it turns on a bare bench, so the late blades are quoted
  // low: by the time one is worked out its smith has most of the upgrade tree
  // built, and the tree is what lifts them to a living wage.
  var MARGIN = 1.1;
  var SALE_POW = 0.3;
  var OPENING_LEAN = 1.354; // average lean a bare bench rolls, so a margin reads true

  // Buyers pay for a piece that crits far beyond the damage a crit actually
  // adds, so crit chance is a real slice of the price rather than a rounding
  // error.
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

  // What a stat sheet fetches before the margin is worked out.
  function powerOf(item) {
    return saleDamage(item) * VALUE_PER.dps +
           item.armor * VALUE_PER.armor +
           item.durability * VALUE_PER.durability +
           item.armorPen * VALUE_PER.armorPen;
  }

  // A piece rolled dead on the given bench: what a forge there is priced
  // against.
  function anchorFor(recipe, base) {
    return powerOf(statsFor(recipe, S.tierAt(base.rarity).index,
      S.qualityBandAt(base.quality).name, base.edition));
  }

  // The bench a smith starts at: every piece is priced against a roll that
  // landed dead on it, whatever the smith's own bench has grown into.
  var OPENING_BASE = {
    rarity: S.STATS.rarity.start,
    quality: S.STATS.quality.start,
    edition: S.STATS.edition.start
  };

  var anchorCache = {};

  function openingAnchor(recipe) {
    if (anchorCache[recipe.key] === undefined) {
      anchorCache[recipe.key] = anchorFor(recipe, OPENING_BASE);
    }
    return anchorCache[recipe.key];
  }

  function sellPrice(item) {
    var recipe = recipeFor(item.recipe);
    var anchor = openingAnchor(recipe);
    var rolled = powerOf(baseStatsOf(item));
    // How the roll came out, compressed — then the work laid on since, which
    // is not: enchanting, awakening and polishing pay in full.
    var lean = Math.pow(rolled / anchor, SALE_POW) / OPENING_LEAN;
    var worked = powerOf(item) / rolled;
    // A piece forged under The Way carries its premium for good.
    return Math.max(1, Math.round(
      recipeValue(recipe) * (recipe.margin || MARGIN) * lean * worked *
      (item.value || 1)));
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
      materials: { wood: 0, metal: 0, paper: 0 },
      // Ore and schematics from the resource yard, and the run that is out.
      resources: global.Gather.emptyResources(),
      gather: null,
      // Bars out of the smelter, and the batch that is burning.
      bars: global.Refine.emptyBars(),
      known: [],
      ovens: global.Refine.emptyOvens(),
      // Alloys out of the crucibles, and what each of the three is holding.
      alloys: global.Compound.emptyAlloys(),
      crucibles: global.Compound.emptyCrucibles(),
      // Fittings soldered on the anvil, spent by the pieces that call for them.
      parts: global.Parts.emptyParts(),
      // What the shelf holds, what has been found and how many rolls in.
      artifacts: global.Artifacts.emptyArtifacts(),
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

  function stocked(state, key) {
    var mat = MATERIALS[key];
    return !mat.level || state.level >= mat.level;
  }

  function buy(state, key, qty) {
    var mat = MATERIALS[key];
    if (!stocked(state, key)) {
      return { ok: false, reason: mat.label + " is stocked from level " + mat.level + "." };
    }
    var cost = priceOf(key, qty);
    if (state.silver < cost) {
      return { ok: false, reason: "Not enough silver. That costs " + cost + "." };
    }
    state.silver -= cost;
    state.materials[key] += qty;
    return { ok: true, spent: cost };
  }

  // A cost draws on five pools: shop materials, the yard's own stock, refined
  // bars, alloys and finished parts. POOLS names where each lives and what it
  // is called on screen.
  var POOLS = [
    { on: "cost", from: "materials",
      label: function (key) { return MATERIALS[key].label; } },
    { on: "resources", from: "resources",
      label: function (key) { return global.Gather.RESOURCES[key].label; } },
    { on: "bars", from: "bars",
      label: function (key) { return global.Refine.find(key).label + " bar"; } },
    { on: "alloys", from: "alloys",
      label: function (key) { return global.Compound.find(key).name; } },
    { on: "parts", from: "parts",
      label: function (key) { return global.Parts.find(key).name; } }
  ];

  // Schematics are not sold anywhere, so they are worth what stamping one on
  // the anvil costs — the same two crafts the forge bench offers.
  var SCHEMATIC_WORTH = { common: 270, mold: 175, rare: 2500, epic: 12000 };

  // What one of a thing is reckoned to be worth in silver: shop goods at what
  // the shop charges, ore at what the bar it burns down to is worth, alloys
  // and parts at whatever went into them.
  function worthOf(from, key) {
    if (from === "materials") return MATERIALS[key].price;
    if (from === "bars") return global.Refine.find(key).value;
    if (from === "alloys") return global.Compound.value(global.Compound.find(key));
    if (from === "parts") return recipeValue(global.Parts.find(key));
    var ore = global.Refine.find(key);
    return ore ? ore.value : SCHEMATIC_WORTH[key] || 0;
  }

  // What a cost is worth in silver, whichever pools it draws on. Recipes and
  // parts never change once loaded, so each is worked out once and kept.
  var worthCache = {};

  function recipeValue(recipe) {
    if (worthCache[recipe.key] === undefined) {
      var total = 0;
      POOLS.forEach(function (pool) {
        var want = recipe[pool.on];
        if (!want) return;
        Object.keys(want).forEach(function (key) {
          total += worthOf(pool.from, key) * want[key];
        });
      });
      worthCache[recipe.key] = total;
    }
    return worthCache[recipe.key];
  }

  // The same cost taken qty times over, so a batch is priced off one entry.
  function scaleNeed(need, qty) {
    var out = {};
    POOLS.forEach(function (pool) {
      var want = need[pool.on];
      if (!want) return;
      var copy = {};
      Object.keys(want).forEach(function (key) { copy[key] = want[key] * qty; });
      out[pool.on] = copy;
    });
    return out;
  }

  // How many of a craft the stock on hand covers.
  function mostAffordable(state, need) {
    var most = Infinity;
    POOLS.forEach(function (pool) {
      var want = need[pool.on];
      if (!want) return;
      Object.keys(want).forEach(function (key) {
        most = Math.min(most, Math.floor(state[pool.from][key] / want[key]));
      });
    });
    return most === Infinity ? 0 : most;
  }

  // What a batch is still short of, as one line of plain text.
  function shortText(state, need, qty) {
    var missing = missingFor(state, scaleNeed(need, qty || 1));
    if (!missing.length) return "";
    return "Short " + missing.map(function (gap) {
      return gap.short + " " + gap.label.toLowerCase();
    }).join(", ");
  }

  // Everything a recipe still needs, as {pool, key, short, label} entries.
  function missingFor(state, recipe) {
    var out = [];
    POOLS.forEach(function (pool) {
      var need = recipe[pool.on];
      if (!need) return;
      Object.keys(need).forEach(function (key) {
        var short = need[key] - state[pool.from][key];
        if (short > 0) {
          out.push({ pool: pool.from, key: key, short: short,
            label: pool.label(key) });
        }
      });
    });
    return out;
  }

  // What the gap would cost at the shop. Only materials are sold there, so a
  // recipe short of bars or alloys cannot be bought out of trouble.
  function shortfallCost(state, recipe) {
    return missingFor(state, recipe).reduce(function (sum, gap) {
      return gap.pool === "materials" ? sum + priceOf(gap.key, gap.short) : Infinity;
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

  // The swing a stat is really rolling in: the table's own, widened by
  // whatever is on the artifact shelf.
  function luckWindow(state, key) {
    return state ? global.Artifacts.luck(state, key) : S.luckOf(key);
  }

  // Every value in the luck window is equally likely, so a wider negative
  // side simply means bad results come up more often.
  function rollLuck(key, state) {
    var win = luckWindow(state, key);
    var span = win.up - win.down + 1;
    return win.down + Math.floor(Math.random() * span);
  }

  function rollStat(key, base, state) {
    return S.clamp(key, base + rollLuck(key, state));
  }

  // Takes a cost out of whichever pools it draws on. source picks between a
  // recipe's forge cost and its research cost.
  function spend(state, need) {
    POOLS.forEach(function (pool) {
      var want = need[pool.on];
      if (!want) return;
      Object.keys(want).forEach(function (key) {
        state[pool.from][key] -= want[key];
      });
    });
  }

  // Research is quoted in schematics, molds, bars and alloys, and those live
  // in the same pools a forge cost draws on.
  function researchCost(recipe) {
    var need = recipe.research;
    return { cost: need.materials, bars: need.bars, alloys: need.alloys,
      resources: need.resources, parts: need.parts };
  }

  function missingResearch(state, recipe) {
    return missingFor(state, researchCost(recipe));
  }

  function known(state, recipe) {
    return !recipe.research || state.known.indexOf(recipe.key) >= 0;
  }

  // Pays for a recipe and writes it into the smith's book for good.
  function learn(state, recipe) {
    if (!recipe.research) return { ok: false, reason: "Nothing to work out." };
    if (known(state, recipe)) return { ok: false, reason: "Already worked out." };
    var missing = missingResearch(state, recipe);
    if (missing.length) {
      return { ok: false, reason: "Short " + missing.map(function (gap) {
        return gap.short + " " + gap.label.toLowerCase();
      }).join(", ") + "." };
    }
    spend(state, researchCost(recipe));
    state.known.push(recipe.key);
    return { ok: true, recipe: recipe };
  }

  function unlearned(state) {
    return RECIPES.filter(function (recipe) {
      return recipe.research && !known(state, recipe);
    });
  }

  // The stats a piece came off the anvil with, worked back out of the rolls
  // it carries. Enchants multiply what is there, so this is what removing
  // them has to put back.
  function baseStatsOf(item) {
    var tier = S.tierAt(item.rarity);
    return statsFor(recipeFor(item.recipe), tier.index, item.band, item.edition);
  }

  function forge(state, recipe) {
    if (!unlocked(state, recipe)) {
      return { ok: false, reason: "Reach level " + recipe.level + " first." };
    }
    if (!canForge(state, recipe)) {
      return { ok: false, reason: "Missing materials." };
    }
    spend(state, recipe);

    var rarity = rollStat("rarity", state.base.rarity, state);
    var quality = rollStat("quality", state.base.quality, state);
    var tier = S.tierAt(rarity);
    var band = S.qualityBandAt(quality).name;
    var edition = rollStat("edition", state.base.edition, state);
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
      slots: rollStat("eslots", state.base.eslots, state),
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
    // The Way is worked into the piece as it comes off the anvil, so it keeps
    // the premium even once the artifact comes off the shelf.
    var premium = global.Artifacts.valueMult(state);
    if (premium !== 1) item.value = premium;
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
    stocked: stocked,
    buy: buy,
    STIPEND: STIPEND,
    STIPEND_COOLDOWN: STIPEND_COOLDOWN,
    stipend: stipend,
    stipendWait: stipendWait,
    missingFor: missingFor,
    scaleNeed: scaleNeed,
    mostAffordable: mostAffordable,
    shortText: shortText,
    spend: spend,
    canForge: canForge,
    known: known,
    learn: learn,
    unlearned: unlearned,
    researchCost: researchCost,
    missingResearch: missingResearch,
    sellPrice: sellPrice,
    recipeValue: recipeValue,
    statsFor: statsFor,
    baseStatsOf: baseStatsOf,
    recipeFor: recipeFor,
    QUALITY_MULT: QUALITY_MULT,
    EDITION_MULT: EDITION_MULT,
    sell: sell,
    sellAll: sellAll,
    inventoryValue: inventoryValue,
    luckWindow: luckWindow,
    rollLuck: rollLuck,
    rollStat: rollStat,
    forge: forge
  };
})(window);
