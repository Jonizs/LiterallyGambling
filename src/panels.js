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
    // What the piece fetches, so the bench can be read against what a press
    // costs without leaving the menu.
    meta.appendChild(el("span", "chip-stat price",
      G.sellPrice(item) + " silver"));
    line.appendChild(meta);
    return line;
  }

  // Where each callout hangs off the piece. Every weapon is painted on the
  // same 32 x 48 half-unit tile, so a part's spot is that tile read as
  // percentages, worked out from the art in icons.js. Each piece gets its own
  // list, since a lance and a kunai are not put together like a sword.
  var ANATOMY = {
    // The weak sword is a plain bar of steel: there is nothing on it to work,
    // so it can be sanded but not modified.
    sword: [],
    anduril: [
      { label: "Point", x: 50, y: 4, side: 1, rise: -2, trim: 1.5 },
      { label: "Fuller", x: 45, y: 22, side: -1 },
      // The cutting edge itself: the far left column of the blade.
      { label: "True edge", x: 38, y: 46, side: -1 },
      { label: "Central ridge", x: 55, y: 45, side: 1 },
      { label: "Ricasso", x: 41, y: 72, side: -1 },
      { label: "Chappe", x: 60, y: 82, side: 1, rise: -5, trim: 1.5 },
      { label: "Handle", x: 44, y: 91, side: -1, rise: 5, trim: 1.5 },
      { label: "Pommel", x: 50, y: 97, side: 1, rise: 6, trim: 1.5 }
    ],
    dagger: [
      { label: "Blade", x: 47, y: 42, side: -1 },
      { label: "Chappe", x: 62, y: 59, side: 1 },
      { label: "Handle", x: 44, y: 69, side: -1 },
      { label: "Pommel", x: 50, y: 79, side: 1, rise: 8, trim: 1.5 }
    ],
    lance: [
      { label: "Blade", x: 45, y: 30, side: -1 },
      { label: "Chappe", x: 58, y: 47, side: 1 },
      { label: "Handle", x: 42, y: 68, side: -1 }
    ],
    bloodbane: [
      { label: "Point", x: 50, y: 17, side: 1, rise: -9, trim: 1.5 },
      { label: "Central ridge", x: 45, y: 43, side: -1 },
      { label: "Chappe", x: 60, y: 63, side: 1 },
      { label: "Handle", x: 44, y: 73, side: -1 },
      { label: "Pommel", x: 50, y: 82, side: 1, rise: 8, trim: 1.5 }
    ],
    zeus: [
      { label: "Point", x: 50, y: 9, side: 1, rise: -4, trim: 1.5 },
      { label: "Fuller", x: 44, y: 27, side: -1 },
      { label: "Central ridge", x: 56, y: 45, side: 1 },
      { label: "Ricasso", x: 43, y: 65, side: -1, rise: -9, trim: 1.5 },
      { label: "Chappe", x: 66, y: 74, side: 1 },
      { label: "Handle", x: 44, y: 84, side: -1 },
      { label: "Pommel", x: 50, y: 93, side: 1, rise: 8, trim: 1.5 }
    ],
    // The kunai carries its own names: the koba down the edge, the muna along
    // the back, and the ring at the butt.
    crackbolt: [
      { label: "Point", x: 50, y: 8, side: 1, rise: -4, trim: 1.5 },
      { label: "Koba", x: 42, y: 26, side: -1 },
      { label: "Muna", x: 60, y: 41, side: 1, rise: -9, trim: 1.5 },
      { label: "Ricasso", x: 43, y: 54, side: -1 },
      { label: "Chappe", x: 59, y: 61, side: 1 },
      { label: "Handle", x: 43, y: 69, side: -1, rise: 9, trim: 1.5 },
      { label: "Ring", x: 50, y: 83, side: 1, rise: 8, trim: 1.5 }
    ]
  };

  // What a piece with no list of its own is called out like.
  var DEFAULT_PARTS = [
    { label: "Point", x: 50, y: 19, side: 1, rise: -9, trim: 1.5 },
    { label: "Fuller", x: 47, y: 31, side: -1 },
    { label: "Central ridge", x: 53, y: 44, side: 1 },
    { label: "Ricasso", x: 41, y: 55, side: -1 },
    { label: "Chappe", x: 60, y: 63, side: 1 },
    { label: "Handle", x: 44, y: 72, side: -1 },
    { label: "Pommel", x: 50, y: 81, side: 1, rise: 8, trim: 1.5 }
  ];

  // Anything without a list of its own - an unknown blade, a silhouette - is
  // called out like the sword it is shaped after.
  function partsOf(item) {
    return ANATOMY[item.icon] || DEFAULT_PARTS;
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
    if (!parts.length) {
      wrap.appendChild(el("div", "anatomy-plain", "Nothing on this piece to modify."));
    }
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

  // What the modification pane holds: the piece laid out part by part, or a
  // line telling the player to put one on the bench.
  function modFill(fill, held) {
    fill.innerHTML = "";
    fill.appendChild(held ? anatomy(held)
      : el("div", "empty mod-empty", "Select a weapon"));
  }

  // The modification pane's contents, so a press can redraw the piece's
  // numbers without the whole menu blinking.
  var sandFill = null;
  var sandPick = null;

  // What each block last rolled is kept on the piece itself, so closing the
  // menu or swapping pieces and coming back still shows what it landed on.
  function sandShown(item, block) {
    return item && item.rolls ? item.rolls[block.key] : null;
  }

  // The block's line: plain text for the window it rolls in, and the roll
  // itself struck large once it has been pressed.
  function sandLine(item, block, roll) {
    if (!roll) {
      if (block.tier) return el("span", "sand-roll", "Tier +1");
      return el("span", "sand-roll", block.label + " \u00d7" +
        global.Sand.lowFor(item, block).toFixed(2) + " \u2013 \u00d7" +
        block.high.toFixed(2));
    }
    return el("span", "sand-roll rolled " +
      (roll.gold ? "gold" : roll.up ? "up" : "down"), roll.text);
  }

  // A roll at the top of the window throws pixels out of the box it landed
  // in. They clear themselves up once they have fallen.
  function burst(box) {
    for (var i = 0; i < 34; i++) {
      var bit = el("span", "sand-spark");
      bit.style.left = (15 + Math.random() * 70) + "%";
      bit.style.top = (30 + Math.random() * 40) + "%";
      bit.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
      bit.style.setProperty("--dy", (-40 - Math.random() * 110) + "px");
      bit.style.animationDelay = (Math.random() * 0.2) + "s";
      bit.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      box.appendChild(bit);
    }
  }

  // Foam does not roll anything, so its box does not flick through numbers:
  // the tier is simply lifted into place, once.
  function liftRoll(line, roll, done) {
    line.className = "sand-roll rolled up lifting";
    line.textContent = roll.text;
    var over = false;
    function end() {
      if (over) return;
      over = true;
      line.className = "sand-roll rolled up";
      done();
    }
    line.addEventListener("animationend", end);
    setTimeout(end, 900);
  }

  // The roll runs in the box: numbers flick past for a moment and settle on
  // what the block actually rolled.
  function spinRoll(line, block, roll, done) {
    var ticks = 12, i = 0;
    line.className = "sand-roll rolled rolling";
    var timer = setInterval(function () {
      i++;
      if (i >= ticks) {
        clearInterval(timer);
        line.className = "sand-roll rolled " +
          (roll.gold ? "gold" : roll.up ? "up" : "down");
        line.textContent = roll.text;
        if (roll.gold) {
          line.parentNode.classList.add("maxed");
          burst(line.parentNode);
        }
        done();
        return;
      }
      line.textContent = block.tier
        ? "T" + (1 + Math.floor(Math.random() * 20))
        : "\u00d7" + (roll.low + Math.random() * (block.high - roll.low))
            .toFixed(2);
    }, 45);
  }

  // The four blocks at the sanding station. Each says what it rolls and what
  // the next press of it costs on the piece that is on the bench.
  function sandBlocks(ctx) {
    var item = heldPiece(ctx);
    var boxes = el("div", "sand-boxes");
    // Every box's own price line, so one press re-prices the whole station at
    // once: a roll moves what the other blocks are worth, and the bench must
    // not still be showing what they cost before it.
    var settlers = [];
    function settleAll() { settlers.forEach(function (fn) { fn(); }); }
    global.Sand.BLOCKS.forEach(function (block) {
      var box = el("button", "sand-box");
      box.type = "button";
      var roll = sandShown(item, block);
      // The name, with the window it rolls in set small beside it once the
      // block has been used, so the two still sit on one line.
      var head = el("span", "sand-name", block.name);
      var span = el("span", "sand-window",
        " (" + global.Sand.windowText(block, item) + ")");
      if (!roll) span.hidden = true;
      head.appendChild(span);
      box.appendChild(head);
      var line = sandLine(item, block, roll);
      if (roll && roll.gold) box.classList.add("maxed");
      box.appendChild(line);

      var cost = item ? global.Sand.costFor(item, block) : 0;
      var price = el("span", "sand-cost", item && cost ? cost + " silver"
        : (block.tier ? "\u00a0" : "\u2014"));
      box.appendChild(price);

      // Why a shut box is shut, short enough to sit on the price line.
      function stopText(stop, held, block) {
        if (/foam pass/.test(stop)) return "Foam used";
        if (/T20/.test(stop)) return "Top tier";
        if (/Not enough silver/.test(stop)) {
          return "Need " + global.Sand.costFor(held, block) + " silver";
        }
        return "\u2014";
      }

      function settle() {
        var held = heldPiece(ctx);
        var stop = held ? global.Sand.shortFor(ctx.state, held, block) : "x";
        var next = held ? global.Sand.costFor(held, block) : 0;
        // The window climbs with every press, so the line beside the name is
        // rewritten rather than left showing the one it opened on.
        span.textContent = " (" + global.Sand.windowText(block, held) + ")";
        // A shut box says why on its price line rather than leaving the
        // player clicking at a dash.
        price.textContent = !held ? "\u2014"
          : stop ? stopText(stop, held, block)
          : next + " silver";
        price.classList.toggle("shut", !!(held && stop));
        // A spent foam block stays bright, but with nothing on the bench it
        // is shut like any other box.
        box.classList.toggle("tier", !!(block.tier && held));
        box.disabled = !!stop;
        box.title = stop || "";
      }
      settlers.push(settle);
      settle();

      box.addEventListener("click", function () {
        // The window the press rolled on, kept for the numbers that flick
        // past before it settles.
        var rolledLow = global.Sand.lowFor(heldPiece(ctx), block);
        var result = global.Sand.press(ctx.state, heldPiece(ctx), block.key);
        if (!result.ok) {
          ctx.setNotice(result.reason);
          return ctx.refresh();
        }
        var landed = block.tier
          ? { text: "Tier +1", up: true }
          : { text: "\u00d7" + result.mult.toFixed(2), up: result.mult >= 1,
              gold: result.max, low: rolledLow };
        var piece = heldPiece(ctx);
        if (piece) {
          if (!piece.rolls) piece.rolls = {};
          piece.rolls[block.key] = landed;
        }
        span.hidden = false;
        // The purse and every other block's price change the moment the
        // block is pressed, not when its numbers stop turning.
        ctx.refreshPurse();
        settleAll();
        box.disabled = true;
        (block.tier ? function (l, b, r, fn) { liftRoll(l, r, fn); }
          : spinRoll)(line, block, landed, function () {
          settleAll();
          // Only the piece's own numbers are redrawn, so the menu does not
          // blink and the roll stays up in its box.
          var held = heldPiece(ctx);
          if (sandFill) modFill(sandFill, held);
          // The box that holds the piece carries its tier, so it is redrawn
          // as well - a foam pass moves it.
          if (sandPick && held) {
            sandPick.innerHTML = "";
            sandPick.appendChild(pieceLine(held));
          }
        });
      });
      boxes.appendChild(box);
    });
    return boxes;
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
      if (part.key === "modification") {
        sandFill = fill;
        modFill(fill, heldPiece(ctx));
      }
      // Sanding is four blocks, one to a box: press one and it works the
      // piece on the bench.
      if (part.key === "sanding") fill.appendChild(sandBlocks(ctx));
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
    sandPick = held ? pickBox : null;
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

    var weapons = el("div", "row");
    var weaponsMain = el("div", "row-main");
    weaponsMain.appendChild(el("div", "row-title", "Dev weapons"));
    weaponsMain.appendChild(el("div", "muted",
      "Drops one of every weapon, each with the six longest-named enchants."));
    weapons.appendChild(weaponsMain);
    weapons.appendChild(button("DROP", "mini-btn strong", function () {
      ctx.devWeapons();
    }));
    wrap.appendChild(weapons);

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
