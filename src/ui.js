/* Wiring for the forge HUD: purse, buff readouts, tooltips and panels. */
(function () {
  "use strict";

  var S = window.Stats, G = window.Game, P = window.Panels,
      E = window.Enchants, U = window.Upgrades, A = window.Artifacts,
      Save = window.Save;

  var player = {
    title: "Apprentice blacksmith",
    display: [null, null]
  };

  function smithName() { return state.smith || "SMITH"; }

  // Pick up where the last visit left off; a missing or unreadable save
  // just starts a fresh smith.
  var state = Save.load() || G.createState();
  var view = { panel: null, notice: "", pending: null, striking: false,
               shown: null, offer: null, replacing: null };
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
    $("player-name").textContent = smithName();
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
    // Stock itself is counted in the inventory, not carried in the purse.
    purse.appendChild(coins);
  }

  function renderBuffs() {
    var grid = $("buff-grid");
    grid.innerHTML = "";
    Object.keys(S.STATS).forEach(function (key) {
      var stat = S.STATS[key];
      var value = state.base[key];
      var win = A.luck(state, key);
      var cell = P.el("div", "buff");

      var name = P.el("div", "buff-name");
      name.innerHTML = stat.label + " <b>" + value + "</b>";
      var delta = P.el("div", "buff-delta");
      delta.innerHTML =
        '<span class="up">+' + win.up + '</span>' +
        '<span class="sep">/</span>' +
        '<span class="down">' + win.down + "</span>";

      var help = P.el("button", "help", "?");
      help.type = "button";
      help.setAttribute("aria-label", stat.label + " info");
      bindTooltip(help, buffTooltip(key, stat, value, win));

      cell.appendChild(name);
      cell.appendChild(delta);
      cell.appendChild(help);
      grid.appendChild(cell);
    });
  }

  // Tooltip: the rule for the stat, then the window it can roll into now.
  function buffTooltip(key, stat, value, win) {
    var range = S.rollRange(key, value, win);
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
    if (!row) return;   // no display case on the sidebar for now
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
      reforge: reforge,
      buyUpgrade: buyUpgrade,
      rollArtifact: rollArtifact,
      equipArtifact: equipArtifact,
      unequipArtifact: unequipArtifact,
      saveInfo: saveInfo,
      devBoost: devBoost,
      devUnlockAll: devUnlockAll,
      startGather: startGather,
      claimGather: claimGather,
      rushGather: rushGather,
      startRefine: startRefine,
      claimRefine: claimRefine,
      stopRefine: stopRefine,
      rushRefine: rushRefine,
      startCompound: startCompound,
      claimCompound: claimCompound,
      stopCompound: stopCompound,
      rushCompound: rushCompound,
      discover: discover,
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

  function reforge(item, indexes) {
    var result = window.Enchants.reforge(state, item, indexes);
    view.notice = result.ok
      ? "Stripped " + result.removed + " enchant" + (result.removed === 1 ? "" : "s") +
        " off " + item.name + " for " + result.cost + " silver" +
        (result.kept ? ", " + result.kept + " left on." : ".")
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

  // Anything the smith does other than swinging - opening a menu, walking to
  // another workstation - takes the queued piece back off the anvil.
  function cancelPending() {
    if (!view.pending || view.striking) return;
    view.pending = null;
    renderStrike();
  }

  // The button keeps its space in the column so nothing shifts when a
  // strike is queued; it is only made visible and clickable. Anything laid
  // over the scene — a panel or the result card — hides it again.
  var strikeTimer = null;
  function renderStrike() {
    var btn = $("strike-btn");
    var ready = !!view.pending && !view.striking && !view.panel && !view.shown;
    if (strikeTimer) { clearTimeout(strikeTimer); strikeTimer = null; }
    // Coming up, the button waits for the menu to get out of the way; going
    // away it leaves at once.
    if (ready && btn.classList.contains("idle")) {
      strikeTimer = setTimeout(function () {
        strikeTimer = null;
        if (!view.pending || view.striking || view.panel || view.shown) return;
        btn.classList.remove("idle");
        btn.disabled = false;
        btn.setAttribute("aria-hidden", "false");
      }, 260);
      syncBoard();
      return;
    }
    btn.classList.toggle("idle", !ready);
    btn.disabled = !ready;
    btn.setAttribute("aria-hidden", ready ? "false" : "true");
    syncBoard();
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
    // A craft that hands back something with a face shows it off the anvil.
    if (reveal.icon) fx.insertBefore(window.Icons.make(reveal.icon), fx.firstChild);
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
    if (recipe.part) { strikePart(recipe); return; }
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

  // A discovered recipe closes the bench and turns in a case on the forge.
  function discover(recipe) {
    closePanel();
    view.notice = "";
    $("discover-name").textContent = recipe.name;
    var art = $("discover-icon");
    art.innerHTML = "";
    art.appendChild(window.Icons.make(recipe.icon, "icon big"));
    $("discover-pop").hidden = false;
    refresh();
  }

  function closeDiscovery() {
    $("discover-pop").hidden = true;
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
    // Forge-only panels stay shut while the smith is away from the anvil.
    var btn = document.querySelector('[data-panel="' + key + '"][data-at-forge]');
    if (btn && scene && (scene.wipe ? scene.wipe.next : scene.room) !== "forge") {
      return;
    }
    // Swapping one open menu for another is its own move: the card is not
    // coming up off the floor, so it steps over instead.
    var swapping = !$("overlay").hidden && view.panel && view.panel !== key;
    cancelPending();
    view.panel = key;
    view.notice = "";
    hideTooltip();
    if (key !== "forge") view.lastItem = null;
    // A menu opening cuts short any slide still on its way out.
    clearTimeout(closing);
    var card = menuCard();
    if (card) card.classList.remove("closing", "swapping");
    drawPanel();
    $("overlay").hidden = false;
    if (swapping && card) {
      void card.offsetWidth;   // let the class land as a fresh animation
      card.classList.add("swapping");
    }
    renderStrike();
    syncRoomButtons();
  }

  // Which tab is lit in each of a panel's strips, top strip first. A panel
  // can carry more than one - the lab picks a side, then a section - and each
  // is watched on its own.
  function tabMarks(root) {
    return Array.prototype.map.call(root.querySelectorAll(".tabs"),
      function (strip) {
        var tabs = strip.querySelectorAll(".tab");
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].classList.contains("on")) return i;
        }
        return -1;
      });
  }

  function drawPanel() {
    if (!view.panel) return;
    var panel = P.BUILDERS[view.panel];
    $("overlay-title").textContent = panel.title;
    var body = $("overlay-body");
    var was = tabMarks(body);
    body.innerHTML = "";
    body.appendChild(panel.build(context()));
    // Stepping along any strip swipes what that strip governs: right for a
    // step right, left for a step left. The strip itself stays put.
    var now = tabMarks(body);
    var strips = body.querySelectorAll(".tabs");
    for (var i = 0; i < now.length && i < was.length; i++) {
      if (was[i] < 0 || now[i] < 0 || now[i] === was[i]) continue;
      var page = strips[i] && strips[i].parentElement;
      if (page) page.classList.add(now[i] > was[i] ? "swipe-right" : "swipe-left");
      break;
    }
    if (view.offer) view.offer.fresh = false;
  }

  // The menu slides back down before it is taken off screen; the panel is
  // closed as far as the game is concerned the moment the button is pressed.
  var CLOSE_MS = 190;
  var closing = null;

  function menuCard() { return document.querySelector(".overlay-card"); }

  function closePanel() {
    // Closing a menu leaves the smith wherever he was standing.
    view.panel = null;
    var overlay = $("overlay"), card = menuCard();
    if (!overlay.hidden && card) {
      card.classList.add("closing");
      clearTimeout(closing);
      closing = setTimeout(function () {
        overlay.hidden = true;
        card.classList.remove("closing");
      }, CLOSE_MS);
    } else {
      overlay.hidden = true;
    }
    renderStrike();
    syncRoomButtons();
  }

  // Which room the smith is in (or walking to) decides what the scene buttons
  // say: the button for the room he is standing in walks him back to the
  // forge, and the top button opens that room's menu.
  var ROOM_UI = {
    forge: { label: "FORGE", short: "FORGE", panel: "forge" },
    lab: { label: "RESOURCE & EXPERIMENT", short: "LAB", panel: "lab" },
    enchant: { label: "ENCHANTING", short: "ENCHANT", panel: "enchant" },
    awaken: { label: "AWAKEN", short: "AWAKEN", panel: "awaken" },
    polish: { label: "POLISH", short: "POLISH", panel: "polish" }
  };
  // The buff carving is part of the forge wall, so it is only there when the
  // forge is: it goes with the wipe and stays out from under an open menu.
  var boardTimer = null;
  function syncBoard() {
    var home = scene && scene.room === "forge" && !scene.wipe;
    var board = $("buff-board");
    var show = home && !view.panel;
    if (boardTimer) { clearTimeout(boardTimer); boardTimer = null; }
    if (!show) { board.hidden = true; return; }
    // Let the closing menu clear the wall before the carving comes back.
    if (board.hidden) {
      boardTimer = setTimeout(function () {
        boardTimer = null;
        var still = scene && scene.room === "forge" && !scene.wipe && !view.panel;
        if (still) board.hidden = false;
      }, 260);
      return;
    }
    board.hidden = false;
  }

  // The lab draws its ovens and crucibles lit or cold, so it needs to know
  // which of them are working.
  function syncWork() {
    if (!scene) return;
    var ovens = [], crucibles = [], i;
    for (i = 0; i < window.Refine.OVENS; i++) {
      ovens.push(!!window.Refine.slot(state, i));
    }
    for (i = 0; i < window.Compound.CRUCIBLES; i++) {
      crucibles.push(!!window.Compound.slot(state, i));
    }
    scene.work.ovens = ovens;
    scene.work.crucibles = crucibles;
  }

  function syncRoomButtons() {
    if (!scene) return;
    var at = scene.wipe ? scene.wipe.next : scene.room;
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-home]"),
      function (btn) {
        var home = btn.dataset.home, here = at === home;
        var panel = ROOM_UI[home].panel, locked = panelLocked(panel);
        // A workstation button always says where it goes; the one you are
        // standing in is simply marked as where you are.
        btn.dataset.room = home;
        // Name and level requirement are their own spans on one row, so a
        // long name wraps inside itself rather than pushing the badge down.
        btn.textContent = "";
        btn.appendChild(P.el("span", "btn-name", ROOM_UI[home].label));
        btn.classList.toggle("here", here);
        btn.disabled = locked;
        btn.classList.toggle("locked", locked);
        if (locked) {
          btn.title = "Unlocks at smith level " + P.BUILDERS[panel].level + ".";
          btn.appendChild(P.el("span", "btn-lock",
            "LVL " + P.BUILDERS[panel].level));
        } else {
          btn.removeAttribute("title");
        }
      }
    );
    // The shop, the inventory and the upgrade tree are the forge's own: they
    // are only reachable while the smith is standing at it.
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-at-forge]"),
      function (btn) {
        var away = at !== "forge";
        btn.disabled = away;
        btn.classList.toggle("locked", away);
        if (away) btn.title = "Back at the forge.";
        else btn.removeAttribute("title");
      }
    );
    // At the forge the anvil is the way in, so the tab has nothing to say.
    var menu = $("scene-btn");
    menu.hidden = at === "forge";
    menu.dataset.panel = ROOM_UI[at].panel;
    // renderPanelButtons redraws from the cached label, so move that too.
    menu.dataset.label = ROOM_UI[at].short;
    menu.textContent = menu.dataset.label;
    syncBoard();
  }

  // The forge has no offscreen room of its own, so its banner is cut out of
  // the scene canvas itself, once it has painted a frame.
  function forgeBanner() {
    var canvas = $("forge-canvas");
    if (!canvas || !scene || scene.room !== "forge") return "";
    // The working half of the forge, cut to the same shape as the other
    // banners: the hearth mouth with the fire in it, the coal bed, and the
    // anvil standing in front of it.
    var x = 62, y = 56, w = 170, h = 62;
    var out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    var oc = out.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    return out.toDataURL();
  }

  // Each workstation button wears a cutout of its own room, darkened just
  // enough that the label still reads over it.
  function dressRoomButtons() {
    if (!window.Rooms || !window.Rooms.banner) return;
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-home]"),
      function (btn) {
        // One room failing to paint must not cost the others their art.
        var art;
        try {
          art = btn.dataset.home === "forge"
            ? forgeBanner() : window.Rooms.banner(btn.dataset.home);
        } catch (err) {
          return;
        }
        if (!art) return;
        btn.style.backgroundImage =
          "linear-gradient(rgba(8,4,2,.52), rgba(8,4,2,.52)), url(" + art + ")";
      }
    );
  }

  function walkTo(room) {
    if (!scene) return;
    if (panelLocked(ROOM_UI[room].panel)) return;
    cancelPending();
    if (view.panel) closePanel();
    scene.setRoom(room);
    syncRoomButtons();
  }

  function refresh() {
    G.stipend(state);
    Save.schedule(state);
    renderHeader();
    renderStrike();
    renderPurse();
    renderBuffs();
    renderSlots();
    syncShelf();
    syncWork();
    syncRoomButtons();
    drawPanel();
  }

  // Utility crafts and parts ride the same queue as a piece: picking one sets
  // it on the anvil, and the FORGE! button finishes it. A batch of more than
  // one takes two blows: a working blow, then everything the smith has.
  function afford(need, qty) {
    return G.missingFor(state, G.scaleNeed(need, qty)).length === 0;
  }

  function strikeUtility(job) {
    var craft = job.craft, qty = job.qty;
    if (!afford(craft, qty)) {
      view.pending = null;
      renderStrike();
      return;
    }
    G.spend(state, G.scaleNeed(craft, qty));
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
        if (!view.pending && afford(craft, qty)) view.pending = job;
        renderStrike();
      }, REVEAL_HOLD);
    }, qty > 1);
  }

  // Parts take the iron rather than the hammer: it is held to the work for
  // SOLDER_SECONDS, throwing sparks, and the part is there when it lifts.
  var SOLDER_SECONDS = 3;

  function strikePart(job) {
    var part = job.part, qty = job.qty;
    if (!afford(part, qty)) {
      view.pending = null;
      renderStrike();
      return;
    }
    G.spend(state, G.scaleNeed(part, qty));
    view.pending = null;
    view.striking = true;
    renderStrike();
    renderPurse();
    clearReveals();

    scene.solder(SOLDER_SECONDS, function () {
      state.parts[part.key] += qty;
      showReveal({ text: qty + " \u00d7 " + part.name, tone: "tier",
        icon: part.icon }, 0);
      Save.schedule(state);
      renderPurse();
      setTimeout(function () {
        view.striking = false;
        if (!view.pending && afford(part, qty)) view.pending = job;
        renderStrike();
      }, REVEAL_HOLD);
    });
  }

  // --- artifacts ----------------------------------------------------------
  // What the shelf in the scene is holding. Permanent pieces hang on their
  // own peg, so they never cost a slot.
  function syncShelf() {
    if (!scene) return;
    scene.shelf.keys = A.equippedDefs(state).map(function (def) { return def.icon; });
    scene.shelf.permanent = A.DEFS.filter(function (def) {
      return def.permanent && A.owns(state, def.key);
    }).map(function (def) { return def.icon; });
    scene.shelf.picking = !!view.replacing;
    if (!view.replacing) sceneLeave();
  }

  function rollArtifact() {
    var result = A.roll(state);
    view.notice = result.ok
      ? "Found " + result.def.name + " for " + result.cost.toLocaleString() +
        " silver — " + result.def.text + "."
      : result.reason;
    refresh();
  }

  // A full shelf sends the smith to the scene to pick what comes off.
  function equipArtifact(key) {
    var result = A.equip(state, key);
    if (result.full) {
      view.replacing = key;
      closePanel();
      renderPickHint();
      syncShelf();
      return;
    }
    view.notice = result.ok
      ? result.def.name + " is on the shelf." : result.reason;
    refresh();
  }

  function unequipArtifact(key) {
    var result = A.unequip(state, key);
    view.notice = result.ok
      ? result.def.name + " is back in the drawer." : result.reason;
    refresh();
  }

  // The slot picked in the scene decides what the new artifact replaces.
  function replaceAt(index) {
    var coming = A.defFor(view.replacing);
    var shelf = A.equippedDefs(state);
    var going = shelf[index];
    if (!coming || !going) return;
    var result = A.equip(state, coming.key, going.key);
    view.replacing = null;
    renderPickHint();
    view.notice = result.ok
      ? coming.name + " takes " + going.name + "'s place on the shelf."
      : result.reason;
    refresh();
  }

  function cancelReplace() {
    if (!view.replacing) return;
    view.replacing = null;
    renderPickHint();
    syncShelf();
  }

  function renderPickHint() {
    var hint = $("pick-hint");
    var def = view.replacing ? A.defFor(view.replacing) : null;
    hint.textContent = def
      ? "Pick what " + def.name + " replaces on the shelf. Esc to cancel."
      : "";
    hint.hidden = !def;
  }

  // Which shelf slot a pointer event is over, or -1. Only slots with an
  // artifact in them count.
  // Where a pointer event lands in the scene's own 256x160 pixels.
  function scenePoint(ev) {
    var canvas = $("forge-canvas");
    var box = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - box.left) / box.width * canvas.width,
      y: (ev.clientY - box.top) / box.height * canvas.height
    };
  }

  function slotUnder(ev) {
    var at = scenePoint(ev);
    var slot = window.Shelf.slotAt(at.x, at.y);
    return slot >= 0 && slot < A.equippedDefs(state).length ? slot : -1;
  }

  // The anvil answers the pointer while the forge is the room on screen and
  // nothing else is waiting on a click.
  function anvilUnder(ev) {
    if (!scene || scene.room !== "forge" || scene.wipe) return false;
    if (view.replacing || view.panel || view.shown) return false;
    var at = scenePoint(ev);
    return scene.anvilAt(at.x, at.y);
  }

  // The slot under the pointer lights up while a pick is waiting.
  function sceneMove(ev) {
    if (!scene) return;
    var slot = view.replacing ? slotUnder(ev) : -1;
    scene.shelf.hover = slot;
    scene.anvilHover = anvilUnder(ev);
    $("forge-canvas").style.cursor =
      slot >= 0 || scene.anvilHover ? "pointer" : "";
  }

  function sceneLeave() {
    if (!scene) return;
    scene.shelf.hover = -1;
    scene.anvilHover = false;
    $("forge-canvas").style.cursor = "";
  }

  // A click means the shelf while a pick is waiting, and the anvil otherwise.
  function sceneClick(ev) {
    if (view.replacing) {
      var slot = slotUnder(ev);
      if (slot >= 0) replaceAt(slot);
      return;
    }
    if (anvilUnder(ev)) openPanel("forge");
  }

  // --- resource yard ------------------------------------------------------
  function startGather(op) {
    var result = window.Gather.start(state, op);
    view.notice = result.ok
      ? op.name + " sent out for " + window.Gather.durationText(op.minutes) + "."
      : result.reason;
    refresh();
  }

  function rushGather() {
    var result = window.Gather.rush(state);
    view.notice = result.ok
      ? result.op.name + " called straight back for " +
        result.cost.toLocaleString() + " silver."
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

  function rushRefine(index) {
    var result = window.Refine.rush(state, index);
    view.notice = result.ok
      ? "Oven " + (index + 1) + " forced through for " +
        result.cost.toLocaleString() + " silver."
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

  function rushCompound(index) {
    var result = window.Compound.rush(state, index);
    view.notice = result.ok
      ? "Crucible " + (index + 1) + " poured out for " +
        result.cost.toLocaleString() + " silver."
      : result.reason;
    refresh();
  }

  // A run out in the yard counts down in the open panel, and ticks over to
  // COLLECT on its own when the clock runs out.
  function startClock() {
    setInterval(function () {
      syncWork();
      if (view.panel !== "lab") return;
      if (window.Gather.running(state) || window.Refine.running(state) ||
          window.Compound.running(state)) drawPanel();
    }, 1000);
  }

  // Dev shortcut from the options panel: straight to a rich, high-level smith.
  function devBoost() {
    state.level = 100;
    state.xp = 0;
    state.silver = 10000000;
    view.notice = "Dev boost: level 100, 10,000,000 silver.";
    refresh();
  }

  // Dev shortcut: writes every researchable recipe straight into the book.
  function devUnlockAll() {
    var added = 0;
    window.Game.RECIPES.forEach(function (recipe) {
      if (!recipe.research || state.known.indexOf(recipe.key) >= 0) return;
      state.known.push(recipe.key);
      added++;
    });
    view.notice = added ? "Dev unlock: " + added + " recipe" + (added === 1 ? "" : "s") +
      " worked out." : "Dev unlock: every recipe is already known.";
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
    view.replacing = null;
    renderPickHint();
    closeResult();
    closePanel();
    clearReveals();
    Save.save(state);
    refresh();
    askName();
  }

  function openProfile() {
    view.panel = null;
    $("overlay-title").textContent = smithName();
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
    S.forecast(state.base, function (key) { return A.luck(state, key); })
      .forEach(function (row) {
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
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-home]"),
      function (btn) {
        btn.addEventListener("click", function () { walkTo(btn.dataset.room); });
      }
    );
    if ($("name-go")) {
      $("name-go").addEventListener("click", takeName);
      $("name-input").addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") takeName();
      });
    }
    $("overlay-close").addEventListener("click", closePanel);
    $("discover-close").addEventListener("click", closeDiscovery);
    $("discover-pop").addEventListener("click", function (ev) {
      if (ev.target === $("discover-pop")) closeDiscovery();
    });
    $("overlay").addEventListener("click", function (ev) {
      if (ev.target === $("overlay")) closePanel();
    });
    $("btn-profile").addEventListener("click", openProfile);
    $("strike-btn").addEventListener("click", doStrike);
    $("forge-canvas").addEventListener("click", sceneClick);
    $("forge-canvas").addEventListener("pointermove", sceneMove);
    $("forge-canvas").addEventListener("pointerleave", sceneLeave);
    $("pop-close").addEventListener("click", closeResult);
    $("pop-sell").addEventListener("click", sellShown);
    $("result-pop").addEventListener("click", function (ev) {
      if (ev.target === $("result-pop")) closeResult();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        cancelReplace();
        closePanel(); closeResult(); closeDiscovery(); hideTooltip();
      }
    });
    document.addEventListener("click", hideTooltip);
    window.addEventListener("resize", hideTooltip);
    window.addEventListener("orientationchange", hideTooltip);
    window.addEventListener("scroll", hideTooltip, true);
  }

  // A fresh playthrough has nobody at the anvil yet, so it asks for a name
  // before the first strike. An empty answer keeps the default.
  function askName() {
    var pop = $("name-pop"), input = $("name-input");
    // An old cached page may not carry the card; the smith just keeps the
    // default rather than the whole boot falling over.
    if (!pop || !input) { state.smith = state.smith || "SMITH"; return; }
    pop.hidden = false;
    input.value = "";
    input.focus();
  }

  function takeName() {
    var typed = ($("name-input").value || "").trim().slice(0, 14);
    state.smith = typed || "SMITH";
    $("name-pop").hidden = true;
    Save.save(state);
    refresh();
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
    scene.onSettled = syncBoard;
    // Until this runs the buttons are still as the page authored them: no
    // level badges and nothing shut, so a fresh load could walk into a room
    // the smith has not earned.
    syncRoomButtons();
    syncWork();
    syncShelf();
    bindControls();
    // A tab closed mid-swing still keeps its progress.
    window.addEventListener("beforeunload", function () { Save.flush(state); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") Save.flush(state);
    });
    Save.save(state);
    startClock();
    scene.start();
    // One frame in, the forge is on the canvas and every banner can be cut.
    requestAnimationFrame(function () { dressRoomButtons(); });
    if (!state.smith) askName();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
