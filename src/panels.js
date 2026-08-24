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

  // A cost can call on materials, bars, alloys and the yard's own stock, so
  // the chips are built from wherever each part of it lives.
  var COST_POOLS = [
    { on: "cost", from: "materials",
      label: function (key) { return G.MATERIALS[key].label; } },
    { on: "resources", from: "resources",
      label: function (key) { return global.Gather.RESOURCES[key].label; } },
    { on: "bars", from: "bars",
      label: function (key) { return global.Refine.find(key).label + " bar"; } },
    { on: "alloys", from: "alloys",
      label: function (key) { return global.Compound.find(key).name; } },
    { on: "parts", from: "parts",
      label: function (key) { return global.Parts.find(key).name; } }
  ];

  function costLine(state, need) {
    var line = el("div", "cost-line");
    COST_POOLS.forEach(function (pool) {
      var want = need[pool.on];
      if (!want) return;
      Object.keys(want).forEach(function (key) {
        var have = state[pool.from][key];
        line.appendChild(el("span", "cost " + (have >= want[key] ? "ok" : "short"),
          pool.label(key) + " " + have + "/" + want[key]));
      });
    });
    return line;
  }

  // What a tier-1 piece off this recipe carries, in the order a forged piece
  // shows its own stats.
  function recipeStats(recipe) {
    var per = recipe.perTier, combat = recipe.combat;
    var meta = el("span", "item-meta");
    if (per.damage) meta.appendChild(el("span", "chip-stat dmg", per.damage + " dmg"));
    if (per.armor) meta.appendChild(el("span", "chip-stat arm", per.armor + " arm"));
    meta.appendChild(el("span", "chip-stat", per.durability + " dur"));
    meta.appendChild(el("span", "chip-stat spd", combat.speed + " spd"));
    meta.appendChild(el("span", "chip-stat crit", combat.crit + "% crit"));
    meta.appendChild(el("span", "chip-stat crit", combat.critDamage + "% cdmg"));
    if (combat.pen) meta.appendChild(el("span", "chip-stat pen", combat.pen + " pen"));
    return meta;
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
  // The tab lives outside the builder so it survives a panel redraw.
  var forgeTab = "gear";

  var FORGE_TABS = [
    { key: "gear", label: "Gear",
      blurb: "Pick a piece to set on the anvil. The strike itself happens at " +
        "the forge \u2014 every value in the luck window is equally likely." },
    { key: "utility", label: "Utility",
      blurb: "Tools and oddments the forge can turn out." },
    { key: "parts", label: "Parts",
      blurb: "Fittings the better pieces are built from. These are soldered " +
        "rather than hammered \u2014 the iron is held to the work for a few " +
        "seconds and the part comes off finished." }
  ];

  // How many of each craft was last typed into its box, so a redraw of the
  // panel does not wipe what the smith was in the middle of asking for.
  var typed = {};

  // FORGE one, forge a typed count, or forge everything the stock covers.
  // make(qty) puts that many on the anvil.
  function qtyGroup(ctx, key, need, make) {
    var state = ctx.state;
    var most = G.mostAffordable(state, need);
    var group = el("div", "btn-group");

    function add(label, qtyOf, className) {
      var b = button(label, className || "mini-btn strong", function () {
        var qty = qtyOf();
        if (!(qty > 0)) {
          ctx.setNotice("Type how many to forge.");
          ctx.refresh();
          return;
        }
        var short = G.shortText(state, need, qty);
        if (short) {
          ctx.setNotice(short + ".");
          ctx.refresh();
          return;
        }
        make(qty);
      });
      return b;
    }

    var one = add("FORGE", function () { return 1; });
    var shortOne = G.shortText(state, need, 1);
    one.disabled = !!shortOne;
    if (shortOne) one.title = shortOne;
    group.appendChild(one);

    var box = el("input", "qty-input");
    box.type = "number";
    box.min = "1";
    box.value = String(typed[key] || 1);
    box.setAttribute("aria-label", "How many to forge");
    box.addEventListener("input", function () { typed[key] = box.value; });
    // The panel closes on a stray click, and a tooltip opens on one, so the
    // box keeps its own clicks to itself.
    box.addEventListener("click", function (ev) { ev.stopPropagation(); });
    group.appendChild(box);

    var custom = add("MAKE", function () {
      return Math.floor(Number(box.value));
    }, "mini-btn");
    custom.title = "Forge the number in the box.";
    group.appendChild(custom);

    var all = add("ALL", function () { return most; });
    all.disabled = most <= 0;
    all.title = most > 0 ? "Forge " + most + " \u2014 everything the stock covers."
      : "Nothing on hand to forge with.";
    group.appendChild(all);
    return group;
  }

  // Utility crafts go on the anvil like a piece, but take one blow and hand
  // back a count rather than something with stats.
  var UTILITY = [
    { key: "common", name: "Common schematic", utility: true,
      cost: { paper: 10, wood: 5 } },
    { key: "mold", name: "Gear mold", utility: true,
      cost: { paper: 5, metal: 10 } }
  ];

  function utilityTab(ctx, wrap) {
    var state = ctx.state;
    var rows = el("div", "rows");
    UTILITY.forEach(function (craft) {
      var row = el("div", "row");
      var main = el("div", "row-main");
      var title = el("div", "row-title", craft.name);
      title.appendChild(el("span", "chip-stat tier",
        "you hold " + state.resources[craft.key]));
      main.appendChild(title);
      main.appendChild(costLine(state, craft));
      row.appendChild(main);
      row.appendChild(qtyGroup(ctx, "utility-" + craft.key, craft, function (qty) {
        ctx.queue({ utility: true, craft: craft, qty: qty });
      }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  // Parts sit on the anvil like anything else, but the iron finishes them.
  function partsTab(ctx, wrap) {
    var state = ctx.state;
    var rows = el("div", "rows");
    global.Parts.LIST.forEach(function (part) {
      var row = el("div", "row");
      row.appendChild(I.make(part.icon));
      var main = el("div", "row-main");
      var title = el("div", "row-title", part.name);
      title.appendChild(el("span", "chip-stat tier",
        "you hold " + state.parts[part.key]));
      main.appendChild(title);
      main.appendChild(costLine(state, part));
      row.appendChild(main);
      row.appendChild(qtyGroup(ctx, "part-" + part.key, part, function (qty) {
        ctx.queue({ part: part, qty: qty });
      }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  function forgePanel(ctx) {
    var wrap = el("div");

    var strip = el("div", "tabs");
    FORGE_TABS.forEach(function (tab) {
      strip.appendChild(button(tab.label, "tab" + (tab.key === forgeTab ? " on" : ""),
        function () {
          forgeTab = tab.key;
          ctx.setNotice("");
          ctx.refresh();
        }));
    });
    wrap.appendChild(strip);

    var current = FORGE_TABS.filter(function (tab) {
      return tab.key === forgeTab;
    })[0];
    wrap.appendChild(el("p", null, current.blurb));

    if (forgeTab !== "gear") {
      if (forgeTab === "parts") partsTab(ctx, wrap); else utilityTab(ctx, wrap);
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }

    var rows = el("div", "rows");
    G.RECIPES.forEach(function (recipe) {
      var open = G.unlocked(ctx.state, recipe);
      var unread = recipe.research && !G.known(ctx.state, recipe);
      var row = el("div", "row" + (open ? "" : " locked") +
        (unread ? " silhouette" : ""));
      row.appendChild(unread ? I.shadow(recipe.icon) : I.make(recipe.icon));
      var main = el("div", "row-main");
      var title = el("div", "row-title", recipe.name);
      // Undiscovered: the name and the shape, nothing else.
      if (unread) {
        main.appendChild(title);
        main.appendChild(el("div", "muted", "Undiscovered."));
        row.appendChild(main);
        var undone = button("???", "mini-btn strong", function () {});
        undone.disabled = true;
        undone.title = "Discover it at the experimentation bench.";
        row.appendChild(undone);
        rows.appendChild(row);
        return;
      }
      if (recipe.mystery) {
        main.appendChild(title);
        main.appendChild(el("div", "muted", "Undiscovered."));
        row.appendChild(main);
        var locked = button("???", "mini-btn strong", function () {});
        locked.disabled = true;
        locked.title = "The smith has not learned this blade yet.";
        row.appendChild(locked);
        rows.appendChild(row);
        return;
      }
      if (!open) title.appendChild(el("span", "chip-stat lock", "Level " + recipe.level));
      main.appendChild(title);
      main.appendChild(recipeStats(recipe));
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
          return m.short + " " + m.label.toLowerCase();
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
      var open = G.stocked(ctx.state, key);
      var row = el("div", "row" + (open ? "" : " locked"));
      var main = el("div", "row-main");
      var title = el("div", "row-title", mat.label);
      if (!open) title.appendChild(el("span", "chip-stat lock", "Level " + mat.level));
      main.appendChild(title);
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
        b.disabled = !open || ctx.state.silver < G.priceOf(key, qty);
        if (!open) b.title = "The shop stocks this from level " + mat.level + ".";
        group.appendChild(b);
      });
      row.appendChild(group);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);

    // Stock the shop does not carry yet: the same bar as a material, inked out.
    var locked = el("div", "rows silhouettes");
    for (var i = 0; i < 4; i++) {
      var bar = el("div", "row silhouette");
      var barMain = el("div", "row-main");
      barMain.appendChild(el("div", "row-title", "???"));
      barMain.appendChild(el("div", "muted", "??? silver each"));
      bar.appendChild(barMain);
      var barGroup = el("div", "btn-group");
      [1, 10].forEach(function (qty) {
        var b = button("\u00d7" + qty, "mini-btn", function () {});
        b.disabled = true;
        barGroup.appendChild(b);
      });
      bar.appendChild(barGroup);
      bar.title = "The shop does not carry this yet.";
      locked.appendChild(bar);
    }
    wrap.appendChild(locked);

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

      var open = U.unlocked(ctx.state, def);
      var row = el("div", "row" + (open ? "" : " locked"));
      var main = el("div", "row-main");
      var title = el("div", "row-title", def.name);
      title.appendChild(el("span", "chip-stat tier", tier + "/" + max));
      if (!open) title.appendChild(el("span", "chip-stat lock", "lvl " + def.level));
      main.appendChild(title);
      main.appendChild(el("div", "muted", U.describe(def) +
        " \u00b7 built " + (U.built(ctx.state, def) > 0 ? "+" : "") +
        U.built(ctx.state, def)));
      row.appendChild(main);

      var b = button(cost === null ? "FINISHED" : "BUILD " + cost,
        "mini-btn strong", function () { ctx.buyUpgrade(def); });
      b.disabled = !open || cost === null || ctx.state.silver < cost;
      if (open && cost !== null && ctx.state.silver < cost) {
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

    // Dev shortcut: skips the grind so the later rooms can be tested.
    var dev = el("div", "row");
    var devMain = el("div", "row-main");
    devMain.appendChild(el("div", "row-title", "Dev boost"));
    devMain.appendChild(el("div", "muted", "Sets the smith to level 100 with 100,000 silver."));
    dev.appendChild(devMain);
    dev.appendChild(button("BOOST", "mini-btn strong", function () {
      ctx.devBoost();
    }));
    wrap.appendChild(dev);

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
    inventory: { title: "Inventory", build: function (ctx) {
      return global.Inventory.build(ctx);
    } },
    enchant: { title: "Enchant", build: function (ctx) {
      return global.Enchant.build(ctx);
    }, level: 4 },
    upgrades: { title: "Upgrades", build: upgradesPanel },
    display: { title: "Display", build: soonPanel("The display case") },
    resource: { title: "Resource", build: function (ctx) {
      return global.Resource.build(ctx);
    }, level: 2 },
    experimentation: { title: "Experimentation", build: function (ctx) {
      return global.Experiment.build(ctx);
    }, level: 2 },
    awaken: { title: "Awaken", build: soonPanel("Awakening"), level: 12 },
    options: { title: "Options", build: optionsPanel }
  };

  global.Panels = { BUILDERS: BUILDERS, itemLine: itemLine, costLine: costLine,
    recipeStats: recipeStats, el: el, button: button };
})(window);
