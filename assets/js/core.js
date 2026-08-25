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
    if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
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
     Query-string helper
     ------------------------------------------------------------------------ */
  FS.param = function (key, fallback) {
    var v = new URLSearchParams(window.location.search).get(key);
    return v == null || v === '' ? (fallback || '') : v;
  };

  /* Hydrate any [data-icon] placeholders present in the static markup. */
  document.addEventListener('DOMContentLoaded', function () { FS.hydrateIcons(document); });
})(window, document);
