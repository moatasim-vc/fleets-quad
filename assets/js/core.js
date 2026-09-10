/* ==========================================================================
   FleetSquad — Core runtime
   Path resolution · DOM helpers · formatters · toast · modal · dropdown ·
   tabs · accordion · file-upload simulation · form validation
   Everything here is framework-free and safe to load on any page.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS = window.FS || {};

  /* ------------------------------------------------------------------------
     Base path
     Pages live at the root (index.html) and one level down (admin/, pages/…),
     so every generated link is resolved against the folder that holds
     assets/js/. We derive it from this script's own src.
     ------------------------------------------------------------------------ */
  FS.base = (function () {
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName('script');
      for (var i = all.length - 1; i >= 0; i--) {
        if (/assets\/js\/core\.js/.test(all[i].src)) { s = all[i]; break; }
      }
    }
    return s ? s.src.replace(/assets\/js\/core\.js.*$/, '') : '';
  })();

  /** Turn a project-relative path into one that works from any folder depth. */
  FS.url = function (path) {
    if (!path) return FS.base;
    // data:/blob: cover images an admin uploaded — they are already complete.
    if (/^(https?:|data:|blob:|mailto:|tel:|#)/.test(path)) return path;
    return FS.base + path.replace(/^\//, '');
  };

  /* ------------------------------------------------------------------------
     DOM helpers
     ------------------------------------------------------------------------ */

  FS.$  = function (sel, root) { return (root || document).querySelector(sel); };
  FS.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /** Create an element with attributes and children in one call. */
  FS.el = function (tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'dataset') Object.assign(node.dataset, attrs[k]);
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    if (html != null) node.innerHTML = html;
    return node;
  };

  /** Escape user-supplied strings before they touch innerHTML. */
  FS.esc = function (str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  /* ------------------------------------------------------------------------
     Formatters
     ------------------------------------------------------------------------ */

  FS.money = function (n, showCents) {
    var v = Number(n) || 0;
    return '$' + v.toLocaleString('en-US', {
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0
    });
  };

  FS.num = function (n) { return (Number(n) || 0).toLocaleString('en-US'); };

  FS.date = function (iso, style) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    if (style === 'long')  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (style === 'time')  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  /** "3 hours ago" style stamps for the notification centre. */
  FS.ago = function (iso) {
    var diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (isNaN(diff)) return '';
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return FS.date(iso);
  };

  FS.initials = function (name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0]; }).join('').toUpperCase();
  };

  /**
   * Clock-in / clock-out times are stored as 24-hour "HH:MM" because that is
   * what <input type="time"> produces. Everywhere they are *displayed* they go
   * through here and come back as 12-hour with AM/PM.
   * @param {string} hhmm e.g. "16:05"
   * @returns {string} e.g. "4:05 PM"
   */
  FS.time12 = function (hhmm) {
    if (!hhmm) return '—';
    var parts = String(hhmm).split(':');
    var h = Number(parts[0]);
    var m = String(parts[1] == null ? '00' : parts[1]).slice(0, 2);
    if (isNaN(h)) return hhmm;
    var suffix = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + m.padStart(2, '0') + ' ' + suffix;
  };

  /** Decimal hours as "7h 30m", which reads better than "7.5 h". */
  FS.duration = function (hours) {
    var h = Number(hours) || 0;
    if (!h) return '—';
    var whole = Math.floor(h);
    var mins = Math.round((h - whole) * 60);
    if (mins === 60) { whole += 1; mins = 0; }
    return (whole ? whole + 'h ' : '') + (mins ? mins + 'm' : (whole ? '' : '0m')).trim();
  };

  /** Difference between two "HH:MM" clock strings, in decimal hours. */
  FS.hoursBetween = function (start, end) {
    if (!start || !end) return 0;
    var a = start.split(':'), b = end.split(':');
    var mins = (b[0] * 60 + (+b[1] || 0)) - (a[0] * 60 + (+a[1] || 0));
    if (mins < 0) mins += 1440;
    return Math.round((mins / 60) * 100) / 100;
  };

  /* ------------------------------------------------------------------------
     Toasts
     ------------------------------------------------------------------------ */

  var toastHost;
  /**
   * @param {string} title
   * @param {string} [detail]
   * @param {'ok'|'info'|'warn'|'danger'} [type]
   */
  FS.toast = function (title, detail, type) {
    type = type || 'ok';
    if (!toastHost) {
      toastHost = FS.el('div', { class: 'toast-host', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastHost);
    }
    var iconName = { ok: 'check-circle', info: 'info', warn: 'alert-triangle', danger: 'x-circle' }[type];
    var t = FS.el('div', { class: 'toast toast--' + type },
      FS.icon(iconName) + '<div><strong>' + FS.esc(title) + '</strong>' +
      (detail ? '<small>' + FS.esc(detail) + '</small>' : '') + '</div>');
    toastHost.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-out');
      setTimeout(function () { t.remove(); }, 220);
    }, 3600);
  };

  /* ------------------------------------------------------------------------
     Modal
     Opens a dialog built from an options object and returns the node so the
     caller can wire up its own buttons.
     ------------------------------------------------------------------------ */

  /**
   * @param {{title:string, subtitle?:string, body:string, size?:'sm'|'lg',
   *          footer?:string, onMount?:function}} opts
   */
  FS.modal = function (opts) {
    var backdrop = FS.el('div', { class: 'modal-backdrop', role: 'dialog', 'aria-modal': 'true' });
    var sizeCls = opts.size ? ' modal--' + opts.size : '';
    backdrop.innerHTML =
      '<div class="modal' + sizeCls + '">' +
        '<div class="modal-head">' +
          '<div><h3>' + FS.esc(opts.title) + '</h3>' +
          (opts.subtitle ? '<p>' + FS.esc(opts.subtitle) + '</p>' : '') + '</div>' +
          '<button class="modal-close" data-close aria-label="Close">' + FS.icon('close') + '</button>' +
        '</div>' +
        '<div class="modal-body">' + opts.body + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');
    requestAnimationFrame(function () { backdrop.classList.add('is-open'); });

    function close() {
      backdrop.classList.remove('is-open');
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { backdrop.remove(); }, 200);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', onKey);

    backdrop.close = close;
    FS.hydrateIcons(backdrop);
    if (opts.onMount) opts.onMount(backdrop, close);

    // Move focus into the dialog for keyboard and screen-reader users.
    var first = backdrop.querySelector('input, select, textarea, button:not([data-close])');
    if (first) setTimeout(function () { first.focus(); }, 60);

    return backdrop;
  };

  /** Small yes/no dialog. `onYes` runs when the user confirms. */
  FS.confirm = function (title, message, onYes, danger) {
    return FS.modal({
      title: title,
      size: 'sm',
      body: '<p class="text-muted">' + FS.esc(message) + '</p>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-yes>Confirm</button>',
      onMount: function (root, close) {
        root.querySelector('[data-yes]').addEventListener('click', function () {
          close();
          if (onYes) onYes();
        });
      }
    });
  };

  /* ------------------------------------------------------------------------
     Delegated behaviours — dropdowns, tabs, accordions, star pickers
     A single document-level listener keeps dynamically rendered markup working
     without re-binding after every re-render.
     ------------------------------------------------------------------------ */

  document.addEventListener('click', function (e) {
    /* Dropdown menus ---------------------------------------------------- */
    var trigger = e.target.closest('[data-dropdown]');
    FS.$$('.dropdown.is-open').forEach(function (d) {
      if (!trigger || d !== trigger.closest('.dropdown')) d.classList.remove('is-open');
    });
    if (trigger) {
      e.preventDefault();
      trigger.closest('.dropdown').classList.toggle('is-open');
      return;
    }

    /* Tabs -------------------------------------------------------------- */
    var tab = e.target.closest('[data-tab]');
    if (tab) {
      e.preventDefault();
      var scope = tab.closest('[data-tabs]') || document;
      FS.$$('[data-tab]', scope).forEach(function (t) { t.classList.toggle('is-active', t === tab); });
      FS.$$('[data-panel]', scope).forEach(function (p) {
        p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab);
      });
      return;
    }

    /* Accordion (FAQ + drawer groups) ----------------------------------- */
    var acc = e.target.closest('[data-accordion]');
    if (acc) {
      e.preventDefault();
      acc.parentElement.classList.toggle('is-open');
      return;
    }

    /* Star rating picker ------------------------------------------------ */
    var star = e.target.closest('[data-star]');
    if (star) {
      e.preventDefault();
      var group = star.closest('.star-input');
      var value = Number(star.dataset.star);
      group.dataset.value = value;
      FS.$$('[data-star]', group).forEach(function (b) {
        b.classList.toggle('is-on', Number(b.dataset.star) <= value);
      });
      group.dispatchEvent(new CustomEvent('rate', { detail: value, bubbles: true }));
    }
  });

  /* Card-style radio groups highlight the selected option. */
  document.addEventListener('change', function (e) {
    if (e.target.matches('.opt-card input[type="radio"]')) {
      var name = e.target.name;
      FS.$$('.opt-card input[name="' + name + '"]').forEach(function (i) {
        i.closest('.opt-card').classList.toggle('is-selected', i.checked);
      });
    }
  });

  /* ------------------------------------------------------------------------
     Star-picker markup helper
     ------------------------------------------------------------------------ */
  FS.starInput = function (value) {
    var out = '<div class="star-input" data-value="' + (value || 0) + '">';
    for (var i = 1; i <= 5; i++) {
      out += '<button type="button" data-star="' + i + '" aria-label="' + i + ' star' + (i > 1 ? 's' : '') + '"' +
             (i <= (value || 0) ? ' class="is-on"' : '') + '>' + FS.icon('star') + '</button>';
    }
    return out + '</div>';
  };

  /* ------------------------------------------------------------------------
     File upload simulation
     No server exists, so files are read into data-URLs and held in memory.
     ------------------------------------------------------------------------ */

  /**
   * Wire a drop-zone + hidden input + thumbnail strip together.
   * @param {object} opts {zone, input, list, max, onChange}
   * @returns {{files: Array, clear: function}}
   */
  FS.uploader = function (opts) {
    var zone = opts.zone, input = opts.input, list = opts.list;
    var max = opts.max || 5;
    var files = [];

    function render() {
      list.innerHTML = files.map(function (f, i) {
        return '<div class="thumb">' +
          (f.dataUrl ? '<img src="' + f.dataUrl + '" alt="' + FS.esc(f.name) + '">'
                     : '<span class="thumb-fallback">' + FS.esc(f.name) + '</span>') +
          '<button type="button" class="thumb-x" data-rm="' + i + '" aria-label="Remove ' + FS.esc(f.name) + '">&times;</button>' +
        '</div>';
      }).join('');
      if (opts.onChange) opts.onChange(files);
    }

    function accept(fileList) {
      var room = max - files.length;
      if (room <= 0) { FS.toast('Upload limit reached', 'Maximum ' + max + ' images.', 'warn'); return; }
      Array.prototype.slice.call(fileList, 0, room).forEach(function (file) {
        var entry = { name: file.name, size: file.size, dataUrl: null };
        files.push(entry);
        if (/^image\//.test(file.type)) {
          var reader = new FileReader();
          reader.onload = function (ev) { entry.dataUrl = ev.target.result; render(); };
          reader.readAsDataURL(file);
        }
      });
      render();
      if (fileList.length > room) FS.toast('Some files skipped', 'Only ' + max + ' images allowed.', 'warn');
    }

    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function () { accept(input.files); input.value = ''; });

    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('is-drag'); });
    });
    zone.addEventListener('drop', function (e) { accept(e.dataTransfer.files); });

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-rm]');
      if (!btn) return;
      files.splice(Number(btn.dataset.rm), 1);
      render();
    });

    return { files: files, clear: function () { files.length = 0; render(); } };
  };

  /* ------------------------------------------------------------------------
     Form validation
     Marks every [required] field that is empty and returns a plain object of
     name -> value when the form is clean.
     ------------------------------------------------------------------------ */

  FS.validate = function (scope) {
    var ok = true;
    FS.$$('[required]', scope).forEach(function (f) {
      if (f.offsetParent === null && f.type !== 'hidden') return;   // hidden step
      var empty = !String(f.value || '').trim();
      f.classList.toggle('is-error', empty);
      var msg = f.parentElement.querySelector('.error-text');
      if (empty) {
        if (!msg) {
          msg = FS.el('div', { class: 'error-text' }, 'This field is required');
          f.parentElement.appendChild(msg);
        }
        ok = false;
      } else if (msg) { msg.remove(); }
    });
    if (!ok) {
      var first = scope.querySelector('.is-error');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
    return ok;
  };

  FS.formData = function (scope) {
    var out = {};
    FS.$$('input, select, textarea', scope).forEach(function (f) {
      if (!f.name) return;
      if (f.type === 'checkbox') out[f.name] = f.checked;
      else if (f.type === 'radio') { if (f.checked) out[f.name] = f.value; }
      else out[f.name] = f.value;
    });
    return out;
  };

  /* ------------------------------------------------------------------------
     Counters — animate a number up to its target when scrolled into view
     ------------------------------------------------------------------------ */

  FS.countUp = function (node, target, suffix, duration) {
    var start = null, from = 0;
    duration = duration || 1500;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);              // easeOutCubic
      node.textContent = FS.num(Math.round(from + (target - from) * eased)) + (suffix || '');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /** Run a callback the first time an element scrolls into view. */
  FS.onVisible = function (node, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { fn(); io.disconnect(); }
      });
    }, { threshold: 0.08 });
    io.observe(node);
  };

  /* ------------------------------------------------------------------------
     Read aloud
     Wraps the browser's own speech synthesiser. Nothing leaves the device and
     no audio file is involved — the voice is the one already installed on the
     reader's machine, so this costs nothing to run and needs no backend.

     Two quirks are worked around here:
       · Chrome silently stops after roughly fifteen seconds of one utterance,
         so the text is cut into sentence-sized chunks and queued.
       · Chrome also drops a *paused* queue after a while, so a heartbeat
         nudges resume() while playing.

     Any number of buttons can drive the same engine: subscribe with
     FS.speech.onChange(fn) and read FS.speech.state().
     ------------------------------------------------------------------------ */
  FS.speech = (function () {
    var synth = window.speechSynthesis;
    var ok = !!synth && typeof window.SpeechSynthesisUtterance === 'function';
    var listeners = [];
    var status = 'idle';           /* idle | playing | paused */
    var queue = [];
    var at = 0;
    var beat = null;

    function emit(next) {
      status = next;
      listeners.forEach(function (fn) { try { fn(status); } catch (e) {} });
    }

    /* Split on sentence ends, then hard-wrap anything still too long.
       A marker character is used instead of a lookbehind so the file still
       parses on older Safari, which only learned lookbehind in 16.4. */
    function chunk(text) {
      var out = [];
      String(text).replace(/([.!?])\s+/g, '$1\u0001').split(/[\u0001\n]+/).forEach(function (s) {
        s = s.trim();
        if (!s) return;
        while (s.length > 220) {
          var cut = s.lastIndexOf(' ', 220);
          out.push(s.slice(0, cut > 60 ? cut : 220));
          s = s.slice(cut > 60 ? cut + 1 : 220);
        }
        if (s) out.push(s);
      });
      return out;
    }

    function heartbeat(on) {
      if (beat) { clearInterval(beat); beat = null; }
      if (on) beat = setInterval(function () {
        if (status === 'playing' && synth.paused) synth.resume();
      }, 8000);
    }

    /* --- voice selection ---------------------------------------------
       The voices are the reader's own — nothing is shipped with the site — so
       which ones exist differs across Windows, macOS, iOS, Android and every
       browser on them. The pick is therefore a preference, not a name: each
       installed English voice is scored and the best one wins.

       TOP is ordered best-first. The neural engines Edge exposes sound far
       closer to a person than the older formant voices, so they lead; then
       Chrome's own bundled female voices, then the macOS and Windows staples.
       A voice that is only recognisably female scores below all of those but
       above an unknown one, and a recognisably male voice is passed over
       entirely rather than being read as a weak match. */
    var TOP = [
      /microsoft (aria|jenny|michelle|emma|ava|sonia|libby)\b.*(natural|neural)/i,
      /\b(aria|jenny|michelle|emma|sonia|libby)neural\b/i,
      /google us english/i,
      /google uk english female/i,
      /\b(samantha|ava|allison|susan|zoe)\b/i,
      /microsoft (zira|hazel|susan|linda|catherine)\b/i,
      /\b(serena|karen|moira|tessa|fiona|veena)\b/i
    ];
    var FEMALE = /\b(female|woman|girl|aria|jenny|michelle|ana|zira|hazel|susan|samantha|ava|allison|joanna|salli|kendra|kimberly|nicole|karen|serena|moira|tessa|fiona|catherine|emily|amy|emma|olivia|sophia)\b/i;
    var MALE = /\b(male|man|david|mark|guy|george|james|ryan|alex|daniel|fred|tom|oliver|william|arthur|rishi|brandon|christopher|eric|roger|steffan)\b/i;
    /* macOS novelty and low-bitrate fallbacks — intelligible, but not a voice
       to put in front of a customer. */
    var POOR = /(compact|eloquence|espeak|pico|novelty|bells|bubbles|cellos|organ|zarvox|trinoids|whisper|bad news|good news)/i;

    var voices = [];
    var chosen = null;

    function score(v) {
      var lang = String(v.lang || '').toLowerCase().replace('_', '-');
      if (lang.indexOf('en') !== 0) return -1;      /* English only */
      var name = String(v.name || '');
      var n = 0;
      for (var i = 0; i < TOP.length; i++) {
        if (TOP[i].test(name)) { n = (TOP.length - i) * 10; break; }
      }
      if (!n && MALE.test(name)) return -1;         /* never settle for a male voice */
      if (!n) n = FEMALE.test(name) ? 5 : 1;        /* known female, else unknown */
      if (/natural|neural|premium|enhanced/i.test(name)) n += 4;
      if (POOR.test(name)) n -= 6;
      /* Tie-break on region so an en-GB page is not read in an American accent
         when both are installed. The pages carry a bare lang="en", and this is
         a US company throughout — states, DOT inspections, a US phone number —
         so an unqualified "en" is treated as en-US rather than left open. */
      var want = String(document.documentElement.lang || '').toLowerCase();
      var region = want.split('-')[1] || 'us';
      if (region && lang.indexOf('-' + region) > -1) n += 2;
      return n;
    }

    function refreshVoices() {
      voices = (ok && synth.getVoices()) || [];
      var best = null, bestScore = 0;
      voices.forEach(function (v) {
        var n = score(v);
        if (n > bestScore) { bestScore = n; best = v; }
      });
      chosen = best;
    }

    /* Chrome returns an empty list on the first call and fills it in later,
       so the pick is made again whenever the browser says it has changed. */
    if (ok) {
      refreshVoices();
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', refreshVoices);
      } else {
        synth.onvoiceschanged = refreshVoices;
      }
    }

    function voice() {
      if (!chosen) refreshVoices();
      return chosen;
    }

    function speakNext() {
      if (at >= queue.length) { stop(); return; }
      var u = new window.SpeechSynthesisUtterance(queue[at]);
      var v = voice();
      /* A shade under conversational pace — an article read at a flat 1 runs
         faster than someone presenting it would. */
      u.rate = 0.97;
      u.pitch = 1;
      /* The language has to travel with the voice: leaving a stale lang on the
         utterance makes some engines quietly ignore the voice and fall back. */
      if (v) { u.voice = v; u.lang = v.lang; }
      else { u.lang = document.documentElement.lang || 'en-US'; }
      u.onend = function () { at++; speakNext(); };
      u.onerror = function () { stop(); };
      synth.speak(u);
    }

    function start(text) {
      if (!ok) return;
      synth.cancel();
      queue = chunk(text);
      at = 0;
      if (!queue.length) return;
      emit('playing');
      heartbeat(true);
      speakNext();
    }

    function stop() {
      if (!ok) return;
      queue = [];
      at = 0;
      heartbeat(false);
      synth.cancel();
      emit('idle');
    }

    /* Speech survives a page change in some browsers — silence it on the way
       out so the reader is not followed to the next article. */
    if (ok) window.addEventListener('pagehide', function () { synth.cancel(); });

    return {
      supported: function () { return ok; },
      /** The voice being used, or null while the browser is still listing them. */
      voiceName: function () { var v = voice(); return v ? v.name + ' (' + v.lang + ')' : null; },
      state: function () { return status; },
      onChange: function (fn) { listeners.push(fn); return fn; },
      offChange: function (fn) {
        var i = listeners.indexOf(fn);
        if (i > -1) listeners.splice(i, 1);
      },
      play: start,
      stop: stop,
      /** Play, pause or resume depending on where we are. */
      toggle: function (text) {
        if (!ok) return;
        if (status === 'playing') { synth.pause(); heartbeat(false); emit('paused'); }
        else if (status === 'paused') { synth.resume(); heartbeat(true); emit('playing'); }
        else start(text);
      }
    };
  })();

  /* ------------------------------------------------------------------------
     Image upload
     Reads a picked file, scales it down and hands back a data URL. Without a
     backend the picture has to live inside the saved state, so it is capped at
     a sensible width and re-encoded as JPEG to keep localStorage viable.
     ------------------------------------------------------------------------ */
  FS.readImage = function (file, maxW, done) {
    if (!file || !/^image\//.test(file.type)) { done(null, 'That file is not an image.'); return; }
    var reader = new FileReader();
    reader.onerror = function () { done(null, 'That file could not be read.'); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { done(null, 'That image could not be decoded.'); };
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var scale = Math.min(1, (maxW || 1600) / w);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext('2d');
        if (!ctx) { done(String(reader.result)); return; }
        // A white ground keeps transparent PNGs from turning black as JPEG.
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        var keepAlpha = file.type === 'image/png' || file.type === 'image/svg+xml';
        var url;
        try {
          url = keepAlpha && canvas.width * canvas.height < 640000
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', 0.82);
        } catch (e) { url = String(reader.result); }
        done(url, null, { width: canvas.width, height: canvas.height, bytes: url.length });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /* ------------------------------------------------------------------------
     Query-string helper
     ------------------------------------------------------------------------ */
  FS.param = function (key, fallback) {
    var v = new URLSearchParams(window.location.search).get(key);
    return v == null || v === '' ? (fallback || '') : v;
  };

  /* Hydrate any [data-icon] placeholders present in the static markup. */
  document.addEventListener('DOMContentLoaded', function () { FS.hydrateIcons(document); });
})(window, document);
