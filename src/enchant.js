/* The enchant bench: the odds on the table, the offer, and reforging. */
(function (global) {
  "use strict";

  var E = global.Enchants;
  var el = global.Panels.el, button = global.Panels.button,
      itemLine = global.Panels.itemLine;

  // The odds stay folded away until asked for, and survive a redraw.
  var showOdds = false;

  var FIRST_REVEAL = 0.35; // seconds after the panel lands
  var REVEAL_GAP = 0.5;    // between one enchant and the next

  // What each slot of an offer is rolling against, so the odds are on the
  // table rather than folklore.
  function oddsBoard() {
    var board = el("div", "odds");
    E.odds().forEach(function (band) {
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
    intro.appendChild(el("p", null,
      "Rolling three enchants for a piece costs half what it sells for. " +
      "Each one takes an enchant slot."));
    intro.appendChild(button(showOdds ? "\u00d7" : "?", "chip odds-toggle",
      function () {
        showOdds = !showOdds;
        ctx.refresh();
      }));
    intro.lastChild.title = showOdds ? "Hide the odds." : "What am I rolling against?";
    wrap.appendChild(intro);
    if (showOdds) wrap.appendChild(oddsBoard());

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

      // Strip what is on it and start over, dearer every time.
      if (item.enchants.length) {
        var price = E.reforgeCost(item);
        var again = button("REFORGE " + price, "mini-btn",
          function () { ctx.reforge(item); });
        again.disabled = ctx.state.silver < price;
        again.title = ctx.state.silver < price
          ? "Short " + (price - ctx.state.silver) + " silver."
          : "Strips all " + item.enchants.length + " enchant" +
            (item.enchants.length === 1 ? "" : "s") + " and frees the slots. " +
            "The next reforge of this piece costs " +
            Math.round(price * E.REFORGE_GROWTH) + ".";
        group.appendChild(again);
      }
      row.appendChild(group);
      rows.appendChild(row);
    });
    wrap.appendChild(rows);
    if (ctx.notice) wrap.appendChild(el("div", "notice", ctx.notice));
    return wrap;
  }

  global.Enchant = { build: build };
})(window);
