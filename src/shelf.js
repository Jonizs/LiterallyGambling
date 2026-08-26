/* The artifact shelf on the forge wall: three slots, drawn in the scene. */
(function (global) {
  "use strict";

  var SLOTS = 3;
  var SIZE = 16;          // an artifact tile, scene pixels
  var LEFT = 196;         // first slot's left edge
  var STEP = 19;          // slot to slot
  var TOP = 72;           // where a tile sits
  var PLANK_Y = TOP + SIZE;
  var PLANK_L = LEFT - 3, PLANK_R = LEFT + STEP * (SLOTS - 1) + SIZE + 3;
  // The permanent pieces hang on their own peg above the shelf.
  var PEG_X = LEFT + STEP, PEG_Y = 46;

  var WOOD = "#5c3a1e", WOOD_LIT = "#8a5a2b", WOOD_DARK = "#3d2412";
  var EMPTY = "rgba(0,0,0,0.35)", EMPTY_EDGE = "#3a2a1c";

  // Icon tiles are painted once and then stamped into the scene each frame.
  var tiles = {};

  function tile(key) {
    if (!tiles[key]) tiles[key] = global.Icons.make(key);
    return tiles[key];
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function slotBox(index) {
    return { x: LEFT + index * STEP, y: TOP, w: SIZE, h: SIZE };
  }

  // Which slot a point in the scene falls in, or -1. The box is generous
  // downward so the plank under a tile counts as the slot above it.
  function slotAt(x, y) {
    for (var i = 0; i < SLOTS; i++) {
      var box = slotBox(i);
      if (x >= box.x - 1 && x <= box.x + box.w + 1 &&
          y >= box.y - 2 && y <= PLANK_Y + 3) return i;
    }
    return -1;
  }

  function drawPlank(ctx) {
    rect(ctx, PLANK_L, PLANK_Y, PLANK_R - PLANK_L, 1, WOOD_LIT);
    rect(ctx, PLANK_L, PLANK_Y + 1, PLANK_R - PLANK_L, 2, WOOD);
    rect(ctx, PLANK_L, PLANK_Y + 3, PLANK_R - PLANK_L, 1, WOOD_DARK);
    // Brackets, so the plank is holding on to something.
    rect(ctx, PLANK_L + 2, PLANK_Y + 4, 2, 4, WOOD_DARK);
    rect(ctx, PLANK_R - 4, PLANK_Y + 4, 2, 4, WOOD_DARK);
  }

  function drawEmpty(ctx, box) {
    rect(ctx, box.x + 3, box.y + 6, box.w - 6, box.h - 6, EMPTY);
    rect(ctx, box.x + 3, box.y + 6, box.w - 6, 1, EMPTY_EDGE);
  }

  // A slot waiting to be picked pulses a gold frame around itself.
  function drawPick(ctx, box, t) {
    var on = Math.sin(t * 6) > 0;
    var color = on ? "#ffd76a" : "#d9ac4f";
    rect(ctx, box.x - 1, box.y - 2, box.w + 2, 1, color);
    rect(ctx, box.x - 1, PLANK_Y, box.w + 2, 1, color);
    rect(ctx, box.x - 1, box.y - 2, 1, box.h + 3, color);
    rect(ctx, box.x + box.w, box.y - 2, 1, box.h + 3, color);
  }

  // The slot the pointer is over while a pick is waiting: a warm wash over
  // the tile, so it is plain which one is about to be swapped out.
  function drawHover(ctx, box) {
    ctx.fillStyle = "rgba(255, 215, 106, 0.22)";
    ctx.fillRect(box.x - 1, box.y - 2, box.w + 2, box.h + 3);
  }

  function drawPeg(ctx, key, index) {
    var x = PEG_X - index * STEP;
    rect(ctx, x + SIZE / 2 - 1, PEG_Y - 3, 2, 3, WOOD_DARK);
    ctx.drawImage(tile(key), x, PEG_Y);
  }

  // view: { keys: [on the shelf], permanent: [keys], picking, hover }
  function draw(ctx, view, t) {
    if (!view) return;
    drawPlank(ctx);
    for (var i = 0; i < SLOTS; i++) {
      var box = slotBox(i);
      var key = view.keys[i];
      if (key) ctx.drawImage(tile(key), box.x, box.y);
      else drawEmpty(ctx, box);
      if (view.picking) {
        drawPick(ctx, box, t);
        if (view.hover === i) drawHover(ctx, box);
      }
    }
    (view.permanent || []).forEach(function (key, at) { drawPeg(ctx, key, at); });
  }

  global.Shelf = { SLOTS: SLOTS, draw: draw, slotAt: slotAt };
})(window);
