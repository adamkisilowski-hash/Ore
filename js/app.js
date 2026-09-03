/* UI: the grid, the filters and the inspector.

   All 3D drawing happens in one animation loop that walks the cards currently
   on screen and paints each one into its slice of the shared canvas. */
(function () {
  'use strict';

  var CAT_NAMES = {
    all: 'All blocks', wood: 'Wood', stone: 'Stone', minerals: 'Ores & minerals',
    nature: 'Nature', plants: 'Plants', colored: 'Colours', glass: 'Glass',
    ocean: 'Ocean', nether: 'Nether', end: 'End', redstone: 'Redstone',
    utility: 'Utility', light: 'Light', decoration: 'Decoration'
  };

  var CAT_ORDER = ['all', 'stone', 'wood', 'nature', 'plants', 'minerals', 'colored',
    'glass', 'light', 'redstone', 'utility', 'decoration', 'ocean', 'nether', 'end'];

  var $ = function (s) { return document.querySelector(s); };
  var DEFAULT_ZOOM = 0.78;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stage = $('#stage');
  var grid = $('#grid');
  var engine;

  try {
    engine = new Engine(stage);
  } catch (err) {
    document.body.insertAdjacentHTML('afterbegin',
      '<p style="padding:24px;color:#f9a">This browser could not start WebGL, so the blocks cannot be rendered: ' +
      String(err.message) + '</p>');
    return;
  }

  var all = Blocks.list.slice().sort(function (a, b) {
    var ca = CAT_ORDER.indexOf(a.cat), cb = CAT_ORDER.indexOf(b.cat);
    return ca === cb ? a.name.localeCompare(b.name) : ca - cb;
  });

  var state = {
    cat: 'all',
    query: [],
    filtered: all,
    cards: [],
    visible: new Set(),
    viewer: null,          // {index, yaw, pitch, zoom, spin}
    capture: false
  };

  /* ------------------------------------------------------------- filters */

  function haystack(block) {
    if (!block.__hay) {
      block.__hay = (block.id + ' ' + block.name + ' ' + (CAT_NAMES[block.cat] || '') +
        ' ' + block.shape).toLowerCase().replace(/_/g, ' ');
    }
    return block.__hay;
  }

  function matches(block) {
    if (state.cat !== 'all' && block.cat !== state.cat) return false;
    if (!state.query) return true;
    var hay = haystack(block);
    return state.query.every(function (word) { return hay.indexOf(word) >= 0; });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var card = e.target.__card;
      if (!card) return;
      if (e.isIntersecting) state.visible.add(card);
      else state.visible.delete(card);
    });
  }, { rootMargin: '160px 0px' });

  function buildGrid() {
    observer.disconnect();
    state.visible.clear();
    state.cards = [];
    grid.textContent = '';

    var frag = document.createDocumentFragment();
    state.filtered.forEach(function (block, i) {
      var el = document.createElement('button');
      el.className = 'card';
      el.type = 'button';
      el.setAttribute('aria-label', block.name);

      var slot = document.createElement('div');
      slot.className = 'slot';
      el.appendChild(slot);

      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = CAT_NAMES[block.cat] || block.cat;
      el.appendChild(tag);

      if (block.glow >= .5) {
        var dot = document.createElement('span');
        dot.className = 'glow-dot';
        el.appendChild(dot);
      }

      var name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = block.name;
      el.appendChild(name);

      var card = { el: el, slot: slot, block: block, index: i, born: -1 };
      el.__card = card;
      el.addEventListener('click', function () { openViewer(i); });
      state.cards.push(card);
      frag.appendChild(el);
    });

    grid.appendChild(frag);
    state.cards.forEach(function (c) { observer.observe(c.el); });

    $('#empty').hidden = state.filtered.length > 0;
    $('#count').innerHTML = '<strong>' + state.filtered.length + '</strong> of ' +
      all.length + ' blocks' + (state.cat === 'all' ? '' : ' in ' + CAT_NAMES[state.cat].toLowerCase());
  }

  function applyFilters() {
    state.filtered = all.filter(matches);
    buildGrid();
  }

  /* ------------------------------------------------------------ chrome */

  function buildCats() {
    var counts = { all: all.length };
    all.forEach(function (b) { counts[b.cat] = (counts[b.cat] || 0) + 1; });

    var host = $('#cats');
    CAT_ORDER.forEach(function (cat) {
      if (!counts[cat]) return;
      var b = document.createElement('button');
      b.className = 'chip' + (cat === state.cat ? ' on' : '');
      b.type = 'button';
      b.dataset.cat = cat;
      b.innerHTML = CAT_NAMES[cat] + ' <span class="n">' + counts[cat] + '</span>';
      b.addEventListener('click', function () {
        state.cat = cat;
        host.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c.dataset.cat === cat); });
        applyFilters();
        scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      host.appendChild(b);
    });
  }

  var search = $('#search');
  search.addEventListener('input', function () {
    state.query = search.value.toLowerCase().replace(/_/g, ' ').split(/\s+/).filter(Boolean);
    $('#clear-search').hidden = !search.value;
    applyFilters();
  });

  $('#clear-search').addEventListener('click', function () {
    search.value = '';
    state.query = [];
    $('#clear-search').hidden = true;
    applyFilters();
    search.focus();
  });

  $('#random').addEventListener('click', function () {
    if (!state.filtered.length) return;
    openViewer((Math.random() * state.filtered.length) | 0);
  });

  var quality = $('#quality');
  quality.addEventListener('click', function () {
    engine.dprCap = engine.dprCap > 1 ? 1 : 2;
    quality.textContent = engine.dprCap > 1 ? 'HD' : 'SD';
    quality.setAttribute('aria-pressed', engine.dprCap > 1 ? 'true' : 'false');
    engine.resize();
  });

  /* ------------------------------------------------------------ viewer */

  var viewer = $('#viewer'), vSlot = $('#v-slot');

  function openViewer(index) {
    var block = state.filtered[index];
    if (!block) return;
    state.viewer = { index: index, yaw: -0.72, pitch: 0.5, zoom: DEFAULT_ZOOM, spin: !reduceMotion };
    viewer.hidden = false;
    stage.style.zIndex = '60';          // lift the shared canvas above the modal
    document.body.style.overflow = 'hidden';
    location.hash = block.id;

    $('#v-name').textContent = block.name;
    $('#v-id').textContent = 'minecraft:' + block.id;
    $('#v-cat').textContent = CAT_NAMES[block.cat] || block.cat;
    $('#v-shape').textContent = Shapes.label(block.shape);

    var faces = Blocks.faceList(block);
    $('#v-faces').textContent = faces.length + (faces.length === 1 ? ' texture' : ' textures');
    $('#v-light').textContent = block.glow >= .5 ? 'Emits light' :
      block.glow > 0 ? 'Faint glow' : (block.alpha === 'blend' ? 'Translucent' : 'None');

    var tiles = $('#v-tiles');
    tiles.textContent = '';
    faces.forEach(function (entry, i) {
      var wrap = document.createElement('div');
      wrap.className = 'v-tile';
      var canvas = document.createElement('canvas');
      Textures.toCanvas(entry.face, block.id + '/' + i, canvas);
      var label = document.createElement('span');
      label.textContent = entry.name;
      wrap.appendChild(canvas);
      wrap.appendChild(label);
      tiles.appendChild(wrap);
    });

    $('#v-spin').textContent = state.viewer.spin ? 'Pause spin' : 'Resume spin';
    $('#v-pos').textContent = (index + 1) + ' / ' + state.filtered.length;
  }

  function closeViewer() {
    state.viewer = null;
    viewer.hidden = true;
    stage.style.zIndex = '';
    document.body.style.overflow = '';
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function step(delta) {
    if (!state.viewer) return;
    var n = state.filtered.length;
    openViewer((state.viewer.index + delta + n) % n);
  }

  viewer.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) closeViewer();
  });
  $('#v-prev').addEventListener('click', function () { step(-1); });
  $('#v-next').addEventListener('click', function () { step(1); });
  $('#v-spin').addEventListener('click', function () {
    var v = state.viewer;
    v.spin = !v.spin;
    $('#v-spin').textContent = v.spin ? 'Pause spin' : 'Resume spin';
  });
  $('#v-reset').addEventListener('click', function () {
    var v = state.viewer;
    v.yaw = -0.72; v.pitch = 0.5; v.zoom = DEFAULT_ZOOM;
  });
  // Embedded pages (an iframe preview) cannot start a download, so don't offer it.
  if (window.top !== window.self) $('#v-png').hidden = true;
  $('#v-png').addEventListener('click', function () { state.capture = true; });

  // Drag to orbit.
  var drag = null;
  vSlot.addEventListener('pointerdown', function (e) {
    if (!state.viewer) return;
    drag = { x: e.clientX, y: e.clientY };
    vSlot.classList.add('dragging');
    vSlot.setPointerCapture(e.pointerId);
  });
  vSlot.addEventListener('pointermove', function (e) {
    if (!drag || !state.viewer) return;
    var v = state.viewer;
    v.yaw -= (e.clientX - drag.x) * 0.01;
    v.pitch = Math.max(-1.45, Math.min(1.45, v.pitch + (e.clientY - drag.y) * 0.01));
    drag.x = e.clientX; drag.y = e.clientY;
  });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    vSlot.addEventListener(t, function () { drag = null; vSlot.classList.remove('dragging'); });
  });
  vSlot.addEventListener('wheel', function (e) {
    if (!state.viewer) return;
    e.preventDefault();
    var v = state.viewer;
    v.zoom = Math.max(0.45, Math.min(3, v.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== search) {
      e.preventDefault(); search.focus(); search.select(); return;
    }
    if (e.key === 'r' && document.activeElement !== search && !state.viewer) {
      $('#random').click(); return;
    }
    if (!state.viewer) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  function savePng() {
    var rect = vSlot.getBoundingClientRect();
    var block = state.filtered[state.viewer.index];
    var canvas = engine.grab(rect);
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = block.id + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* -------------------------------------------------------------- loop */

  var resizePending = true;
  var topbar = document.querySelector('.topbar');

  function measureChrome() {
    // The category bar sticks directly below the header, whatever its height.
    document.documentElement.style.setProperty('--bar-h', topbar.offsetHeight + 'px');
  }

  addEventListener('resize', function () { resizePending = true; measureChrome(); });

  function frame(now) {
    requestAnimationFrame(frame);
    if (resizePending) { engine.resize(); resizePending = false; }

    var t = now / 1000;
    engine.beginFrame();

    if (state.viewer) {
      var v = state.viewer;
      if (v.spin) v.yaw += 0.008;
      var rect = vSlot.getBoundingClientRect();
      if (rect.width > 4) {
        engine.draw(rect, state.filtered[v.index], { yaw: v.yaw, pitch: v.pitch, zoom: v.zoom });
        if (state.capture) { state.capture = false; savePng(); }
      }
    } else {
      state.visible.forEach(function (card) {
        var rect = card.slot.getBoundingClientRect();
        if (rect.bottom < -40 || rect.top > innerHeight + 40) return;
        if (card.born < 0) card.born = t;
        var fade = reduceMotion ? 1 : Math.min(1, (t - card.born) / 0.35);
        var yaw = reduceMotion ? -0.72 : -0.72 + t * 0.35 + card.index * 0.7;
        engine.draw(rect, card.block, { yaw: yaw, pitch: 0.5, zoom: 0.92, fade: fade });
      });
    }

    engine.endFrame();
  }

  /* -------------------------------------------------------------- start */

  buildCats();
  measureChrome();
  applyFilters();
  requestAnimationFrame(frame);

  var hash = decodeURIComponent(location.hash.replace('#', ''));
  if (hash && Blocks.byId[hash]) {
    var idx = state.filtered.indexOf(Blocks.byId[hash]);
    if (idx >= 0) openViewer(idx);
  }

  // Expose a little for console tinkering.
  window.Blockdex = { state: state, engine: engine, open: openViewer };
})();
