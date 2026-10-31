/* CS2 Demo Fixer - page logic */
(function () {
  'use strict';

  // Page text lives in index.html (English) and th.html (Thai); these are the messages built while files are processed.
  var STRINGS = {
    th: {
      minutes: '{n} นาที',
      progressLabel: 'ความคืบหน้า',
      st_queued: 'รอคิว',
      st_read: 'กำลังอ่านไฟล์',
      st_decompress: 'กำลังแตกไฟล์',
      st_index: 'กำลังตรวจ demo',
      st_scan: 'กำลังตรวจ demo',
      st_fix: 'กำลังแก้',
      st_write: 'กำลังสร้างไฟล์ใหม่',
      st_save: 'กำลังสร้างไฟล์ใหม่',
      st_fixed: 'แก้แล้ว',
      st_clean: 'ไม่ต้องแก้',
      st_error: 'แก้ไม่ได้',
      chickens: 'ไก่',
      noteCrash: 'แก้จุดที่ทำให้เกมเด้งตอนเริ่มแล้ว: ย้ายข้อมูลตั้งต้นของ {what} จาก tick แรกไปโหลดพร้อม demo',
      noteText: 'แก้ข้อความเสีย {n} จุดใน event ของเกม',
      noteSkipped: 'เจอรูปแบบที่ทำให้เกมเด้ง แต่แก้อัตโนมัติไม่ได้ ({detail})',
      noteClean: 'ไม่พบปัญหาที่ tool นี้รู้จัก demo นี้น่าจะเปิดได้ตามปกติ ถ้ายังเด้ง สาเหตุน่าจะเป็นอย่างอื่น',
      noteCleanRaw: 'ใช้ไฟล์เดิมเปิดในเกมได้เลย',
      download: 'ดาวน์โหลดไฟล์ที่แก้แล้ว',
      downloadPlain: 'ดาวน์โหลด .dem ที่แตกไฟล์แล้ว',
      cmdLabel: 'พิมพ์ใน console',
      copy: 'คัดลอก',
      copied: 'คัดลอกแล้ว',
      tally: 'แก้ demo ให้ทุกคนไปแล้ว {count} ไฟล์',
      announceFixed: '{name}: แก้แล้ว',
      announceClean: '{name}: ไม่ต้องแก้',
      announceError: '{name}: แก้ไม่ได้',
      err_CSGO_DEMO: 'ไฟล์นี้เป็น demo ของ CS:GO ไม่ใช่ CS2',
      err_NOT_DEMO: 'ไฟล์นี้ไม่ใช่ demo ของ CS2 เลือกไฟล์ .dem, .dem.zst หรือ .dem.gz',
      err_TRUNCATED: 'ไฟล์ไม่ครบ น่าจะดาวน์โหลดมาไม่จบ ลองดาวน์โหลดใหม่',
      err_CORRUPT: 'ไฟล์เสีย หรือดาวน์โหลดมาไม่ครบ ลองดาวน์โหลดใหม่',
      err_BZ2: 'ยังไม่รองรับไฟล์ .bz2 แตกไฟล์ก่อน แล้วลากไฟล์ .dem มาแทน',
      err_GZIP: 'เบราว์เซอร์นี้แตกไฟล์ .gz ไม่ได้ แตกไฟล์ก่อน แล้วลากไฟล์ .dem มาแทน',
      err_MEMORY: 'หน่วยความจำไม่พอ ปิดแท็บอื่นแล้วลองใหม่',
      err_FORMAT: 'โครงสร้างไฟล์ไม่ตรงกับที่ tool นี้รู้จัก ({msg})',
      err_UNKNOWN: 'แก้ไม่ได้: {msg}'
    },
    en: {
      minutes: '{n} min',
      progressLabel: 'Progress',
      st_queued: 'Waiting',
      st_read: 'Reading file',
      st_decompress: 'Decompressing',
      st_index: 'Checking the demo',
      st_scan: 'Checking the demo',
      st_fix: 'Repairing',
      st_write: 'Building the new file',
      st_save: 'Building the new file',
      st_fixed: 'Repaired',
      st_clean: 'No repair needed',
      st_error: 'Couldn’t repair',
      chickens: 'chickens',
      noteCrash: 'Fixed the crash at playback start: the baseline for {what} now loads with the demo instead of arriving at tick 1.',
      noteText: function (v) { return v.n === 1 ? 'Repaired 1 broken text field in a game event.' : 'Repaired ' + v.n + ' broken text fields in game events.'; },
      noteSkipped: 'Found the crash pattern but couldn’t repair it automatically ({detail}).',
      noteClean: 'No known problem found. This demo should play as it is. If it still crashes, the cause is something else.',
      noteCleanRaw: 'You can play the original file.',
      download: 'Download repaired file',
      downloadPlain: 'Download the extracted .dem',
      cmdLabel: 'Type in the console',
      copy: 'Copy',
      copied: 'Copied',
      tally: function (v) { return v.n === 1 ? '1 demo repaired so far' : v.count + ' demos repaired so far'; },
      announceFixed: '{name}: repaired',
      announceClean: '{name}: no repair needed',
      announceError: '{name}: couldn’t repair',
      err_CSGO_DEMO: 'This is a CS:GO demo, not a CS2 demo.',
      err_NOT_DEMO: 'This isn’t a CS2 demo. Choose a .dem, .dem.zst or .dem.gz file.',
      err_TRUNCATED: 'The file is incomplete, probably a cut-off download. Download it again.',
      err_CORRUPT: 'The file is damaged or incomplete. Download it again.',
      err_BZ2: '.bz2 files aren’t supported. Extract it first and drop the .dem instead.',
      err_GZIP: 'This browser can’t extract .gz files. Extract it first and drop the .dem instead.',
      err_MEMORY: 'Not enough memory. Close other tabs and try again.',
      err_FORMAT: 'The file’s structure isn’t what this tool expects ({msg}).',
      err_UNKNOWN: 'Couldn’t repair: {msg}'
    }
  };
  var FORMAT_CODES = ['BAD_PROTOBUF', 'BAD_SNAPPY', 'BAD_BITSTREAM', 'BAD_PACKET', 'INTERNAL'];

  // ------------------------------------------------------------ language
  // Each language has its own page. The choice is saved so index.html can send Thai readers to th.html.
  function saveLang(l) { try { localStorage.setItem('cs2-demo-fixer-lang', l); } catch (e) { /* storage unavailable */ } }
  var lang = document.documentElement.lang === 'th' ? 'th' : 'en';

  function t(key, vars) {
    var s = STRINGS[lang][key];
    if (s == null) s = STRINGS.en[key];
    if (s == null) return key;
    if (typeof s === 'function') return s(vars || {});
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? String(vars[k]) : ''; });
  }

  // ------------------------------------------------------------ helpers
  function q(root, sel) { return root.querySelector(sel); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function formatSize(bytes) {
    var mb = bytes / 1048576;
    if (mb >= 10) return Math.round(mb) + ' MB';
    if (mb >= 1) return mb.toFixed(1) + ' MB';
    return Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }
  function baseName(name) {
    var b = name.replace(/\.(zst|gz|bz2)$/i, '').replace(/[._]dem$/i, '').replace(/\s+/g, '_');
    return b || 'demo';
  }
  function fixedName(name) { return baseName(name) + '-fixed.dem'; }
  function plainName(name) { return baseName(name) + '.dem'; }

  var announcer = el('p', 'visually-hidden');
  announcer.setAttribute('aria-live', 'polite');
  document.body.appendChild(announcer);
  function announce(text) { announcer.textContent = ''; setTimeout(function () { announcer.textContent = text; }, 50); }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { if (document.execCommand('copy')) resolve(); else reject(new Error('copy failed')); }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  // ------------------------------------------------------------ jobs
  var jobs = [], queue = [], running = null, nextId = 1;
  var jobsEl = document.getElementById('jobs');
  var template = document.getElementById('job-template');
  var STAGES = ['read', 'decompress', 'index', 'scan', 'fix', 'write', 'save'];
  var WEIGHTS = { read: 0.12, decompress: 0.28, index: 0.05, scan: 0.40, fix: 0.03, write: 0.07, save: 0.05 };

  function overall(stage, f) {
    var base = 0;
    for (var i = 0; i < STAGES.length && STAGES[i] !== stage; i++) base += WEIGHTS[STAGES[i]];
    return Math.min(1, base + (WEIGHTS[stage] || 0) * (f == null ? 0.5 : f));
  }

  function addFiles(list) {
    var first = null;
    Array.prototype.forEach.call(list, function (file) {
      var job = { id: nextId++, file: file, status: 'queued', stage: null, progress: 0, report: null,
        blob: null, url: null, outName: null, error: null, inputFormat: null, copied: false };
      job.el = template.content.firstElementChild.cloneNode(true);
      q(job.el, '.job-copy').addEventListener('click', function () {
        copyText(q(job.el, '.job-command-text').textContent).then(function () {
          job.copied = true; renderJob(job);
          setTimeout(function () { job.copied = false; renderJob(job); }, 1600);
        }, function () { /* clipboard blocked: the command stays visible to copy by hand */ });
      });
      jobsEl.appendChild(job.el);
      jobs.push(job);
      queue.push(job);
      renderJob(job);
      first = first || job;
    });
    if (first) {
      jobsEl.hidden = false;
      first.el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }
    pump();
  }

  function noteItems(job) {
    var items = [], r = job.report;
    if (job.status === 'error') {
      var code = job.error.code, key = FORMAT_CODES.indexOf(code) >= 0 ? 'err_FORMAT' : 'err_' + code;
      if (STRINGS.en[key] == null) key = 'err_UNKNOWN';
      items.push(el('li', 'is-warning', t(key, { msg: job.error.message })));
      return items;
    }
    if (!r) return items;
    if (r.crashFix.applied) {
      var what = [];
      r.crashFix.tables.forEach(function (tb) {
        if (tb.name !== 'instancebaseline') return;
        tb.added.forEach(function (a) {
          var n = a.className || ('#' + a.key);
          what.push(a.className === 'CChicken' ? n + ' (' + t('chickens') + ')' : n);
        });
      });
      if (!what.length) what.push('instancebaseline');
      items.push(el('li', null, t('noteCrash', { what: what.join(', ') })));
    } else if (r.crashFix.needed) {
      items.push(el('li', 'is-warning', t('noteSkipped', { detail: r.warnings.join('; ') })));
    }
    if (r.textFix.items.length) items.push(el('li', null, t('noteText', { n: r.textFix.items.length })));
    if (job.status === 'clean') {
      items.push(el('li', null, t('noteClean')));
      if (job.inputFormat === 'dem') items.push(el('li', null, t('noteCleanRaw')));
    }
    return items;
  }

  function renderJob(job) {
    var root = job.el, r = job.report;
    root.className = 'job' + ({ fixed: ' is-fixed', clean: ' is-clean', error: ' is-error' }[job.status] || '');
    q(root, '.job-name').textContent = job.file.name;

    var meta = q(root, '.job-meta');
    meta.textContent = '';
    if (r && r.header && r.header.map) meta.appendChild(el('span', null, r.header.map));
    if (r && r.header && r.header.seconds) meta.appendChild(el('span', null, t('minutes', { n: Math.round(r.header.seconds / 60) })));
    meta.appendChild(el('span', null, formatSize(job.file.size)));

    var pct = Math.round(job.progress * 100);
    var tl = q(root, '.timeline');
    tl.style.setProperty('--p', pct + '%');
    tl.setAttribute('aria-valuenow', String(pct));
    tl.setAttribute('aria-label', t('progressLabel'));

    var status = job.status === 'working' ? t('st_' + job.stage) + ' ' + pct + '%' : t('st_' + job.status);
    q(root, '.job-status').textContent = status;

    var notes = q(root, '.job-notes');
    notes.textContent = '';
    noteItems(job).forEach(function (li) { notes.appendChild(li); });

    var result = q(root, '.job-result');
    if (job.url) {
      result.hidden = false;
      var a = q(root, '.job-download');
      a.className = 'btn job-download ' + (job.status === 'fixed' ? 'btn-primary' : 'btn-quiet');
      a.href = job.url;
      a.download = job.outName;
      a.textContent = job.status === 'fixed' ? t('download') : t('downloadPlain');
      q(root, '.job-file').textContent = job.outName + ' (' + formatSize(job.blob.size) + ')';
    } else result.hidden = true;

    var cmdName = null;
    if (job.outName) cmdName = job.outName.replace(/\.dem$/i, '');
    else if (job.status === 'clean' && job.inputFormat === 'dem') cmdName = baseName(job.file.name);
    var cmd = q(root, '.job-command');
    if (cmdName) {
      cmd.hidden = false;
      q(root, '.job-command-label').textContent = t('cmdLabel');
      q(root, '.job-command-text').textContent = 'playdemo ' + cmdName;
      q(root, '.job-copy').textContent = job.copied ? t('copied') : t('copy');
    } else cmd.hidden = true;
  }

  // ------------------------------------------------------------ processing
  var worker = null, workerUsable = typeof Worker !== 'undefined';

  function getWorker() {
    if (!workerUsable) return null;
    if (worker) return worker;
    try { worker = new Worker('worker.js'); }
    catch (e) { workerUsable = false; return null; }
    worker.onmessage = function (e) {
      var d = e.data, job = null;
      for (var i = 0; i < jobs.length; i++) if (jobs[i].id === d.id) job = jobs[i];
      if (!job) return;
      if (d.type === 'progress') onProgress(job, d.stage, d.fraction);
      else if (d.type === 'done') finish(job, d);
      else if (d.type === 'error') fail(job, d.code, d.message);
    };
    worker.onerror = function (ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
      try { worker.terminate(); } catch (e) { /* already gone */ }
      worker = null;
      workerUsable = false;
      if (running) runInPage(running);   // e.g. opened from file:// - retry on this thread
    };
    return worker;
  }

  function pump() {
    if (running || !queue.length) return;
    running = queue.shift();
    running.status = 'working';
    running.stage = 'read';
    renderJob(running);
    var w = getWorker();
    if (w) w.postMessage({ type: 'process', id: running.id, file: running.file });
    else runInPage(running);
  }

  function runInPage(job) {
    setTimeout(function () {
      Pipeline.processFile(job.file, function (stage, f) { onProgress(job, stage, f); }).then(
        function (res) { finish(job, res); },
        function (err) { fail(job, Pipeline.errorCode(err), String((err && err.message) || err)); });
    }, 30);
  }

  function onProgress(job, stage, f) {
    if (job.status !== 'working') return;
    job.stage = stage;
    job.progress = Math.max(job.progress, overall(stage, f));
    renderJob(job);
  }

  function finish(job, res) {
    job.report = res.report;
    job.inputFormat = res.inputFormat;
    job.status = res.changed ? 'fixed' : 'clean';
    job.progress = 1;
    if (res.blob) {
      job.blob = res.blob;
      job.url = URL.createObjectURL(res.blob);
      job.outName = res.changed ? fixedName(job.file.name) : plainName(job.file.name);
    }
    running = null;
    renderJob(job);
    announce(t(res.changed ? 'announceFixed' : 'announceClean', { name: job.file.name }));
    if (res.changed && countsRepairs) syncTally('hit');
    pump();
  }

  function fail(job, code, message) {
    job.status = 'error';
    job.error = { code: code || 'UNKNOWN', message: message || '' };
    running = null;
    renderJob(job);
    announce(t('announceError', { name: job.file.name }));
    pump();
  }

  // ------------------------------------------------------------ shared tally
  // Demos repaired by everyone, kept on abacus.jasoncameron.dev. A repair sends +1 and nothing about the file.
  // Copies served from localhost or opened from disk only read the number, so testing doesn't inflate it.
  var TALLY_URL = 'https://abacus.jasoncameron.dev/{op}/newtanachot-cs2-demo-fixer/demos-fixed';
  var tallyEl = document.getElementById('tally'), tally = 0;
  var countsRepairs = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function showTally(n) {
    if (!(n > tally)) return;   // replies can arrive out of order, and 0 isn't worth showing
    tally = n;
    q(tallyEl, '.tally-text').textContent = t('tally', { n: n, count: n.toLocaleString(lang) });
    tallyEl.hidden = false;
  }
  function syncTally(op) {
    if (typeof fetch !== 'function') return;
    fetch(TALLY_URL.replace('{op}', op), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && typeof d.value === 'number') showTally(d.value); },
        function () { /* counter unreachable: the line stays hidden */ });
  }

  // ------------------------------------------------------------ input
  var drop = document.getElementById('drop');
  var input = document.getElementById('file');
  input.addEventListener('change', function () {
    if (input.files && input.files.length) addFiles(input.files);
    input.value = '';
  });
  function hasFiles(e) {
    var types = e.dataTransfer && e.dataTransfer.types;
    return !!types && Array.prototype.indexOf.call(types, 'Files') >= 0;
  }
  ['dragenter', 'dragover'].forEach(function (type) {
    window.addEventListener(type, function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      drop.classList.add('is-over');
    });
  });
  window.addEventListener('dragleave', function (e) { if (!e.relatedTarget) drop.classList.remove('is-over'); });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    drop.classList.remove('is-over');
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
  window.addEventListener('beforeunload', function (e) {
    if (running || queue.length) { e.preventDefault(); e.returnValue = ''; }
  });

  document.querySelectorAll('.lang a').forEach(function (a) {
    // Opened from disk, "./" shows the folder listing rather than the page
    if (location.protocol === 'file:' && a.getAttribute('href') === './') a.href = 'index.html';
    a.addEventListener('click', function () { saveLang(a.hreflang); });
  });

  // "Source code" link when hosted on GitHub Pages
  (function () {
    var link = document.getElementById('source-link'), host = location.hostname;
    if (!/\.github\.io$/i.test(host)) return;
    var user = host.split('.')[0], seg = location.pathname.split('/').filter(Boolean)[0];
    var repo = seg && !/\.html?$/i.test(seg) ? seg : user + '.github.io';
    link.href = 'https://github.com/' + user + '/' + repo;
    link.parentNode.hidden = false;
  })();

  syncTally('get');
})();
