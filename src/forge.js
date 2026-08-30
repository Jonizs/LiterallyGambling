/* Pixel-art forge scene rendered on a low-resolution canvas and scaled up. */
(function (global) {
  "use strict";

  var W = 256, H = 160;
  var FLOOR_Y = 118;
  var PX = 2; // chunk size for the animated fire

  var PALETTE = {
    wallDark: "#241a19",
    wallMid: "#2f2321",
    wallLine: "#191111",
    brick: "#5a2f28",
    brickLit: "#7a4034",
    brickHot: "#a4503a",
    mortar: "#2a1714",
    hearth: "#1a0d0a",
    hearthGlow: "#83261a",
    floor: "#4a2c18",
    floorDark: "#38200f",
    floorLine: "#2a1709",
    anvil: "#2b2b30",
    anvilLit: "#4a4a52",
    anvilEdge: "#15151a",
    wood: "#5c3a1e",
    woodDark: "#3d2412",
    coal: "#241d1c",
    steel: "#7c7c86"
  };

  var FIRE = ["#7a1c0c", "#c3390f", "#ef6a15", "#ffa32b", "#ffd75e", "#fff2c0"];

  function Forge(canvas) {
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.embers = [];
    this.sparks = [];
    this.t = 0;
    this.raf = null;
    this.swing = null;  // active strike sequence
    this.iron = null;   // active soldering run
    this.shake = 0;     // seconds of screen shake left
    this.flash = 0;     // white impact flash left
    this.glow = 0;      // hot metal glow left on the anvil
    // What the artifact shelf is holding, kept by the HUD.
    this.shelf = { keys: [], permanent: [], picking: false, hover: -1 };
    this.room = "forge";  // which room the scene is showing
    // What the other rooms need to know: which ovens and crucibles are lit.
    this.work = { ovens: [], crucibles: [] };
    this.anvilHover = false;  // the pointer is over the anvil
    this.machineHover = null; // the lab hotspot under the pointer, if any
    this.wipe = null;     // the pixel dissolve mid-swap
  }

  var ANVIL_TOP = 104, STRIKE_X = 128;
  var HIT_TIME = 0.44;   // seconds per hammer blow
  var IMPACT_AT = 0.72;  // fraction of a blow when the head lands
  var LIFT = 22;         // pixels the head rises at the top of the swing
  var HEAD_DIST = 26;    // head centre to the smith's grip
  var HEAD_LONG = 5;     // half the head's length along the handle (11px)
  var HEAD_THICK = 9;    // half the head's thickness (19px)
  var SWING_ARC = 1.15;  // radians the hammer turns between rest and lift

  // Start a run of hammer blows. onDone fires once the last one settles.
  // heavyLast lands the final blow with everything the smith has.
  Forge.prototype.strike = function (blows, onImpact, onDone, heavyLast) {
    if (this.swing) return false;
    this.swing = {
      t: 0, blow: 0, blows: blows || 3, hitThisBlow: false,
      onImpact: onImpact, onDone: onDone, heavyLast: !!heavyLast
    };
    return true;
  };

  Forge.prototype.isStriking = function () { return !!this.swing || !!this.iron; };

  // --- soldering ------------------------------------------------------------
  // Parts are not hammered: the iron is held to the work for a few seconds and
  // throws sparks the whole time, then the part is done.
  var IRON_ANGLE = -0.62;   // radians, the iron comes in over the right shoulder
  var IRON_LEN = 34;        // tip to the end of the handle
  var IRON_STEEL = 19;      // how far up the shaft the steel runs
  var SPARK_EVERY = 0.045;  // seconds between spits of sparks

  Forge.prototype.solder = function (seconds, onDone) {
    if (this.swing || this.iron) return false;
    this.iron = { t: 0, dur: seconds || 3, spark: 0, onDone: onDone };
    return true;
  };

  Forge.prototype.isSoldering = function () { return !!this.iron; };

  // Where the iron is touching down this instant; the tip wanders along the
  // work so the seam looks run rather than spot-welded.
  Forge.prototype.ironTip = function (job) {
    return {
      x: STRIKE_X + Math.sin(job.t * 2.6) * 5,
      y: ANVIL_TOP - 4 + Math.sin(job.t * 9) * 1.2
    };
  };

  Forge.prototype.solderSparks = function (tip) {
    for (var i = 0; i < 3; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      var speed = 26 + Math.random() * 54;
      this.sparks.push({
        x: tip.x + (Math.random() - 0.5) * 3,
        y: tip.y + 2,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.22 + Math.random() * 0.3
      });
    }
  };

  Forge.prototype.updateSolder = function (dt) {
    var job = this.iron;
    if (!job) return;
    job.t += dt;
    var tip = this.ironTip(job);
    this.glow = Math.min(1.1, this.glow + dt * 2.2); // the work stays hot under it
    job.spark -= dt;
    if (job.spark <= 0) {
      job.spark = SPARK_EVERY;
      this.solderSparks(tip);
    }
    if (job.t >= job.dur) {
      var done = job.onDone;
      this.iron = null;
      this.flash = 0.09;   // one last pop as the iron comes off
      this.shake = 0.06;
      if (done) done();
    }
  };

  Forge.prototype.drawIron = function () {
    var job = this.iron;
    if (!job) return;
    var tip = this.ironTip(job);
    var ux = Math.cos(IRON_ANGLE), uy = Math.sin(IRON_ANGLE);
    for (var d = 0; d < IRON_LEN; d++) {
      var half = d < 3 ? 0 : d < IRON_STEEL ? 1 : 2;
      for (var v = -half; v <= half; v++) {
        var color;
        if (d < 4) color = d < 2 ? "#fffdf2" : FIRE[3];       // hot tip
        else if (d < IRON_STEEL) color = v < 0 ? "#9d9daa" : v > 0 ? PALETTE.anvilEdge : PALETTE.steel;
        else color = v < 0 ? "#6f4823" : v > 0 ? PALETTE.woodDark : PALETTE.wood;
        this.rect(Math.round(tip.x + ux * d - uy * v),
                  Math.round(tip.y + uy * d + ux * v), 1, 1, color);
      }
    }
    // Pool of heat where the iron meets the work.
    this.ctx.globalAlpha = 0.5 + 0.3 * Math.sin(job.t * 14);
    this.rect(tip.x - 3, tip.y + 1, 6, 2, FIRE[4]);
    this.ctx.globalAlpha = 1;
  };

  // Where the hammer meets the anvil, as fractions of the scene, so the HUD
  // can hang effects on the impact without repeating the layout numbers.
  Forge.prototype.impactPoint = function () {
    return { x: STRIKE_X / W, y: (ANVIL_TOP - 2) / H };
  };

  // Height of the hammer head above the anvil, 0 at the moment of impact.
  Forge.prototype.swingHeight = function (p) {
    if (p < 0.5) return LIFT * Math.sin((p / 0.5) * Math.PI / 2);
    if (p < IMPACT_AT) {
      var f = (p - 0.5) / (IMPACT_AT - 0.5);
      return LIFT * (1 - f * f);
    }
    var b = (p - IMPACT_AT) / (1 - IMPACT_AT);
    return 6 * Math.sin(b * Math.PI); // recoil bounce
  };

  // How far through the swing the hammer is turned, 0 at the anvil.
  Forge.prototype.swingLift = function (p) {
    return this.swingHeight(p) / LIFT;
  };

  Forge.prototype.updateSwing = function (dt) {
    var sw = this.swing;
    if (!sw) return;
    sw.t += dt;
    var p = sw.t / HIT_TIME;
    if (!sw.hitThisBlow && p >= IMPACT_AT) {
      sw.hitThisBlow = true;
      this.impact(sw.heavyLast && sw.blow + 1 === sw.blows ? 2.4 : 1);
      if (sw.onImpact) sw.onImpact(sw.blow + 1, sw.blows);
    }
    if (p >= 1) {
      sw.blow++;
      sw.t = 0;
      sw.hitThisBlow = false;
      if (sw.blow >= sw.blows) {
        var done = sw.onDone;
        this.swing = null;
        if (done) done();
      }
    }
  };

  // power is 1 for an ordinary blow; a heavier one shakes, flashes and
  // throws sparks in proportion.
  Forge.prototype.impact = function (power) {
    power = power || 1;
    this.shake = 0.14 * power;
    this.glow = Math.min(1.6, 0.9 * power);
    this.flash = 0.09 * power;
    // Sparks fly wide of the fire, otherwise they are lost against it.
    var count = Math.round(22 * power);
    for (var i = 0; i < count; i++) {
      var side = i % 2 ? 1 : -1;
      var a = -Math.PI / 2 + side * (0.5 + Math.random() * 1.15);
      var speed = (50 + Math.random() * 80) * (1 + (power - 1) * 0.5);
      this.sparks.push({
        x: STRIKE_X + (Math.random() - 0.5) * 12,
        y: ANVIL_TOP - 1,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.4 + Math.random() * 0.45
      });
    }
  };

  Forge.prototype.updateSparks = function (dt) {
    for (var i = this.sparks.length - 1; i >= 0; i--) {
      var s = this.sparks[i];
      s.vy += 150 * dt; // gravity
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y > ANVIL_TOP + 26) this.sparks.splice(i, 1);
    }
  };

  Forge.prototype.drawSparks = function () {
    for (var i = 0; i < this.sparks.length; i++) {
      var s = this.sparks[i];
      this.ctx.globalAlpha = Math.max(0, Math.min(1, s.life * 2));
      // A dark pixel behind each spark keeps it readable over the flame.
      this.rect(s.x, s.y + 1, 2, 2, "#2a1206");
      this.rect(s.x, s.y, 2, 2, s.life > 0.35 ? "#fffdf2" : "#ffd75e");
      this.ctx.globalAlpha = 1;
    }
    if (this.flash > 0) {
      this.ctx.globalAlpha = this.flash / 0.09 * 0.6;
      this.rect(STRIKE_X - 14, ANVIL_TOP - 5, 28, 7, "#fffdf2");
      this.ctx.globalAlpha = 1;
    }
  };

  // Hammer and the workpiece, drawn only while a strike is running.
  Forge.prototype.drawHammer = function () {
    if (!this.swing) return;
    var lift = this.swingLift(this.swing.t / HIT_TIME);
    // The hammer turns about the smith's grip, so the head travels an arc
    // and the whole tool tilts with it instead of sliding up and down.
    var pivotX = STRIKE_X + HEAD_DIST, pivotY = ANVIL_TOP - HEAD_THICK;
    var angle = Math.PI + lift * SWING_ARC;
    var ux = Math.cos(angle), uy = Math.sin(angle);
    var hx = pivotX + ux * HEAD_DIST, hy = pivotY + uy * HEAD_DIST;

    // Handle: a line of pixels from the grip out to the head.
    for (var d = 4; d < HEAD_DIST - HEAD_LONG; d++) {
      var sx = pivotX + ux * d, sy = pivotY + uy * d;
      for (var v = -1; v <= 0; v++) {
        var shade = v < 0 ? "#6f4823" : PALETTE.wood;
        // 2x2 rather than single pixels: at an angle the rounded positions
        // leave gaps between them and the tool goes see-through.
        this.rect(Math.round(sx - uy * v), Math.round(sy + ux * v), 2, 2, shade);
      }
    }

    // Head: a block rotated onto the same axis, lit on top, dark underneath.
    for (var u = -HEAD_LONG; u <= HEAD_LONG; u++) {
      for (var w = -HEAD_THICK; w <= HEAD_THICK; w++) {
        var edge = HEAD_THICK - 1;
        var color = w <= -edge ? "#9d9daa" : w >= edge ? PALETTE.anvilEdge : PALETTE.steel;
        if (u <= -HEAD_LONG + 2) color = w <= -edge ? "#8a8a95" : "#5f5f6a"; // face
        this.rect(Math.round(hx + ux * u - uy * w),
                  Math.round(hy + uy * u + ux * w), 2, 2, color);
      }
    }
  };

  Forge.prototype.drawWorkpiece = function () {
    if (!this.swing && !this.iron && this.glow <= 0) return;
    var heat = Math.max(0, this.glow);
    var color = heat > 0.6 ? "#fff2c0" : heat > 0.3 ? FIRE[4] : FIRE[2];
    this.rect(STRIKE_X - 8, ANVIL_TOP - 2, 16, 3, color);
    this.ctx.globalAlpha = 0.45 * heat;
    this.rect(STRIKE_X - 11, ANVIL_TOP - 4, 22, 6, FIRE[3]);
    this.ctx.globalAlpha = 1;
  };

  Forge.prototype.rect = function (x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0));
  };

  Forge.prototype.drawWall = function () {
    this.rect(0, 0, W, FLOOR_Y, PALETTE.wallDark);
    for (var y = 0; y < FLOOR_Y; y += 8) {
      var offset = (y / 8) % 2 === 0 ? 0 : 8;
      for (var x = -8; x < W; x += 16) {
        this.rect(x + offset, y, 15, 7, PALETTE.wallMid);
        this.rect(x + offset, y + 7, 15, 1, PALETTE.wallLine);
      }
    }
  };

  Forge.prototype.archProfile = function (y) {
    // Half-width of the forge opening at a given row.
    var left = 74, right = 182, top = 26, springY = 62;
    var cx = (left + right) / 2, r = (right - left) / 2;
    if (y >= springY) return { l: left, r: right };
    if (y < top) return null;
    var dy = (springY - y) / (springY - top);
    var half = r * Math.sqrt(Math.max(0, 1 - dy * dy));
    return { l: cx - half, r: cx + half };
  };

  Forge.prototype.drawForge = function (flicker) {
    var y, span;
    // Hearth interior + heat glow.
    for (y = 26; y < FLOOR_Y; y++) {
      span = this.archProfile(y);
      if (!span) continue;
      this.rect(span.l, y, span.r - span.l, 1, PALETTE.hearth);
    }
    for (y = 60; y < FLOOR_Y; y++) {
      span = this.archProfile(y);
      if (!span) continue;
      var k = (y - 60) / (FLOOR_Y - 60);
      this.ctx.globalAlpha = (0.16 + 0.5 * k) * flicker;
      this.rect(span.l + 4, y, span.r - span.l - 8, 1, PALETTE.hearthGlow);
      this.ctx.globalAlpha = 1;
    }
    // Brick arch ring.
    for (y = 22; y < FLOOR_Y; y++) {
      span = this.archProfile(y);
      if (!span) continue;
      var hot = y > 74 ? PALETTE.brickHot : PALETTE.brickLit;
      var band = ((y / 9) | 0) % 2 === 0 ? PALETTE.brick : hot;
      this.rect(span.l - 9, y, 9, 1, band);
      this.rect(span.r, y, 9, 1, band);
      if (y % 9 === 0) {
        this.rect(span.l - 9, y, 9, 1, PALETTE.mortar);
        this.rect(span.r, y, 9, 1, PALETTE.mortar);
      }
    }
    // Chimney hood above the arch.
    this.rect(60, 14, 136, 10, PALETTE.brick);
    this.rect(60, 14, 136, 2, PALETTE.brickLit);
    this.rect(60, 22, 136, 2, PALETTE.mortar);
    // Hanging sign board.
    this.rect(96, 6, 64, 9, PALETTE.woodDark);
    this.rect(97, 7, 62, 3, PALETTE.wood);
  };

  Forge.prototype.drawFire = function (t) {
    var cx = 128, halfW = 26, baseY = 112, maxH = 72;
    // Outer (dim) layers first, each one narrower and shorter than the last,
    // so the cooler colours stay visible as a rim around the white core.
    for (var i = 0; i < FIRE.length; i++) {
      var lhw = halfW * (1 - i * 0.13);
      var lmax = maxH * (1 - i * 0.15);
      for (var px = -lhw; px < lhw; px += PX) {
        var u = px / lhw;
        var body = Math.pow(Math.cos((u * Math.PI) / 2), 1.3);
        var wobble =
          0.13 * Math.sin(t * 3.1 + px * 0.22) +
          0.08 * Math.sin(t * 5.7 - px * 0.41) +
          0.05 * Math.sin(t * 8.3 + px * 0.11 + i);
        var h = lmax * body * (0.84 + wobble);
        if (h < PX) continue;
        this.rect(cx + px, baseY - h, PX, h, FIRE[i]);
      }
    }
    // Coal bed under the flames.
    for (var x = cx - halfW - 2; x < cx + halfW + 2; x += 4) {
      var glow = 0.5 + 0.5 * Math.sin(t * 2 + x);
      this.rect(x, baseY, 4, 4, PALETTE.coal);
      this.ctx.globalAlpha = 0.35 + 0.45 * glow;
      this.rect(x + 1, baseY + 1, 2, 2, FIRE[2]);
      this.ctx.globalAlpha = 1;
    }
  };

  Forge.prototype.drawFloor = function () {
    // Horizontal planks, alternating shade, with visible seams and nail dots.
    for (var y = FLOOR_Y, row = 0; y < H; y += 10, row++) {
      var board = row % 2 === 0 ? PALETTE.floor : PALETTE.floorDark;
      this.rect(0, y, W, 9, board);
      this.rect(0, y + 9, W, 1, PALETTE.floorLine);
      for (var x = row % 2 === 0 ? 10 : 40; x < W; x += 64) {
        this.rect(x, y + 2, 1, 5, PALETTE.floorLine);
        this.rect(x + 30, y + 3, 2, 1, PALETTE.wood);
      }
    }
    this.rect(0, FLOOR_Y - 1, W, 1, PALETTE.floorLine);
  };

  var ANVIL = { x: 100, y: 103, w: 58, h: 46 };

  // The other two things in the forge that answer a press: the machine on the
  // desk and the pack under the shelf. Both boxes follow the art below.
  var FORGE_SPOTS = [
    { key: "computer", x: 20, y: 72, w: 46, h: 50 },
    { key: "inventory", x: 198, y: 92, w: 26, h: 32 }
  ];

  Forge.prototype.spotAt = function (px, py) {
    for (var i = 0; i < FORGE_SPOTS.length; i++) {
      var spot = FORGE_SPOTS[i];
      if (px >= spot.x && px < spot.x + spot.w &&
          py >= spot.y && py < spot.y + spot.h) return spot;
    }
    return null;
  };
  Forge.prototype.anvilAt = function (px, py) {
    return px >= ANVIL.x && px <= ANVIL.x + ANVIL.w &&
      py >= ANVIL.y && py <= ANVIL.y + ANVIL.h;
  };

  Forge.prototype.drawAnvil = function () {
    var x = ANVIL.x, y = 100;
    // Stump base.
    this.rect(x + 16, y + 26, 28, 22, PALETTE.woodDark);
    this.rect(x + 18, y + 26, 24, 3, PALETTE.wood);
    // Waist and body.
    this.rect(x + 20, y + 14, 20, 12, PALETTE.anvil);
    this.rect(x + 8, y + 4, 44, 11, PALETTE.anvil);
    this.rect(x + 8, y + 4, 44, 2, PALETTE.anvilLit);
    this.rect(x + 8, y + 15, 44, 1, PALETTE.anvilEdge);
    // Horn and heel.
    this.rect(x, y + 6, 10, 6, PALETTE.anvil);
    this.rect(x + 52, y + 5, 6, 8, PALETTE.anvil);
    this.rect(x + 14, y + 44, 32, 4, PALETTE.anvilEdge);
    // Under the pointer only the corners light, like a bracket drawn round
    // the anvil, with a chevron blinking either side of it.
    if (this.anvilHover) {
      this.corners(x - 1, y + 3, 60, 46, 8, "#ffd76a");
      if ((this.t * 1.6) % 1 < 0.55) {
        this.chevron(x - 12, y + 20, 1);
        this.chevron(x + 70, y + 20, -1);
      }
    }
  };

  // The lab's machines get the same bracket and blinking chevrons the anvil
  // wears, so what can be pressed reads the same in either room.
  Forge.prototype.drawMachineHover = function () {
    var box = this.machineHover;
    if (!box || this.wipe) return;
    var small = Math.min(box.w, box.h);
    var arm = Math.max(3, Math.min(8, small / 3 | 0));
    // The anvil's bracket is drawn round a 60x46 box, so anything smaller
    // gets the same mark scaled down rather than a chunky one.
    var scale = Math.max(0.5, Math.min(1, small / 46));
    this.corners(box.x - 1, box.y - 1, box.w + 2, box.h + 2, arm, "#ffd76a");
    if ((this.t * 1.6) % 1 < 0.55) {
      var cy = box.y + (box.h / 2 | 0);
      var gap = Math.round(11 * scale);
      this.chevron(box.x - gap, cy, 1, scale);
      this.chevron(box.x + box.w + gap, cy, -1, scale);
    }
  };

  // Four corner brackets round a box: two arms each, nothing in between.
  Forge.prototype.corners = function (x, y, w, h, arm, color) {
    var r = x + w - 2, b = y + h - 2;
    this.rect(x, y, arm, 2, color);
    this.rect(x, y, 2, arm, color);
    this.rect(r - arm + 2, y, arm, 2, color);
    this.rect(r, y, 2, arm, color);
    this.rect(x, b, arm, 2, color);
    this.rect(x, b - arm + 2, 2, arm, color);
    this.rect(r - arm + 2, b, arm, 2, color);
    this.rect(r, b - arm + 2, 2, arm, color);
  };

  // A pointing mark, ">" when dir is 1 and "<" when it is -1.
  Forge.prototype.chevron = function (cx, cy, dir, scale) {
    var step = Math.max(1, Math.round(2 * (scale || 1)));
    var reach = step * 3;
    for (var i = 0; i < 4; i++) {
      this.rect(cx + dir * i * step, cy - reach + i * step, step, step, "#ffd76a");
      this.rect(cx + dir * i * step, cy + reach - i * step, step, step, "#ffd76a");
    }
  };

  Forge.prototype.drawProps = function () {
    // Leaning tools on the left.
    this.rect(70, 68, 5, 50, PALETTE.wood);
    this.rect(70, 68, 2, 50, PALETTE.woodDark);
    this.rect(80, 60, 4, 58, PALETTE.woodDark);
    this.rect(79, 56, 6, 6, PALETTE.steel);
    // Tongs on the floor, out from under the desk.
    this.rect(66, 140, 34, 3, PALETTE.steel);
    this.rect(66, 145, 30, 3, PALETTE.steel);
    this.rect(98, 140, 4, 8, PALETTE.anvilEdge);
    // Brick and coal chunks on the right, clear of the pack.
    this.rect(232, 132, 22, 14, PALETTE.brick);
    this.rect(232, 132, 22, 3, PALETTE.brickLit);
    this.rect(170, 142, 8, 5, PALETTE.coal);
    this.rect(180, 145, 5, 4, PALETTE.coal);
    this.drawDesk();
    this.drawPack();
  };

  // The smith's desk under the tools, pushed back against the wall so it
  // stands at the far edge of the floor rather than out in the room.
  Forge.prototype.drawDesk = function () {
    var x = 22, top = 96;
    // Top and legs.
    this.rect(x, top, 42, 4, PALETTE.wood);
    this.rect(x, top, 42, 1, "#8a5a2b");
    this.rect(x, top + 4, 42, 1, PALETTE.woodDark);
    this.rect(x + 3, top + 5, 4, 17, PALETTE.woodDark);
    this.rect(x + 35, top + 5, 4, 17, PALETTE.woodDark);
    this.rect(x + 2, top + 22, 38, 2, PALETTE.woodDark);
    // A shadow where it meets the floor, so it reads as standing back there.
    this.ctx.globalAlpha = 0.35;
    this.rect(x, top + 24, 42, 2, "#1b0f06");
    this.ctx.globalAlpha = 1;

    // The machine: a boxy case with a screen sunk into it.
    var mx = x + 8, my = top - 22;
    this.rect(mx - 2, top - 3, 22, 3, "#6b6b74");      // stand
    this.rect(mx + 7, top - 6, 4, 4, "#565660");
    this.rect(mx - 4, my, 26, 20, "#8d8d97");          // case
    this.rect(mx - 4, my, 26, 2, "#a8a8b2");
    this.rect(mx - 4, my + 18, 26, 2, "#5f5f6a");
    this.rect(mx - 2, my + 2, 22, 14, "#131a16");      // bezel
    // The screen itself: four lines of something, sitting still.
    this.rect(mx, my + 4, 18, 10, "#123020");
    var LINES = [11, 6, 14, 8];
    for (var r = 0; r < LINES.length; r++) {
      this.rect(mx + 1, my + 5 + r * 2, LINES[r], 1,
        r === 2 ? "#a7f0a0" : "#4fbf6a");
    }
    // Keyboard on the desk in front of it.
    this.rect(x + 4, top - 3, 20, 3, "#6b6b74");
    this.rect(x + 4, top - 3, 20, 1, "#9a9aa4");
  };

  // A pack dumped against the wall under the artifact shelf.
  Forge.prototype.drawPack = function () {
    var x = 200, y = 92;
    var cloth = "#3f5a34", clothLit = "#587a48", clothDark = "#26361f";
    var strap = "#3d2412", buckle = "#c9a154";
    // Body, with the lid folded over the top of it.
    this.rect(x + 2, y + 6, 20, 20, cloth);
    this.rect(x + 2, y + 6, 20, 2, clothLit);
    this.rect(x + 2, y + 24, 20, 2, clothDark);
    this.rect(x, y + 9, 2, 15, clothDark);
    this.rect(x + 22, y + 9, 2, 15, clothDark);
    // Flap and its buckle.
    this.rect(x + 2, y + 2, 20, 7, clothLit);
    this.rect(x + 2, y + 2, 20, 1, "#6b8f56");
    this.rect(x + 9, y + 8, 6, 4, strap);
    this.rect(x + 10, y + 9, 4, 2, buckle);
    // Side pocket and the straps down the back.
    this.rect(x + 4, y + 14, 8, 9, clothDark);
    this.rect(x + 4, y + 14, 8, 1, cloth);
    this.rect(x + 16, y + 12, 3, 12, strap);
    // Bedroll strapped under it.
    this.rect(x, y + 26, 24, 4, "#7a5a35");
    this.rect(x, y + 26, 24, 1, "#9a744a");
    this.rect(x + 7, y + 26, 2, 4, "#5c422a");
    this.rect(x + 16, y + 26, 2, 4, "#5c422a");
    // Its own shadow on the floor behind it.
    this.ctx.globalAlpha = 0.35;
    this.rect(x, y + 30, 24, 2, "#1b0f06");
    this.ctx.globalAlpha = 1;
  };

  Forge.prototype.updateEmbers = function (dt) {
    if (this.embers.length < 26 && Math.random() < 0.5) {
      this.embers.push({
        x: 128 + (Math.random() - 0.5) * 46,
        y: 104,
        vy: -8 - Math.random() * 14,
        vx: (Math.random() - 0.5) * 6,
        life: 1
      });
    }
    for (var i = this.embers.length - 1; i >= 0; i--) {
      var e = this.embers[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.life -= dt * 0.5;
      if (e.life <= 0 || e.y < 10) this.embers.splice(i, 1);
    }
  };

  Forge.prototype.drawEmbers = function () {
    for (var i = 0; i < this.embers.length; i++) {
      var e = this.embers[i];
      this.ctx.globalAlpha = Math.max(0, Math.min(1, e.life));
      this.rect(e.x, e.y, 2, 2, e.life > 0.6 ? FIRE[4] : FIRE[2]);
      this.ctx.globalAlpha = 1;
    }
  };

  // Swap rooms behind a pixel wipe: the old one is eaten from the edges in,
  // the new one grows back out of the middle.
  var WIPE_SECONDS = 0.45;
  Forge.prototype.setRoom = function (name) {
    var known = name === "forge" ||
      (global.Rooms && global.Rooms.has(name));
    if (!known) { this.setRoom("forge"); return; }
    if (this.wipe) { this.wipe.next = name; return; }
    if (this.room === name) return;
    // Which way the pixels go is drawn fresh for every walk.
    var style = global.Rooms.anyStyle ? global.Rooms.anyStyle() : "";
    this.wipe = { phase: "out", t: 0, next: name, style: style };
  };

  Forge.prototype.updateWipe = function (dt) {
    var w = this.wipe;
    if (!w) return;
    w.t += dt;
    if (w.t < WIPE_SECONDS) return;
    if (w.phase === "out") {
      this.room = w.next;
      w.phase = "in";
      w.t = 0;
    } else if (w.next !== this.room) {
      w.phase = "out";
      w.t = 0;
    } else {
      this.wipe = null;
      if (this.onSettled) this.onSettled(this.room);
    }
  };

  Forge.prototype.frame = function (dt) {
    this.t += dt;
    this.updateSwing(dt);
    this.updateSolder(dt);
    this.updateSparks(dt);
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.glow = Math.max(0, this.glow - dt * 0.7);
    var flicker = 0.85 + 0.15 * Math.sin(this.t * 6.3) + 0.05 * Math.sin(this.t * 17);
    this.ctx.clearRect(0, 0, W, H);
    this.ctx.save();
    if (this.shake > 0) {
      this.ctx.translate((Math.random() - 0.5) * 3 | 0, (Math.random() - 0.5) * 3 | 0);
    }
    if (this.room === "forge") {
      this.drawWall();
      this.drawForge(flicker);
      this.drawFire(this.t);
      this.drawFloor();
      this.drawAnvil();
      this.drawProps();
      this.drawMachineHover();
      if (global.Shelf) global.Shelf.draw(this.ctx, this.shelf, this.t);
      // Embers drift out of the hearth behind the work, so they never float
      // over the hammer. The strike's own sparks stay in front.
      this.updateEmbers(dt);
      this.drawEmbers();
      this.drawWorkpiece();
      this.drawHammer();
      this.drawIron();
      this.drawSparks();
      // Warm light pooling in front of the forge.
      var grad = this.ctx.createRadialGradient(128, 100, 10, 128, 100, 120);
      grad.addColorStop(0, "rgba(255,140,50,0.22)");
      grad.addColorStop(1, "rgba(255,140,50,0)");
      this.ctx.globalAlpha = flicker;
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, W, H);
      this.ctx.globalAlpha = 1;
      // Vignette.
      this.ctx.fillStyle = "rgba(0,0,0,0.28)";
      this.ctx.fillRect(0, 0, W, 6);
      this.ctx.fillRect(0, H - 6, W, 6);
    } else {
      global.Rooms.draw(this.room, this.ctx, this.t, this.work);
      this.drawMachineHover();
    }
    this.updateWipe(dt);
    if (this.wipe) {
      global.Rooms.wipe(this.ctx, this.wipe.phase,
        Math.min(1, this.wipe.t / WIPE_SECONDS), this.wipe.style);
    }
    this.ctx.restore();
  };

  Forge.prototype.start = function () {
    var self = this, last = performance.now();
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      self.frame(dt);
      self.raf = requestAnimationFrame(loop);
    }
    this.raf = requestAnimationFrame(loop);
  };

  global.Forge = Forge;
})(window);
