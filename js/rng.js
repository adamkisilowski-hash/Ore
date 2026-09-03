/* Deterministic randomness + small colour helpers.
   Every texture is generated from a string seed, so a block looks identical
   on every visit and on every machine. */
(function (global) {
  'use strict';

  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  // mulberry32
  function rng(seed) {
    var a = typeof seed === 'string' ? hash(seed) : (seed >>> 0);
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(c) {
    var s = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.max(0, Math.min(255, Math.round(c[i]))).toString(16);
      s += v.length < 2 ? '0' + v : v;
    }
    return s;
  }

  /** Multiply lightness: f < 1 darkens, f > 1 brightens. */
  function shade(hex, f) {
    var c = hexToRgb(hex);
    return rgbToHex([c[0] * f, c[1] * f, c[2] * f]);
  }

  /** Linear blend between two hex colours. */
  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex([
      x[0] + (y[0] - x[0]) * t,
      x[1] + (y[1] - x[1]) * t,
      x[2] + (y[2] - x[2]) * t
    ]);
  }

  /** Ramp of n colours around a base, from dark to light. */
  function ramp(hex, n, spread) {
    spread = spread == null ? 0.22 : spread;
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      out.push(shade(hex, 1 - spread + t * spread * 2));
    }
    return out;
  }

  global.Rand = { hash: hash, rng: rng, hexToRgb: hexToRgb, rgbToHex: rgbToHex, shade: shade, mix: mix, ramp: ramp };
})(window);
