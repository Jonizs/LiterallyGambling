/* Sanding: the four blocks at the polishing bench. Three of them re-roll one
   stat inside a fixed window, the fourth lifts the piece a tier. Every press
   is priced off what it is actually expected to add to the piece, so a block
   is worth pressing - until the price, which climbs with every press of that
   block on that piece, outruns the roll. */
(function (global) {
  "use strict";

  var G = global.Game, S = global.Stats;

  // Each block: the stat it works, the window it rolls in, and how the price
  // of pressing it climbs. The windows all sit above 1 on average, so a press
  // pays over a run - the growth is what turns a cold streak sour.
  var BLOCKS = [
    { key: "metal", name: "Metal block", stat: "damage", label: "Damage",
      low: 0.9, high: 1.15, places: 0 },
    { key: "rubber", name: "Rubber block", stat: "durability",
      label: "Durability", low: 0.85, high: 1.2, places: 0 },
    { key: "radius", name: "Radiused", stat: "critDamage", label: "Crit damage",
      low: 0.8, high: 1.25, places: 0 },
    { key: "foam", name: "Soft foam", tier: true, label: "Tier" }
  ];

  // The cut the bench takes on a first press, and what each press after it on
  // the same piece costs on top. At 1.18 a run of six presses still pays on
  // average and the seventh is where it turns.
  var EDGE = 0.6;
  var GROWTH = 1.18;
  // The tier press is not a gamble, so it is priced to a thin margin instead.
  var FOAM_EDGE = 0.965;

  // How many points across the window are averaged to price a press. The
  // damage and durability windows are straight lines, but the crit premium
  // saturates, so its expected gain has to be sampled rather than read off
  // the middle of the window.
  var SAMPLES = 9;

  function blockFor(key) {
    for (var i = 0; i < BLOCKS.length; i++) {
      if (BLOCKS[i].key === key) return BLOCKS[i];
    }
    return null;
  }

  function copy(item) {
    var out = {};
    Object.keys(item).forEach(function (key) { out[key] = item[key]; });
    out.enchants = item.enchants.slice();
    return out;
  }

  function round(value, places) {
    var factor = Math.pow(10, places);
    return Math.round(value * factor) / factor;
  }

  // How many times this block has been pressed on this piece.
  function pressesOf(item, block) {
    return (item.sanded && item.sanded[block.key]) || 0;
  }

  // The piece as it would stand with one stat multiplied.
  function withStat(item, block, mult) {
    var out = copy(item);
    out[block.stat] = Math.max(block.places ? 0.1 : 1,
      round(out[block.stat] * mult, block.places));
    if (block.stat === "critChance") G.spillCrit(out);

    return out;
  }

  // The tier above the one the piece sits in, or null at the top of the table.
  function nextTier(item) {
    var here = S.tierAt(item.rarity);
    var tiers = S.TIERS;
    for (var i = 0; i < tiers.length; i++) {
      if (tiers[i].index === here.index + 1) return tiers[i];
    }
    return null;
  }

  // The piece as it would stand a tier up: everything the tier scales moves
  // with it, so the enchants and the sanding already on it keep their share.
  function withTier(item) {
    var up = nextTier(item);
    if (!up) return null;
    var here = S.tierAt(item.rarity);
    var out = copy(item);
    var lift = up.index / here.index;
    // A bracket's own edge still reads as the tier below it, so the piece is
    // set just inside the new one.
    out.rarity = S.clamp("rarity", up.min + 1);
    out.tier = up.name;
    out.damage = out.damage ? Math.max(1, Math.round(out.damage * lift)) : 0;
    out.armor = out.armor ? Math.max(1, Math.round(out.armor * lift)) : 0;
    out.durability = Math.max(1, Math.round(out.durability * lift));
    return out;
  }

  // Working out a gain prices the piece nine times over, and the menu asks
  // for every block's gain several times a draw, so the answer is kept until
  // the piece itself changes.
  var cache = {};

  function signOf(item) {
    return [item.id, item.rarity, item.damage, item.armor, item.durability,
      item.attackSpeed, item.critChance, item.critDamage, item.armorPen,
      item.enchants.length].join(":");
  }

  function gainOf(item, block) {
    var key = signOf(item) + "|" + block.key;
    if (!(key in cache)) {
      if (cache.count > 200) cache = {};
      cache[key] = measure(item, block);
      cache.count = (cache.count || 0) + 1;
    }
    return cache[key];
  }

  // What one press is expected to add to what the piece fetches. A block that
  // can only lose is worth nothing, and is priced at nothing.
  function measure(item, block) {
    var now = G.sellPrice(item);
    if (block.tier) {
      var up = withTier(item);
      return up ? Math.max(0, G.sellPrice(up) - now) : 0;
    }
    var total = 0;
    for (var i = 0; i < SAMPLES; i++) {
      var mult = block.low + (block.high - block.low) * (i / (SAMPLES - 1));
      total += G.sellPrice(withStat(item, block, mult)) - now;
    }
    return Math.max(0, total / SAMPLES);
  }

  // What the three gambling blocks are worth on this piece on average. A
  // block far under it has nothing left to give - crit damage on a piece that
  // already crits every swing and past what the market pays for - and is shut
  // rather than sold for pennies.
  var DEAD_SHARE = 0.08;

  function sharedGain(item) {
    var total = 0, count = 0;
    BLOCKS.forEach(function (block) {
      if (block.tier) return;
      total += gainOf(item, block);
      count++;
    });
    return count ? total / count : 0;
  }

  // What the next press costs: the expected gain, discounted so the press
  // pays, then climbed by however many times this block has been used here.
  function costFor(item, block) {
    if (!item) return 0;
    var gain = gainOf(item, block);
    if (gain <= 0) return 0;
    if (block.tier) return Math.max(1, Math.floor(gain * FOAM_EDGE));
    return Math.max(1, Math.round(gain * EDGE *
      Math.pow(GROWTH, pressesOf(item, block))));
  }

  // Why a press cannot be made, or "" when it can.
  function shortFor(state, item, block) {
    if (!item) return "Set a piece on the bench first.";
    if (block.tier && pressesOf(item, block) > 0) {
      return "That piece has already had its foam pass.";
    }
    if (block.tier && !nextTier(item)) return "That piece is already at T20.";
    if (!block.tier && gainOf(item, block) < sharedGain(item) * DEAD_SHARE) {
      return "Nothing left for that block to work on this piece.";
    }
    var cost = costFor(item, block);
    if (!cost) return "Nothing left for that block to work.";
    if (state.silver < cost) {
      return "Not enough silver. That press costs " + cost + ".";
    }
    return "";
  }

  function press(state, item, key) {
    var block = blockFor(key);
    if (!block) return { ok: false, reason: "No such block." };
    var short = shortFor(state, item, block);
    if (short) return { ok: false, reason: short };

    var cost = costFor(item, block);
    var before = G.sellPrice(item);
    state.silver -= cost;
    if (!item.sanded) item.sanded = {};
    item.sanded[block.key] = pressesOf(item, block) + 1;

    if (block.tier) {
      var up = withTier(item);
      item.rarity = up.rarity;
      item.tier = up.tier;
      item.damage = up.damage;
      item.armor = up.armor;
      item.durability = up.durability;
      return { ok: true, block: block, cost: cost, tier: item.tier,
        gain: G.sellPrice(item) - before };
    }

    var mult = block.low + Math.random() * (block.high - block.low);
    var worked = withStat(item, block, mult);
    item[block.stat] = worked[block.stat];
    item.critChance = worked.critChance;
    item.critDamage = worked.critDamage;
    return { ok: true, block: block, cost: cost, mult: round(mult, 3),
      value: item[block.stat], gain: G.sellPrice(item) - before };
  }

  // The window a block rolls in, written out.
  function windowText(block) {
    return block.tier ? "Tier +1"
      : "\u00d7" + block.low + " \u2013 \u00d7" + block.high;
  }

  global.Sand = {
    BLOCKS: BLOCKS,
    windowText: windowText,
    blockFor: blockFor,
    pressesOf: pressesOf,
    nextTier: nextTier,
    costFor: costFor,
    shortFor: shortFor,
    press: press
  };
})(window);
