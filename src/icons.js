/* 16x16 pixel icons for the forgeable pieces. */
(function (global) {
  "use strict";

  var C = {
    steel: "#b9bcc8", steelDark: "#6c707e", steelLit: "#e6e9f2",
    wood: "#8a5a2b", woodDark: "#5c3a1e",
    leather: "#7d4a24", leatherDark: "#4e2d14",
    gold: "#d9ac4f", shadow: "#241a12", string: "#e8dcc0"
  };

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  var DRAW = {
    sword: function (c) {
      px(c, 7, 1, 3, 9, C.steel);
      px(c, 7, 1, 1, 9, C.steelLit);
      px(c, 9, 2, 1, 8, C.steelDark);
      px(c, 6, 0, 5, 1, C.steelLit);
      px(c, 4, 10, 9, 2, C.gold);      // crossguard
      px(c, 7, 12, 3, 3, C.leather);   // grip
      px(c, 6, 15, 5, 1, C.gold);      // pommel
    },
    bow: function (c) {
      px(c, 5, 1, 3, 1, C.wood);
      px(c, 4, 2, 2, 3, C.wood);
      px(c, 3, 5, 2, 6, C.wood);
      px(c, 4, 11, 2, 3, C.wood);
      px(c, 5, 14, 3, 1, C.wood);
      px(c, 3, 5, 1, 6, C.woodDark);
      px(c, 8, 1, 1, 14, C.string);    // string
      px(c, 6, 7, 6, 1, C.steelDark);  // nocked arrow
      px(c, 12, 6, 2, 3, C.steel);
    },
    helmet: function (c) {
      px(c, 3, 3, 10, 3, C.steel);
      px(c, 2, 5, 12, 6, C.steel);
      px(c, 2, 5, 2, 6, C.steelLit);
      px(c, 12, 5, 2, 6, C.steelDark);
      px(c, 5, 7, 6, 2, C.shadow);     // visor slit
      px(c, 2, 11, 12, 2, C.steelDark);
      px(c, 7, 0, 2, 3, C.gold);       // crest
    },
    armor: function (c) {
      px(c, 4, 2, 8, 2, C.steel);
      px(c, 2, 4, 12, 8, C.steel);
      px(c, 2, 4, 2, 8, C.steelLit);
      px(c, 12, 4, 2, 8, C.steelDark);
      px(c, 7, 5, 2, 7, C.steelDark);  // centre seam
      px(c, 4, 12, 3, 3, C.steelDark);
      px(c, 9, 12, 3, 3, C.steelDark);
      px(c, 6, 0, 4, 2, C.gold);       // collar
    },
    boots: function (c) {
      px(c, 3, 2, 4, 9, C.leather);
      px(c, 3, 2, 1, 9, C.leatherDark);
      px(c, 2, 11, 6, 3, C.leatherDark);
      px(c, 9, 2, 4, 9, C.leather);
      px(c, 9, 2, 1, 9, C.leatherDark);
      px(c, 8, 11, 6, 3, C.leatherDark);
      px(c, 3, 5, 4, 1, C.gold);       // buckles
      px(c, 9, 5, 4, 1, C.gold);
    }
  };

  // Returns a 16x16 canvas holding the icon, scaled up by CSS.
  function make(key, className) {
    var canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    canvas.className = className || "icon";
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    (DRAW[key] || DRAW.sword)(ctx);
    return canvas;
  }

  global.Icons = { make: make, DRAW: DRAW };
})(window);
