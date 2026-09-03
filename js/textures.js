/* Procedural 16x16 pixel textures.

   A face is described by a small object, e.g.
       { p: 'planks', c: ['#b8945f', '#a17b4c', '#caa878'] }
   where `p` names a painter below and `c` is its colour ramp (dark -> light).
   Painters draw into a 16x16 RGBA buffer; nothing is loaded from disk. */
(function (global) {
  'use strict';

  var S = 16;                 // texture resolution
  var hexToRgb = Rand.hexToRgb;
  var shade = Rand.shade;

  /* ---------------------------------------------------------------- canvas */

  function Px() {
    this.d = new Uint8ClampedArray(S * S * 4);
  }

  Px.prototype.set = function (x, y, hex, a) {
    x = ((x % S) + S) % S;
    y = ((y % S) + S) % S;
    var c = typeof hex === 'string' ? hexToRgb(hex) : hex;
    var i = (y * S + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2];
    this.d[i + 3] = a == null ? 255 : a;
  };

  Px.prototype.get = function (x, y) {
    var i = (((y % S) + S) % S * S + ((x % S) + S) % S) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  };

  Px.prototype.fill = function (hex, a) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) this.set(x, y, hex, a);
  };

  /** Darken/brighten a pixel that is already painted. */
  Px.prototype.tint = function (x, y, f) {
    var i = (((y % S) + S) % S * S + ((x % S) + S) % S) * 4;
    this.d[i] *= f; this.d[i + 1] *= f; this.d[i + 2] *= f;
  };

  Px.prototype.rect = function (x0, y0, x1, y1, hex, a) {
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) this.set(x, y, hex, a);
  };

  Px.prototype.frame = function (x0, y0, x1, y1, hex, a) {
    for (var x = x0; x <= x1; x++) { this.set(x, y0, hex, a); this.set(x, y1, hex, a); }
    for (var y = y0; y <= y1; y++) { this.set(x0, y, hex, a); this.set(x1, y, hex, a); }
  };

  /* ---------------------------------------------------------------- noise */

  function pick(rnd, arr) { return arr[(rnd() * arr.length) | 0]; }

  /** Weighted pick that favours the middle of a ramp. */
  function pickMid(rnd, arr) {
    var r = rnd(), n = arr.length;
    var i = r < .18 ? 0 : r < .82 ? (1 + (rnd() * Math.max(1, n - 2)) | 0) : n - 1;
    return arr[Math.min(i, n - 1)];
  }

  /** Tiling value noise sampled on an SxS grid. */
  function valueNoise(rnd, cells) {
    var g = [], i;
    for (i = 0; i < cells * cells; i++) g.push(rnd());
    var step = S / cells;
    return function (x, y) {
      var fx = x / step, fy = y / step;
      var x0 = Math.floor(fx) % cells, y0 = Math.floor(fy) % cells;
      var x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
      var tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      var a = g[y0 * cells + x0], b = g[y0 * cells + x1];
      var c = g[y1 * cells + x0], d = g[y1 * cells + x1];
      return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
    };
  }

  /** Voronoi cells, wrapped so the texture tiles. Returns cell id per pixel. */
  function cells(rnd, n) {
    var pts = [], i;
    for (i = 0; i < n; i++) pts.push([rnd() * S, rnd() * S]);
    return function (x, y) {
      var best = 1e9, id = 0;
      for (var k = 0; k < n; k++) {
        var dx = Math.abs(pts[k][0] - x - .5); if (dx > S / 2) dx = S - dx;
        var dy = Math.abs(pts[k][1] - y - .5); if (dy > S / 2) dy = S - dy;
        var d = dx * dx + dy * dy;
        if (d < best) { best = d; id = k; }
      }
      return id;
    };
  }

  /* ---------------------------------------------------------------- painters */

  var P = {};

  /* -- generic ground / stone ------------------------------------------- */

  P.solid = function (px, rnd, c) {
    var base = c[0];
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(base, 1 + (rnd() - .5) * .06));
    }
  };

  P.smooth = function (px, rnd, c) {
    var n = valueNoise(rnd, 4);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .94 + n(x, y) * .12));
    }
  };

  P.noise = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) px.set(x, y, pickMid(rnd, c));
  };

  P.grain = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, rnd() < .22 ? pick(rnd, c) : c[Math.min(1, c.length - 1)]);
    }
  };

  // Coarse clumps: gravel, coarse dirt, netherrack.
  P.blobs = function (px, rnd, c) {
    var id = cells(rnd, 9);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = c[id(x, y) % c.length];
      px.set(x, y, shade(v, 1 + (rnd() - .5) * .1));
    }
  };

  P.cobble = function (px, rnd, c) {
    var id = cells(rnd, 7);
    var grout = shade(c[0], .62);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var a = id(x, y);
      var edge = a !== id(x + 1, y) || a !== id(x, y + 1);
      px.set(x, y, edge ? grout : shade(c[1 + (a % (c.length - 1))], 1 + (rnd() - .5) * .12));
    }
  };

  P.deepslate = function (px, rnd, c) {
    var n = valueNoise(rnd, 8);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = n(x * .6, y * 1.6);
      px.set(x, y, shade(c[0], .86 + v * .3 + (rnd() - .5) * .06));
    }
  };

  P.basalt = function (px, rnd, c) {
    for (var x = 0; x < S; x++) {
      var col = shade(c[0], .82 + rnd() * .4);
      for (var y = 0; y < S; y++) px.set(x, y, shade(col, 1 + (rnd() - .5) * .07));
    }
  };

  /* -- masonry ----------------------------------------------------------- */

  P.bricks = function (px, rnd, c) {
    var mortar = c[c.length - 1];
    var rowH = 4;
    for (var y = 0; y < S; y++) {
      var row = (y / rowH) | 0;
      var off = (row % 2) * 4;
      for (var x = 0; x < S; x++) {
        var atRow = y % rowH === 0;
        var atCol = ((x + off) % 8) === 0;
        if (atRow || atCol) px.set(x, y, mortar);
        else px.set(x, y, shade(c[(row + ((x + off) / 8 | 0)) % (c.length - 1)], 1 + (rnd() - .5) * .12));
      }
    }
  };

  P.bigbricks = function (px, rnd, c) {
    var mortar = shade(c[0], .74);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var half = y < 8 ? 0 : 1;
      var seam = (y === 0 || y === 8) || (half === 0 ? x === 0 || x === 9 : x === 5 || x === 12);
      px.set(x, y, seam ? mortar : shade(c[1 % c.length], .92 + rnd() * .2));
    }
  };

  P.tiles = function (px, rnd, c) {
    var mortar = shade(c[0], .68);
    for (var ty = 0; ty < 2; ty++) {
      for (var tx = 0; tx < 2; tx++) {
        var tone = shade(c[1 % c.length], .94 + rnd() * .16);
        for (var y = 0; y < 8; y++) {
          for (var x = 0; x < 8; x++) {
            var gx = tx * 8 + x, gy = ty * 8 + y;
            px.set(gx, gy, (x === 0 || y === 0) ? mortar : shade(tone, 1 + (rnd() - .5) * .08));
          }
        }
      }
    }
  };

  P.chiseled = function (px, rnd, c) {
    P.smooth(px, rnd, c);
    px.frame(0, 0, 15, 15, shade(c[0], .72));
    px.frame(2, 2, 13, 13, shade(c[0], .8));
    px.rect(6, 4, 9, 11, shade(c[0], 1.12));
    px.rect(7, 5, 8, 10, shade(c[0], .86));
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) px.tint(x, y, 1 + (rnd() - .5) * .05);
  };

  P.pillar = function (px, rnd, c) {
    for (var x = 0; x < S; x++) {
      var edge = x === 0 || x === 15 || x === 4 || x === 11;
      var col = edge ? shade(c[0], .82) : shade(c[0], .98 + (x % 3) * .04);
      for (var y = 0; y < S; y++) px.set(x, y, shade(col, 1 + (rnd() - .5) * .05));
    }
  };

  P.rings = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = x - 7.5, dy = y - 7.5;
      var r = Math.sqrt(dx * dx + dy * dy);
      var band = (r * 1.15) | 0;
      px.set(x, y, shade(c[band % c.length], 1 + (rnd() - .5) * .08));
    }
  };

  /* -- wood -------------------------------------------------------------- */

  P.planks = function (px, rnd, c) {
    var boards = [0, 4, 9, 13, 16];
    for (var b = 0; b < boards.length - 1; b++) {
      var y0 = boards[b], y1 = boards[b + 1] - 1;
      var tone = c[b % c.length];
      var seam = (4 + rnd() * 8) | 0;
      for (var y = y0; y <= y1; y++) {
        for (var x = 0; x < S; x++) {
          var v = 1 + (rnd() - .5) * .1 - (rnd() < .12 ? .08 : 0);
          px.set(x, y, shade(tone, v));
        }
      }
      for (var x2 = 0; x2 < S; x2++) px.set(x2, y0, shade(tone, .74));
      for (var y2 = y0; y2 <= y1; y2++) px.set(seam, y2, shade(tone, .78));
    }
  };

  P.bark = function (px, rnd, c) {
    for (var x = 0; x < S; x++) {
      var tone = c[(rnd() * c.length) | 0];
      for (var y = 0; y < S; y++) {
        var v = 1 + (rnd() - .5) * .14;
        if (rnd() < .07) v -= .18;
        px.set(x, y, shade(tone, v));
      }
    }
  };

  P.bamboo = function (px, rnd, c) {
    P.solid(px, rnd, c);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      if (x === 3 || x === 12) px.set(x, y, shade(c[0], .8));
      if (y === 5 || y === 12) px.set(x, y, shade(c[0], .85));
    }
  };

  /* -- ores & minerals --------------------------------------------------- */

  P.ore = function (px, rnd, c, face) {
    var basePainter = P[face.base || 'noise'];
    basePainter(px, rnd, face.bc || ['#7d7d7d', '#888888', '#6f6f6f']);
    var gem = c[0], gem2 = c[1] || shade(gem, 1.25);
    var spots = 3 + ((rnd() * 3) | 0);
    for (var s = 0; s < spots; s++) {
      var cx = (rnd() * S) | 0, cy = (rnd() * S) | 0;
      var w = 2 + ((rnd() * 2) | 0), h = 2 + ((rnd() * 2) | 0);
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        if (rnd() < .18) continue;
        px.set(cx + x, cy + y, rnd() < .35 ? gem2 : gem);
      }
      px.set(cx, cy, shade(gem, .74));
    }
  };

  P.metal = function (px, rnd, c) {
    var n = valueNoise(rnd, 4);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = .9 + n(x, y) * .2;
      if (x === 0 || y === 0) v *= 1.08;
      if (x === 15 || y === 15) v *= .88;
      px.set(x, y, shade(c[0], v));
    }
    px.frame(3, 3, 12, 12, shade(c[0], .82));
    [[3, 3], [12, 3], [3, 12], [12, 12]].forEach(function (p) { px.set(p[0], p[1], shade(c[0], 1.2)); });
  };

  P.crystal = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var f = ((x + y) % 6 < 3) ? 1.08 : .9;
      var g = ((x - y + 16) % 8 < 4) ? 1.04 : .95;
      px.set(x, y, shade(c[0], f * g + (rnd() - .5) * .06));
    }
    px.frame(0, 0, 15, 15, shade(c[0], .78));
  };

  P.amethyst = function (px, rnd, c) {
    var id = cells(rnd, 6);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var a = id(x, y);
      var edge = a !== id(x + 1, y) || a !== id(x, y + 1);
      px.set(x, y, edge ? shade(c[0], .7) : shade(c[0], .9 + (a % 4) * .09));
    }
  };

  /* -- soil & growth ----------------------------------------------------- */

  P.grass_top = function (px, rnd, c) {
    var n = valueNoise(rnd, 8);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .84 + n(x, y) * .32 + (rnd() - .5) * .1));
    }
  };

  P.grass_side = function (px, rnd, c, face) {
    var dirt = face.dirt || ['#7b5b3f', '#8b6849', '#6b4e35'];
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) px.set(x, y, pickMid(rnd, dirt));
    var top = 2 + ((rnd() * 2) | 0);
    for (var x2 = 0; x2 < S; x2++) {
      var h = top + (rnd() < .45 ? 1 : 0);
      for (var y2 = 0; y2 < h; y2++) px.set(x2, y2, shade(c[0], .86 + rnd() * .3));
    }
  };

  P.path_top = function (px, rnd, c) {
    P.noise(px, rnd, c);
    px.frame(0, 0, 15, 15, shade(c[0], .8));
  };

  P.farmland = function (px, rnd, c) {
    P.noise(px, rnd, c);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      if (y % 5 === 0) px.tint(x, y, .78);
      if (y % 5 === 1) px.tint(x, y, 1.1);
    }
  };

  P.mycelium = function (px, rnd, c) {
    P.noise(px, rnd, c);
    for (var i = 0; i < 26; i++) px.set((rnd() * S) | 0, (rnd() * S) | 0, c[c.length - 1]);
  };

  P.moss = function (px, rnd, c) {
    var n = valueNoise(rnd, 6);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .8 + n(x, y) * .35 + (rnd() < .1 ? -.15 : 0)));
    }
  };

  P.wool = function (px, rnd, c) {
    var base = c[Math.min(1, c.length - 1)];
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var weave = ((x + y) % 2 === 0 ? 1.04 : .96) * ((x % 4 < 2) === (y % 4 < 2) ? 1.02 : .99);
        var fuzz = 1 + (rnd() - .5) * .13;
        px.set(x, y, shade(base, weave * fuzz));
      }
    }
    for (var i = 0; i < 10; i++) px.set((rnd() * S) | 0, (rnd() * S) | 0, shade(base, .86));
  };

  P.leaves = function (px, rnd, c) {
    var n = valueNoise(rnd, 8);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = n(x, y);
      if (rnd() < .1 && v < .45) { px.set(x, y, c[0], 0); continue; }
      px.set(x, y, shade(c[(rnd() * c.length) | 0], .82 + v * .4));
    }
  };

  P.wart = function (px, rnd, c) {
    var id = cells(rnd, 10);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var a = id(x, y);
      var edge = a !== id(x + 1, y) || a !== id(x, y + 1);
      px.set(x, y, edge ? shade(c[0], .68) : shade(c[0], .92 + (a % 3) * .1));
    }
  };

  P.sculk = function (px, rnd, c) {
    P.noise(px, rnd, c);
    for (var i = 0; i < 16; i++) {
      var x = (rnd() * S) | 0, y = (rnd() * S) | 0;
      px.set(x, y, c[c.length - 1]);
      if (rnd() < .5) px.set(x + 1, y, shade(c[c.length - 1], .8));
    }
  };

  /* -- plants (cut-out) --------------------------------------------------- */

  function clear(px) {
    for (var i = 3; i < px.d.length; i += 4) px.d[i] = 0;
  }

  P.plant = function (px, rnd, c, face) {
    clear(px);
    var stem = face.stem || '#4a7a2a';
    var kind = face.kind || 'flower';
    var x, y;

    if (kind === 'grass' || kind === 'fern') {
      for (var b = 0; b < 7; b++) {
        var bx = 1 + ((rnd() * 14) | 0);
        var bh = 5 + ((rnd() * 8) | 0);
        var lean = rnd() < .5 ? -1 : 1;
        for (y = 0; y < bh; y++) {
          var xx = bx + ((y / 5) | 0) * lean;
          px.set(xx, 15 - y, shade(c[0], .82 + (y / bh) * .4));
        }
      }
      return;
    }

    // Stem
    var sx = 7 + (rnd() < .5 ? 0 : 1);
    for (y = 15; y > 6; y--) px.set(sx, y, y % 3 === 0 ? shade(stem, .85) : stem);
    px.set(sx - 1, 11, shade(stem, .9));
    px.set(sx + 1, 9, shade(stem, .9));

    if (kind === 'sapling') {
      for (y = 3; y < 11; y++) {
        var w = y < 5 ? 2 : y < 8 ? 4 : 5;
        for (x = sx - w; x <= sx + w; x++) {
          if (rnd() < .22) continue;
          px.set(x, y, shade(c[0], .82 + rnd() * .4));
        }
      }
      return;
    }

    if (kind === 'mushroom') {
      for (y = 4; y < 8; y++) {
        var mw = y === 4 ? 2 : y === 5 ? 3 : 4;
        for (x = sx - mw; x <= sx + mw; x++) px.set(x, y, shade(c[0], y === 4 ? 1.12 : .92 + rnd() * .16));
      }
      for (y = 8; y < 15; y++) { px.set(sx, y, '#e8e2d8'); px.set(sx + 1, y, '#cfc7bb'); }
      return;
    }

    if (kind === 'tall') {                       // sunflower / lilac style
      for (y = 1; y < 8; y++) {
        for (x = sx - 3; x <= sx + 3; x++) {
          if (rnd() < .3) continue;
          px.set(x, y, shade(c[0], .85 + rnd() * .35));
        }
      }
      return;
    }

    // Default: a small flower head
    var petal = c[0], centre = c[1] || shade(c[0], .7);
    var head = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1]];
    for (var i = 0; i < head.length; i++) {
      px.set(sx + head[i][0], 5 + head[i][1], petal);
    }
    px.set(sx, 5, centre);
    px.set(sx + 2, 5, shade(petal, .92));
    px.set(sx - 2, 5, shade(petal, .92));
  };

  P.crop = function (px, rnd, c) {
    clear(px);
    for (var x = 1; x < S; x += 4) {
      for (var y = 3; y < 16; y++) {
        px.set(x, y, shade(c[0], .85 + (y / 16) * .35));
        if (y > 5 && y % 3 === 0) px.set(x + 1, y, shade(c[1] || c[0], 1));
      }
    }
  };

  P.vine = function (px, rnd, c) {
    clear(px);
    for (var x = 0; x < S; x++) {
      if (rnd() < .35) continue;
      var h = 6 + ((rnd() * 10) | 0);
      for (var y = 0; y < h; y++) if (rnd() > .18) px.set(x, y, shade(c[0], .8 + rnd() * .4));
    }
  };

  P.ladder = function (px, rnd, c) {
    clear(px);
    for (var y = 0; y < S; y++) { px.rect(2, y, 3, y, c[0]); px.rect(12, y, 13, y, shade(c[0], .9)); }
    for (var r = 2; r < S; r += 5) px.rect(4, r, 11, r + 1, shade(c[0], 1.08));
  };

  P.rail = function (px, rnd, c) {
    clear(px);
    px.rect(3, 0, 4, 15, c[0]);
    px.rect(11, 0, 12, 15, c[0]);
    for (var y = 1; y < S; y += 4) px.rect(2, y, 13, y + 1, c[1] || '#6b4f33');
  };

  P.spawner = function (px, rnd, c) {
    clear(px);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      if (x % 4 < 2 && y % 4 < 2) continue;
      px.set(x, y, shade(c[0], .82 + ((x + y) % 3) * .12));
    }
  };

  /* -- transparent / special --------------------------------------------- */

  P.glass = function (px, rnd, c, face) {
    var a = face.a == null ? 70 : face.a;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) px.set(x, y, c[0], a);
    px.frame(0, 0, 15, 15, shade(c[0], 1.25), Math.min(255, a + 90));
    for (var i = 0; i < 4; i++) px.set(2 + i, 2 + i, '#ffffff', Math.min(255, a + 120));
    px.set(12, 3, '#ffffff', Math.min(255, a + 60));
  };

  P.ice = function (px, rnd, c) {
    var n = valueNoise(rnd, 5);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .9 + n(x, y) * .22), 205);
    }
    for (var i = 0; i < 12; i++) px.set((rnd() * S) | 0, (rnd() * S) | 0, '#ffffff', 230);
  };

  P.slime = function (px, rnd, c) {
    var n = valueNoise(rnd, 4);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .88 + n(x, y) * .25), 190);
    }
    px.frame(3, 3, 12, 12, shade(c[0], .74), 220);
  };

  P.water = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var w = Math.sin((x + y * .6) * .8) * .5 + .5;
      px.set(x, y, shade(c[0], .88 + w * .22), 190);
    }
  };

  P.lava = function (px, rnd, c) {
    var n = valueNoise(rnd, 4);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = n(x, y);
      px.set(x, y, v > .62 ? c[2] || '#ffd24a' : v > .35 ? c[1] || '#ff8f2a' : c[0]);
    }
  };

  P.obsidian = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, rnd() < .12 ? c[1] || '#3b1d5c' : shade(c[0], .9 + rnd() * .25));
    }
  };

  P.netherrack = function (px, rnd, c) {
    var n = valueNoise(rnd, 6);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = n(x, y);
      px.set(x, y, shade(c[0], .78 + v * .45 + (rnd() - .5) * .12));
    }
    for (var i = 0; i < 10; i++) px.set((rnd() * S) | 0, (rnd() * S) | 0, shade(c[0], .62));
  };

  P.glow = function (px, rnd, c) {
    var n = valueNoise(rnd, 5);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .82 + n(x, y) * .4));
    }
    for (var i = 0; i < 18; i++) px.set((rnd() * S) | 0, (rnd() * S) | 0, c[1] || shade(c[0], 1.3));
  };

  P.prismarine = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var q = ((x >> 2) + (y >> 2)) % 2;
      px.set(x, y, shade(c[q % c.length], .92 + rnd() * .18));
    }
  };

  P.honeycomb = function (px, rnd, c) {
    P.solid(px, rnd, c);
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        var ox = col * 4 + (row % 2 ? 2 : 0), oy = row * 4;
        px.rect(ox + 1, oy + 1, ox + 2, oy + 2, shade(c[0], .74));
      }
    }
  };

  // Glazed terracotta: a bold two-tone motif, picked deterministically per block.
  P.glazed = function (px, rnd, c) {
    var a = c[0], b = c[1] || shade(c[0], .7), w = c[2] || '#e9ecec';
    var motif = (rnd() * 4) | 0;
    px.fill(w);
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var v;
        if (motif === 0) {                                  // quarter arcs
          var dx = x < 8 ? x : 15 - x, dy = y < 8 ? y : 15 - y;
          var r = Math.sqrt(dx * dx + dy * dy);
          v = r < 4 ? a : r < 6.5 ? b : null;
        } else if (motif === 1) {                           // chevrons
          v = ((x + y) % 8 < 3) ? a : ((x - y + 16) % 8 < 3) ? b : null;
        } else if (motif === 2) {                           // nested diamond
          var d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
          v = d < 4 ? a : d < 6.5 ? null : b;
        } else {                                            // corner blocks
          v = (x < 6 && y < 6) || (x > 9 && y > 9) ? a : (x > 9 && y < 6) || (x < 6 && y > 9) ? b : null;
        }
        if (v) px.set(x, y, v);
      }
    }
    px.frame(0, 0, 15, 15, shade(b, .9));
  };

  P.copper = function (px, rnd, c) {
    var n = valueNoise(rnd, 5);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = n(x, y);
      px.set(x, y, v > .55 ? shade(c[0], 1.08) : shade(c[1] || c[0], .95 + (rnd() - .5) * .1));
    }
  };

  P.sponge = function (px, rnd, c) {
    P.solid(px, rnd, c);
    for (var i = 0; i < 26; i++) {
      var x = (rnd() * S) | 0, y = (rnd() * S) | 0;
      px.set(x, y, shade(c[0], .62));
      if (rnd() < .5) px.set(x + 1, y, shade(c[0], .7));
    }
  };

  P.snow = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, shade(c[0], .97 + rnd() * .06));
    }
  };

  /* -- utility blocks ---------------------------------------------------- */

  P.crafting_top = function (px, rnd, c) {
    P.planks(px, rnd, c);
    px.frame(0, 0, 15, 15, shade(c[0], .68));
    for (var i = 1; i < 4; i++) {
      px.rect(i * 4 - 1, 1, i * 4, 14, shade(c[0], .72));
      px.rect(1, i * 4 - 1, 14, i * 4, shade(c[0], .72));
    }
  };

  P.crafting_front = function (px, rnd, c) {
    P.planks(px, rnd, c);
    px.rect(2, 2, 13, 13, shade(c[0], .8));
    px.frame(2, 2, 13, 13, shade(c[0], .6));
    px.rect(4, 5, 6, 7, '#8b6a3f');
    px.rect(9, 9, 11, 11, '#a5a5a5');
  };

  P.furnace_front = function (px, rnd, c) {
    P.noise(px, rnd, c);
    px.rect(3, 6, 12, 13, '#191919');
    px.frame(3, 6, 12, 13, shade(c[0], .6));
    px.rect(4, 10, 11, 12, '#5a5148');
  };

  P.furnace_lit = function (px, rnd, c) {
    P.noise(px, rnd, c);
    px.rect(3, 6, 12, 13, '#2a1a08');
    px.frame(3, 6, 12, 13, shade(c[0], .6));
    px.rect(4, 10, 11, 12, '#ff9d2a');
    px.rect(5, 9, 10, 9, '#ffd05e');
  };

  P.chest_front = function (px, rnd, c) {
    P.planks(px, rnd, c);
    px.rect(0, 5, 15, 6, shade(c[0], .6));
    px.rect(6, 4, 9, 8, '#8f8f8f');
    px.set(7, 6, '#3a3a3a'); px.set(8, 6, '#3a3a3a');
  };

  P.bookshelf = function (px, rnd, c) {
    P.planks(px, rnd, c);
    var books = ['#a33b2c', '#2f6ea6', '#c9a227', '#3f8a3a', '#7a4fa3', '#b5651d'];
    [3, 10].forEach(function (y0) {
      px.rect(0, y0, 15, y0 + 4, '#2f2517');
      for (var x = 1; x < 15; x += 2) {
        var h = 3 + ((rnd() * 2) | 0);
        px.rect(x, y0 + 5 - h, x + 1, y0 + 4, books[(rnd() * books.length) | 0]);
      }
    });
  };

  P.tnt_side = function (px, rnd, c) {
    P.noise(px, rnd, ['#b3352b', '#a52f26', '#c03a30']);
    px.rect(0, 5, 15, 10, '#e8e8e8');
    px.rect(2, 7, 3, 8, '#2b2b2b'); px.rect(5, 7, 6, 8, '#2b2b2b');
    px.rect(8, 7, 9, 8, '#2b2b2b'); px.rect(11, 7, 12, 8, '#2b2b2b');
  };

  P.tnt_top = function (px, rnd, c) {
    P.noise(px, rnd, ['#b3352b', '#a52f26', '#c03a30']);
    px.frame(4, 4, 11, 11, '#d8d8d8');
    px.rect(6, 6, 9, 9, '#9a9a9a');
  };

  P.pumpkin_face = function (px, rnd, c, face) {
    P.pumpkin_side(px, rnd, c);
    var ink = face.lit ? '#ffb43d' : '#3a2408';
    px.rect(3, 4, 5, 7, ink); px.rect(10, 4, 12, 7, ink);
    px.rect(4, 10, 11, 11, ink);
    px.rect(5, 9, 6, 9, ink); px.rect(9, 9, 10, 9, ink);
    px.rect(6, 12, 9, 12, ink);
  };

  P.pumpkin_side = function (px, rnd, c) {
    for (var x = 0; x < S; x++) {
      var groove = x % 4 === 0;
      for (var y = 0; y < S; y++) {
        px.set(x, y, shade(c[0], (groove ? .78 : 1) * (.95 + rnd() * .12)));
      }
    }
    px.rect(0, 0, 15, 0, shade(c[0], .7));
  };

  P.melon_side = function (px, rnd, c) {
    var n = valueNoise(rnd, 5);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      px.set(x, y, n(x, y) > .5 ? c[0] : (c[1] || shade(c[0], .72)));
    }
  };

  P.hay = function (px, rnd, c) {
    for (var y = 0; y < S; y++) {
      var tone = c[(rnd() * c.length) | 0];
      for (var x = 0; x < S; x++) px.set(x, y, shade(tone, 1 + (rnd() - .5) * .16));
    }
    px.rect(0, 7, 15, 8, shade(c[0], .68));
  };

  P.circuit = function (px, rnd, c) {
    P.smooth(px, rnd, c);
    px.frame(1, 1, 14, 14, shade(c[0], .7));
    px.rect(4, 4, 11, 11, shade(c[0], .82));
    px.rect(6, 6, 9, 9, c[1] || '#c94b3f');
    px.rect(7, 7, 8, 8, shade(c[1] || '#c94b3f', 1.3));
  };

  P.target = function (px, rnd, c) {
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = x - 7.5, dy = y - 7.5;
      var r = Math.sqrt(dx * dx + dy * dy);
      px.set(x, y, r < 2.5 ? (c[1] || '#c94b3f') : r < 5 ? '#e8e0d0' : r < 7 ? (c[1] || '#c94b3f') : '#e8e0d0');
    }
  };

  P.cake = function (px, rnd, c) {
    P.solid(px, rnd, ['#f0e3d0']);
    for (var y = 0; y < 4; y++) for (var x = 0; x < S; x++) px.set(x, y, rnd() < .3 ? '#f2f2f2' : '#e8e4dd');
    for (var i = 0; i < 10; i++) px.set((rnd() * S) | 0, (rnd() * 4) | 0, '#c33b3b');
  };

  P.door = function (px, rnd, c) {
    P.planks(px, rnd, c);
    px.frame(0, 0, 15, 15, shade(c[0], .68));
    px.rect(2, 2, 13, 6, shade(c[0], .88));
    px.frame(2, 2, 13, 6, shade(c[0], .7));
    px.rect(12, 9, 13, 10, '#5a5a5a');
  };

  P.beacon = function (px, rnd, c) {
    P.glass(px, rnd, ['#1f2b2f'], { a: 220 });
    px.rect(4, 4, 11, 11, '#4de0dd');
    px.rect(6, 6, 9, 9, '#e9fbff');
  };

  /* ---------------------------------------------------------------- api */

  var cache = Object.create(null);

  /** Paint one face description into a 16x16 RGBA buffer (memoised). */
  function tile(face, seed) {
    var key = seed + '|' + JSON.stringify(face);
    var hit = cache[key];
    if (hit) return hit;
    var px = new Px();
    var rnd = Rand.rng(key);
    var painter = P[face.p] || P.noise;
    var colors = face.c && face.c.length ? face.c : ['#8b8b8b', '#9a9a9a', '#7c7c7c'];
    painter(px, rnd, colors, face);
    cache[key] = px.d;
    return px.d;
  }

  /** Build a horizontal strip atlas out of several faces: one 16px tile each. */
  function atlas(faces, seed) {
    var n = faces.length;
    var data = new Uint8ClampedArray(n * S * S * 4);
    for (var i = 0; i < n; i++) {
      var t = tile(faces[i], seed + '/' + i);
      for (var y = 0; y < S; y++) {
        for (var x = 0; x < S; x++) {
          var src = (y * S + x) * 4;
          var dst = (y * (n * S) + i * S + x) * 4;
          data[dst] = t[src]; data[dst + 1] = t[src + 1];
          data[dst + 2] = t[src + 2]; data[dst + 3] = t[src + 3];
        }
      }
    }
    return { data: data, width: n * S, height: S, tiles: n };
  }

  /** Draw a single face into a 2D canvas — used by the inspector's swatches. */
  function toCanvas(face, seed, canvas) {
    var t = tile(face, seed);
    canvas.width = S; canvas.height = S;
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(S, S);
    img.data.set(t);
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  global.Textures = { SIZE: S, tile: tile, atlas: atlas, toCanvas: toCanvas, painters: P };
})(window);
