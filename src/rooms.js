/* The rooms the smith walks to besides the forge - the enchanting bench, the
   experiment lab and the awakening shrine - and the pixel wipe that swaps
   between them. Same 256x160 grid and the same chunky pixels as the forge. */
(function (global) {
  "use strict";

  var W = 256, H = 160, FLOOR_Y = 118;

  var P = {
    wallDark: "#1b1626",
    wallMid: "#251d33",
    wallLine: "#130f1c",
    stone: "#3a3048",
    stoneLit: "#4d3f60",
    floor: "#332a42",
    floorDark: "#281f34",
    floorLine: "#1b1526",
    wood: "#5c3a1e",
    woodDark: "#3d2412",
    cloth: "#5a2a7a",
    clothLit: "#7b3aa4",
    obsidian: "#171021",
    obsidianLit: "#2a1c3a",
    page: "#f4e3c1",
    pageDim: "#c9ab7c",
    rune: "#d3a6f5",
    glow: "#9a5fd0",
    candle: "#f0d191",
    flame: "#ffd75e"
  };

  var ROOMS = {};

  function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0));
  }

  // Every room is the same brick wall over the same plank-and-tile floor,
  // retinted so each one reads as its own place.
  function wall(ctx, dark, mid, line) {
    rect(ctx, 0, 0, W, FLOOR_Y, dark);
    for (var y = 0; y < FLOOR_Y; y += 8) {
      var offset = (y / 8) % 2 === 0 ? 0 : 8;
      for (var x = -8; x < W; x += 16) {
        rect(ctx, x + offset, y, 15, 7, mid);
        rect(ctx, x + offset, y + 7, 15, 1, line);
      }
    }
  }

  function floor(ctx, light, dark, line) {
    for (var y = FLOOR_Y, row = 0; y < H; y += 10, row++) {
      rect(ctx, 0, y, W, 9, row % 2 === 0 ? light : dark);
      rect(ctx, 0, y + 9, W, 1, line);
      for (var x = row % 2 === 0 ? 16 : 48; x < W; x += 32) {
        rect(ctx, x, y, 1, 9, line);
      }
    }
    rect(ctx, 0, FLOOR_Y - 1, W, 1, line);
  }

  function vignette(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, W, 6);
    ctx.fillRect(0, H - 6, W, 6);
  }

  // The enchanted volumes never settle: their hue slides back and forth on
  // its own off-beat swing, so the colour creeps rather than jumps.
  // Saturation and lightness stay where the spine started, so a dark cloth
  // book stays dark.
  var PURPLE_TONES = {};

  // A triangle wave rather than a sine: the hue travels at one steady rate
  // and turns round at the ends, so a book never sits still on a shade.
  function tri(x) {
    var v = x % 2;
    if (v < 0) v += 2;
    return v < 1 ? v : 2 - v;
  }

  function hueDrift(t, seed, tone) {
    // Two triangles at unrelated rates: always moving, never on a beat.
    var speed = 0.42 + (seed % 7) * 0.13;
    var hue = tone[0]
      + tri(t * speed + seed * 0.37) * 76
      + tri(t * speed * 1.63 + seed * 0.81) * 16;
    return "hsl(" + hue.toFixed(1) + "," + tone[1] + "%," + tone[2] + "%)";
  }

  // Every dyed spine drifts - only the plain leather stays put. Each keeps
  // the saturation and lightness it started with and swings from its own
  // corner of the wheel: [hue it starts at, saturation, lightness].
  PURPLE_TONES[P.cloth] = [238, 48, 32];
  PURPLE_TONES[P.clothLit] = [238, 48, 44];
  PURPLE_TONES[P.glow] = [238, 55, 59];
  PURPLE_TONES["#2f4a6b"] = [176, 39, 30];

  // Shelves of books on both walls, so the room reads as a study.
  function shelves(ctx, t) {
    var spines = [P.cloth, P.clothLit, "#3d2412", "#5c3a1e", P.glow, "#2f4a6b"];
    [12, 196].forEach(function (x0, side) {
      for (var s = 0; s < 3; s++) {
        var y = 42 + s * 22;
        rect(ctx, x0, y + 16, 48, 3, P.woodDark);
        rect(ctx, x0, y + 16, 48, 1, P.wood);
        for (var b = 0; b < 11; b++) {
          var h = 10 + ((b * 7 + s * 5 + side * 3) % 5);
          var colour = spines[(b + s * 2 + side) % spines.length];
          // Only the purple ones are enchanted; the plain leather stays put.
          var tone = PURPLE_TONES[colour];
          if (tone) colour = hueDrift(t, b + s * 4 + side * 13, tone);
          rect(ctx, x0 + 2 + b * 4, y + 16 - h, 3, h, colour);
        }
      }
    });
  }

  // Two candle stands flanking the table, burning steady.
  function candles(ctx) {
    [78, 172].forEach(function (x) {
      rect(ctx, x - 1, 104, 4, 14, P.woodDark);
      rect(ctx, x - 4, 116, 10, 3, P.woodDark);
      rect(ctx, x - 2, 98, 6, 7, P.candle);
      rect(ctx, x, 93, 2, 5, P.flame);
      rect(ctx, x, 91, 2, 2, P.page);
    });
  }

  // The table itself: an obsidian block under a purple cloth, open book on top.
  var TABLE = { x: 104, y: 92 };
  function table(ctx, t) {
    var x = TABLE.x, y = TABLE.y;
    rect(ctx, x, y + 20, 48, 22, P.obsidian);
    rect(ctx, x, y + 20, 48, 2, P.obsidianLit);
    rect(ctx, x + 4, y + 42, 40, 4, P.obsidian);
    rect(ctx, x - 2, y + 14, 52, 7, P.cloth);
    rect(ctx, x - 2, y + 14, 52, 2, P.clothLit);
    // Cloth fringe.
    for (var f = 0; f < 52; f += 4) rect(ctx, x - 2 + f, y + 21, 2, 3, P.clothLit);

    // The open book, breathing a little on its own.
    var lift = Math.sin(t * 2.1) > 0 ? 0 : 1;
    var by = y + lift;
    rect(ctx, x + 8, by, 16, 12, P.woodDark);
    rect(ctx, x + 24, by, 16, 12, P.woodDark);
    rect(ctx, x + 9, by + 1, 14, 10, P.page);
    rect(ctx, x + 25, by + 1, 14, 10, P.page);
    rect(ctx, x + 23, by, 2, 12, P.obsidian);
    for (var l = 0; l < 4; l++) {
      rect(ctx, x + 11, by + 2 + l * 2, 10 - l, 1, P.pageDim);
      rect(ctx, x + 27, by + 2 + l * 2, 10 - l, 1, P.pageDim);
    }
    // Glow off the pages.
    var g = ctx.createRadialGradient(x + 24, by + 6, 2, x + 24, by + 6, 46);
    g.addColorStop(0, "rgba(154,95,208,0.30)");
    g.addColorStop(1, "rgba(154,95,208,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ROOMS.enchant = function (ctx, t) {
    wall(ctx, P.wallDark, P.wallMid, P.wallLine);
    shelves(ctx, t);
    floor(ctx, P.floor, P.floorDark, P.floorLine);
    candles(ctx);
    table(ctx, t);
    vignette(ctx);
  };

  /* ---- the lab: the resource yard and the experiment bench in one room -----------------------------------------------
     A workbench of glassware in the middle, crucibles on the left, the
     smelting ovens on the right, everything faintly green. */
  var L = {
    wallDark: "#141c18", wallMid: "#1d2a22", wallLine: "#0e1512",
    floor: "#2c3128", floorDark: "#232720", floorLine: "#161a14",
    bench: "#4a3a22", benchLit: "#6b5330", benchDark: "#2e2314",
    iron: "#3a3f3c", ironLit: "#565e59",
    brew: "#4fbf6a", brewLit: "#a7f0a0", brewDim: "#2c7a45",
    glass: "#bfe6dd", glassDim: "#7fa9a2",
    fluidA: "#d06fd0", fluidB: "#e8c14a", flame: "#ff9b3a"
  };

  // Where the lab's machines stand. The hotspots below are cut from these,
  // so what you can press is always what is drawn.
  var OVEN_X = [192, 224];
  var CRUCIBLE_X = [6, 34, 62];
  var BOARD = { x: 8, y: 26, w: 68, h: 46 };
  var BENCH = { x: 88, y: 68, w: 98, h: 50 };

  // What each part of the lab opens. The click lands in room pixels.
  function labHotspots() {
    var spots = [{ key: "gather", x: BOARD.x, y: BOARD.y, w: BOARD.w, h: BOARD.h },
      { key: "experiment", x: BENCH.x, y: BENCH.y, w: BENCH.w, h: BENCH.h }];
    OVEN_X.forEach(function (x, i) {
      spots.push({ key: "refine", index: i, x: x, y: 100, w: 30, h: 21 });
    });
    CRUCIBLE_X.forEach(function (x, i) {
      spots.push({ key: "compound", index: i, x: x - 1, y: 90, w: 22, h: 31 });
    });
    return spots;
  }

  // The enchanting table is the only thing to press in its room.
  function enchantHotspots() {
    return [{ key: "enchant", x: TABLE.x - 4, y: TABLE.y - 4,
      w: 56, h: 50 }];
  }

  var HOTSPOTS = { lab: labHotspots, enchant: enchantHotspots };

  function hasSpots(room) { return !!HOTSPOTS[room]; }

  function spotAt(room, px, py) {
    if (!HOTSPOTS[room]) return null;
    var spots = HOTSPOTS[room]();
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      if (px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h) return s;
    }
    return null;
  }

  function glassware(ctx, t) {
    // A row of flasks on the bench, each with a different brew in it.
    var fluids = [L.fluidA, L.brew, L.fluidB, L.fluidA];
    for (var i = 0; i < 4; i++) {
      var x = 104 + i * 13, y = 78;
      rect(ctx, x + 2, y, 2, 6, L.glassDim);          // neck
      rect(ctx, x, y + 6, 6, 10, L.glass);            // body
      rect(ctx, x, y + 11, 6, 5, fluids[i]);          // what is in it
      rect(ctx, x, y + 11, 6, 1, L.glassDim);
      // A bubble climbing the fluid, on its own cycle.
      var b = (t * 1.4 + i * 0.37) % 1;
      rect(ctx, x + 2 + (i % 2), y + 15 - (b * 4 | 0), 1, 1, L.glassDim);
    }
  }

  function bench(ctx) {
    // Long enough that everything standing on it has a top under its feet.
    rect(ctx, 88, 94, 98, 6, L.bench);
    rect(ctx, 88, 94, 98, 2, L.benchLit);
    rect(ctx, 92, 100, 5, 18, L.benchDark);
    rect(ctx, 177, 100, 5, 18, L.benchDark);
    // Notes pinned over it, and a rack of empty tubes.
    rect(ctx, 165, 44, 22, 16, "#d8caa4");
    rect(ctx, 167, 48, 18, 1, L.benchDark);
    rect(ctx, 167, 52, 14, 1, L.benchDark);
    rect(ctx, 167, 56, 16, 1, L.benchDark);
    rect(ctx, 200, 56, 30, 3, L.benchDark);
    for (var i = 0; i < 5; i++) rect(ctx, 202 + i * 6, 59, 3, 9, L.glass);
  }

  // The lab's board: OPERATIONS chalked across the top, working notes under it.
  var GLYPHS = {
    O: "111101101101111", P: "111101111100100", E: "111100110100111",
    R: "111101111110101", A: "111101111101101", T: "111010010010010",
    I: "111010010010111", N: "101111111101101", S: "111100111001111"
  };

  function chalkWord(ctx, word, x, y, color) {
    for (var i = 0; i < word.length; i++) {
      var g = GLYPHS[word.charAt(i)];
      if (!g) continue;
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (g.charAt(r * 3 + c) === "1") rect(ctx, x + i * 4 + c, y + r, 1, 1, color);
        }
      }
    }
  }

  function chalkboard(ctx) {
    rect(ctx, 8, 26, 68, 46, L.benchDark);
    rect(ctx, 10, 28, 64, 42, "#1f2a24");
    // Heading, centred, with a rule under it.
    chalkWord(ctx, "OPERATIONS", 23, 32, L.glass);
    rect(ctx, 22, 39, 40, 1, L.glassDim);
    // Scribbled notes below - short ragged lines, one crossed out.
    var lines = [[14, 44, 30], [14, 48, 44], [14, 52, 22], [40, 52, 16],
      [14, 56, 38], [14, 60, 26], [46, 60, 14], [14, 64, 34]];
    lines.forEach(function (l) { rect(ctx, l[0], l[1], l[2], 1, L.glassDim); });
    // A crossed-out attempt.
    rect(ctx, 14, 48, 26, 1, L.fluidA);
  }

  // Herbs strung from the ceiling to dry.
  function herbs(ctx) {
    [92, 108, 124, 210, 234].forEach(function (x, i) {
      var len = 14 + (i % 3) * 5;
      rect(ctx, x, 0, 1, len, L.benchDark);
      rect(ctx, x - 3, len, 7, 6, i % 2 ? L.brewDim : "#5a6b34");
      rect(ctx, x - 2, len + 6, 5, 4, i % 2 ? "#5a6b34" : L.brewDim);
      rect(ctx, x - 1, len + 10, 3, 3, L.benchDark);
    });
  }

  // A shelf of specimen jars, each with something suspended in it.
  function jars(ctx, t) {
    rect(ctx, 86, 58, 52, 3, L.benchDark);
    rect(ctx, 86, 58, 52, 1, L.bench);
    var inner = [L.fluidA, L.brewDim, L.fluidB, L.glassDim];
    for (var i = 0; i < 4; i++) {
      var x = 89 + i * 13;
      rect(ctx, x, 44, 10, 14, L.glass);
      rect(ctx, x, 46, 10, 12, inner[i]);
      rect(ctx, x - 1, 42, 12, 3, L.benchDark);
      // The specimen bobs a little on its own timing.
      var bob = Math.sin(t * 1.3 + i * 1.7) > 0 ? 0 : 1;
      rect(ctx, x + 3, 50 + bob, 4, 4, L.wallLine);
    }
  }

  // A still on the end of the bench, dripping into a beaker.
  function still(ctx, t) {
    rect(ctx, 158, 74, 12, 12, L.iron);
    rect(ctx, 158, 74, 12, 3, L.ironLit);
    rect(ctx, 162, 68, 4, 6, L.iron);
    // Condenser running down to the beaker.
    rect(ctx, 170, 78, 8, 2, L.ironLit);
    rect(ctx, 176, 78, 2, 12, L.ironLit);
    rect(ctx, 172, 90, 8, 6, L.glass);
    rect(ctx, 172, 93, 8, 3, L.fluidB);
    // One drop, followed the whole way: out along the arm, then down the
    // pipe into the beaker, rather than appearing halfway.
    var d = (t * 0.8) % 1;
    if (d < 0.4) rect(ctx, 170 + (d / 0.4) * 6, 78, 2, 2, L.fluidB);
    else rect(ctx, 176, 78 + ((d - 0.4) / 0.6) * 14, 2, 2, L.fluidB);
  }

  // Mortar and pestle, standing on the near end of the bench.
  function labProps(ctx) {
    rect(ctx, 90, 86, 12, 8, L.iron);
    rect(ctx, 90, 86, 12, 2, L.glassDim);
    rect(ctx, 100, 80, 2, 8, L.bench);
  }

  // The two smelting ovens, standing clear of the bench on the right. A
  // burning one glows
  // through its door and breathes.
  function ovens(ctx, t, lit) {
    OVEN_X.forEach(function (x, i) {
      var on = !!(lit && lit[i]);
      rect(ctx, x, 100, 30, 18, L.iron);
      rect(ctx, x, 100, 30, 2, L.ironLit);
      rect(ctx, x + 2, 118, 26, 3, L.ironLit);
      // The door, dark when cold, coals when the burn is on.
      rect(ctx, x + 5, 104, 20, 11, on ? "#7a2a08" : "#1a1512");
      if (!on) {
        rect(ctx, x + 5, 104, 20, 1, "#12100e");
        return;
      }
      var beat = (Math.sin(t * 5 + i * 2) + 1) / 2;
      rect(ctx, x + 7, 107, 16, 6, beat > 0.5 ? "#ef6a15" : "#c3390f");
      rect(ctx, x + 9, 109, 12, 3, beat > 0.5 ? "#ffd75e" : "#ffa32b");
      // Light spilling out onto the floor in front.
      var g = ctx.createRadialGradient(x + 15, 110, 4, x + 15, 110, 34);
      g.addColorStop(0, "rgba(255,140,50,0.30)");
      g.addColorStop(1, "rgba(255,140,50,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }

  // The three crucibles on the left, on their own stands. A cooking one
  // glows from the melt inside.
  function crucibles(ctx, t, lit) {
    CRUCIBLE_X.forEach(function (x, i) {
      var on = !!(lit && lit[i]);
      // Stand.
      rect(ctx, x + 2, 108, 3, 10, L.iron);
      rect(ctx, x + 15, 108, 3, 10, L.iron);
      rect(ctx, x, 118, 20, 3, L.ironLit);
      // Pot.
      rect(ctx, x, 92, 20, 16, L.iron);
      rect(ctx, x - 1, 90, 22, 3, L.ironLit);
      rect(ctx, x + 2, 95, 3, 10, L.ironLit);
      if (!on) return;
      // The melt, and what it throws up.
      var beat = (Math.sin(t * 4 + i * 1.7) + 1) / 2;
      rect(ctx, x + 2, 92, 16, 4, beat > 0.5 ? "#ffd75e" : "#ef6a15");
      rect(ctx, x + 2, 96, 16, 8, "#a4503a");
      for (var k = 0; k < 3; k++) {
        var life = (t * 0.7 + k / 3 + i * 0.2) % 1;
        rect(ctx, x + 4 + k * 6, 90 - life * 16, 2, 2,
          life > 0.6 ? "#c3390f" : "#ffa32b");
      }
      var g = ctx.createRadialGradient(x + 10, 96, 4, x + 10, 96, 40);
      g.addColorStop(0, "rgba(255,170,60,0.26)");
      g.addColorStop(1, "rgba(255,170,60,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }

  ROOMS.lab = function (ctx, t, work) {
    work = work || {};
    wall(ctx, L.wallDark, L.wallMid, L.wallLine);
    chalkboard(ctx);
    jars(ctx, t);
    herbs(ctx);
    bench(ctx);
    floor(ctx, L.floor, L.floorDark, L.floorLine);
    labProps(ctx);
    ovens(ctx, t, work.ovens);
    crucibles(ctx, t, work.crucibles);
    glassware(ctx, t);
    still(ctx, t);
    var g = ctx.createRadialGradient(116, 96, 8, 116, 96, 110);
    g.addColorStop(0, "rgba(79,191,106,0.22)");
    g.addColorStop(1, "rgba(79,191,106,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    vignette(ctx);
  };

  /* ---- the pixel wipe ----------------------------------------------------
     The scene is cut into chunks. Going out, the ones furthest from the middle
     blink away first and the room eats inward; coming in, the new room grows
     back out of the middle. A little jitter per chunk keeps the edge ragged
     rather than a clean circle. */
  var CELL = 4;
  var COLS = W / CELL, ROWS = H / CELL;
  var order = new Float32Array(COLS * ROWS);      // out from the middle
  var down = new Float32Array(COLS * ROWS);       // down from the top
  var across = new Float32Array(COLS * ROWS);     // across from the left
  (function () {
    var cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
    var max = Math.sqrt(cx * cx + cy * cy);
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var dx = c - cx, dy = r - cy;
        var d = Math.sqrt(dx * dx + dy * dy) / max;
        order[r * COLS + c] = Math.min(1, Math.max(0, d + (Math.random() - 0.5) * 0.14));
        down[r * COLS + c] = Math.min(1, Math.max(0,
          r / (ROWS - 1) + (Math.random() - 0.5) * 0.12));
        across[r * COLS + c] = Math.min(1, Math.max(0,
          c / (COLS - 1) + (Math.random() - 0.5) * 0.12));
      }
    }
  })();

  var BACKDROP = "#140b07";

  /* The ways a room can be swapped for another. Every one of them works the
     same underneath: each chunk carries a number, and the wipe hides the
     chunks whose number the sweep has passed.
       ""       edges in, then out of the middle again
       "down"   top to bottom      "up"    bottom to top
       "right"  left to right      "left"  right to left */
  var STYLES = ["", "down", "up", "right", "left"];

  function wipe(ctx, phase, p, style) {
    var key = order, flip = false, sweep = false;
    if (style === "down" || style === "up") { key = down; sweep = true; }
    if (style === "right" || style === "left") { key = across; sweep = true; }
    if (style === "up" || style === "left") flip = true;
    ctx.fillStyle = BACKDROP;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var d = key[r * COLS + c];
        if (flip) d = 1 - d;
        var hidden;
        if (sweep) hidden = phase === "out" ? d <= p : d > p;
        else hidden = phase === "out" ? d >= 1 - p : d > p;
        if (hidden) ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  // Which axis a sweep runs along, so the same one cannot be drawn twice in
  // a row along that axis. The edges-in wipe has no axis and only rules
  // itself out.
  var AXIS = { down: "rows", up: "rows", right: "cols", left: "cols" };
  var lastStyle = null;

  // One of the sweeps, picked at random: walking between rooms should not
  // always look the same, and never the same way twice running.
  function anyStyle() {
    var barred = lastStyle === null ? "" : (AXIS[lastStyle] || lastStyle);
    var pool = STYLES.filter(function (style) {
      return lastStyle === null ||
        (style !== lastStyle && (AXIS[style] || style) !== barred);
    });
    lastStyle = pool[Math.random() * pool.length | 0];
    return lastStyle;
  }

  /* A banner is a real cutout of the room: the room is drawn to an offscreen
     canvas and a strip of it is handed back as an image, so a button wears
     the actual pixels of the place it walks you to. */
  var BANNERS = {
    // A low band across the lab: the crucibles on the left, the bench top
    // and what is standing on it, and the ovens off to the right.
    lab:     { x: 20,  y: 86, w: 220, h: 32 },
    enchant: { x: 76,  y: 42, w: 170, h: 62 }    // the table and its book
  };

  function banner(name) {
    var cut = BANNERS[name];
    if (!cut || !ROOMS[name]) return "";
    var full = document.createElement("canvas");
    full.width = W;
    full.height = H;
    var fc = full.getContext("2d");
    fc.imageSmoothingEnabled = false;
    // A fixed moment, so the strip never flickers, and with the room's
    // machines running: a banner of a cold workshop reads as broken.
    ROOMS[name](fc, 1.35, { snapshot: true, ovens: [true, true],
      crucibles: [true, true, true] });
    var out = document.createElement("canvas");
    out.width = cut.w;
    out.height = cut.h;
    var oc = out.getContext("2d");
    oc.imageSmoothingEnabled = false;
    oc.drawImage(full, cut.x, cut.y, cut.w, cut.h, 0, 0, cut.w, cut.h);
    return out.toDataURL();
  }

  // A room can also be written in its own file: hand in the draw call, the
  // strip to cut its banner from, and it joins the rest.
  function add(name, draw, cut) {
    ROOMS[name] = draw;
    BANNERS[name] = cut;
  }

  global.Rooms = {
    banner: banner,
    draw: function (name, ctx, t, work) { ROOMS[name](ctx, t, work || {}); },
    has: function (name) { return !!ROOMS[name]; },
    add: add,
    wipe: wipe,
    anyStyle: anyStyle,
    // Which fitting in a room a click lands on: the whole hotspot, so the
    // scene can bracket the one under the pointer.
    spotAt: spotAt,
    hasSpots: hasSpots,
    // The shared shell every room is built on.
    parts: { rect: rect, wall: wall, floor: floor, vignette: vignette }
  };
})(window);
