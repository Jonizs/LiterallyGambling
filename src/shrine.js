/* The awakening shrine: a pedestal under a shaft of light, a rose window of
   runes behind it, and the offerings left at its steps. */
(function (global) {
  "use strict";

  var R = global.Rooms;
  var rect = R.parts.rect, wall = R.parts.wall, floor = R.parts.floor,
      vignette = R.parts.vignette;
  var W = 256, H = 160;

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

  
  // A rose window of runes above the pedestal, lit from behind.
  function window_(ctx, t) {
    var cx = 128, cy = 34;
    rect(ctx, cx - 26, cy - 22, 52, 44, A.stoneDark);
    rect(ctx, cx - 23, cy - 19, 46, 38, "#131a2c");
    for (var i = 0; i < 8; i++) {
      var a = i * (Math.PI / 4) + t * 0.15;
      var lit = (Math.sin(t * 1.4 + i) + 1) / 2;
      rect(ctx, cx + Math.cos(a) * 14 - 2, cy + Math.sin(a) * 12 - 2, 5, 5,
        lit > 0.6 ? A.coreLit : A.coreDim);
    }
    rect(ctx, cx - 3, cy - 3, 6, 6, A.gold);
    // Mullions.
    rect(ctx, cx - 1, cy - 19, 2, 38, A.stoneDark);
    rect(ctx, cx - 23, cy - 1, 46, 2, A.stoneDark);
  }

  // Banners hung between the pillars, and the chains that hold them.
  function banners(ctx) {
    [52, 188].forEach(function (x, i) {
      rect(ctx, x, 24, 2, 8, A.stoneDark);
      rect(ctx, x - 9, 32, 20, 44, i ? "#2a2340" : "#22304a");
      rect(ctx, x - 9, 32, 20, 3, A.gold);
      rect(ctx, x - 4, 42, 10, 10, A.goldLit);
      rect(ctx, x - 2, 44, 6, 6, i ? "#2a2340" : "#22304a");
      // Ragged hem.
      for (var f = 0; f < 20; f += 4) rect(ctx, x - 9 + f, 76, 2, 4, i ? "#2a2340" : "#22304a");
    });
  }

  // Steps up to the pedestal and the sigil ring cut into the floor.
  function dais(ctx) {
    rect(ctx, 92, 116, 72, 6, A.stoneDark);
    rect(ctx, 92, 116, 72, 2, A.stone);
    rect(ctx, 84, 122, 88, 6, A.stoneDark);
    rect(ctx, 84, 122, 88, 2, A.stone);
  }

  function draw(ctx, t) {
    wall(ctx, A.wallDark, A.wallMid, A.wallLine);
    window_(ctx, t);
    banners(ctx);
    pillars(ctx);
    floor(ctx, A.floor, A.floorDark, A.floorLine);
    dais(ctx);
    braziers(ctx, t);
    pedestal(ctx);
    core(ctx, t);
    vignette(ctx);
  }

  R.add("awaken", draw, { x: 62, y: 20, w: 170, h: 76 });
})(window);
