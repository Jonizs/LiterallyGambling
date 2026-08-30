/* The polishing room: a treadle grindstone, stones and oils, and a blade
   being brought up to a shine. Everything in here is brass and lamplight. */
(function (global) {
  "use strict";

  var R = global.Rooms;
  var rect = R.parts.rect, wall = R.parts.wall, floor = R.parts.floor,
      vignette = R.parts.vignette;
  var W = 256, H = 160;

  var P = {
    wallDark: "#241b10", wallMid: "#332615", wallLine: "#160f07",
    floor: "#3a2a15", floorDark: "#2c1f10", floorLine: "#1b1208",
    wood: "#5c3a1e", woodLit: "#8a5a2b", woodDark: "#3d2412",
    stone: "#6b6154", stoneLit: "#8d8172", stoneDark: "#453d33",
    iron: "#4a4a52", ironLit: "#6d6d78",
    gold: "#c9a154", goldLit: "#f0d191", goldDark: "#7a5a25",
    steel: "#9aa0ab", steelLit: "#e2e8f0",
    oil: "#b8762a", cloth: "#c9b892", flame: "#ffd75e"
  };

  // A filled pixel disc, drawn a row at a time so the edge steps the way the
  // rest of the art does. PX keeps the steps chunky rather than antialiased.
  var PX = 2;
  function disc(ctx, cx, cy, r, color) {
    for (var dy = -r; dy < r; dy += PX) {
      var half = Math.sqrt(Math.max(0, r * r - dy * dy));
      if (half < 1) continue;
      rect(ctx, cx - half, cy + dy, half * 2, PX, color);
    }
  }

  // The treadle grindstone: a stone wheel turning in a timber frame over its
  // water trough, cranked from the side and pumped from the pedal below.
  // The stone stands where the crate of finished pieces used to, hard left,
  // so the middle of the room is clear.
  var STONE = { cx: 46, cy: 82 };

  function grindstone(ctx, t) {
    var cx = STONE.cx, cy = STONE.cy, r = 24;
    var a = t * 2.2;   // where the wheel is in its turn

    // Frame: two uprights, a foot beam, and the brace across the back.
    rect(ctx, cx - 32, cy - 12, 6, 46, P.woodDark);
    rect(ctx, cx + 26, cy - 12, 6, 46, P.woodDark);
    rect(ctx, cx - 32, cy - 12, 6, 3, P.wood);
    rect(ctx, cx + 26, cy - 12, 6, 3, P.wood);
    rect(ctx, cx - 30, cy + 2, 60, 4, P.wood);
    rect(ctx, cx - 36, cy + 34, 72, 6, P.wood);
    rect(ctx, cx - 36, cy + 34, 72, 2, P.woodLit);

    // The stone: a dark rim, the wheel face, and a worn lighter band.
    disc(ctx, cx, cy, r, P.stoneDark);
    disc(ctx, cx, cy, r - 2, P.stone);
    disc(ctx, cx, cy, r - 7, P.stoneLit);
    disc(ctx, cx, cy, r - 10, P.stone);
    // Grinding grain: four marks that ride round with the wheel.
    for (var i = 0; i < 4; i++) {
      var g = a + i * (Math.PI / 2);
      rect(ctx, cx + Math.cos(g) * (r - 6), cy + Math.sin(g) * (r - 6),
        3, 3, P.stoneDark);
    }
    // Light down the leading edge, where it meets the blade.
    rect(ctx, cx + r - 4, cy - 10, 2, 16, P.stoneLit);

    // Iron axle, and the crank arm swinging off it.
    disc(ctx, cx, cy, 6, P.iron);
    rect(ctx, cx - 2, cy - 2, 4, 4, P.ironLit);
    var hx = cx + Math.cos(a) * 11, hy = cy + Math.sin(a) * 11;
    // The arm is stepped along its own line, so it reads at any angle.
    for (var k = 3; k <= 10; k += 2) {
      rect(ctx, cx + Math.cos(a) * k - 1, cy + Math.sin(a) * k - 1, 3, 3, P.iron);
    }
    rect(ctx, hx - 2, hy - 2, 5, 5, P.wood);
    rect(ctx, hx - 2, hy - 2, 5, 2, P.woodLit);

    // Water trough slung under the wheel, and the pedal beside it.
    rect(ctx, cx - 20, cy + 22, 40, 10, P.woodDark);
    rect(ctx, cx - 18, cy + 24, 36, 5, "#2c4a52");
    rect(ctx, cx - 18, cy + 24, 36, 1, "#4d7a83");
    rect(ctx, cx - 17, cy + 24, 6, 2, "#7fb2bb");
    var pedal = Math.sin(a) > 0 ? 0 : 2;
    rect(ctx, cx + 4, cy + 40 + pedal, 26, 4, P.wood);
    rect(ctx, cx + 26, cy + 6, 3, 34 + pedal, P.iron);
  }

  // Sparks thrown off the wheel while it turns.
  function sparks(ctx, t) {
    for (var i = 0; i < 10; i++) {
      var life = (t * 1.6 + i / 10) % 1;
      var x = STONE.cx + 24 + life * 26 + i;
      var y = STONE.cy - 10 + life * life * 30 - (i % 3) * 3;
      rect(ctx, x, y, 2, 1, life > 0.7 ? P.gold : P.goldLit);
    }
  }

  // The bench on the right: whetstones, oil, cloth and the blade in progress.
  function bench(ctx, t) {
    var bx = 198, bw = 48;
    rect(ctx, bx, 92, bw, 6, P.wood);
    rect(ctx, bx, 92, bw, 2, P.woodLit);
    rect(ctx, bx + 6, 98, 5, 20, P.woodDark);
    rect(ctx, bx + 37, 98, 5, 20, P.woodDark);
    // A blade lying flat on the bench top, hilt to the right.
    rect(ctx, bx + 2, 86, 26, 6, P.steel);
    rect(ctx, bx + 2, 86, 26, 2, P.steelLit);
    rect(ctx, bx - 1, 87, 3, 4, P.steelLit);       // the point
    rect(ctx, bx + 28, 84, 4, 10, P.gold);         // guard
    rect(ctx, bx + 32, 87, 10, 4, P.woodDark);     // grip
    rect(ctx, bx + 42, 86, 3, 6, P.gold);          // pommel
    // A glint runs the edge now and then, rather than a block sliding along
    // it: most of the cycle there is nothing, then one quick pass.
    var cycle = (t * 0.35) % 1;
    if (cycle < 0.25) {
      var at = bx + 2 + (cycle / 0.25) * 22;
      rect(ctx, at, 86, 4, 2, P.steelLit);
      rect(ctx, at + 1, 86, 2, 1, "#ffffff");
    }
    // Whetstones stacked, an oil bottle and a folded cloth.
    rect(ctx, bx + 30, 76, 16, 4, P.stone);
    rect(ctx, bx + 32, 72, 12, 4, P.stoneLit);
    rect(ctx, bx + 2, 70, 8, 14, P.oil);
    rect(ctx, bx + 4, 66, 4, 4, P.woodDark);
    rect(ctx, bx + 2, 76, 8, 4, P.goldLit);
    rect(ctx, bx + 12, 76, 16, 8, P.cloth);
    rect(ctx, bx + 12, 76, 16, 2, "#e8dcc0");
  }

  // Buffing wheels and files hung on the wall, and the lamp that lights them.
  function wallKit(ctx, t) {
    rect(ctx, 16, 22, 60, 3, P.woodDark);
    for (var i = 0; i < 5; i++) {
      rect(ctx, 20 + i * 12, 25, 3, 16 + (i % 3) * 5, P.iron);
      rect(ctx, 19 + i * 12, 25, 5, 4, P.woodDark);
    }
    // Two buffing wheels on their pegs.
    [96, 122].forEach(function (x, i) {
      rect(ctx, x - 8, 18, 16, 16, i ? P.cloth : P.goldLit);
      rect(ctx, x - 5, 21, 10, 10, i ? "#e8dcc0" : P.gold);
      rect(ctx, x - 2, 24, 4, 4, P.woodDark);
    });
    // Hanging lamp: the warm light everything in here is polished by.
    rect(ctx, 200, 0, 2, 18, P.iron);
    rect(ctx, 192, 18, 18, 6, P.goldDark);
    rect(ctx, 194, 24, 14, 8, P.gold);
    var flick = Math.sin(t * 6.5) > 0 ? 0 : 1;
    rect(ctx, 198, 26 + flick, 6, 5 - flick, P.flame);
    var g = ctx.createRadialGradient(201, 30, 6, 201, 30, 90);
    g.addColorStop(0, "rgba(240,209,145,0.26)");
    g.addColorStop(1, "rgba(240,209,145,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // A bucket by the wheel. The crate that stood left of it is gone: the
  // stone stands there now.
  function props(ctx) {
    rect(ctx, 128, 106, 14, 12, P.iron);
    rect(ctx, 128, 106, 14, 2, P.ironLit);
    rect(ctx, 130, 109, 10, 4, "#2c4a52");
  }

  function draw(ctx, t, work) {
    wall(ctx, P.wallDark, P.wallMid, P.wallLine);
    wallKit(ctx, t);
    floor(ctx, P.floor, P.floorDark, P.floorLine);
    props(ctx);
    bench(ctx, t);
    grindstone(ctx, t);
    // A banner is one frozen frame, and sparks caught mid-air in it read as
    // dirt on the button rather than a wheel at work.
    if (!(work && work.snapshot)) sparks(ctx, t);
    vignette(ctx);
  }

  R.add("polish", draw, { x: 62, y: 44, w: 170, h: 62 });
})(window);
