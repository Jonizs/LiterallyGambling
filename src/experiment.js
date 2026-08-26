/* The experimentation bench: the Recipes, Parts and Artifacts tabs. */
(function (global) {
  "use strict";

  var G = global.Game, I = global.Icons;
  var el = global.Panels.el, button = global.Panels.button,
      costLine = global.Panels.costLine;



  // --- experimentation -----------------------------------------------------
  // The tab lives outside the builder so it survives a panel redraw.
  var experimentTab = "recipes";

  var EXPERIMENT_TABS = [
    { key: "recipes", label: "Recipes",
      blurb: "Work out what the smith can learn to make." },
    { key: "parts", label: "Parts",
      blurb: "Fittings the better pieces are built from. They go on the anvil " +
        "like a piece, but the iron finishes them \u2014 it is held to the work " +
        "for a few seconds and the part comes off done." },
    { key: "artifacts", label: "Artifacts",
      blurb: "Strange finds that fit no recipe. They bend what the forge " +
        "rolls; the shelf by the fire holds three, and what you already " +
        "have waits in the inventory." }
  ];

  var DISCOVER_EXIT = 560; // ms, matches the row's fold-away in the stylesheet

  // Recipes are bought outright with schematics, molds and metal; once the
  // bench has worked one out it stays in the book.
  function recipesTab(ctx, wrap) {
    // Worked-out recipes stay on the bench as a record, in their own place.
    var all = G.RECIPES.filter(function (recipe) { return !!recipe.research; });
    var open = all.filter(function (recipe) { return !G.known(ctx.state, recipe); });
    if (!all.length) {
      wrap.appendChild(el("p", "empty", "Nothing on the bench to work out."));
      return;
    }
    if (!open.length) {
      wrap.appendChild(el("p", "empty", "Every recipe on the bench is worked out."));
    }

    var rows = el("div", "rows");
    all.forEach(function (recipe) {
      var found = G.known(ctx.state, recipe);
      var row = el("div", "row" + (found ? " done" : ""));
      row.appendChild(I.make(recipe.icon));
      var main = el("div", "row-main");
      var title = el("div", "row-title", recipe.name);
      if (found) title.appendChild(el("span", "chip-stat found", "Discovered"));
      main.appendChild(title);
      main.appendChild(global.Panels.recipeStats(recipe));
      // What it cost is only worth showing while it is still owed.
      if (!found) main.appendChild(costLine(ctx.state, G.researchCost(recipe)));
      row.appendChild(main);

      if (found) {
        var kept = button("ON THE ANVIL", "mini-btn", function () {});
        kept.disabled = true;
        kept.title = "Already worked out \u2014 forge it at the anvil.";
        row.appendChild(kept);
        rows.appendChild(row);
        return;
      }

      var missing = G.missingResearch(ctx.state, recipe);
      var b = button("DISCOVER", "mini-btn strong", function () {
        var result = G.learn(ctx.state, recipe);
        if (!result.ok) {
          ctx.setNotice(result.reason);
          ctx.refresh();
          return;
        }
        // The slot flares and folds away before the forge takes over, so the
        // panel is not redrawn from under the animation.
        b.disabled = true;
        row.className += " discovered";
        setTimeout(function () { ctx.discover(recipe); }, DISCOVER_EXIT);
      });
      b.disabled = missing.length > 0;
      if (missing.length) {
        b.title = "Short " + missing.map(function (gap) {
          return gap.short + " " + gap.label.toLowerCase();
        }).join(", ");
      }
      row.appendChild(b);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  function build(ctx) {
    var wrap = el("div");

    var strip = el("div", "tabs");
    EXPERIMENT_TABS.forEach(function (tab) {
      strip.appendChild(button(tab.label, "tab" + (tab.key === experimentTab ? " on" : ""),
        function () {
          experimentTab = tab.key;
          ctx.setNotice("");
          ctx.refresh();
        }));
    });
    wrap.appendChild(strip);

    var current = EXPERIMENT_TABS.filter(function (tab) {
      return tab.key === experimentTab;
    })[0];
    wrap.appendChild(el("p", null, current.blurb));
    if (experimentTab === "recipes") recipesTab(ctx, wrap);
    else if (experimentTab === "parts") global.Panels.partsTab(ctx, wrap);
    else wrap.appendChild(global.Artifact.build(ctx));

    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Experiment = { build: build };
})(window);
