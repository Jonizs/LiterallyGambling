/* The artifact table: rolling the basic slot and what it can hand over. */
(function (global) {
  "use strict";

  var A = global.Artifacts, I = global.Icons;
  var el = global.Panels.el, button = global.Panels.button;

  // The list of everything the slot holds stays folded away until asked for,
  // and survives a panel redraw.
  var showAll = false;

  function money(value) { return value.toLocaleString(); }

  // One artifact as a row: its face, what it does, and where it stands.
  function artifactRow(ctx, def, opts) {
    var owned = A.owns(ctx.state, def.key);
    var on = A.isEquipped(ctx.state, def.key);
    var row = el("div", "row" + (owned ? "" : " locked"));
    row.appendChild(owned ? I.make(def.icon) : I.shadow(def.icon));
    var main = el("div", "row-main");
    var title = el("div", "row-title", owned ? def.name : "???");
    if (def.permanent) title.appendChild(el("span", "chip-stat tier", "permanent"));
    if (on) title.appendChild(el("span", "chip-stat band-legendary", "on the shelf"));
    main.appendChild(title);
    main.appendChild(el("div", "muted", def.text));
    row.appendChild(main);
    if (opts && opts.action) row.appendChild(opts.action(def, owned, on));
    return row;
  }

  // EQUIP, or the button that takes it back off the shelf.
  function shelfButton(ctx, def, owned, on) {
    if (def.permanent) {
      var always = button("ALWAYS ON", "mini-btn", function () {});
      always.disabled = true;
      always.title = def.name + " works the moment it is found.";
      return always;
    }
    if (on) {
      return button("UNEQUIP", "mini-btn", function () {
        ctx.unequipArtifact(def.key);
      });
    }
    var b = button("EQUIP", "mini-btn strong", function () {
      ctx.equipArtifact(def.key);
    });
    b.disabled = !owned;
    return b;
  }

  function rollBox(ctx) {
    var state = ctx.state;
    var left = A.missing(state);
    var cost = A.rollCost(state);

    var row = el("div", "row");
    var main = el("div", "row-main");
    var title = el("div", "row-title", "Basic artifacts");
    title.appendChild(el("span", "chip-stat tier",
      (A.DEFS.length - left.length) + "/" + A.DEFS.length + " found"));
    main.appendChild(title);
    main.appendChild(el("div", "muted", left.length
      ? "One at random out of the " + left.length + " still missing. Every roll " +
        "costs " + money(A.ROLL_COST) + " more than the last."
      : "The slot is empty — every basic artifact is yours."));
    row.appendChild(main);

    var group = el("div", "btn-group");
    var roll = button(left.length ? "ROLL " + money(cost) : "EMPTY",
      "mini-btn strong", function () { ctx.rollArtifact(); });
    roll.disabled = !left.length || state.silver < cost;
    if (left.length && state.silver < cost) {
      roll.title = "Short " + money(cost - state.silver) + " silver.";
    }
    group.appendChild(roll);
    var help = button("?", "mini-btn", function () {
      showAll = !showAll;
      ctx.refresh();
    });
    help.title = "Everything the basic slot can hand over.";
    group.appendChild(help);
    row.appendChild(group);
    return row;
  }

  // The bench tab: the basic slot and, folded away behind ?, everything it
  // can hand over. What has been found lives in the inventory.
  function build(ctx) {
    var wrap = el("div");
    wrap.appendChild(rollBox(ctx));

    if (showAll) {
      wrap.appendChild(el("div", "row-title", "In the basic slot"));
      var all = el("div", "rows");
      // The catalogue is a read: equipping happens in the inventory.
      A.DEFS.forEach(function (def) { all.appendChild(artifactRow(ctx, def)); });
      wrap.appendChild(all);
    }
    return wrap;
  }

  global.Artifact = { build: build, artifactRow: artifactRow,
    shelfButton: shelfButton };
})(window);
