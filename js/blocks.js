/* The block catalogue.

   Blocks are described, not drawn: an id, a shape, and one face description per
   visible side. Whole families (16 dye colours, 13 wood sets, the stone
   variants) are expanded programmatically, exactly as they are in the game. */
(function (global) {
  'use strict';

  var ramp = Rand.ramp, shade = Rand.shade, mix = Rand.mix;

  var LIST = [];
  var byId = Object.create(null);

  /** Face description helper: f('planks', '#b8945f') or f('ore', ['#a', '#b']). */
  function f(pattern, colors, extra) {
    var face = { p: pattern, c: typeof colors === 'string' ? ramp(colors, 3, .16) : colors };
    if (extra) for (var k in extra) face[k] = extra[k];
    return face;
  }

  var SMALL = { of: 1, the: 1, and: 1, o: 1 };

  function title(id) {
    return id.split('_').map(function (w, i) {
      if (i > 0 && SMALL[w]) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  /**
   * Register a block.
   * spec: { shape, all, top, bottom, side, front, back, lock, alpha, glow, cat, name, tags }
   */
  function add(id, cat, spec) {
    spec = spec || {};
    var faces = {};
    if (spec.all) faces.side = spec.all;
    ['side', 'top', 'bottom', 'front', 'back', 'lock'].forEach(function (n) {
      if (spec[n]) faces[n] = spec[n];
    });
    if (!Object.keys(faces).length) faces.side = f('noise', '#8b8b8b');

    var block = {
      id: id,
      name: spec.name || title(id),
      cat: cat,
      shape: spec.shape || 'cube',
      faces: faces,
      alpha: spec.alpha || null,
      glow: spec.glow || 0,
      tags: spec.tags || ''
    };
    LIST.push(block);
    byId[id] = block;
    return block;
  }

  var FALLBACK = { bottom: 'top', top: 'side', front: 'side', back: 'side', lock: 'side', side: 'top' };

  function faceList(block) {
    var out = [];
    for (var k in block.faces) out.push({ name: k, face: block.faces[k] });
    return out;
  }

  /* ================================================================= wood */

  var WOODS = [
    { id: 'oak', planks: '#b8945f', bark: '#6b5033', barkTop: '#b09055', leaves: '#4c8f2f' },
    { id: 'spruce', planks: '#7a5a35', bark: '#3b2c17', barkTop: '#8a6d43', leaves: '#2f5f2b' },
    { id: 'birch', planks: '#d7cb8d', bark: '#d5d2cb', barkTop: '#c8b884', leaves: '#71a74d' },
    { id: 'jungle', planks: '#b1805c', bark: '#574119', barkTop: '#9a7b4f', leaves: '#3d8a1e' },
    { id: 'acacia', planks: '#ba6337', bark: '#676157', barkTop: '#a9613a', leaves: '#67a22e' },
    { id: 'dark_oak', planks: '#4f3218', bark: '#3a2411', barkTop: '#4b3620', leaves: '#3b8419' },
    { id: 'mangrove', planks: '#773934', bark: '#5a352a', barkTop: '#7a4a3a', leaves: '#4c8c30' },
    { id: 'cherry', planks: '#e3b3a3', bark: '#33261f', barkTop: '#c98f7d', leaves: '#ffbcdd' },
    { id: 'pale_oak', planks: '#e5ddd0', bark: '#5b5347', barkTop: '#cfc4b1', leaves: '#8fa877' },
    { id: 'bamboo', planks: '#c8ab4f', bark: '#7b9d40', barkTop: '#a6b455', leaves: null },
    { id: 'crimson', planks: '#6a344b', bark: '#5a1e2a', barkTop: '#7b3247', leaves: '#7b1d3a', nether: true },
    { id: 'warped', planks: '#2b6963', bark: '#397270', barkTop: '#3a8079', leaves: '#187571', nether: true }
  ];

  WOODS.forEach(function (w) {
    var name = title(w.id);
    var planks = f('planks', ramp(w.planks, 4, .13));
    var bark = f('bark', ramp(w.bark, 4, .18));
    var barkTop = f('rings', ramp(w.barkTop, 4, .2));
    var strippedSide = f('bark', ramp(mix(w.planks, w.bark, .35), 3, .12));

    add(w.id + '_planks', 'wood', { all: planks });
    add(w.id + '_stairs', 'wood', { shape: 'stairs', all: planks });
    add(w.id + '_slab', 'wood', { shape: 'slab', all: planks });
    add(w.id + '_fence', 'wood', { shape: 'fence', all: planks });
    add(w.id + '_fence_gate', 'wood', { shape: 'gate', all: planks });
    add(w.id + '_door', 'wood', { shape: 'door', all: f('door', ramp(w.planks, 4, .13)) });
    add(w.id + '_trapdoor', 'wood', { shape: 'trapdoor', all: f('door', ramp(w.planks, 4, .13)) });
    add(w.id + '_pressure_plate', 'redstone', { shape: 'plate', all: planks });
    add(w.id + '_button', 'redstone', { shape: 'button', all: planks });
    add(w.id + '_sign', 'decoration', { shape: 'sign', all: planks });

    if (w.id === 'bamboo') {
      add('bamboo_block', 'wood', { side: f('bamboo', ramp(w.bark, 3, .14)), top: barkTop });
      add('stripped_bamboo_block', 'wood', { side: f('bamboo', ramp(mix(w.bark, w.planks, .5), 3, .12)), top: barkTop });
      add('bamboo_mosaic', 'wood', { all: f('tiles', ramp(w.planks, 3, .14)) });
      add('bamboo_stalk', 'plants', { shape: 'rod', all: f('bamboo', ramp('#7b9d40', 3, .18)), alpha: 'cutout', name: 'Bamboo' });
      return;
    }

    var logId = w.nether ? '_stem' : '_log';
    var woodId = w.nether ? '_hyphae' : '_wood';
    add(w.id + logId, 'wood', { side: bark, top: barkTop, bottom: barkTop });
    add(w.id + woodId, 'wood', { all: bark });
    add('stripped_' + w.id + logId, 'wood', { side: strippedSide, top: barkTop, bottom: barkTop });
    add('stripped_' + w.id + woodId, 'wood', { all: strippedSide });

    if (w.leaves) {
      add(w.id + '_leaves', 'nature', {
        all: f('leaves', ramp(w.leaves, 4, .22)), alpha: 'cutout',
        name: w.nether ? name + ' Wart Block' : name + ' Leaves'
      });
    }
    if (!w.nether) {
      add(w.id + '_sapling', 'plants', {
        shape: 'cross', alpha: 'cutout',
        front: f('plant', ramp(w.leaves, 3, .2), { kind: 'sapling', stem: shade(w.bark, 1.3) })
      });
    }
  });

  /* ================================================================ stone */

  var STONES = [
    { id: 'stone', c: '#7d7d7d', p: 'noise', v: ['stairs', 'slab', 'button', 'pressure_plate'] },
    { id: 'cobblestone', c: '#8a8a8a', p: 'cobble', v: ['stairs', 'slab', 'wall'] },
    { id: 'mossy_cobblestone', c: '#7d8a6a', p: 'cobble', v: ['stairs', 'slab', 'wall'] },
    { id: 'smooth_stone', c: '#a0a0a0', p: 'smooth', v: ['slab'] },
    { id: 'stone_bricks', c: '#7a7a7a', p: 'bigbricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'mossy_stone_bricks', c: '#71805f', p: 'bigbricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'cracked_stone_bricks', c: '#6f6f6f', p: 'bigbricks', v: [] },
    { id: 'chiseled_stone_bricks', c: '#787878', p: 'chiseled', v: [] },
    { id: 'granite', c: '#9a6b5b', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'polished_granite', c: '#9c6a5a', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'diorite', c: '#cfcfcf', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'polished_diorite', c: '#d3d3d6', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'andesite', c: '#88898a', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'polished_andesite', c: '#8b8c8d', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'deepslate', c: '#4f4f55', p: 'deepslate', v: [] },
    { id: 'cobbled_deepslate', c: '#4c4c52', p: 'cobble', v: ['stairs', 'slab', 'wall'] },
    { id: 'polished_deepslate', c: '#484850', p: 'smooth', v: ['stairs', 'slab', 'wall'] },
    { id: 'deepslate_bricks', c: '#464650', p: 'bigbricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'deepslate_tiles', c: '#39393f', p: 'tiles', v: ['stairs', 'slab', 'wall'] },
    { id: 'chiseled_deepslate', c: '#3d3d44', p: 'chiseled', v: [] },
    { id: 'cracked_deepslate_bricks', c: '#41414a', p: 'bigbricks', v: [] },
    { id: 'tuff', c: '#6b6d63', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'polished_tuff', c: '#6d6f66', p: 'smooth', v: ['stairs', 'slab', 'wall'] },
    { id: 'tuff_bricks', c: '#666861', p: 'bigbricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'calcite', c: '#dfdfd7', p: 'noise', v: [] },
    { id: 'dripstone_block', c: '#8a6a5b', p: 'noise', v: [] },
    { id: 'bricks', c: '#96604a', p: 'bricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'mud_bricks', c: '#8a6a52', p: 'bricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'packed_mud', c: '#8f6b4e', p: 'noise', v: [] },
    { id: 'sandstone', c: '#dbcf8e', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'cut_sandstone', c: '#dccf8f', p: 'bigbricks', v: ['slab'] },
    { id: 'chiseled_sandstone', c: '#d9cc8b', p: 'chiseled', v: [] },
    { id: 'smooth_sandstone', c: '#dfd3a0', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'red_sandstone', c: '#bf6c26', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'cut_red_sandstone', c: '#bf6d27', p: 'bigbricks', v: ['slab'] },
    { id: 'chiseled_red_sandstone', c: '#b96b28', p: 'chiseled', v: [] },
    { id: 'smooth_red_sandstone', c: '#c47630', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'blackstone', c: '#2b2529', p: 'noise', v: ['stairs', 'slab', 'wall'] },
    { id: 'polished_blackstone', c: '#332f36', p: 'smooth', v: ['stairs', 'slab', 'wall', 'button', 'pressure_plate'] },
    { id: 'polished_blackstone_bricks', c: '#302b31', p: 'bigbricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'gilded_blackstone', c: '#2f2830', p: 'ore', v: [] },
    { id: 'basalt', c: '#4c4a4f', p: 'basalt', v: [] },
    { id: 'smooth_basalt', c: '#48464d', p: 'smooth', v: [] },
    { id: 'polished_basalt', c: '#5c5a60', p: 'pillar', v: [] },
    { id: 'nether_bricks', c: '#2d161a', p: 'bricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'red_nether_bricks', c: '#450d10', p: 'bricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'chiseled_nether_bricks', c: '#301a1e', p: 'chiseled', v: [] },
    { id: 'quartz_block', c: '#e6e0d8', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'smooth_quartz', c: '#eae4dc', p: 'smooth', v: ['stairs', 'slab'] },
    { id: 'chiseled_quartz_block', c: '#e5dfd6', p: 'chiseled', v: [] },
    { id: 'quartz_bricks', c: '#e4ded5', p: 'bigbricks', v: [] },
    { id: 'purpur_block', c: '#a779a7', p: 'noise', v: ['stairs', 'slab'] },
    { id: 'end_stone', c: '#dbdf9e', p: 'noise', v: [] },
    { id: 'end_stone_bricks', c: '#d9de9c', p: 'bigbricks', v: ['stairs', 'slab', 'wall'] },
    { id: 'prismarine', c: '#63a597', p: 'prismarine', v: ['stairs', 'slab', 'wall'] },
    { id: 'prismarine_bricks', c: '#68b0a1', p: 'bigbricks', v: ['stairs', 'slab'] },
    { id: 'dark_prismarine', c: '#33604f', p: 'prismarine', v: ['stairs', 'slab'] },
    { id: 'obsidian', c: '#100c1c', p: 'obsidian', v: [] },
    { id: 'crying_obsidian', c: '#1c0b34', p: 'obsidian', v: [], glow: .3 },
    { id: 'netherrack', c: '#6f3336', p: 'netherrack', v: [] },
    { id: 'bedrock', c: '#565656', p: 'blobs', v: [] },
    { id: 'terracotta', c: '#985e44', p: 'noise', v: [] },
    { id: 'resin_bricks', c: '#c8621f', p: 'bricks', v: ['stairs', 'slab', 'wall'] }
  ];

  var VARIANT_SHAPE = { stairs: 'stairs', slab: 'slab', wall: 'wall', button: 'button', pressure_plate: 'plate' };

  STONES.forEach(function (s) {
    var face = f(s.p, ramp(s.c, s.p === 'noise' || s.p === 'blobs' ? 4 : 3, .16));
    if (s.p === 'ore') face = f('ore', ['#f9d976', '#ffe9a8'], { base: 'noise', bc: ramp(s.c, 3, .18) });
    if (s.p === 'bricks') face.c = ramp(s.c, 4, .14).concat([shade(s.c, .68)]);
    if (s.p === 'obsidian') face.c = [s.c, shade(s.c, 2.2)];
    if (s.p === 'prismarine') face.c = [s.c, shade(s.c, .86), shade(s.c, 1.1)];

    add(s.id, 'stone', { all: face, glow: s.glow || 0 });
    s.v.forEach(function (v) {
      var vid = s.id.replace(/s$/, '') + '_' + v;
      if (s.id === 'quartz_block') vid = 'quartz_' + v;
      if (/bricks$/.test(s.id)) vid = s.id.replace(/s$/, '') + '_' + v;
      add(vid, v === 'button' || v === 'pressure_plate' ? 'redstone' : 'stone',
        { shape: VARIANT_SHAPE[v], all: face });
    });
  });

  add('quartz_pillar', 'stone', { side: f('pillar', ramp('#e6e0d8', 3, .1)), top: f('rings', ramp('#e6e0d8', 3, .1)) });
  add('purpur_pillar', 'stone', { side: f('pillar', ramp('#a779a7', 3, .12)), top: f('rings', ramp('#a779a7', 3, .12)) });
  add('bone_block', 'stone', { side: f('pillar', ramp('#e5e2d5', 3, .12)), top: f('rings', ramp('#e5e2d5', 3, .12)) });
  add('reinforced_deepslate', 'stone', { side: f('deepslate', ramp('#4a4c4a', 3, .2)), top: f('circuit', ['#4a4c4a', '#9aa08c']) });
  add('infested_stone', 'stone', { all: f('noise', ramp('#7d7d7d', 4, .16)) });

  /* ============================================================ minerals */

  var ORES = [
    { id: 'coal', c: ['#1d1d1d', '#333333'], name: 'Coal' },
    { id: 'iron', c: ['#d8af93', '#e8c9b0'], name: 'Iron' },
    { id: 'copper', c: ['#e08a54', '#f0a878'], name: 'Copper', noBlock: true },
    { id: 'gold', c: ['#f6d13a', '#fce88a'], name: 'Gold' },
    { id: 'redstone', c: ['#b32d20', '#e34a34'], name: 'Redstone', glow: .12 },
    { id: 'lapis', c: ['#1f4fbf', '#3f74e0'], name: 'Lapis Lazuli' },
    { id: 'diamond', c: ['#37d6cd', '#9ef4ee'], name: 'Diamond' },
    { id: 'emerald', c: ['#17c04e', '#7cf0a0'], name: 'Emerald' }
  ];

  ORES.forEach(function (o) {
    add(o.id + '_ore', 'minerals', {
      all: f('ore', o.c, { base: 'noise', bc: ramp('#7d7d7d', 3, .16) }),
      glow: o.glow || 0, name: o.name + ' Ore'
    });
    add('deepslate_' + o.id + '_ore', 'minerals', {
      all: f('ore', o.c, { base: 'deepslate', bc: ramp('#4f4f55', 3, .2) }),
      glow: o.glow || 0, name: 'Deepslate ' + o.name + ' Ore'
    });
    if (!o.noBlock) {
      add(o.id + '_block', 'minerals', { all: f('metal', [o.c[0]]), name: 'Block of ' + o.name });
    }
  });

  add('nether_gold_ore', 'minerals', { all: f('ore', ['#f6d13a', '#fce88a'], { base: 'netherrack', bc: ramp('#6f3336', 3, .2) }) });
  add('nether_quartz_ore', 'minerals', { all: f('ore', ['#eae0d8', '#ffffff'], { base: 'netherrack', bc: ramp('#6f3336', 3, .2) }) });
  add('ancient_debris', 'minerals', { side: f('blobs', ['#5a4038', '#3f2f2b', '#6b4a3f']), top: f('blobs', ['#6b4a3f', '#4a352f', '#7a564a']) });
  add('netherite_block', 'minerals', { all: f('metal', ['#443a3d']), name: 'Block of Netherite' });
  add('raw_iron_block', 'minerals', { all: f('blobs', ['#d3a583', '#bd8f70', '#e3b795']), name: 'Block of Raw Iron' });
  add('raw_copper_block', 'minerals', { all: f('blobs', ['#c5764a', '#a9613c', '#dd8f60']), name: 'Block of Raw Copper' });
  add('raw_gold_block', 'minerals', { all: f('blobs', ['#e0b53a', '#c79c2c', '#f2cf5c']), name: 'Block of Raw Gold' });
  add('amethyst_block', 'minerals', { all: f('amethyst', ['#8a5fd0']) });
  add('budding_amethyst', 'minerals', { all: f('amethyst', ['#7d54c4']) });
  add('amethyst_cluster', 'minerals', { shape: 'cross', alpha: 'cutout', glow: .35, front: f('plant', ['#c39bf0', '#8a5fd0'], { kind: 'tall', stem: '#6f4bb0' }) });

  // Copper oxidation ladder, waxed and unwaxed shapes alike.
  var COPPER = [
    { id: '', name: '', c: '#c06a3c' },
    { id: 'exposed_', name: 'Exposed ', c: '#a1836a' },
    { id: 'weathered_', name: 'Weathered ', c: '#6f9a72' },
    { id: 'oxidized_', name: 'Oxidized ', c: '#54a381' }
  ];

  COPPER.forEach(function (o) {
    var base = f('copper', [o.c, shade(o.c, .86)]);
    var cut = f('tiles', ramp(o.c, 3, .14));
    add(o.id + 'copper_block', 'minerals', { all: base, name: 'Block of ' + o.name + 'Copper' });
    add(o.id + 'cut_copper', 'minerals', { all: cut, name: o.name + 'Cut Copper' });
    add(o.id + 'cut_copper_stairs', 'minerals', { shape: 'stairs', all: cut, name: o.name + 'Cut Copper Stairs' });
    add(o.id + 'cut_copper_slab', 'minerals', { shape: 'slab', all: cut, name: o.name + 'Cut Copper Slab' });
    add(o.id + 'copper_grate', 'minerals', { all: f('spawner', [o.c]), alpha: 'cutout', name: o.name + 'Copper Grate' });
    add(o.id + 'chiseled_copper', 'minerals', { all: f('chiseled', ramp(o.c, 3, .16)), name: o.name + 'Chiseled Copper' });
    add(o.id + 'copper_door', 'minerals', { shape: 'door', all: f('door', ramp(o.c, 4, .14)), name: o.name + 'Copper Door' });
    add(o.id + 'copper_trapdoor', 'minerals', { shape: 'trapdoor', all: f('door', ramp(o.c, 4, .14)), name: o.name + 'Copper Trapdoor' });
    add(o.id + 'copper_bulb', 'light', { all: f('circuit', [o.c, '#ffd98a']), glow: .8, name: o.name + 'Copper Bulb' });
  });

  global.Blocks = {
    list: LIST, byId: byId, add: add, f: f, ramp: ramp, title: title,
    faceList: faceList,
    fallbackFace: function (n) { return FALLBACK[n]; }
  };
})(window);
