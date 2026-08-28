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

  // Shelves of books on both walls, so the room reads as a study.
  function shelves(ctx) {
    var spines = [P.cloth, P.clothLit, "#3d2412", "#5c3a1e", P.glow, "#2f4a6b"];
    [12, 196].forEach(function (x0, side) {
      for (var s = 0; s < 3; s++) {
        var y = 42 + s * 22;
        rect(ctx, x0, y + 16, 48, 3, P.woodDark);
        rect(ctx, x0, y + 16, 48, 1, P.wood);
        for (var b = 0; b < 11; b++) {
          var h = 10 + ((b * 7 + s * 5 + side * 3) % 5);
          rect(ctx, x0 + 2 + b * 4, y + 16 - h, 3, h,
            spines[(b + s * 2 + side) % spines.length]);
        }
      }
    });
  }

  // Two candle stands flanking the table.
  function candles(ctx, t) {
    [78, 172].forEach(function (x, i) {
      rect(ctx, x - 1, 96, 4, 22, P.woodDark);
      rect(ctx, x - 4, 116, 10, 3, P.woodDark);
      rect(ctx, x - 2, 90, 6, 7, P.candle);
      var flick = Math.sin(t * 7 + i * 2) > 0 ? 0 : 1;
      rect(ctx, x, 85 - flick, 2, 5 + flick, P.flame);
      rect(ctx, x, 83 - flick, 2, 2, P.page);
    });
  }

  // The table itself: an obsidian block under a purple cloth, open book on top.
  function table(ctx, t) {
    var x = 104, y = 92;
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

  // Runes drifting up out of the book, on a fixed cycle so they never pile up.
  function runes(ctx, t) {
    for (var i = 0; i < 9; i++) {
      var life = (t * 0.45 + i / 9) % 1;
      var x = 128 + Math.sin((i * 2.3) + life * 3.4) * (10 + i * 2);
      var y = 92 - life * 46;
      rect(ctx, x, y, 2, 2, life > 0.75 ? P.glow : P.rune);
      if (i % 3 === 0) rect(ctx, x + 2, y + 2, 1, 1, P.glow);
    }
  }

  ROOMS.enchant = function (ctx, t) {
    wall(ctx, P.wallDark, P.wallMid, P.wallLine);
    shelves(ctx);
    floor(ctx, P.floor, P.floorDark, P.floorLine);
    candles(ctx, t);
    table(ctx, t);
    runes(ctx, t);
    vignette(ctx);
  };

  /* ---- the experiment lab -----------------------------------------------
     A workbench of glassware over a cauldron, everything faintly green. */
  var L = {
    wallDark: "#141c18", wallMid: "#1d2a22", wallLine: "#0e1512",
    floor: "#2c3128", floorDark: "#232720", floorLine: "#161a14",
    bench: "#4a3a22", benchLit: "#6b5330", benchDark: "#2e2314",
    iron: "#3a3f3c", ironLit: "#565e59",
    brew: "#4fbf6a", brewLit: "#a7f0a0", brewDim: "#2c7a45",
    glass: "#bfe6dd", glassDim: "#7fa9a2",
    fluidA: "#d06fd0", fluidB: "#e8c14a", flame: "#ff9b3a"
  };

  function glassware(ctx, t) {
    // A row of flasks on the bench, each with a different brew in it.
    var fluids = [L.fluidA, L.brew, L.fluidB, L.fluidA];
    for (var i = 0; i < 4; i++) {
      var x = 150 + i * 16, y = 78;
      rect(ctx, x + 2, y, 2, 6, L.glassDim);          // neck
      rect(ctx, x, y + 6, 6, 10, L.glass);            // body
      rect(ctx, x, y + 11, 6, 5, fluids[i]);          // what is in it
      rect(ctx, x, y + 11, 6, 1, L.glassDim);
      // A bubble climbing the fluid, on its own cycle.
      var b = (t * 1.4 + i * 0.37) % 1;
      rect(ctx, x + 2 + (i % 2), y + 15 - (b * 4 | 0), 1, 1, L.glassDim);
    }
  }

  function cauldron(ctx, t) {
    var x = 96, y = 88;
    // Legs, belly, rim.
    rect(ctx, x + 6, y + 26, 4, 6, L.iron);
    rect(ctx, x + 30, y + 26, 4, 6, L.iron);
    rect(ctx, x + 2, y + 6, 36, 22, L.iron);
    rect(ctx, x + 2, y + 6, 36, 3, L.ironLit);
    rect(ctx, x, y + 4, 40, 4, L.ironLit);
    // The brew, with a surface that slops from side to side.
    var slop = Math.sin(t * 2.3) > 0 ? 0 : 1;
    rect(ctx, x + 4, y + 8 + slop, 32, 4, L.brew);
    rect(ctx, x + 4, y + 8 + slop, 32, 1, L.brewLit);
    // Fire under it.
    for (var f = 0; f < 5; f++) {
      var h = 3 + ((Math.sin(t * 9 + f) + 1) * 2 | 0);
      rect(ctx, x + 8 + f * 6, y + 32 - h, 4, h, f % 2 ? L.flame : "#ffd75e");
    }
    // Bubbles breaking the surface.
    for (var i = 0; i < 5; i++) {
      var life = (t * 0.8 + i / 5) % 1;
      rect(ctx, x + 8 + i * 6, y + 8 - (life * 5 | 0), 2, 2,
        life > 0.6 ? L.brewDim : L.brewLit);
    }
    // Steam rising off it.
    for (var v = 0; v < 6; v++) {
      var sl = (t * 0.35 + v / 6) % 1;
      var sx = x + 8 + v * 5 + Math.sin(sl * 6 + v) * 4;
      rect(ctx, sx, y + 4 - sl * 40, 2, 2, sl > 0.6 ? L.wallMid : L.glassDim);
    }
  }

  function bench(ctx) {
    rect(ctx, 140, 94, 88, 6, L.bench);
    rect(ctx, 140, 94, 88, 2, L.benchLit);
    rect(ctx, 144, 100, 5, 18, L.benchDark);
    rect(ctx, 219, 100, 5, 18, L.benchDark);
    // Notes pinned over it, and a rack of empty tubes.
    rect(ctx, 156, 52, 22, 16, "#d8caa4");
    rect(ctx, 158, 56, 18, 1, L.benchDark);
    rect(ctx, 158, 60, 14, 1, L.benchDark);
    rect(ctx, 158, 64, 16, 1, L.benchDark);
    rect(ctx, 190, 56, 30, 3, L.benchDark);
    for (var i = 0; i < 5; i++) rect(ctx, 192 + i * 6, 59, 3, 9, L.glass);
  }

  ROOMS.experimentation = function (ctx, t) {
    wall(ctx, L.wallDark, L.wallMid, L.wallLine);
    bench(ctx);
    floor(ctx, L.floor, L.floorDark, L.floorLine);
    cauldron(ctx, t);
    glassware(ctx, t);
    var g = ctx.createRadialGradient(116, 96, 8, 116, 96, 110);
    g.addColorStop(0, "rgba(79,191,106,0.22)");
    g.addColorStop(1, "rgba(79,191,106,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    vignette(ctx);
  };

  /* ---- the awakening shrine ---------------------------------------------
     A pedestal under a shaft of light, with a stone that turns above it. */
  var A = {
    wallDark: "#0f1018", wallMid: "#181a26", wallLine: "#090a10",
    floor: "#232636", floorDark: "#1b1d2b", floorLine: "#101220",
    stone: "#4a4a5c", stoneLit: "#67677e", stoneDark: "#2c2c3a",
    gold: "#c9a154", goldLit: "#f0d191",
    core: "#7fd8ff", coreLit: "#e6fbff", coreDim: "#2f7fa8"
  };

  function pillars(ctx) {
    [24, 216].forEach(function (x) {
      rect(ctx, x, 20, 16, 98, A.stone);
      rect(ctx, x, 20, 4, 98, A.stoneLit);
      rect(ctx, x + 12, 20, 4, 98, A.stoneDark);
      rect(ctx, x - 3, 16, 22, 6, A.stoneLit);
      rect(ctx, x - 3, 112, 22, 6, A.stoneLit);
    });
  }

  function braziers(ctx, t) {
    [64, 192].forEach(function (x, i) {
      rect(ctx, x - 6, 104, 12, 6, A.stone);
      rect(ctx, x - 2, 110, 4, 8, A.stoneDark);
      rect(ctx, x - 7, 118, 14, 3, A.stoneDark);
      var h = 4 + ((Math.sin(t * 8 + i * 3) + 1) * 2 | 0);
      rect(ctx, x - 3, 104 - h, 6, h, A.gold);
      rect(ctx, x - 1, 102 - h, 2, 3, A.goldLit);
    });
  }

  function pedestal(ctx) {
    var x = 112, y = 92;
    rect(ctx, x - 6, y + 20, 44, 6, A.stoneDark);
    rect(ctx, x, y + 6, 32, 16, A.stone);
    rect(ctx, x, y + 6, 32, 2, A.stoneLit);
    rect(ctx, x - 4, y, 40, 7, A.stoneLit);
    rect(ctx, x - 4, y + 5, 40, 2, A.stoneDark);
    // Gold inlay across the face.
    rect(ctx, x + 4, y + 12, 24, 1, A.gold);
    rect(ctx, x + 14, y + 10, 4, 6, A.goldLit);
  }

  // The stone hangs over the pedestal, turning and pulsing in its own light.
  function core(ctx, t) {
    var cx = 128, cy = 74 + (Math.sin(t * 1.6) > 0 ? 0 : 1);
    var w = 6 + Math.abs(Math.sin(t * 0.9)) * 4 | 0;   // the turn
    rect(ctx, cx - w / 2, cy - 8, w, 16, A.core);
    rect(ctx, cx - w / 2, cy - 8, w, 3, A.coreLit);
    rect(ctx, cx - w / 2, cy + 5, w, 3, A.coreDim);
    // Shaft of light falling on it from above.
    var beam = ctx.createLinearGradient(0, 0, 0, 92);
    beam.addColorStop(0, "rgba(127,216,255,0.16)");
    beam.addColorStop(1, "rgba(127,216,255,0)");
    ctx.fillStyle = beam;
    ctx.fillRect(cx - 22, 0, 44, 92);
    // Motes circling the stone.
    for (var i = 0; i < 8; i++) {
      var a = t * 1.1 + i * (Math.PI / 4);
      rect(ctx, cx + Math.cos(a) * 26, cy + Math.sin(a) * 9, 2, 2,
        i % 2 ? A.coreLit : A.goldLit);
    }
    var g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 70);
    g.addColorStop(0, "rgba(127,216,255,0.26)");
    g.addColorStop(1, "rgba(127,216,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  ROOMS.awaken = function (ctx, t) {
    wall(ctx, A.wallDark, A.wallMid, A.wallLine);
    pillars(ctx);
    floor(ctx, A.floor, A.floorDark, A.floorLine);
    braziers(ctx, t);
    pedestal(ctx);
    core(ctx, t);
    vignette(ctx);
  };

  /* ---- the pixel wipe ----------------------------------------------------
     The scene is cut into chunks. Going out, the ones furthest from the middle
     blink away first and the room eats inward; coming in, the new room grows
     back out of the middle. A little jitter per chunk keeps the edge ragged
     rather than a clean circle. */
  var CELL = 4;
  var COLS = W / CELL, ROWS = H / CELL;
  var order = new Float32Array(COLS * ROWS);
  (function () {
    var cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2;
    var max = Math.sqrt(cx * cx + cy * cy);
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var dx = c - cx, dy = r - cy;
        var d = Math.sqrt(dx * dx + dy * dy) / max;
        order[r * COLS + c] = Math.min(1, Math.max(0, d + (Math.random() - 0.5) * 0.14));
      }
    }
  })();

  var BACKDROP = "#140b07";

  // phase "out": p 0->1 hides from the edges inward.
  // phase "in":  p 0->1 reveals from the middle outward.
  function wipe(ctx, phase, p) {
    ctx.fillStyle = BACKDROP;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var d = order[r * COLS + c];
        var hidden = phase === "out" ? d >= 1 - p : d > p;
        if (hidden) ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
  }

  global.Rooms = { draw: function (name, ctx, t) { ROOMS[name](ctx, t); },
    has: function (name) { return !!ROOMS[name]; }, wipe: wipe };
})(window);
