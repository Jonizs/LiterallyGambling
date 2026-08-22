/* 16x16 pixel icons for the forgeable pieces. */
(function (global) {
  "use strict";

  var C = {
    steel: "#b9bcc8", steelDark: "#6c707e", steelLit: "#e6e9f2",
    wood: "#8a5a2b", woodDark: "#5c3a1e", woodLit: "#ab7440",
    leather: "#7d4a24", leatherDark: "#4e2d14", leatherLit: "#a36733",
    gold: "#d9ac4f", goldDark: "#8f6d29", goldLit: "#f5dd9a",
    shadow: "#241a12", string: "#e8dcc0", silhouette: "#1b1712"
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
