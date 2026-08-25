/* ==========================================================================
   FleetSquad — Dashboard shell
   Renders the sidebar and topbar for whichever role the page declares:
     <body class="dash" data-role="admin" data-view="orders">
   The sidebar contents change per role; the chrome and behaviour do not.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var Store = FS.store;

  /* ------------------------------------------------------------------------
     Per-role navigation
     ------------------------------------------------------------------------ */
  var NAV = {
    admin: {
      label: 'Administrator',
      home: 'admin/index.html',
      groups: [
        { title: 'Operations', items: [
          { view: 'overview',      label: 'Dashboard',     icon: 'grid',        href: 'admin/index.html' },
          { view: 'orders',        label: 'Orders',        icon: 'list',        href: 'admin/orders.html', count: 'orders' },
          { view: 'new-sale',      label: 'New Sale',      icon: 'plus',        href: 'admin/new-sale.html' }
        ] },
        { title: 'People', items: [
          { view: 'users',         label: 'All Users',     icon: 'users',       href: 'admin/users.html' },
          { view: 'customers',     label: 'Customers',     icon: 'briefcase',   href: 'admin/customers.html' },
          { view: 'mechanics',     label: 'Mechanics',     icon: 'wrench',      href: 'admin/mechanics.html' }
        ] },
        { title: 'Money', items: [
          { view: 'payments',      label: 'Payments',      icon: 'credit-card', href: 'admin/payments.html' }
        ] },
        { title: 'Content', items: [
          { view: 'blog',          label: 'Blog',          icon: 'edit',        href: 'admin/blog.html' },
          { view: 'service-areas', label: 'Service Areas', icon: 'map',         href: 'admin/service-areas.html' },
          { view: 'reviews',       label: 'Reviews',       icon: 'review',      href: 'admin/reviews.html', count: 'pendingReviews' },
          { view: 'notifications', label: 'Notifications', icon: 'bell',        href: 'admin/notifications.html', count: 'unread' },
          { view: 'cms',           label: 'CMS Pages',     icon: 'file-text',   href: 'admin/cms.html' }
        ] },
        { title: 'System', items: [
          { view: 'settings',      label: 'Settings',      icon: 'settings',    href: 'admin/settings.html' }
        ] }
      ]
    },
    manager: {
      label: 'Fleet Manager',
      home: 'manager/index.html',
      groups: [
        { title: 'Work', items: [
          { view: 'overview',      label: 'Dashboard',     icon: 'grid',        href: 'manager/index.html' },
          { view: 'projects',      label: 'My Projects',   icon: 'list',        href: 'manager/projects.html', count: 'orders' }
        ] },
        { title: 'Money', items: [
          { view: 'payouts',       label: 'Mechanic Payouts', icon: 'wallet',   href: 'manager/payouts.html' }
        ] },
        { title: 'People', items: [
          { view: 'users',         label: 'Users',         icon: 'users',       href: 'manager/users.html' }
        ] },
        { title: 'Inbox', items: [
          { view: 'notifications', label: 'Notifications', icon: 'bell',        href: 'manager/notifications.html', count: 'unread' }
        ] }
      ]
    },
    customer: {
      label: 'Fleet Customer',
      home: 'customer/index.html',
      groups: [
        { title: 'My Fleet', items: [
          { view: 'overview',      label: 'Dashboard',     icon: 'grid',        href: 'customer/index.html' },
          { view: 'projects',      label: 'My Projects',   icon: 'truck',       href: 'customer/projects.html', count: 'orders' }
        ] },
        { title: 'Billing', items: [
          { view: 'invoices',      label: 'Invoices',      icon: 'receipt',     href: 'customer/invoices.html' }
        ] },
        { title: 'Feedback', items: [
          { view: 'reviews',       label: 'My Reviews',    icon: 'review',      href: 'customer/reviews.html' },
          { view: 'notifications', label: 'Notifications', icon: 'bell',        href: 'customer/notifications.html', count: 'unread' }
        ] }
      ]
    },
    mechanic: {
      label: 'Technician',
      home: 'mechanic/index.html',
      groups: [
        { title: 'Work', items: [
          { view: 'overview',      label: 'Dashboard',     icon: 'grid',        href: 'mechanic/index.html' },
          { view: 'jobs',          label: 'My Jobs',       icon: 'truck-wrench',href: 'mechanic/jobs.html', count: 'orders' }
        ] },
        { title: 'Money', items: [
          { view: 'payments',      label: 'Payment History', icon: 'wallet',    href: 'mechanic/payments.html' }
        ] },
        { title: 'Inbox', items: [
          { view: 'notifications', label: 'Notifications', icon: 'bell',        href: 'mechanic/notifications.html', count: 'unread' }
        ] }
      ]
    }
  };

  var role = document.body.dataset.role;
  var view = document.body.dataset.view;
  // Sub-screens keep their parent's sidebar item highlighted.
  var VIEW_PARENT = { 'blog-edit': 'blog' };
  var navView = VIEW_PARENT[view] || view;
  var config = NAV[role];
  if (!config) return;

  /* Sign the visitor in as this role so the prototype is always clickable. */
  var session = Store.requireRole(role);
  var refId = session.refId;

  /* Counts shown as pills next to the sidebar links. */
  function counts() {
    var mine = Store.ordersFor(role, refId);
    return {
      orders: mine.filter(function (o) { return o.status !== 'completed' && o.status !== 'canceled'; }).length,
      unread: Store.unreadCount(role),
      pendingReviews: Store.reviews('pending').length
    };
  }

  /* ------------------------------------------------------------------------
     Sidebar
     ------------------------------------------------------------------------ */
  function sidebar() {
    var n = counts();
    var groups = config.groups.map(function (g) {
      return '<div class="sidebar-section">' + FS.esc(g.title) + '</div>' +
        g.items.map(function (i) {
          var pill = i.count && n[i.count] ? '<span class="count">' + n[i.count] + '</span>' : '';
          return '<a class="sidebar-link' + (i.view === navView ? ' is-active' : '') + '" href="' + FS.url(i.href) + '">' +
            FS.icon(i.icon) + '<span>' + FS.esc(i.label) + '</span>' + pill + '</a>';
        }).join('');
    }).join('');

    return '<div class="sidebar-scrim" data-sidebar-close></div>' +
      '<aside class="sidebar">' +
        '<div class="sidebar-head">' +
          '<a class="brand" href="' + FS.url(config.home) + '">' +
            '<img class="brand-mark" src="' + FS.url('assets/img/logo-shield.png') + '" alt="">' +
            '<span class="brand-text"><span class="brand-word">FLEET<i>SQUAD</i></span></span>' +
          '</a>' +
          '<button class="sidebar-close btn-icon btn-icon--bare" data-sidebar-close aria-label="Close menu" style="color:#fff">' +
            FS.icon('close') + '</button>' +
        '</div>' +

        '<div class="sidebar-role">' +
          '<span class="avatar">' + FS.initials(session.name) + '</span>' +
          '<div style="min-width:0">' +
            '<strong>' + FS.esc(session.name) + '</strong>' +
            '<small>' + FS.esc(config.label) + '</small>' +
          '</div>' +
        '</div>' +

        '<nav class="sidebar-nav" aria-label="Dashboard">' + groups + '</nav>' +

        '<div class="sidebar-foot">' +
          '<a class="sidebar-link" href="' + FS.url('index.html') + '">' + FS.icon('external') + '<span>View website</span></a>' +
          '<a class="sidebar-link" href="' + FS.url('login.html') + '" data-logout>' + FS.icon('log-out') + '<span>Sign out</span></a>' +
        '</div>' +
      '</aside>';
  }

  /* ------------------------------------------------------------------------
     Topbar
     ------------------------------------------------------------------------ */
  function topbar(title, subtitle) {
    var unread = Store.unreadCount(role);
    var notes = Store.notifications(role).slice(0, 5);

    return '<header class="topbar">' +
      '<button class="btn-icon btn-icon--bare show-mobile" data-sidebar-open aria-label="Open menu" ' +
        'style="display:inline-flex">' + FS.icon('menu') + '</button>' +

      '<div class="topbar-title">' +
        '<h1>' + FS.esc(title) + '</h1>' +
        (subtitle ? '<p>' + FS.esc(subtitle) + '</p>' : '') +
      '</div>' +

      '<div class="spacer"></div>' +

      '<div class="topbar-search input-icon">' + FS.icon('search') +
        '<input class="input" id="globalSearch" placeholder="Search projects, customers…" aria-label="Search">' +
      '</div>' +

      '<div class="dropdown">' +
        '<button class="btn-icon icon-btn-badge" data-dropdown aria-label="Notifications">' +
          FS.icon('bell') + (unread ? '<b>' + unread + '</b>' : '') +
        '</button>' +
        '<div class="dropdown-menu" style="min-width:320px;max-width:min(380px,90vw)">' +
          '<div class="row-between" style="padding:8px 12px">' +
            '<strong class="text-sm">Notifications</strong>' +
            '<button class="text-xs text-blue text-bold" data-read-all>Mark all read</button>' +
          '</div>' +
          '<div class="dropdown-sep"></div>' +
          (notes.length ? notes.map(function (nt) {
            return '<a href="' + FS.url(role + '/notifications.html') + '" style="align-items:flex-start">' +
              FS.icon(nt.channel === 'sms' ? 'message' : 'mail') +
              '<span style="min-width:0"><strong class="text-sm" style="display:block;color:var(--ink-900)">' + FS.esc(nt.title) + '</strong>' +
              '<small class="text-xs text-dim">' + FS.ago(nt.at) + '</small></span></a>';
          }).join('') : '<div class="text-center text-dim text-sm" style="padding:20px">Nothing new</div>') +
          '<div class="dropdown-sep"></div>' +
          '<a href="' + FS.url(role + '/notifications.html') + '" class="text-blue text-bold">View all notifications</a>' +
        '</div>' +
      '</div>' +

      '<div class="dropdown">' +
        '<button class="row" data-dropdown aria-label="Account menu" style="gap:9px">' +
          '<span class="avatar avatar--sm avatar--navy">' + FS.initials(session.name) + '</span>' +
          FS.icon('chevron-down', 'show-desktop') +
        '</button>' +
        '<div class="dropdown-menu">' +
          '<div style="padding:9px 12px">' +
            '<strong class="text-sm" style="display:block;color:var(--ink-900)">' + FS.esc(session.name) + '</strong>' +
            '<small class="text-xs text-dim">' + FS.esc(session.email) + '</small>' +
          '</div>' +
          '<div class="dropdown-sep"></div>' +
          '<div class="sidebar-section" style="color:var(--ink-400);padding:6px 12px 4px">Switch demo role</div>' +
          ['admin', 'manager', 'customer', 'mechanic'].map(function (r) {
            return '<a href="' + FS.url(NAV[r].home) + '" data-switch="' + r + '">' +
              FS.icon(r === role ? 'check' : 'user') + FS.esc(NAV[r].label) + '</a>';
          }).join('') +
          '<div class="dropdown-sep"></div>' +
          '<button data-reset>' + FS.icon('refresh') + 'Reset demo data</button>' +
          '<a href="' + FS.url('login.html') + '" class="is-danger" data-logout>' + FS.icon('log-out') + 'Sign out</a>' +
        '</div>' +
      '</div>' +
    '</header>';
  }

  /* ------------------------------------------------------------------------
     Mount
     ------------------------------------------------------------------------ */
  function mount() {
    var host = document.querySelector('[data-dash-shell]');
    if (!host) return;

    var title = host.dataset.title || 'Dashboard';
    var subtitle = host.dataset.subtitle || '';

    // The shell wraps whatever the page already put in <main>.
    var main = document.getElementById('dashMain');
    host.outerHTML = sidebar();
    if (main) main.insertAdjacentHTML('afterbegin', topbar(title, subtitle));

    /* While an admin or manager is viewing someone else's portal, a bar stays
       on screen so it is never ambiguous whose account is open. */
    if (Store.isImpersonating()) {
      var boss = Store.impersonator();
      document.body.classList.add('is-impersonating');
      document.body.insertAdjacentHTML('afterbegin',
        '<div class="impersonation-bar">' + FS.icon('eye') +
          '<span>Viewing as <strong>' + FS.esc(session.name) + '</strong> (' + FS.esc(config.label) + ')' +
          ' — signed in as ' + FS.esc(boss.name) + '</span>' +
          '<button class="btn btn-xs btn-outline-light" data-stop-impersonating>Back to my account</button>' +
        '</div>');
    }

    /* Sidebar open / close on small screens */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-sidebar-open]')) document.body.classList.add('sidebar-open');
      else if (e.target.closest('[data-sidebar-close]')) document.body.classList.remove('sidebar-open');

      if (e.target.closest('[data-stop-impersonating]')) {
        var back = Store.stopImpersonating();
        window.location.href = FS.url(NAV[back.role].home);
        return;
      }

      if (e.target.closest('[data-read-all]')) {
        Store.markAllRead(role);
        FS.toast('Notifications cleared', 'All marked as read.', 'ok');
        setTimeout(function () { window.location.reload(); }, 500);
      }

      var sw = e.target.closest('[data-switch]');
      if (sw) Store.login(sw.dataset.switch);

      if (e.target.closest('[data-logout]')) Store.logout();

      if (e.target.closest('[data-reset]')) {
        e.preventDefault();
        FS.confirm('Reset demo data?',
          'Every change you made in this prototype will be discarded and the sample data restored.',
          function () { Store.reset(); window.location.reload(); }, true);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') document.body.classList.remove('sidebar-open');
    });

    /* Global search jumps to the relevant list screen. */
    var search = document.getElementById('globalSearch');
    if (search) {
      search.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var q = search.value.trim();
        if (!q) return;
        var target = role === 'admin' ? 'admin/orders.html'
                   : role === 'manager' ? 'manager/projects.html'
                   : role === 'mechanic' ? 'mechanic/jobs.html'
                   : 'customer/projects.html';
        window.location.href = FS.url(target + '?q=' + encodeURIComponent(q));
      });
    }

    FS.hydrateIcons(document);
  }

  /* Expose the resolved session for the per-role page scripts. */
  FS.shell = { role: role, view: view, session: session, refId: refId, nav: NAV };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
