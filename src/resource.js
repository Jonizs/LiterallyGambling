/* The resource yard panel: the Gather, Refine and Compound tabs. */
(function (global) {
  "use strict";

  var el = global.Panels.el, button = global.Panels.button;

  // The two bars an alloy is poured from, in cost order.
  function alloyMetals(alloy) { return Object.keys(alloy.cost); }

  function alloyIcon(alloy, className) {
    var metals = alloyMetals(alloy);
    return global.Icons.alloyBar(metals[0], metals[1], className);
  }

  // Five times what is still in the fire, or nothing left to pay for.
  function rushButton(cost, silver, onClick) {
    var b = button(cost ? "RUSH " + cost.toLocaleString() : "RUSH", "mini-btn", onClick);
    b.disabled = !cost || silver < cost;
    b.title = !cost ? "Nothing left to rush."
      : silver < cost ? "Short " + (cost - silver).toLocaleString() + " silver."
      : "Finishes the batch for " + cost.toLocaleString() + " silver.";
    return b;
  }

  // A stock chip with its bar sitting in front of the count.
  function stockChip(icon, text, className) {
    var chip = el("span", className);
    chip.appendChild(icon);
    chip.appendChild(el("span", null, text));
    return chip;
  }

  // --- resource ------------------------------------------------------------
  // The tab lives outside the builder so it survives a panel redraw.
  var resourceTab = "gather";

  var RESOURCE_TABS = [
    { key: "gather", label: "Gather",
      blurb: "Send a crew out. It costs silver and time, and comes back with ore." },
    { key: "refine", label: "Refine",
      blurb: "Burn ore down into bars, one bar per ore. Two ovens, up to fifty a " +
        "batch, and a bar drops every burn." },
    { key: "compound", label: "Compound",
      blurb: "Bind bars into alloys. Three crucibles, up to ten a batch, poured " +
        "one at a time." }
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
        var waiting = el("div", "btn-group");
        var clock = button(Ga.clockText(Ga.remaining(state)), "mini-btn", function () {});
        clock.disabled = true;
        waiting.appendChild(clock);
        var cost = Ga.rushCost(op);
        var rush = button("RUSH " + cost.toLocaleString(), "mini-btn",
          function () { ctx.rushGather(); });
        rush.disabled = state.silver < cost;
        rush.title = state.silver < cost
          ? "Short " + (cost - state.silver).toLocaleString() + " silver."
          : "Brings the crew straight back for " + cost.toLocaleString() + " silver.";
        waiting.appendChild(rush);
        b = waiting;
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
      stock.appendChild(stockChip(global.Icons.bar(ore.key, "icon tiny"),
        ore.label + " bar " + state.bars[ore.key],
        "mat" + (state.bars[ore.key] ? "" : " none")));
    });
    wrap.appendChild(stock);

    // The two ovens, lit while they burn.
    var kit = el("div", "kit two");
    for (var i = 0; i < Re.OVENS; i++) {
      (function (index) {
        var job = Re.slot(state, index);
        var cell = el("div", "crucible" + (job ? " lit" : ""));
        cell.appendChild(global.Icons.make(job ? "oven-lit" : "oven", "icon"));
        if (!job) {
          cell.appendChild(el("div", "row-title", "Oven " + (index + 1)));
          cell.appendChild(el("div", "muted", "Out"));
        } else {
          cell.appendChild(el("div", "row-title", job.ore.label));
          cell.appendChild(el("div", "muted",
            (job.qty - job.taken) + " left \u00b7 next " +
            Ga.clockText(Re.remaining(state, index))));
          var group = el("div", "btn-group");
          var take = button(job.ready ? "TAKE " + job.ready : "TAKE", "mini-btn" +
            (job.ready ? " strong" : ""), function () { ctx.claimRefine(index); });
          take.disabled = !job.ready;
          group.appendChild(take);
          var queued = job.qty - job.taken - job.ready - 1;
          var halt = button("STOP", "mini-btn", function () { ctx.stopRefine(index); });
          halt.disabled = queued <= 0;
          halt.title = queued > 0
            ? "Drops the " + queued + " still queued; the one burning finishes."
            : "Nothing queued behind this one.";
          group.appendChild(halt);
          cell.appendChild(group);
          cell.appendChild(rushButton(Re.rushCost(state, index), state.silver,
            function () { ctx.rushRefine(index); }));
        }
        kit.appendChild(cell);
      })(i);
    }
    wrap.appendChild(kit);

    var free = Re.freeSlot(state) >= 0;
    var rows = el("div", "rows");
    Re.ORES.forEach(function (ore) {
      var held = state.resources[ore.key];
      var row = el("div", "row");

      var main = el("div", "row-main");
      var title = el("div", "row-title");
      title.appendChild(global.Icons.bar(ore.key, "icon tiny"));
      title.appendChild(el("span", null, ore.label + " bar"));
      title.appendChild(el("span", "chip-stat tier", Re.durationText(ore.seconds) + " each"));
      main.appendChild(title);
      main.appendChild(el("div", "muted", "1 " + Ga.RESOURCES[ore.key].label.toLowerCase() +
        " per bar \u00b7 worth " + ore.value.toLocaleString() + " silver \u00b7 you hold " +
        held));
      row.appendChild(main);

      var most = Math.min(held, Re.MAX_BATCH);
      var group = el("div", "btn-group");
      [1, 10, most].forEach(function (qty, i) {
        var label = i === 2 ? "ALL" : "\u00d7" + qty;
        var b = button(label, "mini-btn", function () { ctx.startRefine(ore, qty); });
        b.disabled = !free || qty <= 0 || held < qty || qty > Re.MAX_BATCH;
        if (!free) b.title = "Both ovens are burning.";
        else if (i === 2) b.title = "Up to " + Re.MAX_BATCH + " an oven.";
        group.appendChild(b);
      });
      row.appendChild(group);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
  }

  function compoundTab(ctx, wrap) {
    var Co = global.Compound, Re = global.Refine, Ga = global.Gather;
    var state = ctx.state;

    var stock = el("div", "stock");
    Re.ORES.forEach(function (ore) {
      stock.appendChild(stockChip(global.Icons.bar(ore.key, "icon tiny"),
        ore.label + " bar " + state.bars[ore.key],
        "mat" + (state.bars[ore.key] ? "" : " none")));
    });
    Co.ALLOYS.forEach(function (alloy) {
      if (!state.alloys[alloy.key]) return;
      stock.appendChild(stockChip(alloyIcon(alloy, "icon tiny"),
        alloy.name.replace(" Alloy", "") + " " + state.alloys[alloy.key], "coin"));
    });
    wrap.appendChild(stock);

    // The three crucibles, whatever is in them.
    var slots = el("div", "kit");
    for (var i = 0; i < Co.CRUCIBLES; i++) {
      (function (index) {
        var job = Co.slot(state, index);
        var cell = el("div", "crucible" + (job ? " lit" : ""));
        cell.appendChild(global.Icons.make(job ? "crucible-lit" : "crucible", "icon"));
        if (!job) {
          cell.appendChild(el("div", "row-title", "Crucible " + (index + 1)));
          cell.appendChild(el("div", "muted", "Cold"));
        } else {
          var lit = el("div", "row-title");
          lit.appendChild(alloyIcon(job.alloy, "icon tiny"));
          lit.appendChild(el("span", null, job.alloy.name.replace(" Alloy", "")));
          cell.appendChild(lit);
          cell.appendChild(el("div", "muted",
            (job.qty - job.taken) + " left \u00b7 next " +
            Ga.clockText(Co.remaining(state, index))));
          var pour = el("div", "btn-group");
          var take = button(job.ready ? "TAKE " + job.ready : "TAKE", "mini-btn" +
            (job.ready ? " strong" : ""), function () { ctx.claimCompound(index); });
          take.disabled = !job.ready;
          pour.appendChild(take);
          var queued = job.qty - job.taken - job.ready - 1;
          var halt = button("STOP", "mini-btn", function () { ctx.stopCompound(index); });
          halt.disabled = queued <= 0;
          halt.title = queued > 0
            ? "Drops the " + queued + " still queued; the one cooking finishes."
            : "Nothing queued behind this one.";
          pour.appendChild(halt);
          cell.appendChild(pour);
          cell.appendChild(rushButton(Co.rushCost(state, index), state.silver,
            function () { ctx.rushCompound(index); }));
        }
        slots.appendChild(cell);
      })(i);
    }
    wrap.appendChild(slots);

    var rows = el("div", "rows");
    Co.ALLOYS.forEach(function (alloy) {
      var row = el("div", "row");
      var main = el("div", "row-main");
      var title = el("div", "row-title");
      title.appendChild(alloyIcon(alloy, "icon tiny"));
      title.appendChild(el("span", null, alloy.name));
      title.appendChild(el("span", "chip-stat tier", Re.durationText(alloy.seconds) + " each"));
      title.appendChild(el("span", "chip-stat",
        Co.value(alloy).toLocaleString() + " silver"));
      main.appendChild(title);
      var line = el("div", "cost-line");
      Object.keys(alloy.cost).forEach(function (bar) {
        var need = alloy.cost[bar];
        var have = state.bars[bar];
        line.appendChild(stockChip(global.Icons.bar(bar, "icon tiny"),
          Re.find(bar).label + " bar " + have + "/" + need,
          "cost " + (have >= need ? "ok" : "short")));
      });
      main.appendChild(line);
      row.appendChild(main);

      var most = Co.affordable(state, alloy);
      var group = el("div", "btn-group");
      [1, 5, Co.MAX_BATCH].forEach(function (qty) {
        var b = button("\u00d7" + qty, "mini-btn",
          function () { ctx.startCompound(alloy, qty); });
        b.disabled = Co.freeSlot(state) < 0 || most < qty;
        if (Co.freeSlot(state) < 0) b.title = "Every crucible is full.";
        group.appendChild(b);
      });
      row.appendChild(group);
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
      compoundTab(ctx, wrap);
    }

    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Resource = { build: build };
})(window);
