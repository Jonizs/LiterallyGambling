/* The enchanting bench: the second room of the scene, and the pixel wipe that
   swaps the two. Same 256x160 grid and the same chunky pixels as the forge. */
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

  function rect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0));
  }

  function wall(ctx) {
    rect(ctx, 0, 0, W, FLOOR_Y, P.wallDark);
    for (var y = 0; y < FLOOR_Y; y += 8) {
      var offset = (y / 8) % 2 === 0 ? 0 : 8;
      for (var x = -8; x < W; x += 16) {
        rect(ctx, x + offset, y, 15, 7, P.wallMid);
        rect(ctx, x + offset, y + 7, 15, 1, P.wallLine);
      }
    }
  }

  function floor(ctx) {
    for (var y = FLOOR_Y, row = 0; y < H; y += 10, row++) {
      rect(ctx, 0, y, W, 9, row % 2 === 0 ? P.floor : P.floorDark);
      rect(ctx, 0, y + 9, W, 1, P.floorLine);
      for (var x = row % 2 === 0 ? 16 : 48; x < W; x += 32) {
        rect(ctx, x, y, 1, 9, P.floorLine);
      }
    }
    rect(ctx, 0, FLOOR_Y - 1, W, 1, P.floorLine);
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

  function draw(ctx, t) {
    wall(ctx);
    shelves(ctx);
    floor(ctx);
    candles(ctx, t);
    table(ctx, t);
    runes(ctx, t);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, W, 6);
    ctx.fillRect(0, H - 6, W, 6);
  }

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

  global.EnchantRoom = { draw: draw, wipe: wipe };
})(window);
