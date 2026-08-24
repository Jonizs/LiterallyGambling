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

  var DRAW = {
    sword: function (c) {
      px(c, 7, 0, 2, 1, C.steelLit);          // point
      px(c, 6, 1, 4, 9, C.steel);             // blade
      px(c, 6, 1, 1, 9, C.steelLit);          // lit edge
      px(c, 9, 1, 1, 9, C.steelDark);         // shaded edge
      px(c, 7, 2, 2, 7, C.steelLit);          // fuller
      px(c, 8, 3, 1, 6, C.steel);
      px(c, 3, 10, 10, 1, C.goldDark);        // crossguard
      px(c, 3, 11, 10, 2, C.gold);
      px(c, 4, 12, 1, 1, C.goldLit);
      px(c, 11, 12, 1, 1, C.goldLit);
      px(c, 6, 13, 4, 2, C.leather);          // grip wrap
      px(c, 6, 13, 1, 2, C.leatherDark);
      px(c, 7, 14, 2, 1, C.leatherDark);
      px(c, 5, 15, 6, 1, C.gold);             // pommel
    },
    // Blades the smith has not learned yet: shape only, no detail.
    "sword-silhouette-1": function (c) {   // broadsword
      px(c, 7, 0, 2, 1, C.silhouette);
      px(c, 6, 1, 4, 9, C.silhouette);
      px(c, 3, 10, 10, 2, C.silhouette);
      px(c, 7, 12, 2, 3, C.silhouette);
      px(c, 6, 15, 4, 1, C.silhouette);
    },
    "sword-silhouette-2": function (c) {   // rapier
      px(c, 7, 0, 2, 9, C.silhouette);
      px(c, 4, 9, 8, 1, C.silhouette);
      px(c, 4, 10, 1, 3, C.silhouette);
      px(c, 11, 10, 1, 3, C.silhouette);
      px(c, 4, 13, 8, 1, C.silhouette);
      px(c, 7, 10, 2, 3, C.silhouette);
      px(c, 6, 14, 4, 2, C.silhouette);
    },
    "sword-silhouette-3": function (c) {   // greatsword
      px(c, 7, 0, 2, 1, C.silhouette);
      px(c, 6, 1, 4, 1, C.silhouette);
      px(c, 5, 2, 6, 7, C.silhouette);
      px(c, 1, 9, 14, 2, C.silhouette);
      px(c, 6, 11, 4, 3, C.silhouette);
      px(c, 5, 14, 6, 2, C.silhouette);
    },
    "sword-silhouette-4": function (c) {   // curved saber
      px(c, 11, 0, 2, 1, C.silhouette);
      px(c, 9, 1, 3, 2, C.silhouette);
      px(c, 7, 3, 3, 2, C.silhouette);
      px(c, 6, 5, 3, 2, C.silhouette);
      px(c, 5, 7, 3, 2, C.silhouette);
      px(c, 4, 9, 3, 2, C.silhouette);
      px(c, 2, 10, 6, 1, C.silhouette);
      px(c, 2, 11, 3, 3, C.silhouette);
      px(c, 1, 14, 4, 2, C.silhouette);
    },
    "sword-silhouette-5": function (c) {   // falchion
      px(c, 6, 1, 5, 1, C.silhouette);
      px(c, 6, 2, 6, 3, C.silhouette);
      px(c, 6, 5, 5, 2, C.silhouette);
      px(c, 6, 7, 4, 3, C.silhouette);
      px(c, 4, 10, 8, 1, C.silhouette);
      px(c, 7, 11, 2, 3, C.silhouette);
      px(c, 6, 14, 4, 2, C.silhouette);
    },
    // Worked out at the bench: a lance, a dagger and a blade that drinks.
    lance: function (c) {
      px(c, 12, 0, 3, 1, C.steelLit);         // head
      px(c, 11, 1, 4, 2, C.steel);
      px(c, 11, 1, 1, 2, C.steelLit);
      px(c, 10, 3, 4, 1, C.steel);
      px(c, 9, 4, 3, 1, C.steelDark);
      px(c, 10, 3, 2, 1, C.steelLit);
      px(c, 8, 5, 3, 2, C.gold);              // vamplate
      px(c, 8, 5, 1, 2, C.goldLit);
      for (var i = 0; i < 8; i++) {           // shaft, down to the butt
        px(c, 7 - i, 6 + i, 2, 2, C.wood);
        px(c, 7 - i, 6 + i, 1, 1, C.woodLit);
      }
      px(c, 0, 14, 2, 2, C.leatherDark);      // grip end
    },
    dagger: function (c) {
      px(c, 8, 1, 2, 1, C.steelLit);          // point
      px(c, 7, 2, 3, 7, C.steel);
      px(c, 7, 2, 1, 7, C.steelLit);
      px(c, 9, 2, 1, 7, C.steelDark);
      px(c, 8, 3, 1, 5, C.steelLit);          // fuller
      px(c, 5, 9, 7, 1, C.goldDark);          // guard
      px(c, 5, 10, 7, 1, C.gold);
      px(c, 5, 10, 1, 1, C.goldLit);
      px(c, 7, 11, 3, 3, C.leather);          // grip
      px(c, 7, 11, 1, 3, C.leatherDark);
      px(c, 6, 14, 5, 2, C.gold);             // pommel
      px(c, 7, 15, 1, 1, C.goldLit);
    },
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
    return 0.5 + 0.5 * Math.sin(phase - row * 0.55);
  }

  function baneShade(row, phase, cold, hot) {
    return lerp(cold, hot, baneWave(row, phase));
  }

  // The ricasso - the blunt stretch of blade sitting on the guard - takes no
  // part in it: the wave runs out at RICASSO_Y and the hilt stays as forged.
  var RICASSO_Y = 8;

  function bloodbane(c, phase) {
    px(c, 7, 0, 2, 1, baneShade(0, phase, C.dark, BANE_HOT));      // point
    for (var y = 1; y < 10; y++) {
      var live = y < RICASSO_Y;
      px(c, 6, y, 4, 1, live ? baneShade(y, phase, C.dark, BANE_BODY) : C.dark);
      px(c, 6, y, 1, 1, live ? baneShade(y, phase, BANE_COLD, BANE_RED) : C.blood);
      px(c, 9, y, 1, 1, C.darkLit);                                // shaded back
      if (y >= 2 && y <= 8) {                                      // channel down the fuller
        px(c, 7, y, 1, 1, live ? baneShade(y - 1, phase, BANE_COLD, BANE_HOT)
          : C.bloodLit);
      }
      if (y >= 4 && y <= 7) px(c, 8, y, 1, 1, baneShade(y, phase, BANE_COLD, BANE_RED));
    }
    px(c, 3, 10, 10, 1, C.darkLit);         // crossguard, swept
    px(c, 3, 11, 10, 2, C.dark);
    px(c, 2, 10, 2, 2, C.blood);
    px(c, 12, 10, 2, 2, C.blood);
    px(c, 6, 13, 4, 2, C.leatherDark);      // wrap
    px(c, 7, 14, 2, 1, C.blood);
    px(c, 5, 15, 6, 1, C.bloodLit);         // pommel stone
  }

  // Still frame for anything that cannot animate: caught mid-swing, in colour.
  DRAW.bloodbane = function (c) { bloodbane(c, Math.PI / 2); };

  // --- Zeus' Wrath -----------------------------------------------------------
  // A straight blade of white light on an ornate gold guard, with a gem at
  // its heart and a crystal grip. The steel is the light; the gold is not.
  //   c core   l lit flat   e blue rim   G/g/d guard   m gem   h grip   p pommel
  var BOLT = [
    ".......cc.......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "......eccl......",
    "..dGGgGGGGgGGd..",
    "...dGgGmmGgGd...",
    ".......hh.......",
    ".......hh.......",
    "......pppp......"
  ];

  // The parts made of light - blade, grip and pommel alike. They glow, pulse
  // and throw motes; only the gold guard sits out of it.
  var BOLT_LIVE = "clehp";

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
      c: lerp("#eaf6ff", "#ffffff", lit),
      l: lerp("#a9dcff", "#eaf6ff", lit),
      e: lerp("#5fb4f5", "#bfe8ff", lit),
      G: C.goldLit, g: C.gold, d: C.goldDark,   // the ornate guard
      m: lerp("#bfe8ff", "#ffffff", flash),     // gem at the heart of it
      h: lerp("#9fd8ff", "#eaf6ff", lit),       // crystal grip
      p: lerp("#bfe8ff", "#ffffff", lit)        // pommel
    };
  }

  // The mask laid down again, shifted and faint: the light coming off it.
  function halo(ctx, mask, chars, color, alpha) {
    var offs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    ctx.globalAlpha = alpha;
    for (var i = 0; i < offs.length; i++) {
      for (var y = 0; y < mask.length; y++) {
        for (var x = 0; x < mask[y].length; x++) {
          if (chars.indexOf(mask[y].charAt(x)) < 0) continue;
          px(ctx, x + offs[i][0], y + offs[i][1], 1, 1, color);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // The wave runs point to pommel, so the light never sits flat anywhere.
  var BOLT_WAVE = 0.45;   // radians of the wave per row
  var BOLT_SPEED = 4.3;   // radians a second

  function bolt(ctx, flash, t) {
    halo(ctx, BOLT, BOLT_LIVE, "#7fc9ff",
      0.16 + 0.26 * flash + 0.06 * (0.5 + 0.5 * Math.sin(t * BOLT_SPEED)));
    for (var y = 0; y < BOLT.length; y++) {
      var palette = boltPaint(flash, 0.5 + 0.5 * Math.sin(t * BOLT_SPEED - y * BOLT_WAVE));
      var row = BOLT[y];
      for (var x = 0; x < row.length; x++) {
        var color = palette[row.charAt(x)];
        if (color) px(ctx, x, y, 1, 1, color);
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
        x: from.x + 0.5, y: from.y + 0.5,
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
      px(ctx, Math.round(s.x), Math.round(s.y), 1, 1,
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

  // Runs a living icon until its tile leaves the page. A tile that is drawn
  // but never mounted gets a moment's grace before the loop lets go.
  function animate(node, ctx, step) {
    var bits = [], last = 0, gone = 0;
    function frame(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      gone = node.isConnected ? 0 : gone + dt;
      if (gone > 1) return;
      ctx.clearRect(0, 0, 16, 16);
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

  function canvas(className) {
    var node = document.createElement("canvas");
    node.width = 16;
    node.height = 16;
    node.className = className || "icon";
    var ctx = node.getContext("2d");
    ctx.imageSmoothingEnabled = false;
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
    var made = canvas(className);
    (DRAW[key] || DRAW.sword)(made.ctx);
    made.ctx.globalCompositeOperation = "source-in";
    made.ctx.fillStyle = C.silhouette;
    made.ctx.fillRect(0, 0, 16, 16);
    made.ctx.globalCompositeOperation = "source-over";
    return made.node;
  }

  // Returns a 16x16 canvas holding the icon, scaled up by CSS.
  function make(key, className) {
    var canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    canvas.className = className || "icon";
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    (DRAW[key] || DRAW.sword)(ctx);
    if (ANIMATE[key]) animate(canvas, ctx, ANIMATE[key]);
    return canvas;
  }

  global.Icons = { make: make, shadow: shadow, bar: bar, alloyBar: alloyBar,
    METAL: METAL, DRAW: DRAW, ANIMATE: ANIMATE };
})(window);
