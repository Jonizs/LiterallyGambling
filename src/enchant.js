/* The enchant bench: the odds on the table, the offer, and revitalising. */
(function (global) {
  "use strict";

  var E = global.Enchants;
  var el = global.Panels.el, button = global.Panels.button,
      itemLine = global.Panels.itemLine;

  // The odds stay folded away until asked for, and survive a redraw.
  var showOdds = false;

  // The piece being picked over, and which of its enchants are marked to go.
  var reforgeId = null;
  var picked = {};

  function startReforge(id) {
    reforgeId = id;
    picked = {};
  }

  function endReforge() {
    reforgeId = null;
    picked = {};
  }

  function pickedList() {
    return Object.keys(picked).filter(function (i) { return picked[i]; })
      .map(Number);
  }

  // The strip menu: every enchant on the piece, any number of them marked.
  function reforgeMenu(ctx, item) {
    var wrap = el("div");
    wrap.appendChild(el("p", null,
      "Pick what comes off " + item.name + ". Everything left stays on the " +
      "piece, and each freed slot can be rolled again."));

    var rows = el("div", "rows");
    item.enchants.forEach(function (entry, i) {
      var on = !!picked[i];
      var row = el("div", "row offer " + entry.rarity + (on ? " picked" : ""));
      var main = el("div", "row-main");
      var title = el("div", "row-title", E.label(entry));
      title.appendChild(el("span", "chip-stat rarity-" + entry.rarity, entry.rarity));
      main.appendChild(title);
      main.appendChild(el("div", "muted", entry.text));
      row.appendChild(main);
      row.appendChild(button(on ? "PICKED" : "PICK",
        "mini-btn" + (on ? " strong" : ""), function () {
          picked[i] = !picked[i];
          ctx.refresh();
        }));
      rows.appendChild(row);
    });
    wrap.appendChild(rows);

    var chosen = pickedList();
    var cost = E.reforgeCost(item);
    var actions = el("div", "btn-group");
    var go = button("STRIP " + chosen.length + " \u00b7 " + cost, "mini-btn strong",
      function () {
        ctx.reforge(item, chosen);
        endReforge();
        ctx.refresh();
      });
    go.disabled = !chosen.length || ctx.state.silver < cost;
    go.title = !chosen.length ? "Pick at least one enchant."
      : ctx.state.silver < cost
        ? "Short " + (cost - ctx.state.silver) + " silver."
        : "The next revitalise of this piece costs " +
          Math.round(cost * E.REFORGE_GROWTH) + ".";
    actions.appendChild(go);
    actions.appendChild(button("CANCEL", "mini-btn", function () {
      endReforge();
      ctx.refresh();
    }));
    wrap.appendChild(actions);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  var FIRST_REVEAL = 0.35; // seconds after the panel lands
  var REVEAL_GAP = 0.5;    // between one enchant and the next

  // What each slot of an offer is rolling against, so the odds are on the
  // table rather than folklore.
  function oddsBoard(state) {
    var board = el("div", "odds");
    E.odds(state).forEach(function (band) {
      var group = el("div", "odds-band " + band.rarity);
      var head = el("div", "row-title", band.rarity);
      head.appendChild(el("span", "chip-stat rarity-" + band.rarity,
        band.chance + "% a slot"));
      head.appendChild(el("span", "chip-stat", band.each + "% each"));
      group.appendChild(head);
      band.entries.forEach(function (entry) {
        var line = el("div", "odds-line");
        line.appendChild(el("span", "odds-name", entry.name));
        E.tierOdds(entry.maxTier).forEach(function (tier) {
          line.appendChild(el("span", "chip-stat tier",
            ["", "I", "II", "III"][tier.value] + " " + tier.chance + "%"));
        });
        line.appendChild(el("span", "muted", entry.text));
        group.appendChild(line);
      });
      board.appendChild(group);
    });
    return board;
  }

  // Two states: pick a piece, or pick one of the three the ritual turned up.
  function build(ctx) {
    var wrap = el("div");

    if (ctx.offer) {
      wrap.appendChild(el("p", null,
        "Three came out of the coals for " + ctx.offer.item.name +
        ". One of them goes on the piece."));
      // The panel lands first with three empty slots waiting in it; each one
      // strikes in whole, one at a time.
      var choices = el("div", "rows");
      ctx.offer.choices.forEach(function (choice, i) {
        var fresh = ctx.offer.fresh;
        var at = FIRST_REVEAL + i * REVEAL_GAP;
        var row = el("div", "row offer " + choice.rarity +
          (fresh ? " offer-reveal" : ""));
        if (fresh) row.style.setProperty("--d", at + "s");

        var main = el("div", "row-main offer-body");
        var title = el("div", "row-title", E.label(choice));
        title.appendChild(el("span", "chip-stat rarity-" + choice.rarity, choice.rarity));
        main.appendChild(title);
        main.appendChild(el("div", "muted", choice.text));
        row.appendChild(main);

        var take = button("TAKE", "mini-btn strong offer-body", function () {
          ctx.takeEnchant(choice);
        });
        // Nothing is takeable before it has been shown.
        if (fresh) {
          take.disabled = true;
          setTimeout(function () { take.disabled = false; }, (at + 0.3) * 1000);
        }
        row.appendChild(take);
        choices.appendChild(row);
      });
      wrap.appendChild(choices);
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }

    var items = ctx.state.inventory;

    if (!items.length) {
      wrap.appendChild(el("p", "empty", "Nothing on the rack to enchant yet."));
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }
    var intro = el("div", "intro-row");
    intro.appendChild(button(showOdds ? "\u00d7" : "?", "chip odds-toggle",
      function () {
        showOdds = !showOdds;
        ctx.refresh();
      }));
    intro.lastChild.title = showOdds ? "Hide the odds." : "What am I rolling against?";
    wrap.appendChild(intro);
    // The odds are their own panel with its own scroll, so the pieces stay
    // where they are underneath rather than being pushed off the wall.
    if (showOdds) {
      var board = el("div", "odds-panel");
      board.appendChild(el("div", "odds-head", "What a slot rolls against"));
      board.appendChild(oddsBoard(ctx.state));
      wrap.appendChild(board);
    }

    var rows = el("div", "rows");
    items.forEach(function (item) {
      var row = el("div", "row");
      row.appendChild(itemLine(item));
      var cost = E.costFor(item);
      var free = E.slotsLeft(item);
      var group = el("div", "btn-group");
      var b = button(free > 0 ? "ENCHANT " + cost : "NO SLOTS", "mini-btn",
        function () { ctx.rollEnchant(item); });
      b.disabled = !E.canEnchant(ctx.state, item);
      if (free <= 0) {
        b.title = "Every slot on this piece is filled.";
      } else if (ctx.state.silver < cost) {
        b.title = "Short " + (cost - ctx.state.silver) + " silver.";
      }
      group.appendChild(b);

      row.appendChild(group);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  // The table's second bar: strip what is already on a piece and start over,
  // dearer every time.
  function revitalise(ctx) {
    var wrap = el("div");
    var items = ctx.state.inventory.filter(function (entry) {
      return entry.enchants.length;
    });

    // A piece being picked over holds the menu until it is done.
    if (reforgeId !== null) {
      var picking = items.filter(function (entry) {
        return entry.id === reforgeId;
      })[0];
      if (picking) return reforgeMenu(ctx, picking);
      endReforge();
    }

    if (!items.length) {
      wrap.appendChild(el("p", "empty", "Nothing on the rack is enchanted yet."));
      if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
      return wrap;
    }

    wrap.appendChild(el("p", null,
      "Take enchants back off a piece and free their slots to be rolled " +
      "again. Every revitalise of the same piece costs more than the last."));

    var rows = el("div", "rows");
    items.forEach(function (item) {
      var row = el("div", "row");
      row.appendChild(itemLine(item));
      var price = E.reforgeCost(item);
      var again = button("REVITALIZE " + price, "mini-btn", function () {
        startReforge(item.id);
        ctx.refresh();
      });
      again.disabled = ctx.state.silver < price;
      again.title = ctx.state.silver < price
        ? "Short " + (price - ctx.state.silver) + " silver."
        : "Pick which enchants come off. The next revitalise of this piece " +
          "costs " + Math.round(price * E.REFORGE_GROWTH) + ".";
      row.appendChild(again);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Enchant = { build: build, revitalise: revitalise };
})(window);
