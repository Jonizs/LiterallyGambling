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
    this.t = 0;
    this.raf = null;
  }

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

  Forge.prototype.drawAnvil = function () {
    var x = 100, y = 100;
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
  };

  Forge.prototype.drawProps = function () {
    // Leaning tools on the left.
    this.rect(46, 68, 5, 50, PALETTE.wood);
    this.rect(46, 68, 2, 50, PALETTE.woodDark);
    this.rect(56, 60, 4, 58, PALETTE.woodDark);
    this.rect(55, 56, 6, 6, PALETTE.steel);
    // Tongs on the floor.
    this.rect(20, 140, 34, 3, PALETTE.steel);
    this.rect(20, 145, 30, 3, PALETTE.steel);
    this.rect(52, 140, 4, 8, PALETTE.anvilEdge);
    // Brick and coal chunks on the right.
    this.rect(214, 132, 26, 14, PALETTE.brick);
    this.rect(214, 132, 26, 3, PALETTE.brickLit);
    this.rect(170, 142, 8, 5, PALETTE.coal);
    this.rect(180, 145, 5, 4, PALETTE.coal);
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

  Forge.prototype.frame = function (dt) {
    this.t += dt;
    var flicker = 0.85 + 0.15 * Math.sin(this.t * 6.3) + 0.05 * Math.sin(this.t * 17);
    this.ctx.clearRect(0, 0, W, H);
    this.drawWall();
    this.drawForge(flicker);
    this.drawFire(this.t);
    this.drawFloor();
    this.drawAnvil();
    this.drawProps();
    this.updateEmbers(dt);
    this.drawEmbers();
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
