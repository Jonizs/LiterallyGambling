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
      blurb: "Break pieces down into the parts they are built from." },
    { key: "artifacts", label: "Artifacts",
      blurb: "Study the strange finds that do not fit any recipe." }
  ];

  // Recipes are bought outright with schematics, molds and metal; once the
  // bench has worked one out it stays in the book.
  function recipesTab(ctx, wrap) {
    var open = G.unlearned(ctx.state);
    if (!open.length) {
      wrap.appendChild(el("p", "empty", "Every recipe on the bench is worked out."));
      return;
    }
    var rows = el("div", "rows");
    open.forEach(function (recipe) {
      var row = el("div", "row");
      row.appendChild(I.make(recipe.icon));
      var main = el("div", "row-main");
      main.appendChild(el("div", "row-title", recipe.name));
      main.appendChild(global.Panels.recipeStats(recipe));
      main.appendChild(costLine(ctx.state, G.researchCost(recipe)));
      row.appendChild(main);

      var missing = G.missingResearch(ctx.state, recipe);
      var b = button("WORK OUT", "mini-btn strong", function () {
        var result = G.learn(ctx.state, recipe);
        ctx.setNotice(result.ok
          ? result.recipe.name + " worked out \u2014 it is on the bench now."
          : result.reason);
        ctx.refresh();
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
    else wrap.appendChild(el("p", "empty", current.label + " is not built yet."));

    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Experiment = { build: build };
})(window);
