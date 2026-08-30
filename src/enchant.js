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

  // A row of pips, one per slot on the piece: filled ones wear the rarity of
  // what is in them, empty ones are the slots still open to a roll.
  function slotPips(item) {
    var pips = el("div", "pips");
    for (var i = 0; i < item.slots; i++) {
      var on = item.enchants[i];
      pips.appendChild(el("span", "pip" + (on ? " on " + on.rarity : "")));
    }
    pips.appendChild(el("span", "pips-count",
      item.enchants.length + "/" + item.slots));
    return pips;
  }

  // One piece on the bench: what it is, what is already on it, and the roll.
  function benchCard(ctx, item) {
    var card = el("div", "ench-card");

    var head = el("div", "ench-head");
    head.appendChild(global.Icons.make(item.icon, "icon big"));
    var who = el("div", "ench-who");
    who.appendChild(el("div", "ench-name", item.name));
    var chips = el("div", "ench-chips");
    chips.appendChild(el("span", "chip-stat tier", item.tier));
    chips.appendChild(el("span", "chip-stat band-" + item.band.toLowerCase(),
      item.band));
    who.appendChild(chips);
    who.appendChild(slotPips(item));
    head.appendChild(who);
    card.appendChild(head);

    var list = el("div", "ench-list");
    if (item.enchants.length) {
      item.enchants.forEach(function (entry) {
        var line = el("div", "ench-entry " + entry.rarity);
        line.appendChild(el("span", "ench-entry-name", E.label(entry)));
        line.appendChild(el("span", "ench-entry-text", entry.text));
        list.appendChild(line);
      });
    } else {
      list.appendChild(el("div", "ench-entry empty", "Nothing on it yet."));
    }
    card.appendChild(list);

    var cost = E.costFor(item);
    var free = E.slotsLeft(item);
    var go = button(free > 0 ? "ENCHANT · " + cost : "NO SLOTS LEFT",
      "ench-go", function () { ctx.rollEnchant(item); });
    go.disabled = !E.canEnchant(ctx.state, item);
    if (free <= 0) {
      go.title = "Every slot on this piece is filled.";
    } else if (ctx.state.silver < cost) {
      go.title = "Short " + (cost - ctx.state.silver) + " silver.";
    }
    card.appendChild(go);
    return card;
  }

  // Two states: pick a piece, or pick one of the three the ritual turned up.
  function build(ctx) {
    var wrap = el("div", "ench-panel");

    if (ctx.offer) {
      wrap.appendChild(el("p", "ench-lead",
        "Three came out of the coals for " + ctx.offer.item.name +
        ". One of them goes on the piece."));
      // The panel lands first with three empty slots waiting in it; each one
      // strikes in whole, one at a time.
      var choices = el("div", "offer-cards");
      ctx.offer.choices.forEach(function (choice, i) {
        var fresh = ctx.offer.fresh;
        var at = FIRST_REVEAL + i * REVEAL_GAP;
        var card = el("div", "offer-card " + choice.rarity +
          (fresh ? " offer-reveal" : ""));
        if (fresh) card.style.setProperty("--d", at + "s");

        var main = el("div", "offer-body");
        main.appendChild(el("div", "offer-rarity", choice.rarity));
        main.appendChild(el("div", "offer-name", E.label(choice)));
        main.appendChild(el("div", "offer-text", choice.text));
        card.appendChild(main);

        var take = button("TAKE", "ench-go offer-body", function () {
          ctx.takeEnchant(choice);
        });
        // Nothing is takeable before it has been shown.
        if (fresh) {
          take.disabled = true;
          setTimeout(function () { take.disabled = false; }, (at + 0.3) * 1000);
        }
        card.appendChild(take);
        choices.appendChild(card);
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
    intro.appendChild(el("p", "ench-lead",
      "Rolling three enchants for a piece costs half what it sells for. " +
      "Each one takes an enchant slot."));
    intro.appendChild(button(showOdds ? "\u00d7" : "?", "chip odds-toggle",
      function () {
        showOdds = !showOdds;
        ctx.refresh();
      }));
    intro.lastChild.title = showOdds ? "Hide the odds." : "What am I rolling against?";
    wrap.appendChild(intro);
    if (showOdds) wrap.appendChild(oddsBoard(ctx.state));

    var grid = el("div", "ench-grid");
    items.forEach(function (item) {
      grid.appendChild(benchCard(ctx, item));
    });
    wrap.appendChild(grid);
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
