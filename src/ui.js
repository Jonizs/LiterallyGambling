/* Wiring for the forge HUD: player state, buff readouts, tooltips and panels. */
(function () {
  "use strict";

  var S = window.Stats;

  var state = {
    name: "JONIS",
    title: "Apprentice blacksmith",
    level: 0,
    xp: 0, // percent toward the next level
    slots: [null, null, null],
    values: {
      rarity: S.STATS.rarity.start,
      quality: S.STATS.quality.start,
      eslots: S.STATS.eslots.start,
      edition: S.STATS.edition.start
    }
  };

  // Per-stat help text; the live roll window is appended at render time.
  var HELP = {
    rarity:
      "Rarity runs 0\u20131000 and sets the tier bracket the forge pulls from. " +
      "Each strike swings it by your luck, \u00b1150 at base. It cannot drop below 0.",
    quality:
      "Quality runs \u221250 to 400 and sets the finish band on the piece. " +
      "Each strike swings it by \u00b150 at base. It can go negative, down to Bad.",
    eslots:
      "Enchant slots run 0\u20136 and decide how many enchants the piece can hold. " +
      "Each strike swings it by \u00b11 at base. It cannot drop below 0.",
    edition:
      "Edition runs 0\u20135 and names the mint the piece is struck in. " +
      "A good strike gains 1, a bad one loses 4. It cannot drop below 0."
  };

  function panels() {
    return {
      forge: { title: "Forge", body: forecastTable() +
        "<p>Every strike swings each stat by your luck: the green value on a " +
        "good heat, the red one on a bad heat. The stats you end on decide " +
        "what the piece is worth.</p>" },
      shop: { title: "Shop", body:
        "<p>Sell what you forged, or buy coal, ingots and enchants.</p>" +
        "<ul><li>Sale price scales with Quality band and Edition.</li>" +
        "<li>An enchant needs an open slot on the piece.</li></ul>" },
      inventory: { title: "Inventory", body:
        "<p>Everything you have forged and not yet sold.</p>" +
        "<p>Nothing here yet \u2014 light the forge.</p>" },
      options: { title: "Options", body:
        "<ul><li>Sound: on</li><li>Pixel scaling: nearest</li>" +
        "<li>Screen shake: on</li></ul>" }
    };
  }

  // What the current stats could produce on the next strike.
  function forecastTable() {
    var rows = S.forecast(state.values).map(function (row) {
      return "<li>" + row.label + ": <b>" + row.value + "</b> " +
        '<span class="muted">(' + row.detail + ")</span></li>";
    });
    return "<p>Next strike can land:</p><ul>" + rows.join("") + "</ul>";
  }

  var $ = function (id) { return document.getElementById(id); };
  var tooltipEl = $("tooltip");

  function renderHeader() {
    $("lvl-value").textContent = state.level;
    $("xp-fill").style.width = state.xp + "%";
  }

  function renderBuffs() {
    var grid = $("buff-grid");
    grid.innerHTML = "";
    Object.keys(S.STATS).forEach(function (key) {
      var stat = S.STATS[key];
      var value = state.values[key];
      var cell = document.createElement("div");
      cell.className = "buff";

      var text = document.createElement("div");
      var name = document.createElement("div");
      name.className = "buff-name";
      name.innerHTML = stat.label + ": <b>" + value + "</b>";
      var delta = document.createElement("div");
      delta.className = "buff-delta";
      delta.innerHTML =
        '<span class="up">+' + stat.up + '</span> ' +
        '<span class="sep">#</span> ' +
        '<span class="down">' + stat.down + "</span>";
      text.appendChild(name);
      text.appendChild(delta);

      var help = document.createElement("button");
      help.className = "help";
      help.type = "button";
      help.textContent = "?";
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
      "<br><br>Next strike: <b>" + range.low + "\u2013" + range.high + "</b>" +
      "<br>Lands in: <b>" + lands + "</b>";
  }

  function bracketSpan(low, high) {
    return low === high ? low : low + "\u2013" + high;
  }

  function renderSlots() {
    var row = $("slot-row");
    row.innerHTML = "";
    state.slots.forEach(function (item, i) {
      var slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = item ? item.name : "";
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

  function openPanel(key) {
    var panel = panels()[key];
    if (!panel) return;
    $("overlay-title").textContent = panel.title;
    $("overlay-body").innerHTML = panel.body;
    $("overlay").hidden = false;
  }

  function closePanel() { $("overlay").hidden = true; }

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
    $("btn-profile").addEventListener("click", function () {
      $("overlay-title").textContent = state.name;
      $("overlay-body").innerHTML =
        "<p>" + state.title + " \u2014 level " + state.level + "</p>" +
        "<p>" + state.xp + "% toward the next level.</p>" + forecastTable();
      $("overlay").hidden = false;
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { closePanel(); hideTooltip(); }
    });
    document.addEventListener("click", hideTooltip);
  }

  function init() {
    renderHeader();
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
