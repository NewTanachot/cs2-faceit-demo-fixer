/*!
 * CS2 Demo Fixer - input pipeline: read file -> decompress (.zst / .gz) -> repair -> Blob.
 * Used by worker.js, and on the main thread when workers are unavailable.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./demofix.js'), require('./vendor/fzstd.js'));
  else root.Pipeline = factory(root.DemoFix, root.fzstd);
}(typeof self !== 'undefined' ? self : this, function (DemoFix, fzstd) {
  'use strict';

  function fail(code, message) {
    var e = new Error(message || code);
    e.code = code;
    return e;
  }

  function concatChunks(chunks, total) {
    var out = new Uint8Array(total), o = 0;
    for (var i = 0; i < chunks.length; i++) { out.set(chunks[i], o); o += chunks[i].length; }
    return out;
  }

  async function readAll(file, onProgress) {
    var total = file.size;
    if (!file.stream) {
      var whole = new Uint8Array(await file.arrayBuffer());
      onProgress(1);
      return whole;
    }
    var out = new Uint8Array(total), off = 0, reader = file.stream().getReader();
    for (;;) {
      var r = await reader.read();
      if (r.done) break;
      if (off + r.value.length > total) throw fail('CORRUPT', 'File changed while reading');
      out.set(r.value, off);
      off += r.value.length;
      onProgress(total ? off / total : 1);
    }
    return off === total ? out : out.subarray(0, off);
  }

  function unzstd(u8, onProgress) {
    var size = DemoFix.zstdContentSize(u8);
    var out = size ? new Uint8Array(size) : null, off = 0, chunks = null;
    var dec = new fzstd.Decompress(function (chunk) {
      if (out && off + chunk.length <= out.length) out.set(chunk, off);
      else {
        if (!chunks) { chunks = out ? [out.subarray(0, off)] : []; out = null; }
        chunks.push(chunk.slice());
      }
      off += chunk.length;
    });
    var CH = 4 << 20;
    try {
      for (var i = 0; i < u8.length; i += CH) {
        var end = Math.min(i + CH, u8.length);
        dec.push(u8.subarray(i, end), end >= u8.length);
        onProgress(end / u8.length);
      }
    } catch (e) {
      throw fail('CORRUPT', 'zstd: ' + (e && e.message || e));
    }
    if (chunks) return concatChunks(chunks, off);
    if (off !== out.length) throw fail('TRUNCATED', 'Compressed file is incomplete');
    return out;
  }

  async function gunzip(raw, onProgress) {
    if (typeof DecompressionStream === 'undefined') throw fail('GZIP');
    var reader = new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    var chunks = [], total = 0;
    try {
      for (;;) {
        var r = await reader.read();
        if (r.done) break;
        chunks.push(r.value);
        total += r.value.length;
        onProgress(0.5);
      }
    } catch (e) {
      throw fail('CORRUPT', 'gzip: ' + (e && e.message || e));
    }
    onProgress(1);
    return concatChunks(chunks, total);
  }

  // onProgress(stage, fraction) - stages: read, decompress, index, scan, fix, write, save
  async function processFile(file, onProgress) {
    onProgress = onProgress || function () {};
    var head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    var fmt = DemoFix.detectFormat(head);
    if (fmt === 'bz2') throw fail('BZ2');
    if (fmt === 'csgo') throw fail('CSGO_DEMO');
    if (fmt === 'unknown') throw fail('NOT_DEMO');

    var raw = await readAll(file, function (f) { onProgress('read', f); });
    var u8 = raw;
    if (fmt === 'zst') { onProgress('decompress', 0); u8 = unzstd(raw, function (f) { onProgress('decompress', f); }); }
    else if (fmt === 'gz') { onProgress('decompress', 0); u8 = await gunzip(raw, function (f) { onProgress('decompress', f); }); }
    raw = null;

    var inner = DemoFix.detectFormat(u8);
    if (inner === 'csgo') throw fail('CSGO_DEMO');
    if (inner !== 'dem') throw fail('NOT_DEMO');

    var res = DemoFix.fixDemo(u8, { onProgress: onProgress });
    onProgress('save', 0);
    var blob = null;
    if (res.changed) blob = new Blob(res.parts, { type: 'application/octet-stream' });
    else if (fmt !== 'dem') blob = new Blob([u8], { type: 'application/octet-stream' });
    onProgress('save', 1);
    return { changed: res.changed, report: res.report, blob: blob, inputFormat: fmt };
  }

  function errorCode(err) {
    if (err && typeof err.code === 'string') return err.code;
    if (err && typeof err.code === 'number') return 'CORRUPT';   // fzstd error codes
    if (err instanceof RangeError || (err && err.name === 'NotReadableError')) return 'MEMORY';
    return 'UNKNOWN';
  }

  return { processFile: processFile, errorCode: errorCode };
}));
