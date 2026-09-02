/* Panel bodies for the scene overlay: forge, orders and inventory. */
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
      blurb: "Fittings the better pieces are built from. They go on the anvil " +
        "like a piece, but the iron finishes them \u2014 it is held to the work " +
        "for a few seconds and the part comes off done." }
  ];

  // How many of each craft was last typed into its box, so a redraw of the
  // panel does not wipe what the smith was in the middle of asking for.
  var typed = {};

  // Type a count, press the button, get that many. ALL takes everything the
  // stock covers. shortFor(qty) gives the reason that many cannot be made, or
  // "" when it can; run(qty) does the work.
  function batchGroup(ctx, key, label, most, shortFor, run) {
    var group = el("div", "btn-group");

    var box = el("input", "qty-input");
    box.type = "number";
    box.min = "1";
    box.value = String(typed[key] || 1);
    box.setAttribute("aria-label", "How many");
    box.addEventListener("input", function () { typed[key] = box.value; });
    // The panel closes on a stray click, and a tooltip opens on one, so the
    // box keeps its own clicks to itself.
    box.addEventListener("click", function (ev) { ev.stopPropagation(); });
    group.appendChild(box);

    function fire(qty) {
      if (!(qty > 0)) {
        ctx.setNotice("Type how many first.");
        ctx.refresh();
        return;
      }
      var short = shortFor(qty);
      if (short) {
        ctx.setNotice(short + ".");
        ctx.refresh();
        return;
      }
      run(qty);
    }

    var go = button(label, "mini-btn strong", function () {
      fire(Math.floor(Number(box.value)));
    });
    go.title = "Take the number in the box.";
    group.appendChild(go);

    var all = button("ALL", "mini-btn strong", function () { fire(most); });
    all.disabled = most <= 0 || !!shortFor(most);
    all.title = most > 0 ? "Everything the stock covers \u2014 " + most + "."
      : "Nothing on hand.";
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
      row.appendChild(batchGroup(ctx, "utility-" + craft.key, "FORGE",
        G.mostAffordable(state, craft),
        function (qty) { return G.shortText(state, craft, qty); },
        function (qty) { ctx.queue({ utility: true, craft: craft, qty: qty }); }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  // Parts sit on the anvil like anything else, but the iron finishes them,
  // so the forge keeps the list rather than the experimentation bench.
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
      row.appendChild(batchGroup(ctx, "part-" + part.key, "FORGE",
        G.mostAffordable(state, part),
        function (qty) { return G.shortText(state, part, qty); },
        function (qty) { ctx.queue({ part: part, qty: qty }); }));
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

    if (forgeTab === "utility" || forgeTab === "parts") {
      if (forgeTab === "parts") partsTab(ctx, wrap);
      else utilityTab(ctx, wrap);
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

  // --- orders ---------------------------------------------------------------
  // The order board carries two jobs, so it wears the forge's own tab strip
  // rather than sliding a choice out of the desk.
  var ordersTab = "shop";

  var ORDER_TABS = [
    { key: "shop", label: "Shop",
      blurb: "Materials for the forge. Prices are per unit." },
    { key: "upgrades", label: "Upgrades",
      blurb: "Work on the forge itself. Every tier lifts the stats each " +
        "strike rolls around, for good." }
  ];

  function ordersPanel(ctx) {
    var wrap = el("div");

    var strip = el("div", "tabs");
    ORDER_TABS.forEach(function (tab) {
      strip.appendChild(button(tab.label, "tab" + (tab.key === ordersTab ? " on" : ""),
        function () {
          ordersTab = tab.key;
          ctx.setNotice("");
          ctx.refresh();
        }));
    });
    wrap.appendChild(strip);

    var current = ORDER_TABS.filter(function (tab) {
      return tab.key === ordersTab;
    })[0];
    wrap.appendChild(el("p", null, current.blurb));

    if (ordersTab === "upgrades") upgradesTab(ctx, wrap);
    else shopTab(ctx, wrap);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  function shopTab(ctx, wrap) {
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
  }

  function upgradesTab(ctx, wrap) {
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
        " \u00b7 built " + U.builtText(ctx.state, def)));
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
  }

  // The lab has no menu of its own any more: each machine in the room opens
  // its own, and the work table is where every experiment is run.
  function experimentPanel(ctx) {
    return global.Experiment.build(ctx);
  }

  // --- polish ---------------------------------------------------------------
  // One box split two ways rather than tabs, filling the whole menu: sanding
  // runs the full height down the left and modification takes the rest.
  var POLISH_PARTS = [
    { key: "sanding", label: "Sanding" },
    { key: "modification", label: "Modification" }
  ];

  // Which piece is on the bench, and whether the menu has faded over to the
  // screen that picks one.
  var polishPiece = null;
  var polishPicking = false;

  function heldPiece(ctx) {
    var found = null;
    ctx.state.inventory.forEach(function (item) {
      if (item.id === polishPiece) found = item;
    });
    if (!found) polishPiece = null;
    return found;
  }

  // The screen the SELECT WEAPON box fades over to: every piece in hand, one
  // to a row, and a way back out without picking.
  function polishPicker(ctx) {
    var wrap = el("div", "picker fade-in");
    var head = el("div", "picker-head");
    head.appendChild(el("div", "split-title", "Select weapon"));
    head.appendChild(button("BACK", "mini-btn", function () {
      polishPicking = false;
      ctx.refresh();
    }));
    wrap.appendChild(head);

    if (!ctx.state.inventory.length) {
      wrap.appendChild(el("p", "empty", "Nothing in the inventory to work."));
      return wrap;
    }
    var rows = el("div", "rows");
    ctx.state.inventory.forEach(function (item) {
      var row = el("div", "row" + (item.id === polishPiece ? " picked" : ""));
      row.appendChild(itemLine(item));
      row.appendChild(button(item.id === polishPiece ? "ON BENCH" : "PICK",
        "mini-btn strong", function () {
          polishPiece = item.id;
          polishPicking = false;
          ctx.refresh();
        }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    return wrap;
  }

  // On the bench only what the piece is, not its combat numbers; the picker
  // itself still lists everything.
  function pieceLine(item) {
    var line = el("div", "item-line");
    line.appendChild(I.make(item.icon));
    line.appendChild(el("span", "item-name", item.name));
    var meta = el("span", "item-meta");
    meta.appendChild(el("span", "chip-stat tier", item.tier));
    meta.appendChild(el("span", "chip-stat band-" + item.band.toLowerCase(),
      item.band));
    meta.appendChild(el("span", "chip-stat", item.editionName));
    meta.appendChild(el("span", "chip-stat",
      item.enchants.length + "/" + item.slots + " slot" +
      (item.slots === 1 ? "" : "s")));
    line.appendChild(meta);
    return line;
  }

  // Where each callout hangs off the piece. Every weapon is painted on the
  // same 32 x 48 half-unit tile, so a part's spot is that tile read as
  // percentages, worked out from the art in icons.js. Each piece gets its own
  // list, since a lance and a kunai are not put together like a sword.
  var ANATOMY = {
    sword: [
      { label: "Point", x: 50, y: 19, side: 1, rise: -9, trim: 1.5 },
      { label: "Fuller", x: 47, y: 31, side: -1 },
      { label: "Centre ridge", x: 53, y: 44, side: 1 },
      { label: "Ricasso", x: 41, y: 55, side: -1 },
      { label: "Chappe", x: 60, y: 63, side: 1 },
      { label: "Handle", x: 44, y: 72, side: -1 },
      { label: "Pommel", x: 50, y: 81, side: 1, rise: 8, trim: 1.5 }
    ],
    anduril: [
      { label: "Point", x: 50, y: 4, side: 1, rise: -2, trim: 1.5 },
      { label: "Rune fuller", x: 45, y: 25, side: -1 },
      { label: "Gilt edge", x: 59, y: 54, side: 1 },
      { label: "Crossguard", x: 34, y: 81, side: -1 },
      { label: "Grip", x: 57, y: 90, side: 1 },
      { label: "Pommel", x: 50, y: 97, side: -1, trim: 1.5 }
    ],
    dagger: [
      { label: "Point", x: 50, y: 21, side: 1, rise: -9, trim: 1.5 },
      { label: "Fuller", x: 47, y: 33, side: -1 },
      { label: "Edge", x: 58, y: 46, side: 1 },
      { label: "Guard", x: 34, y: 58, side: -1 },
      { label: "Grip", x: 57, y: 69, side: 1 },
      { label: "Pommel", x: 50, y: 80, side: -1, rise: 8, trim: 1.5 }
    ],
    lance: [
      { label: "Head", x: 50, y: 19, side: 1, rise: -9, trim: 1.5 },
      { label: "Blade", x: 40, y: 33, side: -1 },
      { label: "Socket", x: 59, y: 42, side: 1 },
      { label: "Vamplate", x: 36, y: 48, side: -1 },
      { label: "Shaft", x: 58, y: 60, side: 1 },
      { label: "Binding", x: 42, y: 70, side: -1 },
      { label: "Butt", x: 50, y: 81, side: 1, rise: 8, trim: 1.5 }
    ],
    bloodbane: [
      { label: "Point", x: 50, y: 17, side: 1, rise: -9, trim: 1.5 },
      { label: "Fuller", x: 45, y: 29, side: -1 },
      { label: "Flat", x: 58, y: 46, side: 1 },
      { label: "Crossguard", x: 34, y: 62, side: -1 },
      { label: "Grip", x: 57, y: 73, side: 1 },
      { label: "Blood stone", x: 50, y: 82, side: -1, rise: 8, trim: 1.5 }
    ],
    zeus: [
      { label: "Point", x: 50, y: 9, side: 1, rise: -4, trim: 1.5 },
      { label: "Pale edge", x: 43, y: 27, side: -1 },
      { label: "Deep edge", x: 57, y: 45, side: 1 },
      { label: "Collar", x: 43, y: 68, side: -1 },
      { label: "Guard", x: 66, y: 76, side: 1 },
      { label: "Grip", x: 44, y: 84, side: -1 },
      { label: "Pommel", x: 50, y: 93, side: 1, trim: 1.5 }
    ],
    crackbolt: [
      { label: "Point", x: 50, y: 8, side: 1, rise: -4, trim: 1.5 },
      { label: "Edge", x: 40, y: 26, side: -1 },
      { label: "Belly", x: 63, y: 41, side: 1 },
      { label: "Back", x: 40, y: 53, side: -1 },
      { label: "Collar", x: 59, y: 61, side: 1 },
      { label: "Grip", x: 43, y: 69, side: -1 },
      { label: "Ring", x: 50, y: 83, side: 1, rise: 8, trim: 1.5 }
    ]
  };

  // Anything without a list of its own - an unknown blade, a silhouette - is
  // called out like the sword it is shaped after.
  function partsOf(item) {
    return ANATOMY[item.icon] || ANATOMY.sword;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  // The diagram is a fixed 3:2 board so everything can be placed in one set
  // of coordinates: the piece stands in the middle 39% of it, 6% clear top
  // and bottom, and the callouts run out to the columns either side.
  var BOARD = { left: 30.4, span: 39.2, top: 6, height: 88, out: 22 };

  function atX(part) { return BOARD.left + part.x * BOARD.span / 100; }
  function atY(part) { return BOARD.top + part.y * BOARD.height / 100; }

  // The piece in the middle of the bench, with a line drawn off every part
  // of it that can be worked.
  function anatomy(item) {
    var parts = partsOf(item);
    var wrap = el("div", "anatomy");
    // The board sits in a stage of its own so it can be sized against that
    // rather than scaled, which would soften every line and letter on it.
    var stage = el("div", "anatomy-stage");
    var board = el("div", "anatomy-board");

    var frame = el("div", "anatomy-frame");
    frame.appendChild(I.make(item.icon, "icon anatomy-icon"));
    board.appendChild(frame);

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "anatomy-lines");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    // rise lifts the run of a callout off its anchor, so that first step is
    // a slope rather than a step sideways. The board is 3:2, so a rise of
    // one and a half units to one across reads as 45 degrees on screen.
    // trim pulls the far end of a line back a touch.
    parts.forEach(function (part) {
      var x = atX(part), y = atY(part);
      var run = y + (part.rise || 0);
      var end = part.side > 0
        ? 100 - BOARD.out - (part.trim || 0)
        : BOARD.out + (part.trim || 0);
      var line = document.createElementNS(SVG_NS, "polyline");
      line.setAttribute("points",
        x + "," + y + " " + (x + part.side * 6) + "," + run + " " +
        end + "," + run);
      svg.appendChild(line);
    });
    board.appendChild(svg);

    // The names are laid over the board rather than drawn into the picture,
    // so they keep the menu's own lettering.
    parts.forEach(function (part) {
      var tag = el("div", "anatomy-tag " + (part.side > 0 ? "right" : "left"),
        part.label);
      var trim = part.trim || 0;
      tag.style.top = (atY(part) + (part.rise || 0)) + "%";
      if (part.side > 0) tag.style.left = (100 - BOARD.out - trim + 1) + "%";
      else tag.style.right = (100 - BOARD.out - trim + 1) + "%";
      board.appendChild(tag);
    });

    stage.appendChild(board);
    wrap.appendChild(stage);
    wrap.appendChild(anatomyStats(item));
    return wrap;
  }

  // The piece's own numbers, spelled out under the diagram: two rows of
  // plates across the frame, with what it carries beneath them.
  function anatomyStats(item) {
    var stats = el("div", "anatomy-stats");

    // Paired down the columns, so crit damage sits under crit chance.
    var grid = el("div", "anatomy-grid");
    [
      ["Damage", item.damage, "dmg"],
      ["Armour", item.armor, "arm"],
      ["Attack speed", item.attackSpeed, "spd"],
      ["Crit chance", item.critChance + "%", "crit"],
      ["Crit damage", item.critDamage + "%", "crit"],
      ["Armour pen", item.armorPen, "pen"],
      ["Durability", item.durability, "dur"]
    ].forEach(function (row) {
      if (row[1] === undefined || row[1] === null || row[1] === 0) return;
      var plate = el("div", "anatomy-stat " + row[2]);
      plate.appendChild(el("span", "anatomy-stat-name", row[0]));
      plate.appendChild(el("span", "anatomy-stat-value", String(row[1])));
      grid.appendChild(plate);
    });
    stats.appendChild(grid);

    // The board always holds six boxes: what is set, what is still open on
    // this piece, and the rest locked off.
    var slots = el("div", "anatomy-slots");
    var list = el("div", "anatomy-ench-list");
    for (var i = 0; i < 6; i++) {
      var entry = item.enchants[i];
      if (entry) {
        var card = el("div", "anatomy-ench " + entry.rarity);
        card.appendChild(el("span", "anatomy-ench-name", E.label(entry)));
        // One stat a line, so a two-stat enchant still reads in the box.
        if (entry.text) {
          entry.text.split(", ").forEach(function (bit) {
            card.appendChild(el("span", "anatomy-ench-text", bit));
          });
        }
        list.appendChild(card);
      } else if (i < item.slots) {
        list.appendChild(el("div", "anatomy-ench open", "Empty"));
      } else {
        list.appendChild(el("div", "anatomy-ench locked", "Locked"));
      }
    }
    slots.appendChild(list);
    stats.appendChild(slots);

    return stats;
  }

  function polishPanel(ctx) {
    if (polishPicking) return polishPicker(ctx);
    var wrap = el("div", "split fade-in");
    POLISH_PARTS.forEach(function (part) {
      var pane = el("div", "split-pane " + part.key);
      // The station's name sits inside its own box, over the work.
      var box = el("div", "split-work");
      box.appendChild(el("div", "split-title", part.label));
      var fill = el("div", "split-fill");
      // With a piece on the bench, modification lays it out part by part.
      if (part.key === "modification" && heldPiece(ctx)) {
        fill.appendChild(anatomy(heldPiece(ctx)));
      }
      box.appendChild(fill);
      pane.appendChild(box);
      wrap.appendChild(pane);
    });
    // The strip of the left column sanding leaves free: the box that picks
    // what is being worked on.
    var held = heldPiece(ctx);
    var spare = el("div", "split-pane spare");
    var pickBox = el("button", "split-work pick-box" + (held ? " filled" : ""));
    pickBox.type = "button";
    // Empty it says what it is for; filled it shows the piece itself, its
    // icon, its name and everything it carries.
    if (held) pickBox.appendChild(pieceLine(held));
    else pickBox.appendChild(el("span", null, "Select weapon"));
    pickBox.addEventListener("click", function () {
      polishPicking = true;
      ctx.refresh();
    });
    spare.appendChild(pickBox);
    wrap.appendChild(spare);
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

    var zeus = el("div", "row");
    var zeusMain = el("div", "row-main");
    zeusMain.appendChild(el("div", "row-title", "Dev zeus"));
    zeusMain.appendChild(el("div", "muted",
      "Drops a Zeus' Wrath carrying the six longest-named enchants."));
    zeus.appendChild(zeusMain);
    zeus.appendChild(button("DROP", "mini-btn strong", function () {
      ctx.devZeus();
    }));
    wrap.appendChild(zeus);

    var unlock = el("div", "row");
    var unlockMain = el("div", "row-main");
    unlockMain.appendChild(el("div", "row-title", "Dev unlock"));
    unlockMain.appendChild(el("div", "muted", "Works out every recipe in the book."));
    unlock.appendChild(unlockMain);
    unlock.appendChild(button("UNLOCK", "mini-btn strong", function () {
      ctx.devUnlockAll();
    }));
    wrap.appendChild(unlock);

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
    orders: { title: "Orders", build: ordersPanel },
    inventory: { title: "Inventory", build: function (ctx) {
      return global.Inventory.build(ctx);
    } },
    enchant: { title: "Enchant", build: function (ctx) {
      return global.Enchant.build(ctx);
    }, level: 4 },
    revitalize: { title: "Revitalize", build: function (ctx) {
      return global.Enchant.revitalise(ctx);
    }, level: 4 },
    // The lab's own entry is what gates the room; its machines are the menus.
    lab: { title: "Resource & Experiment", build: experimentPanel, level: 2 },
    gather: { title: "Gather", build: function (ctx) {
      return global.Resource.gather(ctx);
    }, level: 2 },
    refine: { title: "Refine", build: function (ctx) {
      return global.Resource.refine(ctx);
    }, level: 2 },
    compound: { title: "Compound", build: function (ctx) {
      return global.Resource.compound(ctx);
    }, level: 2 },
    experiment: { title: "Experiment", build: experimentPanel, level: 2 },
    polish: { title: "Polish", build: polishPanel, level: 8 },
    awaken: { title: "Awaken", build: soonPanel("Awakening"), level: 12 },
    options: { title: "Options", build: optionsPanel }
  };

  global.Panels = { BUILDERS: BUILDERS, itemLine: itemLine, costLine: costLine,
    recipeStats: recipeStats, batchGroup: batchGroup,
    el: el, button: button };
})(window);
