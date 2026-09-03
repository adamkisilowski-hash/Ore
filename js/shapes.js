/* Geometry builders.

   Every shape is assembled from axis-aligned boxes and quads, exactly like a
   Minecraft block model. UVs are cropped from the parent block face, so a slab
   shows the bottom half of its side texture and a fence post shows a 4px strip. */
(function (global) {
  'use strict';

  var p = 1 / 16;   // one texel of a block

  function Builder(tileFor, tileCount) {
    this.pos = [];
    this.norm = [];
    this.uv = [];
    this.idx = [];
    this.tileFor = tileFor;      // face name -> atlas tile index
    this.tileCount = tileCount;
    this.min = [Infinity, Infinity, Infinity];
    this.max = [-Infinity, -Infinity, -Infinity];
  }

  Builder.prototype.quad = function (verts, normal, uvs, faceName) {
    var t = this.tileFor(faceName), n = this.tileCount;
    var base = this.pos.length / 3;
    for (var i = 0; i < 4; i++) {
      var v = verts[i];
      this.pos.push(v[0], v[1], v[2]);
      this.norm.push(normal[0], normal[1], normal[2]);
      // Squeeze the 0..1 face UV into this block's slot of the strip atlas.
      this.uv.push((t + uvs[i][0]) / n, uvs[i][1]);
      for (var k = 0; k < 3; k++) {
        if (v[k] < this.min[k]) this.min[k] = v[k];
        if (v[k] > this.max[k]) this.max[k] = v[k];
      }
    }
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  /** Double-sided quad (used for cut-out plants and panes). */
  Builder.prototype.quad2 = function (verts, normal, uvs, faceName) {
    this.quad(verts, normal, uvs, faceName);
    this.quad([verts[3], verts[2], verts[1], verts[0]],
      [-normal[0], -normal[1], -normal[2]],
      [uvs[3], uvs[2], uvs[1], uvs[0]], faceName);
  };

  /**
   * Axis-aligned box. `faces` optionally renames the texture used per side,
   * e.g. {top:'side'} makes the top of a fence post use the side texture.
   * `skip` lists sides to omit. `stretch` maps the whole texture onto each
   * side instead of cropping it out of the parent cube.
   */
  Builder.prototype.box = function (x0, y0, z0, x1, y1, z1, o) {
    o = o || {};
    var f = o.faces || {}, skip = o.skip || {}, st = o.stretch;
    var self = this;

    function u(v0, v1) { return st ? [0, 1] : [v0, v1]; }

    var ux = u(x0, x1), uy = u(1 - y1, 1 - y0), uz = u(z0, z1);
    var uzr = u(1 - z1, 1 - z0), uxr = u(1 - x1, 1 - x0);

    if (!skip.top) self.quad(
      [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0],
      [[ux[0], uz[1]], [ux[1], uz[1]], [ux[1], uz[0]], [ux[0], uz[0]]], f.top || 'top');

    if (!skip.bottom) self.quad(
      [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0],
      [[ux[0], uz[0]], [ux[1], uz[0]], [ux[1], uz[1]], [ux[0], uz[1]]], f.bottom || 'bottom');

    if (!skip.south) self.quad(
      [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1],
      [[ux[0], uy[1]], [ux[1], uy[1]], [ux[1], uy[0]], [ux[0], uy[0]]], f.south || 'front');

    if (!skip.north) self.quad(
      [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1],
      [[uxr[0], uy[1]], [uxr[1], uy[1]], [uxr[1], uy[0]], [uxr[0], uy[0]]], f.north || 'back');

    if (!skip.east) self.quad(
      [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0],
      [[uzr[1], uy[1]], [uzr[0], uy[1]], [uzr[0], uy[0]], [uzr[1], uy[0]]], f.east || 'side');

    if (!skip.west) self.quad(
      [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0],
      [[uz[0], uy[1]], [uz[1], uy[1]], [uz[1], uy[0]], [uz[0], uy[0]]], f.west || 'side');

    return this;
  };

  /** Four-sided spike, used for dripstone and similar tapering blocks. */
  Builder.prototype.spike = function (x0, z0, x1, z1, y0, y1, tipR, faceName) {
    var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    var a = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    for (var i = 0; i < 4; i++) {
      var q = a[i], r = a[(i + 1) % 4];
      var qt = [cx + (q[0] - cx) * tipR, cz + (q[1] - cz) * tipR];
      var rt = [cx + (r[0] - cx) * tipR, cz + (r[1] - cz) * tipR];
      var n = [r[1] - q[1], 0, q[0] - r[0]];
      this.quad(
        [[q[0], y0, q[1]], [r[0], y0, r[1]], [rt[0], y1, rt[1]], [qt[0], y1, qt[1]]],
        n, [[0, 1], [1, 1], [1, 0], [0, 0]], faceName);
    }
    this.box(x0, y0 - .001, z0, x1, y0, z1, { skip: { top: 1, north: 1, south: 1, east: 1, west: 1 } });
    return this;
  };

  /* ------------------------------------------------------------- shapes */

  var SHAPES = {};
  function def(name, fn, meta) { SHAPES[name] = { build: fn, label: (meta && meta.label) || name }; }

  def('cube', function (b) { b.box(0, 0, 0, 1, 1, 1); }, { label: 'Full block' });

  def('slab', function (b) { b.box(0, 0, 0, 1, .5, 1); }, { label: 'Slab' });

  def('stairs', function (b) {
    b.box(0, 0, 0, 1, .5, 1);
    b.box(0, .5, .5, 1, 1, 1);
  }, { label: 'Stairs' });

  def('carpet', function (b) { b.box(0, 0, 0, 1, p, 1); }, { label: 'Carpet' });

  def('layer', function (b) { b.box(0, 0, 0, 1, 2 * p, 1); }, { label: 'Layer' });

  def('plate', function (b) { b.box(p, 0, p, 1 - p, p, 1 - p); }, { label: 'Pressure plate' });

  def('button', function (b) { b.box(5 * p, 0, 6 * p, 11 * p, p, 10 * p); }, { label: 'Button' });

  def('pane', function (b) {
    b.box(7 * p, 0, 0, 9 * p, 1, 1);
  }, { label: 'Pane' });

  def('fence', function (b) {
    b.box(6 * p, 0, 6 * p, 10 * p, 1, 10 * p);
    b.box(7 * p, 6 * p, 0, 9 * p, 9 * p, 1);
    b.box(7 * p, 12 * p, 0, 9 * p, 15 * p, 1);
  }, { label: 'Fence' });

  def('wall', function (b) {
    b.box(4 * p, 0, 4 * p, 12 * p, 1, 12 * p);
    b.box(5 * p, 0, 0, 11 * p, 13 * p, 1);
  }, { label: 'Wall' });

  def('gate', function (b) {
    b.box(0, 5 * p, 7 * p, 2 * p, 1, 9 * p);
    b.box(14 * p, 5 * p, 7 * p, 1, 1, 9 * p);
    b.box(2 * p, 6 * p, 7 * p, 14 * p, 9 * p, 9 * p);
    b.box(2 * p, 12 * p, 7 * p, 14 * p, 15 * p, 9 * p);
    b.box(6 * p, 9 * p, 7 * p, 10 * p, 12 * p, 9 * p);
  }, { label: 'Fence gate' });

  def('trapdoor', function (b) { b.box(0, 0, 0, 1, 3 * p, 1, { stretch: true }); }, { label: 'Trapdoor' });

  def('door', function (b) {
    b.box(0, 0, 0, 1, 1, 3 * p, { stretch: true });
    b.box(0, 1, 0, 1, 2, 3 * p, { stretch: true });
  }, { label: 'Door (2 blocks tall)' });

  def('ladder', function (b) {
    b.quad2([[0, 0, 1 - p], [1, 0, 1 - p], [1, 1, 1 - p], [0, 1, 1 - p]], [0, 0, 1],
      [[0, 1], [1, 1], [1, 0], [0, 0]], 'front');
  }, { label: 'Wall-mounted' });

  def('flat', function (b) {
    b.quad2([[0, p / 2, 1], [1, p / 2, 1], [1, p / 2, 0], [0, p / 2, 0]], [0, 1, 0],
      [[0, 1], [1, 1], [1, 0], [0, 0]], 'top');
  }, { label: 'Flat' });

  def('torch', function (b) {
    b.box(7 * p, 0, 7 * p, 9 * p, 10 * p, 9 * p, { stretch: true, faces: { top: 'side', bottom: 'side' } });
    b.box(7 * p, 10 * p, 7 * p, 9 * p, 12 * p, 9 * p, {
      stretch: true,
      faces: { top: 'top', bottom: 'top', north: 'top', south: 'top', east: 'top', west: 'top' }
    });
  }, { label: 'Torch' });

  def('rod', function (b) {
    b.box(7 * p, 0, 7 * p, 9 * p, 1, 9 * p, { stretch: true });
  }, { label: 'Rod' });

  def('chain', function (b) {
    b.box(7.5 * p, 0, 6.5 * p, 8.5 * p, 1, 9.5 * p, { stretch: true });
    b.box(6.5 * p, 0, 7.5 * p, 9.5 * p, 1, 8.5 * p, { stretch: true });
  }, { label: 'Chain' });

  def('lantern', function (b) {
    b.box(5 * p, 0, 5 * p, 11 * p, 7 * p, 11 * p, { stretch: true });
    b.box(6 * p, 7 * p, 6 * p, 10 * p, 9 * p, 10 * p, { stretch: true });
    b.box(7.5 * p, 9 * p, 7.5 * p, 8.5 * p, 1, 8.5 * p, { stretch: true });
  }, { label: 'Lantern' });

  def('cross', function (b) {
    var a = .5 - .3536, c = .5 + .3536;
    b.quad2([[a, 0, a], [c, 0, c], [c, 1, c], [a, 1, a]], [-.707, 0, .707],
      [[0, 1], [1, 1], [1, 0], [0, 0]], 'front');
    b.quad2([[a, 0, c], [c, 0, a], [c, 1, a], [a, 1, c]], [.707, 0, .707],
      [[0, 1], [1, 1], [1, 0], [0, 0]], 'front');
  }, { label: 'Cross (plant)' });

  def('crop', function (b) {
    [.25, .75].forEach(function (z) {
      b.quad2([[0, 0, z], [1, 0, z], [1, 1, z], [0, 1, z]], [0, 0, 1],
        [[0, 1], [1, 1], [1, 0], [0, 0]], 'front');
    });
    [.25, .75].forEach(function (x) {
      b.quad2([[x, 0, 0], [x, 0, 1], [x, 1, 1], [x, 1, 0]], [1, 0, 0],
        [[0, 1], [1, 1], [1, 0], [0, 0]], 'front');
    });
  }, { label: 'Crop' });

  def('cake', function (b) { b.box(p, 0, p, 1 - p, .5, 1 - p); }, { label: 'Cake' });

  def('chest', function (b) {
    b.box(p, 0, p, 1 - p, 10 * p, 1 - p);
    b.box(p, 10 * p, p, 1 - p, 14 * p, 1 - p, { faces: { bottom: 'top' } });
    b.box(7 * p, 7 * p, 0, 9 * p, 11 * p, p, { stretch: true, faces: { south: 'lock', north: 'lock', east: 'lock', west: 'lock', top: 'lock', bottom: 'lock' } });
  }, { label: 'Chest' });

  def('shulker', function (b) {
    b.box(0, 0, 0, 1, 8 * p, 1);
    b.box(p, 8 * p, p, 1 - p, 12 * p, 1 - p, { faces: { bottom: 'top' } });
  }, { label: 'Shulker box' });

  def('anvil', function (b) {
    b.box(2 * p, 0, 2 * p, 14 * p, 4 * p, 14 * p);
    b.box(4 * p, 4 * p, 5 * p, 12 * p, 5 * p, 11 * p);
    b.box(6 * p, 5 * p, 6 * p, 10 * p, 10 * p, 10 * p);
    b.box(0, 10 * p, 3 * p, 1, 1, 13 * p);
  }, { label: 'Anvil' });

  def('skull', function (b) { b.box(4 * p, 0, 4 * p, 12 * p, 8 * p, 12 * p, { stretch: true }); }, { label: 'Head' });

  def('bed', function (b) {
    b.box(0, 3 * p, 0, 1, 9 * p, 2);
    b.box(0, 0, 0, 3 * p, 3 * p, 3 * p, { faces: { top: 'bottom' } });
    b.box(13 * p, 0, 0, 1, 3 * p, 3 * p, { faces: { top: 'bottom' } });
    b.box(0, 0, 2 - 3 * p, 3 * p, 3 * p, 2, { faces: { top: 'bottom' } });
    b.box(13 * p, 0, 2 - 3 * p, 1, 3 * p, 2, { faces: { top: 'bottom' } });
  }, { label: 'Bed (2 blocks)' });

  def('pot', function (b) {
    b.box(5 * p, 0, 5 * p, 11 * p, 6 * p, 11 * p, { stretch: true });
    b.box(4.5 * p, 5 * p, 4.5 * p, 11.5 * p, 6 * p, 11.5 * p, { stretch: true });
  }, { label: 'Flower pot' });

  def('cauldron', function (b) {
    b.box(0, 0, 0, 1, 3 * p, 1);
    b.box(0, 3 * p, 0, 2 * p, 1, 1);
    b.box(14 * p, 3 * p, 0, 1, 1, 1);
    b.box(2 * p, 3 * p, 0, 14 * p, 1, 2 * p);
    b.box(2 * p, 3 * p, 14 * p, 14 * p, 1, 1);
  }, { label: 'Cauldron' });

  def('hopper', function (b) {
    b.box(0, 10 * p, 0, 1, 1, 1);
    b.box(4 * p, 4 * p, 4 * p, 12 * p, 10 * p, 12 * p);
    b.box(6 * p, 0, 6 * p, 10 * p, 4 * p, 10 * p);
  }, { label: 'Hopper' });

  def('sign', function (b) {
    b.box(0, 7 * p, 7 * p, 1, 1, 9 * p, { stretch: true });
    b.box(7 * p, 0, 7.5 * p, 9 * p, 7 * p, 8.5 * p, { stretch: true });
  }, { label: 'Sign' });

  def('scaffold', function (b) {
    b.box(0, 14 * p, 0, 1, 1, 1);
    b.box(0, 0, 0, 2 * p, 14 * p, 2 * p);
    b.box(14 * p, 0, 0, 1, 14 * p, 2 * p);
    b.box(0, 0, 14 * p, 2 * p, 14 * p, 1);
    b.box(14 * p, 0, 14 * p, 1, 14 * p, 1);
  }, { label: 'Scaffolding' });

  def('spike', function (b) {
    b.spike(5 * p, 5 * p, 11 * p, 11 * p, 0, 1, .18, 'side');
  }, { label: 'Pointed' });

  def('campfire', function (b) {
    b.box(0, 0, 0, 1, p, 1, { faces: { top: 'bottom' } });
    b.box(0, p, 2 * p, 1, 5 * p, 6 * p, { stretch: true });
    b.box(2 * p, p, 10 * p, 6 * p, 5 * p, 1, { stretch: true });
    b.box(0, 5 * p, 6 * p, 1, 9 * p, 10 * p, { stretch: true, faces: { top: 'top' } });
  }, { label: 'Campfire' });

  /** Build the vertex data for one shape. */
  function build(name, tileFor, tileCount) {
    var shape = SHAPES[name] || SHAPES.cube;
    var b = new Builder(tileFor, tileCount);
    shape.build(b);
    return {
      pos: new Float32Array(b.pos),
      norm: new Float32Array(b.norm),
      uv: new Float32Array(b.uv),
      idx: new Uint16Array(b.idx),
      count: b.idx.length,
      min: b.min,
      max: b.max
    };
  }

  global.Shapes = {
    build: build,
    label: function (n) { return (SHAPES[n] || SHAPES.cube).label; },
    names: Object.keys(SHAPES)
  };
})(window);
