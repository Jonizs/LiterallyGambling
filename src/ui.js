/* Wiring for the forge HUD: player state, buff readouts, tooltips and panels. */
(function () {
  "use strict";

  var state = {
    name: "JONIS",
    title: "Apprentice blacksmith",
    level: 5,
    xp: 62, // percent toward the next level
    slots: [null, null, null],
    buffs: [
      { key: "rarity", label: "Rarity", value: 150, up: 150, down: -150,
        help: "Rarity shifts the odds of the tier you pull from the forge. Higher rolls burn hotter, but a bad heat can drag the tier back down." },
      { key: "quality", label: "Quality", value: 0, up: 50, down: -50,
        help: "Quality is the finish on the piece. It scales the sale price and the stat roll of whatever you forge." },
      { key: "eslots", label: "E.Slots", value: 0, up: 1, down: -1,
        help: "Enchant slots left open on the finished item. Each slot can hold one enchant later at the shop." },
      { key: "edition", label: "Edition", value: 0, up: 1, down: -4,
        help: "Edition number of the mint. A low edition is rarer, and a failed strike can push it several numbers down." }
    ]
  };

  var PANELS = {
    forge: { title: "Forge", body:
      "<p>Feed the coals and strike. Every pull rolls against your current buffs.</p>" +
      "<ul><li>Rarity and Quality decide the tier and the finish.</li>" +
      "<li>A failed strike applies the red value instead of the green one.</li>" +
      "<li>Finished pieces land in your inventory.</li></ul>" },
    shop: { title: "Shop", body:
      "<p>Sell what you forged, or buy coal, ingots and enchants.</p>" +
      "<ul><li>Sale price scales with Quality and Edition.</li>" +
      "<li>Enchants need an open E.Slot on the item.</li></ul>" },
    inventory: { title: "Inventory", body:
      "<p>Everything you have forged and not yet sold.</p><p>Nothing here yet — light the forge.</p>" },
    options: { title: "Options", body:
      "<ul><li>Sound: on</li><li>Pixel scaling: nearest</li><li>Screen shake: on</li></ul>" }
  };

  var $ = function (id) { return document.getElementById(id); };
  var tooltipEl = $("tooltip");

  function renderHeader() {
    $("lvl-value").textContent = state.level;
    $("xp-fill").style.width = state.xp + "%";
  }

  function renderBuffs() {
    var grid = $("buff-grid");
    grid.innerHTML = "";
    state.buffs.forEach(function (buff) {
      var cell = document.createElement("div");
      cell.className = "buff";

      var text = document.createElement("div");
      var name = document.createElement("div");
      name.className = "buff-name";
      name.innerHTML = buff.label + ": <b>" + buff.value + "</b>";
      var delta = document.createElement("div");
      delta.className = "buff-delta";
      delta.innerHTML =
        '<span class="up">+' + buff.up + '</span> ' +
        '<span class="sep">#</span> ' +
        '<span class="down">' + buff.down + "</span>";
      text.appendChild(name);
      text.appendChild(delta);

      var help = document.createElement("button");
      help.className = "help";
      help.type = "button";
      help.textContent = "?";
      help.setAttribute("aria-label", buff.label + " info");
      bindTooltip(help, "<b>" + buff.label + "</b><br>" + buff.help);

      cell.appendChild(text);
      cell.appendChild(help);
      grid.appendChild(cell);
    });
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
    var panel = PANELS[key];
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
        "<p>" + state.title + " — level " + state.level + "</p>" +
        "<p>" + state.xp + "% toward the next level.</p>";
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
