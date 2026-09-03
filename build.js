#!/usr/bin/env node
/* Bundle the site into a single self-contained HTML file at dist/index.html.
   The site has no dependencies, so "building" is just inlining the CSS, the
   scripts and the favicon. Run with: node build.js */
'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

// <link rel="stylesheet" href="..."> -> <style>
html = html.replace(/[ \t]*<link rel="stylesheet" href="([^"]+)">\n?/g, (_, href) =>
  '<style>\n' + read(href).trim() + '\n</style>\n');

// <script src="..."> -> <script>
html = html.replace(/[ \t]*<script src="([^"]+)"><\/script>\n?/g, (_, src) =>
  '<script>\n' + read(src).trim() + '\n</script>\n');

// favicon -> data URI
html = html.replace(/href="assets\/favicon\.svg"/g,
  'href="data:image/svg+xml;base64,' + Buffer.from(read('assets/favicon.svg')).toString('base64') + '"');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`dist/index.html written (${kb} kB, no external requests)`);

/* dist/artifact.html: the same bundle as a document *fragment* (title, styles,
   body content, scripts) for hosts that supply their own page skeleton. */
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
const keep = '<title>Blockdex</title>\n' + head.match(/<style>[\s\S]*?<\/style>/)[0];
fs.writeFileSync(path.join(root, 'dist/artifact.html'), keep + '\n' + body.trim() + '\n');
console.log('dist/artifact.html written (fragment build)');
