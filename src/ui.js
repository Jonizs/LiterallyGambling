/* Wiring for the forge HUD: purse, buff readouts, tooltips and panels. */
(function () {
  "use strict";

  var S = window.Stats, G = window.Game, P = window.Panels,
      E = window.Enchants, U = window.Upgrades, Save = window.Save;

  var player = {
    name: "JONIS",
    title: "Apprentice blacksmith",
    display: [null, null]
  };

  // Pick up where the last visit left off; a missing or unreadable save
  // just starts a fresh smith.
  var state = Save.load() || G.createState();
  var view = { panel: null, notice: "", pending: null, striking: false,
               shown: null, offer: null };
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

  var REVEAL_HOLD = 650; // ms the last effect gets before the card appears
  var REVEAL_PUSH = 1.8; // em each effect already in the air is shoved up by

  var $ = function (id) { return document.getElementById(id); };
  var tooltipEl = $("tooltip");

  function renderHeader() {
    $("lvl-value").textContent = state.level;
    $("xp-fill").style.width = G.xpPercent(state) + "%";
    renderPanelButtons();
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
      offer: offerView(),
      rollEnchant: rollEnchant,
      takeEnchant: takeEnchant,
      buyUpgrade: buyUpgrade,
      saveInfo: saveInfo,
      devBoost: devBoost,
      startGather: startGather,
      claimGather: claimGather,
      startRefine: startRefine,
      claimRefine: claimRefine,
      stopRefine: stopRefine,
      startCompound: startCompound,
      claimCompound: claimCompound,
      stopCompound: stopCompound,
      wipeSave: wipeSave,
      refresh: refresh
    };
  }

  // The pending offer holds an id, not the piece, so it cannot outlive it.
  function offerFor(id) {
    for (var i = 0; i < state.inventory.length; i++) {
      if (state.inventory[i].id === id) return state.inventory[i];
    }
    return null;
  }

  function offerView() {
    if (!view.offer) return null;
    var item = offerFor(view.offer.itemId);
    if (!item) { view.offer = null; return null; }
    return { item: item, choices: view.offer.choices, fresh: view.offer.fresh };
  }

  // The silver goes at the roll, so the offer is kept until it is taken -
  // closing the panel must not lose what was paid for.
  function rollEnchant(item) {
    var result = E.buyOffer(state, item);
    if (!result.ok) {
      view.notice = result.reason;
      refresh();
      return;
    }
    view.offer = { itemId: item.id, choices: result.choices, fresh: true };
    view.notice = "Paid " + result.cost + " silver for the roll.";
    refresh();
  }

  function buyUpgrade(def) {
    var result = U.buy(state, def);
    view.notice = result.ok
      ? def.name + " tier " + result.tier + " built for " + result.cost + " silver."
      : result.reason;
    refresh();
  }

  function takeEnchant(choice) {
    var pending = offerView();
    if (!pending) return;
    var result = E.apply(pending.item, choice);
    view.offer = null;
    view.notice = result.ok
      ? E.label(choice) + " set into " + pending.item.name + "."
      : result.reason;
    refresh();
  }

  // Picking a piece in the forge menu sets it on the anvil; the strike
  // itself waits for the FORGE! button over the menu.
  function queueStrike(recipe) {
    view.pending = recipe;
    closePanel();
    renderStrike();
  }

  // The button keeps its space in the column so nothing shifts when a
  // strike is queued; it is only made visible and clickable. Anything laid
  // over the scene — a panel or the result card — hides it again.
  function renderStrike() {
    var btn = $("strike-btn");
    var ready = !!view.pending && !view.striking && !view.panel && !view.shown;
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

  // Each blow throws its line off the hammer head, fanning left and right so
  // blows that overlap in the air stay readable.
  function showReveal(reveal, index) {
    if (!reveal) return;
    var fx = P.el("div", "fx " + reveal.tone, reveal.text);
    var at = scene.impactPoint();
    fx.style.left = (at.x * 100) + "%";
    fx.style.top = (at.y * 100) + "%";
    fx.style.setProperty("--dx", (index % 2 ? 1 : -1) * (46 + index * 14) + "px");
    fx.addEventListener("animationend", function () {
      if (fx.parentNode) fx.parentNode.removeChild(fx);
    });
    // Shove everything still in the air up a line so the new one has clear
    // space at the hammer. They all climb at the same rate, so the gap holds.
    var host = $("reveals");
    Array.prototype.forEach.call(host.children, function (older) {
      older.push = (older.push || 0) + REVEAL_PUSH;
      older.style.setProperty("--push", older.push + "em");
    });
    host.appendChild(fx);
  }

  function clearReveals() {
    $("reveals").innerHTML = "";
  }

  function doStrike() {
    var recipe = view.pending;
    if (!recipe || view.striking) return;
    if (recipe.utility) { strikeUtility(recipe); return; }
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
    Save.schedule(state);
    renderStrike();
    renderPurse();
    clearReveals();

    var reveals = revealsFor(result.item);
    scene.strike(reveals.length, function (blow) {
      showReveal(reveals[blow - 1], blow - 1);
    }, function () {
      // Hold the card back until the last effect has flown, or it lands on
      // top of the reveal it was meant to pay off.
      setTimeout(function () {
        view.striking = false;
        // Enough left for another of the same piece? Keep it on the anvil so
        // the smith can swing again without reopening the menu.
        if (!view.pending && G.canForge(state, recipe)) view.pending = recipe;
        renderStrike();
        renderHeader();
        showResult(result.item, result.xp);
      }, REVEAL_HOLD);
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
    renderStrike();
    $("pop-sell").textContent = "SELL " + G.sellPrice(item);
    $("result-pop").hidden = false;
  }

  function closeResult() {
    view.shown = null;
    $("result-pop").hidden = true;
    renderStrike();
    clearReveals();
  }

  // Sell straight off the detail screen, without a trip to the inventory.
  function sellShown() {
    if (!view.shown) return;
    G.sell(state, view.shown.id);
    Save.schedule(state);
    closeResult();
    renderPurse();
    drawPanel();
  }

  // A room the smith has not grown into yet stays shut, and its button says so.
  function panelLocked(key) {
    var panel = P.BUILDERS[key];
    return !!(panel && panel.level && state.level < panel.level);
  }

  function renderPanelButtons() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-panel]"),
      function (btn) {
        var key = btn.dataset.panel;
        var panel = P.BUILDERS[key];
        var locked = panelLocked(key);
        if (btn.dataset.label === undefined) btn.dataset.label = btn.textContent;
        btn.disabled = locked;
        btn.classList.toggle("locked", locked);
        btn.textContent = btn.dataset.label;
        if (locked) {
          btn.title = "Unlocks at smith level " + panel.level + ".";
          btn.appendChild(P.el("span", "btn-lock", "LVL " + panel.level));
        } else {
          btn.removeAttribute("title");
        }
      }
    );
  }

  function openPanel(key) {
    var panel = P.BUILDERS[key];
    if (!panel || panelLocked(key)) return;
    view.panel = key;
    view.notice = "";
    hideTooltip();
    if (key !== "forge") view.lastItem = null;
    drawPanel();
    $("overlay").hidden = false;
    renderStrike();
  }

  function drawPanel() {
    if (!view.panel) return;
    var panel = P.BUILDERS[view.panel];
    $("overlay-title").textContent = panel.title;
    var body = $("overlay-body");
    body.innerHTML = "";
    body.appendChild(panel.build(context()));
    if (view.offer) view.offer.fresh = false;
  }

  function closePanel() {
    view.panel = null;
    $("overlay").hidden = true;
    renderStrike();
  }

  function refresh() {
    G.stipend(state);
    Save.schedule(state);
    renderHeader();
    renderStrike();
    renderPurse();
    renderBuffs();
    renderSlots();
    drawPanel();
  }

  // Utility crafts ride the same queue as a piece: picking one sets it on the
  // anvil, and the FORGE! button takes the blows that finish it. A batch of
  // ten takes two: a working blow, then everything the smith has.
  function affordUtility(craft, qty) {
    return Object.keys(craft.cost).every(function (key) {
      return state.materials[key] >= craft.cost[key] * qty;
    });
  }

  function strikeUtility(job) {
    var craft = job.craft, qty = job.qty;
    if (!affordUtility(craft, qty)) {
      view.pending = null;
      renderStrike();
      return;
    }
    Object.keys(craft.cost).forEach(function (key) {
      state.materials[key] -= craft.cost[key] * qty;
    });
    view.pending = null;
    view.striking = true;
    renderStrike();
    renderPurse();
    clearReveals();

    var blows = qty > 1 ? 2 : 1;
    scene.strike(blows, function (blow) {
      // The haul lands on the blow that finishes the batch.
      if (blow < blows) return;
      state.resources[craft.key] += qty;
      showReveal({ text: qty + " \u00d7 " + craft.name, tone: "tier" }, 0);
      Save.schedule(state);
      renderPurse();
    }, function () {
      setTimeout(function () {
        view.striking = false;
        // Enough left for another? Keep it on the anvil, same as a piece.
        if (!view.pending && affordUtility(craft, qty)) view.pending = job;
        renderStrike();
      }, REVEAL_HOLD);
    }, qty > 1);
  }

  // --- resource yard ------------------------------------------------------
  function startGather(op) {
    var result = window.Gather.start(state, op);
    view.notice = result.ok
      ? op.name + " sent out for " + window.Gather.durationText(op.minutes) + "."
      : result.reason;
    refresh();
  }

  function claimGather() {
    var Ga = window.Gather;
    var result = Ga.claim(state);
    if (!result.ok) {
      view.notice = result.reason;
    } else if (!result.haul.length) {
      view.notice = result.op.name + " came back empty.";
    } else {
      view.notice = result.op.name + " brought back " +
        result.haul.map(function (entry) {
          return entry.qty + " " + Ga.RESOURCES[entry.key].label.toLowerCase();
        }).join(", ") + ".";
    }
    refresh();
  }

  function startRefine(ore, qty) {
    var Re = window.Refine;
    var result = Re.start(state, ore, qty);
    view.notice = result.ok
      ? "Oven " + (result.index + 1) + ": " + result.qty + " " +
        ore.label.toLowerCase() + " ore \u2014 " +
        Re.durationText(Re.batchSeconds(ore, result.qty)) + "."
      : result.reason;
    refresh();
  }

  function claimRefine(index) {
    var result = window.Refine.claim(state, index);
    view.notice = result.ok
      ? "Pulled " + result.qty + " " + result.ore.label.toLowerCase() + " bar" +
        (result.qty === 1 ? "" : "s") + " out of oven " + (index + 1) +
        (result.left ? " \u2014 " + result.left + " still burning." : ".")
      : result.reason;
    refresh();
  }

  function stopRefine(index) {
    var result = window.Refine.stop(state, index);
    view.notice = result.ok
      ? "Oven " + (index + 1) + ": " + result.qty + " " +
        result.ore.label.toLowerCase() + " ore back in the yard. The one in the " +
        "fire burns through."
      : result.reason;
    refresh();
  }

  function startCompound(alloy, qty) {
    var result = window.Compound.start(state, alloy, qty);
    view.notice = result.ok
      ? "Crucible " + (result.index + 1) + ": " + result.qty + " \u00d7 " + alloy.name + "."
      : result.reason;
    refresh();
  }

  function claimCompound(index) {
    var result = window.Compound.claim(state, index);
    view.notice = result.ok
      ? "Pulled " + result.qty + " " + result.alloy.name +
        (result.qty === 1 ? "" : "s") + " out of crucible " + (index + 1) +
        (result.left ? " \u2014 " + result.left + " still cooking." : ".")
      : result.reason;
    refresh();
  }

  function stopCompound(index) {
    var result = window.Compound.stop(state, index);
    view.notice = result.ok
      ? "Crucible " + (index + 1) + ": bars for " + result.qty + " " +
        result.alloy.name + " back on the rack. The pour underway finishes."
      : result.reason;
    refresh();
  }

  // A run out in the yard counts down in the open panel, and ticks over to
  // COLLECT on its own when the clock runs out.
  function startClock() {
    setInterval(function () {
      if (view.panel !== "resource") return;
      if (window.Gather.running(state) || window.Refine.running(state) ||
          window.Compound.running(state)) drawPanel();
    }, 1000);
  }

  // Dev shortcut from the options panel: straight to a rich, high-level smith.
  function devBoost() {
    state.level = 100;
    state.xp = 0;
    state.silver = 100000;
    view.notice = "Dev boost: level 100, 100,000 silver.";
    refresh();
  }

  // Options panel readout: whether the save is working and how old it is.
  function saveInfo() {
    if (!Save.supported()) {
      return { supported: false, text: "Progress cannot be saved in this browser." };
    }
    var at = Save.lastSaved();
    return {
      supported: true,
      text: at ? "Progress saved " + agoText(at) + "." : "Progress saves as you play."
    };
  }

  function agoText(at) {
    var secs = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (secs < 5) return "just now";
    if (secs < 60) return secs + "s ago";
    return Math.round(secs / 60) + "m ago";
  }

  // Wiping starts the smith over: the file goes, and so does everything in
  // memory, or the next save would put the old run straight back.
  function wipeSave() {
    Save.clear();
    state = G.createState();
    view.pending = null;
    view.offer = null;
    view.shown = null;
    closeResult();
    closePanel();
    clearReveals();
    Save.save(state);
    refresh();
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
    G.stipend(state);
    renderHeader();
    renderStrike();
    renderPurse();
    renderBuffs();
    renderSlots();
    bindTooltip(document.querySelector(".xp-row"), xpTooltip);
    scene = new window.Forge(document.getElementById("forge-canvas"));
    bindControls();
    // A tab closed mid-swing still keeps its progress.
    window.addEventListener("beforeunload", function () { Save.flush(state); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") Save.flush(state);
    });
    Save.save(state);
    startClock();
    scene.start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
