#!/usr/bin/env node
/*
 * CS2 Demo Fixer - command line version (same code as the website).
 * Usage: node cli.js <demo.dem | demo.dem.zst | demo.dem.gz> [output.dem]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const fzstd = require('./vendor/fzstd.js');
const DemoFix = require('./demofix.js');

const [input, outputArg] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node cli.js <demo.dem | demo.dem.zst | demo.dem.gz> [output.dem]');
  process.exit(2);
}

let data = new Uint8Array(fs.readFileSync(input));
const format = DemoFix.detectFormat(data);
if (format === 'zst') data = fzstd.decompress(data);
else if (format === 'gz') data = new Uint8Array(zlib.gunzipSync(data));
else if (format !== 'dem') {
  console.error(format === 'csgo' ? 'This is a CS:GO demo, not CS2.' : 'Not a CS2 demo: ' + input);
  process.exit(1);
}

const result = DemoFix.fixDemo(data);
const r = result.report;
console.log('Map: %s, protocol %s', r.header.map, r.header.protocol);
if (!result.changed) {
  console.log('No known problem found - nothing to fix.');
  process.exit(0);
}
if (r.crashFix.applied) {
  r.crashFix.tables.forEach((t) => {
    t.added.forEach((a) => console.log('Crash fix: moved %s baseline (%s[%d]) from tick %d into the signon table', a.className || a.key, t.name, a.index, r.crashFix.firstPacketTick));
    if (t.duplicatesRemoved) console.log('Crash fix: removed %d duplicate %s update(s)', t.duplicatesRemoved, t.name);
  });
}
r.textFix.items.forEach((i) => console.log('Text fix: tick %d %s.%s [%s] -> %j', i.tick, i.event, i.key, i.before, i.after));
r.warnings.forEach((w) => console.log('Warning: ' + w));

const base = path.basename(input).replace(/\.(zst|gz)$/i, '').replace(/[._]dem$/i, '');
const output = outputArg || path.join(path.dirname(input), base + '-fixed.dem');
const fd = fs.openSync(output, 'w');
for (const part of result.parts) fs.writeSync(fd, part);
fs.closeSync(fd);
console.log('Wrote %s (%d bytes)', output, result.size);
