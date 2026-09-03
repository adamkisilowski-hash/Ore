/* The rest of the catalogue: terrain, plants, the 16-colour families,
   the Nether and End, redstone and utility blocks. */
(function () {
  'use strict';

  var add = Blocks.add, f = Blocks.f, ramp = Blocks.ramp, title = Blocks.title;
  var shade = Rand.shade, mix = Rand.mix;

  var DIRT = ['#8b6849', '#7b5b3f', '#6b4e35'];

  /* ============================================================== terrain */

  add('grass_block', 'nature', {
    top: f('grass_top', '#5fa543'),
    side: f('grass_side', ['#5fa543'], { dirt: DIRT }),
    bottom: f('noise', DIRT)
  });
  add('dirt', 'nature', { all: f('noise', DIRT) });
  add('coarse_dirt', 'nature', { all: f('blobs', ['#7b5b3f', '#6b4e35', '#8b6849']) });
  add('rooted_dirt', 'nature', { all: f('blobs', ['#8a6a4a', '#c8a878', '#7b5b3f']) });
  add('podzol', 'nature', {
    top: f('noise', ['#6a4a20', '#7d5a28', '#5a3f1c']),
    side: f('grass_side', ['#6a4a20'], { dirt: DIRT }),
    bottom: f('noise', DIRT)
  });
  add('mycelium', 'nature', {
    top: f('mycelium', ['#6f6265', '#7d7076', '#b6a8ad']),
    side: f('grass_side', ['#6f6265'], { dirt: DIRT }),
    bottom: f('noise', DIRT)
  });
  add('farmland', 'nature', { top: f('farmland', ['#5b3c22', '#6b4a2a', '#4a2f18']), side: f('noise', DIRT), bottom: f('noise', DIRT) });
  add('dirt_path', 'nature', { shape: 'layer', top: f('path_top', ['#96794a', '#8a6d42', '#a4875a']), side: f('noise', DIRT), bottom: f('noise', DIRT) });
  add('mud', 'nature', { all: f('smooth', '#3d3a3f') });
  add('muddy_mangrove_roots', 'nature', { side: f('bark', ramp('#4a3f33', 3, .2)), top: f('blobs', ['#3d3a3f', '#5a4a3a', '#4a3f33']) });
  add('mangrove_roots', 'nature', { all: f('bark', ramp('#6a4a35', 3, .22)), alpha: 'cutout' });
  add('pointed_dripstone', 'nature', { shape: 'spike', alpha: 'cutout', all: f('noise', ramp('#8a6a5b', 3, .18)) });
  add('clay', 'nature', { all: f('smooth', '#a4a8b6') });
  add('gravel', 'nature', { all: f('blobs', ['#7f7c78', '#8f8c88', '#6e6b67', '#9c9894']) });
  add('sand', 'nature', { all: f('grain', ['#e6dbab', '#dbcf9c', '#efe6bd']) });
  add('red_sand', 'nature', { all: f('grain', ['#bf6c26', '#a95f22', '#cf7c32']) });
  add('suspicious_sand', 'nature', { all: f('grain', ['#dcd0a0', '#c9bd8d', '#efe6bd']) });
  add('suspicious_gravel', 'nature', { all: f('blobs', ['#7f7c78', '#96928c', '#6e6b67']) });
  add('snow_block', 'nature', { all: f('snow', '#f4f8f8') });
  add('snow', 'nature', { shape: 'layer', all: f('snow', '#f4f8f8') });
  add('powder_snow', 'nature', { all: f('snow', '#f8fcfc') });
  add('ice', 'nature', { all: f('ice', '#8fb6f0'), alpha: 'blend' });
  add('packed_ice', 'nature', { all: f('smooth', '#7fa8e8') });
  add('blue_ice', 'nature', { all: f('smooth', '#6f9ce8') });
  add('moss_block', 'nature', { all: f('moss', '#5a7a30') });
  add('moss_carpet', 'nature', { shape: 'carpet', all: f('moss', '#5a7a30') });
  add('pale_moss_block', 'nature', { all: f('moss', '#6a7a68') });
  add('pale_moss_carpet', 'nature', { shape: 'carpet', all: f('moss', '#6a7a68') });
  add('magma_block', 'nature', { all: f('lava', ['#8a3a12', '#c85a18', '#ffab3a']), glow: .55 });
  add('soul_sand', 'nature', { all: f('blobs', ['#544139', '#463630', '#63504a']) });
  add('soul_soil', 'nature', { all: f('noise', ['#4b3a33', '#59453d', '#3f312b']) });
  add('obsidian_pillar', 'stone', { name: 'Obsidian Pillar', side: f('pillar', ramp('#100c1c', 3, .8)), top: f('rings', ramp('#100c1c', 3, .9)) });

  // Sculk
  add('sculk', 'nature', { all: f('sculk', ['#0f2027', '#132b33', '#1d4c56', '#3ec7c2']), glow: .12 });
  add('sculk_vein', 'nature', { shape: 'flat', top: f('vine', ['#1d4c56']), alpha: 'cutout', glow: .1 });
  add('sculk_catalyst', 'nature', { top: f('sculk', ['#132b33', '#1d4c56', '#61f7ef']), side: f('sculk', ['#0f2027', '#132b33', '#3ec7c2']), bottom: f('noise', ['#20262b']), glow: .3 });
  add('sculk_shrieker', 'nature', { shape: 'slab', top: f('circuit', ['#1a3540', '#a8f0e0']), side: f('sculk', ['#132b33', '#1d4c56']), glow: .25 });
  add('sculk_sensor', 'redstone', { shape: 'slab', top: f('circuit', ['#12303a', '#3ec7c2']), side: f('sculk', ['#0f2027', '#1d4c56']), glow: .2 });

  /* ================================================================ plants */

  function plant(id, cat, colors, kind, opts) {
    opts = opts || {};
    add(id, cat || 'plants', {
      shape: opts.shape || 'cross',
      alpha: 'cutout',
      glow: opts.glow || 0,
      name: opts.name,
      front: f('plant', colors, { kind: kind, stem: opts.stem || '#3f7a24' })
    });
  }

  plant('short_grass', 'plants', ['#63a63f'], 'grass');
  plant('tall_grass', 'plants', ['#5f9e3c'], 'grass');
  plant('fern', 'plants', ['#4f9440'], 'fern');
  plant('large_fern', 'plants', ['#4a8c3c'], 'fern');
  plant('dead_bush', 'plants', ['#946428'], 'fern');
  plant('seagrass', 'plants', ['#2f8f3a'], 'grass');
  plant('kelp', 'plants', ['#3a7a35'], 'grass');
  plant('nether_sprouts', 'nether', ['#1d9c8f'], 'grass');
  plant('crimson_roots', 'nether', ['#8b2141'], 'grass');
  plant('warped_roots', 'nether', ['#14b3a6'], 'grass');
  plant('twisting_vines', 'nether', ['#14a396'], 'grass');
  plant('weeping_vines', 'nether', ['#8c1b2b'], 'grass');
  plant('sugar_cane', 'plants', ['#96c56a'], 'grass');
  plant('cave_vines', 'plants', ['#5f8a3a'], 'grass', { glow: .3 });
  plant('hanging_roots', 'plants', ['#c8a878'], 'grass');
  plant('spore_blossom', 'plants', ['#d264c8', '#8a2f80'], 'flower', { stem: '#4a7a2a' });

  var FLOWERS = [
    ['dandelion', '#ffec4f', '#c8a800'],
    ['poppy', '#d63a2f', '#2f2f2f'],
    ['blue_orchid', '#2eb0e0', '#f2f2a0'],
    ['allium', '#b57ce0', '#e6d0ff'],
    ['azure_bluet', '#f0f0f0', '#e0d24a'],
    ['red_tulip', '#d63a2f', '#f0e46a'],
    ['orange_tulip', '#f08a2a', '#f0e46a'],
    ['white_tulip', '#f2f2f2', '#f0e46a'],
    ['pink_tulip', '#eda8d0', '#f0e46a'],
    ['oxeye_daisy', '#f4f4f0', '#f5d800'],
    ['cornflower', '#4a6ee0', '#7f97ff'],
    ['lily_of_the_valley', '#f6f6f6', '#dfe6cf'],
    ['wither_rose', '#20201f', '#3a3a38'],
    ['torchflower', '#e07a2a', '#f7c04a'],
    ['pitcher_plant', '#8a5fd0', '#c39bf0'],
    ['pink_petals', '#f2b6d8', '#ffd8ea'],
    ['closed_eyeblossom', '#d8c8b0', '#8a7a60'],
    ['open_eyeblossom', '#f0e0c0', '#c8a060']
  ];
  FLOWERS.forEach(function (fl) { plant(fl[0], 'plants', [fl[1], fl[2]], 'flower'); });

  [['sunflower', '#f7d63a'], ['lilac', '#c9a2d6'], ['rose_bush', '#c8302a'], ['peony', '#e0aed6']].forEach(function (t) {
    plant(t[0], 'plants', [t[1], shade(t[1], .8)], 'tall');
  });

  plant('brown_mushroom', 'plants', ['#a07050'], 'mushroom');
  plant('red_mushroom', 'plants', ['#cc3a30', '#f0f0f0'], 'mushroom');
  plant('crimson_fungus', 'nether', ['#8b2141'], 'mushroom');
  plant('warped_fungus', 'nether', ['#199c8f'], 'mushroom');

  ['wheat', 'carrots', 'potatoes', 'beetroots', 'torchflower_crop', 'pitcher_crop'].forEach(function (c, i) {
    var col = [['#c8b45a', '#e0d07a'], ['#3f8f2a', '#e07a1a'], ['#3f8f2a', '#d8d84a'], ['#2f7a2a', '#b03a2a'], ['#4a8a3a', '#e07a2a'], ['#4a8a3a', '#8a5fd0']][i];
    add(c, 'plants', { shape: 'crop', alpha: 'cutout', front: f('crop', col) });
  });
  add('nether_wart', 'nether', { shape: 'crop', alpha: 'cutout', front: f('crop', ['#8b1e2a', '#b02a38']) });
  add('sweet_berry_bush', 'plants', { shape: 'cross', alpha: 'cutout', front: f('plant', ['#3f7a2a', '#c8302a'], { kind: 'sapling', stem: '#4a3a20' }) });
  add('lily_pad', 'plants', { shape: 'flat', alpha: 'cutout', top: f('moss', '#2f7a2a') });
  add('vine', 'plants', { shape: 'ladder', alpha: 'cutout', front: f('vine', ['#3f7a24']) });
  add('glow_lichen', 'plants', { shape: 'ladder', alpha: 'cutout', glow: .35, front: f('vine', ['#7ba88a']) });
  add('big_dripleaf', 'plants', { shape: 'flat', alpha: 'cutout', top: f('moss', '#4f8a2f') });
  add('small_dripleaf', 'plants', { shape: 'cross', alpha: 'cutout', front: f('plant', ['#4f8a2f'], { kind: 'sapling', stem: '#7a5a30' }) });
  add('sea_pickle', 'ocean', { shape: 'pot', glow: .4, all: f('noise', ['#5a6a2a', '#6f8a34', '#8aa84a']) });
  add('azalea', 'nature', { top: f('leaves', ramp('#5f8a3a', 3, .2)), side: f('leaves', ramp('#4f7a30', 3, .2)), bottom: f('noise', DIRT), alpha: 'cutout' });
  add('flowering_azalea', 'nature', { top: f('leaves', ['#d264c8', '#5f8a3a', '#7aa84a']), side: f('leaves', ['#d264c8', '#4f7a30', '#6a9a3a']), bottom: f('noise', DIRT), alpha: 'cutout' });
  add('azalea_leaves', 'nature', { all: f('leaves', ramp('#5f8a3a', 4, .22)), alpha: 'cutout' });
  add('flowering_azalea_leaves', 'nature', { all: f('leaves', ['#d264c8', '#5f8a3a', '#6a9a3a', '#7aa84a']), alpha: 'cutout' });
  add('cactus', 'plants', { side: f('noise', ['#0f7a3a', '#13873f', '#0b6a32']), top: f('noise', ['#13873f', '#17944a']) });
  add('brown_mushroom_block', 'nature', { all: f('solid', '#9a7150') });
  add('red_mushroom_block', 'nature', { all: f('solid', '#c63a30') });
  add('mushroom_stem', 'nature', { all: f('solid', '#e0d8cf') });
  add('nether_wart_block', 'nether', { all: f('wart', ['#7a0b18']) });
  add('warped_wart_block', 'nether', { all: f('wart', ['#167a76']) });
  add('shroomlight', 'light', { all: f('wart', ['#f0a63a']), glow: .95 });
  add('crimson_nylium', 'nether', { top: f('netherrack', '#7a1130'), side: f('grass_side', ['#7a1130'], { dirt: ['#6f3336', '#5f2b2e', '#7c3d40'] }), bottom: f('netherrack', '#6f3336') });
  add('warped_nylium', 'nether', { top: f('netherrack', '#177a72'), side: f('grass_side', ['#177a72'], { dirt: ['#6f3336', '#5f2b2e', '#7c3d40'] }), bottom: f('netherrack', '#6f3336') });

  /* ============================================================== 16 colours */

  var DYE = [
    ['white', '#e9ecec'], ['orange', '#f07613'], ['magenta', '#bd44b3'], ['light_blue', '#3aafd9'],
    ['yellow', '#f8c627'], ['lime', '#70b919'], ['pink', '#ed8dac'], ['gray', '#3e4447'],
    ['light_gray', '#8e8e86'], ['cyan', '#158991'], ['purple', '#8932b8'], ['blue', '#3c44aa'],
    ['brown', '#835432'], ['green', '#5e7c16'], ['red', '#a12722'], ['black', '#181414']
  ];

  DYE.forEach(function (d) {
    var id = d[0], c = d[1];
    var terra = mix(c, '#985e44', .45);

    add(id + '_wool', 'colored', { all: f('wool', ramp(c, 4, .12)) });
    add(id + '_carpet', 'colored', { shape: 'carpet', all: f('wool', ramp(c, 4, .12)) });
    add(id + '_concrete', 'colored', { all: f('solid', shade(c, 1.02)) });
    add(id + '_concrete_powder', 'colored', { all: f('grain', ramp(shade(c, 1.12), 3, .1)) });
    add(id + '_terracotta', 'colored', { all: f('noise', ramp(terra, 4, .14)) });
    add(id + '_glazed_terracotta', 'colored', { all: f('glazed', [c, shade(c, .68), mix(c, '#ffffff', .78)]) });
    add(id + '_stained_glass', 'glass', { all: f('glass', [c], { a: 92 }), alpha: 'blend' });
    add(id + '_stained_glass_pane', 'glass', { shape: 'pane', all: f('glass', [c], { a: 92 }), alpha: 'blend' });
    add(id + '_bed', 'decoration', { shape: 'bed', top: f('wool', ramp(c, 3, .1)), side: f('wool', ramp(shade(c, .9), 3, .1)), bottom: f('planks', ramp('#b8945f', 3, .12)) });
    add(id + '_candle', 'light', { shape: 'rod', glow: .55, all: f('solid', mix(c, '#f0e6d0', .35)) });
    add(id + '_shulker_box', 'utility', { shape: 'shulker', top: f('chiseled', ramp(shade(c, 1.12), 3, .14)), side: f('chiseled', ramp(c, 3, .14)), bottom: f('solid', shade(c, .8)) });
    add(id + '_banner', 'decoration', { shape: 'sign', all: f('wool', ramp(c, 3, .1)) });
  });

  add('glass', 'glass', { all: f('glass', ['#d6f0f5'], { a: 46 }), alpha: 'blend' });
  add('glass_pane', 'glass', { shape: 'pane', all: f('glass', ['#d6f0f5'], { a: 46 }), alpha: 'blend' });
  add('tinted_glass', 'glass', { all: f('glass', ['#2b2630'], { a: 190 }), alpha: 'blend' });
  add('iron_bars', 'utility', { shape: 'pane', all: f('spawner', ['#b0b0b0']), alpha: 'cutout' });
  add('honey_block', 'utility', { all: f('slime', ['#f7b83a']), alpha: 'blend' });
  add('slime_block', 'utility', { all: f('slime', ['#7ac57a']), alpha: 'blend' });
  add('sponge', 'ocean', { all: f('sponge', '#c7c554') });
  add('wet_sponge', 'ocean', { all: f('sponge', '#a2a545') });

  /* ================================================================ ocean */

  var CORALS = [['tube', '#2f4fd0'], ['brain', '#d05a9a'], ['bubble', '#a02fc0'], ['fire', '#d03a3a'], ['horn', '#e0c83a']];
  CORALS.forEach(function (c) {
    add(c[0] + '_coral_block', 'ocean', { all: f('blobs', ramp(c[1], 4, .2)) });
    add(c[0] + '_coral', 'ocean', { shape: 'cross', alpha: 'cutout', front: f('plant', [c[1], shade(c[1], 1.3)], { kind: 'sapling', stem: shade(c[1], .8) }) });
    add(c[0] + '_coral_fan', 'ocean', { shape: 'flat', alpha: 'cutout', top: f('vine', [c[1]]) });
    add('dead_' + c[0] + '_coral_block', 'ocean', { all: f('blobs', ramp('#8b8378', 4, .18)) });
  });
  add('sea_lantern', 'light', { all: f('prismarine', ['#c8e8e0', '#a8d8d0', '#e8f8f0']), glow: 1 });
  add('conduit', 'light', { shape: 'skull', glow: .9, all: f('chiseled', ramp('#d8c8a0', 3, .2)) });
  add('bubble_column', 'ocean', { all: f('water', ['#3a6fd0']), alpha: 'blend' });
  add('water', 'ocean', { all: f('water', ['#3f76e4']), alpha: 'blend' });
  add('lava', 'nether', { all: f('lava', ['#c02a08', '#e86a12', '#ffd24a']), glow: 1 });

  /* ========================================================== nether & end */

  add('glowstone', 'light', { all: f('glow', ['#a5824a', '#ffe08a']), glow: 1 });
  add('ochre_froglight', 'light', { side: f('pillar', ramp('#e8dfa8', 3, .1)), top: f('rings', ramp('#e8dfa8', 3, .12)), glow: 1 });
  add('verdant_froglight', 'light', { side: f('pillar', ramp('#c8e8b8', 3, .1)), top: f('rings', ramp('#c8e8b8', 3, .12)), glow: 1 });
  add('pearlescent_froglight', 'light', { side: f('pillar', ramp('#f0d8e8', 3, .1)), top: f('rings', ramp('#f0d8e8', 3, .12)), glow: 1 });
  add('end_rod', 'light', { shape: 'rod', glow: .9, all: f('pillar', ramp('#f2eee6', 3, .08)) });
  add('chorus_flower', 'end', { all: f('noise', ['#a08aa0', '#c8b0c8', '#8a7a8a']) });
  add('chorus_plant', 'end', { all: f('noise', ['#5a3f5a', '#6f4f6f', '#4a334a']) });
  add('dragon_egg', 'end', { shape: 'skull', all: f('obsidian', ['#0d0912', '#3b1d5c']), glow: .2 });
  add('end_portal_frame', 'end', { shape: 'slab', top: f('crystal', ['#3ec7a2']), side: f('noise', ramp('#c8cf8e', 3, .14)), bottom: f('noise', ramp('#c8cf8e', 3, .14)), glow: .3 });
  add('nether_portal', 'nether', { shape: 'pane', all: f('crystal', ['#8a2fd0']), alpha: 'blend', glow: .8 });
  add('respawn_anchor', 'nether', { top: f('circuit', ['#2b2338', '#6f3ad0']), side: f('noise', ramp('#241d2f', 3, .3)), glow: .5 });
  add('lodestone', 'utility', { top: f('circuit', ['#8a8a8f', '#3f3f45']), side: f('pillar', ramp('#8a8a8f', 3, .14)) });
  add('soul_torch', 'light', { shape: 'torch', glow: .8, side: f('bark', ramp('#6b5033', 3, .18)), top: f('glow', ['#2aa8c8', '#8ff0ff']) });
  add('torch', 'light', { shape: 'torch', glow: .85, side: f('bark', ramp('#6b5033', 3, .18)), top: f('glow', ['#e0a02a', '#ffe08a']) });
  add('redstone_torch', 'redstone', { shape: 'torch', glow: .6, side: f('bark', ramp('#6b5033', 3, .18)), top: f('glow', ['#c02a20', '#ff7a6a']) });
  add('lantern', 'light', { shape: 'lantern', glow: .95, all: f('metal', ['#c8a24a']) });
  add('soul_lantern', 'light', { shape: 'lantern', glow: .85, all: f('metal', ['#4aa8c0']) });
  add('chain', 'decoration', { shape: 'chain', alpha: 'cutout', all: f('metal', ['#6f7078']) });
  add('campfire', 'light', { shape: 'campfire', glow: .7, top: f('lava', ['#8a3a12', '#e06a12', '#ffd24a']), side: f('bark', ramp('#6b5033', 3, .18)), bottom: f('noise', ramp('#3a3a3a', 3, .2)) });
  add('soul_campfire', 'light', { shape: 'campfire', glow: .7, top: f('lava', ['#12708a', '#2aa8c8', '#8ff0ff']), side: f('bark', ramp('#6b5033', 3, .18)), bottom: f('noise', ramp('#3a3a3a', 3, .2)) });

  /* ============================================================== utility */

  var OAK = ramp('#b8945f', 4, .13);

  add('crafting_table', 'utility', { top: f('crafting_top', OAK), front: f('crafting_front', OAK), side: f('planks', ramp('#8a6a3f', 4, .12)), bottom: f('planks', OAK) });
  add('furnace', 'utility', { front: f('furnace_front', ramp('#6f6f6f', 3, .14)), side: f('noise', ramp('#6f6f6f', 3, .14)), top: f('noise', ramp('#7a7a7a', 3, .12)) });
  add('blast_furnace', 'utility', { front: f('furnace_lit', ramp('#5a5a5a', 3, .14)), side: f('noise', ramp('#5f5f5f', 3, .14)), top: f('smooth', '#6a6a6a'), glow: .25 });
  add('smoker', 'utility', { front: f('furnace_lit', ramp('#6b5033', 3, .2)), side: f('bark', ramp('#6b5033', 3, .2)), top: f('rings', ramp('#8a6a3f', 3, .16)), glow: .25 });
  add('chest', 'utility', { shape: 'chest', top: f('planks', OAK), side: f('planks', ramp('#8a6a3f', 4, .12)), front: f('chest_front', OAK), lock: f('metal', ['#8a8a8a']) });
  add('trapped_chest', 'utility', { shape: 'chest', top: f('planks', OAK), side: f('planks', ramp('#8a6a3f', 4, .12)), front: f('chest_front', OAK), lock: f('metal', ['#c04a3a']) });
  add('ender_chest', 'utility', { shape: 'chest', top: f('obsidian', ['#12102a', '#2f8f8a']), side: f('obsidian', ['#0e0c22', '#2f8f8a']), front: f('obsidian', ['#12102a', '#4ae0d8']), lock: f('metal', ['#3ee0d8']), glow: .3 });
  add('barrel', 'utility', { top: f('crafting_top', ramp('#8a6a3f', 4, .12)), side: f('planks', ramp('#7a5a35', 4, .14)), bottom: f('planks', ramp('#7a5a35', 4, .14)) });
  add('bookshelf', 'utility', { side: f('bookshelf', OAK), top: f('planks', OAK), bottom: f('planks', OAK) });
  add('chiseled_bookshelf', 'utility', { side: f('bookshelf', ramp('#8a6a3f', 4, .12)), top: f('planks', OAK), bottom: f('planks', OAK) });
  add('lectern', 'utility', { shape: 'sign', top: f('planks', OAK), side: f('planks', ramp('#8a6a3f', 4, .12)) });
  add('cauldron', 'utility', { shape: 'cauldron', all: f('metal', ['#4a4a52']) });
  add('anvil', 'utility', { shape: 'anvil', top: f('metal', ['#5a5a5f']), side: f('metal', ['#484850']) });
  add('chipped_anvil', 'utility', { shape: 'anvil', top: f('blobs', ['#5a5a5f', '#4a4a50', '#6a6a70']), side: f('metal', ['#484850']) });
  add('damaged_anvil', 'utility', { shape: 'anvil', top: f('blobs', ['#4a4a50', '#3a3a40', '#5a5a60']), side: f('metal', ['#3f3f46']) });
  add('grindstone', 'utility', { shape: 'sign', top: f('noise', ramp('#8a8a8a', 3, .16)), side: f('planks', OAK) });
  add('smithing_table', 'utility', { top: f('crafting_top', ramp('#3a3a42', 3, .2)), side: f('planks', ramp('#33333a', 3, .2)), front: f('crafting_front', ramp('#33333a', 3, .2)) });
  add('fletching_table', 'utility', { top: f('crafting_top', ramp('#d7cb8d', 3, .12)), side: f('planks', ramp('#c8bc80', 3, .12)), front: f('crafting_front', ramp('#c8bc80', 3, .12)) });
  add('cartography_table', 'utility', { top: f('crafting_top', ramp('#7a5a35', 3, .14)), side: f('planks', ramp('#6a4d2d', 3, .14)), front: f('crafting_front', ramp('#6a4d2d', 3, .14)) });
  add('loom', 'utility', { top: f('crafting_top', ramp('#c8b48a', 3, .12)), side: f('planks', ramp('#8a6a3f', 3, .14)), front: f('crafting_front', ramp('#b8945f', 3, .14)) });
  add('stonecutter', 'utility', { shape: 'slab', top: f('tiles', ramp('#8a8a8a', 3, .14)), side: f('noise', ramp('#7a7a7a', 3, .14)) });
  add('composter', 'utility', { shape: 'cauldron', all: f('planks', ramp('#8a6a3f', 4, .14)) });
  add('beehive', 'utility', { top: f('planks', ramp('#c8a24a', 3, .12)), side: f('honeycomb', ['#c8a24a']), front: f('honeycomb', ['#b8923a']) });
  add('bee_nest', 'utility', { top: f('rings', ramp('#c8a24a', 3, .14)), side: f('honeycomb', ['#d8b25a']), front: f('honeycomb', ['#c8a24a']) });
  add('honeycomb_block', 'utility', { all: f('honeycomb', ['#e0a83a']) });
  add('jukebox', 'utility', { top: f('crafting_top', ramp('#6a4d2d', 3, .14)), side: f('planks', ramp('#5a3f24', 3, .14)) });
  add('note_block', 'redstone', { all: f('planks', ramp('#6a4d2d', 4, .12)) });
  add('enchanting_table', 'utility', { shape: 'slab', top: f('circuit', ['#2b2338', '#c8302a']), side: f('obsidian', ['#12102a', '#3b1d5c']), glow: .25 });
  add('brewing_stand', 'utility', { shape: 'rod', alpha: 'cutout', all: f('metal', ['#8a8a8a']) });
  add('spawner', 'utility', { all: f('spawner', ['#2b3a44']), alpha: 'cutout' });
  add('trial_spawner', 'utility', { all: f('spawner', ['#3a4a58']), alpha: 'cutout', glow: .2 });
  add('vault', 'utility', { all: f('circuit', ['#3a4a58', '#e0c83a']), glow: .3 });
  add('beacon', 'light', { all: f('beacon', ['#1f2b2f']), glow: 1 });
  add('decorated_pot', 'decoration', { shape: 'pot', all: f('chiseled', ramp('#96604a', 3, .16)) });
  add('flower_pot', 'decoration', { shape: 'pot', all: f('noise', ramp('#96604a', 3, .16)) });
  add('cake', 'decoration', { shape: 'cake', top: f('cake', ['#f0e3d0']), side: f('cake', ['#e8dcc8']), bottom: f('solid', '#e0d4c0') });
  add('hay_block', 'nature', { side: f('hay', ramp('#c8a233', 3, .14)), top: f('rings', ramp('#c8a233', 3, .16)) });
  add('dried_kelp_block', 'ocean', { all: f('noise', ['#2f3a2a', '#3a4a33', '#26301f']) });
  add('pumpkin', 'nature', { side: f('pumpkin_side', ['#c07615']), top: f('rings', ramp('#c07615', 3, .14)) });
  add('carved_pumpkin', 'nature', { front: f('pumpkin_face', ['#c07615']), side: f('pumpkin_side', ['#c07615']), top: f('rings', ramp('#c07615', 3, .14)) });
  add('jack_o_lantern', 'light', { name: "Jack o'Lantern", front: f('pumpkin_face', ['#c07615'], { lit: true }), side: f('pumpkin_side', ['#c07615']), top: f('rings', ramp('#c07615', 3, .14)), glow: .85 });
  add('melon', 'nature', { side: f('melon_side', ['#7ba52f', '#4f7a24']), top: f('melon_side', ['#8fbf3a', '#5f8a2a']) });
  add('tnt', 'redstone', { name: 'TNT', side: f('tnt_side', ['#c03a30']), top: f('tnt_top', ['#c03a30']), bottom: f('tnt_top', ['#8a2a22']) });
  add('target', 'redstone', { all: f('target', ['#e8e0d0', '#c94b3f']) });
  add('scaffolding', 'utility', { shape: 'scaffold', all: f('planks', ramp('#c8ab4f', 3, .12)), alpha: 'cutout' });
  add('ladder', 'utility', { shape: 'ladder', alpha: 'cutout', front: f('ladder', ['#b8945f']) });

  /* ============================================================= redstone */

  add('redstone_lamp', 'light', { all: f('circuit', ['#8a5a2a', '#ffd98a']), glow: .9 });
  add('piston', 'redstone', { top: f('planks', ramp('#c8b48a', 3, .1)), side: f('metal', ['#8a8a8a']), bottom: f('metal', ['#7a7a7a']) });
  add('sticky_piston', 'redstone', { top: f('moss', '#8aa84a'), side: f('metal', ['#8a8a8a']), bottom: f('metal', ['#7a7a7a']) });
  add('observer', 'redstone', { front: f('circuit', ['#6f6f6f', '#c94b3f']), side: f('pillar', ramp('#6f6f6f', 3, .12)), top: f('pillar', ramp('#6f6f6f', 3, .12)) });
  add('dispenser', 'redstone', { front: f('furnace_front', ramp('#6f6f6f', 3, .14)), side: f('noise', ramp('#6f6f6f', 3, .14)), top: f('noise', ramp('#7a7a7a', 3, .12)) });
  add('dropper', 'redstone', { front: f('furnace_front', ramp('#6f6f6f', 3, .14)), side: f('noise', ramp('#6f6f6f', 3, .14)), top: f('noise', ramp('#7a7a7a', 3, .12)) });
  add('hopper', 'redstone', { shape: 'hopper', all: f('metal', ['#4a4a52']) });
  add('repeater', 'redstone', { shape: 'plate', top: f('circuit', ['#b0b0b0', '#c94b3f']), side: f('smooth', '#a8a8a8') });
  add('comparator', 'redstone', { shape: 'plate', top: f('circuit', ['#b8b8b8', '#8a2a20']), side: f('smooth', '#a8a8a8') });
  add('daylight_detector', 'redstone', { shape: 'slab', top: f('glass', ['#3ec7ff'], { a: 190 }), side: f('planks', OAK), alpha: 'blend' });
  add('lever', 'redstone', { shape: 'button', all: f('noise', ramp('#7a7a7a', 3, .16)) });
  add('lightning_rod', 'redstone', { shape: 'rod', all: f('copper', ['#c06a3c', '#a05a32']) });
  add('tripwire_hook', 'redstone', { shape: 'button', all: f('metal', ['#8a8a8a']) });

  [['rail', '#8a8a8a'], ['powered_rail', '#c8a22a'], ['detector_rail', '#a0a0a0'], ['activator_rail', '#7a5a5a']].forEach(function (r) {
    add(r[0], 'redstone', { shape: 'flat', alpha: 'cutout', top: f('rail', [r[1], '#6b4f33']) });
  });

  /* =========================================================== decoration */

  ['skeleton_skull', 'wither_skeleton_skull', 'zombie_head', 'creeper_head', 'piglin_head', 'dragon_head', 'player_head'].forEach(function (id) {
    var c = { skeleton_skull: '#c8c8c0', wither_skeleton_skull: '#3a3a3a', zombie_head: '#4f8a4f', creeper_head: '#5aa85a', piglin_head: '#e0a08a', dragon_head: '#2a2230', player_head: '#b8916a' }[id];
    add(id, 'decoration', { shape: 'skull', all: f('noise', ramp(c, 3, .14)) });
  });

  add('armor_stand', 'decoration', { shape: 'sign', all: f('planks', OAK) });
  add('end_crystal', 'end', { shape: 'skull', glow: .8, all: f('crystal', ['#d264c8']) });
  add('command_block', 'utility', { all: f('circuit', ['#b8865a', '#8a5a2a']) });
  add('chain_command_block', 'utility', { all: f('circuit', ['#5a8a6a', '#2a5a3a']) });
  add('repeating_command_block', 'utility', { all: f('circuit', ['#7a6aa8', '#4a3a8a']) });
  add('structure_block', 'utility', { all: f('circuit', ['#5a4a5a', '#8a7a9a']) });
  add('jigsaw', 'utility', { all: f('circuit', ['#4a4050', '#8a7a9a']) });
  add('barrier', 'utility', { all: f('glass', ['#d03a3a'], { a: 60 }), alpha: 'blend' });
  add('light_block', 'light', { all: f('glass', ['#ffe08a'], { a: 70 }), alpha: 'blend', glow: .9 });
})();
