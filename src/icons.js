/* 16x16 pixel icons for the forgeable pieces. */
(function (global) {
  "use strict";

  var C = {
    steel: "#b9bcc8", steelDark: "#6c707e", steelLit: "#e6e9f2",
    wood: "#8a5a2b", woodDark: "#5c3a1e", woodLit: "#ab7440",
    leather: "#7d4a24", leatherDark: "#4e2d14", leatherLit: "#a36733",
    gold: "#d9ac4f", goldDark: "#8f6d29", goldLit: "#f5dd9a",
    shadow: "#241a12", string: "#e8dcc0", silhouette: "#1b1712",
    stone: "#6b6560", stoneDark: "#33302c", stoneLit: "#928a80",
    brick: "#8a4b34", brickDark: "#41221a", brickLit: "#b06a48",
    lava: "#ff8a24", lavaLit: "#ffd76a", lavaDark: "#c2450d",
    cold: "#191310", mortar: "#57504a",
    blood: "#a3172a", bloodLit: "#e0384a", dark: "#2b2430", darkLit: "#4a3f52"
  };

  // What each metal looks like as a poured bar, near enough to the real thing.
  var METAL = {
    bronze:  { base: "#a9662c", dark: "#5f3413", lit: "#e09a4e" },
    silver:  { base: "#c3c9d4", dark: "#767e8d", lit: "#f2f5fb" },
    gold:    { base: "#d9ac4f", dark: "#8f6d29", lit: "#f7e29b" },
    crystal: { base: "#69c6d8", dark: "#2c6b7d", lit: "#c4f2fb" }
  };

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  // Weapon icons are drawn on a finer grid: every tile square is split into
  // four, so hpx() places half-pixels and its coordinates run 0-31, not 0-15.
  function hpx(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x / 2, y / 2, w / 2, h / 2);
  }

  // paint(), for a mask written on that 32x32 grid.
  function paintFine(c, mask, palette) {
    for (var y = 0; y < mask.length; y++) {
      var row = mask[y];
      for (var x = 0; x < row.length; x++) {
        var color = palette[row.charAt(x)];
        if (color) hpx(c, x, y, 1, 1, color);
      }
    }
  }

  var DRAW = {
    // --- weapons ------------------------------------------------------------
    // Weapons are drawn on the fine grid (hpx), on a taller tile than the rest
    // of the rack: 32 half-pixels across and 48 down, so a blade has the length
    // to look like one.
    sword: function (c) {
      hpx(c, 15, 8, 2, 2, C.steelLit);        // point
      hpx(c, 14, 10, 4, 2, C.steel);
      hpx(c, 14, 10, 1, 2, C.steelLit);
      hpx(c, 17, 10, 1, 2, C.steelDark);
      hpx(c, 13, 12, 6, 2, C.steel);          // shoulders of the taper
      hpx(c, 13, 12, 1, 2, C.steelLit);
      hpx(c, 18, 12, 1, 2, C.steelDark);
      hpx(c, 12, 14, 8, 14, C.steel);         // blade
      hpx(c, 12, 14, 2, 14, C.steelLit);      // lit edge
      hpx(c, 18, 14, 2, 14, C.steelDark);     // shaded edge
      hpx(c, 15, 11, 2, 16, C.steelLit);      // fuller
      hpx(c, 16, 12, 1, 14, C.steel);
      hpx(c, 6, 28, 20, 2, C.goldDark);       // crossguard
      hpx(c, 6, 30, 20, 2, C.gold);
      hpx(c, 4, 29, 2, 2, C.goldDark);        // swept tips
      hpx(c, 26, 29, 2, 2, C.goldDark);
      hpx(c, 7, 30, 4, 1, C.goldLit);
      hpx(c, 21, 30, 4, 1, C.goldLit);
      hpx(c, 13, 32, 6, 5, C.leather);        // grip
      hpx(c, 13, 32, 1, 5, C.leatherLit);
      hpx(c, 18, 32, 1, 5, C.leatherDark);
      hpx(c, 13, 33, 6, 1, C.leatherDark);    // wrap
      hpx(c, 13, 35, 6, 1, C.leatherDark);
      hpx(c, 11, 37, 10, 2, C.gold);          // pommel
      hpx(c, 12, 39, 8, 1, C.goldDark);
      hpx(c, 12, 37, 3, 1, C.goldLit);
    },
    // Midas' Anduril: the same longsword geometry, forged in gold, with the
    // rune line down the fuller left white-hot.
    anduril: function (c) {
      hpx(c, 15, 0, 2, 2, "#fffdf2");         // point
      hpx(c, 14, 2, 4, 2, C.gold);
      hpx(c, 14, 2, 1, 2, C.goldLit);
      hpx(c, 17, 2, 1, 2, C.goldDark);
      hpx(c, 13, 4, 6, 2, C.gold);
      hpx(c, 13, 4, 1, 2, C.goldLit);
      hpx(c, 18, 4, 1, 2, C.goldDark);
      hpx(c, 12, 6, 8, 32, C.gold);           // blade
      hpx(c, 12, 6, 2, 32, C.goldLit);        // lit edge
      hpx(c, 18, 6, 2, 32, C.goldDark);       // shaded edge
      hpx(c, 15, 3, 2, 34, "#fffdf2");        // rune line down the fuller
      hpx(c, 16, 5, 1, 32, C.goldLit);
      hpx(c, 15, 10, 2, 1, C.goldDark);       // runes cut into it
      hpx(c, 15, 18, 2, 1, C.goldDark);
      hpx(c, 15, 26, 2, 1, C.goldDark);
      hpx(c, 15, 33, 2, 1, C.goldDark);
      hpx(c, 6, 38, 20, 2, C.goldDark);       // crossguard
      hpx(c, 6, 40, 20, 2, C.gold);
      hpx(c, 4, 38, 2, 3, C.gold);            // swept tips
      hpx(c, 26, 38, 2, 3, C.gold);
      hpx(c, 7, 40, 4, 1, "#fffdf2");
      hpx(c, 21, 40, 4, 1, "#fffdf2");
      hpx(c, 13, 42, 6, 4, C.dark);           // grip
      hpx(c, 13, 42, 1, 4, C.darkLit);
      hpx(c, 13, 43, 6, 1, C.gold);           // gold wire wrap
      hpx(c, 13, 45, 6, 1, C.gold);
      hpx(c, 11, 46, 10, 1, C.goldLit);       // pommel
      hpx(c, 12, 47, 8, 1, C.goldDark);
    },
    // Blades the smith has not learned yet: shape only, no detail.
    "sword-silhouette-1": function (c) {   // broadsword
      hpx(c, 14, 0, 4, 2, C.silhouette);
      hpx(c, 13, 2, 6, 2, C.silhouette);
      hpx(c, 12, 4, 8, 32, C.silhouette);
      hpx(c, 6, 36, 20, 4, C.silhouette);
      hpx(c, 14, 40, 4, 6, C.silhouette);
      hpx(c, 12, 46, 8, 2, C.silhouette);
    },
    "sword-silhouette-2": function (c) {   // rapier
      hpx(c, 15, 0, 2, 6, C.silhouette);
      hpx(c, 14, 6, 4, 26, C.silhouette);
      hpx(c, 8, 32, 16, 2, C.silhouette);
      hpx(c, 8, 34, 2, 6, C.silhouette);
      hpx(c, 22, 34, 2, 6, C.silhouette);
      hpx(c, 8, 40, 16, 2, C.silhouette);
      hpx(c, 14, 34, 4, 8, C.silhouette);
      hpx(c, 12, 42, 8, 6, C.silhouette);
    },
    "sword-silhouette-3": function (c) {   // greatsword
      hpx(c, 14, 0, 4, 2, C.silhouette);
      hpx(c, 12, 2, 8, 2, C.silhouette);
      hpx(c, 10, 4, 12, 30, C.silhouette);
      hpx(c, 2, 34, 28, 4, C.silhouette);
      hpx(c, 13, 38, 6, 6, C.silhouette);
      hpx(c, 10, 44, 12, 4, C.silhouette);
    },
    "sword-silhouette-4": function (c) {   // curved saber
      hpx(c, 23, 0, 4, 2, C.silhouette);
      hpx(c, 21, 2, 5, 3, C.silhouette);
      hpx(c, 19, 5, 5, 3, C.silhouette);
      hpx(c, 17, 8, 5, 3, C.silhouette);
      hpx(c, 16, 11, 5, 3, C.silhouette);
      hpx(c, 14, 14, 5, 3, C.silhouette);
      hpx(c, 13, 17, 5, 3, C.silhouette);
      hpx(c, 12, 20, 5, 3, C.silhouette);
      hpx(c, 11, 23, 5, 3, C.silhouette);
      hpx(c, 10, 26, 5, 3, C.silhouette);
      hpx(c, 9, 29, 5, 3, C.silhouette);
      hpx(c, 8, 32, 5, 2, C.silhouette);
      hpx(c, 4, 34, 12, 2, C.silhouette);     // guard
      hpx(c, 5, 36, 6, 7, C.silhouette);      // grip
      hpx(c, 3, 43, 8, 5, C.silhouette);      // pommel
    },
    "sword-silhouette-5": function (c) {   // falchion
      hpx(c, 12, 2, 10, 2, C.silhouette);
      hpx(c, 12, 4, 12, 10, C.silhouette);
      hpx(c, 12, 14, 10, 10, C.silhouette);
      hpx(c, 12, 24, 8, 10, C.silhouette);
      hpx(c, 8, 34, 16, 2, C.silhouette);
      hpx(c, 14, 36, 4, 8, C.silhouette);
      hpx(c, 12, 44, 8, 4, C.silhouette);
    },
    // Worked out at the bench: a lance, a dagger and a blade that drinks.
    // The lance and the dagger are the length they always were; anything
    // shorter than the tile is centred on it, so here that is 8 rows down.
    lance: function (c) {
      hpx(c, 26, 8, 3, 2, C.steelLit);       // head, laid along the diagonal
      hpx(c, 24, 10, 5, 2, C.steel);
      hpx(c, 24, 10, 2, 2, C.steelLit);
      hpx(c, 22, 12, 5, 2, C.steel);
      hpx(c, 22, 12, 2, 2, C.steelLit);
      hpx(c, 20, 14, 5, 2, C.steel);
      hpx(c, 20, 14, 2, 2, C.steelLit);
      hpx(c, 18, 16, 5, 2, C.steelDark);
      hpx(c, 18, 16, 2, 2, C.steel);
      hpx(c, 16, 18, 6, 3, C.gold);           // vamplate
      hpx(c, 16, 18, 2, 3, C.goldLit);
      hpx(c, 16, 20, 6, 1, C.goldDark);
      for (var i = 0; i < 15; i++) {          // shaft, down to the butt
        hpx(c, 15 - i, 21 + i, 3, 1, C.wood);
        hpx(c, 15 - i, 21 + i, 1, 1, C.woodLit);
        hpx(c, 17 - i, 21 + i, 1, 1, C.woodDark);
      }
      hpx(c, 0, 36, 4, 1, C.leather);         // grip end
      hpx(c, 0, 37, 4, 3, C.leatherDark);
    },
    dagger: function (c) {
      hpx(c, 15, 9, 2, 2, C.steelLit);       // point
      hpx(c, 14, 11, 4, 2, C.steel);
      hpx(c, 14, 11, 1, 2, C.steelLit);
      hpx(c, 17, 11, 1, 2, C.steelDark);
      hpx(c, 13, 13, 6, 13, C.steel);         // blade
      hpx(c, 13, 13, 2, 13, C.steelLit);
      hpx(c, 17, 13, 2, 13, C.steelDark);
      hpx(c, 15, 12, 2, 13, C.steelLit);      // fuller
      hpx(c, 16, 13, 1, 11, C.steel);
      hpx(c, 10, 26, 12, 2, C.goldDark);      // guard
      hpx(c, 10, 28, 12, 2, C.gold);
      hpx(c, 11, 28, 3, 1, C.goldLit);
      hpx(c, 13, 30, 6, 6, C.leather);        // grip
      hpx(c, 13, 30, 1, 6, C.leatherLit);
      hpx(c, 18, 30, 1, 6, C.leatherDark);
      hpx(c, 13, 32, 6, 1, C.leatherDark);    // wrap
      hpx(c, 13, 34, 6, 1, C.leatherDark);
      hpx(c, 11, 36, 10, 2, C.gold);          // pommel
      hpx(c, 12, 36, 3, 1, C.goldLit);
      hpx(c, 12, 38, 8, 2, C.goldDark);
    },
    crackbolt: (function () {               // kunai: straight edges, no curves
      var MASK = [
        "................................",
        "................................",
        "................................",
        "...............LL...............",
        "...............LL...............",
        "..............LLDD..............",
        "..............LLDD..............",
        "..............LLDD..............",
        ".............LLSSDD.............",
        ".............LLSSDD.............",
        ".............LLSSDD.............",
        ".............LLSSDD.............",
        "............LLSLSSDD............",
        "............LLSLSSDD............",
        "............LLSLSSDD............",
        "...........LLSSLSSSDD...........",
        "...........LLSSLSSSDD...........",
        "...........LLSSLSSSDD...........",
        "..........LLSSSLSSSSDD..........",
        "..........LLSSSLSSSSDD..........",
        "..........LLSSSLSSSSDD..........",
        "..........LLSSSLSSSSDD..........",
        "...........LLSSLSSSDD...........",
        "............LLSLSSDD............",
        "............LLSLSSDD............",
        ".............LLSSDD.............",
        ".............LLSSDD.............",
        "..............LLDD..............",
        "..............LLDD..............",
        "............gGGggggg............",
        "............dddddddd............",
        ".............Wwwwwk.............",
        ".............Wwwwwk.............",
        ".............Wwwwwk.............",
        ".............Wwwwwk.............",
        "...............LS...............",
        "..............LLSS..............",
        "............LLLLSSSS............",
        "..........LLLL....SSSS..........",
        ".........LLLL......SSSS.........",
        ".........LLLL......SSSS.........",
        "..........LLLL....SSSS..........",
        "............LLLLSSSS............",
        "..............LLSS..............",
        "...............LS...............",
        "................................",
        "................................",
        "................................",
      ];
      var PAINT = {
        L: C.steelLit, S: C.steel, D: C.steelDark,   // blade, lit edge to shade
        g: C.gold, G: C.goldLit, d: C.goldDark,      // collar over the tang
        w: C.leather, W: C.leatherLit, k: C.leatherDark
      };
      return function (c) { paintFine(c, MASK, PAINT); };
    })(),
    // --- parts: the fittings pieces are built from --------------------------
    "part-blood": function (c) {            // blood orb in a claw setting
      px(c, 6, 1, 4, 1, C.bloodLit);
      px(c, 4, 2, 8, 2, C.bloodLit);
      px(c, 3, 4, 10, 6, C.blood);
      px(c, 4, 3, 8, 1, C.blood);
      px(c, 5, 3, 3, 2, C.bloodLit);        // highlight
      px(c, 6, 3, 1, 1, "#ffd7dd");
      px(c, 4, 8, 8, 2, "#5c0b18");         // heavy blood pooled low
      px(c, 4, 10, 8, 2, C.blood);
      px(c, 6, 12, 4, 1, C.bloodLit);
      px(c, 2, 5, 1, 5, C.darkLit);         // setting claws
      px(c, 13, 5, 1, 5, C.darkLit);
      px(c, 4, 13, 8, 1, C.dark);
      px(c, 5, 14, 6, 2, C.darkLit);        // stand
    },
    "part-handle": function (c) {           // banded metal grip
      px(c, 6, 0, 4, 2, C.steelLit);        // pommel cap
      px(c, 5, 2, 6, 1, C.steel);
      px(c, 6, 3, 4, 10, C.steelDark);      // core
      px(c, 6, 3, 1, 10, C.steel);
      px(c, 9, 3, 1, 10, "#3d4049");
      px(c, 5, 5, 6, 1, C.steelLit);        // grip bands
      px(c, 5, 8, 6, 1, C.steelLit);
      px(c, 5, 11, 6, 1, C.steelLit);
      px(c, 4, 13, 8, 1, C.gold);           // collar
      px(c, 4, 14, 8, 2, C.goldDark);
      px(c, 5, 14, 1, 1, C.goldLit);
    },
    "part-electric": function (c) {         // blade with current running it
      px(c, 7, 0, 2, 1, "#dffbff");
      px(c, 6, 1, 4, 10, C.steel);
      px(c, 6, 1, 1, 10, C.steelLit);
      px(c, 9, 1, 1, 10, C.steelDark);
      px(c, 8, 2, 1, 2, "#5fe3ff");         // arc down the fuller
      px(c, 7, 4, 1, 2, "#5fe3ff");
      px(c, 8, 6, 1, 2, "#bff4ff");
      px(c, 7, 8, 1, 2, "#5fe3ff");
      px(c, 3, 3, 1, 1, "#5fe3ff");         // loose sparks
      px(c, 12, 6, 1, 1, "#5fe3ff");
      px(c, 2, 8, 1, 1, "#bff4ff");
      px(c, 4, 11, 8, 1, "#2f7f96");        // guard
      px(c, 5, 12, 6, 2, C.steelDark);
      px(c, 6, 14, 4, 2, "#2f7f96");
    },
    "part-thunder": function (c) {          // spearhead with a bolt cut in it
      px(c, 7, 0, 2, 1, C.steelLit);
      px(c, 6, 1, 4, 2, C.steel);
      px(c, 5, 3, 6, 5, C.steel);
      px(c, 5, 3, 1, 5, C.steelLit);
      px(c, 10, 3, 1, 5, C.steelDark);
      px(c, 8, 2, 2, 2, "#ffe66a");         // bolt
      px(c, 7, 4, 2, 2, "#ffe66a");
      px(c, 8, 6, 2, 1, "#fff7c0");
      px(c, 4, 8, 8, 1, C.steelDark);       // wings
      px(c, 3, 9, 3, 2, C.steel);
      px(c, 10, 9, 3, 2, C.steel);
      px(c, 6, 9, 4, 2, C.gold);            // socket
      px(c, 6, 11, 4, 5, C.steelDark);      // stub shaft
      px(c, 6, 11, 1, 5, C.steel);
    },
    helmet: function (c) {
      px(c, 5, 0, 6, 1, C.steelLit);          // dome
      px(c, 4, 1, 8, 2, C.steel);
      px(c, 3, 3, 10, 4, C.steel);
      px(c, 3, 3, 2, 4, C.steelLit);
      px(c, 11, 3, 2, 4, C.steelDark);
      px(c, 7, 1, 2, 6, C.steelLit);          // ridge
      px(c, 3, 7, 10, 4, C.steel);            // face plate
      px(c, 4, 8, 3, 2, C.shadow);            // eye slits
      px(c, 9, 8, 3, 2, C.shadow);
      px(c, 7, 7, 2, 4, C.steelDark);         // nose guard
      px(c, 3, 11, 10, 1, C.steelDark);
      px(c, 4, 12, 8, 2, C.steel);            // gorget
      px(c, 4, 14, 8, 1, C.steelDark);
      px(c, 6, 0, 4, 1, C.gold);              // crest band
    },
    armor: function (c) {
      px(c, 5, 0, 6, 2, C.gold);              // collar
      px(c, 3, 2, 10, 2, C.steelLit);         // shoulders
      px(c, 1, 3, 3, 4, C.steel);             // pauldrons
      px(c, 12, 3, 3, 4, C.steel);
      px(c, 1, 3, 1, 4, C.steelLit);
      px(c, 14, 3, 1, 4, C.steelDark);
      px(c, 4, 4, 8, 9, C.steel);             // breastplate
      px(c, 4, 4, 1, 9, C.steelLit);
      px(c, 11, 4, 1, 9, C.steelDark);
      px(c, 7, 5, 2, 8, C.steelLit);          // centre ridge
      px(c, 5, 7, 2, 1, C.steelDark);         // pectoral lines
      px(c, 9, 7, 2, 1, C.steelDark);
      px(c, 4, 10, 8, 1, C.steelDark);        // waist band
      px(c, 5, 13, 6, 2, C.steel);            // fauld
      px(c, 5, 15, 6, 1, C.steelDark);
      px(c, 7, 6, 2, 1, C.gold);              // rivet
    },
    boots: function (c) {
      px(c, 2, 1, 5, 2, C.leather);           // left cuff
      px(c, 2, 1, 1, 2, C.leatherDark);
      px(c, 3, 3, 4, 7, C.leather);           // shaft
      px(c, 3, 3, 1, 7, C.leatherDark);
      px(c, 5, 4, 1, 5, C.leatherLit);
      px(c, 2, 10, 6, 2, C.leatherDark);      // foot
      px(c, 1, 12, 7, 2, C.shadow);           // sole
      px(c, 3, 5, 4, 1, C.gold);              // buckle
      px(c, 9, 1, 5, 2, C.leather);           // right boot
      px(c, 9, 1, 1, 2, C.leatherDark);
      px(c, 9, 3, 4, 7, C.leather);
      px(c, 9, 3, 1, 7, C.leatherDark);
      px(c, 11, 4, 1, 5, C.leatherLit);
      px(c, 8, 10, 6, 2, C.leatherDark);
      px(c, 8, 12, 7, 2, C.shadow);
      px(c, 9, 5, 4, 1, C.gold);
    }
  };

  // The bar itself, as a 16x16 map: a cast ingot seen from above and to one
  // side, three flat faces and no rounding beyond the cut corners.
  //   L top face   d long front face   s near end face   . nothing
  var INGOT = [
    "................",
    "................",
    "...........L....",
    "........LLLLL...",
    ".....LLLLLLLLL..",
    "..LLLLLLLLLLLLd.",
    ".LLLLLLLLLLdddd.",
    ".sLLLLLLddddddd.",
    ".ssLLdddddddddd.",
    ".sssdddddddddd..",
    ".sssddddddd.....",
    "..ssdddd........",
    "...sd...........",
    "................",
    "................",
    "................"
  ];

  var TONE = { L: "lit", d: "base", s: "dark" };

  // pick(x, y, tone) -> colour, so one bar and a two-metal bar share the shape.
  function ingot(c, pick) {
    for (var y = 0; y < INGOT.length; y++) {
      var row = INGOT[y];
      for (var x = 0; x < row.length; x++) {
        var tone = TONE[row.charAt(x)];
        if (tone) px(c, x, y, 1, 1, pick(x, y, tone));
      }
    }
  }

  function solid(metal) {
    var p = METAL[metal] || METAL.silver;
    return function (x, y, tone) { return p[tone]; };
  }

  function channel(hex, at) { return parseInt(hex.substr(at, 2), 16); }

  function lerp(a, b, t) {
    var out = "#";
    for (var i = 1; i < 7; i += 2) {
      var v = Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t);
      out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
  }

  // How far along the bar a pixel sits, 0 at the near end and 1 at the far one,
  // measured along the ingot's own axis rather than straight across the tile.
  function along(x, y) {
    var t = ((x - 1) * 11 - (y - 6) * 4) / 137;
    t = (t - 0.12) / 0.76;                    // hold the ends pure
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }

  // One metal pours smoothly into the other down the length of the bar.
  function mixed(a, b) {
    var pa = METAL[a] || METAL.silver, pb = METAL[b] || METAL.gold;
    return function (x, y, tone) { return lerp(pa[tone], pb[tone], along(x, y)); };
  }

  Object.keys(METAL).forEach(function (metal) {
    DRAW["bar-" + metal] = function (c) { ingot(c, solid(metal)); };
  });

  // --- the smelter kit ------------------------------------------------------
  // Shared shapes: the same mask is drawn cold or lit, so a busy oven is the
  // idle one with fire in it.
  var CRUCIBLE = [
    "................",
    "................",
    "..oooooooooooo..",
    ".oIIIIIIIIIIIIo.",
    "ooIIIIIIIIIIIIoo",
    "hoSSSSSSSSSSSSoh",
    "hoSSSSSSSSSSSSoh",
    "ooSSSSSSSSSSSSoo",
    ".oSSSSSSSSSSSSo.",
    "..oSSSSSSSSSSo..",
    "...oSSSSSSSSo...",
    "....oSSSSSSo....",
    "....oooooooo....",
    ".....o....o.....",
    "....ooo..ooo....",
    "................"
  ];

  var OVEN = [
    "................",
    "..........ccc...",
    "..........ccc...",
    ".bbbbbbbbbbbbbb.",
    ".bmbbmbbmbbmbbb.",
    ".bbbbbbbbbbbbbb.",
    ".bbbbmIIIImbbbb.",
    ".bmbbIIIIIIbbmb.",
    ".bbbbIIIIIIbbbb.",
    ".bmbbIIIIIIbbmb.",
    ".bbbbIIIIIIbbbb.",
    ".bmbbIIIIIIbbmb.",
    ".bbbbbbbbbbbbbb.",
    ".bbmbbbmbbbmbbb.",
    "oooooooooooooooo",
    "................"
  ];

  var COLD_PAINT = {
    o: C.stoneDark, S: C.stone, h: C.stoneDark, I: C.cold,
    b: C.brick, m: C.mortar, c: C.brickDark
  };

  var LIT_PAINT = {
    o: C.stoneDark, S: C.stoneLit, h: C.stoneDark, I: C.lava,
    b: C.brickLit, m: C.brick, c: C.brickDark
  };

  function paint(c, mask, palette) {
    for (var y = 0; y < mask.length; y++) {
      var row = mask[y];
      for (var x = 0; x < row.length; x++) {
        var color = palette[row.charAt(x)];
        if (color) px(c, x, y, 1, 1, color);
      }
    }
  }

  // Molten metal is not flat: brighter at the surface, darker at the rim.
  function molten(c, mask) {
    for (var y = 0; y < mask.length; y++) {
      var row = mask[y];
      for (var x = 0; x < row.length; x++) {
        if (row.charAt(x) !== "I") continue;
        var edge = row.charAt(x - 1) !== "I" || row.charAt(x + 1) !== "I";
        px(c, x, y, 1, 1, edge ? C.lavaDark : ((x + y) % 3 ? C.lava : C.lavaLit));
      }
    }
  }

  // The Midas Edge: a curved golden cutting edge on a dark tang. Bright along
  // the cutting side, dull down the spine, so the curve reads at 16px.
  //   L lit edge   g gold body   d dull spine   b collar   t tang   w glint
  var MIDAS = [
    "................",
    "............LL..",
    "..........gLLL..",
    ".........dggLL..",
    "........dggLLw..",
    ".......dggLL....",
    "......dggLL.....",
    ".....dggLL......",
    "....dggLL.......",
    "...dggLL........",
    "...dggL.........",
    "..dggL..........",
    "..bbb...........",
    ".ttb............",
    ".tt.............",
    "................"
  ];

  var MIDAS_PAINT = {
    L: C.goldLit, g: C.gold, d: C.goldDark, b: C.goldLit,
    t: C.dark, w: "#fffdf2"
  };

  // --- living icons ---------------------------------------------------------
  // Most icons are painted once. An entry here redraws its own tile every
  // frame instead, so the art can move: step(ctx, dt, bits) owns the whole
  // 16x16 and keeps whatever it needs on the bits array it is handed.
  var ANIMATE = {};

  DRAW["part-midas"] = function (c) { paint(c, MIDAS, MIDAS_PAINT); };

  // --- the blade that drinks -------------------------------------------------
  // The Blood Bane never settles: its steel runs from black up through deep
  // red and back down, and the wave travels from the point to the guard, so
  // the blade looks like it is swallowing what it has drunk.
  var BANE_COLD = "#150d12";   // the blade at its blackest
  var BANE_BODY = "#3a1420";   // the flat, at the top of the swing
  var BANE_RED = "#a3172a";
  var BANE_HOT = "#e0384a";

  // Where a given row sits in the wave, 0 black and 1 full colour.
  function baneWave(row, phase) {
    return 0.5 + 0.5 * Math.sin(phase - row * 0.275);
  }

  function baneShade(row, phase, cold, hot) {
    return lerp(cold, hot, baneWave(row, phase));
  }

  // The ricasso - the blunt stretch of blade sitting on the guard - takes no
  // part in it: the wave runs out at RICASSO_Y and the hilt stays as forged.
  var RICASSO_Y = 17;

  // Rows are counted from the point; BANE_TOP drops the whole blade onto the
  // foot of the taller tile without touching the wave running down it.
  var BANE_TOP = 7;

  function bloodbane(c, phase) {
    var top = BANE_TOP;
    hpx(c, 15, top, 2, 2, baneShade(0, phase, C.dark, BANE_HOT));   // point
    hpx(c, 14, top + 2, 4, 2, baneShade(2, phase, C.dark, BANE_BODY));
    hpx(c, 14, top + 2, 1, 2, baneShade(2, phase, BANE_COLD, BANE_RED));
    for (var y = 4; y < 21; y++) {
      var live = y < RICASSO_Y;
      hpx(c, 12, top + y, 8, 1, live ? baneShade(y, phase, C.dark, BANE_BODY) : C.dark);
      hpx(c, 12, top + y, 2, 1, live ? baneShade(y, phase, BANE_COLD, BANE_RED) : C.blood);
      hpx(c, 18, top + y, 2, 1, C.darkLit);                         // shaded back
      if (y <= 18) {                                                // channel down the fuller
        hpx(c, 14, top + y, 2, 1, live ? baneShade(y - 2, phase, BANE_COLD, BANE_HOT)
          : C.bloodLit);
      }
      if (y >= 8 && y <= 16) {
        hpx(c, 16, top + y, 1, 1, baneShade(y, phase, BANE_COLD, BANE_RED));
      }
    }
    hpx(c, 6, top + 21, 20, 2, C.darkLit);  // crossguard, swept
    hpx(c, 6, top + 23, 20, 3, C.dark);
    hpx(c, 4, top + 21, 3, 4, C.blood);
    hpx(c, 25, top + 21, 3, 4, C.blood);
    hpx(c, 13, top + 25, 6, 6, C.bloodLit);      // grip, one flat colour
    hpx(c, 11, top + 31, 10, 2, C.bloodLit);     // pommel stone
  }

  // Still frame for anything that cannot animate: caught mid-swing, in colour.
  DRAW.bloodbane = function (c) { bloodbane(c, Math.PI / 2); };

  // --- Zeus' Wrath -----------------------------------------------------------
  // A long, narrow blade of light - pale on one edge, deep blue on the other -
  // set in a gold guard with upswept tips and two dark stones, over a red
  // wrapped grip. Only the blade is lit; the fittings are ordinary.
  //   e pale edge   c core   l deep edge
  //   G/g guard and the gold ricasso   m stone   R/r grip   P pommel
  var BOLT = [
    "................................",
    "................................",
    "................................",
    "...............cc...............",
    "...............cc...............",
    "..............eccl..............",
    "..............eccl..............",
    "..............eccl..............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............eeccll.............",
    ".............ggGGgg.............",
    ".............ggGGgg.............",
    "....GggGGGGGGGmmmmGGGGGGGggG....",
    "....GggGGGGGGGmmmmGGGGGGGggG....",
    ".............RrrrrR.............",
    ".............RrrrrR.............",
    ".............RrrrrR.............",
    ".............RrrrrR.............",
    ".............RrrrrR.............",
    ".............RrrrrR.............",
    ".............RrrrrR.............",
    "............PPPPPPPP............",
    "................................",
    "................................",
    "................................",
  ];

  // The parts made of light. They glow, pulse and throw motes; the guard,
  // grip and pommel sit out of it.
  var BOLT_LIVE = "cle";

  var BOLT_PIXELS = (function () {
    var out = [];
    for (var y = 0; y < BOLT.length; y++) {
      for (var x = 0; x < BOLT[y].length; x++) {
        if (BOLT_LIVE.indexOf(BOLT[y].charAt(x)) >= 0) out.push({ x: x, y: y });
      }
    }
    return out;
  })();

  var BOLT_SURGE_EVERY = 1.5;   // seconds between surges up the blade
  var BOLT_MOTE_EVERY = 0.13;   // seconds between motes coming off it

  // flash 0 is the weapon at rest, 1 the instant a surge runs through it.
  // shimmer is where this row sits in the wave travelling down the weapon.
  function boltPaint(flash, shimmer) {
    var lit = 0.35 * shimmer + 0.65 * flash;
    return {
      c: lerp("#cfe9ff", "#ffffff", lit),        // core
      e: lerp("#9fd8ff", "#eaf6ff", lit),        // pale edge
      l: lerp("#2a4d6b", "#6ba6cd", lit),        // deep edge
      G: C.goldLit, g: C.gold,                   // guard and its upswept tips
      m: "#23406b",                              // stones set in it
      R: "#6e1a1a", r: "#a52a2a",                // wrapped grip
      P: "#e08a3c"                               // pommel
    };
  }

  // The mask laid down again, shifted and faint: the light coming off it.
  function halo(ctx, mask, chars, color, alpha) {
    var offs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
    ctx.globalAlpha = alpha;
    for (var i = 0; i < offs.length; i++) {
      for (var y = 0; y < mask.length; y++) {
        for (var x = 0; x < mask[y].length; x++) {
          if (chars.indexOf(mask[y].charAt(x)) < 0) continue;
          hpx(ctx, x + offs[i][0], y + offs[i][1], 1, 1, color);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // The wave runs point to pommel, so the light never sits flat anywhere.
  var BOLT_WAVE = 0.14;   // radians of the wave per row
  var BOLT_SPEED = 4.3;   // radians a second

  function bolt(ctx, flash, t) {
    halo(ctx, BOLT, BOLT_LIVE, "#7fc9ff",
      0.16 + 0.26 * flash + 0.06 * (0.5 + 0.5 * Math.sin(t * BOLT_SPEED)));
    for (var y = 0; y < BOLT.length; y++) {
      var palette = boltPaint(flash, 0.5 + 0.5 * Math.sin(t * BOLT_SPEED - y * BOLT_WAVE));
      var row = BOLT[y];
      for (var x = 0; x < row.length; x++) {
        var color = palette[row.charAt(x)];
        if (color) hpx(ctx, x, y, 1, 1, color);
      }
    }
  }

  // Still frame: caught part-way through a surge, so it reads as lit.
  DRAW.zeus = function (c) { bolt(c, 0.4, 0); };

  ANIMATE.zeus = function (ctx, dt, bits) {
    bits.t = (bits.t || 0) + dt;
    bits.flash = Math.max(0, (bits.flash || 0) - dt * 2.2);
    bits.next = (bits.next || 0) - dt;
    if (bits.next <= 0) {
      bits.next = BOLT_SURGE_EVERY * (0.7 + Math.random() * 0.7);
      bits.flash = 1;
    }
    bolt(ctx, bits.flash, bits.t);

    // Motes lift off the blade and drift up, the way the light bleeds off it.
    bits.mote = (bits.mote || 0) - dt;
    if (bits.mote <= 0) {
      bits.mote = BOLT_MOTE_EVERY;
      var from = BOLT_PIXELS[Math.floor(Math.random() * BOLT_PIXELS.length)];
      bits.push({
        x: (from.x + 0.5) / 2, y: (from.y + 0.5) / 2,
        vx: (Math.random() - 0.5) * 7,
        vy: -3 - Math.random() * 7,
        life: 0.35 + Math.random() * 0.45
      });
    }
    for (var i = bits.length - 1; i >= 0; i--) {
      var s = bits[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y < -1) { bits.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life * 1.8));
      hpx(ctx, Math.round(s.x * 2), Math.round(s.y * 2), 1, 1,
        s.life > 0.4 ? "#ffffff" : "#9fd8ff");
      ctx.globalAlpha = 1;
    }
  };

  ANIMATE.bloodbane = function (ctx, dt, bits) {
    bits.t = (bits.t || 0) + dt;
    bloodbane(ctx, bits.t * 2.1);
  };

  // The outermost lit pixel on each row of the Midas Edge - the cutting side
  // itself, which is where its sparks come off.
  var MIDAS_EDGE = (function () {
    var out = [];
    for (var y = 0; y < MIDAS.length; y++) {
      var at = MIDAS[y].lastIndexOf("L");
      if (at >= 0) out.push({ x: at, y: y });
    }
    return out;
  })();

  var MIDAS_EVERY = 0.11;   // seconds between sparks off the edge
  var MIDAS_GRAVITY = 13;   // pixels per second per second, in tile pixels

  ANIMATE["part-midas"] = function (ctx, dt, sparks) {
    paint(ctx, MIDAS, MIDAS_PAINT);
    sparks.due = (sparks.due || 0) - dt;
    if (sparks.due <= 0) {
      sparks.due = MIDAS_EVERY;
      var from = MIDAS_EDGE[Math.floor(Math.random() * MIDAS_EDGE.length)];
      sparks.push({
        x: from.x + 0.5, y: from.y + 0.5,
        vx: 3 + Math.random() * 7,
        vy: -9 + Math.random() * 6,
        life: 0.45 + Math.random() * 0.4
      });
    }
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.vy += MIDAS_GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > 16 || s.y > 16) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life * 2.2));
      px(ctx, Math.round(s.x), Math.round(s.y), 1, 1,
        s.life > 0.55 ? "#fffdf2" : s.life > 0.25 ? C.goldLit : C.gold);
      ctx.globalAlpha = 1;
    }
  };

  // --- Midas' Anduril --------------------------------------------------------
  // The gold catches the light the way the Midas Edge does: sparks come off the
  // lit edge of the blade and fall away from it.
  var ANDURIL_EDGE = (function () {
    var out = [{ x: 14, y: 2 }, { x: 14, y: 3 }, { x: 13, y: 4 }, { x: 13, y: 5 }];
    for (var y = 6; y < 38; y++) out.push({ x: 12, y: y });
    return out;
  })();

  var ANDURIL_EVERY = 0.12;     // seconds between sparks off the edge
  var ANDURIL_GRAVITY = 26;     // half-pixels per second per second

  ANIMATE.anduril = function (ctx, dt, sparks) {
    DRAW.anduril(ctx);
    sparks.due = (sparks.due || 0) - dt;
    if (sparks.due <= 0) {
      sparks.due = ANDURIL_EVERY;
      var from = ANDURIL_EDGE[Math.floor(Math.random() * ANDURIL_EDGE.length)];
      sparks.push({
        x: from.x + 0.5, y: from.y + 0.5,
        vx: -(5 + Math.random() * 13),
        vy: -16 + Math.random() * 11,
        life: 0.45 + Math.random() * 0.4
      });
    }
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.vy += ANDURIL_GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < 0 || s.y > 48) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life * 2.2));
      hpx(ctx, Math.round(s.x), Math.round(s.y), 1, 1,
        s.life > 0.55 ? "#fffdf2" : s.life > 0.25 ? C.goldLit : C.gold);
      ctx.globalAlpha = 1;
    }
  };

  // --- Crackbolt -------------------------------------------------------------
  // The point never settles: tiny strikes come off it and crawl a little way
  // down the blade before they go out.
  var CRACK_EVERY = 0.22;       // seconds between strikes
  var CRACK_LIFE = 0.2;         // how long one stays lit

  // A strike is worked out once, as a short jagged run of half-pixels, and then
  // just held on screen until its life runs out.
  var CRACK_TIP = 3;            // the row the point sits on

  function crackle() {
    var pts = [], x = 15 + Math.floor(Math.random() * 2), y = CRACK_TIP;
    var lean = Math.random() < 0.5 ? -1 : 1;
    var steps = 6 + Math.floor(Math.random() * 4);
    for (var i = 0; i < steps; i++) {
      pts.push({ x: x, y: y });
      // Each leg is drawn out, so the strike carries well down the blade.
      var run = 2 + Math.floor(Math.random() * 3);
      for (var k = 0; k < run; k++) {
        x += lean;
        if (Math.random() < 0.6) y += 1;
        pts.push({ x: x, y: y });
      }
      lean = -lean;
    }
    return { pts: pts, life: CRACK_LIFE };
  }

  ANIMATE.crackbolt = function (ctx, dt, bolts) {
    DRAW.crackbolt(ctx);
    bolts.due = (bolts.due || 0) - dt;
    if (bolts.due <= 0) {
      bolts.due = CRACK_EVERY * (0.5 + Math.random());
      bolts.push(crackle());
    }
    for (var i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i];
      b.life -= dt;
      if (b.life <= 0) { bolts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(1, b.life / CRACK_LIFE + 0.2));
      for (var j = 0; j < b.pts.length; j++) {
        var p = b.pts[j];
        if (p.x < 0 || p.x > 31 || p.y < 0 || p.y > 31) continue;
        hpx(ctx, p.x, p.y, 1, 1,
          j === 0 ? "#ffffff" : j < 6 ? "#dffbff" : "#5fe3ff");
      }
      ctx.globalAlpha = 1;
    }
  };

  // Runs a living icon until its tile leaves the page. A tile that is drawn
  // but never mounted gets a moment's grace before the loop lets go.
  function animate(node, ctx, step) {
    var bits = [], last = 0, gone = 0;
    function frame(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      gone = node.isConnected ? 0 : gone + dt;
      if (gone > 1) return;
      ctx.clearRect(0, 0, node.width, node.height);
      step(ctx, dt, bits);
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }

  DRAW.crucible = function (c) { paint(c, CRUCIBLE, COLD_PAINT); };
  DRAW["crucible-lit"] = function (c) {
    paint(c, CRUCIBLE, LIT_PAINT);
    molten(c, CRUCIBLE);
  };
  DRAW.oven = function (c) { paint(c, OVEN, COLD_PAINT); };
  DRAW["oven-lit"] = function (c) {
    paint(c, OVEN, LIT_PAINT);
    molten(c, OVEN);
  };

  // Weapons paint on a taller tile than the rest of the rack: 16 units across
  // and 24 down, at two subpixels to the unit, so 32x48 pixels. Everything else
  // stays a square 16x16. The context is scaled either way, so a draw function
  // works in units and a weapon reaches for half-units with hpx().
  var GRID = 16;
  var WEAPON_H = 24;            // units down the tile a weapon gets
  var WEAPON = {
    sword: 1, lance: 1, dagger: 1, crackbolt: 1, bloodbane: 1, zeus: 1,
    anduril: 1,
    "sword-silhouette-1": 1, "sword-silhouette-2": 1, "sword-silhouette-3": 1,
    "sword-silhouette-4": 1, "sword-silhouette-5": 1
  };

  function canvas(className, key) {
    var weapon = !!WEAPON[key];
    var step = weapon ? 2 : 1;              // subpixels to a unit
    var node = document.createElement("canvas");
    node.width = GRID * step;
    node.height = (weapon ? WEAPON_H : GRID) * step;
    // .tall carries the taller aspect ratio through to the CSS.
    node.className = (className || "icon") + (weapon ? " tall" : "");
    var ctx = node.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.scale(step, step);
    return { node: node, ctx: ctx };
  }

  // A single-metal bar: bar("bronze").
  function bar(metal, className) {
    var made = canvas(className);
    ingot(made.ctx, solid(metal));
    return made.node;
  }

  // An alloy bar: alloyBar("bronze", "silver") pours one into the other.
  function alloyBar(a, b, className) {
    var made = canvas(className);
    ingot(made.ctx, b ? mixed(a, b) : solid(a));
    return made.node;
  }

  // The same icon with the light taken out of it: shape only, for a piece
  // the smith has not discovered yet.
  function shadow(key, className) {
    var made = canvas(className, key);
    (DRAW[key] || DRAW.sword)(made.ctx);
    made.ctx.globalCompositeOperation = "source-in";
    made.ctx.fillStyle = C.silhouette;
    made.ctx.fillRect(0, 0, made.node.width, made.node.height);
    made.ctx.globalCompositeOperation = "source-over";
    return made.node;
  }

  // Returns the icon on its own canvas, scaled up to size by CSS.
  function make(key, className) {
    var made = canvas(className, key);
    (DRAW[key] || DRAW.sword)(made.ctx);
    if (ANIMATE[key]) animate(made.node, made.ctx, ANIMATE[key]);
    return made.node;
  }

  global.Icons = { make: make, shadow: shadow, bar: bar, alloyBar: alloyBar,
    METAL: METAL, DRAW: DRAW, ANIMATE: ANIMATE };
})(window);
