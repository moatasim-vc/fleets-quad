/* ==========================================================================
   FleetSquad — Public page renderer
   One module drives every templated marketing page. The page announces itself
   with <body data-page="…"> and, for detail pages, a query-string slug.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var Store = FS.store;
  var C = D.company;

  var body = document.getElementById('pageBody');

  /* ------------------------------------------------------------------------
     Shared blocks
     ------------------------------------------------------------------------ */

  function section(inner, cls, style) {
    return '<section class="section ' + (cls || '') + '"' + (style ? ' style="' + style + '"' : '') + '>' +
      '<div class="container">' + inner + '</div></section>';
  }

  function headBlock(title, lead, left) {
    return '<div class="section-head' + (left ? ' section-head--left' : '') + '">' +
      '<h2>' + FS.esc(title) + '</h2>' +
      (lead ? '<p>' + FS.esc(lead) + '</p>' : '') + '</div>';
  }

  /* Closing call-to-action shared by every SEO template. The three contact
     cards that used to sit under it were removed at the client's request. */
  function ctaBlock() {
    return '<section class="section" style="padding-top:0"><div class="container">' +
      '<div class="cta-band">' +
        '<div class="cta-inner">' +
          '<h2>Ready to put a tech on your fleet?</h2>' +
          '<p>Book service today and keep your fleet mission-ready. Free estimate, no obligation.</p>' +
          '<div class="row row-wrap" style="gap:var(--sp-3);margin-top:var(--sp-6)">' +
            '<a class="btn btn-primary" href="' + FS.url(FS.data.links.estimate) + '">Get Estimate</a>' +
            '<a class="btn btn-outline-light" href="tel:' + C.phoneRaw + '">' + FS.icon('phone') + C.phone + '</a>' +
          '</div>' +
        '</div>' +
        '<div class="cta-photo"><img src="' + FS.url('assets/img/cta-van.jpg') + '" alt="" loading="lazy"></div>' +
      '</div>' +
    '</div></section>';
  }

  function contactCard(icon, label, value, href, sub) {
    var tag = href ? 'a' : 'div';
    return '<' + tag + ' class="feature' + (href ? ' card-hover' : '') + '"' +
      (href ? ' href="' + href + '"' : '') + '>' +
      '<i>' + FS.icon(icon) + '</i>' +
      '<div><h4>' + FS.esc(label) + '</h4>' +
        '<p class="text-blue text-bold">' + FS.esc(value) + '</p>' +
        '<p class="text-xs text-dim mt-2">' + FS.esc(sub) + '</p></div>' +
    '</' + tag + '>';
  }

  function featureGrid(features) {
    return '<div class="grid grid-4">' + features.map(function (f) {
      return '<div class="feature"><i>' + FS.icon(f.icon) + '</i>' +
        '<div><h4>' + FS.esc(f.title) + '</h4><p>' + FS.esc(f.text) + '</p></div></div>';
    }).join('') + '</div>';
  }

  function bulletList(items) {
    return '<div class="prose"><ul>' + items.map(function (b) {
      return '<li>' + FS.esc(b) + '</li>';
    }).join('') + '</ul></div>';
  }

  /* Whether a search-engine record has already been written on this page, so
     setHero() knows not to fall back to the on-page headline. */
  var seoApplied = false;

  /**
   * Write the SEO record for this page. The writer itself lives in site.js —
   * the homepage needs it and does not load this file — so this only keeps
   * track of whether it ran.
   * @param {{title:string, description:string, keywords?:string,
   *          path?:string, image?:string, type?:string}} seo
   */
  function setSeo(seo) {
    if (FS.setSeo(seo)) seoApplied = true;
  }

  /**
   * The client's meta sheet entry for a page, if it has one.
   * @param {string} key      e.g. 'service:mobile-fleet-repair'
   * @param {object} [fallback] used when the sheet does not list the page
   * @param {object} [extra]  merged in either way (og:image, type…)
   * @returns {object} a setSeo() payload
   */
  function sheet(key, fallback, extra) {
    var entry = D.seoFor(key);
    return Object.assign({}, entry || fallback || {}, extra || {});
  }

  /**
   * The SEO record for a catalog item (service / industry / vehicle type).
   * These are editable in the admin, so the record's own `seo` block wins;
   * any field left blank there falls back to the generated one, which keeps a
   * newly-added service from shipping an empty title.
   * @param {object} item   the catalog record
   * @param {object} fallback generated title/description/keywords/path
   * @param {object} [extra]  merged in either way (og:image…)
   */
  function itemSeo(item, fallback, extra) {
    var own = item.seo || {};
    return Object.assign({}, fallback, {
      title: own.title || fallback.title,
      description: own.description || fallback.description,
      keywords: own.keywords || fallback.keywords,
      path: own.path || fallback.path
    }, extra || {});
  }

  /**
   * Which record this page is for.
   * A page reached as service.html?s=slug carries it in the query string; the
   * same page served from its own folder (/mobile-fleet-repair/index.html)
   * carries it as <body data-slug="…"> instead. Either works.
   * @param {string} key the query-string parameter to look for
   */
  function slugOf(key) {
    return FS.param(key) || document.body.dataset.slug || '';
  }

  /**
   * Apply the CMS record for one of the fixed inner pages. The markup already
   * carries a sensible heading, lead and meta description, so this only
   * overwrites them when the page has been edited in Admin → CMS Pages.
   * @param {string} slug matches D.cmsPages
   */
  function applyCmsPage(slug) {
    // metaTitle / metaDescription / keywords are seeded from the meta sheet
    // and are editable in Admin -> CMS Pages, so whatever is saved wins here.
    // The writer is shared with the homepage, which lives in site.js.
    var page = FS.applyCmsSeo(slug);
    if (!page) return null;
    seoApplied = true;

    var h1 = document.getElementById('pageTitle');
    var lead = document.getElementById('pageLead');
    if (h1 && page.heading) h1.textContent = page.heading;
    if (lead && page.lead) lead.textContent = page.lead;
    return page;
  }

  /**
   * Render the editable body sections of a CMS page as prose.
   * A section with `style: 'quote'` becomes a pull quote; everything else is
   * a heading plus one paragraph per blank-line-separated run, with markdown
   * links resolved the same way the blog body does it.
   * @param {string} slug
   * @returns {string} html, '' when the page has no editable body
   */
  function cmsProse(slug) {
    return Store.cmsBlocks(slug).map(function (b) {
      if (!b.text && !b.heading) return '';
      if (b.style === 'quote') return '<blockquote>' + paragraph(b.text) + '</blockquote>';
      return (b.heading ? '<h2>' + FS.esc(b.heading) + '</h2>' : '') + paragraphs(b.text);
    }).join('');
  }

  /** One <p> per blank-line-separated run. */
  function paragraphs(text) {
    return String(text || '').split(/\n{2,}/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (s) { return '<p>' + paragraph(s) + '</p>'; })
      .join('');
  }

  /**
   * The Google Maps embed address for a page, or '' when there is none.
   * The classic `?q=…&output=embed` form needs no API key and no account.
   * A hand-pasted embed URL is accepted only if it is Google's own.
   */
  function mapSrc(page) {
    var custom = String((page && page.mapEmbed) || '').trim();
    if (custom) {
      return /^https:\/\/(www\.)?google\.[a-z.]{2,10}\/maps/.test(custom) ? custom : '';
    }
    var addr = String((page && page.mapAddress) || '').trim();
    if (!addr) return '';
    return 'https://www.google.com/maps?q=' + encodeURIComponent(addr) + '&output=embed';
  }

  function mapBlock(page) {
    var src = mapSrc(page);
    if (!src) return '';
    var label = (page && page.mapLabel) || 'Find us';
    return section(
      headBlock(label) +
      '<div class="map-embed">' +
        '<iframe src="' + FS.esc(src) + '" title="FleetSquad on Google Maps" ' +
          'loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' +
      '</div>', '', 'padding-top:0');
  }

  function setHero(title, lead, crumbs, extra) {
    document.getElementById('pageTitle').innerHTML = FS.esc(title);
    document.getElementById('pageLead').innerHTML = FS.esc(lead);
    // The on-page headline is written for a reader, the meta title for a
    // search result. Only fall back to the headline when no SEO record ran.
    if (!seoApplied) {
      document.title = title + ' | FleetSquad';
      var meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', lead);
    }

    var host = document.getElementById('crumbs');
    if (host) {
      host.innerHTML = crumbs.map(function (c, i) {
        var sep = i ? '<span>/</span>' : '';
        return sep + (c.href ? '<a href="' + FS.url(c.href) + '">' + FS.esc(c.label) + '</a>'
                             : '<strong>' + FS.esc(c.label) + '</strong>');
      }).join('');
    }
    if (extra) document.getElementById('pageHeroExtra').innerHTML = extra;
  }

  /** Shown when a slug does not resolve. */
  function notFound(kind, backHref, backLabel) {
    setHero('Page not found', 'We could not find that ' + kind + '.', [{ label: 'Home', href: 'index.html' }, { label: 'Not found' }]);
    body.innerHTML = section(
      '<div class="empty-state">' + FS.icon('help-circle') +
      '<h4>Nothing here</h4><p>The ' + kind + ' you asked for does not exist. Browse the full list instead.</p>' +
      '<a class="btn btn-primary mt-6" href="' + FS.url(backHref) + '">' + backLabel + '</a></div>');
  }

  /* ======================================================================
     Services
     ====================================================================== */

  function servicesIndex() {
    setSeo({
      title: 'Mobile Fleet Services | Maintenance & Repair | FleetSquad',
      description: 'Preventive maintenance, mobile fleet repair, diagnostics, emergency roadside, scheduled maintenance and DOT inspections — performed at your yard by ASE Master Techs.',
      keywords: 'mobile fleet services, fleet maintenance, mobile fleet repair, fleet diagnostics, dot inspections',
      path: 'services'
    });
    body.innerHTML =
      section('<div class="grid grid-3">' + Store.catalog('service').map(function (s) {
        return '<a class="svc-card" href="' + FS.url('service.html?s=' + s.slug) + '">' +
          '<div class="svc-media">' +
            '<img src="' + FS.url(s.image) + '" alt="' + FS.esc(s.name) + '" loading="lazy">' +
            '<span class="svc-icon">' + FS.icon(s.icon) + '</span>' +
          '</div>' +
          '<div class="svc-body"><h3>' + FS.esc(s.name) + '</h3>' +
            '<p class="svc-desc">' + FS.esc(s.excerpt) + '</p>' +
            '<span class="svc-link">Learn More' + FS.icon('arrow-right') + '</span></div>' +
          FS.icon('chevron-right', 'svc-chevron') +
        '</a>';
      }).join('') + '</div>') +
      ctaBlock();
    // Force the desktop card treatment on the index even on narrow screens.
    FS.$$('.svc-card', body).forEach(function (c) { c.classList.add('svc-card--full'); });
  }

  function serviceDetail() {
    var s = Store.catalogItem('service', slugOf('s'));
    if (!s) return notFound('service', 'services.html', 'All services');

    setSeo(itemSeo(s, {
      title: s.name + ' | Mobile Fleet Service | FleetSquad',
      description: s.excerpt,
      keywords: [s.short.toLowerCase(), 'mobile ' + s.short.toLowerCase(), 'fleet maintenance', 'ase master techs'].join(', '),
      path: 'services/' + s.slug
    }, { image: s.image }));

    setHero(s.hero, s.intro.split('. ')[0] + '.',
      [{ label: 'Home', href: 'index.html' }, { label: 'Services', href: 'services.html' }, { label: s.short }],
      '<a class="btn btn-primary" href="' + FS.url(FS.data.links.estimate) + '">Get Estimate</a>');

    body.innerHTML =
      /* One column. The picture and the "Book this service" card that used to
         sit beside this copy were both removed at the client's request, so a
         two-column split would leave an empty half. The measure is capped so
         the text does not run the full width of a large screen. */
      section(
        '<div style="max-width:78ch">' +
          '<h2 class="mb-4">' + FS.esc(s.name) + '</h2>' +
          '<p class="prose mb-6">' + FS.esc(s.intro) + '</p>' +
          '<h3 class="mb-3">What is included</h3>' +
          bulletList(s.bullets) +
        '</div>') +

      section(headBlock('Why fleets book ' + s.short, 'What you get on every visit.') + featureGrid(s.features), '', 'padding-top:0;background:var(--surface-2)') +

      section(headBlock('Vehicles we service', 'Class 1 through Class 8 — all makes and models.') +
        '<div class="vehicles-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--sp-5)">' +
        Store.catalog('vehicle').map(function (v) {
          return '<a class="veh-item" href="' + FS.url('vehicle.html?v=' + v.slug) + '" style="flex-direction:column;text-align:center;border:0">' +
            '<img src="' + FS.url(v.image) + '" alt="' + FS.esc(v.name) + '" loading="lazy">' +
            '<span>' + FS.esc(v.name) + '</span></a>';
        }).join('') + '</div>', '', 'padding-top:0') +

      ctaBlock();
  }

  /* ======================================================================
     Industries
     ====================================================================== */

  function industriesIndex() {
    setSeo({
      title: 'Fleet Maintenance by Industry | FleetSquad',
      description: 'Fleet maintenance programmes built for rental car fleets, trucking fleets, delivery fleets, corporate fleets and construction fleets — serviced where the vehicles sit.',
      keywords: 'rental fleet maintenance, trucking fleet service, delivery fleet maintenance, construction fleet repair',
      path: 'industries'
    });
    body.innerHTML =
      section('<div class="grid grid-3">' + Store.catalog('industry').map(function (i) {
        return '<a class="tile" href="' + FS.url('industry.html?i=' + i.slug) + '">' +
          '<span class="kpi-icon kpi-icon--navy mb-3">' + FS.icon(i.icon) + '</span>' +
          '<h3>' + FS.esc(i.name) + '</h3><p>' + FS.esc(i.excerpt) + '</p>' +
          '<span class="tile-link">Explore' + FS.icon('arrow-right') + '</span></a>';
      }).join('') + '</div>') + ctaBlock();
  }

  function industryDetail() {
    var i = Store.catalogItem('industry', slugOf('i'));
    if (!i) return notFound('industry', 'industries.html', 'All industries');

    setSeo(itemSeo(i, {
      title: i.name + ' Maintenance & Repair | FleetSquad',
      description: i.excerpt,
      keywords: [i.name.toLowerCase(), i.name.toLowerCase() + ' maintenance', 'mobile fleet service'].join(', '),
      path: 'industries/' + i.slug
    }));

    setHero(i.hero, i.intro,
      [{ label: 'Home', href: 'index.html' }, { label: 'Industries', href: 'industries.html' }, { label: i.name }],
      '<a class="btn btn-primary" href="' + FS.url(FS.data.links.estimate) + '">Get Estimate</a>');

    body.innerHTML =
      section('<div class="grid grid-3">' + i.stats.map(function (s) {
        return '<div class="kpi text-center"><div class="kpi-value" style="font-size:2.2rem">' + FS.esc(s.v) + '</div>' +
          '<div class="kpi-label mt-2">' + FS.esc(s.l) + '</div></div>';
      }).join('') + '</div>') +

      /* One column. The "Popular services" card that used to sit beside this
         copy was removed at the client's request; the Get Estimate call it
         carried is still on the hero and in the closing band below. */
      section(
        '<div style="max-width:78ch">' +
          '<h2 class="mb-4">How we work with ' + FS.esc(i.name.toLowerCase()) + '</h2>' +
          '<p class="prose mb-6">' + FS.esc(i.intro) + '</p>' + bulletList(i.bullets) +
        '</div>', '', 'padding-top:0') +

      section(headBlock('Why fleets choose FleetSquad') + featureGrid(D.whyPoints.map(function (w) {
        return { icon: w.icon, title: w.title, text: w.text };
      })), '', 'padding-top:0;background:var(--surface-2)') +

      ctaBlock();
  }

  /* ======================================================================
     Vehicle types
     ====================================================================== */

  function vehiclesIndex() {
    setSeo({
      title: 'Vehicle Types We Service | Class 1 to Class 8 | FleetSquad',
      description: 'Semi-trucks, box trucks, pickup trucks, service vans and passenger cars — Class 1 through Class 8, serviced on site by ASE Master Techs.',
      keywords: 'semi truck repair, box truck maintenance, service van repair, fleet vehicle types',
      path: 'vehicles'
    });
    body.innerHTML =
      section('<div class="grid grid-3">' + Store.catalog('vehicle').map(function (v) {
        return '<a class="tile text-center" href="' + FS.url('vehicle.html?v=' + v.slug) + '">' +
          '<img src="' + FS.url(v.image) + '" alt="' + FS.esc(v.name) + '" style="margin:0 auto var(--sp-4);max-width:260px" loading="lazy">' +
          '<h3>' + FS.esc(v.name) + '</h3><p>' + FS.esc(v.excerpt) + '</p>' +
          '<span class="tile-link" style="justify-content:center">View maintenance' + FS.icon('arrow-right') + '</span></a>';
      }).join('') + '</div>') + ctaBlock();
  }

  function vehicleDetail() {
    var v = Store.catalogItem('vehicle', slugOf('v'));
    if (!v) return notFound('vehicle type', 'vehicles.html', 'All vehicle types');

    setSeo(itemSeo(v, {
      title: v.hero + ' | Mobile Service | FleetSquad',
      description: v.excerpt + ' ' + v.intro.split('. ')[0] + '.',
      keywords: [v.name.toLowerCase(), v.name.toLowerCase() + ' repair', v.name.toLowerCase() + ' maintenance', 'mobile mechanic'].join(', '),
      path: 'vehicles/' + v.slug
    }, { image: v.image }));

    setHero(v.hero, v.intro,
      [{ label: 'Home', href: 'index.html' }, { label: 'Vehicles', href: 'vehicles.html' }, { label: v.name }],
      '<a class="btn btn-primary" href="' + FS.url(FS.data.links.estimate) + '">Get Estimate</a>');

    body.innerHTML =
      section(
        '<div class="split split--1-1" style="gap:var(--sp-8);align-items:center">' +
          '<img src="' + FS.url(v.image) + '" alt="' + FS.esc(v.name) + '" style="width:100%">' +
          '<div><h2 class="mb-4">' + FS.esc(v.hero) + '</h2>' +
          '<p class="prose mb-6">' + FS.esc(v.intro) + '</p>' + bulletList(v.bullets) + '</div>' +
        '</div>') +

      section(headBlock('Services for ' + v.name.toLowerCase()) +
        '<div class="grid grid-3">' + Store.catalog('service').slice(0, 6).map(function (s) {
          return '<a class="tile" href="' + FS.url('service.html?s=' + s.slug) + '">' +
            '<span class="kpi-icon mb-3">' + FS.icon(s.icon) + '</span>' +
            '<h3>' + FS.esc(s.short) + '</h3><p>' + FS.esc(s.excerpt) + '</p>' +
            '<span class="tile-link">Learn more' + FS.icon('arrow-right') + '</span></a>';
        }).join('') + '</div>', '', 'padding-top:0;background:var(--surface-2)') +

      ctaBlock();
  }

  /* ======================================================================
     Blog
     ====================================================================== */

  /**
   * Article bodies are edited as plain text with markdown links, so that the
   * blog editor can cross-link articles. Only links are converted — everything
   * else is escaped, so an editor cannot inject markup.
   */
  function paragraph(text) {
    return FS.esc(text).replace(/\[([^\]\]]+)\]\(([^)\s]+)\)/g, function (match, label, href) {
      var safe = /^(https?:|mailto:|tel:|\/|blog-post\.html|#)/i.test(href) ? href : '#';
      var internal = safe.indexOf('http') !== 0;
      return '<a href="' + FS.esc(internal ? FS.url(safe.replace(/^\//, '')) : safe) + '"' +
        (internal ? '' : ' target="_blank" rel="noopener"') + '>' + label + '</a>';
    });
  }

  function blogList() {
    var active = FS.param('cat', 'All');
    // Store.posts() is already newest-first, and drafts stay off the site.
    var posts = Store.posts('published');
    var shown = active === 'All' ? posts : posts.filter(function (p) { return p.category === active; });

    setSeo(sheet('blog'));

    /* No category row above the grid — the client asked for the articles on
       their own. A ?cat= link still filters, so a category can be linked to
       from elsewhere, it just is not advertised here. */
    body.innerHTML = section(
      (shown.length
        ? '<div class="grid grid-3">' + shown.map(postCard).join('') + '</div>'
        : '<div class="empty-state">' + FS.icon('file-text') + '<h4>No posts yet</h4><p>Nothing published in this category.</p></div>')
    ) + ctaBlock();
  }

  function postCard(p) {
    return '<a class="post-card" href="' + FS.url('blog-post.html?p=' + p.slug) + '">' +
      '<div class="post-media"><img src="' + FS.url(p.image) + '" alt="" loading="lazy">' +
      '<span class="post-cat">' + FS.esc(p.category) + '</span></div>' +
      '<div class="post-body"><h3>' + FS.esc(p.title) + '</h3><p>' + FS.esc(p.excerpt) + '</p>' +
      '<div class="post-meta"><span>' + FS.date(p.at) + '</span><i></i><span>' + p.read + ' min read</span></div></div></a>';
  }

  function blogPost() {
    var p = Store.post(slugOf('p'));
    if (!p) return notFound('article', 'blog.html', 'All posts');

    setSeo({
      title: p.metaTitle || (p.title + ' | FleetSquad'),
      description: p.metaDescription || p.excerpt,
      keywords: p.keywords,
      path: 'blog/' + p.slug,
      image: p.image,
      type: 'article'
    });

    var canSpeak = FS.speech.supported();

    setHero(p.title, p.excerpt,
      [{ label: 'Home', href: 'index.html' }, { label: 'Blog', href: 'blog.html' }, { label: p.category }],
      '<div class="row row-wrap mt-6" style="gap:var(--sp-5);color:rgba(255,255,255,.8);font-size:var(--fs-sm)">' +
        '<span class="row" style="gap:8px">' + FS.icon('user') + FS.esc(p.author) + '</span>' +
        '<span class="row" style="gap:8px">' + FS.icon('calendar') + FS.date(p.at, 'long') + '</span>' +
        '<span class="row" style="gap:8px">' + FS.icon('clock') + p.read + ' min read</span>' +
        // Sits in the royal-blue hero, immediately after the read time. One
        // control only — it cycles Voice / Pause / Resume, and the separate
        // stop button beside it was removed at the client's request.
        (canSpeak
          ? '<span class="voice-group">' +
              '<button type="button" class="voice-pill" data-voice-toggle>' +
                '<span class="voice-ico" data-voice-icon>' + FS.icon('volume') + '</span>' +
                '<span data-voice-label>Voice</span></button>' +
            '</span>'
          : '') +
      '</div>');

    /* The articles an editor linked in the admin come first; if none were
       chosen the three most recent stand in so the rail is never empty. */
    var published = Store.posts('published');
    var related = (p.related || [])
      .map(function (slug) { return Store.post(slug); })
      .filter(function (x) { return x && x.slug !== p.slug && x.status === 'published'; });
    if (!related.length) {
      related = published.filter(function (x) { return x.slug !== p.slug; }).slice(0, 3);
    }

    var tags = String(p.keywords || '').split(',')
      .map(function (k) { return k.trim(); }).filter(Boolean).slice(0, 4);

    body.innerHTML =
      section(
        '<div class="split split--2-1" style="gap:var(--sp-8)">' +
          '<article>' +
            // .article-hero fixes the frame at 16:9 and crops to fill, so any
            // header image an admin uploads lands the same size on every post.
            '<img class="article-hero" src="' + FS.url(p.image) + '" alt="' + FS.esc(p.title) + '">' +
            '<div class="prose">' + p.body.map(function (para) { return '<p>' + paragraph(para) + '</p>'; }).join('') + '</div>' +
            (related.length
              ? '<div class="divider"></div>' +
                '<h4 class="mb-3">Read next</h4>' +
                '<ul class="inline-links">' + related.map(function (r) {
                  return '<li><a href="' + FS.url('blog-post.html?p=' + r.slug) + '">' + FS.esc(r.title) + '</a></li>';
                }).join('') + '</ul>'
              : '') +
            '<div class="divider"></div>' +
            '<div class="row row-wrap" style="gap:var(--sp-3)">' +
              '<span class="chip">' + FS.esc(p.category) + '</span>' +
              tags.map(function (t) { return '<span class="chip">' + FS.esc(t) + '</span>'; }).join('') +
            '</div>' +
          '</article>' +
          // No call-to-action card under the details any more — the page
          // already ends on one, and stacking two reads as filler.
          '<aside>' +
            '<div class="card"><div class="card-body">' +
              '<h4 class="mb-3">Article details</h4>' +
              '<dl class="dl">' +
                '<div><dt>Author</dt><dd>' + FS.esc(p.author) + '</dd></div>' +
                '<div><dt>Published</dt><dd>' + FS.date(p.at, 'long') + '</dd></div>' +
                '<div><dt>Category</dt><dd>' + FS.esc(p.category) + '</dd></div>' +
                '<div><dt>Reading time</dt><dd>' + p.read + ' minutes</dd></div>' +
                // Directly under the read time, as the second place to listen.
                (canSpeak
                  ? '<div><dt>Listen</dt><dd>' +
                      '<span class="voice-group">' +
                        '<button type="button" class="btn btn-sm btn-outline" data-voice-toggle>' +
                          '<span class="voice-ico" data-voice-icon>' + FS.icon('volume') + '</span>' +
                          '<span data-voice-label>Read aloud</span></button>' +
                      '</span></dd></div>'
                  : '') +
              '</dl>' +
            '</div></div>' +
          '</aside>' +
        '</div>') +

      section(headBlock('Keep reading') + '<div class="grid grid-3">' +
        related.slice(0, 3).map(postCard).join('') + '</div>',
        '', 'padding-top:0;background:var(--surface-2)') +
      ctaBlock();

    if (canSpeak) wireVoice([p.title].concat(p.body || []).join('\n\n'));
  }

  /**
   * Bind every read-aloud control on the page to one shared voice.
   * The hero button and the one in Article details stay in step because both
   * listen to the same FS.speech state rather than tracking their own.
   * @param {string} text the article, already flattened to plain text
   */
  function wireVoice(text) {
    var toggles = FS.$$('[data-voice-toggle]');
    if (!toggles.length) return;

    var LABEL = { idle: 'Voice', playing: 'Pause', paused: 'Resume' };
    var ICON = { idle: 'volume', playing: 'pause', paused: 'play' };

    function paint(status) {
      toggles.forEach(function (b) {
        var label = b.querySelector('[data-voice-label]');
        var ico = b.querySelector('[data-voice-icon]');
        // The sidebar button spells it out; the hero pill stays short.
        if (label) label.textContent = status === 'idle' && b.closest('.dl')
          ? 'Read aloud' : LABEL[status];
        if (ico) ico.innerHTML = FS.icon(ICON[status]);
        b.classList.toggle('is-active', status !== 'idle');
        b.setAttribute('aria-pressed', status === 'playing' ? 'true' : 'false');
      });
    }

    toggles.forEach(function (b) {
      b.addEventListener('click', function () { FS.speech.toggle(text); });
    });

    FS.speech.onChange(paint);
    paint(FS.speech.state());
  }

  /* ======================================================================
     Reviews
     ====================================================================== */

  function reviewsPage() {
    setSeo({
      title: 'Customer Reviews & Ratings | FleetSquad',
      description: 'Verified reviews from the fleet operators FleetSquad services every week — rated on turnaround, communication, workmanship and value.',
      keywords: 'fleetsquad reviews, mobile mechanic reviews, fleet maintenance testimonials',
      path: 'reviews'
    });
    var rs = Store.reviewStats();
    var order = FS.param('sort', 'newest');
    var list = Store.reviews('published');
    if (order === 'oldest') list = list.slice().reverse();
    if (order === 'highest') list = list.slice().sort(function (a, b) { return b.rating - a.rating; });

    body.innerHTML = section(
      '<div class="rating-summary mb-8">' +
        '<div class="rating-big"><strong>' + rs.average.toFixed(1) + '</strong>' +
          FS.stars(rs.average, 'stars--lg') +
          '<small>Based on ' + FS.num(rs.count) + ' verified reviews</small></div>' +
        '<div class="stack" style="gap:7px;flex:1 1 300px;max-width:420px;color:#f5a524">' +
          [5, 4, 3, 2, 1].map(function (star) {
            var n = rs.breakdown[star - 1] || 0;
            var pct = rs.count ? Math.round((n / rs.count) * 100) : 0;
            return '<div class="row" style="gap:10px"><span class="text-sm text-muted" style="width:12px">' + star + '</span>' +
              '<span class="stars">' + FS.icon('star') + '</span>' +
              '<span class="progress" style="flex:1 1 auto"><span style="width:' + pct + '%"></span></span>' +
              '<span class="text-xs text-dim" style="width:28px;text-align:right">' + n + '</span></div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="row-between row-wrap mb-6">' +
        '<div class="filters">' +
          ['newest', 'oldest', 'highest'].map(function (o) {
            return '<a class="filter-pill' + (o === order ? ' is-active' : '') + '" href="' +
              FS.url('reviews.html?sort=' + o) + '">' +
              ({ newest: 'Newest first', oldest: 'Oldest first', highest: 'Highest rated' })[o] + '</a>';
          }).join('') +
        '</div>' +
        '<button class="btn btn-primary" id="writeReview">' + FS.icon('edit') + 'Write a review</button>' +
      '</div>' +

      '<div class="grid grid-3" id="reviewList">' + list.map(function (r) {
        return '<article class="review-card">' + FS.stars(r.rating) +
          '<h4 class="mb-3">' + FS.esc(r.title) + '</h4>' +
          '<blockquote>' + FS.esc(r.body) + '</blockquote>' +
          '<div class="review-meta"><span class="avatar">' + FS.initials(r.name) + '</span>' +
          '<div><strong>' + FS.esc(r.name) + '</strong><small>' + FS.esc(r.company) + ' · ' + FS.date(r.at) + '</small></div></div>' +
        '</article>';
      }).join('') + '</div>'
    ) + ctaBlock();

    document.getElementById('writeReview').addEventListener('click', openReviewModal);
  }

  /** Review submission modal — reused by the customer portal. */
  function openReviewModal() {
    FS.modal({
      title: 'Write a review',
      subtitle: 'Tell other fleet operators how the service went.',
      body:
        '<form id="reviewForm" novalidate>' +
          '<div class="field"><span class="label">Your rating <span class="req">*</span></span>' +
            FS.starInput(0) + '<p class="error-text hidden" id="rateErr">Please choose a rating.</p></div>' +
          '<div class="field-row field-row-2 mb-4">' +
            '<div class="field"><label class="label" for="rvName">Your name <span class="req">*</span></label>' +
              '<input class="input" id="rvName" name="name" required></div>' +
            '<div class="field"><label class="label" for="rvCompany">Company <span class="req">*</span></label>' +
              '<input class="input" id="rvCompany" name="company" required></div>' +
          '</div>' +
          '<div class="field"><label class="label" for="rvTitle">Headline <span class="req">*</span></label>' +
            '<input class="input" id="rvTitle" name="title" placeholder="Saved us two full days of downtime" required></div>' +
          '<div class="field"><label class="label" for="rvBody">Your review <span class="req">*</span></label>' +
            '<textarea class="textarea" id="rvBody" name="body" required></textarea></div>' +
        '</form>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="rvSubmit">Submit review</button>',
      onMount: function (root, close) {
        root.querySelector('#rvSubmit').addEventListener('click', function () {
          var form = root.querySelector('#reviewForm');
          var rating = Number(root.querySelector('.star-input').dataset.value || 0);
          root.querySelector('#rateErr').classList.toggle('hidden', rating > 0);
          if (!FS.validate(form) || !rating) return;
          var f = FS.formData(form);
          Store.addReview({
            customerId: null, orderId: null,
            name: f.name, company: f.company,
            rating: rating, title: f.title, body: f.body
          });
          close();
          FS.toast('Thank you', 'Your review is pending moderation.', 'ok');
        });
      }
    });
  }
  FS.openReviewModal = openReviewModal;

  /* ======================================================================
     CMS pages
     ====================================================================== */

  function aboutPage() {
    applyCmsPage('about');
    body.innerHTML =
      section(
        '<div class="split split--2-1" style="gap:var(--sp-8)">' +
          // Written in Admin → CMS Pages → About Us.
          '<div class="prose">' + cmsProse('about') + '</div>' +
          '<div class="card"><div class="card-body">' +
            '<h4 class="mb-4">FleetSquad by the numbers</h4>' +
            // Label left, figure right, on the shared baseline .figure-row draws.
            '<div class="figure-list">' + D.stats.map(function (s) {
              return '<div class="figure-row"><span>' + FS.esc(s.label) + '</span>' +
                '<strong>' + (s.decimal ? s.value : FS.num(s.value)) + s.suffix + '</strong></div>';
            }).join('') + '</div>' +
            '<a class="btn btn-primary btn-block mt-5" href="' + FS.url(FS.data.links.estimate) + '">Get Estimate</a>' +
          '</div></div>' +
        '</div>') +

      section(headBlock('How we got here') +
        '<div class="grid grid-4">' + D.timelineValues.map(function (t) {
          return '<div class="card card-pad">' +
            '<span class="chip chip--active mb-3">' + t.year + '</span>' +
            '<h4 class="mb-2">' + FS.esc(t.title) + '</h4>' +
            '<p class="text-muted text-sm">' + FS.esc(t.text) + '</p></div>';
        }).join('') + '</div>', '', 'padding-top:0;background:var(--surface-2)') +

      section(headBlock('Why fleets choose FleetSquad') + featureGrid(D.whyPoints), '', 'padding-top:0') +
      ctaBlock();
  }

  function partnersPage() {
    applyCmsPage('partners');
    // The cards come from the store, so anything an admin adds or edits in
    // CMS Pages → Partners shows here on the next load.
    var partners = Store.partners();
    body.innerHTML =
      section(partners.length
        ? '<div class="grid grid-3">' + partners.map(function (p) {
            return '<div class="card card-pad text-center">' +
              (p.logo
                ? '<img class="partner-logo" src="' + FS.url(p.logo) + '" alt="' + FS.esc(p.name) + '" loading="lazy">'
                : '<span class="partner-logo partner-logo--empty">' + FS.esc(FS.initials(p.name)) + '</span>') +
              (p.type ? '<span class="chip mb-3">' + FS.esc(p.type) + '</span>' : '') +
              '<h3 class="mb-2">' + FS.esc(p.name) + '</h3>' +
              (p.text ? '<p class="text-muted text-sm">' + FS.esc(p.text) + '</p>' : '') + '</div>';
          }).join('') + '</div>'
        : '<div class="empty-state">' + FS.icon('users') +
          '<h4>No partners listed yet</h4><p>Partners added in the admin appear here.</p></div>') +

      section(headBlock('Partner with FleetSquad', 'Running a network that needs consistent mobile maintenance across multiple markets? Let us talk.') +
        '<div class="text-center"><a class="btn btn-primary btn-lg" href="' + FS.url('pages/contact.html') + '">Talk to partnerships</a></div>',
        '', 'padding-top:0;background:var(--surface-2)') +
      ctaBlock();
  }

  function careersPage() {
    applyCmsPage('careers');
    body.innerHTML =
      section(headBlock('Open roles', D.jobs.length + ' positions across our field, dispatch and operations teams.') +
        '<div class="stack">' + D.jobs.map(function (j) {
          return '<div class="card card-pad">' +
            '<div class="row-between row-wrap" style="gap:var(--sp-4)">' +
              '<div style="flex:1 1 320px;min-width:0">' +
                '<h3 class="mb-2">' + FS.esc(j.title) + '</h3>' +
                '<div class="row row-wrap mb-3" style="gap:8px">' +
                  '<span class="chip">' + FS.icon('briefcase') + FS.esc(j.dept) + '</span>' +
                  '<span class="chip">' + FS.icon('map-pin') + FS.esc(j.location) + '</span>' +
                  '<span class="chip chip--active">' + FS.esc(j.type) + '</span>' +
                '</div>' +
                '<p class="text-muted text-sm mb-0">' + FS.esc(j.text) + '</p>' +
              '</div>' +
              '<button class="btn btn-primary" data-apply="' + FS.esc(j.title) + '">Apply now</button>' +
            '</div></div>';
        }).join('') + '</div>') +

      section(headBlock('What we offer') + featureGrid([
        { icon: 'wallet', title: 'Competitive pay', text: 'Above-market hourly rates plus completion bonuses.' },
        { icon: 'truck', title: 'Your own unit', text: 'A fully equipped service van and tool package.' },
        { icon: 'calendar', title: 'Real schedules', text: 'Predictable routes, no unpaid on-call weeks.' },
        { icon: 'sparkles', title: 'Paid certification', text: 'We fund ASE certification and recertification.' }
      ]), '', 'padding-top:0;background:var(--surface-2)') +
      ctaBlock();

    body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-apply]');
      if (!btn) return;
      FS.modal({
        title: 'Apply: ' + btn.dataset.apply,
        subtitle: 'We reply to every application within five business days.',
        body:
          '<form id="applyForm" novalidate>' +
            '<div class="field-row field-row-2 mb-4">' +
              '<div class="field"><label class="label" for="apName">Full name <span class="req">*</span></label><input class="input" id="apName" name="name" required></div>' +
              '<div class="field"><label class="label" for="apPhone">Phone <span class="req">*</span></label><input class="input" id="apPhone" name="phone" required></div>' +
            '</div>' +
            '<div class="field"><label class="label" for="apEmail">Email <span class="req">*</span></label><input class="input" id="apEmail" name="email" type="email" required></div>' +
            '<div class="field"><label class="label" for="apCerts">Certifications</label><input class="input" id="apCerts" name="certs" placeholder="ASE Master, Diesel, HVAC…"></div>' +
            '<div class="field"><label class="label" for="apWhy">Why FleetSquad?</label><textarea class="textarea" id="apWhy" name="why"></textarea></div>' +
          '</form>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="apSend">Send application</button>',
        onMount: function (root, close) {
          root.querySelector('#apSend').addEventListener('click', function () {
            if (!FS.validate(root.querySelector('#applyForm'))) return;
            close();
            FS.toast('Application sent', 'Our recruiting team will be in touch.', 'ok');
          });
        }
      });
    });
  }

  function contactPage() {
    var page = applyCmsPage('contact');
    var intro = cmsProse('contact');
    body.innerHTML =
      (intro
        ? section('<div class="prose" style="max-width:78ch">' + intro + '</div>', '', 'padding-bottom:0')
        : '') +
      section(
        '<div class="split split--2-1" style="gap:var(--sp-8)">' +
          '<div class="card"><div class="card-body">' +
            '<h2 class="mb-2" style="font-size:var(--fs-xl)">Send us a message</h2>' +
            '<p class="text-muted mb-6">A coordinator replies within one business hour.</p>' +
            '<form id="contactForm" novalidate>' +
              '<div class="field-row field-row-2 mb-4">' +
                '<div class="field"><label class="label" for="cName">Name <span class="req">*</span></label><input class="input" id="cName" name="name" required></div>' +
                '<div class="field"><label class="label" for="cCompany">Company <span class="req">*</span></label><input class="input" id="cCompany" name="company" required></div>' +
              '</div>' +
              '<div class="field-row field-row-2 mb-4">' +
                '<div class="field"><label class="label" for="cEmail">Email <span class="req">*</span></label><input class="input" id="cEmail" name="email" type="email" required></div>' +
                '<div class="field"><label class="label" for="cPhone">Phone <span class="req">*</span></label><input class="input" id="cPhone" name="phone" type="tel" required></div>' +
              '</div>' +
              '<div class="field"><label class="label" for="cTopic">Topic</label>' +
                '<select class="select" id="cTopic" name="topic">' +
                  '<option>New fleet enquiry</option><option>Existing project</option>' +
                  '<option>Billing</option><option>Partnerships</option><option>Careers</option>' +
                '</select></div>' +
              '<div class="field"><label class="label" for="cMsg">Message <span class="req">*</span></label>' +
                '<textarea class="textarea" id="cMsg" name="message" required></textarea></div>' +
              '<button class="btn btn-primary btn-block" type="submit">Send message' + FS.icon('send') + '</button>' +
              '<p class="text-xs text-dim text-center mt-3 mb-0">Goes to ' +
                '<a href="mailto:' + FS.esc(C.contactEmail) + '">' + FS.esc(C.contactEmail) + '</a>' +
                ' — or write to us there directly.</p>' +
            '</form>' +
          '</div></div>' +
          '<div class="stack">' +
            contactCard('phone-ring', 'Call dispatch', C.phone, 'tel:' + C.phoneRaw, C.hours) +
            contactCard('mail', 'Email support', C.email, 'mailto:' + C.email, 'Replies within one business hour') +
            contactCard('map', 'Service areas', '16 states', FS.url('pages/service-areas.html'), '80+ metro areas covered') +
          '</div>' +
        '</div>') +
      // Address and label both come from the CMS; blank address, no map.
      mapBlock(page) + ctaBlock();

    document.getElementById('contactForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!FS.validate(e.target)) return;
      /* No mail server behind the prototype: the message is filed in this
         browser, addressed to the support desk, and read in Admin → Inbox. */
      Store.addMessage(FS.formData(e.target));
      e.target.reset();
      if (Store.lastWriteOk === false) {
        FS.toast('Message sent', 'Held for this visit only — this browser refused to store it.', 'warn');
        return;
      }
      FS.toast('Message sent', 'It is with ' + C.contactEmail + '. A coordinator will reply shortly.', 'ok');
    });
  }

  function faqsPage() {
    applyCmsPage('faqs');
    body.innerHTML =
      section(
        '<div style="max-width:820px;margin-inline:auto">' +
          Store.faqs().map(function (f, i) {
            return '<div class="faq-item' + (i === 0 ? ' is-open' : '') + '">' +
              '<button class="faq-q" data-accordion aria-expanded="' + (i === 0) + '">' +
                FS.esc(f.q) + FS.icon('plus') + '</button>' +
              '<div class="faq-a">' + FS.esc(f.a) + '</div></div>';
          }).join('') +
        '</div>') +
      section('<div class="card card-pad text-center">' +
        // Contact us only — the call button beside it was removed.
        '<h3 class="mb-2">Still have a question?</h3>' +
        '<p class="text-muted mb-6">Send us a message — we answer every one.</p>' +
        '<div class="row row-wrap" style="gap:var(--sp-3);justify-content:center">' +
          '<a class="btn btn-primary" href="' + FS.url('pages/contact.html') + '">Contact us</a>' +
        '</div></div>', '', 'padding-top:0') +
      ctaBlock();
  }

  /* Coverage comes out of the store, so a state switched on or off in
     Admin → Service Areas changes this page immediately. */
  function serviceAreasPage() {
    var page = applyCmsPage('service-areas') || {};
    var allAreas = Store.serviceAreas();
    var covered = Store.serviceAreas(true);
    var areaByCode = {};
    allAreas.forEach(function (area) { areaByCode[area.code] = area; });
    var mapPositions = {
      AK:[1,1], WA:[1,3], MT:[1,5], ND:[1,7], MN:[1,8], WI:[1,9], MI:[1,10], VT:[1,11], NH:[1,12], ME:[1,13],
      OR:[2,3], ID:[2,4], WY:[2,5], SD:[2,7], IA:[2,8], IL:[2,9], IN:[2,10], OH:[2,11], PA:[2,12], NY:[2,13], MA:[2,14],
      NV:[3,3], UT:[3,4], CO:[3,5], NE:[3,7], MO:[3,8], KY:[3,10], WV:[3,11], VA:[3,12], MD:[3,13], NJ:[3,14], CT:[3,15], RI:[3,16],
      CA:[4,3], AZ:[4,4], NM:[4,5], KS:[4,7], AR:[4,8], TN:[4,10], NC:[4,12], DE:[4,13],
      HI:[5,1], TX:[5,6], OK:[5,7], LA:[5,8], MS:[5,9], AL:[5,10], GA:[5,11], SC:[5,12],
      FL:[6,12]
    };
    var cities = covered.reduce(function (s, a) { return s + a.cities.length; }, 0);
    var counties = covered.reduce(function (s, a) { return s + (a.counties || []).length; }, 0);

    // applyCmsPage above already wrote the record; this repeats it because the
    // counts below are computed first. Same source, so the same values.
    setSeo({
      title: page.metaTitle || 'Service Areas & Coverage Map | FleetSquad',
      description: page.metaDescription || 'See every state, county and metro FleetSquad covers.',
      keywords: page.keywords,
      path: page.path || 'service-areas/'
    });

    body.innerHTML =
      section(
        '<div class="grid grid-3 mb-8">' +
          kpi(covered.length, 'States covered') +
          kpi(counties, 'Counties served') +
          kpi(cities, 'Cities and metros') +
        '</div>' +

        /* Check-your-area box — the same lookup the homepage zip widget uses. */
        '<div class="card card-pad mb-8" style="max-width:560px;margin-inline:auto">' +
          '<h3 class="mb-2">Check if we are in your area</h3>' +
          '<p class="text-muted text-sm mb-4">Enter a city, county or state.</p>' +
          '<form id="areaCheck" class="row" style="gap:var(--sp-3);flex-wrap:nowrap" novalidate>' +
            '<div class="input-icon" style="flex:1 1 auto">' + FS.icon('map-pin') +
            '<input class="input" id="areaInput" placeholder="Dallas, Maricopa, Georgia…" aria-label="Your city, county or state"></div>' +
            '<button class="btn btn-primary" type="submit">Check</button>' +
          '</form>' +
          '<div id="areaResult" role="status"></div>' +
        '</div>' +

        '<div class="coverage-map card card-pad mb-8">' +
          '<div class="row-between row-wrap mb-5" style="gap:var(--sp-4)">' +
            '<div><h3 class="mb-1">Our United States coverage</h3>' +
              '<p class="text-muted text-sm mb-0">Hover over a state, or tap it, to see cities and counties.</p></div>' +
            '<div class="coverage-legend" aria-label="Map legend">' +
              '<span><i class="is-covered"></i>We service</span>' +
              '<span><i class="is-coming"></i>Not covered yet</span>' +
            '</div>' +
          '</div>' +
          '<div class="usa-map-scroll"><div class="usa-map" role="group" aria-label="United States service coverage">' +
            D.usStates.map(function (state) {
              var code = state[0];
              var area = areaByCode[code];
              var coveredHere = !!(area && area.active);
              var pos = mapPositions[code];
              return '<button type="button" class="usa-state ' + (coveredHere ? 'is-covered' : 'is-coming') + '" ' +
                'data-map-state="' + code + '" style="--map-row:' + pos[0] + ';--map-col:' + pos[1] + '" ' +
                'aria-label="' + FS.esc(state[1]) + (coveredHere ? ', serviced' : ', not covered yet') + '">' +
                '<strong>' + code + '</strong><span>' + FS.esc(state[1]) + '</span></button>';
            }).join('') +
          '</div></div>' +
          '<div class="coverage-detail" id="coverageDetail" aria-live="polite"></div>' +
        '</div>'
        /* The page ends on the map. The filter box, the per-state card grid
           and the "do not see your city" line below it were removed at the
           client's request — the map already lists every city and county for
           whichever state you hover, so the grid repeated it. */
      ) + ctaBlock();

    wireCheck();
    wireMap();

    function kpi(value, label) {
      return '<div class="kpi text-center"><div class="kpi-value" style="font-size:2.2rem">' + value + '</div>' +
        '<div class="kpi-label mt-2">' + label + '</div></div>';
    }

    /* Highlight the matching state card and say what was matched. */
    function wireCheck() {
      var form = document.getElementById('areaCheck');
      var input = document.getElementById('areaInput');
      var out = document.getElementById('areaResult');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var query = input.value.trim();
        if (!query) return;

        var hit = Store.lookupArea(query);

        if (!hit) {
          out.innerHTML = '<div class="alert alert--warn mt-4">' + FS.icon('alert-triangle') +
            '<div>We do not list <strong>' + FS.esc(query) + '</strong> yet. ' +
            'Call ' + FS.esc(C.phone) + ' — we add markets every month and often cover nearby.</div></div>';
          return;
        }

        var what = hit.city ? hit.city + ', ' + hit.area.code
                 : hit.county ? hit.county + ' County, ' + hit.area.code
                 : hit.area.state;
        out.innerHTML = '<div class="alert alert--ok mt-4">' + FS.icon('check-circle') +
          '<div>Yes — we service <strong>' + FS.esc(what) + '</strong>. ' +
          FS.esc(hit.area.state) + ' is fully covered across ' + (hit.area.counties || []).length +
          ' counties.</div></div>';

        // Open that state on the map, which is now where the detail lives.
        var stateButton = document.querySelector('[data-map-state="' + hit.area.code + '"]');
        if (stateButton) stateButton.click();
      });
    }

    function wireMap() {
      var detail = document.getElementById('coverageDetail');
      var buttons = FS.$$('[data-map-state]');

      function show(code) {
        var state = D.usStates.filter(function (item) { return item[0] === code; })[0];
        var area = areaByCode[code];
        var active = !!(area && area.active);
        buttons.forEach(function (button) {
          button.classList.toggle('is-selected', button.dataset.mapState === code);
        });
        detail.innerHTML = active
          ? '<div class="coverage-detail-head"><div><span class="badge badge--ok">We service this state</span>' +
              '<h4>' + FS.esc(state[1]) + '</h4></div><strong>' + FS.esc(code) + '</strong></div>' +
            '<div class="coverage-detail-grid"><div><span>Cities and metros</span><p>' +
              FS.esc(area.cities.join(', ') || 'Coverage available statewide') + '</p></div>' +
              '<div><span>Counties</span><p>' +
              FS.esc((area.counties || []).join(', ') || 'Contact us for county availability') + '</p></div></div>'
          : '<div class="coverage-detail-head"><div><span class="badge badge--neutral">Not covered yet</span>' +
              '<h4>' + FS.esc(state[1]) + '</h4></div><strong>' + FS.esc(code) + '</strong></div>' +
            '<p class="text-muted mb-0">We do not currently list service cities or counties in this state. ' +
              '<a href="' + FS.url('pages/contact.html') + '">Tell us where you need coverage</a>.</p>';
      }

      buttons.forEach(function (button) {
        button.addEventListener('mouseenter', function () { show(button.dataset.mapState); });
        button.addEventListener('focus', function () { show(button.dataset.mapState); });
        button.addEventListener('click', function () { show(button.dataset.mapState); });
      });
      show(covered[0] ? covered[0].code : 'AL');
    }

  }

  /* Privacy and Terms share a template; both bodies are written in the CMS. */
  function legalPage() {
    var slug = /privacy/.test(window.location.pathname) ? 'privacy' : 'terms';
    var page = applyCmsPage(slug);

    body.innerHTML = section(
      '<div class="prose" style="max-width:78ch;margin-inline:auto">' +
        (page && page.showUpdated !== false
          ? '<p class="text-dim text-sm">Last updated ' + FS.date(page && page.updated, 'long') + '</p>'
          : '') +
        (cmsProse(slug) ||
          '<p class="text-dim">This page has not been written yet.</p>') +
      '</div>');
  }

  /* ======================================================================
     Dispatch
     ====================================================================== */

  var ROUTES = {
    'services-index':  servicesIndex,
    'service-detail':  serviceDetail,
    'industries-index':industriesIndex,
    'industry-detail': industryDetail,
    'vehicles-index':  vehiclesIndex,
    'vehicle-detail':  vehicleDetail,
    'blog-list':       blogList,
    'blog-post':       blogPost,
    'reviews':         reviewsPage,
    'about':           aboutPage,
    'partners':        partnersPage,
    'careers':         careersPage,
    'contact':         contactPage,
    'faqs':            faqsPage,
    'service-areas':   serviceAreasPage,
    'legal':           legalPage
  };

  function init() {
    var route = ROUTES[document.body.dataset.page];
    if (route) route();
    FS.hydrateIcons(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
