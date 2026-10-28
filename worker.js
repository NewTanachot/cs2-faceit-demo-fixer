/* CS2 Demo Fixer - background worker (keeps the page responsive while large demos are processed) */
importScripts('vendor/fzstd.js', 'demofix.js', 'pipeline.js');

self.onmessage = function (e) {
  var d = e.data;
  if (!d || d.type !== 'process') return;
  var last = 0, lastStage = '';
  Pipeline.processFile(d.file, function (stage, fraction) {
    var now = Date.now();
    if (stage !== lastStage || fraction === 1 || now - last > 80) {
      last = now; lastStage = stage;
      self.postMessage({ type: 'progress', id: d.id, stage: stage, fraction: fraction });
    }
  }).then(function (res) {
    self.postMessage({ type: 'done', id: d.id, changed: res.changed, report: res.report, blob: res.blob, inputFormat: res.inputFormat });
  }, function (err) {
    self.postMessage({ type: 'error', id: d.id, code: Pipeline.errorCode(err), message: String((err && err.message) || err) });
  });
};
