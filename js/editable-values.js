/* editable-values.js — makes every slider's value readout (.val) click-to-edit.
   Click the number → type an exact value → Enter/blur commits (clamped to the
   slider's min/max/step) and fires the slider's normal 'input' handler so the
   demo updates the URL + image. Esc cancels. Self-initializing; safe to load on
   any demo. No dependencies. */
(function () {
  'use strict';

  function findVal(range) {
    // 1) id convention: range "wid" -> span "widV"
    if (range.id) {
      var byId = document.getElementById(range.id + 'V');
      if (byId && byId.classList.contains('val')) return byId;
    }
    // 2) a .val inside the same .ctrl block
    var ctrl = range.closest ? range.closest('.ctrl') : null;
    if (ctrl) {
      var v = ctrl.querySelector('.val');
      if (v) return v;
    }
    return null;
  }

  function clamp(n, min, max) {
    if (isNaN(n)) return null;
    if (!isNaN(min)) n = Math.max(n, min);
    if (!isNaN(max)) n = Math.min(n, max);
    return n;
  }

  function snap(n, step, min) {
    if (!step || isNaN(step)) return n;
    var base = isNaN(min) ? 0 : min;
    var snapped = Math.round((n - base) / step) * step + base;
    // keep the step's decimal precision
    var dec = (String(step).split('.')[1] || '').length;
    return +snapped.toFixed(dec);
  }

  function wire(range, val) {
    if (val.dataset.editable === '1') return;
    val.dataset.editable = '1';
    val.style.cursor = 'pointer';
    val.style.borderBottom = '1px dashed currentColor';
    val.title = 'Click to type an exact value';

    val.addEventListener('click', function (e) {
      e.stopPropagation();
      if (val.querySelector('input')) return; // already editing
      var min = parseFloat(range.min), max = parseFloat(range.max), step = parseFloat(range.step);
      var prev = val.textContent;

      var inp = document.createElement('input');
      inp.type = 'number';
      if (!isNaN(min)) inp.min = range.min;
      if (!isNaN(max)) inp.max = range.max;
      if (!isNaN(step)) inp.step = range.step;
      inp.value = range.value;
      inp.style.cssText =
        'width:5.5em;font:inherit;font-size:0.95em;padding:0 4px;margin:0;' +
        'background:#1b1b1e;color:#fff;border:1px solid #eb1000;border-radius:4px;' +
        '-webkit-text-fill-color:#fff;text-align:center;vertical-align:baseline;';

      val.textContent = '';
      val.appendChild(inp);
      inp.focus();
      inp.select();

      var done = false;
      function commit() {
        if (done) return; done = true;
        var n = clamp(parseFloat(inp.value), min, max);
        if (n === null) { restore(); return; }
        n = snap(n, step, min);
        range.value = n;
        // fire the demo's own handler(s)
        range.dispatchEvent(new Event('input', { bubbles: true }));
        range.dispatchEvent(new Event('change', { bubbles: true }));
        // fallback: if the demo didn't refresh the readout, show the value
        if (val.contains(inp)) val.textContent = String(range.value);
      }
      function restore() {
        if (done) return; done = true;
        if (val.contains(inp)) val.textContent = prev;
      }
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); restore(); }
        ev.stopPropagation();
      });
      inp.addEventListener('blur', commit);
      inp.addEventListener('click', function (ev) { ev.stopPropagation(); });
    });
  }

  function scan() {
    var ranges = document.querySelectorAll('input[type="range"]');
    for (var i = 0; i < ranges.length; i++) {
      var v = findVal(ranges[i]);
      if (v) wire(ranges[i], v);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  // catch sliders/readouts built after load (and re-wire any added later)
  setTimeout(scan, 800);
  setTimeout(scan, 2500);
})();
