/* ==========================================================================
   FleetSquad — Admin dashboard
   Views: overview · orders · order-detail · new-sale · customers · mechanics
          payments · reviews · notifications · cms
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var Store = FS.store;
  var Dash = FS.dash;
  var host = document.getElementById('dashBody');

  /* ======================================================================
     Overview
     ====================================================================== */

  function overview() {
    var m = Store.metrics();
    var orders = Store.orders();

    var kpis = [
      { icon: 'users',           tone: '',       label: 'Total Fleet Customers', value: FS.num(m.customers),        delta: '+12% MoM' },
      { icon: 'truck-wrench',    tone: 'navy',   label: 'Active Projects',       value: FS.num(m.activeProjects),   delta: m.openCount + ' unassigned', deltaDir: 'flat' },
      { icon: 'check-circle',    tone: 'ok',     label: 'Completed Vehicles',    value: FS.num(m.completedVehicles),delta: '+8% MoM' },
      { icon: 'clipboard-dollar',tone: 'warn',   label: 'Pending Payments',      value: FS.money(m.pendingPayments),delta: m.waitingCount + ' awaiting', deltaDir: 'flat' },
      { icon: 'review',          tone: '',       label: 'Reviews',               value: FS.num(m.reviews),          delta: m.rating.toFixed(1) + ' avg rating', deltaDir: 'up' },
      { icon: 'dollar',          tone: 'ok',     label: 'Revenue',               value: FS.money(m.revenue),        delta: '+18% MoM' }
    ];

    var attention = orders.filter(function (o) {
      return o.status === 'needs-manager' || o.status === 'open' || o.status === 'waiting-payment';
    }).slice(0, 6);

    var activity = [];
    orders.forEach(function (o) {
      (o.timeline || []).forEach(function (t) {
        activity.push({ at: t.at, who: t.who, icon: iconForEvent(t.text),
          text: FS.esc(t.text) + ' — <a href="' + FS.url('admin/order-details.html?id=' + o.id) + '">' + o.id + '</a>' });
      });
    });
    activity.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });

    host.innerHTML =
      Dash.kpiGrid(kpis) +

      '<div class="dash-grid dash-grid--2-1">' +
        '<div class="card">' +
          '<div class="card-head"><div><h3>Revenue</h3>' +
            '<p class="text-sm text-muted mb-0">Last six months, all accounts</p></div>' +
            '<span class="badge badge--ok badge--plain">+18% MoM</span></div>' +
          '<div class="card-body">' + Dash.bars(Store.revenueSeries()) + '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><h3>Recent activity</h3></div>' +
          '<div class="card-body" style="max-height:330px;overflow-y:auto">' +
            Dash.feed(activity.slice(0, 12)) + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card mt-5">' +
        '<div class="card-head"><div><h3>Needs attention</h3>' +
          '<p class="text-sm text-muted mb-0">Unassigned, manager-flagged and awaiting payment</p></div>' +
          '<a class="btn btn-sm btn-outline" href="' + FS.url('admin/orders.html') + '">All orders</a></div>' +
        Dash.orderTable(attention, {
          detailHref: 'admin/order-details.html',
          columns: ['id', 'customer', 'service', 'vehicles', 'mechanic', 'status'],
          actions: function (o) {
            return '<a class="btn btn-xs btn-outline" href="' + FS.url('admin/order-details.html?id=' + o.id) + '">Open</a>';
          },
          empty: 'Nothing needs attention. Nice.'
        }) +
      '</div>' +

      '<div class="dash-grid dash-grid--1-1 mt-5">' +
        '<div class="card"><div class="card-head"><h3>Mechanic workload</h3></div><div class="card-body">' +
          Store.mechanics().map(function (mech) {
            var jobs = Store.orders().filter(function (o) {
              return o.mechanicId === mech.id && o.status !== 'completed' && o.status !== 'canceled';
            }).length;
            var pct = Math.min(100, jobs * 25);
            return '<div class="mb-4"><div class="row-between mb-2">' +
              '<span class="row"><span class="avatar avatar--sm">' + FS.initials(mech.name) + '</span>' +
              '<span class="text-semi">' + FS.esc(mech.name) + '</span></span>' +
              '<span class="text-sm text-muted">' + jobs + ' active</span></div>' +
              '<span class="progress"><span style="width:' + pct + '%"></span></span></div>';
          }).join('') +
        '</div></div>' +

        '<div class="card"><div class="card-head"><h3>Latest reviews</h3>' +
          '<a class="btn btn-sm btn-outline" href="' + FS.url('admin/reviews.html') + '">Moderate</a></div>' +
          '<div class="card-body">' + Store.reviews().slice(0, 4).map(function (r) {
            return '<div class="feed-item" style="border-top:1px solid var(--line-soft)">' +
              '<span class="avatar avatar--sm">' + FS.initials(r.name) + '</span>' +
              '<div class="feed-body"><p class="text-semi">' + FS.esc(r.title) + '</p>' +
              '<small>' + FS.esc(r.company) + ' · ' + FS.date(r.at) + '</small></div>' +
              FS.stars(r.rating) + '</div>';
          }).join('') + '</div></div>' +
      '</div>';
  }

  function iconForEvent(text) {
    if (/assign/i.test(text)) return 'user-plus';
    if (/payment|paid|refund/i.test(text)) return 'credit-card';
    if (/complete/i.test(text)) return 'check-circle';
    if (/image/i.test(text)) return 'camera';
    if (/manager/i.test(text)) return 'alert-triangle';
    if (/clock/i.test(text)) return 'clock';
    return 'activity';
  }

  /* ======================================================================
     Orders list
     ====================================================================== */

  var state = { filter: 'all', q: FS.param('q') };

  function orders() {
    render();

    function render() {
      var list = Store.orders();
      if (state.filter !== 'all') list = list.filter(function (o) { return o.status === state.filter; });
      list = Dash.searchOrders(list, state.q);

      host.innerHTML =
        '<div class="page-head">' +
          '<div><h2>Orders</h2><p>' + list.length + ' of ' + Store.orders().length + ' projects</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url('admin/notifications.html') + '">' + FS.icon('bell') + 'Notifications</a>' +
            '<a class="btn btn-primary" href="' + FS.url('admin/new-sale.html') + '">' + FS.icon('plus') + 'New Sale</a>' +
          '</div>' +
        '</div>' +

        '<div class="table-wrap">' +
          '<div class="toolbar">' +
            '<div class="input-icon">' + FS.icon('search') +
              '<input class="input" id="orderSearch" placeholder="Search by order number, customer or mechanic…" ' +
              'value="' + FS.esc(state.q) + '" aria-label="Search orders"></div>' +
            '<button class="btn btn-outline btn-sm" id="clearFilters">' + FS.icon('refresh') + 'Reset</button>' +
          '</div>' +
          '<div class="toolbar" style="padding-block:10px">' + Dash.filterBar(state.filter) + '</div>' +
          Dash.orderTable(list, {
            detailHref: 'admin/order-details.html',
            columns: ['id', 'customer', 'service', 'vehicles', 'mechanic', 'status', 'payment'],
            actions: function (o) {
              return Dash.rowMenu(o, [
                { href: 'admin/order-details.html?id=' + o.id, icon: 'eye', label: 'View details' },
                { act: 'assign', icon: 'user-plus', label: 'Assign mechanic' },
                { act: 'status', icon: 'refresh', label: 'Change status' },
                { act: 'edit', icon: 'edit', label: 'Edit order' },
                { sep: true },
                { act: 'link', icon: 'link', label: 'Payment link' },
                { act: 'charge', icon: 'credit-card', label: 'Charge card' },
                { sep: true },
                { act: 'cancel', icon: 'x-circle', label: 'Cancel order', danger: true }
              ]);
            }
          }) +
        '</div>';

      wireSearch();
    }

    function wireSearch() {
      var input = document.getElementById('orderSearch');
      var t;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = input.value.trim(); render(); input.focus(); }, 220);
      });
      document.getElementById('clearFilters').addEventListener('click', function () {
        state.q = ''; state.filter = 'all'; render();
      });
      FS.$$('[data-filter]', host).forEach(function (b) {
        b.addEventListener('click', function () { state.filter = b.dataset.filter; render(); });
      });
    }

    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var o = Store.order(btn.dataset.id);
      if (!o) return;
      var act = btn.dataset.act;
      if (act === 'assign') Dash.assignModal(o, render);
      else if (act === 'status') Dash.statusModal(o, render);
      else if (act === 'edit') editOrderModal(o, render);
      else if (act === 'link') Dash.paymentLinkModal(o);
      else if (act === 'charge') Dash.chargeModal(o, render);
      else if (act === 'cancel') {
        FS.confirm('Cancel ' + o.id + '?', 'The customer will be notified and any deposit refunded.', function () {
          Store.setStatus(o.id, 'canceled', FS.shell.session.name);
          Store.updateOrder(o.id, { payment: 'refunded' });
          FS.toast('Order canceled', o.id, 'warn');
          render();
        }, true);
      }
    });
  }

  /* Edit the top-level project fields. */
  function editOrderModal(o, done) {
    var svc = D.serviceTypes.map(function (t) {
      return '<option' + (t === o.serviceType ? ' selected' : '') + '>' + t + '</option>';
    }).join('');
    var urg = D.urgencies.map(function (t) {
      return '<option' + (t === o.urgency ? ' selected' : '') + '>' + t + '</option>';
    }).join('');
    var loc = D.locations.map(function (t) {
      return '<option' + (t === o.location ? ' selected' : '') + '>' + t + '</option>';
    }).join('');

    FS.modal({
      title: 'Edit order',
      subtitle: o.id,
      size: 'lg',
      body: '<form id="eoForm" novalidate>' +
        '<div class="field-row field-row-2 mb-4">' +
          '<div class="field"><label class="label" for="eoSvc">Service Type</label><select class="select" id="eoSvc" name="serviceType">' + svc + '</select></div>' +
          '<div class="field"><label class="label" for="eoUrg">Urgency</label><select class="select" id="eoUrg" name="urgency">' + urg + '</select></div>' +
        '</div>' +
        '<div class="field-row field-row-2 mb-4">' +
          '<div class="field"><label class="label" for="eoQty">Allowed vehicle quantity</label>' +
            '<input class="input" id="eoQty" name="allowedVehicles" type="number" min="1" max="1000" value="' + o.allowedVehicles + '"></div>' +
          '<div class="field"><label class="label" for="eoLoc">Vehicle Location</label><select class="select" id="eoLoc" name="location">' + loc + '</select></div>' +
        '</div>' +
        '<div class="field"><label class="label" for="eoAddr">Address</label>' +
          '<input class="input" id="eoAddr" name="address" value="' + FS.esc(o.address) + '"></div>' +
        '<div class="field-row field-row-3 mb-4">' +
          '<div class="field"><label class="label" for="eoCity">City</label><input class="input" id="eoCity" name="city" value="' + FS.esc(o.city) + '"></div>' +
          '<div class="field"><label class="label" for="eoState">State</label><input class="input" id="eoState" name="state" value="' + FS.esc(o.state) + '"></div>' +
          '<div class="field"><label class="label" for="eoZip">Zip</label><input class="input" id="eoZip" name="zip" value="' + FS.esc(o.zip) + '"></div>' +
        '</div>' +
        '<div class="field"><label class="label" for="eoDetails">Project Details</label>' +
          '<textarea class="textarea" id="eoDetails" name="details">' + FS.esc(o.details) + '</textarea></div>' +
      '</form>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="eoSave">Save changes</button>',
      onMount: function (root, close) {
        root.querySelector('#eoSave').addEventListener('click', function () {
          var f = FS.formData(root.querySelector('#eoForm'));
          f.allowedVehicles = Number(f.allowedVehicles) || o.allowedVehicles;
          Store.updateOrder(o.id, f, { who: FS.shell.session.name, text: 'Order details updated' });
          close();
          FS.toast('Order updated', o.id, 'ok');
          if (done) done();
        });
      }
    });
  }

  /* ======================================================================
     Order detail
     ====================================================================== */

  function orderDetail() {
    var id = FS.param('id') || Store.orders()[0].id;
    render();

    function render() {
      var o = Store.order(id);
      if (!o) {
        host.innerHTML = '<div class="empty-state">' + FS.icon('help-circle') +
          '<h4>Project not found</h4><p>That project ID does not exist.</p>' +
          '<a class="btn btn-primary mt-6" href="' + FS.url('admin/orders.html') + '">Back to orders</a></div>';
        return;
      }
      var c = Store.customer(o.customerId);
      var mech = Store.mechanic(o.mechanicId);
      var mgr = Store.manager(o.managerId);
      var total = Store.orderTotal(o);

      host.innerHTML =
        '<nav class="crumbs crumbs--dark">' +
          '<a href="' + FS.url('admin/orders.html') + '">Orders</a><span>/</span><strong>' + FS.esc(o.id) + '</strong></nav>' +

        '<div class="page-head">' +
          '<div><h2>' + FS.esc(o.id) + ' ' + Dash.statusBadge(o.status) + '</h2>' +
            '<p>' + FS.esc(o.serviceType) + ' · ' + o.vehicles.length + ' vehicle(s) · created ' + FS.date(o.createdAt) + '</p></div>' +
          '<div class="page-head-actions">' +
            '<button class="btn btn-outline" data-act="status">' + FS.icon('refresh') + 'Change status</button>' +
            '<button class="btn btn-outline" data-act="assign">' + FS.icon('user-plus') + (mech ? 'Reassign' : 'Assign mechanic') + '</button>' +
            '<button class="btn btn-primary" data-act="add-vehicle">' + FS.icon('plus') + 'Add vehicle</button>' +
          '</div>' +
        '</div>' +

        '<div class="dash-grid dash-grid--2-1">' +
          '<div>' +
            /* Customer + project info -------------------------------------- */
            '<div class="card mb-5"><div class="card-head"><h3>Customer information</h3>' +
              (c ? '<a class="btn btn-sm btn-outline" href="' + FS.url('admin/customers.html?id=' + c.id) + '">View account</a>' : '') +
            '</div><div class="card-body">' +
              (c ? '<dl class="dl dl--3">' +
                dd('Company', c.company) + dd('Contact', c.firstName + ' ' + c.lastName) +
                dd('Cell Phone', c.phone) + dd('Email', c.email) +
                dd('Fleet Size', FS.num(c.fleetSize) + ' vehicles') + dd('Customer Since', FS.date(c.since)) +
              '</dl>' : '<p class="text-dim">No customer record.</p>') +
              '<div class="divider"></div>' +
              '<dl class="dl dl--3">' +
                dd('Service Type', o.serviceType) + dd('Urgency', o.urgency) +
                dd('Vehicle Location', o.location) +
                dd('Address', o.address) + dd('City / State / Zip', o.city + ', ' + o.state + ' ' + o.zip) +
                dd('Manager', mgr ? mgr.name : '—') +
              '</dl>' +
              '<div class="divider"></div>' +
              '<dt class="text-xs uppercase text-muted text-bold mb-2">Project Details</dt>' +
              '<p class="text-muted mb-0">' + FS.esc(o.details) + '</p>' +
            '</div></div>' +

            /* Vehicles ----------------------------------------------------- */
            '<div class="row-between mb-4">' +
              '<h3>Vehicles <span class="text-muted text-sm">(' + o.vehicles.length + ' of ' + o.allowedVehicles + ' allowed)</span></h3>' +
              '<button class="btn btn-sm btn-primary" data-act="add-vehicle">' + FS.icon('plus') + 'Add vehicle</button>' +
            '</div>' +
            (o.vehicles.length
              ? o.vehicles.map(function (v, i) {
                  return Dash.vehicleCard(o, v, i, { edit: true, upload: true, notes: true, complete: true, testDrive: true });
                }).join('')
              : '<div class="card"><div class="empty-state">' + FS.icon('truck') +
                '<h4>No vehicles yet</h4><p>Add the first vehicle to start tracking this project.</p></div></div>') +
          '</div>' +

          /* Right rail ------------------------------------------------------ */
          '<div>' +
            '<div class="card mb-5"><div class="card-head"><h3>Billing</h3>' + Dash.paymentBadge(o.payment) + '</div>' +
              '<div class="card-body">' +
                '<div class="money-row"><span>Labour</span><strong>' + FS.money(o.laborTotal) + '</strong></div>' +
                '<div class="money-row"><span>Parts &amp; materials</span><strong>' + FS.money(o.partsTotal) + '</strong></div>' +
                '<div class="money-row"><span>Mechanic payout</span><strong>' + FS.money(o.mechanicPayout) + '</strong></div>' +
                '<div class="money-row money-row--total"><span>Customer total</span><strong>' + FS.money(total) + '</strong></div>' +
                '<div class="stack mt-5" style="gap:var(--sp-2)">' +
                  '<button class="btn btn-primary btn-block" data-act="link">' + FS.icon('link') + 'Generate Stripe payment link</button>' +
                  '<button class="btn btn-dark btn-block" data-act="charge">' + FS.icon('credit-card') + 'Manual Stripe charge</button>' +
                  '<button class="btn btn-outline btn-block" data-act="payout">' + FS.icon('wallet') + 'Record mechanic payment</button>' +
                '</div>' +
              '</div></div>' +

            '<div class="card mb-5"><div class="card-head"><h3>Assignment</h3></div><div class="card-body">' +
              (mech
                ? '<div class="row mb-4"><span class="avatar avatar--lg">' + FS.initials(mech.name) + '</span>' +
                  '<div><strong style="display:block;color:var(--ink-900)">' + FS.esc(mech.name) + '</strong>' +
                  '<small class="text-dim">' + FS.esc(mech.certs) + '</small></div></div>' +
                  '<dl class="dl dl--2">' + dd('Phone', mech.phone) + dd('Rating', mech.rating + ' / 5') +
                  dd('Jobs done', FS.num(mech.jobsDone)) + dd('Rate', FS.money(mech.hourlyRate) + '/h') + '</dl>'
                : '<div class="empty-state" style="padding:24px 0">' + FS.icon('user-plus') +
                  '<h4>Unassigned</h4><p>Pick a technician to start this project.</p></div>') +
              '<button class="btn btn-outline btn-block mt-4" data-act="assign">' +
                (mech ? 'Reassign mechanic' : 'Assign mechanic') + '</button>' +
            '</div></div>' +

            '<div class="card"><div class="card-head"><h3>Timeline</h3></div><div class="card-body">' +
              Dash.feed((o.timeline || []).map(function (t) {
                return { at: t.at, who: t.who, icon: iconForEvent(t.text), text: FS.esc(t.text) };
              })) + '</div></div>' +
          '</div>' +
        '</div>';

      wire(o, render);
    }

    function dd(label, value) {
      return '<div><dt>' + FS.esc(label) + '</dt><dd>' + FS.esc(value == null ? '—' : value) + '</dd></div>';
    }
  }

  /** Click handling shared by the admin, manager, customer and mechanic
      project screens — the perms object decides what is reachable. */
  function wire(o, render) {
    host.onclick = function (e) {
      var top = e.target.closest('[data-act]');
      if (top) {
        var act = top.dataset.act;
        if (act === 'status') Dash.statusModal(o, render);
        else if (act === 'assign') Dash.assignModal(o, render);
        else if (act === 'add-vehicle') Dash.vehicleModal(o, null, render, { admin: true });
        else if (act === 'link') Dash.paymentLinkModal(o);
        else if (act === 'charge') Dash.chargeModal(o, render);
        else if (act === 'payout') Dash.payoutModal(o, render);
        return;
      }

      var vb = e.target.closest('[data-vact]');
      if (!vb) return;
      var i = Number(vb.dataset.i);
      var vact = vb.dataset.vact;
      if (vact === 'edit-vehicle') Dash.vehicleModal(o, i, render, { admin: true });
      else if (vact === 'upload-images') Dash.uploadModal(o, i, render);
      else if (vact === 'add-note') Dash.noteModal(o, i, render);
      else if (vact === 'test-drive') {
        Store.updateVehicle(o.id, i, { status: 'Ready for Test Drive' });
        Store.logTimeline(o.id, FS.shell.session.name, 'Vehicle #' + o.vehicles[i].no + ' ready for test drive');
        FS.toast('Marked ready', 'Vehicle #' + o.vehicles[i].no, 'ok');
        render();
      } else if (vact === 'complete') {
        Store.updateVehicle(o.id, i, { status: 'Repair Complete' });
        Store.logTimeline(o.id, FS.shell.session.name, 'Vehicle #' + o.vehicles[i].no + ' repair complete');
        // When every vehicle is done the project moves to awaiting payment.
        var fresh = Store.order(o.id);
        if (fresh.vehicles.every(function (v) { return v.status === 'Repair Complete'; })) {
          Store.setStatus(o.id, 'waiting-payment', FS.shell.session.name);
          FS.toast('Project complete', 'Moved to Completed — Waiting Payment.', 'ok');
        } else {
          FS.toast('Repair complete', 'Vehicle #' + fresh.vehicles[i].no, 'ok');
        }
        render();
      } else if (vact === 'clock') {
        var v = o.vehicles[i];
        var now = new Date().toTimeString().slice(0, 5);
        if (v.clockIn && !v.clockOut) {
          Store.updateVehicle(o.id, i, { clockOut: now });
          Store.logTimeline(o.id, FS.shell.session.name, 'Clocked out on Vehicle #' + v.no);
        } else {
          Store.updateVehicle(o.id, i, { clockIn: now, clockOut: '', status: 'In Progress' });
          Store.logTimeline(o.id, FS.shell.session.name, 'Clocked in on Vehicle #' + v.no);
        }
        render();
      }
    };
  }
  FS.dash.wireProject = wire;

  /* ======================================================================
     New Sale — six-step workflow
     ====================================================================== */

  function newSale() {
    var draft = { vehicles: [] };
    var step = 1;
    var STEPS = ['Create Customer', 'Vehicle Info', 'Labor Amount', 'Select Mechanic', 'Payment', 'Confirmation'];

    render();

    function render() {
      host.innerHTML =
        '<div class="page-head"><div><h2>New Sale</h2>' +
          '<p>Create a customer, build the project, take payment and issue portal credentials.</p></div></div>' +

        '<div class="card" style="max-width:940px">' +
          '<div class="card-body">' +
            '<ol class="stepper">' + STEPS.map(function (s, i) {
              var cls = i + 1 === step ? ' is-active' : (i + 1 < step ? ' is-done' : '');
              return '<li class="step' + cls + '"><span class="step-dot">' +
                (i + 1 < step ? FS.icon('check') : (i + 1)) + '</span>' +
                '<span class="step-label">' + s + '</span></li>';
            }).join('') + '</ol>' +
            stepBody() +
          '</div>' +
        '</div>';
      wireStep();
      FS.hydrateIcons(host);
    }

    function stepBody() {
      if (step === 1) return step1();
      if (step === 2) return step2();
      if (step === 3) return step3();
      if (step === 4) return step4();
      if (step === 5) return step5();
      return step6();
    }

    /* --- 1. Create customer ------------------------------------------- */
    function step1() {
      return '<h3 class="mb-2">Create customer</h3>' +
        '<p class="text-muted mb-6">A portal account is generated automatically at the end of the sale.</p>' +
        '<form id="nsForm" novalidate>' +
          '<div class="field-row field-row-2 mb-4">' +
            inp('First Name', 'firstName', 'text', draft.firstName, true) +
            inp('Last Name', 'lastName', 'text', draft.lastName, true) +
          '</div>' +
          inp('Company Name', 'company', 'text', draft.company, true) +
          '<div class="field-row field-row-2 mb-4 mt-4">' +
            inp('Cell Phone', 'phone', 'tel', draft.phone, true) +
            inp('Email', 'email', 'email', draft.email, true) +
          '</div>' +
          '<div class="field-row field-row-3">' +
            inp('Zip', 'zip', 'text', draft.zip, true) +
            inp('City', 'city', 'text', draft.city, true) +
            inp('State', 'state', 'text', draft.state, true) +
          '</div>' +
        '</form>' + nav(null, 'Continue');
    }

    /* --- 2. Vehicle information --------------------------------------- */
    function step2() {
      return '<h3 class="mb-2">Vehicle information</h3>' +
        '<p class="text-muted mb-6">Add every unit covered by this sale.</p>' +
        '<form id="nsForm" novalidate>' +
          '<div class="field-row field-row-2 mb-4">' +
            '<div class="field"><label class="label" for="nsSvc">Service Type <span class="req">*</span></label>' +
              '<select class="select" id="nsSvc" name="serviceType" required>' +
              D.serviceTypes.map(function (t) {
                return '<option' + (t === draft.serviceType ? ' selected' : '') + '>' + t + '</option>';
              }).join('') + '</select></div>' +
            '<div class="field"><label class="label" for="nsUrg">Urgency</label>' +
              '<select class="select" id="nsUrg" name="urgency">' +
              D.urgencies.map(function (t) {
                return '<option' + (t === draft.urgency ? ' selected' : '') + '>' + t + '</option>';
              }).join('') + '</select></div>' +
          '</div>' +
          inp('Address', 'address', 'text', draft.address, true) +
          '<div class="field-row field-row-2 mt-4">' +
            '<div class="field"><label class="label" for="nsLoc">Vehicle Location</label>' +
              '<select class="select" id="nsLoc" name="location">' +
              D.locations.map(function (t) {
                return '<option' + (t === draft.location ? ' selected' : '') + '>' + t + '</option>';
              }).join('') + '</select></div>' +
            inp('Allowed vehicle quantity', 'allowedVehicles', 'number', draft.allowedVehicles || 1) +
          '</div>' +
          '<div class="field mt-4"><label class="label" for="nsDetails">Project Details</label>' +
            '<textarea class="textarea" id="nsDetails" name="details">' + FS.esc(draft.details || '') + '</textarea></div>' +
        '</form>' +

        '<div class="divider"></div>' +
        '<div class="row-between mb-4"><h4>Vehicles (' + draft.vehicles.length + ')</h4>' +
          '<button class="btn btn-sm btn-outline" id="nsAddVeh">' + FS.icon('plus') + 'Add vehicle</button></div>' +
        (draft.vehicles.length
          ? '<div class="scroll-x"><table class="table table--compact table--stack"><thead><tr>' +
            '<th>#</th><th>Vehicle</th><th>Plate</th><th>Repair</th><th></th></tr></thead><tbody>' +
            draft.vehicles.map(function (v, i) {
              return '<tr><td data-label="#">' + (i + 1) + '</td>' +
                '<td data-label="Vehicle" class="td-strong">' + FS.esc([v.year, v.make, v.model].join(' ')) + '</td>' +
                '<td data-label="Plate">' + FS.esc(v.plate || '—') + '</td>' +
                '<td data-label="Repair">' + FS.esc(v.repair || '—') + '</td>' +
                '<td class="td-actions"><button class="btn-icon btn-icon--bare" data-rmveh="' + i + '" aria-label="Remove">' +
                FS.icon('trash') + '</button></td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<p class="text-dim text-sm">No vehicles added yet.</p>') +
        nav('Back', 'Continue');
    }

    /* --- 3. Labor amount ---------------------------------------------- */
    function step3() {
      var presets = [
        { label: 'Standard PM', rate: 145, note: 'Per vehicle, includes fluids' },
        { label: 'Diagnostic', rate: 189, note: 'First hour, credited to repair' },
        { label: 'Repair labour', rate: 165, note: 'Per hour, per technician' },
        { label: 'Emergency roadside', rate: 240, note: 'Call-out plus first hour' }
      ];
      return '<h3 class="mb-2">Select labor amount</h3>' +
        '<p class="text-muted mb-6">Choose a rate card or enter a flat amount for the whole project.</p>' +
        '<div class="stack mb-6">' + presets.map(function (p, i) {
          return '<label class="opt-card' + (draft.laborPreset === i ? ' is-selected' : '') + '">' +
            '<input type="radio" name="labor" value="' + i + '"' + (draft.laborPreset === i ? ' checked' : '') + '>' +
            '<span style="flex:1 1 auto"><strong>' + p.label + '</strong><span>' + p.note + '</span></span>' +
            '<strong class="text-navy">' + FS.money(p.rate) + '</strong></label>';
        }).join('') + '</div>' +
        '<form id="nsForm" novalidate>' +
          '<div class="field-row field-row-2">' +
            inp('Labour total ($)', 'laborTotal', 'number', draft.laborTotal || 0, true) +
            inp('Parts &amp; materials ($)', 'partsTotal', 'number', draft.partsTotal || 0) +
          '</div>' +
        '</form>' +
        '<div class="alert alert--info mt-5">' + FS.icon('info') +
          '<div>Selecting a rate card multiplies it by the number of vehicles (' + draft.vehicles.length + ').</div></div>' +
        nav('Back', 'Continue');
    }

    /* --- 4. Select mechanic -------------------------------------------- */
    function step4() {
      return '<h3 class="mb-2">Select mechanic</h3>' +
        '<p class="text-muted mb-6">The technician receives an SMS with the project ID, service type and location.</p>' +
        '<div class="stack">' + Store.mechanics().map(function (m) {
          return '<label class="opt-card' + (draft.mechanicId === m.id ? ' is-selected' : '') + '">' +
            '<input type="radio" name="mech" value="' + m.id + '"' + (draft.mechanicId === m.id ? ' checked' : '') + '>' +
            '<span class="avatar avatar--sm">' + FS.initials(m.name) + '</span>' +
            '<span style="flex:1 1 auto;min-width:0"><strong>' + FS.esc(m.name) + '</strong>' +
            '<span>' + FS.esc(m.certs) + ' · ' + FS.esc(m.city + ', ' + m.state) + ' · ' + FS.money(m.hourlyRate) + '/h</span></span>' +
            '<span class="badge badge--' + (m.status === 'available' ? 'ok' : m.status === 'on-job' ? 'warn' : 'neutral') + '">' +
            FS.esc(m.status) + '</span></label>';
        }).join('') + '</div>' + nav('Back', 'Continue');
    }

    /* --- 5. Payment ----------------------------------------------------- */
    function step5() {
      var total = (Number(draft.laborTotal) || 0) + (Number(draft.partsTotal) || 0);
      draft.total = total;
      return '<h3 class="mb-2">Payment</h3>' +
        '<p class="text-muted mb-6">Take payment now or issue a Stripe payment link with the confirmation.</p>' +
        '<div class="card mb-6"><div class="card-body">' +
          '<div class="money-row"><span>Labour</span><strong>' + FS.money(draft.laborTotal || 0) + '</strong></div>' +
          '<div class="money-row"><span>Parts &amp; materials</span><strong>' + FS.money(draft.partsTotal || 0) + '</strong></div>' +
          '<div class="money-row money-row--total"><span>Total due</span><strong>' + FS.money(total) + '</strong></div>' +
        '</div></div>' +
        '<div class="stack">' +
          ['Charge card now', 'Send Stripe payment link', 'Invoice on net-30 terms'].map(function (opt, i) {
            return '<label class="opt-card' + ((draft.payMethod || 0) === i ? ' is-selected' : '') + '">' +
              '<input type="radio" name="pay" value="' + i + '"' + ((draft.payMethod || 0) === i ? ' checked' : '') + '>' +
              '<span style="flex:1 1 auto"><strong>' + opt + '</strong></span>' + FS.icon(['credit-card', 'link', 'receipt'][i]) +
            '</label>';
          }).join('') +
        '</div>' + nav('Back', 'Complete sale');
    }

    /* --- 6. Confirmation ------------------------------------------------ */
    function step6() {
      var o = draft.created;
      var c = draft.customer;
      return '<div class="success-hero">' +
          '<div class="success-mark">' + FS.icon('check') + '</div>' +
          '<h2>Sale complete</h2>' +
          '<p class="text-muted" style="max-width:44ch;margin:10px auto 0">' +
            'The project is live, the technician has been notified and the customer has portal access.</p>' +
          '<div class="mt-6"><span class="ref-badge"><small>Project ID</small><strong>' + FS.esc(o.id) + '</strong></span></div>' +
        '</div>' +

        '<div class="dash-grid dash-grid--1-1 mt-6">' +
          '<div class="card"><div class="card-head"><h4>Customer login credentials</h4></div><div class="card-body">' +
            '<div class="creds">' +
              '<div class="creds-row"><small>Portal</small><code>fleetsquad.com/login</code></div>' +
              '<div class="creds-row"><small>Username</small><code>' + FS.esc(c.email) + '</code></div>' +
              '<div class="creds-row"><small>Temp password</small><code>' + FS.esc(draft.tempPassword) + '</code></div>' +
            '</div>' +
            '<p class="hint mt-4">The customer is asked to change this on first sign-in.</p>' +
          '</div></div>' +

          '<div class="card"><div class="card-head"><h4>Notifications sent</h4></div><div class="card-body">' +
            '<div class="msg-preview mb-4">' +
              '<div class="msg-preview-head">' + FS.icon('message') + 'SMS to technician</div>' +
              '<div class="msg-preview-body">New Project Assigned\nProject ID: ' + o.id +
                '\nService Type: ' + o.serviceType + '\nLocation: ' + o.address + ', ' + o.city + ', ' + o.state + '</div>' +
            '</div>' +
            '<div class="msg-preview">' +
              '<div class="msg-preview-head">' + FS.icon('mail') + 'Email to customer</div>' +
              '<div class="msg-preview-body">Welcome to FleetSquad, ' + FS.esc(c.firstName) + '.\n' +
                'Project ' + o.id + ' is confirmed. Total ' + FS.money(draft.total) + '.\n' +
                'Sign in to track every vehicle in real time.</div>' +
            '</div>' +
          '</div></div>' +
        '</div>' +

        '<div class="row row-wrap mt-6" style="gap:var(--sp-3)">' +
          '<a class="btn btn-primary" href="' + FS.url('admin/order-details.html?id=' + o.id) + '">Open project' + FS.icon('arrow-right') + '</a>' +
          '<button class="btn btn-outline" id="nsRestart">Start another sale</button>' +
        '</div>';
    }

    function inp(label, name, type, value, required) {
      var id = 'ns_' + name;
      return '<div class="field"><label class="label" for="' + id + '">' + label +
        (required ? ' <span class="req">*</span>' : '') + '</label>' +
        '<input class="input" id="' + id + '" name="' + name + '" type="' + type + '" value="' +
        FS.esc(value == null ? '' : value) + '"' + (required ? ' required' : '') + '></div>';
    }

    function nav(back, next) {
      return '<div class="row-between mt-8">' +
        (back ? '<button class="btn btn-ghost" id="nsBack">' + FS.icon('arrow-left') + back + '</button>' : '<span></span>') +
        '<button class="btn btn-primary" id="nsNext">' + next + FS.icon('arrow-right') + '</button></div>';
    }

    /* --- step wiring ---------------------------------------------------- */
    function wireStep() {
      var back = document.getElementById('nsBack');
      if (back) back.addEventListener('click', function () { step--; render(); });

      var addVeh = document.getElementById('nsAddVeh');
      if (addVeh) addVeh.addEventListener('click', function () { addVehicleModal(); });

      FS.$$('[data-rmveh]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          draft.vehicles.splice(Number(b.dataset.rmveh), 1);
          render();
        });
      });

      /* Rate-card selection multiplies through to the labour total. */
      FS.$$('input[name="labor"]', host).forEach(function (r) {
        r.addEventListener('change', function () {
          var rates = [145, 189, 165, 240];
          draft.laborPreset = Number(r.value);
          var count = Math.max(1, draft.vehicles.length);
          draft.laborTotal = rates[draft.laborPreset] * count;
          draft.partsTotal = Math.round(draft.laborTotal * 0.42);
          render();
        });
      });

      var restart = document.getElementById('nsRestart');
      if (restart) restart.addEventListener('click', function () {
        draft = { vehicles: [] }; step = 1; render();
      });

      var next = document.getElementById('nsNext');
      if (next) next.addEventListener('click', onNext);
    }

    function onNext() {
      var form = document.getElementById('nsForm');

      if (step === 1) {
        if (!FS.validate(form)) return;
        Object.assign(draft, FS.formData(form));
      } else if (step === 2) {
        if (!FS.validate(form)) return;
        Object.assign(draft, FS.formData(form));
        if (!draft.vehicles.length) {
          FS.toast('Add a vehicle', 'A sale needs at least one vehicle.', 'warn');
          return;
        }
      } else if (step === 3) {
        if (!FS.validate(form)) return;
        Object.assign(draft, FS.formData(form));
      } else if (step === 4) {
        var picked = host.querySelector('input[name="mech"]:checked');
        if (!picked) { FS.toast('Select a mechanic', 'Choose who will run this project.', 'warn'); return; }
        draft.mechanicId = picked.value;
      } else if (step === 5) {
        var pay = host.querySelector('input[name="pay"]:checked');
        draft.payMethod = pay ? Number(pay.value) : 0;
        finish();
        step = 6;
        render();
        return;
      }
      step++;
      render();
    }

    function addVehicleModal() {
      FS.modal({
        title: 'Add vehicle',
        body: '<form id="nvForm" novalidate>' +
          '<div class="field-row field-row-3 mb-4">' +
            inp('Year', 'year', 'number', new Date().getFullYear(), true) +
            inp('Make', 'make', 'text', '', true) +
            inp('Model', 'model', 'text', '', true) +
          '</div>' +
          '<div class="field-row field-row-3 mb-4">' +
            inp('Mileage', 'mileage', 'number', '') +
            inp('Plate', 'plate', 'text', '') +
            inp('VIN', 'vin', 'text', '') +
          '</div>' +
          '<div class="field"><label class="label" for="nvRepair">Repair description</label>' +
            '<textarea class="textarea" id="nvRepair" name="repair"></textarea></div>' +
        '</form>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="nvAdd">Add vehicle</button>',
        size: 'lg',
        onMount: function (root, close) {
          root.querySelector('#nvAdd').addEventListener('click', function () {
            var f = root.querySelector('#nvForm');
            if (!FS.validate(f)) return;
            var v = FS.formData(f);
            v.year = Number(v.year); v.mileage = Number(v.mileage) || 0;
            v.status = 'Not Started';
            v.images = { before: [], after: [], paperwork: [], vin: [], photos: [], customerId: [] };
            draft.vehicles.push(v);
            close();
            render();
          });
        }
      });
    }

    /* Commit the draft to the store. */
    function finish() {
      var customer = Store.createCustomer({
        company: draft.company, firstName: draft.firstName, lastName: draft.lastName,
        email: draft.email, phone: draft.phone, city: draft.city, state: draft.state,
        zip: draft.zip, fleetSize: draft.vehicles.length
      });

      var order = Store.createOrder({
        customerId: customer.id,
        serviceType: draft.serviceType,
        urgency: draft.urgency,
        vehicleCount: draft.vehicles.length,
        allowedVehicles: Number(draft.allowedVehicles) || draft.vehicles.length,
        address: draft.address, city: draft.city, state: draft.state, zip: draft.zip,
        location: draft.location, details: draft.details,
        laborTotal: Number(draft.laborTotal) || 0,
        partsTotal: Number(draft.partsTotal) || 0,
        mechanicPayout: Math.round((Number(draft.laborTotal) || 0) * 0.45),
        status: 'assigned',
        payment: draft.payMethod === 0 ? 'paid' : 'unpaid'
      });

      draft.vehicles.forEach(function (v) { Store.addVehicle(order.id, v); });
      // addVehicle recalculates labour from the vehicle rows; restore the
      // amount the operator actually chose on step 3.
      Store.updateOrder(order.id, {
        laborTotal: Number(draft.laborTotal) || 0,
        partsTotal: Number(draft.partsTotal) || 0
      });
      Store.assignMechanic(order.id, draft.mechanicId, FS.shell.session.name);

      if (draft.payMethod === 0) {
        Store.addPayment({
          orderId: order.id, customerId: customer.id, amount: draft.total,
          method: 'Stripe · Visa ••4242', type: 'charge', status: 'succeeded'
        });
      }

      Store.notify({
        channel: 'email', audience: 'customer', orderId: order.id,
        title: 'Welcome to FleetSquad',
        body: 'Project ' + order.id + ' is confirmed. Total ' + FS.money(draft.total) +
              '. Sign in to track every vehicle in real time.'
      });

      draft.customer = customer;
      draft.created = Store.order(order.id);
      draft.tempPassword = 'FS-' + Math.abs(hashCode(customer.email)).toString(36).slice(0, 6).toUpperCase();
    }

    function hashCode(s) {
      var h = 0;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return h;
    }
  }

  /* ======================================================================
     Customers
     ====================================================================== */

  function customers() {
    var q = '';
    render();

    function render() {
      var list = Store.customers().filter(function (c) {
        if (!q) return true;
        return (c.company + ' ' + c.firstName + ' ' + c.lastName + ' ' + c.email + ' ' + c.city + ' ' + c.state)
          .toLowerCase().indexOf(q.toLowerCase()) > -1;
      });

      host.innerHTML =
        '<div class="page-head"><div><h2>Customers</h2><p>' + list.length + ' fleet accounts</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-primary" href="' + FS.url('admin/new-sale.html') + '">' + FS.icon('user-plus') + 'New customer</a>' +
          '</div></div>' +

        '<div class="table-wrap">' +
          '<div class="toolbar"><div class="input-icon">' + FS.icon('search') +
            '<input class="input" id="custSearch" placeholder="Search customers…" value="' + FS.esc(q) + '"></div></div>' +
          '<div class="scroll-x"><table class="table table--stack"><thead><tr>' +
            '<th>Company</th><th>Contact</th><th>Location</th><th>Fleet</th><th>Projects</th><th>Since</th><th class="td-actions">Actions</th>' +
          '</tr></thead><tbody>' + list.map(function (c) {
            var projects = Store.orders().filter(function (o) { return o.customerId === c.id; });
            return '<tr>' +
              '<td data-label="Company"><div class="row"><span class="avatar avatar--sm">' + FS.initials(c.company) + '</span>' +
                '<span class="td-strong">' + FS.esc(c.company) + '</span></div></td>' +
              '<td data-label="Contact"><span style="display:block">' + FS.esc(c.firstName + ' ' + c.lastName) + '</span>' +
                '<small class="text-xs text-dim">' + FS.esc(c.email) + '</small></td>' +
              '<td data-label="Location">' + FS.esc(c.city + ', ' + c.state) + '</td>' +
              '<td data-label="Fleet">' + FS.num(c.fleetSize) + '</td>' +
              '<td data-label="Projects">' + projects.length + '</td>' +
              '<td data-label="Since">' + FS.date(c.since) + '</td>' +
              '<td class="td-actions" data-label="Actions">' +
                '<button class="btn btn-xs btn-outline" data-cust="' + c.id + '">View</button></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>' +
        '</div>';

      var s = document.getElementById('custSearch');
      var t;
      s.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { q = s.value; render(); document.getElementById('custSearch').focus(); }, 200);
      });
    }

    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cust]');
      if (!b) return;
      var c = Store.customer(b.dataset.cust);
      var projects = Store.orders().filter(function (o) { return o.customerId === c.id; });
      FS.modal({
        title: c.company,
        subtitle: c.firstName + ' ' + c.lastName + ' · ' + c.city + ', ' + c.state,
        size: 'lg',
        body: '<dl class="dl dl--2 mb-6">' +
            '<div><dt>Email</dt><dd>' + FS.esc(c.email) + '</dd></div>' +
            '<div><dt>Phone</dt><dd>' + FS.esc(c.phone) + '</dd></div>' +
            '<div><dt>Fleet size</dt><dd>' + FS.num(c.fleetSize) + ' vehicles</dd></div>' +
            '<div><dt>Customer since</dt><dd>' + FS.date(c.since, 'long') + '</dd></div>' +
          '</dl>' +
          '<h4 class="mb-3">Projects (' + projects.length + ')</h4>' +
          (projects.length ? '<div class="scroll-x"><table class="table table--compact"><tbody>' +
            projects.map(function (o) {
              return '<tr><td><a class="text-blue text-bold" href="' + FS.url('admin/order-details.html?id=' + o.id) + '">' + o.id + '</a></td>' +
                '<td>' + FS.esc(o.serviceType) + '</td><td>' + Dash.statusBadge(o.status) + '</td>' +
                '<td class="text-right td-strong">' + FS.money(Store.orderTotal(o)) + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '<p class="text-dim">No projects yet.</p>'),
        footer: '<button class="btn btn-outline" data-close>Close</button>' +
                '<a class="btn btn-primary" href="' + FS.url('admin/new-sale.html') + '">New sale</a>'
      });
    });
  }

  /* ======================================================================
     Mechanics
     ====================================================================== */

  function mechanics() {
    var list = Store.mechanics();
    host.innerHTML =
      '<div class="page-head"><div><h2>Mechanics</h2><p>' + list.length + ' technicians on the roster</p></div></div>' +

      '<div class="grid grid-3">' + list.map(function (m) {
        var active = Store.orders().filter(function (o) {
          return o.mechanicId === m.id && o.status !== 'completed' && o.status !== 'canceled';
        });
        var paid = Store.payouts().filter(function (p) { return p.mechanicId === m.id && p.status === 'paid'; })
          .reduce(function (s, p) { return s + p.amount; }, 0);
        return '<div class="card card-pad">' +
          '<div class="row mb-4"><span class="avatar avatar--lg">' + FS.initials(m.name) + '</span>' +
            '<div style="min-width:0"><strong style="display:block;color:var(--ink-900)">' + FS.esc(m.name) + '</strong>' +
            '<small class="text-dim">' + FS.esc(m.certs) + '</small></div>' +
            '<span class="spacer"></span>' +
            '<span class="badge badge--' + (m.status === 'available' ? 'ok' : m.status === 'on-job' ? 'warn' : 'neutral') + '">' +
            FS.esc(m.status) + '</span></div>' +
          '<dl class="dl dl--2 mb-4">' +
            '<div><dt>Location</dt><dd>' + FS.esc(m.city + ', ' + m.state) + '</dd></div>' +
            '<div><dt>Rate</dt><dd>' + FS.money(m.hourlyRate) + '/h</dd></div>' +
            '<div><dt>Rating</dt><dd>' + m.rating + ' / 5</dd></div>' +
            '<div><dt>Jobs done</dt><dd>' + FS.num(m.jobsDone) + '</dd></div>' +
            '<div><dt>Active projects</dt><dd>' + active.length + '</dd></div>' +
            '<div><dt>Paid to date</dt><dd>' + FS.money(paid) + '</dd></div>' +
          '</dl>' +
          (active.length ? '<div class="divider"></div><div class="stack" style="gap:6px">' +
            active.map(function (o) {
              return '<a class="row-between" href="' + FS.url('admin/order-details.html?id=' + o.id) + '" style="font-size:var(--fs-sm)">' +
                '<span class="text-semi">' + o.id + '</span>' + Dash.statusBadge(o.status) + '</a>';
            }).join('') + '</div>' : '') +
        '</div>';
      }).join('') + '</div>';
  }

  /* ======================================================================
     Payments
     ====================================================================== */

  function payments() {
    var pays = Store.payments();
    var pouts = Store.payouts();
    var collected = pays.filter(function (p) { return p.status === 'succeeded' && p.type !== 'refund'; })
      .reduce(function (s, p) { return s + p.amount; }, 0);
    var pending = pays.filter(function (p) { return p.status === 'pending'; })
      .reduce(function (s, p) { return s + p.amount; }, 0);
    var refunded = pays.filter(function (p) { return p.type === 'refund'; })
      .reduce(function (s, p) { return s + p.amount; }, 0);
    var payouts = pouts.reduce(function (s, p) { return s + p.amount; }, 0);

    host.innerHTML =
      '<div class="page-head"><div><h2>Payments</h2><p>Charges, deposits, refunds and technician payouts</p></div></div>' +

      Dash.kpiGrid([
        { icon: 'dollar', tone: 'ok', label: 'Collected', value: FS.money(collected) },
        { icon: 'clock', tone: 'warn', label: 'Pending', value: FS.money(pending) },
        { icon: 'refresh', tone: 'danger', label: 'Refunded', value: FS.money(refunded) },
        { icon: 'wallet', tone: 'navy', label: 'Mechanic payouts', value: FS.money(payouts) }
      ], 'kpi-grid--4') +

      '<div data-tabs><div class="tabs">' +
        '<button class="tab is-active" data-tab="in">Customer payments</button>' +
        '<button class="tab" data-tab="out">Mechanic payouts</button>' +
      '</div>' +

      '<div class="tab-panel is-active" data-panel="in"><div class="table-wrap"><div class="scroll-x">' +
        '<table class="table table--stack"><thead><tr>' +
          '<th>Payment ID</th><th>Project</th><th>Customer</th><th>Method</th><th>Type</th><th>Status</th><th class="text-right">Amount</th>' +
        '</tr></thead><tbody>' + pays.map(function (p) {
          var c = Store.customer(p.customerId);
          return '<tr>' +
            '<td data-label="Payment ID" class="td-strong">' + FS.esc(p.id) + '</td>' +
            '<td data-label="Project"><a class="text-blue" href="' + FS.url('admin/order-details.html?id=' + p.orderId) + '">' + FS.esc(p.orderId) + '</a></td>' +
            '<td data-label="Customer">' + FS.esc(c ? c.company : '—') + '</td>' +
            '<td data-label="Method">' + FS.esc(p.method) + '</td>' +
            '<td data-label="Type"><span class="badge badge--neutral">' + FS.esc(p.type) + '</span></td>' +
            '<td data-label="Status"><span class="badge badge--' +
              (p.status === 'succeeded' ? 'ok' : p.status === 'pending' ? 'warn' : 'neutral') + '">' + FS.esc(p.status) + '</span></td>' +
            '<td data-label="Amount" class="text-right td-strong">' + FS.money(p.amount) + '</td>' +
          '</tr>';
        }).join('') + '</tbody></table></div></div></div>' +

      '<div class="tab-panel" data-panel="out"><div class="table-wrap"><div class="scroll-x">' +
        '<table class="table table--stack"><thead><tr>' +
          '<th>Payout ID</th><th>Mechanic</th><th>Project</th><th>Date</th><th>Status</th><th class="text-right">Amount</th>' +
        '</tr></thead><tbody>' + pouts.map(function (p) {
          var m = Store.mechanic(p.mechanicId);
          return '<tr>' +
            '<td data-label="Payout ID" class="td-strong">' + FS.esc(p.id) + '</td>' +
            '<td data-label="Mechanic">' + FS.esc(m ? m.name : '—') + '</td>' +
            '<td data-label="Project"><a class="text-blue" href="' + FS.url('admin/order-details.html?id=' + p.orderId) + '">' + FS.esc(p.orderId) + '</a></td>' +
            '<td data-label="Date">' + (p.at ? FS.date(p.at) : '—') + '</td>' +
            '<td data-label="Status"><span class="badge badge--' +
              (p.status === 'paid' ? 'ok' : p.status === 'scheduled' ? 'info' : 'neutral') + '">' + FS.esc(p.status) + '</span></td>' +
            '<td data-label="Amount" class="text-right td-strong">' + FS.money(p.amount) + '</td>' +
          '</tr>';
        }).join('') + '</tbody></table></div></div></div></div>';
  }

  /* ======================================================================
     Reviews moderation
     ====================================================================== */

  function reviews() {
    render();

    function render() {
      var all = Store.reviews();
      var rs = Store.reviewStats();

      host.innerHTML =
        '<div class="page-head"><div><h2>Reviews</h2>' +
          '<p>' + rs.count + ' published · ' + Store.reviews('pending').length + ' awaiting moderation</p></div>' +
          '<div class="page-head-actions">' +
            '<button class="btn btn-primary" id="requestReview">' + FS.icon('send') + 'Send review request</button>' +
          '</div></div>' +

        Dash.kpiGrid([
          { icon: 'review', label: 'Total reviews', value: FS.num(rs.count) },
          { icon: 'star', tone: 'warn', label: 'Average rating', value: rs.average.toFixed(1) + ' / 5' },
          { icon: 'clock', tone: 'warn', label: 'Pending', value: Store.reviews('pending').length },
          { icon: 'thumbs-up', tone: 'ok', label: '5-star share',
            value: rs.count ? Math.round((rs.breakdown[4] / rs.count) * 100) + '%' : '0%' }
        ], 'kpi-grid--4') +

        '<div class="table-wrap"><div class="scroll-x">' +
          '<table class="table table--stack"><thead><tr>' +
            '<th>Reviewer</th><th>Rating</th><th>Review</th><th>Date</th><th>Status</th><th class="td-actions">Actions</th>' +
          '</tr></thead><tbody>' + all.map(function (r) {
            return '<tr>' +
              '<td data-label="Reviewer"><div class="row"><span class="avatar avatar--sm">' + FS.initials(r.name) + '</span>' +
                '<span style="min-width:0"><span class="td-strong" style="display:block">' + FS.esc(r.name) + '</span>' +
                '<small class="text-xs text-dim">' + FS.esc(r.company) + '</small></span></div></td>' +
              '<td data-label="Rating">' + FS.stars(r.rating) + '</td>' +
              '<td data-label="Review" style="max-width:360px">' +
                '<span class="td-strong" style="display:block">' + FS.esc(r.title) + '</span>' +
                '<small class="text-dim">' + FS.esc(r.body.slice(0, 110)) + '…</small></td>' +
              '<td data-label="Date">' + FS.date(r.at) + '</td>' +
              '<td data-label="Status"><span class="badge badge--' +
                (r.status === 'published' ? 'ok' : 'warn') + '">' + FS.esc(r.status) + '</span></td>' +
              '<td class="td-actions" data-label="Actions">' +
                '<div class="dropdown"><button class="btn-icon btn-icon--bare" data-dropdown>' + FS.icon('more-vertical') + '</button>' +
                '<div class="dropdown-menu">' +
                  '<button data-rv="edit" data-id="' + r.id + '">' + FS.icon('edit') + 'Edit review</button>' +
                  (r.status === 'pending'
                    ? '<button data-rv="publish" data-id="' + r.id + '">' + FS.icon('check') + 'Publish</button>'
                    : '<button data-rv="unpublish" data-id="' + r.id + '">' + FS.icon('eye') + 'Unpublish</button>') +
                  '<button data-rv="feature" data-id="' + r.id + '">' + FS.icon('sparkles') +
                    (r.featured ? 'Remove from homepage' : 'Feature on homepage') + '</button>' +
                  '<div class="dropdown-sep"></div>' +
                  '<button data-rv="delete" data-id="' + r.id + '" class="is-danger">' + FS.icon('trash') + 'Delete</button>' +
                '</div></div></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div></div>';

      document.getElementById('requestReview').addEventListener('click', reviewRequestModal);
    }

    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rv]');
      if (!b) return;
      var r = Store.reviews().filter(function (x) { return x.id === b.dataset.id; })[0];
      var act = b.dataset.rv;

      if (act === 'publish')   { Store.updateReview(r.id, { status: 'published' }); FS.toast('Review published', r.title, 'ok'); render(); }
      else if (act === 'unpublish') { Store.updateReview(r.id, { status: 'pending' }); FS.toast('Review unpublished', r.title, 'warn'); render(); }
      else if (act === 'feature')   { Store.updateReview(r.id, { featured: !r.featured }); FS.toast(r.featured ? 'Removed from homepage' : 'Featured on homepage', r.title, 'ok'); render(); }
      else if (act === 'delete') {
        FS.confirm('Delete review?', 'This cannot be undone in the prototype.', function () {
          var list = Store.state.reviews;
          list.splice(list.indexOf(r), 1);
          Store.save();
          FS.toast('Review deleted', '', 'warn');
          render();
        }, true);
      } else if (act === 'edit') {
        FS.modal({
          title: 'Edit review',
          subtitle: r.name + ' · ' + r.company,
          body: '<form id="rvEdit" novalidate>' +
            '<div class="field"><span class="label">Rating</span>' + FS.starInput(r.rating) + '</div>' +
            '<div class="field"><label class="label" for="reTitle">Headline</label>' +
              '<input class="input" id="reTitle" name="title" value="' + FS.esc(r.title) + '"></div>' +
            '<div class="field"><label class="label" for="reBody">Review</label>' +
              '<textarea class="textarea" id="reBody" name="body" style="min-height:150px">' + FS.esc(r.body) + '</textarea></div>' +
          '</form>',
          footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="reSave">Save</button>',
          onMount: function (root, close) {
            root.querySelector('#reSave').addEventListener('click', function () {
              var f = FS.formData(root.querySelector('#rvEdit'));
              f.rating = Number(root.querySelector('.star-input').dataset.value) || r.rating;
              Store.updateReview(r.id, f);
              close();
              FS.toast('Review updated', '', 'ok');
              render();
            });
          }
        });
      }
    });

    function reviewRequestModal() {
      var completed = Store.orders().filter(function (o) { return o.status === 'completed'; });
      FS.modal({
        title: 'Send review request',
        subtitle: 'Ask a customer for feedback on a completed project.',
        body: '<div class="field"><label class="label" for="rrProject">Project</label>' +
            '<select class="select" id="rrProject">' + completed.map(function (o) {
              var c = Store.customer(o.customerId);
              return '<option value="' + o.id + '">' + o.id + ' — ' + FS.esc(c ? c.company : '') + '</option>';
            }).join('') + '</select></div>' +
          '<div class="field"><label class="label" for="rrChannel">Channel</label>' +
            '<select class="select" id="rrChannel"><option value="email">Email</option><option value="sms">SMS</option></select></div>' +
          '<div class="msg-preview mt-5"><div class="msg-preview-head">' + FS.icon('mail') + 'Preview</div>' +
            '<div class="msg-preview-body">How did we do?\n\nYour recent service is complete. Tell us how it went — ' +
            'it takes about a minute and helps other fleets choose.</div></div>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="rrSend">Send request</button>',
        onMount: function (root, close) {
          root.querySelector('#rrSend').addEventListener('click', function () {
            var id = root.querySelector('#rrProject').value;
            Store.notify({
              channel: root.querySelector('#rrChannel').value, audience: 'customer', orderId: id,
              title: 'How did we do?',
              body: 'Your recent service on ' + id + ' is complete. Tell us how it went — it takes about a minute.'
            });
            close();
            FS.toast('Review request sent', id, 'ok');
          });
        }
      });
    }
  }

  /* ======================================================================
     Notification centre
     ====================================================================== */

  function notifications() {
    FS.dash.notificationsView(host, 'admin', 'Every SMS and email the platform has generated.');
  }

  /* ======================================================================
     CMS pages
     ====================================================================== */

  function cms() {
    render();

    function render() {
      host.innerHTML =
        '<div class="page-head"><div><h2>CMS Pages</h2>' +
          '<p>Editable content for the marketing site. ' + D.cmsPages.length + ' page templates.</p></div>' +
          '<div class="page-head-actions"><button class="btn btn-primary" id="newPage">' + FS.icon('plus') + 'New page</button></div>' +
        '</div>' +

        '<div class="table-wrap"><div class="scroll-x">' +
          '<table class="table table--stack"><thead><tr>' +
            '<th>Page</th><th>Slug</th><th>Sections</th><th>Last updated</th><th>Status</th><th class="td-actions">Actions</th>' +
          '</tr></thead><tbody>' + D.cmsPages.map(function (p) {
            return '<tr>' +
              '<td data-label="Page" class="td-strong">' + FS.esc(p.title) + '</td>' +
              '<td data-label="Slug"><code class="text-sm text-dim">/' + FS.esc(p.slug) + '</code></td>' +
              '<td data-label="Sections">' + p.sections + '</td>' +
              '<td data-label="Updated">' + FS.date(p.updated) + '</td>' +
              '<td data-label="Status"><span class="badge badge--' + (p.status === 'published' ? 'ok' : 'warn') + '">' +
                FS.esc(p.status) + '</span></td>' +
              '<td class="td-actions" data-label="Actions">' +
                '<a class="btn btn-xs btn-outline" href="' + FS.url('pages/' + p.slug + '.html') + '" target="_blank" rel="noopener">' +
                  FS.icon('external') + 'View</a> ' +
                '<button class="btn btn-xs btn-primary" data-cms="' + p.slug + '">' + FS.icon('edit') + 'Edit</button>' +
              '</td></tr>';
          }).join('') + '</tbody></table></div></div>' +

        '<div class="grid grid-3 mt-6">' +
          '<div class="card card-pad"><span class="kpi-icon mb-3">' + FS.icon('file-text') + '</span>' +
            '<h4 class="mb-2">SEO templates</h4><p class="text-muted text-sm mb-0">' +
            (D.services.length + D.industries.length + D.vehicleTypes.length) +
            ' service, industry and vehicle pages generated from one reusable template.</p></div>' +
          '<div class="card card-pad"><span class="kpi-icon mb-3">' + FS.icon('list') + '</span>' +
            '<h4 class="mb-2">Blog posts</h4><p class="text-muted text-sm mb-0">' + D.posts.length +
            ' published across ' + D.postCategories.length + ' categories.</p></div>' +
          '<div class="card card-pad"><span class="kpi-icon mb-3">' + FS.icon('map') + '</span>' +
            '<h4 class="mb-2">Service areas</h4><p class="text-muted text-sm mb-0">' + D.serviceAreas.length +
            ' states listed on the public coverage page.</p></div>' +
        '</div>';

      document.getElementById('newPage').addEventListener('click', function () {
        FS.toast('Prototype only', 'Page creation needs the backend.', 'info');
      });
    }

    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cms]');
      if (!b) return;
      var p = D.cmsPages.filter(function (x) { return x.slug === b.dataset.cms; })[0];
      FS.modal({
        title: 'Edit: ' + p.title,
        subtitle: '/' + p.slug,
        size: 'lg',
        body: '<form id="cmsForm">' +
          '<div class="field"><label class="label" for="cmTitle">Page title</label>' +
            '<input class="input" id="cmTitle" value="' + FS.esc(p.title) + '"></div>' +
          '<div class="field"><label class="label" for="cmMeta">Meta description</label>' +
            '<textarea class="textarea" id="cmMeta" style="min-height:80px">FleetSquad — ' + FS.esc(p.title) + '</textarea></div>' +
          '<div class="field"><label class="label" for="cmBody">Body content</label>' +
            '<textarea class="textarea" id="cmBody" style="min-height:200px">Edit the copy for this page. In production this maps to a rich-text field on the CMS record.</textarea></div>' +
          '<div class="field"><label class="label" for="cmStatus">Status</label>' +
            '<select class="select" id="cmStatus">' +
              '<option' + (p.status === 'published' ? ' selected' : '') + '>published</option>' +
              '<option' + (p.status === 'draft' ? ' selected' : '') + '>draft</option>' +
            '</select></div>' +
        '</form>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="cmSave">Save page</button>',
        onMount: function (root, close) {
          root.querySelector('#cmSave').addEventListener('click', function () {
            p.title = root.querySelector('#cmTitle').value;
            p.status = root.querySelector('#cmStatus').value;
            p.updated = new Date().toISOString();
            close();
            FS.toast('Page saved', p.title, 'ok');
            render();
          });
        }
      });
    });
  }

  /* ======================================================================
     Shared notification view (used by all four roles)
     ====================================================================== */

  FS.dash.notificationsView = function (mount, audience, lead) {
    render();

    function render() {
      var list = Store.notifications(audience);
      mount.innerHTML =
        '<div class="page-head"><div><h2>Notifications</h2><p>' + FS.esc(lead) + '</p></div>' +
          '<div class="page-head-actions">' +
            '<button class="btn btn-outline" id="markAll">' + FS.icon('check') + 'Mark all read</button>' +
          '</div></div>' +

        '<div class="card"><div class="card-head">' +
          '<h3>Inbox <span class="badge badge--info">' + Store.unreadCount(audience) + ' unread</span></h3>' +
          '<span class="text-sm text-muted">' + list.length + ' total</span></div>' +
          (list.length ? list.map(function (n) {
            return '<div class="note-item' + (n.read ? '' : ' is-unread') + '">' +
              '<span class="note-channel note-channel--' + n.channel + '">' +
                FS.icon(n.channel === 'sms' ? 'message' : 'mail') + '</span>' +
              '<div class="note-body"><strong>' + FS.esc(n.title) + '</strong>' +
                '<p>' + FS.esc(n.body) + '</p>' +
                (n.orderId ? '<a class="text-xs text-blue text-bold" href="' +
                  FS.url(audience + '/' + (audience === 'admin' ? 'order-details' :
                         audience === 'mechanic' ? 'job-details' : 'project-details') + '.html?id=' + n.orderId) +
                  '">Open ' + FS.esc(n.orderId) + '</a>' : '') +
              '</div>' +
              '<span class="note-time">' + FS.ago(n.at) + '</span>' +
            '</div>';
          }).join('') : '<div class="empty-state">' + FS.icon('bell') +
            '<h4>Inbox zero</h4><p>No notifications for this role yet.</p></div>') +
        '</div>';

      document.getElementById('markAll').addEventListener('click', function () {
        Store.markAllRead(audience);
        FS.toast('All caught up', '', 'ok');
        render();
      });
    }
  };

  /* ======================================================================
     Dispatch
     ====================================================================== */

  var VIEWS = {
    'overview': overview,
    'orders': orders,
    'order-detail': orderDetail,
    'new-sale': newSale,
    'customers': customers,
    'mechanics': mechanics,
    'payments': payments,
    'reviews': reviews,
    'notifications': notifications,
    'cms': cms
  };

  function init() {
    var v = VIEWS[document.body.dataset.view];
    if (v) v();
    FS.hydrateIcons(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
