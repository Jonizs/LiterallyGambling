/* The polishing room: one long bench under the lamp, covered in the files,
   papers, pastes and stones a piece is finished with. Brass and lamplight. */
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
    oil: "#b8762a", cloth: "#c9b892", flame: "#ffd75e",
    leather: "#6b4322", paste: "#a8414a", wax: "#d9c98a"
  };

  // The bench: a top the width of the room on four heavy legs, with a rail
  // and a lower shelf of boxes under it.
  var BENCH = { x: 20, top: 84, w: 216 };

  function benchBody(ctx) {
    var b = BENCH;
    // Top, its lit edge, and the apron under it.
    rect(ctx, b.x, b.top, b.w, 7, P.wood);
    rect(ctx, b.x, b.top, b.w, 2, P.woodLit);
    rect(ctx, b.x, b.top + 7, b.w, 5, P.woodDark);
    rect(ctx, b.x, b.top + 11, b.w, 1, "#2a1809");
    // Legs down to the floor, braced across the middle.
    [b.x + 6, b.x + b.w - 14].forEach(function (x) {
      rect(ctx, x, b.top + 12, 8, 46, P.woodDark);
      rect(ctx, x, b.top + 12, 2, 46, P.wood);
    });
    rect(ctx, b.x + 10, b.top + 34, b.w - 24, 4, P.woodDark);
    rect(ctx, b.x + 10, b.top + 34, b.w - 24, 1, P.wood);
    // Drawers in the apron, two brass pulls each.
    [b.x + 30, b.x + 96, b.x + 162].forEach(function (x) {
      rect(ctx, x, b.top + 8, 40, 3, "#4a2c14");
      rect(ctx, x + 12, b.top + 9, 4, 1, P.gold);
      rect(ctx, x + 26, b.top + 9, 4, 1, P.gold);
    });
    // What is stowed on the shelf: a crate, a stone box and a bucket.
    rect(ctx, 40, 102, 30, 16, P.woodDark);
    rect(ctx, 40, 102, 30, 2, P.wood);
    rect(ctx, 44, 106, 6, 8, P.gold);
    rect(ctx, 54, 106, 6, 8, P.steel);
    rect(ctx, 108, 106, 26, 12, P.stoneDark);
    rect(ctx, 108, 106, 26, 2, P.stone);
    rect(ctx, 112, 100, 18, 6, P.stoneLit);
    rect(ctx, 180, 104, 16, 14, P.iron);
    rect(ctx, 180, 104, 16, 2, P.ironLit);
    rect(ctx, 182, 107, 12, 4, "#2c4a52");
  }

  // The piece being worked: laid out on the bench with a file over it, and a
  // glint that runs the edge now and then.
  function workpiece(ctx, t) {
    var top = BENCH.top;
    // The piece itself lying flat on the bench top, hilt to the left.
    rect(ctx, 48, top - 6, 60, 6, P.steel);
    rect(ctx, 48, top - 6, 60, 2, P.steelLit);
    rect(ctx, 108, top - 5, 5, 4, P.steelLit);      // the point
    rect(ctx, 44, top - 8, 4, 10, P.gold);          // guard
    rect(ctx, 34, top - 5, 10, 4, P.woodDark);      // grip
    rect(ctx, 31, top - 6, 3, 6, P.gold);           // pommel
    var cycle = (t * 0.35) % 1;
    if (cycle < 0.25) {
      var at = 50 + (cycle / 0.25) * 54;
      rect(ctx, at, top - 6, 4, 2, P.steelLit);
      rect(ctx, at + 1, top - 6, 2, 1, "#ffffff");
    }
    // A file resting across the blade, handle to the right.
    rect(ctx, 62, top - 10, 30, 4, P.stone);
    rect(ctx, 62, top - 10, 30, 1, P.stoneLit);
    rect(ctx, 92, top - 12, 10, 7, P.wood);
    rect(ctx, 92, top - 12, 10, 2, P.woodLit);
  }

  // Everything else laid out along the bench: papers and blocks, pastes,
  // oils, a strop, and the stones and gems the sockets are cut for.
  function benchTools(ctx) {
    var top = BENCH.top;
    // Sanding blocks and a stack of papers.
    rect(ctx, 122, top - 9, 16, 9, P.wood);
    rect(ctx, 122, top - 11, 16, 3, P.cloth);
    rect(ctx, 122, top - 9, 16, 1, P.woodLit);
    rect(ctx, 142, top - 7, 18, 7, P.cloth);
    rect(ctx, 142, top - 7, 18, 1, "#e8dcc0");
    rect(ctx, 144, top - 4, 14, 1, "#9a8b6a");
    // A leather strop with its paste bar sitting on it.
    rect(ctx, 122, top - 22, 34, 6, P.leather);
    rect(ctx, 122, top - 22, 34, 1, "#8a5c33");
    rect(ctx, 130, top - 26, 12, 4, P.paste);
    // Three jars of compound, lids off.
    [164, 176, 188].forEach(function (x, i) {
      var fill = [P.paste, "#4a7a52", P.wax][i];
      rect(ctx, x, top - 14, 10, 14, "#2b2b31");
      rect(ctx, x + 1, top - 13, 8, 4, fill);
      rect(ctx, x, top - 16, 10, 2, P.ironLit);
    });
    // Oil bottle and a brush leaning on it.
    rect(ctx, 202, top - 18, 8, 18, P.oil);
    rect(ctx, 204, top - 22, 4, 4, P.woodDark);
    rect(ctx, 202, top - 10, 8, 4, P.goldLit);
    rect(ctx, 212, top - 14, 2, 14, P.wood);
    rect(ctx, 211, top - 16, 4, 3, P.cloth);
    // The gem tray at the far end: seats cut, stones waiting.
    rect(ctx, 218, top - 8, 32, 8, P.woodDark);
    rect(ctx, 218, top - 8, 32, 1, P.wood);
    ["#c8455a", "#4a8ad0", "#4fbf6a", "#e0c060"].forEach(function (c, i) {
      rect(ctx, 221 + i * 8, top - 6, 4, 4, c);
      rect(ctx, 221 + i * 8, top - 6, 4, 1, "#ffffff");
    });
    // Punches and a graver stood in a block behind the tray.
    rect(ctx, 224, top - 22, 14, 6, P.woodDark);
    [226, 230, 234].forEach(function (x, i) {
      rect(ctx, x, top - 30 + i % 2 * 3, 2, 9, P.steel);
      rect(ctx, x, top - 22, 2, 3, P.iron);
    });
    // Calipers left open on the bench top.
    rect(ctx, 168, top - 22, 18, 2, P.ironLit);
    rect(ctx, 168, top - 26, 2, 6, P.ironLit);
    rect(ctx, 184, top - 26, 2, 6, P.ironLit);
  }

  // The rail of tools over the bench, and the lamp that lights all of it.
  function wallKit(ctx, t) {
    // Peg rail with files, rasps, a hammer and a clamp hung off it.
    rect(ctx, 18, 28, 132, 3, P.woodDark);
    rect(ctx, 18, 28, 132, 1, P.wood);
    for (var i = 0; i < 7; i++) {
      var x = 24 + i * 18;
      rect(ctx, x, 31, 3, 14 + (i % 3) * 6, P.iron);
      rect(ctx, x - 1, 31, 5, 4, P.woodDark);
    }
    // A hammer and a clamp on the end pegs.
    rect(ctx, 156, 31, 3, 20, P.wood);
    rect(ctx, 150, 31, 15, 6, P.iron);
    rect(ctx, 150, 31, 15, 2, P.ironLit);
    rect(ctx, 172, 31, 4, 18, P.iron);
    rect(ctx, 172, 31, 14, 4, P.iron);
    rect(ctx, 182, 35, 4, 14, P.iron);
    rect(ctx, 172, 47, 14, 3, P.ironLit);
    // Hanging lamp: the warm light everything in here is polished by.
    rect(ctx, 200, 0, 2, 18, P.iron);
    rect(ctx, 192, 18, 18, 6, P.goldDark);
    rect(ctx, 194, 24, 14, 8, P.gold);
    var flick = Math.sin(t * 6.5) > 0 ? 0 : 1;
    rect(ctx, 198, 26 + flick, 6, 5 - flick, P.flame);
    var g = ctx.createRadialGradient(201, 30, 6, 201, 30, 100);
    g.addColorStop(0, "rgba(240,209,145,0.26)");
    g.addColorStop(1, "rgba(240,209,145,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function draw(ctx, t) {
    wall(ctx, P.wallDark, P.wallMid, P.wallLine);
    wallKit(ctx, t);
    floor(ctx, P.floor, P.floorDark, P.floorLine);
    benchBody(ctx);
    benchTools(ctx);
    workpiece(ctx, t);
    vignette(ctx);
  }

  // The bench is the one thing in here that answers a press: it wears the
  // same bracket and chevrons as the anvil and opens the polishing menu.
  R.add("polish", draw, { x: 62, y: 44, w: 170, h: 62 },
    [{ key: "polish", x: 20, y: 58, w: 216, h: 40 }]);
})(window);
