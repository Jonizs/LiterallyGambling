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

  // The treadle grindstone: a wheel in a frame over a water trough, with a
  // crank and a pedal. It is the loudest thing in the room, so it sits middle.
  function grindstone(ctx, t) {
    var cx = 96, cy = 84, r = 22;
    // Frame legs and crossbar.
    rect(ctx, cx - 26, cy + 4, 5, 30, P.woodDark);
    rect(ctx, cx + 21, cy + 4, 5, 30, P.woodDark);
    rect(ctx, cx - 28, cy + 32, 56, 5, P.wood);
    rect(ctx, cx - 28, cy + 32, 56, 2, P.woodLit);
    // The wheel, stepped so it reads round without a curve tool.
    var steps = [[r, 6], [r - 3, 5], [r - 7, 5], [r - 12, 4]];
    var off = 0;
    steps.forEach(function (step) {
      rect(ctx, cx - step[0], cy - r + off, step[0] * 2, step[1], P.stone);
      off += step[1];
    });
    off = 0;
    steps.slice().reverse().forEach(function (step) {
      rect(ctx, cx - step[0], cy + off, step[0] * 2, step[1], P.stoneDark);
      off += step[1];
    });
    rect(ctx, cx - r + 2, cy - r + 2, 4, 10, P.stoneLit);
    // Hub and crank, turning on its own clock.
    rect(ctx, cx - 4, cy - 4, 8, 8, P.iron);
    var a = t * 2.2;
    rect(ctx, cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 4, 4, P.ironLit);
    rect(ctx, cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 5, 5, P.wood);
    // Water trough under the wheel.
    rect(ctx, cx - 18, cy + 22, 36, 8, P.woodDark);
    rect(ctx, cx - 16, cy + 23, 32, 4, "#2c4a52");
    rect(ctx, cx - 16, cy + 23, 32, 1, "#4d7a83");
  }

  // Sparks thrown off the wheel while it turns.
  function sparks(ctx, t) {
    for (var i = 0; i < 10; i++) {
      var life = (t * 1.6 + i / 10) % 1;
      var x = 118 + life * 26 + i;
      var y = 72 + life * life * 30 - (i % 3) * 3;
      rect(ctx, x, y, 2, 1, life > 0.7 ? P.gold : P.goldLit);
    }
  }

  // The bench on the right: whetstones, oil, cloth and the blade in progress.
  function bench(ctx, t) {
    rect(ctx, 150, 92, 96, 6, P.wood);
    rect(ctx, 150, 92, 96, 2, P.woodLit);
    rect(ctx, 156, 98, 5, 20, P.woodDark);
    rect(ctx, 236, 98, 5, 20, P.woodDark);
    // A blade laid out, catching the lamp along its edge.
    rect(ctx, 158, 84, 62, 6, P.steel);
    rect(ctx, 158, 84, 62, 2, P.steelLit);
    rect(ctx, 220, 85, 12, 4, P.woodDark);
    rect(ctx, 216, 83, 4, 8, P.gold);
    var shine = (t * 0.7) % 1;
    rect(ctx, 158 + shine * 58, 84, 5, 2, "#ffffff");
    // Whetstones stacked, an oil bottle and a folded cloth.
    rect(ctx, 226, 76, 16, 4, P.stone);
    rect(ctx, 228, 72, 12, 4, P.stoneLit);
    rect(ctx, 172, 70, 8, 14, P.oil);
    rect(ctx, 174, 66, 4, 4, P.woodDark);
    rect(ctx, 172, 76, 8, 4, P.goldLit);
    rect(ctx, 190, 76, 20, 8, P.cloth);
    rect(ctx, 190, 76, 20, 2, "#e8dcc0");
  }

  // Buffing wheels and files hung on the wall, and the lamp that lights them.
  function wallKit(ctx, t) {
    rect(ctx, 16, 30, 60, 3, P.woodDark);
    for (var i = 0; i < 5; i++) {
      rect(ctx, 20 + i * 12, 33, 3, 16 + (i % 3) * 5, P.iron);
      rect(ctx, 19 + i * 12, 33, 5, 4, P.woodDark);
    }
    // Two buffing wheels on their pegs.
    [96, 122].forEach(function (x, i) {
      rect(ctx, x - 8, 26, 16, 16, i ? P.cloth : P.goldLit);
      rect(ctx, x - 5, 29, 10, 10, i ? "#e8dcc0" : P.gold);
      rect(ctx, x - 2, 32, 4, 4, P.woodDark);
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

  // A crate of finished pieces and a bucket by the wheel.
  function props(ctx) {
    rect(ctx, 16, 100, 28, 18, P.woodDark);
    rect(ctx, 16, 100, 28, 2, P.wood);
    rect(ctx, 20, 96, 5, 5, P.gold);
    rect(ctx, 28, 94, 5, 7, P.steel);
    rect(ctx, 36, 96, 4, 5, P.goldLit);
    rect(ctx, 128, 106, 14, 12, P.iron);
    rect(ctx, 128, 106, 14, 2, P.ironLit);
    rect(ctx, 130, 109, 10, 4, "#2c4a52");
  }

  function draw(ctx, t) {
    wall(ctx, P.wallDark, P.wallMid, P.wallLine);
    wallKit(ctx, t);
    floor(ctx, P.floor, P.floorDark, P.floorLine);
    props(ctx);
    bench(ctx, t);
    grindstone(ctx, t);
    sparks(ctx, t);
    vignette(ctx);
  }

  R.add("polish", draw, { x: 62, y: 44, w: 170, h: 62 });
})(window);
