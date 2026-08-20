/* Wiring for the forge HUD: purse, buff readouts, tooltips and panels. */
(function () {
  "use strict";

  var S = window.Stats, G = window.Game, P = window.Panels;

  var player = {
    name: "JONIS",
    title: "Apprentice blacksmith",
    level: 0,
    xp: 0, // percent toward the next level
    display: [null, null, null]
  };

  var state = G.createState();
  var view = { panel: null, lastItem: null, notice: "" };

  // Per-stat help text; the live roll window is appended at render time.
  var HELP = {
    rarity:
      "Rarity runs 0–1000 and sets the tier bracket the forge pulls from. " +
      "Each strike swings it by your luck, ±150 at base. It cannot drop below 0.",
    quality:
      "Quality runs −50 to 400 and sets the finish band on the piece. " +
      "Each strike swings it by ±50 at base. It can go negative, down to Bad.",
    eslots:
      "Enchant slots run 0–6 and decide how many enchants the piece can hold. " +
      "Each strike swings it by ±1 at base. It cannot drop below 0.",
    edition:
      "Edition runs 0–5 and names the mint the piece is struck in. " +
      "A good strike gains 1, a bad one loses 4. It cannot drop below 0."
  };

  var $ = function (id) { return document.getElementById(id); };
  var tooltipEl = $("tooltip");

  function renderHeader() {
    $("lvl-value").textContent = player.level;
    $("xp-fill").style.width = player.xp + "%";
  }

  function renderPurse() {
    var purse = $("purse");
    purse.innerHTML = "";
    var coins = P.el("span", "coin", state.silver + " silver");
    bindTooltip(coins, "<b>Silver</b><br>Spent at the shop on materials.");
    purse.appendChild(coins);
    Object.keys(G.MATERIALS).forEach(function (key) {
      var mat = G.MATERIALS[key];
      var chip = P.el("span", "mat", mat.label + " " + state.materials[key]);
      bindTooltip(chip, "<b>" + mat.label + "</b><br>" + mat.price +
        " silver each in the shop.");
      purse.appendChild(chip);
    });
  }

  function renderBuffs() {
    var grid = $("buff-grid");
    grid.innerHTML = "";
    Object.keys(S.STATS).forEach(function (key) {
      var stat = S.STATS[key];
      var value = state.base[key];
      var cell = P.el("div", "buff");

      var text = P.el("div");
      var name = P.el("div", "buff-name");
      name.innerHTML = stat.label + ": <b>" + value + "</b>";
      var delta = P.el("div", "buff-delta");
      delta.innerHTML =
        '<span class="up">+' + stat.up + '</span> ' +
        '<span class="sep">#</span> ' +
        '<span class="down">' + stat.down + "</span>";
      text.appendChild(name);
      text.appendChild(delta);

      var help = P.el("button", "help", "?");
      help.type = "button";
      help.setAttribute("aria-label", stat.label + " info");
      bindTooltip(help, buffTooltip(key, stat, value));

      cell.appendChild(text);
      cell.appendChild(help);
      grid.appendChild(cell);
    });
  }

  // Tooltip: the rule for the stat, then the window it can roll into now.
  function buffTooltip(key, stat, value) {
    var range = S.rollRange(key, value);
    var lands;
    if (key === "rarity") {
      lands = bracketSpan(S.tierAt(range.low).name, S.tierAt(range.high).name);
    } else if (key === "quality") {
      lands = bracketSpan(S.qualityBandAt(range.low).name,
                          S.qualityBandAt(range.high).name);
    } else if (key === "edition") {
      lands = bracketSpan(S.editionAt(range.low), S.editionAt(range.high));
    } else {
      lands = bracketSpan(range.low + " slots", range.high + " slots");
    }
    return "<b>" + stat.label + "</b><br>" + HELP[key] +
      "<br><br>Next strike: <b>" + range.low + "–" + range.high +
      "</b>, every value equally likely<br>Lands in: <b>" + lands + "</b>";
  }

  function bracketSpan(low, high) {
    return low === high ? low : low + "–" + high;
  }

  function renderSlots() {
    var row = $("slot-row");
    row.innerHTML = "";
    player.display.forEach(function (item, i) {
      var slot = P.el("div", "slot", item ? item.name : "");
      bindTooltip(slot, item
        ? "<b>" + item.name + "</b><br>On display."
        : "Display slot " + (i + 1) + "<br>Empty. Show off a forged piece here.");
      row.appendChild(slot);
    });
  }

  function bindTooltip(el, html) {
    function show(ev) {
      tooltipEl.innerHTML = html;
      tooltipEl.hidden = false;
      place(ev);
    }
    function place(ev) {
      var pad = 12;
      var rect = tooltipEl.getBoundingClientRect();
      var x = ev.clientX + pad;
      var y = ev.clientY + pad;
      if (x + rect.width > window.innerWidth) x = ev.clientX - rect.width - pad;
      if (y + rect.height > window.innerHeight) y = ev.clientY - rect.height - pad;
      tooltipEl.style.left = Math.max(4, x) + "px";
      tooltipEl.style.top = Math.max(4, y) + "px";
    }
    el.addEventListener("mouseenter", show);
    el.addEventListener("mousemove", place);
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (tooltipEl.hidden) show(ev); else hideTooltip();
    });
  }

  function hideTooltip() { tooltipEl.hidden = true; }

  function context() {
    return {
      state: state,
      lastItem: view.lastItem,
      notice: view.notice,
      setResult: function (item) { view.lastItem = item; view.notice = ""; },
      setNotice: function (text) { view.notice = text; },
      refresh: refresh
    };
  }

  function openPanel(key) {
    var panel = P.BUILDERS[key];
    if (!panel) return;
    view.panel = key;
    view.notice = "";
    if (key !== "forge") view.lastItem = null;
    drawPanel();
    $("overlay").hidden = false;
  }

  function drawPanel() {
    if (!view.panel) return;
    var panel = P.BUILDERS[view.panel];
    $("overlay-title").textContent = panel.title;
    var body = $("overlay-body");
    body.innerHTML = "";
    body.appendChild(panel.build(context()));
  }

  function closePanel() {
    view.panel = null;
    $("overlay").hidden = true;
  }

  function refresh() {
    renderPurse();
    renderBuffs();
    renderSlots();
    drawPanel();
  }

  function openProfile() {
    view.panel = null;
    $("overlay-title").textContent = player.name;
    var body = $("overlay-body");
    body.innerHTML = "";
    body.appendChild(P.el("p", null,
      player.title + " — level " + player.level));
    body.appendChild(P.el("p", null, player.xp + "% toward the next level."));
    body.appendChild(P.el("p", null, "Next strike can land:"));
    var list = P.el("ul");
    S.forecast(state.base).forEach(function (row) {
      var li = P.el("li", null, row.label + ": ");
      li.appendChild(P.el("b", null, row.value));
      li.appendChild(P.el("span", "muted", " (" + row.detail + ")"));
      list.appendChild(li);
    });
    body.appendChild(list);
    $("overlay").hidden = false;
  }

  function bindControls() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-panel]"),
      function (btn) {
        btn.addEventListener("click", function () { openPanel(btn.dataset.panel); });
      }
    );
    $("overlay-close").addEventListener("click", closePanel);
    $("overlay").addEventListener("click", function (ev) {
      if (ev.target === $("overlay")) closePanel();
    });
    $("btn-profile").addEventListener("click", openProfile);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { closePanel(); hideTooltip(); }
    });
    document.addEventListener("click", hideTooltip);
  }

  function init() {
    renderHeader();
    renderPurse();
    renderBuffs();
    renderSlots();
    bindControls();
    new window.Forge(document.getElementById("forge-canvas")).start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
