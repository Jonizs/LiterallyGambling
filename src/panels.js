/* Panel bodies for the scene overlay: forge, shop and inventory. */
(function (global) {
  "use strict";

  var G = global.Game, S = global.Stats, I = global.Icons,
      E = global.Enchants, U = global.Upgrades;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(label, className, onClick) {
    var b = el("button", className, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  var FIRST_REVEAL = 0.35; // seconds after the panel lands
  var REVEAL_GAP = 0.5;    // between one enchant and the next

  function costLine(state, recipe) {
    var line = el("div", "cost-line");
    Object.keys(recipe.cost).forEach(function (key) {
      var need = recipe.cost[key];
      var have = state.materials[key];
      var chip = el("span", "cost " + (have >= need ? "ok" : "short"),
        G.MATERIALS[key].label + " " + have + "/" + need);
      line.appendChild(chip);
    });
    return line;
  }

  function itemLine(item) {
    var line = el("div", "item-line");
    line.appendChild(I.make(item.icon));
    line.appendChild(el("span", "item-name", item.name));
    var meta = el("span", "item-meta");
    meta.appendChild(el("span", "chip-stat tier", item.tier));
    meta.appendChild(el("span", "chip-stat band-" + item.band.toLowerCase(), item.band));
    if (item.damage) meta.appendChild(el("span", "chip-stat dmg", item.damage + " dmg"));
    if (item.armor) meta.appendChild(el("span", "chip-stat arm", item.armor + " arm"));
    meta.appendChild(el("span", "chip-stat spd", item.attackSpeed + " spd"));
    meta.appendChild(el("span", "chip-stat crit", item.critChance + "% crit"));
    meta.appendChild(el("span", "chip-stat crit", item.critDamage + "% cdmg"));
    if (item.armorPen) meta.appendChild(el("span", "chip-stat pen", item.armorPen + " pen"));
    meta.appendChild(el("span", "chip-stat", item.durability + " dur"));
    meta.appendChild(el("span", "chip-stat",
      item.enchants.length + "/" + item.slots + " slot" + (item.slots === 1 ? "" : "s")));
    meta.appendChild(el("span", "chip-stat", item.editionName));
    item.enchants.forEach(function (entry) {
      meta.appendChild(el("span", "chip-stat ench " + entry.rarity, E.label(entry)));
    });
    line.appendChild(meta);
    return line;
  }

  // --- forge ---------------------------------------------------------------
  function forgePanel(ctx) {
    var wrap = el("div");
    wrap.appendChild(el("p", null,
      "Pick a piece to set on the anvil. The strike itself happens at the " +
      "forge \u2014 every value in the luck window is equally likely."));

    var rows = el("div", "rows");
    G.RECIPES.forEach(function (recipe) {
      var open = G.unlocked(ctx.state, recipe);
      var row = el("div", "row" + (open ? "" : " locked"));
      row.appendChild(I.make(recipe.icon));
      var main = el("div", "row-main");
      var title = el("div", "row-title", recipe.name);
      title.appendChild(el("span", "muted",
        recipe.kind === "weapon" ? "  damage" : "  armor"));
      if (!open) title.appendChild(el("span", "chip-stat lock", "Level " + recipe.level));
      main.appendChild(title);
      main.appendChild(costLine(ctx.state, recipe));
      row.appendChild(main);

      var ready = G.canForge(ctx.state, recipe);
      var b = button(open ? "FORGE" : "LOCKED", "mini-btn strong", function () {
        ctx.queue(recipe);
      });
      b.disabled = !ready;
      if (!open) {
        b.title = "Unlocks at smith level " + recipe.level + ".";
      } else if (!ready) {
        var missing = G.missingFor(ctx.state, recipe).map(function (m) {
          return m.short + " " + G.MATERIALS[m.key].label.toLowerCase();
        });
        b.title = "Short " + missing.join(", ");
      }
      row.appendChild(b);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);

    return wrap;
  }

  // --- shop ----------------------------------------------------------------
  function shopPanel(ctx) {
    var wrap = el("div");
    wrap.appendChild(el("p", null, "Materials for the forge. Prices are per unit."));

    var rows = el("div", "rows");
    Object.keys(G.MATERIALS).forEach(function (key) {
      var mat = G.MATERIALS[key];
      var row = el("div", "row");
      var main = el("div", "row-main");
      main.appendChild(el("div", "row-title", mat.label));
      main.appendChild(el("div", "muted",
        mat.price + " silver each · you hold " + ctx.state.materials[key]));
      row.appendChild(main);

      var group = el("div", "btn-group");
      [1, 10].forEach(function (qty) {
        var b = button("×" + qty, "mini-btn", function () {
          var result = G.buy(ctx.state, key, qty);
          ctx.setNotice(result.ok
            ? "Bought " + qty + " " + mat.label.toLowerCase() + " for " + result.spent + " silver."
            : result.reason);
          ctx.refresh();
        });
        b.disabled = ctx.state.silver < G.priceOf(key, qty);
        group.appendChild(b);
      });
      row.appendChild(group);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);

    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  // --- inventory -----------------------------------------------------------
  function inventoryPanel(ctx) {
    var wrap = el("div");
    var items = ctx.state.inventory;
    if (!items.length) {
      wrap.appendChild(el("p", "empty",
        "Nothing forged yet. Buy materials in the shop, then strike."));
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }
    var head = el("div", "row head-row");
    head.appendChild(el("div", "row-title",
      items.length + " piece" + (items.length === 1 ? "" : "s") + " forged \u00b7 " +
      G.inventoryValue(ctx.state) + " silver on the rack"));
    head.appendChild(button("SELL ALL", "mini-btn strong", function () {
      var result = G.sellAll(ctx.state);
      ctx.setNotice(result.ok
        ? "Sold " + result.count + " piece" + (result.count === 1 ? "" : "s") +
          " for " + result.total + " silver."
        : result.reason);
      ctx.refresh();
    }));
    wrap.appendChild(head);
    var rows = el("div", "rows");
    items.forEach(function (item) {
      var row = el("div", "row");
      row.appendChild(itemLine(item));
      var price = G.sellPrice(item);
      row.appendChild(button("SELL " + price, "mini-btn", function () {
        var result = G.sell(ctx.state, item.id);
        ctx.setNotice(result.ok
          ? "Sold " + result.item.name + " for " + result.price + " silver."
          : result.reason);
        ctx.refresh();
      }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  // Two states: pick a piece, or pick one of the three the ritual turned up.
  function enchantPanel(ctx) {
    var wrap = el("div");

    if (ctx.offer) {
      wrap.appendChild(el("p", null,
        "Three came out of the coals for " + ctx.offer.item.name +
        ". One of them goes on the piece."));
      // The panel lands first with three empty slots waiting in it; each one
      // strikes in whole, one at a time.
      var choices = el("div", "rows");
      ctx.offer.choices.forEach(function (choice, i) {
        var fresh = ctx.offer.fresh;
        var at = FIRST_REVEAL + i * REVEAL_GAP;
        var row = el("div", "row offer " + choice.rarity +
          (fresh ? " offer-reveal" : ""));
        if (fresh) row.style.setProperty("--d", at + "s");

        var main = el("div", "row-main offer-body");
        var title = el("div", "row-title", E.label(choice));
        title.appendChild(el("span", "chip-stat rarity-" + choice.rarity, choice.rarity));
        main.appendChild(title);
        main.appendChild(el("div", "muted", choice.text));
        row.appendChild(main);

        var take = button("TAKE", "mini-btn strong offer-body", function () {
          ctx.takeEnchant(choice);
        });
        // Nothing is takeable before it has been shown.
        if (fresh) {
          take.disabled = true;
          setTimeout(function () { take.disabled = false; }, (at + 0.3) * 1000);
        }
        row.appendChild(take);
        choices.appendChild(row);
      });
      wrap.appendChild(choices);
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }

    var items = ctx.state.inventory;
    if (!items.length) {
      wrap.appendChild(el("p", "empty", "Nothing on the rack to enchant yet."));
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }
    wrap.appendChild(el("p", null,
      "Rolling three enchants for a piece costs half what it sells for. " +
      "Each one takes an enchant slot."));

    var rows = el("div", "rows");
    items.forEach(function (item) {
      var row = el("div", "row");
      row.appendChild(itemLine(item));
      var cost = E.costFor(item);
      var free = E.slotsLeft(item);
      var b = button(free > 0 ? "ENCHANT " + cost : "NO SLOTS", "mini-btn",
        function () { ctx.rollEnchant(item); });
      b.disabled = !E.canEnchant(ctx.state, item);
      if (free <= 0) {
        b.title = "Every slot on this piece is filled.";
      } else if (ctx.state.silver < cost) {
        b.title = "Short " + (cost - ctx.state.silver) + " silver.";
      }
      row.appendChild(b);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  function upgradesPanel(ctx) {
    var wrap = el("div");
    wrap.appendChild(el("p", null,
      "Work on the forge itself. Every tier lifts the stats each strike " +
      "rolls around, for good."));

    var rows = el("div", "rows");
    U.UPGRADES.forEach(function (def) {
      var tier = U.tierOf(ctx.state, def);
      var max = U.maxTier(def);
      var cost = U.nextCost(ctx.state, def);

      var row = el("div", "row");
      var main = el("div", "row-main");
      var title = el("div", "row-title", def.name);
      title.appendChild(el("span", "chip-stat tier", tier + "/" + max));
      main.appendChild(title);
      main.appendChild(el("div", "muted", U.describe(def) +
        " \u00b7 built " + (U.built(ctx.state, def) > 0 ? "+" : "") +
        U.built(ctx.state, def)));
      row.appendChild(main);

      var b = button(cost === null ? "FINISHED" : "BUILD " + cost,
        "mini-btn strong", function () { ctx.buyUpgrade(def); });
      b.disabled = cost === null || ctx.state.silver < cost;
      if (cost !== null && ctx.state.silver < cost) {
        b.title = "Short " + (cost - ctx.state.silver) + " silver.";
      }
      row.appendChild(b);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  function soonPanel(what) {
    return function () {
      var wrap = el("div");
      wrap.appendChild(el("p", "empty", what + " is not built yet."));
      return wrap;
    };
  }

  // Wiping is a two-tap button: the first arms it, the second does it, so a
  // stray tap in the options never costs a run.
  function optionsPanel(ctx) {
    var wrap = el("div");
    var list = el("ul");
    ["Sound: on", "Pixel scaling: nearest", "Screen shake: on"].forEach(function (t) {
      list.appendChild(el("li", null, t));
    });
    wrap.appendChild(list);

    var info = ctx.saveInfo();
    wrap.appendChild(el("p", "muted", info.text));
    if (!info.supported) return wrap;

    var armed = false;
    var row = el("div", "row");
    var main = el("div", "row-main");
    main.appendChild(el("div", "row-title", "Wipe save"));
    main.appendChild(el("div", "muted",
      "Starts a new smith: silver, materials, level and every piece go."));
    row.appendChild(main);

    var group = el("div", "btn-group");
    var wipe = button("WIPE", "mini-btn", function () {
      if (!armed) {
        armed = true;
        wipe.textContent = "SURE?";
        wipe.classList.add("strong");
        return;
      }
      ctx.wipeSave();
    });
    group.appendChild(wipe);
    row.appendChild(group);
    wrap.appendChild(row);
    return wrap;
  }

  var BUILDERS = {
    forge: { title: "Forge", build: forgePanel },
    shop: { title: "Shop", build: shopPanel },
    inventory: { title: "Inventory", build: inventoryPanel },
    enchant: { title: "Enchant", build: enchantPanel },
    upgrades: { title: "Upgrades", build: upgradesPanel },
    display: { title: "Display", build: soonPanel("The display case") },
    awaken: { title: "Awaken", build: soonPanel("Awakening") },
    options: { title: "Options", build: optionsPanel }
  };

  global.Panels = { BUILDERS: BUILDERS, itemLine: itemLine, el: el };
})(window);
