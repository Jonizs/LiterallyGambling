/* Panel bodies for the scene overlay: forge, shop and inventory. */
(function (global) {
  "use strict";

  var G = global.Game, S = global.Stats;

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
    line.appendChild(el("span", "item-name", item.name));
    var meta = el("span", "item-meta");
    meta.appendChild(el("span", "chip-stat tier", item.tier));
    meta.appendChild(el("span", "chip-stat band-" + item.band.toLowerCase(), item.band));
    meta.appendChild(el("span", "chip-stat", item.slots + " slot" + (item.slots === 1 ? "" : "s")));
    meta.appendChild(el("span", "chip-stat", item.editionName));
    line.appendChild(meta);
    return line;
  }

  // --- forge ---------------------------------------------------------------
  function forgePanel(ctx) {
    var wrap = el("div");
    if (ctx.lastItem) {
      var out = el("div", "result");
      out.appendChild(el("div", "result-head", "Pulled from the coals"));
      out.appendChild(itemLine(ctx.lastItem));
      out.appendChild(el("div", "muted",
        "rarity " + ctx.lastItem.rarity + " \u00b7 quality " + ctx.lastItem.quality));
      wrap.appendChild(out);
    }
    wrap.appendChild(el("p", null,
      "Pick a piece. Forging spends the materials and rolls each stat " +
      "around your forge buffs \u2014 every value in the luck window is " +
      "equally likely."));

    var rows = el("div", "rows");
    G.RECIPES.forEach(function (recipe) {
      var row = el("div", "row");
      var main = el("div", "row-main");
      main.appendChild(el("div", "row-title", recipe.name));
      main.appendChild(costLine(ctx.state, recipe));
      row.appendChild(main);

      var ready = G.canForge(ctx.state, recipe);
      var b = button("FORGE", "mini-btn strong", function () {
        var result = G.forge(ctx.state, recipe);
        if (result.ok) ctx.setResult(result.item);
        ctx.refresh();
      });
      b.disabled = !ready;
      if (!ready) {
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
      return wrap;
    }
    wrap.appendChild(el("p", null,
      items.length + " piece" + (items.length === 1 ? "" : "s") + " forged."));
    var rows = el("div", "rows");
    items.forEach(function (item) {
      var row = el("div", "row");
      row.appendChild(itemLine(item));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    return wrap;
  }

  function soonPanel(what) {
    return function () {
      var wrap = el("div");
      wrap.appendChild(el("p", "empty", what + " is not built yet."));
      return wrap;
    };
  }

  var BUILDERS = {
    forge: { title: "Forge", build: forgePanel },
    shop: { title: "Shop", build: shopPanel },
    inventory: { title: "Inventory", build: inventoryPanel },
    enchant: { title: "Enchant", build: soonPanel("Enchanting") },
    awaken: { title: "Awaken", build: soonPanel("Awakening") },
    options: { title: "Options", build: function () {
      var wrap = el("div");
      var list = el("ul");
      ["Sound: on", "Pixel scaling: nearest", "Screen shake: on"].forEach(function (t) {
        list.appendChild(el("li", null, t));
      });
      wrap.appendChild(list);
      return wrap;
    } }
  };

  global.Panels = { BUILDERS: BUILDERS, itemLine: itemLine, el: el };
})(window);
