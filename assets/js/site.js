/* ==========================================================================
   FleetSquad — Public site chrome
   Injects the header, the slide-in drawer and the footer into every marketing
   page so the navigation only has to be maintained in one place (FS.data.nav).

   A page opts in with:
     <div data-site-header></div>  … and …  <div data-site-footer></div>
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var C = FS.data.company;

  /* ------------------------------------------------------------------------
     Brand lockup
     ------------------------------------------------------------------------ */
  /**
   * The wordmark is two words, not one: "FLEET" stays white (navy on light
   * surfaces) and "SQUAD" carries the blue.
   * @param {boolean} [dark]  render for a light background
   * @param {string}  [extra] extra class names for the anchor
   * @param {boolean} [noTag] drop the "Mobile Fleet Maintenance" strapline
   */
  function brand(dark, extra, noTag) {
    return '<a class="brand' + (dark ? ' brand--dark' : '') + (extra ? ' ' + extra : '') +
      '" href="' + FS.url('index.html') + '" aria-label="FleetSquad home">' +
      '<img class="brand-mark" src="' + FS.url('assets/img/logo-shield.png') + '" alt="" width="256" height="416">' +
      '<span class="brand-text">' +
        '<span class="brand-word">FLEET<i>SQUAD</i></span>' +
        (noTag ? '' : '<span class="brand-tag">Mobile<br>Fleet Maintenance</span>') +
      '</span>' +
    '</a>';
  }

  /* ------------------------------------------------------------------------
     Header
     ------------------------------------------------------------------------ */
  function header() {
    var desktopNav = FS.data.nav.map(function (group) {
      return '<div class="nav-item">' +
        '<button class="nav-link" aria-haspopup="true" aria-expanded="false">' +
          FS.esc(group.label) + FS.icon('chevron-down') +
        '</button>' +
        '<div class="nav-panel">' +
          group.children.map(function (c) {
            return '<a href="' + FS.url(c.href) + '">' + FS.esc(c.label) + '</a>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('');

    return '<header class="site-header">' +
      '<div class="container">' +
        '<a class="header-phone" href="tel:' + C.phoneRaw + '">' + FS.esc(C.phone) + '</a>' +
        brand() +
        '<nav class="nav-desktop" aria-label="Primary">' + desktopNav + '</nav>' +
        '<div class="header-actions">' +
          '<button class="hamburger" data-drawer-open aria-label="Open menu" aria-controls="fs-drawer" aria-expanded="false">' +
            '<i></i><i></i><i></i>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</header>';
  }

  /* ------------------------------------------------------------------------
     Drawer — full navigation tree with expandable groups
     ------------------------------------------------------------------------ */
  function drawer() {
    var groups = FS.data.nav.map(function (g) {
      return '<div class="drawer-group">' +
        '<button class="drawer-toggle" data-accordion aria-expanded="false">' +
          FS.esc(g.label) + FS.icon('chevron-down') +
        '</button>' +
        '<div class="drawer-sub">' +
          g.children.map(function (c) {
            return '<a href="' + FS.url(c.href) + '">' + FS.esc(c.label) + '</a>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('');

    /* Layout follows the client's "navi bar updates" reference: the lockup and
       the phone number stack centred at the top, Get Estimate sits directly
       beneath them, the five groups run as divided accordions, and Login is
       pinned to the bottom. */
    return '<div class="drawer-scrim" data-drawer-close></div>' +
      '<aside class="drawer" id="fs-drawer" aria-label="Site menu">' +
        '<div class="drawer-head">' +
          '<button class="drawer-close" data-drawer-close aria-label="Close menu">' + FS.icon('close') + '</button>' +
          brand(false, 'brand--drawer', true) +
          '<a class="drawer-phone" href="tel:' + C.phoneRaw + '">' + FS.esc(C.phone) + '</a>' +
        '</div>' +
        '<div class="drawer-body">' +
          '<a class="btn btn-primary btn-block btn-lg" href="' + FS.url('get-estimate.html') + '">Get Estimate</a>' +
          '<div class="drawer-groups">' + groups + '</div>' +
        '</div>' +
        '<div class="drawer-foot">' +
          '<a class="btn btn-outline-light btn-block" href="' + FS.url('login.html') + '">Login</a>' +
        '</div>' +
      '</aside>';
  }

  /* ------------------------------------------------------------------------
     Footer
     ------------------------------------------------------------------------ */
  function footer() {
    var services = FS.data.services.map(function (s) {
      return '<li><a href="' + FS.url('service.html?s=' + s.slug) + '">' + FS.esc(s.short) + '</a></li>';
    }).join('');

    var company = [
      ['About Us', 'pages/about.html'],
      ['Careers', 'pages/careers.html'],
      ['Partners', 'pages/partners.html'],
      ['Service Area', 'pages/service-areas.html'],
      ['Contact Us', 'pages/contact.html']
    ].map(function (i) {
      return '<li><a href="' + FS.url(i[1]) + '">' + i[0] + '</a></li>';
    }).join('');

    var resources = [
      ['Blog', 'blog.html'],
      ['FAQS', 'pages/faqs.html'],
      ['Reviews', 'reviews.html']
    ].map(function (i) {
      return '<li><a href="' + FS.url(i[1]) + '">' + i[0] + '</a></li>';
    }).join('');

    return '<footer class="site-footer">' +
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-about">' +
            brand() +
            '<p>Mobile fleet maintenance powered by ASE Master Techs. We come to you so your fleet keeps moving.</p>' +
            '<div class="footer-social">' +
              C.social.map(function (s) {
                return '<a href="' + s.href + '" target="_blank" rel="noopener" ' +
                  'aria-label="FleetSquad on ' + FS.esc(s.label) + '">' + FS.icon(s.icon) + '</a>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="footer-col"><h5>Services</h5><ul>' + services + '</ul></div>' +
          '<div class="footer-col"><h5>Company</h5><ul>' + company + '</ul></div>' +
          '<div class="footer-col"><h5>Resources</h5><ul>' + resources + '</ul></div>' +
          '<div class="footer-col"><h5>Contact</h5>' +
            '<ul class="footer-contact">' +
              '<li>' + FS.icon('phone-ring') + '<a href="tel:' + C.phoneRaw + '">' + FS.esc(C.phoneShort) + '</a></li>' +
              '<li>' + FS.icon('mail') + '<a href="mailto:' + C.email + '">' + FS.esc(C.email) + '</a></li>' +
              '<li>' + FS.icon('globe') + '<span>' + FS.esc(C.website) + '</span></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom"><div class="container">' +
        '<span>&copy; ' + C.year + ' FleetSquad.com. All rights reserved.</span>' +
        '<span>' + FS.esc(C.parent) + '</span>' +
        '<span class="footer-bottom-links">' +
          '<a href="' + FS.url('pages/privacy.html') + '">Privacy Policy</a>' +
          '<a href="' + FS.url('pages/terms.html') + '">Terms of Service</a>' +
        '</span>' +
      '</div></div>' +
    '</footer>';
  }

  /* ------------------------------------------------------------------------
     Mount + behaviour
     ------------------------------------------------------------------------ */
  function mount() {
    var hostHeader = document.querySelector('[data-site-header]');
    if (hostHeader) hostHeader.outerHTML = header() + drawer();

    var hostFooter = document.querySelector('[data-site-footer]');
    if (hostFooter) hostFooter.outerHTML = footer();

    /* Drawer open / close */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-drawer-open]')) {
        document.body.classList.add('drawer-open');
        var btn = document.querySelector('[data-drawer-open]');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      } else if (e.target.closest('[data-drawer-close]')) {
        closeDrawer();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    function closeDrawer() {
      document.body.classList.remove('drawer-open');
      var btn = document.querySelector('[data-drawer-open]');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    /* Mark the current section in the desktop nav. */
    var here = window.location.pathname.split('/').pop();
    FS.$$('.nav-panel a').forEach(function (a) {
      if (a.getAttribute('href').indexOf(here) > -1 && here) {
        var item = a.closest('.nav-item');
        if (item) item.querySelector('.nav-link').style.color = 'var(--blue-500)';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})(window, document);
