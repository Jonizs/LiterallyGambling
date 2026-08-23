/* The resource yard panel: the Gather, Refine and Compound tabs. */
(function (global) {
  "use strict";

  var el = global.Panels.el, button = global.Panels.button;

  // --- resource ------------------------------------------------------------
  // The tab lives outside the builder so it survives a panel redraw.
  var resourceTab = "gather";

  var RESOURCE_TABS = [
    { key: "gather", label: "Gather",
      blurb: "Send a crew out. It costs silver and time, and comes back with ore." },
    { key: "refine", label: "Refine",
      blurb: "Burn ore down into bars, one bar per ore. One batch at a time." },
    { key: "compound", label: "Compound",
      blurb: "Bind refined material into the higher alloys." }
  ];

  function gatherTab(ctx, wrap) {
    var Ga = global.Gather;
    var state = ctx.state;

    // What the yard has brought in so far.
    var stock = el("div", "stock");
    Object.keys(Ga.RESOURCES).forEach(function (key) {
      stock.appendChild(el("span", "mat" + (state.resources[key] ? "" : " none"),
        Ga.RESOURCES[key].label + " " + state.resources[key]));
    });
    wrap.appendChild(stock);

    var job = Ga.running(state);
    var rows = el("div", "rows");
    Ga.OPERATIONS.forEach(function (op) {
      var open = Ga.unlocked(state, op);
      var out = job && job.op.key === op.key;
      var row = el("div", "row" + (open ? "" : " locked"));

      var main = el("div", "row-main");
      var title = el("div", "row-title", op.name);
      title.appendChild(el("span", "chip-stat tier", Ga.durationText(op.minutes)));
      if (!open) title.appendChild(el("span", "chip-stat lock", "Level " + op.level));
      main.appendChild(title);
      main.appendChild(el("div", "muted", op.cost.toLocaleString() + " silver"));
      var line = el("div", "cost-line");
      op.yields.forEach(function (entry) {
        line.appendChild(el("span", "cost ok", Ga.yieldText(entry)));
      });
      main.appendChild(line);
      row.appendChild(main);

      var b;
      if (out && Ga.done(state)) {
        b = button("COLLECT", "mini-btn strong", function () { ctx.claimGather(); });
      } else if (out) {
        b = button(Ga.clockText(Ga.remaining(state)), "mini-btn", function () {});
        b.disabled = true;
      } else {
        b = button(open ? "SEND" : "LOCKED", "mini-btn strong", function () {
          ctx.startGather(op);
        });
        b.disabled = !open || !!job || state.silver < op.cost;
        if (!open) {
          b.title = "Unlocks at smith level " + op.level + ".";
        } else if (job) {
          b.title = "A run is already out.";
        } else if (state.silver < op.cost) {
          b.title = "Short " + (op.cost - state.silver) + " silver.";
        }
      }
      row.appendChild(b);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  function refineTab(ctx, wrap) {
    var Re = global.Refine, Ga = global.Gather;
    var state = ctx.state;

    var stock = el("div", "stock");
    Re.ORES.forEach(function (ore) {
      stock.appendChild(el("span", "mat" + (state.bars[ore.key] ? "" : " none"),
        ore.label + " bar " + state.bars[ore.key]));
    });
    wrap.appendChild(stock);

    var job = Re.running(state);
    var rows = el("div", "rows");
    Re.ORES.forEach(function (ore) {
      var held = state.resources[ore.key];
      var burning = job && job.ore.key === ore.key;
      var row = el("div", "row");

      var main = el("div", "row-main");
      var title = el("div", "row-title", ore.label + " bar");
      title.appendChild(el("span", "chip-stat tier", Re.durationText(ore.seconds) + " each"));
      main.appendChild(title);
      main.appendChild(el("div", "muted", "1 " + Ga.RESOURCES[ore.key].label.toLowerCase() +
        " per bar \u00b7 you hold " + held));
      row.appendChild(main);

      if (burning && Re.done(state)) {
        row.appendChild(button("COLLECT " + job.qty, "mini-btn strong",
          function () { ctx.claimRefine(); }));
      } else if (burning) {
        var wait = button(Ga.clockText(Re.remaining(state)), "mini-btn", function () {});
        wait.disabled = true;
        wait.title = job.qty + " " + ore.label.toLowerCase() + " ore in the smelter.";
        row.appendChild(wait);
      } else {
        var group = el("div", "btn-group");
        [1, 10, held].forEach(function (qty, i) {
          var label = i === 2 ? "ALL" : "\u00d7" + qty;
          var b = button(label, "mini-btn", function () { ctx.startRefine(ore, qty); });
          b.disabled = !!job || held < qty || qty <= 0;
          if (job) b.title = "The smelter is busy.";
          group.appendChild(b);
        });
        row.appendChild(group);
      }
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  function build(ctx) {
    var wrap = el("div");

    var strip = el("div", "tabs");
    RESOURCE_TABS.forEach(function (tab) {
      var b = button(tab.label, "tab" + (tab.key === resourceTab ? " on" : ""),
        function () {
          resourceTab = tab.key;
          ctx.setNotice("");
          ctx.refresh();
        });
      strip.appendChild(b);
    });
    wrap.appendChild(strip);

    var current = RESOURCE_TABS.filter(function (tab) {
      return tab.key === resourceTab;
    })[0];
    wrap.appendChild(el("p", null, current.blurb));

    if (resourceTab === "gather") {
      gatherTab(ctx, wrap);
    } else if (resourceTab === "refine") {
      refineTab(ctx, wrap);
    } else {
      wrap.appendChild(el("p", "empty", current.label + " is not built yet."));
    }

    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Resource = { build: build };
})(window);
