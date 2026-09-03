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

  // A press is priced off the best the block could do on this piece: the first
  // one costs a small share of that, and every press after it on the same
  // piece costs a fifth again on top. Six presses come to a shade under nine
  // tenths of the best roll, so a run that far still pays; the seventh puts
  // the run past it and it never pays again - which does not stop anyone
  // pressing it.
  var EDGE = 0.09;
  var GROWTH = 1.2;
  // The tier press is not a gamble, so it is priced to a thin margin instead.
  var FOAM_EDGE = 0.965;

  // Every press of a block on a piece lifts the bottom of its window, so a
  // piece that has been worked a while cannot land as badly as it could on
  // its first press. The window never closes to less than this.
  var LOW_STEP = 0.01;
  var LOW_GAP = 0.02;

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
    return (item && item.sanded && item.sanded[block.key]) || 0;
  }

  // The bottom of a block's window on this piece, lifted by every press
  // already made with it.
  function lowFor(item, block) {
    if (block.tier) return 0;
    var lifted = block.low + LOW_STEP * pressesOf(item, block);
    return Math.min(round(block.high - LOW_GAP, 2), round(lifted, 2));
  }

  // A roll that lands at the very top of the window, read off the two places
  // the bench shows, so what is called a maximum is what is displayed.
  function isMax(block, mult) {
    return mult.toFixed(2) === block.high.toFixed(2);
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

  function pressSign(item) {
    var out = [];
    BLOCKS.forEach(function (block) { out.push(pressesOf(item, block)); });
    return out.join(",");
  }

  function signOf(item) {
    return [item.id, pressSign(item), item.rarity, item.damage, item.armor, item.durability,
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

  // The best a press could do on this piece: what the top of the window is
  // worth over what the piece fetches now. Foam is not a gamble, so its
  // measure is simply the tier it buys.
  function measure(item, block) {
    var now = G.sellPrice(item);
    if (block.tier) {
      var up = withTier(item);
      return up ? Math.max(0, G.sellPrice(up) - now) : 0;
    }
    return Math.max(0, G.sellPrice(withStat(item, block, block.high)) - now);
  }

  // What the next press costs: a share of the best roll on this piece, climbed
  // by however many times this block has already been used here. Nothing is
  // ever shut - a block whose best roll is worth nothing still presses for a
  // single silver.
  function costFor(item, block) {
    if (!item) return 0;
    var gain = gainOf(item, block);
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
    var cost = costFor(item, block);
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
    var low = lowFor(item, block);
    var mult = low + Math.random() * (block.high - low);
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

    // The window is read before the press is counted, so this press rolls on
    // the window the bench was showing.
    var worked = withStat(item, block, mult);
    item[block.stat] = worked[block.stat];
    item.critChance = worked.critChance;
    item.critDamage = worked.critDamage;
    return { ok: true, block: block, cost: cost, mult: round(mult, 3),
      max: isMax(block, mult), value: item[block.stat],
      gain: G.sellPrice(item) - before };
  }

  // The window a block rolls in, written out.
  function windowText(block, item) {
    return block.tier ? "Tier +1"
      : "\u00d7" + lowFor(item, block).toFixed(2) + " \u2013 \u00d7" +
        block.high.toFixed(2);
  }

  global.Sand = {
    BLOCKS: BLOCKS,
    windowText: windowText,
    lowFor: lowFor,
    blockFor: blockFor,
    pressesOf: pressesOf,
    nextTier: nextTier,
    costFor: costFor,
    shortFor: shortFor,
    press: press
  };
})(window);
