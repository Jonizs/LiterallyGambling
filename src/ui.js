/* Wiring for the forge HUD: purse, buff readouts, tooltips and panels. */
(function () {
  "use strict";

  var S = window.Stats, G = window.Game, P = window.Panels;

  var player = {
    name: "JONIS",
    title: "Apprentice blacksmith",
    display: [null, null]
  };

  var state = G.createState();
  var view = { panel: null, notice: "", pending: null, striking: false, shown: null };
  var scene = null;

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
    $("lvl-value").textContent = state.level;
    $("xp-fill").style.width = G.xpPercent(state) + "%";
  }

  function xpTooltip() {
    var need = G.xpToNext(state.level);
    var locked = G.lockedRecipes(state);
    var text = "<b>Smith level " + state.level + "</b><br>" +
      state.xp + " / " + need + " XP toward level " + (state.level + 1) +
      "<br>Forging earns XP \u2014 better pieces teach more.";
    if (locked.length) {
      text += "<br><br>Next unlock: <b>" + locked[0].name +
        "</b> at level " + locked[0].level + ".";
    }
    return text;
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

  // A finger has no hover, so touch taps toggle the tooltip and anchor it to
  // the element instead of trailing a pointer that is not there.
  var lastPointerType = "mouse";
  document.addEventListener("pointerdown", function (ev) {
    lastPointerType = ev.pointerType || "mouse";
  }, true);

  function clampTip(x, y) {
    var rect = tooltipEl.getBoundingClientRect();
    x = Math.min(x, window.innerWidth - rect.width - 4);
    y = Math.min(y, window.innerHeight - rect.height - 4);
    tooltipEl.style.left = Math.max(4, x) + "px";
    tooltipEl.style.top = Math.max(4, y) + "px";
  }

  function bindTooltip(el, html) {
    function open() {
      tooltipEl.innerHTML = typeof html === "function" ? html() : html;
      tooltipEl.hidden = false;
      tooltipEl.style.left = "0px";
      tooltipEl.style.top = "0px";
    }
    function showAtPointer(ev) {
      open();
      placeAtPointer(ev);
    }
    function placeAtPointer(ev) {
      var pad = 12;
      var rect = tooltipEl.getBoundingClientRect();
      var x = ev.clientX + pad;
      var y = ev.clientY + pad;
      if (x + rect.width > window.innerWidth) x = ev.clientX - rect.width - pad;
      if (y + rect.height > window.innerHeight) y = ev.clientY - rect.height - pad;
      clampTip(x, y);
    }
    // Touch: sit the card above the tapped control, or below it when there is
    // no room, so the finger never covers what it just opened.
    function showAtElement() {
      open();
      var box = el.getBoundingClientRect();
      var tip = tooltipEl.getBoundingClientRect();
      var gap = 8;
      var y = box.top - tip.height - gap;
      if (y < 4) y = box.bottom + gap;
      clampTip(box.left + box.width / 2 - tip.width / 2, y);
    }
    el.addEventListener("pointerenter", function (ev) {
      if (ev.pointerType === "mouse") showAtPointer(ev);
    });
    el.addEventListener("pointermove", function (ev) {
      if (ev.pointerType === "mouse" && !tooltipEl.hidden) placeAtPointer(ev);
    });
    el.addEventListener("pointerleave", function (ev) {
      if (ev.pointerType === "mouse") hideTooltip();
    });
    el.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (!tooltipEl.hidden) { hideTooltip(); return; }
      if (lastPointerType === "mouse") showAtPointer(ev); else showAtElement();
    });
  }

  function hideTooltip() { tooltipEl.hidden = true; }

  function context() {
    return {
      state: state,
      notice: view.notice,
      pending: view.pending,
      setNotice: function (text) { view.notice = text; },
      queue: queueStrike,
      refresh: refresh
    };
  }

  // Picking a piece in the forge menu sets it on the anvil; the strike
  // itself waits for the FORGE! button over the menu.
  function queueStrike(recipe) {
    view.pending = recipe;
    closePanel();
    renderStrike();
  }

  // The button keeps its space in the column so nothing shifts when a
  // strike is queued; it is only made visible and clickable.
  function renderStrike() {
    var btn = $("strike-btn");
    var ready = !!view.pending && !view.striking;
    btn.classList.toggle("idle", !ready);
    btn.disabled = !ready;
    btn.setAttribute("aria-hidden", ready ? "false" : "true");
  }

  function revealsFor(item) {
    return [
      { text: "TIER " + S.tierAt(item.rarity).index, tone: "tier" },
      { text: item.band + " quality", tone: "band-" + item.band.toLowerCase() },
      { text: item.slots + " E. Slot" + (item.slots === 1 ? "" : "s"), tone: "slots" },
      { text: item.edition ? item.editionName + " edition" : "Base edition",
        tone: "edition" }
    ];
  }

  // Each blow pushes a line up off the anvil, so the piece is read out as it
  // is beaten into shape rather than all at once at the end.
  function showReveal(reveal) {
    if (!reveal) return;
    $("reveals").appendChild(P.el("div", "reveal " + reveal.tone, reveal.text));
  }

  function clearReveals() {
    $("reveals").innerHTML = "";
  }

  function doStrike() {
    var recipe = view.pending;
    if (!recipe || view.striking) return;
    // The roll happens before the hammer falls: every blow reveals one more
    // thing about the piece already lying on the anvil.
    var result = G.forge(state, recipe);
    if (!result.ok) {
      view.pending = null;
      renderStrike();
      return;
    }
    // The piece is on the anvil now, so the queue is free again: anything
    // picked during the strike waits its turn instead of being lost.
    view.pending = null;
    view.striking = true;
    renderStrike();
    renderPurse();
    clearReveals();

    var reveals = revealsFor(result.item);
    scene.strike(reveals.length, function (blow) {
      showReveal(reveals[blow - 1]);
    }, function () {
      view.striking = false;
      // Enough left for another of the same piece? Keep it on the anvil so
      // the smith can swing again without reopening the menu.
      if (!view.pending && G.canForge(state, recipe)) view.pending = recipe;
      renderStrike();
      renderHeader();
      showResult(result.item, result.xp);
    });
  }

  function showResult(item, xp) {
    $("pop-name").textContent = item.name;
    var art = $("pop-icon");
    art.innerHTML = "";
    art.appendChild(window.Icons.make(item.icon, "icon big"));
    var stats = $("pop-stats");
    stats.innerHTML = "";
    var rows = [];
    if (item.damage) rows.push(["Damage", String(item.damage)]);
    if (item.armor) rows.push(["Armor", String(item.armor)]);
    rows.push(["Attack speed", item.attackSpeed + "/s"]);
    rows.push(["Crit chance", item.critChance + "%"]);
    rows.push(["Crit damage", item.critDamage + "%"]);
    rows.push(["Armor pen", String(item.armorPen)]);
    rows.push(["Durability", String(item.durability)]);
    rows.push(["Rarity", item.rarity + " · " + item.tier]);
    rows.push(["Quality", item.quality + " · " + item.band]);
    rows.push(["Ench. slots", String(item.slots)]);
    rows.push(["Edition", item.edition + " · " + item.editionName]);
    rows.forEach(function (pair) {
      var row = P.el("div", "popup-stat");
      row.appendChild(P.el("span", "popup-key", pair[0]));
      row.appendChild(P.el("span", "popup-value", pair[1]));
      stats.appendChild(row);
    });
    var note = $("pop-note");
    if (xp) {
      note.textContent = xp.levels
        ? "+" + xp.amount + " XP \u00b7 Level " + xp.level + "!"
        : "+" + xp.amount + " XP";
      note.classList.toggle("level-up", xp.levels > 0);
      note.hidden = false;
    } else {
      note.hidden = true;
    }
    view.shown = item;
    $("pop-sell").textContent = "SELL " + G.sellPrice(item);
    $("result-pop").hidden = false;
  }

  function closeResult() {
    view.shown = null;
    $("result-pop").hidden = true;
    clearReveals();
  }

  // Sell straight off the detail screen, without a trip to the inventory.
  function sellShown() {
    if (!view.shown) return;
    G.sell(state, view.shown.id);
    closeResult();
    renderPurse();
    drawPanel();
  }

  function openPanel(key) {
    var panel = P.BUILDERS[key];
    if (!panel) return;
    view.panel = key;
    view.notice = "";
    hideTooltip();
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
    renderHeader();
    renderStrike();
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
      player.title + " — level " + state.level));
    body.appendChild(P.el("p", null, state.xp + " / " + G.xpToNext(state.level) +
      " XP toward level " + (state.level + 1) + "."));
    G.lockedRecipes(state).forEach(function (recipe) {
      body.appendChild(P.el("p", null,
        recipe.name + " unlocks at level " + recipe.level + "."));
    });
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
    $("strike-btn").addEventListener("click", doStrike);
    $("pop-close").addEventListener("click", closeResult);
    $("pop-sell").addEventListener("click", sellShown);
    $("result-pop").addEventListener("click", function (ev) {
      if (ev.target === $("result-pop")) closeResult();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { closePanel(); closeResult(); hideTooltip(); }
    });
    document.addEventListener("click", hideTooltip);
    window.addEventListener("resize", hideTooltip);
    window.addEventListener("orientationchange", hideTooltip);
    window.addEventListener("scroll", hideTooltip, true);
  }

  function init() {
    renderHeader();
    renderStrike();
    renderPurse();
    renderBuffs();
    renderSlots();
    bindTooltip(document.querySelector(".xp-row"), xpTooltip);
    scene = new window.Forge(document.getElementById("forge-canvas"));
    bindControls();
    scene.start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
