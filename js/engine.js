/* A very small WebGL renderer.

   One canvas is stretched across the viewport and every visible card draws into
   its own scissored rectangle of it, so a page showing 60 blocks still uses a
   single GL context and a single frame loop. */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------- mat4 */

  var M = {
    ident: function () { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },

    mul: function (a, b, out) {
      out = out || new Float32Array(16);
      for (var c = 0; c < 4; c++) {
        for (var r = 0; r < 4; r++) {
          out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
            a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
        }
      }
      return out;
    },

    perspective: function (fovy, aspect, near, far) {
      var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ]);
    },

    translate: function (x, y, z) {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
    },

    rotY: function (a) {
      var c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
    },

    rotX: function (a) {
      var c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
    },

    /** Upper-left 3x3 of a rotation-only matrix, for transforming normals. */
    normal3: function (m) {
      return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
    }
  };

  /* ------------------------------------------------------------- shaders */

  var VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aNorm;',
    'attribute vec2 aUV;',
    'uniform mat4 uMVP;',
    'uniform mat3 uNM;',
    'varying vec2 vUV;',
    'varying vec3 vN;',
    'void main() {',
    '  vUV = aUV;',
    '  vN = uNM * aNorm;',
    '  gl_Position = uMVP * vec4(aPos, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform sampler2D uTex;',
    'uniform float uCut;',      // alpha cut-off
    'uniform float uGlow;',     // 0 = fully shaded, 1 = self-lit
    'uniform float uFade;',     // card entry fade
    'varying vec2 vUV;',
    'varying vec3 vN;',
    'void main() {',
    '  vec4 c = texture2D(uTex, vUV);',
    '  if (c.a < uCut) discard;',
    '  vec3 n = normalize(vN);',
    // Minecraft-style fixed face shading, softened by a key light.
    '  float face = n.y > 0.55 ? 1.0 : (n.y < -0.55 ? 0.52 : (abs(n.x) > abs(n.z) ? 0.66 : 0.84));',
    '  float key = 0.86 + 0.14 * max(dot(n, normalize(vec3(0.35, 0.75, 0.56))), 0.0);',
    // Bright texels glow, dark ones keep their shading: a torch's flame lights
    // up while its stick does not.
    '  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));',
    '  float g = uGlow * (0.3 + 0.7 * smoothstep(0.28, 0.72, lum));',
    '  float lit = mix(face * key, 1.0, g);',
    '  gl_FragColor = vec4(c.rgb * lit, c.a * uFade);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('shader: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }

  /* ------------------------------------------------------------- engine */

  function Engine(canvas) {
    this.canvas = canvas;
    var opts = { alpha: true, antialias: true, premultipliedAlpha: false, depth: true };
    var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;

    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('link: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    this.prog = prog;
    this.a = {
      pos: gl.getAttribLocation(prog, 'aPos'),
      norm: gl.getAttribLocation(prog, 'aNorm'),
      uv: gl.getAttribLocation(prog, 'aUV')
    };
    this.u = {
      mvp: gl.getUniformLocation(prog, 'uMVP'),
      nm: gl.getUniformLocation(prog, 'uNM'),
      tex: gl.getUniformLocation(prog, 'uTex'),
      cut: gl.getUniformLocation(prog, 'uCut'),
      glow: gl.getUniformLocation(prog, 'uGlow'),
      fade: gl.getUniformLocation(prog, 'uFade')
    };
    gl.enableVertexAttribArray(this.a.pos);
    gl.enableVertexAttribArray(this.a.norm);
    gl.enableVertexAttribArray(this.a.uv);
    gl.uniform1i(this.u.tex, 0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.cache = Object.create(null);
    this.dprCap = 2;
    this.resize();
  }

  Engine.prototype.resize = function () {
    var dpr = Math.min(global.devicePixelRatio || 1, this.dprCap);
    var w = Math.floor(global.innerWidth * dpr);
    var h = Math.floor(global.innerHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
  };

  /** Upload (once) the mesh + texture atlas for a block definition. */
  Engine.prototype.resource = function (block) {
    var hit = this.cache[block.id];
    if (hit) return hit;

    var gl = this.gl;
    var faces = Blocks.faceList(block);          // [{name, face}, ...]
    var order = {}, list = [];
    faces.forEach(function (f, i) { order[f.name] = i; list.push(f.face); });

    var atlas = Textures.atlas(list, block.id);
    var geo = Shapes.build(block.shape, function (name) {
      var i = order[name];
      if (i === undefined) i = order[Blocks.fallbackFace(name)];
      if (i === undefined) i = order.side !== undefined ? order.side : 0;
      return i;
    }, atlas.tiles);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(atlas.data.buffer));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    function buf(data, target) {
      var b = gl.createBuffer();
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, gl.STATIC_DRAW);
      return b;
    }

    var centre = [
      (geo.min[0] + geo.max[0]) / 2,
      (geo.min[1] + geo.max[1]) / 2,
      (geo.min[2] + geo.max[2]) / 2
    ];
    var radius = Math.max(
      Math.hypot(geo.max[0] - centre[0], geo.max[1] - centre[1], geo.max[2] - centre[2]),
      0.5
    );

    var res = {
      pos: buf(geo.pos, gl.ARRAY_BUFFER),
      norm: buf(geo.norm, gl.ARRAY_BUFFER),
      uv: buf(geo.uv, gl.ARRAY_BUFFER),
      idx: buf(geo.idx, gl.ELEMENT_ARRAY_BUFFER),
      count: geo.count,
      tex: tex,
      centre: centre,
      radius: radius,
      tiles: faces
    };
    this.cache[block.id] = res;
    return res;
  };

  Engine.prototype.beginFrame = function () {
    var gl = this.gl;
    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.scissor(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };

  Engine.prototype.endFrame = function () {
    this.gl.disable(this.gl.SCISSOR_TEST);
  };

  /**
   * Draw one block into a CSS-pixel rectangle of the viewport.
   * view = {yaw, pitch, zoom, fade}
   */
  Engine.prototype.draw = function (rect, block, view) {
    var gl = this.gl, dpr = this.dpr;
    var w = Math.floor(rect.width * dpr), h = Math.floor(rect.height * dpr);
    if (w < 2 || h < 2) return;

    var x = Math.floor(rect.left * dpr);
    var y = Math.floor((global.innerHeight - rect.bottom) * dpr);
    gl.viewport(x, y, w, h);
    gl.scissor(x, y, w, h);

    var res = this.resource(block);
    var zoom = view.zoom || 1;
    var dist = (res.radius / zoom) * 3.55;

    var proj = M.perspective(0.5, w / h, 0.05, 60);
    var model = M.mul(M.rotX(view.pitch), M.rotY(view.yaw));
    var m = M.mul(model, M.translate(-res.centre[0], -res.centre[1], -res.centre[2]));
    var mv = M.mul(M.translate(0, 0, -dist), m);
    var mvp = M.mul(proj, mv);

    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.u.mvp, false, mvp);
    gl.uniformMatrix3fv(this.u.nm, false, M.normal3(model));
    gl.uniform1f(this.u.glow, block.glow || 0);
    gl.uniform1f(this.u.fade, view.fade == null ? 1 : view.fade);

    var blend = block.alpha === 'blend';
    gl.uniform1f(this.u.cut, blend ? 0.02 : 0.5);
    if (blend) {
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
    } else {
      gl.enable(gl.BLEND);
      gl.depthMask(true);
      if (block.alpha === 'cutout') gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, res.tex);

    gl.bindBuffer(gl.ARRAY_BUFFER, res.pos);
    gl.vertexAttribPointer(this.a.pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, res.norm);
    gl.vertexAttribPointer(this.a.norm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, res.uv);
    gl.vertexAttribPointer(this.a.uv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.idx);
    gl.drawElements(gl.TRIANGLES, res.count, gl.UNSIGNED_SHORT, 0);

    gl.depthMask(true);
  };

  /** Copy a rectangle of the framebuffer into a 2D canvas (for PNG export). */
  Engine.prototype.grab = function (rect) {
    var gl = this.gl, dpr = this.dpr;
    var w = Math.floor(rect.width * dpr), h = Math.floor(rect.height * dpr);
    var x = Math.floor(rect.left * dpr);
    var y = Math.floor((global.innerHeight - rect.bottom) * dpr);
    var px = new Uint8Array(w * h * 4);
    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);

    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var ctx = out.getContext('2d');
    var img = ctx.createImageData(w, h);
    for (var row = 0; row < h; row++) {                 // GL rows are bottom-up
      var src = (h - 1 - row) * w * 4, dst = row * w * 4;
      img.data.set(px.subarray(src, src + w * 4), dst);
    }
    ctx.putImageData(img, 0, 0);
    return out;
  };

  global.Engine = Engine;
  global.Mat4 = M;
})(window);
