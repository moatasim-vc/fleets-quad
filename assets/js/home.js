/* ==========================================================================
   FleetSquad — Homepage behaviour
   Renders every data-driven block on the homepage and animates the counters.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var Store = FS.store;

  /* ------------------------------------------------------------------------
     Counters
     Review count and average rating come from the store, so a review submitted
     in the customer portal is reflected on the homepage immediately.
     ------------------------------------------------------------------------ */
  function renderStats() {
    var host = document.getElementById('statsBar');
    if (!host) return;

    var rs = Store.reviewStats();
    var stats = D.stats.map(function (s) {
      if (s.label === 'Reviews')         return Object.assign({}, s, { value: rs.count || s.value });
      if (s.label === 'Customer Rating') return Object.assign({}, s, { value: rs.average || s.value });
      return s;
    });

    host.innerHTML = stats.map(function (s) {
      return '<div class="stat">' + FS.icon(s.icon) +
        '<div>' +
          '<div class="stat-num" data-target="' + s.value + '" data-suffix="' + s.suffix + '"' +
            (s.decimal ? ' data-decimal="1"' : '') + '>0' + s.suffix + '</div>' +
          '<div class="stat-label">' + FS.esc(s.label) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    FS.onVisible(host, function () {
      FS.$$('.stat-num', host).forEach(function (node) {
        var target = Number(node.dataset.target);
        var suffix = node.dataset.suffix || '';
        if (node.dataset.decimal) {
          // Ratings animate with one decimal place rather than thousands.
          var start = null;
          requestAnimationFrame(function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / 1200, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            node.textContent = (target * eased).toFixed(1) + suffix;
            if (p < 1) requestAnimationFrame(step);
          });
        } else {
          FS.countUp(node, target, suffix, 1600);
        }
      });
    });
  }

  function renderBrands() {
    var host = document.getElementById('brandRow');
    if (!host) return;
    host.innerHTML = D.brands.map(function (b) {
      return '<img src="' + FS.url('assets/img/brands/' + b + '.png') + '" alt="' + FS.esc(b) + '" loading="lazy">';
    }).join('');
  }

  /* ------------------------------------------------------------------------
     Services — one markup, two layouts (see site.css)
     ------------------------------------------------------------------------ */
  function renderServices() {
    var host = document.getElementById('servicesGrid');
    if (!host) return;
    host.innerHTML = FS.store.catalog('service').slice(0, 6).map(function (s) {
      return '<a class="svc-card" href="' + FS.url('service.html?s=' + s.slug) + '">' +
        '<div class="svc-media">' +
          '<img src="' + FS.url(s.image) + '" alt="' + FS.esc(s.name) + '" loading="lazy">' +
          '<span class="svc-icon">' + FS.icon(s.icon) + '</span>' +
        '</div>' +
        '<div class="svc-body">' +
          '<h3>' + FS.esc(s.name) + '</h3>' +
          '<p class="svc-desc">' + FS.esc(s.excerpt) + '</p>' +
          '<span class="svc-link">Learn More' + FS.icon('arrow-right') + '</span>' +
        '</div>' +
        FS.icon('chevron-right', 'svc-chevron') +
      '</a>';
    }).join('');
  }

  function renderWhy() {
    var host = document.getElementById('whyGrid');
    if (!host) return;
    host.innerHTML = D.whyPoints.map(function (w) {
      return '<div class="why-item">' + FS.icon(w.icon) +
        '<h4>' + FS.esc(w.title) + '</h4>' +
        '<p>' + FS.esc(w.text) + '</p>' +
      '</div>';
    }).join('');
  }

  function renderVehicles() {
    var host = document.getElementById('vehiclesGrid');
    if (!host) return;
    host.innerHTML = FS.store.catalog('vehicle').map(function (v) {
      return '<a class="veh-item" href="' + FS.url('vehicle.html?v=' + v.slug) + '">' +
        '<img src="' + FS.url(v.image) + '" alt="' + FS.esc(v.name) + '" loading="lazy">' +
        '<span>' + FS.esc(v.name) + '</span>' +
        FS.icon('chevron-right') +
      '</a>';
    }).join('');
  }

  /* ------------------------------------------------------------------------
     Reviews: aggregate rating + three featured testimonials
     ------------------------------------------------------------------------ */
  function renderReviews() {
    var summary = document.getElementById('ratingSummary');
    var list = document.getElementById('testimonials');
    var rs = Store.reviewStats();

    if (summary) {
      var bars = [5, 4, 3, 2, 1].map(function (star) {
        var n = rs.breakdown[star - 1] || 0;
        var pct = rs.count ? Math.round((n / rs.count) * 100) : 0;
        return '<div class="row" style="gap:10px">' +
          '<span class="text-sm text-muted" style="width:12px">' + star + '</span>' +
          '<span class="stars">' + FS.icon('star') + '</span>' +
          '<span class="progress" style="flex:1 1 auto;min-width:90px"><span style="width:' + pct + '%"></span></span>' +
          '<span class="text-xs text-dim" style="width:28px;text-align:right">' + n + '</span>' +
        '</div>';
      }).join('');

      summary.innerHTML =
        '<div class="rating-big">' +
          '<strong>' + rs.average.toFixed(1) + '</strong>' +
          FS.stars(rs.average, 'stars--lg') +
          '<small>' + FS.num(rs.count) + ' verified reviews</small>' +
        '</div>' +
        '<div class="stack" style="gap:7px;flex:1 1 300px;max-width:420px;color:#f5a524">' + bars + '</div>';
    }

    if (list) {
      var featured = Store.reviews('published').filter(function (r) { return r.featured; });
      if (featured.length < 3) featured = Store.reviews('published').slice(0, 3);
      list.innerHTML = featured.slice(0, 3).map(function (r) {
        return '<article class="review-card">' +
          FS.stars(r.rating) +
          '<h4 class="mb-3">' + FS.esc(r.title) + '</h4>' +
          '<blockquote>' + FS.esc(r.body) + '</blockquote>' +
          '<div class="review-meta">' +
            '<span class="avatar">' + FS.initials(r.name) + '</span>' +
            '<div><strong>' + FS.esc(r.name) + '</strong><small>' + FS.esc(r.company) + '</small></div>' +
          '</div>' +
        '</article>';
      }).join('');
    }
  }

  function renderBlog() {
    var host = document.getElementById('blogPreview');
    if (!host) return;
    // Published articles only, newest first — matches the admin blog list.
    host.innerHTML = Store.posts('published').slice(0, 3).map(function (p) {
      return '<a class="post-card" href="' + FS.url('blog-post.html?p=' + p.slug) + '">' +
        '<div class="post-media">' +
          '<img src="' + FS.url(p.image) + '" alt="" loading="lazy">' +
          '<span class="post-cat">' + FS.esc(p.category) + '</span>' +
        '</div>' +
        '<div class="post-body">' +
          '<h3>' + FS.esc(p.title) + '</h3>' +
          '<p>' + FS.esc(p.excerpt) + '</p>' +
          '<div class="post-meta"><span>' + FS.date(p.at) + '</span><i></i><span>' + p.read + ' min read</span></div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  /* ------------------------------------------------------------------------
     Phone-only widgets
     ------------------------------------------------------------------------ */
  function renderMiniKpis() {
    var host = document.getElementById('miniKpis');
    if (!host) return;
    var kpis = [
      { label: 'Service Visits',     value: '24' },
      { label: 'Vehicles Serviced',  value: '86' },
      { label: 'Completed Repairs',  value: '98.7%' },
      { label: 'Average Repair Cost',value: '$328' }
    ];
    host.innerHTML = kpis.map(function (k) {
      return '<div class="mini-kpi"><span>' + k.label + '</span><strong>' + k.value + '</strong></div>';
    }).join('');
  }

  function wireZipCheck() {
    var form = document.getElementById('zipForm');
    if (!form) return;
    var input = document.getElementById('zipInput');
    var out = document.getElementById('zipResult');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var zip = String(input.value || '').trim();
      if (!/^\d{5}$/.test(zip)) {
        out.className = 'error-text';
        out.textContent = 'Enter a 5-digit zip code.';
        return;
      }
      // The zip resolves to a city, then the city is checked against the
      // coverage the admin maintains in Service Areas.
      var hit = D.zipLookup[zip];
      if (!hit) {
        var keys = Object.keys(D.zipLookup);
        hit = D.zipLookup[keys[Number(zip) % keys.length]];
      }
      var area = Store.lookupArea(hit.city) || Store.lookupArea(hit.state);

      if (area) {
        out.className = 'hint text-ok text-semi';
        out.textContent = 'Good news — we service ' + hit.city + ', ' + hit.state + '.';
      } else {
        out.className = 'hint text-semi';
        out.textContent = 'We do not cover ' + hit.city + ', ' + hit.state +
          ' yet — call 1-888-391-MECH and we will find you a tech.';
      }
    });
  }

  /* ------------------------------------------------------------------------
     Dashboard preview gate
     The homepage widget only shows sample figures, so both of its controls —
     the range picker and "View Full Dashboard" — send a signed-out visitor to
     the login screen. Someone already signed in lands on their own portal.
     ------------------------------------------------------------------------ */
  function wireDashboardGate() {
    var gates = FS.$$('[data-dash-gate]');
    if (!gates.length) return;

    gates.forEach(function (node) {
      node.addEventListener('click', function (e) {
        e.preventDefault();
        var session = Store.session();
        if (session) {
          var home = (FS.data.users.filter(function (u) { return u.role === session.role; })[0] || {}).home;
          window.location.href = FS.url(home || 'login.html');
        } else {
          window.location.href = FS.url('login.html?next=dashboard');
        }
      });
    });
  }

  /* ------------------------------------------------------------------------ */
  function init() {
    renderStats();
    renderBrands();
    renderServices();
    renderWhy();
    renderVehicles();
    renderReviews();
    renderBlog();
    renderMiniKpis();
    wireZipCheck();
    wireDashboardGate();
    FS.hydrateIcons(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
