/* The inventory panel: the Weapons, Resources and Utility tabs. */
(function (global) {
  "use strict";

  var el = global.Panels.el, button = global.Panels.button;

  // The tab lives outside the builder so it survives a panel redraw.
  var inventoryTab = "weapons";

  var INVENTORY_TABS = [
    { key: "weapons", label: "Weapons",
      blurb: "Everything the forge has turned out, ready to sell." },
    { key: "resources", label: "Resources",
      blurb: "Materials, ore, bars and alloys on hand." },
    { key: "utility", label: "Utility",
      blurb: "Schematics and molds the forge has stamped." },
    { key: "artifacts", label: "Artifacts",
      blurb: "Trinkets the basic slot has handed over. The shelf by the forge " +
        "holds three." }
  ];

  // Utility crafts are kept alongside ore, so they are named out rather than
  // guessed at from the resource list.
  var UTILITY_KEYS = ["common", "rare", "epic", "mold"];

  function isUtility(key) { return UTILITY_KEYS.indexOf(key) >= 0; }

  function chip(icon, text, held) {
    var span = el("span", "mat" + (held ? "" : " none"));
    if (icon) span.appendChild(icon);
    span.appendChild(el("span", null, text));
    return span;
  }

  function group(wrap, title, chips) {
    if (!chips.length) return;
    wrap.appendChild(el("div", "row-title", title));
    var stock = el("div", "stock");
    chips.forEach(function (node) { stock.appendChild(node); });
    wrap.appendChild(stock);
  }

  function weaponsTab(ctx, wrap) {
    var G = global.Game, items = ctx.state.inventory;
    if (!items.length) {
      wrap.appendChild(el("p", "empty",
        "Nothing forged yet. Buy materials in the shop, then strike."));
      return;
    }
    var head = el("div", "row head-row");
    head.appendChild(el("div", "row-title",
      items.length + " piece" + (items.length === 1 ? "" : "s") + " forged · " +
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
      row.appendChild(global.Panels.itemLine(item));
      row.appendChild(button("SELL " + G.sellPrice(item), "mini-btn", function () {
        var result = G.sell(ctx.state, item.id);
        ctx.setNotice(result.ok
          ? "Sold " + result.item.name + " for " + result.price + " silver."
          : result.reason);
        ctx.refresh();
      }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  function resourcesTab(ctx, wrap) {
    var G = global.Game, Ga = global.Gather, Re = global.Refine,
        Co = global.Compound, I = global.Icons, state = ctx.state;

    group(wrap, "Materials", Object.keys(G.MATERIALS).map(function (key) {
      return chip(null, G.MATERIALS[key].label + " " + state.materials[key],
        state.materials[key]);
    }));

    group(wrap, "Ore", Object.keys(Ga.RESOURCES).filter(function (key) {
      return !isUtility(key);
    }).map(function (key) {
      return chip(null, Ga.RESOURCES[key].label + " " + state.resources[key],
        state.resources[key]);
    }));

    group(wrap, "Bars", Re.ORES.map(function (ore) {
      return chip(I.bar(ore.key, "icon tiny"),
        ore.label + " bar " + state.bars[ore.key], state.bars[ore.key]);
    }));

    group(wrap, "Alloys", Co.ALLOYS.map(function (alloy) {
      var metals = Object.keys(alloy.cost);
      return chip(I.alloyBar(metals[0], metals[1], "icon tiny"),
        alloy.name.replace(" Alloy", "") + " " + state.alloys[alloy.key],
        state.alloys[alloy.key]);
    }));
  }

  function utilityTab(ctx, wrap) {
    var Ga = global.Gather, state = ctx.state;
    var chips = UTILITY_KEYS.filter(function (key) {
      return Ga.RESOURCES[key];
    }).map(function (key) {
      return chip(null, Ga.RESOURCES[key].label + " " + state.resources[key],
        state.resources[key]);
    });
    if (!chips.length) {
      wrap.appendChild(el("p", "empty", "Nothing stamped yet."));
      return;
    }
    group(wrap, "Stamped", chips);
  }

  // Everything found so far, each with the button that puts it on the shelf
  // or takes it off again.
  function artifactsTab(ctx, wrap) {
    var A = global.Artifacts, Panel = global.Artifact;
    var held = A.DEFS.filter(function (def) { return A.owns(ctx.state, def.key); });
    if (!held.length) {
      wrap.appendChild(el("p", "empty",
        "Nothing found yet. Roll the basic slot at the artifact table."));
      return;
    }
    wrap.appendChild(el("div", "row-title",
      A.equippedDefs(ctx.state).length + "/" + A.MAX + " on the shelf"));
    var rows = el("div", "rows");
    held.forEach(function (def) {
      rows.appendChild(Panel.artifactRow(ctx, def, {
        action: function (d, owned, on) { return Panel.shelfButton(ctx, d, owned, on); }
      }));
    });
    wrap.appendChild(rows);
  }

  function build(ctx) {
    var wrap = el("div");

    var strip = el("div", "tabs");
    INVENTORY_TABS.forEach(function (tab) {
      strip.appendChild(button(tab.label, "tab" + (tab.key === inventoryTab ? " on" : ""),
        function () {
          inventoryTab = tab.key;
          ctx.setNotice("");
          ctx.refresh();
        }));
    });
    wrap.appendChild(strip);

    var current = INVENTORY_TABS.filter(function (tab) {
      return tab.key === inventoryTab;
    })[0];
    wrap.appendChild(el("p", null, current.blurb));

    if (inventoryTab === "weapons") weaponsTab(ctx, wrap);
    else if (inventoryTab === "resources") resourcesTab(ctx, wrap);
    else if (inventoryTab === "artifacts") artifactsTab(ctx, wrap);
    else utilityTab(ctx, wrap);

    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Inventory = { build: build };
})(window);
