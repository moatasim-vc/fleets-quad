/* ==========================================================================
   FleetSquad — Admin dashboard
   Views: overview · orders · order-detail · new-sale · customers · mechanics
          payments · reviews · notifications · cms
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var C = D.company;
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
                { act: 'mark-paid', icon: 'check-circle', label: 'Mark fully paid' },
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
      else if (act === 'mark-paid') Dash.markPaidModal(o, render);
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
                  /* Lets an operator close out a project that was settled off
                     the platform — cash, cheque or a transfer. */
                  (o.payment === 'paid'
                    ? '<button class="btn btn-outline btn-block" data-act="unpaid">' + FS.icon('refresh') + 'Mark unpaid</button>'
                    : '<button class="btn btn-success btn-block" data-act="mark-paid">' + FS.icon('check-circle') + 'Mark project fully paid</button>') +
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
        else if (act === 'mark-paid') Dash.markPaidModal(o, render);
        else if (act === 'unpaid') {
          FS.confirm('Mark ' + o.id + ' unpaid?', 'The project goes back to awaiting payment.', function () {
            Store.updateOrder(o.id, { payment: 'unpaid' },
              { who: FS.shell.session.name, text: 'Payment status set back to unpaid' });
            FS.toast('Marked unpaid', o.id, 'warn');
            render();
          }, true);
        }
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
     New Sale — five-step workflow
     Labour and payment share one screen: an hourly rate times a number of
     hours, an optional free-form charge on top, then the card fields and a
     Charge button. Payment is optional — the sale can be booked unpaid and
     the mechanic assigned anyway, then marked fully paid later.
     ====================================================================== */

  function newSale() {
    var draft = { vehicles: [] };
    var step = 1;
    var mechQuery = '';   /* step 4 technician search */
    var STEPS = ['Create Customer', 'Vehicle Info', 'Labor &amp; Payment', 'Assign Mechanic', 'Confirmation'];

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
      return step5();
    }

    /** Labour subtotal plus whatever extra was typed in. */
    function totals() {
      var rate  = Number(draft.hourlyRate) || 0;
      var hours = Number(draft.hours) || 0;
      var labor = Math.round(rate * hours * 100) / 100;
      var extra = Number(draft.extraCharge) || 0;
      return { rate: rate, hours: hours, labor: labor, extra: extra, total: labor + extra };
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

    /* --- 3. Labor amount + payment ------------------------------------- */
    function step3() {
      var t = totals();

      return '<h3 class="mb-2">Select labor amount</h3>' +
        '<p class="text-muted mb-6">Enter the hourly rate and the number of hours. ' +
          'Add any other charge underneath, then take the card — or skip payment and bill later.</p>' +

        '<form id="nsForm" novalidate>' +

          /* Hourly rate x hours -------------------------------------------- */
          '<div class="rate-row">' +
            '<div class="field"><label class="label" for="ns_hourlyRate">Hourly rate ($) <span class="req">*</span></label>' +
              '<input class="input" id="ns_hourlyRate" name="hourlyRate" type="number" min="0" step="1" ' +
              'inputmode="decimal" placeholder="165" value="' + FS.esc(draft.hourlyRate == null ? '' : draft.hourlyRate) + '" required></div>' +
            '<span class="rate-op" aria-hidden="true">&times;</span>' +
            '<div class="field"><label class="label" for="ns_hours">Number of hours <span class="req">*</span></label>' +
              '<input class="input" id="ns_hours" name="hours" type="number" min="0" step="0.25" ' +
              'inputmode="decimal" placeholder="4" value="' + FS.esc(draft.hours == null ? '' : draft.hours) + '" required></div>' +
            '<span class="rate-op" aria-hidden="true">=</span>' +
            '<div class="field"><label class="label">Labor total</label>' +
              '<output class="input input--readonly" id="nsLaborOut">' + FS.money(t.labor, true) + '</output></div>' +
          '</div>' +

          /* Anything else ---------------------------------------------------- */
          '<div class="divider"></div>' +
          '<div class="field-row field-row-2">' +
            '<div class="field"><label class="label" for="ns_extraCharge">Additional charge ($)</label>' +
              '<input class="input" id="ns_extraCharge" name="extraCharge" type="number" min="0" step="1" ' +
              'inputmode="decimal" placeholder="0" value="' + FS.esc(draft.extraCharge == null ? '' : draft.extraCharge) + '">' +
              '<p class="hint">Parts, materials, call-out — any amount you want to add.</p></div>' +
            '<div class="field"><label class="label" for="ns_extraLabel">What is it for?</label>' +
              '<input class="input" id="ns_extraLabel" name="extraLabel" type="text" ' +
              'placeholder="Parts &amp; materials" value="' + FS.esc(draft.extraLabel || '') + '"></div>' +
          '</div>' +

          /* Running total ---------------------------------------------------- */
          '<div class="card mt-6"><div class="card-body">' +
            '<div class="money-row"><span id="nsLaborLine">Labor · ' +
              (t.hours ? FS.money(t.rate) + ' &times; ' + t.hours + ' h' : 'rate &times; hours') + '</span>' +
              '<strong id="nsLaborAmt">' + FS.money(t.labor, true) + '</strong></div>' +
            '<div class="money-row"><span id="nsExtraLine">' + FS.esc(draft.extraLabel || 'Additional charge') + '</span>' +
              '<strong id="nsExtraAmt">' + FS.money(t.extra, true) + '</strong></div>' +
            '<div class="money-row money-row--total"><span>Amount due</span>' +
              '<strong id="nsTotalAmt">' + FS.money(t.total, true) + '</strong></div>' +
          '</div></div>' +

          /* Card ------------------------------------------------------------- */
          '<div class="divider"></div>' +
          '<h4 class="mb-2">Charge the customer</h4>' +
          '<p class="text-muted text-sm mb-5">Optional. Leave it blank to book the project unpaid — ' +
            'you can still assign a mechanic and mark the project fully paid later.</p>' +

          (draft.paid
            ? '<div class="alert alert--ok">' + FS.icon('check-circle') +
                '<div><strong>Payment captured — ' + FS.money(draft.paidAmount, true) + '</strong><br>' +
                FS.esc(draft.cardLabel) + '. The receipt is emailed with the confirmation.</div></div>' +
              '<button class="btn btn-outline btn-sm mt-4" id="nsUndoPay" type="button">' +
                FS.icon('refresh') + 'Undo payment</button>'
            : '<div class="pay-box">' +
                '<div class="field"><label class="label" for="ns_card">Credit card number</label>' +
                  '<div class="input-icon">' + FS.icon('credit-card') +
                  '<input class="input" id="ns_card" name="card" type="text" inputmode="numeric" ' +
                  'autocomplete="cc-number" maxlength="23" placeholder="4242 4242 4242 4242" ' +
                  'value="' + FS.esc(draft.card || '') + '"></div></div>' +
                '<div class="field-row field-row-3">' +
                  '<div class="field"><label class="label" for="ns_exp">Exp date</label>' +
                    '<input class="input" id="ns_exp" name="exp" type="text" inputmode="numeric" ' +
                    'autocomplete="cc-exp" maxlength="5" placeholder="MM/YY" value="' + FS.esc(draft.exp || '') + '"></div>' +
                  '<div class="field"><label class="label" for="ns_cvc">CVC</label>' +
                    '<input class="input" id="ns_cvc" name="cvc" type="text" inputmode="numeric" ' +
                    'autocomplete="cc-csc" maxlength="4" placeholder="123" value="' + FS.esc(draft.cvc || '') + '"></div>' +
                  '<div class="field"><label class="label" for="ns_cardZip">Zip code</label>' +
                    '<input class="input" id="ns_cardZip" name="cardZip" type="text" inputmode="numeric" ' +
                    'autocomplete="postal-code" maxlength="5" placeholder="' + FS.esc(draft.zip || '10001') + '" ' +
                    'value="' + FS.esc(draft.cardZip || '') + '"></div>' +
                '</div>' +
                '<button class="btn btn-dark btn-block mt-4" type="button" id="nsCharge">' +
                  FS.icon('credit-card') + 'Charge <span id="nsChargeAmt">' + FS.money(t.total, true) + '</span></button>' +
                '<p class="hint text-center mt-3">Card details are never stored — in production this posts ' +
                  'straight to Stripe. Nothing is charged in this prototype.</p>' +
              '</div>') +
        '</form>' +
        nav('Back', 'Continue');
    }

    /* --- 4. Assign mechanic --------------------------------------------- */
    /**
     * Technicians matching the step 4 search box. Name is matched on any word
     * so "mendez" finds Carlos Mendez, and the phone comparison drops
     * punctuation so "2125550301" and "212 555" both match "(212) 555-0301".
     * @returns {Array} the mechanics to show, unfiltered when nothing is typed
     */
    function matchingMechanics() {
      var q = mechQuery.trim().toLowerCase();
      if (!q) return Store.mechanics();
      var digits = q.replace(/\D/g, '');
      return Store.mechanics().filter(function (m) {
        if ((m.name + ' ' + m.email + ' ' + m.certs + ' ' + m.city + ' ' + m.state)
            .toLowerCase().indexOf(q) > -1) return true;
        return digits.length >= 3 && String(m.phone).replace(/\D/g, '').indexOf(digits) > -1;
      });
    }

    function mechList() {
      var found = matchingMechanics();

      // Say so rather than letting a selection silently disappear.
      var chosen = draft.mechanicId ? Store.mechanic(draft.mechanicId) : null;
      var hidden = chosen && !found.some(function (m) { return m.id === chosen.id; })
        ? '<div class="alert alert--info mb-3">' + FS.icon('info') +
          '<div><strong>' + FS.esc(chosen.name) + '</strong> is still selected — ' +
          'the search is hiding them. Clear the box to see them again.</div></div>'
        : '';

      if (!found.length) {
        return hidden + '<div class="empty-state empty-state--sm">' + FS.icon('search') +
          '<h4>No technician matches that</h4>' +
          '<p>Try part of a name, a phone number or an email address.</p></div>';
      }
      return hidden + found.map(function (m) {
        return '<label class="opt-card' + (draft.mechanicId === m.id ? ' is-selected' : '') + '">' +
          '<input type="radio" name="mech" value="' + m.id + '"' + (draft.mechanicId === m.id ? ' checked' : '') + '>' +
          '<span class="avatar avatar--sm">' + FS.initials(m.name) + '</span>' +
          '<span style="flex:1 1 auto;min-width:0"><strong>' + FS.esc(m.name) + '</strong>' +
          '<span>' + FS.esc(m.certs) + ' · ' + FS.esc(m.city + ', ' + m.state) + ' · ' + FS.money(m.hourlyRate) + '/h</span>' +
          '<span class="opt-card-contact">' + FS.esc(m.phone) + ' · ' + FS.esc(m.email) + '</span></span>' +
          '<span class="badge badge--' + (m.status === 'available' ? 'ok' : m.status === 'on-job' ? 'warn' : 'neutral') + '">' +
          FS.esc(m.status) + '</span></label>';
      }).join('');
    }

    function step4() {
      var t = totals();
      return '<h3 class="mb-2">Assign mechanic</h3>' +
        '<p class="text-muted mb-6">The technician receives an SMS with the project ID, service type and location. ' +
          'A project can be assigned whether or not it has been paid.</p>' +

        '<div class="alert alert--' + (draft.paid ? 'ok' : 'warn') + ' mb-6">' +
          FS.icon(draft.paid ? 'check-circle' : 'alert-triangle') +
          '<div>' + (draft.paid
            ? '<strong>Paid — ' + FS.money(draft.paidAmount, true) + '</strong> collected on ' + FS.esc(draft.cardLabel) + '.'
            : '<strong>Unpaid — ' + FS.money(t.total, true) + ' outstanding.</strong> ' +
              'The project books anyway and can be marked fully paid from the project screen.') +
          '</div></div>' +

        /* Search sits above the list so a long roster can be narrowed by
           first name, last name, phone or email before picking. */
        '<div class="list-search mb-4">' +
          '<span class="list-search-ico">' + FS.icon('search') + '</span>' +
          '<input class="input" id="nsMechSearch" type="search" autocomplete="off" ' +
            'placeholder="Search technicians by name, phone or email" ' +
            'aria-label="Search available mechanics" value="' + FS.esc(mechQuery) + '">' +
          '<span class="list-search-count" id="nsMechCount"></span>' +
        '</div>' +

        '<div class="stack" id="nsMechList">' + mechList() + '</div>' +
        '<label class="opt-card mt-3">' +
          '<input type="radio" name="mech" value=""' + (draft.mechanicId === '' ? ' checked' : '') + '>' +
          '<span class="avatar avatar--sm">' + FS.icon('clock') + '</span>' +
          '<span style="flex:1 1 auto"><strong>Leave unassigned for now</strong>' +
          '<span>Books the project as Open so dispatch can pick the technician.</span></span></label>' +
        nav('Back', 'Complete sale');
    }

    /* --- 5. Confirmation ------------------------------------------------ */
    function step5() {
      var o = draft.created;
      var c = draft.customer;
      var mech = Store.mechanic(o.mechanicId);
      return '<div class="success-hero">' +
          '<div class="success-mark">' + FS.icon('check') + '</div>' +
          '<h2>Sale complete</h2>' +
          '<p class="text-muted" style="max-width:46ch;margin:10px auto 0">' +
            'The project is live' + (mech ? ', the technician has been notified' : '') +
            ' and the customer has portal access.</p>' +
          '<div class="mt-6"><span class="ref-badge"><small>Project ID</small><strong>' + FS.esc(o.id) + '</strong></span>' +
            ' ' + Dash.paymentBadge(o.payment) + '</div>' +
        '</div>' +

        '<div class="dash-grid dash-grid--1-1 mt-6">' +
          '<div class="card"><div class="card-head"><h4>Customer login credentials</h4></div><div class="card-body">' +
            '<div class="creds">' +
              '<div class="creds-row"><small>Portal</small><code>fleetsquad.com/login</code></div>' +
              '<div class="creds-row"><small>Username</small><code>' + FS.esc(c.email) + '</code></div>' +
              '<div class="creds-row"><small>Temp password</small><code>' + FS.esc(draft.tempPassword) + '</code></div>' +
            '</div>' +
            '<p class="hint mt-4">The customer is asked to change this on first sign-in.</p>' +

            '<div class="divider"></div>' +
            '<div class="money-row"><span>Labor · ' + FS.money(draft.rate) + ' &times; ' + draft.hours + ' h</span>' +
              '<strong>' + FS.money(o.laborTotal, true) + '</strong></div>' +
            (o.partsTotal ? '<div class="money-row"><span>' + FS.esc(draft.extraLabel || 'Additional charge') + '</span>' +
              '<strong>' + FS.money(o.partsTotal, true) + '</strong></div>' : '') +
            '<div class="money-row money-row--total"><span>' +
              (o.payment === 'paid' ? 'Paid' : 'Outstanding') + '</span>' +
              '<strong>' + FS.money(draft.total, true) + '</strong></div>' +
          '</div></div>' +

          '<div class="card"><div class="card-head"><h4>Notifications sent</h4></div><div class="card-body">' +
            (mech ? '<div class="msg-preview mb-4">' +
              '<div class="msg-preview-head">' + FS.icon('message') + 'SMS to ' + FS.esc(mech.name) + '</div>' +
              '<div class="msg-preview-body">New Project Assigned\nProject ID: ' + o.id +
                '\nService Type: ' + o.serviceType + '\nLocation: ' + o.address + ', ' + o.city + ', ' + o.state + '</div>' +
            '</div>' : '') +
            '<div class="msg-preview">' +
              '<div class="msg-preview-head">' + FS.icon('mail') + 'Email to customer</div>' +
              '<div class="msg-preview-body">Welcome to FleetSquad, ' + FS.esc(c.firstName) + '.\n' +
                'Project ' + o.id + ' is confirmed. Total ' + FS.money(draft.total, true) + '.\n' +
                (o.payment === 'paid'
                  ? 'Payment received — thank you.\n'
                  : 'A payment link follows separately.\n') +
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

      if (step === 3) wireLaborStep();
      if (step === 4) wireMechStep();

      var restart = document.getElementById('nsRestart');
      if (restart) restart.addEventListener('click', function () {
        draft = { vehicles: [] }; mechQuery = ''; step = 1; render();
      });

      var next = document.getElementById('nsNext');
      if (next) next.addEventListener('click', onNext);
    }

    /* Typing filters the roster in place. Only the list is repainted, so the
       search box keeps focus and the caret, and a technician picked before
       searching stays picked even while filtered out of view. */
    function wireMechStep() {
      var box = document.getElementById('nsMechSearch');
      var list = document.getElementById('nsMechList');
      var count = document.getElementById('nsMechCount');
      if (!box) return;

      // host survives every repaint, so this is bound once for the wizard.
      if (!host.dataset.mechBound) {
        host.dataset.mechBound = '1';
        host.addEventListener('change', function (e) {
          if (e.target.name === 'mech') draft.mechanicId = e.target.value;
        });
      }

      function paint() {
        var total = Store.mechanics().length;
        var found = matchingMechanics().length;
        count.textContent = mechQuery.trim() ? found + ' of ' + total : total + ' technicians';
        list.innerHTML = mechList();
        FS.hydrateIcons(list);
      }

      box.addEventListener('input', function () { mechQuery = box.value; paint(); });
      box.addEventListener('search', function () { mechQuery = box.value; paint(); });
      paint();
    }

    /* Rate x hours recalculates as you type, and the Charge button follows. */
    function wireLaborStep() {
      var rate  = document.getElementById('ns_hourlyRate');
      var hours = document.getElementById('ns_hours');
      var extra = document.getElementById('ns_extraCharge');
      var label = document.getElementById('ns_extraLabel');

      [rate, hours, extra, label].forEach(function (input) {
        if (!input) return;
        input.addEventListener('input', function () {
          draft.hourlyRate  = rate.value;
          draft.hours       = hours.value;
          draft.extraCharge = extra.value;
          draft.extraLabel  = label.value;
          paint();
        });
      });

      function paint() {
        var t = totals();
        set('nsLaborOut', FS.money(t.labor, true));
        set('nsLaborAmt', FS.money(t.labor, true));
        set('nsExtraAmt', FS.money(t.extra, true));
        set('nsTotalAmt', FS.money(t.total, true));
        set('nsChargeAmt', FS.money(t.total, true));
        set('nsLaborLine', t.hours ? 'Labor · ' + FS.money(t.rate) + ' × ' + t.hours + ' h' : 'Labor · rate × hours');
        set('nsExtraLine', draft.extraLabel || 'Additional charge');
      }
      function set(id, text) {
        var node = document.getElementById(id);
        if (node) node.textContent = text;
      }

      /* Card number and expiry format themselves as you type. */
      var card = document.getElementById('ns_card');
      if (card) card.addEventListener('input', function () {
        var digits = card.value.replace(/\D/g, '').slice(0, 19);
        card.value = digits.replace(/(.{4})/g, '$1 ').trim();
      });

      var exp = document.getElementById('ns_exp');
      if (exp) exp.addEventListener('input', function () {
        var d = exp.value.replace(/\D/g, '').slice(0, 4);
        exp.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
      });

      var charge = document.getElementById('nsCharge');
      if (charge) charge.addEventListener('click', takePayment);

      var undo = document.getElementById('nsUndoPay');
      if (undo) undo.addEventListener('click', function () {
        draft.paid = false;
        draft.paidAmount = 0;
        draft.cardLabel = '';
        render();
      });
    }

    /* Simulated authorisation. A real build hands these fields to Stripe.js
       and never lets the number reach our own code. */
    function takePayment() {
      var t = totals();
      if (t.total <= 0) {
        FS.toast('Nothing to charge', 'Enter a rate and hours first.', 'warn');
        return;
      }
      var number = (document.getElementById('ns_card').value || '').replace(/\D/g, '');
      var exp    = document.getElementById('ns_exp').value || '';
      var cvc    = (document.getElementById('ns_cvc').value || '').replace(/\D/g, '');
      var zip    = (document.getElementById('ns_cardZip').value || '').replace(/\D/g, '');

      if (number.length < 13) { FS.toast('Check the card number', 'Enter the full number on the card.', 'warn'); return; }
      if (!/^\d{2}\/\d{2}$/.test(exp)) { FS.toast('Check the expiry', 'Use MM/YY.', 'warn'); return; }
      if (cvc.length < 3) { FS.toast('Check the CVC', 'Three or four digits.', 'warn'); return; }
      if (zip.length !== 5) { FS.toast('Check the zip code', 'Five digits.', 'warn'); return; }

      var brand = number[0] === '4' ? 'Visa' : number[0] === '5' ? 'Mastercard' :
                  number[0] === '3' ? 'Amex' : number[0] === '6' ? 'Discover' : 'Card';

      draft.paid       = true;
      draft.paidAmount = t.total;
      draft.cardLabel  = brand + ' •••• ' + number.slice(-4);
      draft.cardZip    = zip;
      // The number, CVC and expiry are deliberately not kept on the draft.
      draft.card = ''; draft.cvc = ''; draft.exp = '';

      FS.toast('Payment captured', FS.money(t.total, true) + ' on ' + draft.cardLabel, 'ok');
      render();
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
        draft.hourlyRate  = document.getElementById('ns_hourlyRate').value;
        draft.hours       = document.getElementById('ns_hours').value;
        draft.extraCharge = document.getElementById('ns_extraCharge').value;
        draft.extraLabel  = document.getElementById('ns_extraLabel').value;
        if (totals().total <= 0) {
          FS.toast('Enter an amount', 'A sale needs a labor rate and hours, or an additional charge.', 'warn');
          return;
        }
      } else if (step === 4) {
        // A technician chosen before the search was narrowed may no longer be
        // in the DOM, so the recorded choice is the fallback.
        var picked = host.querySelector('input[name="mech"]:checked');
        if (!picked && draft.mechanicId === undefined) {
          FS.toast('Choose an option', 'Pick a technician, or leave the project unassigned.', 'warn');
          return;
        }
        draft.mechanicId = picked ? picked.value : draft.mechanicId;
        finish();
        step = 5;
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
      var t = totals();
      var tempPassword = 'FS-' + Math.abs(hashCode(draft.email)).toString(36).slice(0, 6).toUpperCase();

      var customer = Store.createCustomer({
        company: draft.company, firstName: draft.firstName, lastName: draft.lastName,
        email: draft.email, phone: draft.phone, city: draft.city, state: draft.state,
        zip: draft.zip, fleetSize: draft.vehicles.length, password: tempPassword
      });

      var order = Store.createOrder({
        customerId: customer.id,
        serviceType: draft.serviceType,
        urgency: draft.urgency,
        vehicleCount: draft.vehicles.length,
        allowedVehicles: Number(draft.allowedVehicles) || draft.vehicles.length,
        address: draft.address, city: draft.city, state: draft.state, zip: draft.zip,
        location: draft.location, details: draft.details,
        hourlyRate: t.rate,
        laborHours: t.hours,
        laborTotal: t.labor,
        partsTotal: t.extra,
        extraLabel: draft.extraLabel || 'Additional charge',
        mechanicPayout: Math.round(t.labor * 0.45),
        // Unpaid projects still book and still take a mechanic.
        status: draft.mechanicId ? 'assigned' : 'open',
        payment: draft.paid ? 'paid' : 'unpaid'
      });

      draft.vehicles.forEach(function (v) { Store.addVehicle(order.id, v); });
      // addVehicle recalculates labour from the vehicle rows; restore the
      // amount the operator actually entered on step 3.
      Store.updateOrder(order.id, { laborTotal: t.labor, partsTotal: t.extra });

      if (draft.mechanicId) {
        Store.assignMechanic(order.id, draft.mechanicId, FS.shell.session.name);
      }

      if (draft.paid) {
        Store.addPayment({
          orderId: order.id, customerId: customer.id, amount: t.total,
          method: 'Stripe · ' + draft.cardLabel, type: 'charge', status: 'succeeded'
        });
        Store.logTimeline(order.id, FS.shell.session.name,
          'Payment of ' + FS.money(t.total, true) + ' captured on ' + draft.cardLabel);
      } else {
        Store.logTimeline(order.id, FS.shell.session.name,
          'Booked unpaid — ' + FS.money(t.total, true) + ' outstanding');
      }

      Store.notify({
        channel: 'email', audience: 'customer', orderId: order.id,
        title: 'Welcome to FleetSquad',
        body: 'Project ' + order.id + ' is confirmed. Total ' + FS.money(t.total, true) +
              (draft.paid ? '. Payment received — thank you.' : '. A payment link follows separately.') +
              ' Sign in to track every vehicle in real time.'
      });

      draft.rate = t.rate;
      draft.total = t.total;
      draft.customer = customer;
      draft.created = Store.order(order.id);
      draft.tempPassword = tempPassword;
    }

    function hashCode(s) {
      var h = 0;
      for (var i = 0; i < String(s).length; i++) { h = ((h << 5) - h) + String(s).charCodeAt(i); h |= 0; }
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
     Inbox
     What the public contact form collected. There is no mail server behind
     the prototype, so the form files the message in this browser instead and
     it is read here — newest at the top, unread highlighted, and the count in
     the sidebar is the number still unanswered.
     ====================================================================== */

  function inbox() {
    render();

    function render() {
      var list = Store.inbox();
      var unread = Store.inboxUnread();

      host.innerHTML =
        '<div class="page-head"><div><h2>Inbox</h2>' +
          '<p>Every message sent from the contact form on the website, newest first. ' +
            'They are addressed to <strong>' + FS.esc(C.contactEmail) + '</strong> — ' +
            'open one to read it in full and reply by email.</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url('pages/contact.html') + '" target="_blank" rel="noopener">' +
              FS.icon('external') + 'Contact page</a>' +
            '<button class="btn btn-primary" id="ibReadAll"' + (unread ? '' : ' disabled') + '>' +
              FS.icon('check') + 'Mark all read</button>' +
          '</div>' +
        '</div>' +

        '<div class="card"><div class="card-head">' +
          '<h3>Messages ' +
            (unread ? '<span class="badge badge--danger">' + unread + ' unread</span>' : '') + '</h3>' +
          '<span class="text-sm text-muted">' + list.length + ' total</span></div>' +
          (list.length
            ? list.map(row).join('')
            : '<div class="empty-state">' + FS.icon('mail') +
              '<h4>No messages yet</h4><p>Anything sent from the contact form lands here.</p></div>') +
        '</div>';

      /* The whole row opens the message; the buttons inside it stop the click
         so they do not open it as well. */
      FS.$$('[data-ibopen]', host).forEach(function (el) {
        el.addEventListener('click', function () { openMessage(el.dataset.ibopen); });
      });

      FS.$$('[data-ibtoggle]', host).forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var m = Store.inboxMessage(b.dataset.ibtoggle);
          Store.markMessageRead(m.id, !m.read);
          render();
        });
      });

      FS.$$('[data-ibdel]', host).forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var m = Store.inboxMessage(b.dataset.ibdel);
          FS.confirm('Delete this message?',
            'The message from ' + m.name + ' is removed from the inbox. This cannot be undone.',
            function () {
              Store.deleteMessage(m.id);
              FS.toast('Message deleted', m.name, 'ok');
              render();
            }, true);
        });
      });

      document.getElementById('ibReadAll').addEventListener('click', function () {
        Store.markAllMessagesRead();
        FS.toast('Inbox cleared', 'Every message is marked read.', 'ok');
        render();
      });

      // The sidebar pill is the same unread number, so keep the two in step.
      FS.refreshNavCounts();
      FS.hydrateIcons(host);
    }

    /** One row in the list. The body is trimmed to a single teaser line. */
    function row(m) {
      var teaser = String(m.message || '').replace(/\s+/g, ' ');
      if (teaser.length > 150) teaser = teaser.slice(0, 149).replace(/\s\S*$/, '') + '…';

      return '<div class="note-item' + (m.read ? '' : ' is-unread') + '" ' +
          'data-ibopen="' + FS.esc(m.id) + '" style="cursor:pointer">' +
        '<span class="note-channel note-channel--email">' + FS.icon('mail') + '</span>' +
        '<div class="note-body">' +
          '<strong>' + FS.esc(m.name) + ' · ' + FS.esc(m.company || '—') + '</strong>' +
          '<p>' + FS.esc(teaser) + '</p>' +
          '<small class="text-xs text-dim">' + FS.esc(m.topic || 'General') + ' · ' +
            FS.esc(m.email) + (m.phone ? ' · ' + FS.esc(m.phone) : '') + '</small>' +
        '</div>' +
        '<div class="stack" style="gap:6px;align-items:flex-end">' +
          '<span class="note-time">' + FS.ago(m.at) + '</span>' +
          '<span class="row" style="gap:4px">' +
            '<button class="btn btn-xs btn-outline" data-ibtoggle="' + FS.esc(m.id) + '">' +
              (m.read ? 'Mark unread' : 'Mark read') + '</button>' +
            '<button class="btn btn-xs btn-danger" data-ibdel="' + FS.esc(m.id) + '" ' +
              'aria-label="Delete message">' + FS.icon('trash') + '</button>' +
          '</span>' +
        '</div>' +
      '</div>';
    }

    /** Read one in full. Opening it counts as reading it. */
    function openMessage(id) {
      var m = Store.inboxMessage(id);
      if (!m) return;
      Store.markMessageRead(m.id);

      var subject = 'Re: ' + (m.topic || 'Your message') + ' — ' + (m.company || m.name);
      FS.modal({
        title: m.name,
        subtitle: (m.company ? m.company + ' · ' : '') + FS.date(m.at),
        size: 'lg',
        body:
          '<dl class="dl dl--2 mb-5">' +
            '<div><dt>Email</dt><dd><a href="mailto:' + FS.esc(m.email) + '">' + FS.esc(m.email) + '</a></dd></div>' +
            '<div><dt>Phone</dt><dd>' + (m.phone
              ? '<a href="tel:' + FS.esc(m.phone) + '">' + FS.esc(m.phone) + '</a>' : '—') + '</dd></div>' +
            '<div><dt>Topic</dt><dd>' + FS.esc(m.topic || 'General') + '</dd></div>' +
            '<div><dt>Sent to</dt><dd>' + FS.esc(m.to || C.contactEmail) + '</dd></div>' +
          '</dl>' +
          '<h4 class="mb-2">Message</h4>' +
          '<p class="prose" style="white-space:pre-line">' + FS.esc(m.message) + '</p>',
        footer:
          '<button class="btn btn-outline" data-close>Close</button>' +
          '<a class="btn btn-primary" href="mailto:' + FS.esc(m.email) +
            '?subject=' + encodeURIComponent(subject) + '">' + FS.icon('mail') + 'Reply by email</a>'
      });
      // The row behind the dialog is no longer unread, and nor is the sidebar.
      render();
    }
  }

  /* ======================================================================
     CMS pages
     ====================================================================== */

  function cms() {
    render();

    /** "1 section" / "6 sections" — the count under a page name. */
    function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
    function note(text) { return '<br><small class="text-xs text-dim">' + text + '</small>'; }

    function render() {
      /* The homepage leads the list. A state saved by an earlier build picked
         it up as an addition, so it would otherwise sit at the bottom. */
      var pages = Store.cmsPages().slice().sort(function (a, b) {
        return (b.slug === 'home') - (a.slug === 'home');
      });

      host.innerHTML =
        '<div class="page-head"><div><h2>CMS Pages</h2>' +
          '<p>The heading, standfirst and search-engine record for every inner page reachable from the nav bar — ' +
            'the body copy on About, Contact, Privacy and Terms, and the search-engine record for the homepage. ' +
            'Edits show on the live page straight away.</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url('admin/blog.html') + '">' + FS.icon('edit') + 'Blog</a>' +
            '<a class="btn btn-outline" href="' + FS.url('admin/service-areas.html') + '">' + FS.icon('map') + 'Service Areas</a>' +
          '</div>' +
        '</div>' +

        '<div class="table-wrap"><div class="scroll-x">' +
          '<table class="table table--stack"><thead><tr>' +
            '<th>Page</th><th>Address</th><th>Meta title</th><th>Last updated</th><th>Status</th><th class="td-actions">Actions</th>' +
          '</tr></thead><tbody>' + pages.map(function (p) {
            var titleLen = (p.metaTitle || '').length;
            var descLen = (p.metaDescription || '').length;
            var seoOk = titleLen >= 25 && titleLen <= 62 && descLen >= 90 && descLen <= 165;
            return '<tr>' +
              '<td data-label="Page" class="td-strong">' + FS.esc(p.title) +
                // Partners is the one page whose cards are edited here too —
                // say so, otherwise nobody would think to open it.
                (p.slug === 'partners'
                  ? note(plural(Store.partners().length, 'partner card'))
                  : p.slug === 'faqs'
                    ? note(plural(Store.faqs().length, 'question'))
                  : Store.hasBlocks(p.slug)
                    ? note(plural(Store.cmsBlocks(p.slug).length, 'section') +
                        (p.mapAddress || p.mapEmbed ? ' · map' : ''))
                  // Home is listed for its meta only — say so, so nobody opens
                  // it looking for the hero copy.
                  : p.metaOnly
                    ? note('Search engine listing only')
                  : '') + '</td>' +
              '<td data-label="Address"><code class="text-sm text-dim">' +
                FS.esc(p.address || '/' + p.slug) + '</code></td>' +
              '<td data-label="Meta title"><span class="text-sm">' + FS.esc(p.metaTitle || '—') + '</span><br>' +
                '<small class="text-xs ' + (seoOk ? 'text-ok' : 'text-dim') + '">' +
                'Title ' + titleLen + '/60 · Description ' + descLen + '/160</small></td>' +
              '<td data-label="Updated">' + FS.date(p.updated) + '</td>' +
              '<td data-label="Status"><span class="badge badge--' + (p.status === 'published' ? 'ok' : 'warn') + '">' +
                FS.esc(p.status) + '</span></td>' +
              '<td class="td-actions" data-label="Actions">' +
                '<a class="btn btn-xs btn-outline" href="' + FS.url(p.url || 'pages/' + p.slug + '.html') + '" target="_blank" rel="noopener">' +
                  FS.icon('external') + 'View</a> ' +
                '<button class="btn btn-xs btn-primary" data-cms="' + p.slug + '">' + FS.icon('edit') + 'Edit</button>' +
              '</td></tr>';
          }).join('') + '</tbody></table></div></div>' +

        '<div class="grid grid-3 mt-6">' +
          '<div class="card card-pad"><span class="kpi-icon mb-3">' + FS.icon('file-text') + '</span>' +
            '<h4 class="mb-2">SEO templates</h4><p class="text-muted text-sm mb-0">' +
            (Store.catalog('service').length + Store.catalog('industry').length + Store.catalog('vehicle').length) +
            ' service, industry and vehicle pages, each with its own copy and search-engine record. ' +
            'Edit them under Services, Industries and Vehicle Types.</p></div>' +
          '<a class="card card-pad card-hover" href="' + FS.url('admin/blog.html') + '"><span class="kpi-icon mb-3">' + FS.icon('list') + '</span>' +
            '<h4 class="mb-2">Blog posts</h4><p class="text-muted text-sm mb-0">' + Store.posts('published').length +
            ' published across ' + D.postCategories.length + ' categories. Edit copy, SEO and article links.</p></a>' +
          '<a class="card card-pad card-hover" href="' + FS.url('admin/service-areas.html') + '"><span class="kpi-icon mb-3">' + FS.icon('map') + '</span>' +
            '<h4 class="mb-2">Service areas</h4><p class="text-muted text-sm mb-0">' + Store.serviceAreas(true).length +
            ' states on the public coverage page. Add states, counties and cities.</p></a>' +
        '</div>';

      FS.$$('[data-cms]', host).forEach(function (b) {
        b.addEventListener('click', function () { editModal(Store.cmsPage(b.dataset.cms)); });
      });
      FS.hydrateIcons(host);
    }

    function editModal(p) {
      /* The Partners page is the one CMS page that carries a repeating list as
         well as copy, so its cards are edited in this same dialog. Rows are
         held in a working copy and only committed on Save. */
      var isPartners = p.slug === 'partners';
      var isFaqs = p.slug === 'faqs';
      var isContact = p.slug === 'contact';
      /* Home is here for its search-engine listing alone: its heading and copy
         are the hero markup and the blocks drawn from services, reviews and
         the blog, none of which this dialog owns. */
      var metaOnly = !!p.metaOnly;
      /* About, Contact, Privacy and Terms carry their body copy as a list of
         sections rather than markup, so the whole page is editable here. */
      var hasBlocks = Store.hasBlocks(p.slug);
      var rows = isPartners
        ? Store.partners().map(function (x) { return Object.assign({}, x); })
        : [];
      var faqRows = isFaqs
        ? Store.faqs().map(function (x) { return Object.assign({}, x); })
        : [];
      var blocks = hasBlocks
        ? Store.cmsBlocks(p.slug).map(function (x) { return Object.assign({}, x); })
        : [];

      FS.modal({
        title: 'Edit: ' + p.title,
        subtitle: p.address || '/' + p.slug,
        size: 'lg',
        body: '<form id="cmsForm">' +
          (metaOnly
            ? '<p class="text-muted text-sm mb-5">This is the title, description and ' +
                'keywords the homepage gives Google and the social cards. The copy on ' +
                'the page itself is edited where that content lives — services under ' +
                'Services, the reviews strip under Reviews, the articles under Blog.</p>'
            : '<div class="field"><label class="label" for="cmName">Name in the admin</label>' +
                '<input class="input" id="cmName" name="title" value="' + FS.esc(p.title) + '"></div>' +
              '<div class="field"><label class="label" for="cmHeading">Page heading (H1)</label>' +
                '<input class="input" id="cmHeading" name="heading" value="' + FS.esc(p.heading || '') + '"></div>' +
              '<div class="field"><label class="label" for="cmLead">Standfirst under the heading</label>' +
                '<textarea class="textarea" id="cmLead" name="lead" style="min-height:70px">' +
                FS.esc(p.lead || '') + '</textarea></div>') +

          (hasBlocks
            ? '<div class="divider"></div>' +
              '<div class="row-between mb-3">' +
                '<h4 class="mb-0">Page content</h4>' +
                '<button type="button" class="btn btn-sm btn-outline" id="cmAddBlock">' +
                  FS.icon('plus') + 'Add section</button>' +
              '</div>' +
              '<p class="text-muted text-sm mb-4">Each section is a heading and its text on the live page. ' +
                'Leave a blank line to start a new paragraph, and link with markdown: ' +
                '<code>[text](https://…)</code>.</p>' +
              '<div class="repeater" id="cmBlocks"></div>'
            : '') +

          (isContact
            ? '<div class="divider"></div>' +
              '<h4 class="mb-3">Google map</h4>' +
              '<p class="text-muted text-sm mb-4">Type the address the map should centre on. ' +
                'It uses Google\'s public embed — no API key and no account needed. ' +
                'Clear the address to take the map off the page.</p>' +
              '<div class="field"><label class="label" for="cmMapAddress">Address or place</label>' +
                '<input class="input" id="cmMapAddress" name="mapAddress" ' +
                'value="' + FS.esc(p.mapAddress || '') + '" ' +
                'placeholder="1200 Fleet Way, Newark, NJ 07102"></div>' +
              '<div class="field"><label class="label" for="cmMapLabel">Heading above the map</label>' +
                '<input class="input" id="cmMapLabel" name="mapLabel" ' +
                'value="' + FS.esc(p.mapLabel || '') + '" placeholder="Where we are"></div>' +
              '<div class="field"><label class="label" for="cmMapEmbed">Advanced: paste an embed link</label>' +
                '<input class="input" id="cmMapEmbed" name="mapEmbed" ' +
                'value="' + FS.esc(p.mapEmbed || '') + '" ' +
                'placeholder="https://www.google.com/maps/embed?pb=…">' +
                '<p class="hint">From Google Maps → Share → Embed a map. Overrides the address above. ' +
                  'Only google.com links are accepted.</p></div>' +
              '<div class="map-embed map-embed--preview mb-2" id="cmMapPreview"></div>'
            : '') +

          '<div class="divider"></div>' +
          '<h4 class="mb-4">Search engine listing</h4>' +
          '<div class="field"><label class="label" for="cmMetaTitle">Meta title</label>' +
            '<input class="input" id="cmMetaTitle" name="metaTitle" value="' + FS.esc(p.metaTitle || '') + '">' +
            '<p class="hint" id="cmTitleCount"></p></div>' +
          '<div class="field"><label class="label" for="cmMeta">Meta description</label>' +
            '<textarea class="textarea" id="cmMeta" name="metaDescription" style="min-height:80px">' +
            FS.esc(p.metaDescription || '') + '</textarea>' +
            '<p class="hint" id="cmDescCount"></p></div>' +
          '<div class="field"><label class="label" for="cmKeywords">Keywords</label>' +
            '<input class="input" id="cmKeywords" name="keywords" value="' + FS.esc(p.keywords || '') + '">' +
            '<p class="hint">Comma separated.</p></div>' +
          // No status on the homepage — it cannot be taken off the site.
          (metaOnly
            ? ''
            : '<div class="field"><label class="label" for="cmStatus">Status</label>' +
                '<select class="select" id="cmStatus" name="status">' +
                  '<option value="published"' + (p.status === 'published' ? ' selected' : '') + '>published</option>' +
                  '<option value="draft"' + (p.status === 'draft' ? ' selected' : '') + '>draft</option>' +
                '</select></div>') +
          (isPartners
            ? '<div class="divider"></div>' +
              '<div class="row-between mb-3">' +
                '<h4 class="mb-0">Partners on this page</h4>' +
                '<button type="button" class="btn btn-sm btn-outline" id="cmAddPartner">' +
                  FS.icon('plus') + 'Add partner</button>' +
              '</div>' +
              '<p class="text-muted text-sm mb-4">Each one is a card on the live Partners page. ' +
                'Upload a logo or paste its address — any shape works, the card sizes it.</p>' +
              '<div class="repeater" id="cmPartners"></div>'
            : '') +
          (isFaqs
            ? '<div class="divider"></div>' +
              '<div class="row-between mb-3">' +
                '<h4 class="mb-0">Questions on this page</h4>' +
                '<button type="button" class="btn btn-sm btn-outline" id="cmAddFaq">' +
                  FS.icon('plus') + 'Add question</button>' +
              '</div>' +
              '<p class="text-muted text-sm mb-4">Add, edit or remove the questions shown on the live FAQs page.</p>' +
              '<div class="repeater" id="cmFaqs"></div>'
            : '') +
        '</form>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
                '<button class="btn btn-primary" id="cmSave">Save page</button>',
        onMount: function (root, close) {
          var title = root.querySelector('#cmMetaTitle');
          var desc = root.querySelector('#cmMeta');
          function count() {
            root.querySelector('#cmTitleCount').textContent = title.value.length + ' / 60 characters';
            root.querySelector('#cmDescCount').textContent = desc.value.length + ' / 160 characters';
          }
          title.addEventListener('input', count);
          desc.addEventListener('input', count);
          count();

          if (isPartners) {
            paintPartners(root);
            root.querySelector('#cmAddPartner').addEventListener('click', function () {
              collectPartners(root);
              rows.push(Store.newPartner());
              paintPartners(root);
              var last = root.querySelector('#cmPartners .repeat-item:last-child [data-pname]');
              if (last) last.focus();
            });
          }

          if (isFaqs) {
            paintFaqs(root);
            root.querySelector('#cmAddFaq').addEventListener('click', function () {
              collectFaqs(root);
              faqRows.push({ q: '', a: '' });
              paintFaqs(root);
              var last = root.querySelector('#cmFaqs .repeat-item:last-child [data-fquestion]');
              if (last) last.focus();
            });
          }

          if (hasBlocks) {
            paintBlocks(root);
            root.querySelector('#cmAddBlock').addEventListener('click', function () {
              collectBlocks(root);
              blocks.push(Store.newBlock());
              paintBlocks(root);
              var last = root.querySelector('#cmBlocks .repeat-item:last-child [data-bheading]');
              if (last) last.focus();
            });
          }

          if (isContact) {
            var addr = root.querySelector('#cmMapAddress');
            var embed = root.querySelector('#cmMapEmbed');
            var preview = root.querySelector('#cmMapPreview');

            /* Same rule the live page applies, so the preview cannot show
               something the page would then refuse to render. */
            function src() {
              var custom = embed.value.trim();
              if (custom) {
                return /^https:\/\/(www\.)?google\.[a-z.]{2,10}\/maps/.test(custom) ? custom : '';
              }
              return addr.value.trim()
                ? 'https://www.google.com/maps?q=' + encodeURIComponent(addr.value.trim()) + '&output=embed'
                : '';
            }
            function paintMap() {
              var url = src();
              preview.innerHTML = url
                ? '<iframe src="' + FS.esc(url) + '" title="Map preview" loading="lazy" ' +
                  'referrerpolicy="no-referrer-when-downgrade"></iframe>'
                : '<span class="map-empty">' + FS.icon('map-pin') +
                  (embed.value.trim() ? 'That is not a Google Maps link' : 'No map on the page') + '</span>';
              FS.hydrateIcons(preview);
            }
            addr.addEventListener('input', paintMap);
            embed.addEventListener('input', paintMap);
            paintMap();
          }

          root.querySelector('#cmSave').addEventListener('click', function () {
            if (isPartners) {
              collectPartners(root);
              // A row with nothing in it is a row the admin abandoned.
              var keep = rows.filter(function (r) { return r.name || r.text || r.logo; });
              if (!Store.savePartners(keep)) {
                FS.toast('Not enough room to save', 'The uploaded logos are larger than this ' +
                  'browser will hold. Use smaller files or fewer of them.', 'warn');
                return;
              }
            }
            if (isFaqs) {
              collectFaqs(root);
              var savedFaqs = faqRows.filter(function (faq) { return faq.q || faq.a; });
              if (!Store.saveFaqs(savedFaqs)) {
                FS.toast('Could not save FAQs', 'This browser could not store the changes.', 'warn');
                return;
              }
            }
            var patch = FS.formData(root.querySelector('#cmsForm'));
            if (hasBlocks) {
              collectBlocks(root);
              // An empty section is one the admin started and abandoned.
              patch.blocks = blocks.filter(function (b) { return b.heading || b.text; });
            }
            Store.saveCmsPage(p.slug, patch);
            if (!Store.lastWriteOk) {
              FS.toast('Saved, but not kept', 'This browser refused the write. The change is ' +
                'live until you reload.', 'warn');
            }
            close();
            FS.toast('Page saved',
              isPartners ? p.title + ' · ' + rows.length + ' partners'
                : hasBlocks ? p.title + ' · ' + (patch.blocks || []).length + ' sections'
                : p.title, 'ok');
            render();
          });
        }
      });

      /* --- Partner repeater ------------------------------------------- */

      /** Pull what is typed in the rows back into the working copy. */
      function collectPartners(root) {
        FS.$$('#cmPartners .repeat-item', root).forEach(function (el) {
          var row = rows[Number(el.dataset.i)];
          if (!row) return;
          row.name = el.querySelector('[data-pname]').value.trim();
          row.type = el.querySelector('[data-ptype]').value.trim();
          row.text = el.querySelector('[data-ptext]').value.trim();
          // Uploaded rows show a note instead of an address box; their logo
          // already lives in the working copy and must not be wiped here.
          var url = el.querySelector('[data-plogo-url]');
          if (url) row.logo = url.value.trim();
        });
      }

      function paintPartners(root) {
        var host = root.querySelector('#cmPartners');
        host.innerHTML = rows.length
          ? rows.map(partnerRow).join('')
          : '<p class="text-dim text-sm">No partners yet. Add the first one above.</p>';
        FS.hydrateIcons(host);

        FS.$$('[data-premove]', host).forEach(function (b) {
          b.addEventListener('click', function () {
            collectPartners(root);
            rows.splice(Number(b.closest('.repeat-item').dataset.i), 1);
            paintPartners(root);
          });
        });

        FS.$$('[data-plogo-file]', host).forEach(function (input) {
          input.addEventListener('change', function () {
            var i = Number(input.closest('.repeat-item').dataset.i);
            // A logo only ever renders at 56px tall, so 480px wide is generous
            // and keeps the saved state small.
            FS.readImage(input.files[0], 480, function (url, err) {
              if (err) { FS.toast('Could not use that file', err, 'warn'); return; }
              collectPartners(root);
              rows[i].logo = url;
              paintPartners(root);
              FS.toast('Logo attached', rows[i].name || 'New partner', 'ok');
            });
          });
        });

        FS.$$('[data-plogo-url]', host).forEach(function (input) {
          input.addEventListener('change', function () {
            var thumb = input.closest('.repeat-item').querySelector('.logo-preview');
            thumb.innerHTML = input.value
              ? '<img src="' + FS.esc(FS.url(input.value)) + '" alt="">'
              : FS.icon('image');
          });
        });

        FS.$$('[data-pclear]', host).forEach(function (b) {
          b.addEventListener('click', function () {
            var i = Number(b.closest('.repeat-item').dataset.i);
            collectPartners(root);
            rows[i].logo = '';
            paintPartners(root);
          });
        });
      }

      function partnerRow(pt, i) {
        // A data: URL is hundreds of characters long, so the address box shows
        // a short stand-in rather than filling itself with base64.
        var uploaded = /^data:/.test(pt.logo || '');
        return '<div class="repeat-item" data-i="' + i + '">' +
          '<div class="repeat-media">' +
            '<span class="logo-preview">' +
              (pt.logo ? '<img src="' + FS.esc(FS.url(pt.logo)) + '" alt="">' : FS.icon('image')) +
            '</span>' +
            '<label class="btn btn-xs btn-outline btn-file">' + FS.icon('upload') + 'Logo' +
              '<input type="file" accept="image/*" data-plogo-file></label>' +
          '</div>' +
          '<div class="repeat-fields">' +
            '<div class="field-row field-row-2">' +
              '<div class="field"><span class="label">Title</span>' +
                '<input class="input" data-pname aria-label="Partner title" ' +
                'value="' + FS.esc(pt.name || '') + '" placeholder="Partner name"></div>' +
              '<div class="field"><span class="label">Label</span>' +
                '<input class="input" data-ptype aria-label="Partner label" ' +
                'value="' + FS.esc(pt.type || '') + '" placeholder="Fleet Operator"></div>' +
            '</div>' +
            '<div class="field"><span class="label">Description</span>' +
              '<textarea class="textarea" data-ptext aria-label="Partner description" style="min-height:64px" ' +
                'placeholder="One or two lines about the partnership.">' + FS.esc(pt.text || '') + '</textarea></div>' +
            (uploaded
              ? '<p class="hint mb-0">' + FS.icon('image') + ' Uploaded image. ' +
                'Attach another to replace it, or <button type="button" class="link-btn" ' +
                'data-pclear>clear it</button>.</p>'
              : '<div class="field mb-0"><span class="label">Logo address</span>' +
                '<input class="input" data-plogo-url aria-label="Logo address" ' +
                'value="' + FS.esc(pt.logo || '') + '" ' +
                'placeholder="assets/img/brands/example.png"></div>') +
          '</div>' +
          '<button type="button" class="btn btn-xs btn-danger repeat-remove" data-premove ' +
            'aria-label="Remove partner">' + FS.icon('trash') + '</button>' +
        '</div>';
      }

      /* --- Page body repeater ----------------------------------------
         The About, Contact, Privacy and Terms bodies. Each row is one
         section on the live page. ------------------------------------- */

      function collectBlocks(root) {
        FS.$$('#cmBlocks .repeat-item', root).forEach(function (el) {
          var row = blocks[Number(el.dataset.i)];
          if (!row) return;
          row.heading = el.querySelector('[data-bheading]').value.trim();
          row.style = el.querySelector('[data-bstyle]').value;
          row.text = el.querySelector('[data-btext]').value.trim();
        });
      }

      function paintBlocks(root) {
        var list = root.querySelector('#cmBlocks');
        list.innerHTML = blocks.length
          ? blocks.map(blockRow).join('')
          : '<p class="text-dim text-sm">No sections yet. Add the first one above.</p>';
        FS.hydrateIcons(list);

        FS.$$('[data-bremove]', list).forEach(function (b) {
          b.addEventListener('click', function () {
            collectBlocks(root);
            blocks.splice(Number(b.closest('.repeat-item').dataset.i), 1);
            paintBlocks(root);
          });
        });

        /* Reordering, because a policy is read in order. */
        FS.$$('[data-bmove]', list).forEach(function (b) {
          b.addEventListener('click', function () {
            collectBlocks(root);
            var i = Number(b.closest('.repeat-item').dataset.i);
            var to = i + Number(b.dataset.bmove);
            if (to < 0 || to >= blocks.length) return;
            var moved = blocks.splice(i, 1)[0];
            blocks.splice(to, 0, moved);
            paintBlocks(root);
          });
        });

        // A pull quote has no heading of its own, so hide the field for one.
        FS.$$('[data-bstyle]', list).forEach(function (sel) {
          sel.addEventListener('change', function () {
            sel.closest('.repeat-item')
              .classList.toggle('is-quote', sel.value === 'quote');
          });
        });
      }

      function blockRow(b, i) {
        var quote = b.style === 'quote';
        return '<div class="repeat-item repeat-item--block' + (quote ? ' is-quote' : '') +
            '" data-i="' + i + '">' +
          '<div class="repeat-fields">' +
            '<div class="field-row field-row-2">' +
              '<div class="field block-heading-field"><span class="label">Section heading</span>' +
                '<input class="input" data-bheading aria-label="Section heading" ' +
                'value="' + FS.esc(b.heading || '') + '" placeholder="Leave blank for no heading"></div>' +
              '<div class="field"><span class="label">Style</span>' +
                '<select class="select" data-bstyle aria-label="Section style">' +
                  '<option value="text"' + (quote ? '' : ' selected') + '>Paragraphs</option>' +
                  '<option value="quote"' + (quote ? ' selected' : '') + '>Pull quote</option>' +
                '</select></div>' +
            '</div>' +
            '<div class="field mb-0"><span class="label">Text</span>' +
              '<textarea class="textarea" data-btext aria-label="Section text" style="min-height:104px" ' +
                'placeholder="Blank line between paragraphs.">' + FS.esc(b.text || '') + '</textarea></div>' +
          '</div>' +
          '<div class="repeat-actions">' +
            '<button type="button" class="btn btn-xs btn-outline" data-bmove="-1" ' +
              'aria-label="Move section up"' + (i === 0 ? ' disabled' : '') + '>' +
              FS.icon('chevron-up') + '</button>' +
            '<button type="button" class="btn btn-xs btn-outline" data-bmove="1" ' +
              'aria-label="Move section down"' + (i === blocks.length - 1 ? ' disabled' : '') + '>' +
              FS.icon('chevron-down') + '</button>' +
            '<button type="button" class="btn btn-xs btn-danger" data-bremove ' +
              'aria-label="Remove section">' + FS.icon('trash') + '</button>' +
          '</div>' +
        '</div>';
      }

      /* --- FAQ repeater ----------------------------------------------- */

      function collectFaqs(root) {
        FS.$$('#cmFaqs .repeat-item', root).forEach(function (el) {
          var row = faqRows[Number(el.dataset.i)];
          if (!row) return;
          row.q = el.querySelector('[data-fquestion]').value.trim();
          row.a = el.querySelector('[data-fanswer]').value.trim();
        });
      }

      function paintFaqs(root) {
        var list = root.querySelector('#cmFaqs');
        list.innerHTML = faqRows.length
          ? faqRows.map(faqRow).join('')
          : '<p class="text-dim text-sm">No questions yet. Add the first one above.</p>';
        FS.hydrateIcons(list);
        FS.$$('[data-fremove]', list).forEach(function (button) {
          button.addEventListener('click', function () {
            collectFaqs(root);
            faqRows.splice(Number(button.closest('.repeat-item').dataset.i), 1);
            paintFaqs(root);
          });
        });
      }

      function faqRow(faq, i) {
        return '<div class="repeat-item" data-i="' + i + '">' +
          '<div class="repeat-fields">' +
            '<div class="field"><span class="label">Question</span>' +
              '<input class="input" data-fquestion aria-label="FAQ question" value="' +
                FS.esc(faq.q || '') + '" placeholder="Enter a question"></div>' +
            '<div class="field mb-0"><span class="label">Answer</span>' +
              '<textarea class="textarea" data-fanswer aria-label="FAQ answer" style="min-height:90px" ' +
                'placeholder="Enter the answer">' + FS.esc(faq.a || '') + '</textarea></div>' +
          '</div>' +
          '<button type="button" class="btn btn-xs btn-danger repeat-remove" data-fremove ' +
            'aria-label="Remove question">' + FS.icon('trash') + '</button>' +
        '</div>';
      }
    }
  }

  /* ======================================================================
     Blog
     The list is newest-first. Everything the public blog renders — title,
     slug, meta title, meta description, keywords, the standfirst and the body
     — is editable here, and articles can be linked to one another.
     ====================================================================== */

  function blog() {
    var state = { q: '', filter: 'all' };
    render();

    function render() {
      var all = Store.posts();
      var list = all;
      if (state.filter !== 'all') list = list.filter(function (p) { return p.status === state.filter; });
      if (state.q) {
        var q = state.q.toLowerCase();
        list = list.filter(function (p) {
          return (p.title + ' ' + p.category + ' ' + p.author + ' ' + p.keywords).toLowerCase().indexOf(q) > -1;
        });
      }

      host.innerHTML =
        '<div class="page-head"><div><h2>Blog</h2>' +
          '<p>' + all.length + ' articles — newest at the top. Edit the copy, the SEO record and the links between articles.</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url('blog.html') + '" target="_blank" rel="noopener">' +
              FS.icon('external') + 'View blog</a>' +
            '<button class="btn btn-primary" id="newPost">' + FS.icon('plus') + 'New article</button>' +
          '</div></div>' +

        Dash.kpiGrid([
          { icon: 'file-text', tone: 'navy', label: 'Published', value: all.filter(is('published')).length },
          { icon: 'edit',      tone: 'warn', label: 'Drafts',    value: all.filter(is('draft')).length },
          { icon: 'link',                    label: 'Article links',
            value: all.reduce(function (n, p) { return n + (p.related || []).length; }, 0) },
          { icon: 'list',                    label: 'Categories', value: D.postCategories.length }
        ], 'kpi-grid--4') +

        '<div class="table-wrap">' +
          '<div class="toolbar"><div class="input-icon">' + FS.icon('search') +
            '<input class="input" id="postSearch" placeholder="Search title, category or keyword…" ' +
            'value="' + FS.esc(state.q) + '"></div></div>' +
          '<div class="toolbar" style="padding-block:10px"><div class="filters">' +
            [['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(function (f) {
              return '<button class="filter-pill' + (f[0] === state.filter ? ' is-active' : '') +
                '" data-pfilter="' + f[0] + '">' + f[1] + '</button>';
            }).join('') +
          '</div></div>' +

          (list.length
            ? '<div class="scroll-x"><table class="table table--stack"><thead><tr>' +
                '<th>Article</th><th>Category</th><th>Published</th><th>Links</th>' +
                '<th>SEO</th><th>Status</th><th class="td-actions">Actions</th></tr></thead><tbody>' +
              list.map(row).join('') + '</tbody></table></div>'
            : '<div class="table-empty">' + FS.icon('search') + '<p class="mt-3">No articles match.</p></div>') +
        '</div>';

      wire();
    }

    function is(status) { return function (p) { return p.status === status; }; }

    function row(p) {
      // A quick, honest read on whether the SEO record is filled in.
      var seo = [];
      if (!p.metaTitle) seo.push('title');
      if (!p.metaDescription) seo.push('description');
      if (!p.keywords) seo.push('keywords');
      var seoCell = seo.length
        ? '<span class="badge badge--warn">Missing ' + seo.join(', ') + '</span>'
        : '<span class="badge badge--ok">Complete</span>';

      return '<tr>' +
        '<td data-label="Article"><span class="td-strong" style="display:block">' + FS.esc(p.title) + '</span>' +
          '<small class="text-xs text-dim">/blog/' + FS.esc(p.slug) + '</small></td>' +
        '<td data-label="Category"><span class="chip">' + FS.esc(p.category) + '</span></td>' +
        '<td data-label="Published">' + FS.date(p.at) + '</td>' +
        '<td data-label="Links">' + ((p.related || []).length
          ? '<span class="badge badge--info">' + p.related.length + ' linked</span>'
          : '<span class="text-dim text-sm">None</span>') + '</td>' +
        '<td data-label="SEO">' + seoCell + '</td>' +
        '<td data-label="Status"><span class="badge badge--' + (p.status === 'published' ? 'ok' : 'warn') + '">' +
          FS.esc(p.status) + '</span></td>' +
        '<td class="td-actions" data-label="Actions">' +
          '<a class="btn btn-xs btn-outline" href="' + FS.url('blog-post.html?p=' + p.slug) + '" target="_blank" rel="noopener">' +
            FS.icon('external') + 'View</a> ' +
          '<a class="btn btn-xs btn-primary" href="' + FS.url('admin/blog-edit.html?p=' + p.slug) + '">' +
            FS.icon('edit') + 'Edit</a> ' +
          '<button class="btn btn-xs btn-outline" data-pdel="' + FS.esc(p.slug) + '">' + FS.icon('trash') + '</button>' +
        '</td></tr>';
    }

    function wire() {
      var search = document.getElementById('postSearch');
      var t;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          state.q = search.value;
          render();
          var again = document.getElementById('postSearch');
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }, 200);
      });

      FS.$$('[data-pfilter]', host).forEach(function (b) {
        b.addEventListener('click', function () { state.filter = b.dataset.pfilter; render(); });
      });

      FS.$$('[data-pdel]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var p = Store.post(b.dataset.pdel);
          FS.confirm('Delete "' + p.title + '"?',
            'The article comes off the site and is removed from every "related articles" list.',
            function () {
              Store.deletePost(p.slug);
              FS.toast('Article deleted', p.title, 'warn');
              render();
            }, true);
        });
      });

      document.getElementById('newPost').addEventListener('click', function () {
        var post = Store.createPost();
        window.location.href = FS.url('admin/blog-edit.html?p=' + post.slug);
      });

      FS.hydrateIcons(host);
    }
  }

  /* ----------------------------------------------------------------------
     Blog editor — content, SEO and cross-links in one screen
     ---------------------------------------------------------------------- */

  function blogEdit() {
    var slug = FS.param('p');
    var post = Store.post(slug);

    if (!post) {
      host.innerHTML = '<div class="empty-state">' + FS.icon('file-text') +
        '<h4>Article not found</h4><p>That article no longer exists.</p>' +
        '<a class="btn btn-primary mt-6" href="' + FS.url('admin/blog.html') + '">Back to the blog</a></div>';
      return;
    }

    render();

    function render() {
      var others = Store.posts().filter(function (p) { return p.slug !== post.slug; });

      host.innerHTML =
        '<nav class="crumbs crumbs--dark"><a href="' + FS.url('admin/blog.html') + '">Blog</a>' +
          '<span>/</span><strong>' + FS.esc(post.title) + '</strong></nav>' +

        '<div class="page-head"><div><h2>Edit article</h2>' +
          '<p>/blog/' + FS.esc(post.slug) + ' · ' + FS.date(post.at, 'long') + '</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url('blog-post.html?p=' + post.slug) + '" target="_blank" rel="noopener">' +
              FS.icon('external') + 'Preview</a>' +
            '<button class="btn btn-primary" id="beSave">' + FS.icon('check') + 'Save article</button>' +
          '</div></div>' +

        '<form id="beForm">' +
        '<div class="dash-grid dash-grid--2-1">' +

          /* --- Content ------------------------------------------------- */
          '<div>' +
            '<div class="card mb-5"><div class="card-head"><h3>Content</h3></div><div class="card-body">' +
              '<div class="field"><label class="label" for="beTitle">Title</label>' +
                '<input class="input" id="beTitle" name="title" value="' + FS.esc(post.title) + '"></div>' +
              '<div class="field"><label class="label" for="beSlug">URL slug</label>' +
                '<div class="row" style="gap:8px"><span class="text-dim text-sm">/blog/</span>' +
                '<input class="input" id="beSlug" name="slug" value="' + FS.esc(post.slug) + '"></div>' +
                '<p class="hint">Changing this changes the article address. Existing links will break.</p></div>' +
              '<div class="field"><label class="label" for="beExcerpt">Standfirst / excerpt</label>' +
                '<textarea class="textarea" id="beExcerpt" name="excerpt" style="min-height:80px">' +
                FS.esc(post.excerpt) + '</textarea>' +
                '<p class="hint">Shown on the blog index and on the homepage preview.</p></div>' +

              '<div class="field"><label class="label" for="beBody">Article body</label>' +
                '<div class="editor-tools">' +
                  '<button type="button" class="btn btn-xs btn-outline" id="beLink">' + FS.icon('link') + 'Insert link</button>' +
                  '<button type="button" class="btn btn-xs btn-outline" id="beArticleLink">' + FS.icon('file-text') + 'Link an article</button>' +
                  '<span class="text-xs text-dim">One paragraph per blank line. ' +
                    'Links use markdown: [text](https://…)</span>' +
                '</div>' +
                '<textarea class="textarea" id="beBody" name="body" style="min-height:340px">' +
                FS.esc((post.body || []).join('\n\n')) + '</textarea></div>' +
            '</div></div>' +

            /* --- SEO ---------------------------------------------------- */
            '<div class="card"><div class="card-head"><h3>Search engine listing</h3>' +
              '<span class="text-sm text-muted" id="beSeoCount"></span></div><div class="card-body">' +
              '<div class="serp-preview" id="beSerp"></div>' +
              '<div class="field mt-5"><label class="label" for="beMetaTitle">Meta title</label>' +
                '<input class="input" id="beMetaTitle" name="metaTitle" value="' + FS.esc(post.metaTitle || '') + '">' +
                '<p class="hint">Aim for 50–60 characters.</p></div>' +
              '<div class="field"><label class="label" for="beMetaDesc">Meta description</label>' +
                '<textarea class="textarea" id="beMetaDesc" name="metaDescription" style="min-height:80px">' +
                FS.esc(post.metaDescription || '') + '</textarea>' +
                '<p class="hint">Aim for 140–160 characters.</p></div>' +
              '<div class="field"><label class="label" for="beKeywords">Keywords</label>' +
                '<input class="input" id="beKeywords" name="keywords" value="' + FS.esc(post.keywords || '') + '">' +
                '<p class="hint">Comma separated.</p></div>' +
            '</div></div>' +
          '</div>' +

          /* --- Right rail ---------------------------------------------- */
          '<div>' +
            '<div class="card mb-5"><div class="card-head"><h3>Publishing</h3></div><div class="card-body">' +
              '<div class="field"><label class="label" for="beStatus">Status</label>' +
                '<select class="select" id="beStatus" name="status">' +
                  '<option value="published"' + (post.status === 'published' ? ' selected' : '') + '>Published</option>' +
                  '<option value="draft"' + (post.status === 'draft' ? ' selected' : '') + '>Draft</option>' +
                '</select></div>' +
              '<div class="field"><label class="label" for="beCategory">Category</label>' +
                '<select class="select" id="beCategory" name="category">' +
                  D.postCategories.map(function (c) {
                    return '<option' + (c === post.category ? ' selected' : '') + '>' + FS.esc(c) + '</option>';
                  }).join('') + '</select></div>' +
              '<div class="field"><label class="label" for="beAuthor">Author</label>' +
                '<input class="input" id="beAuthor" name="author" value="' + FS.esc(post.author) + '"></div>' +
              '<div class="field-row field-row-2">' +
                '<div class="field"><label class="label" for="beDate">Published on</label>' +
                  '<input class="input" id="beDate" name="at" type="date" value="' + FS.esc(String(post.at).slice(0, 10)) + '"></div>' +
                '<div class="field"><label class="label" for="beRead">Read time (min)</label>' +
                  '<input class="input" id="beRead" name="read" type="number" min="1" value="' + FS.esc(post.read) + '"></div>' +
              '</div>' +
              /* Header image. The value that counts lives in the hidden field;
                 upload, library and address all write into it. Whatever goes
                 in is cropped to the same 16:9 frame on the live article and
                 to the card frame on the index, so no two posts come out a
                 different shape. */
              '<div class="field"><span class="label">Header image</span>' +
                '<div class="img-picker">' +
                  '<span class="img-preview" id="beImgPreview">' +
                    (post.image ? '<img src="' + FS.esc(FS.url(post.image)) + '" alt="">' : FS.icon('image')) +
                  '</span>' +
                  '<div class="img-picker-tools">' +
                    '<label class="btn btn-sm btn-outline btn-file">' + FS.icon('upload') + 'Upload image' +
                      '<input type="file" accept="image/*" id="beImgFile"></label>' +
                    '<select class="select" id="beImgLibrary">' +
                      '<option value="">Or pick from the library…</option>' +
                      Store.catalog('service').map(function (s) {
                        return '<option value="' + FS.esc(s.image) + '"' +
                          (s.image === post.image ? ' selected' : '') + '>' + FS.esc(s.name) + '</option>';
                      }).join('') + '</select>' +
                  '</div>' +
                '</div>' +
                '<input type="hidden" id="beImage" name="image" value="' + FS.esc(post.image || '') + '">' +
                '<div class="field mt-4 mb-0"><label class="label" for="beImgUrl">Or paste an address</label>' +
                  '<input class="input" id="beImgUrl" ' +
                  'value="' + FS.esc(/^data:/.test(post.image || '') ? '' : (post.image || '')) + '" ' +
                  'placeholder="assets/img/services/example.jpg"></div>' +
                '<p class="hint" id="beImgHint">Landscape works best. Any size is fine — it is ' +
                  'resized on upload and cropped to a 16:9 frame.</p></div>' +
            '</div></div>' +

            /* --- Article links ------------------------------------------ */
            '<div class="card"><div class="card-head"><h3>Related articles</h3>' +
              '<span class="badge badge--info">' + (post.related || []).length + '</span></div><div class="card-body">' +
              '<p class="text-muted text-sm mb-4">Tick the articles to link from the bottom of this one. ' +
                'They appear in the "Keep reading" rail on the live page.</p>' +
              (others.length
                ? '<div class="link-list">' + others.map(function (p) {
                    var on = (post.related || []).indexOf(p.slug) > -1;
                    return '<label class="link-item' + (on ? ' is-on' : '') + '">' +
                      '<input type="checkbox" data-rel="' + FS.esc(p.slug) + '"' + (on ? ' checked' : '') + '>' +
                      '<span><strong>' + FS.esc(p.title) + '</strong>' +
                      '<small>' + FS.esc(p.category) + ' · ' + FS.date(p.at) + '</small></span></label>';
                  }).join('') + '</div>'
                : '<p class="text-dim text-sm">No other articles to link to yet.</p>') +
            '</div></div>' +
          '</div>' +
        '</div></form>';

      wire();
    }

    function wire() {
      var title = document.getElementById('beTitle');
      var metaTitle = document.getElementById('beMetaTitle');
      var metaDesc = document.getElementById('beMetaDesc');
      var slugField = document.getElementById('beSlug');

      function paintSerp() {
        var t = metaTitle.value || (title.value + ' | FleetSquad');
        var d = metaDesc.value || document.getElementById('beExcerpt').value;
        document.getElementById('beSerp').innerHTML =
          '<div class="serp-url">fleetsquad.com › blog › ' + FS.esc(slugField.value) + '</div>' +
          '<div class="serp-title">' + FS.esc(t.slice(0, 62)) + (t.length > 62 ? '…' : '') + '</div>' +
          '<div class="serp-desc">' + FS.esc(d.slice(0, 165)) + (d.length > 165 ? '…' : '') + '</div>';
        document.getElementById('beSeoCount').textContent =
          'Title ' + t.length + '/60 · Description ' + d.length + '/160';
      }

      [title, metaTitle, metaDesc, slugField, document.getElementById('beExcerpt')].forEach(function (f) {
        f.addEventListener('input', paintSerp);
      });
      paintSerp();

      /* Link tools ---------------------------------------------------- */
      document.getElementById('beLink').addEventListener('click', function () {
        insertLinkModal(null);
      });
      document.getElementById('beArticleLink').addEventListener('click', function () {
        insertLinkModal(Store.posts().filter(function (p) { return p.slug !== post.slug; }));
      });

      FS.$$('[data-rel]', host).forEach(function (box) {
        box.addEventListener('change', function () {
          box.closest('.link-item').classList.toggle('is-on', box.checked);
        });
      });

      /* Header image ---------------------------------------------------- */
      var image = document.getElementById('beImage');
      var preview = document.getElementById('beImgPreview');
      var hint = document.getElementById('beImgHint');
      var urlField = document.getElementById('beImgUrl');
      var library = document.getElementById('beImgLibrary');

      function setImage(value, note) {
        image.value = value || '';
        preview.innerHTML = value
          ? '<img src="' + FS.esc(FS.url(value)) + '" alt="">'
          : FS.icon('image');
        FS.hydrateIcons(preview);
        if (note) hint.textContent = note;
      }

      document.getElementById('beImgFile').addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        // 1600px is more than the widest frame the article ever renders at,
        // and keeps a typical photo well under 300 KB once re-encoded.
        FS.readImage(file, 1600, function (url, err, info) {
          if (err) { FS.toast('Could not use that file', err, 'warn'); return; }
          setImage(url, info.width + '×' + info.height + ' · about ' +
            Math.round(info.bytes / 1024) + ' KB. Save the article to keep it.');
          urlField.value = '';
          library.value = '';
          if (info.bytes > 900000) {
            FS.toast('That is a large image', 'It will save, but a few more this size ' +
              'may fill the browser store. A smaller file is safer.', 'warn');
          }
        });
      });

      library.addEventListener('change', function () {
        if (!this.value) return;
        setImage(this.value, 'From the image library.');
        urlField.value = this.value;
      });

      urlField.addEventListener('input', function () {
        setImage(this.value.trim(), 'Loaded from an address.');
        library.value = '';
      });

      document.getElementById('beSave').addEventListener('click', save);
      FS.hydrateIcons(host);
    }

    /** Drop a markdown link into the body at the caret. */
    function insertLinkModal(articles) {
      var body = document.getElementById('beBody');
      var selected = body.value.slice(body.selectionStart, body.selectionEnd);

      FS.modal({
        title: articles ? 'Link to another article' : 'Insert a link',
        subtitle: 'Added at the cursor position',
        body:
          (articles
            ? '<div class="field"><label class="label" for="ilArticle">Article</label>' +
              '<select class="select" id="ilArticle">' + articles.map(function (p) {
                return '<option value="' + FS.esc(p.slug) + '" data-title="' + FS.esc(p.title) + '">' +
                  FS.esc(p.title) + '</option>';
              }).join('') + '</select></div>'
            : '<div class="field"><label class="label" for="ilUrl">URL</label>' +
              '<input class="input" id="ilUrl" placeholder="https://fleetsquad.com/services" ' +
              'value="https://"></div>') +
          '<div class="field"><label class="label" for="ilText">Link text</label>' +
            '<input class="input" id="ilText" value="' + FS.esc(selected) + '" placeholder="the text readers click"></div>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
                '<button class="btn btn-primary" id="ilGo">Insert link</button>',
        onMount: function (root, close) {
          var select = root.querySelector('#ilArticle');
          var text = root.querySelector('#ilText');
          if (select && !text.value) {
            text.value = select.selectedOptions[0].dataset.title;
            select.addEventListener('change', function () {
              text.value = select.selectedOptions[0].dataset.title;
            });
          }
          root.querySelector('#ilGo').addEventListener('click', function () {
            var url = select ? '/blog-post.html?p=' + select.value : root.querySelector('#ilUrl').value;
            var label = text.value || url;
            var markdown = '[' + label + '](' + url + ')';
            var start = body.selectionStart;
            var end = body.selectionEnd;
            body.value = body.value.slice(0, start) + markdown + body.value.slice(end);
            body.focus();
            body.setSelectionRange(start + markdown.length, start + markdown.length);
            close();
            FS.toast('Link inserted', label, 'ok');
          });
        }
      });
    }

    function save() {
      var f = FS.formData(document.getElementById('beForm'));
      var related = FS.$$('[data-rel]:checked', host).map(function (b) { return b.dataset.rel; });
      var newSlug = String(f.slug || post.slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');

      Store.savePost(post.slug, {
        slug: newSlug,
        title: f.title,
        excerpt: f.excerpt,
        body: String(f.body).split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean),
        status: f.status,
        category: f.category,
        author: f.author,
        at: f.at ? new Date(f.at).toISOString() : post.at,
        read: Number(f.read) || post.read,
        image: f.image,
        metaTitle: f.metaTitle,
        metaDescription: f.metaDescription,
        keywords: f.keywords,
        related: related
      });

      post = Store.post(newSlug);
      if (!Store.lastWriteOk) {
        FS.toast('Saved, but not kept', 'This browser refused the write — usually a header ' +
          'image too large for the store. The change is live until you reload.', 'warn');
      } else {
        FS.toast('Article saved', post.title, 'ok');
      }
      // Keep the address bar in step when the slug changed.
      if (newSlug !== slug) {
        slug = newSlug;
        window.history.replaceState({}, '', FS.url('admin/blog-edit.html?p=' + newSlug));
      }
      render();
    }
  }

  /* ======================================================================
     Service areas
     Add a state, switch it on or off, and manage the counties and cities we
     cover inside it. The public coverage page reads the same records.
     ====================================================================== */

  function serviceAreas() {
    render();

    function render() {
      var areas = Store.serviceAreas();
      var active = areas.filter(function (a) { return a.active; });
      var cities = active.reduce(function (n, a) { return n + a.cities.length; }, 0);
      var counties = active.reduce(function (n, a) { return n + (a.counties || []).length; }, 0);

      host.innerHTML =
        '<div class="page-head"><div><h2>Service Areas</h2>' +
          '<p>The coverage behind the "check if we are in your area" page. ' +
            'Switch a state off and it stops showing as covered on the site.</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url('pages/service-areas.html') + '" target="_blank" rel="noopener">' +
              FS.icon('external') + 'View page</a>' +
            '<button class="btn btn-primary" id="addArea">' + FS.icon('plus') + 'Add state</button>' +
          '</div></div>' +

        Dash.kpiGrid([
          { icon: 'map',     tone: 'navy', label: 'States covered', value: active.length },
          { icon: 'map-pin',               label: 'Counties',       value: counties },
          { icon: 'building',              label: 'Cities',         value: cities },
          { icon: 'globe',   tone: 'warn', label: 'States inactive', value: areas.length - active.length }
        ], 'kpi-grid--4') +

        '<div class="grid grid-3">' + areas.map(card).join('') + '</div>';

      wire();
    }

    function card(a) {
      return '<div class="card card-pad' + (a.active ? '' : ' is-muted') + '">' +
        '<div class="row-between mb-3">' +
          '<h4 class="row" style="gap:8px;margin:0">' + FS.icon('map-pin') +
            FS.esc(a.state) + ' <span class="chip">' + FS.esc(a.code) + '</span></h4>' +
          '<span class="badge badge--' + (a.active ? 'ok' : 'neutral') + '">' +
            (a.active ? 'Covered' : 'Not covered') + '</span>' +
        '</div>' +
        '<dl class="dl dl--2 mb-4">' +
          '<div><dt>Counties</dt><dd>' + (a.counties || []).length + '</dd></div>' +
          '<div><dt>Cities</dt><dd>' + a.cities.length + '</dd></div>' +
        '</dl>' +
        '<p class="text-muted text-sm mb-4">' +
          FS.esc(a.cities.slice(0, 4).join(', ')) + (a.cities.length > 4 ? ' +' + (a.cities.length - 4) + ' more' : '') +
        '</p>' +
        '<div class="row row-wrap" style="gap:var(--sp-2)">' +
          '<button class="btn btn-xs btn-primary" data-aedit="' + a.id + '">' + FS.icon('edit') + 'Edit</button>' +
          '<button class="btn btn-xs btn-outline" data-atoggle="' + a.id + '">' +
            FS.icon(a.active ? 'pause' : 'play') + (a.active ? 'Turn off' : 'Turn on') + '</button>' +
          '<button class="btn btn-xs btn-outline" data-adel="' + a.id + '">' + FS.icon('trash') + '</button>' +
        '</div></div>';
    }

    function wire() {
      FS.$$('[data-aedit]', host).forEach(function (b) {
        b.addEventListener('click', function () { areaModal(Store.serviceArea(b.dataset.aedit)); });
      });
      FS.$$('[data-atoggle]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var a = Store.serviceArea(b.dataset.atoggle);
          Store.saveServiceArea(a.id, { active: !a.active });
          FS.toast(a.active ? 'Coverage turned off' : 'Coverage turned on', a.state, a.active ? 'warn' : 'ok');
          render();
        });
      });
      FS.$$('[data-adel]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var a = Store.serviceArea(b.dataset.adel);
          FS.confirm('Remove ' + a.state + '?', 'The state and all of its cities come off the coverage page.', function () {
            Store.deleteServiceArea(a.id);
            FS.toast('State removed', a.state, 'warn');
            render();
          }, true);
        });
      });
      document.getElementById('addArea').addEventListener('click', function () { areaModal(null); });
      FS.hydrateIcons(host);
    }

    function areaModal(area) {
      var isNew = !area;
      area = area || { state: '', code: '', counties: [], cities: [], active: true };

      var used = Store.serviceAreas().map(function (a) { return a.code; });
      var options = D.usStates
        .filter(function (s) { return isNew ? used.indexOf(s[0]) < 0 : true; })
        .map(function (s) {
          return '<option value="' + s[0] + '"' + (s[0] === area.code ? ' selected' : '') + '>' + s[1] + '</option>';
        }).join('');

      FS.modal({
        title: isNew ? 'Add a state' : 'Edit ' + area.state,
        subtitle: 'Counties and cities we cover',
        size: 'lg',
        body: '<form id="saForm" novalidate>' +
          '<div class="field-row field-row-2 mb-4">' +
            '<div class="field"><label class="label" for="saState">State</label>' +
              '<select class="select" id="saState">' + (options || '<option value="">All states added</option>') + '</select></div>' +
            '<div class="field"><label class="label" for="saActive">Coverage</label>' +
              '<select class="select" id="saActive">' +
                '<option value="1"' + (area.active ? ' selected' : '') + '>We service this state</option>' +
                '<option value="0"' + (!area.active ? ' selected' : '') + '>Not covered yet</option>' +
              '</select></div>' +
          '</div>' +
          '<div class="field"><label class="label" for="saCounties">Counties</label>' +
            '<textarea class="textarea" id="saCounties" style="min-height:90px" ' +
            'placeholder="One per line">' + FS.esc((area.counties || []).join('\n')) + '</textarea>' +
            '<p class="hint">One per line. Shown on the coverage page under the state.</p></div>' +
          '<div class="field"><label class="label" for="saCities">Cities</label>' +
            '<textarea class="textarea" id="saCities" style="min-height:130px" ' +
            'placeholder="One per line">' + FS.esc(area.cities.join('\n')) + '</textarea>' +
            '<p class="hint">One per line. These are what the zip / city search matches against.</p></div>' +
        '</form>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
                '<button class="btn btn-primary" id="saSave">' + (isNew ? 'Add state' : 'Save changes') + '</button>',
        onMount: function (root, close) {
          root.querySelector('#saSave').addEventListener('click', function () {
            var code = root.querySelector('#saState').value;
            if (!code) { FS.toast('Pick a state', '', 'warn'); return; }
            var name = (D.usStates.filter(function (s) { return s[0] === code; })[0] || [])[1];

            var patch = {
              code: code,
              state: name,
              active: root.querySelector('#saActive').value === '1',
              counties: lines(root.querySelector('#saCounties').value),
              cities: lines(root.querySelector('#saCities').value)
            };

            if (isNew) Store.createServiceArea(patch);
            else Store.saveServiceArea(area.id, patch);

            close();
            FS.toast(isNew ? 'State added' : 'Coverage updated', name, 'ok');
            render();
          });
        }
      });

      function lines(text) {
        return String(text).split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      }
    }
  }

  /* ======================================================================
     Users — impersonation and password resets
     ====================================================================== */

  function users() {
    Dash.usersView(host);
  }

  /* ======================================================================
     Settings — what Stripe needs before payments go live
     ====================================================================== */

  function settings() {
    render();

    function render() {
      var saved = Store.settings();
      var stripe = saved.stripe || {};
      var groups = [];
      D.stripeSetup.forEach(function (f) {
        if (groups.indexOf(f.group) < 0) groups.push(f.group);
      });

      var required = D.stripeSetup.filter(function (f) { return f.required; });
      var filled = required.filter(function (f) { return stripe[f.key]; });
      var pct = Math.round((filled.length / required.length) * 100);

      host.innerHTML =
        '<div class="page-head"><div><h2>Settings</h2>' +
          '<p>What we need from your Stripe account before charges, payment links and payouts go live.</p></div>' +
          '<div class="page-head-actions">' +
            '<button class="btn btn-primary" id="stSave">' + FS.icon('check') + 'Save settings</button>' +
          '</div></div>' +

        '<div class="alert alert--info mb-6">' + FS.icon('info') +
          '<div><strong>Nothing here is live yet.</strong> This build is front-end only: keys entered here are ' +
          'held in your browser so the team can see exactly which values are needed. The secret key and the ' +
          'webhook secret must only ever be set on the server — never in a browser build.</div></div>' +

        '<div class="dash-grid dash-grid--2-1">' +
          '<div>' +
            '<div class="card mb-5"><div class="card-head"><h3>Stripe credentials</h3>' +
              '<span class="badge badge--' + (pct === 100 ? 'ok' : 'warn') + '">' +
                filled.length + ' of ' + required.length + ' required</span></div>' +
              '<div class="card-body">' +
                '<span class="progress mb-6" style="display:block"><span style="width:' + pct + '%"></span></span>' +
                '<form id="stForm">' +
                  '<div class="field"><label class="label" for="stMode">Mode</label>' +
                    '<select class="select" id="stMode" name="stripeMode">' +
                      '<option value="test"' + (saved.stripeMode === 'test' ? ' selected' : '') + '>Test — pk_test / sk_test</option>' +
                      '<option value="live"' + (saved.stripeMode === 'live' ? ' selected' : '') + '>Live — real charges</option>' +
                    '</select></div>' +
                  groups.map(function (g) {
                    return '<div class="divider"></div><h4 class="mb-4">' + FS.esc(g) + '</h4>' +
                      D.stripeSetup.filter(function (f) { return f.group === g; }).map(field).join('');
                  }).join('') +
                '</form>' +
              '</div></div>' +
          '</div>' +

          '<div>' +
            '<div class="card mb-5"><div class="card-head"><h3>Also switch on in Stripe</h3></div><div class="card-body">' +
              '<ul class="check-list">' + D.stripeChecklist.map(function (item) {
                return '<li>' + FS.icon('check-circle') + '<span>' + FS.esc(item) + '</span></li>';
              }).join('') + '</ul>' +
            '</div></div>' +

            '<div class="card"><div class="card-head"><h3>Where the money moves</h3></div><div class="card-body">' +
              '<ol class="flow-list">' +
                '<li><strong>Customer pays</strong><span>Card taken on New Sale, a manual charge on a project, or a Stripe payment link emailed from the invoice.</span></li>' +
                '<li><strong>Stripe confirms</strong><span>The webhook tells us the payment succeeded, and the project flips to Paid on its own.</span></li>' +
                '<li><strong>FleetSquad is paid out</strong><span>Stripe settles to the bank account on the Stripe profile, on your payout schedule.</span></li>' +
                '<li><strong>Mechanic is paid</strong><span>Recorded on the project. Through Stripe Connect if the client ID above is set, otherwise outside the platform.</span></li>' +
              '</ol>' +
            '</div></div>' +
          '</div>' +
        '</div>';

      document.getElementById('stSave').addEventListener('click', function () {
        var f = FS.formData(document.getElementById('stForm'));
        var next = {};
        D.stripeSetup.forEach(function (field) { next[field.key] = f[field.key] || ''; });
        Store.saveSettings({
          stripe: next,
          stripeMode: f.stripeMode,
          stripeConnected: D.stripeSetup.filter(function (x) { return x.required; })
            .every(function (x) { return next[x.key]; })
        });
        FS.toast('Settings saved', 'Held in this browser only.', 'ok');
        render();
      });

      FS.hydrateIcons(host);

      function field(f) {
        var value = stripe[f.key] || '';
        return '<div class="field">' +
          '<label class="label" for="st_' + f.key + '">' + FS.esc(f.label) +
            (f.required ? ' <span class="req">*</span>' : ' <span class="text-dim text-xs">(optional)</span>') + '</label>' +
          '<input class="input" id="st_' + f.key + '" name="' + f.key + '" ' +
            'type="' + (f.secret ? 'password' : 'text') + '" ' +
            'placeholder="' + FS.esc(f.placeholder) + '" value="' + FS.esc(value) + '" autocomplete="off">' +
          '<p class="hint"><strong>Where:</strong> ' + FS.esc(f.where) + '<br>' +
            '<strong>Why:</strong> ' + FS.esc(f.why) + '</p>' +
        '</div>';
      }
    }
  }


  /* ======================================================================
     Catalog — Services, Industries and Vehicle Types
     All three are the same shape of thing: a record that drives a public
     template page, an entry in the nav and a card on an index. So one list
     view and one editor serve all three, switched by `kind`.
     ====================================================================== */

  /** Which catalog this page is for, from <body data-catalog="…">. */
  function catalogKind() {
    return document.body.dataset.catalog || FS.param('t') || 'service';
  }

  function catalogList() {
    var kind = catalogKind();
    var meta = Store.catalogMeta[kind];
    render();

    function render() {
      var items = Store.catalog(kind);
      var plural = meta.label + (meta.label.slice(-1) === 'y' ? '' : 's');
      /* Services have no picture of their own in this list, so the name
         column stands alone there. The other catalogs keep their thumbnail. */
      var showThumb = kind !== 'service';
      if (meta.label.slice(-1) === 'y') plural = meta.label.slice(0, -1) + 'ies';

      host.innerHTML =
        '<div class="page-head"><div><h2>' + FS.esc(plural) + '</h2>' +
          '<p>Every ' + FS.esc(meta.label.toLowerCase()) + ' on the public site. The order here is the order ' +
            'in the nav bar, the footer and the index page.</p></div>' +
          '<div class="page-head-actions">' +
            '<button class="btn btn-primary" id="ctAdd">' + FS.icon('plus') + 'Add ' + FS.esc(meta.label.toLowerCase()) + '</button>' +
          '</div>' +
        '</div>' +

        (items.length
          ? '<div class="table-wrap"><div class="scroll-x">' +
            '<table class="table table--stack"><thead><tr>' +
              '<th>Order</th><th>' + FS.esc(meta.label) + '</th><th>Address</th>' +
              '<th>Meta title</th><th class="td-actions">Actions</th>' +
            '</tr></thead><tbody>' + items.map(function (it, i) {
              var seo = it.seo || {};
              var tLen = (seo.title || '').length;
              var dLen = (seo.description || '').length;
              var seoOk = tLen >= 25 && tLen <= 62 && dLen >= 90 && dLen <= 165;
              return '<tr>' +
                '<td data-label="Order"><div class="order-cell">' +
                  '<button class="btn btn-xs btn-outline" data-ctmove="-1" data-slug="' + FS.esc(it.slug) + '" ' +
                    'aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>' + FS.icon('chevron-up') + '</button>' +
                  '<button class="btn btn-xs btn-outline" data-ctmove="1" data-slug="' + FS.esc(it.slug) + '" ' +
                    'aria-label="Move down"' + (i === items.length - 1 ? ' disabled' : '') + '>' + FS.icon('chevron-down') + '</button>' +
                '</div></td>' +
                '<td data-label="' + FS.esc(meta.label) + '" class="td-strong">' +
                  '<div class="row" style="gap:10px">' +
                    (showThumb
                      ? (it.image
                        ? '<span class="cat-thumb"><img src="' + FS.esc(FS.url(it.image)) + '" alt=""></span>'
                        : '<span class="cat-thumb">' + FS.icon(it.icon || 'truck-wrench') + '</span>')
                      : '') +
                    '<span><strong>' + FS.esc(it.name) + '</strong>' +
                    '<br><small class="text-xs text-dim">' +
                      (it.bullets || []).length + ' bullets · ' +
                      ((it.features || []).length ? (it.features.length + ' features') :
                       (it.stats || []).length ? (it.stats.length + ' stats') : 'no panel') +
                    '</small></span>' +
                  '</div></td>' +
                '<td data-label="Address"><code class="text-sm text-dim">/' + FS.esc(it.slug) + '</code></td>' +
                '<td data-label="Meta title"><span class="text-sm">' + FS.esc(seo.title || '—') + '</span><br>' +
                  '<small class="text-xs ' + (seoOk ? 'text-ok' : 'text-dim') + '">' +
                  'Title ' + tLen + '/60 · Description ' + dLen + '/160</small></td>' +
                '<td class="td-actions" data-label="Actions">' +
                  '<a class="btn btn-xs btn-outline" href="' + FS.url(meta.page + '?' + meta.param + '=' + it.slug) + '" ' +
                    'target="_blank" rel="noopener">' + FS.icon('external') + 'View</a> ' +
                  '<a class="btn btn-xs btn-primary" href="' + FS.url('admin/catalog-edit.html?t=' + kind + '&s=' + it.slug) + '">' +
                    FS.icon('edit') + 'Edit</a> ' +
                  '<button class="btn btn-xs btn-danger" data-ctdel="' + FS.esc(it.slug) + '">' +
                    FS.icon('trash') + '</button>' +
                '</td></tr>';
            }).join('') + '</tbody></table></div></div>'
          : '<div class="empty-state">' + FS.icon('list') +
            '<h4>Nothing here yet</h4><p>Add the first ' + FS.esc(meta.label.toLowerCase()) + ' to put it on the site.</p></div>');

      document.getElementById('ctAdd').addEventListener('click', function () {
        var item = Store.createCatalogItem(kind);
        FS.toast(meta.label + ' created', 'Fill in the details and save.', 'ok');
        window.location.href = FS.url('admin/catalog-edit.html?t=' + kind + '&s=' + item.slug);
      });

      FS.$$('[data-ctmove]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          Store.moveCatalogItem(kind, b.dataset.slug, Number(b.dataset.ctmove));
          render();
          FS.hydrateIcons(host);
        });
      });

      FS.$$('[data-ctdel]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var item = Store.catalogItem(kind, b.dataset.ctdel);
          FS.confirm('Delete ' + item.name + '?',
            'The page at /' + item.slug + ' goes away and it drops out of the nav bar, ' +
            'the footer and the index. This cannot be undone.',
            function () {
              Store.deleteCatalogItem(kind, item.slug);
              FS.toast(meta.label + ' deleted', item.name, 'ok');
              render();
              FS.hydrateIcons(host);
            }, true);
        });
      });

      FS.hydrateIcons(host);
    }
  }

  /* ----------------------------------------------------------------------
     Catalog editor
     Everything the public template renders: the copy, the picture, the
     bullet list, the feature or stat panel, and the search-engine record.
     ---------------------------------------------------------------------- */

  function catalogEdit() {
    var kind = FS.param('t') || 'service';
    var meta = Store.catalogMeta[kind];
    var slug = FS.param('s');
    var item = meta && Store.catalogItem(kind, slug);
    /* Only vehicle types render a picture anywhere on the site. */
    var hasPicture = kind === 'vehicle';

    if (!item) {
      host.innerHTML = '<div class="empty-state">' + FS.icon('help-circle') +
        '<h4>Not found</h4><p>That record no longer exists.</p>' +
        '<a class="btn btn-primary mt-6" href="' + FS.url('admin/services.html') + '">Back to services</a></div>';
      return;
    }

    /* Working copies of the repeating parts; committed on save. */
    var bullets = (item.bullets || []).slice();
    var panel = ((kind === 'industry' ? item.stats : item.features) || [])
      .map(function (x) { return Object.assign({}, x); });

    render();

    function listHref() {
      return FS.url('admin/' + (kind === 'service' ? 'services' : kind === 'industry' ? 'industries' : 'vehicles') + '.html');
    }

    function render() {
      var seo = item.seo || {};
      host.innerHTML =
        '<nav class="crumbs crumbs--dark"><a href="' + listHref() + '">' + FS.esc(meta.label) + 's</a>' +
          '<span>/</span><strong>' + FS.esc(item.name) + '</strong></nav>' +

        '<div class="page-head"><div><h2>Edit ' + FS.esc(meta.label.toLowerCase()) + '</h2>' +
          '<p>/' + FS.esc(item.slug) + '</p></div>' +
          '<div class="page-head-actions">' +
            '<a class="btn btn-outline" href="' + FS.url(meta.page + '?' + meta.param + '=' + item.slug) + '" ' +
              'target="_blank" rel="noopener">' + FS.icon('external') + 'Preview</a>' +
            '<button class="btn btn-primary" id="ceSave">' + FS.icon('check') + 'Save</button>' +
          '</div></div>' +

        '<form id="ceForm"><div class="dash-grid dash-grid--2-1">' +

          '<div>' +
            /* --- Copy ------------------------------------------------- */
            '<div class="card mb-5"><div class="card-head"><h3>Content</h3></div><div class="card-body">' +
              '<div class="field-row field-row-2">' +
                '<div class="field"><label class="label" for="ceName">Name</label>' +
                  '<input class="input" id="ceName" name="name" value="' + FS.esc(item.name) + '">' +
                  '<p class="hint">Shown on the index card and in the nav bar.</p></div>' +
                '<div class="field"><label class="label" for="ceShort">Short name</label>' +
                  '<input class="input" id="ceShort" name="short" value="' + FS.esc(item.short || '') + '">' +
                  '<p class="hint">Used where space is tight. Blank falls back to the name.</p></div>' +
              '</div>' +
              '<div class="field"><label class="label" for="ceSlug">URL slug</label>' +
                '<div class="row" style="gap:8px"><span class="text-dim text-sm">/</span>' +
                '<input class="input" id="ceSlug" name="slug" value="' + FS.esc(item.slug) + '"></div>' +
                '<p class="hint">Changing this changes the page address. Existing links will break.</p></div>' +
              '<div class="field"><label class="label" for="ceExcerpt">Card text</label>' +
                '<textarea class="textarea" id="ceExcerpt" name="excerpt" style="min-height:70px">' +
                FS.esc(item.excerpt || '') + '</textarea>' +
                '<p class="hint">One line, shown on the index grid and the homepage.</p></div>' +
              '<div class="field"><label class="label" for="ceHero">Page headline (H1)</label>' +
                '<input class="input" id="ceHero" name="hero" value="' + FS.esc(item.hero || '') + '"></div>' +
              '<div class="field mb-0"><label class="label" for="ceIntro">Opening paragraph</label>' +
                '<textarea class="textarea" id="ceIntro" name="intro" style="min-height:120px">' +
                FS.esc(item.intro || '') + '</textarea></div>' +
            '</div></div>' +

            /* --- Bullets ---------------------------------------------- */
            '<div class="card mb-5"><div class="card-head"><h3>What is included</h3>' +
              '<button type="button" class="btn btn-sm btn-outline" id="ceAddBullet">' +
                FS.icon('plus') + 'Add line</button></div><div class="card-body">' +
              '<p class="text-muted text-sm mb-4">The ticked list on the page. One line each.</p>' +
              '<div class="repeater repeater--tight" id="ceBullets"></div>' +
            '</div></div>' +

            /* --- Feature / stat panel --------------------------------- */
            '<div class="card"><div class="card-head"><h3>' +
              (kind === 'industry' ? 'Headline numbers' : 'Feature panel') + '</h3>' +
              '<button type="button" class="btn btn-sm btn-outline" id="ceAddPanel">' +
                FS.icon('plus') + 'Add ' + (kind === 'industry' ? 'number' : 'feature') + '</button></div>' +
              '<div class="card-body">' +
              '<p class="text-muted text-sm mb-4">' +
                (kind === 'industry'
                  ? 'The three figures across the top of the page — a value and its label.'
                  : 'The four-up grid under the introduction. Each one has an icon, a heading and a line of text.') +
              '</p>' +
              '<div class="repeater" id="cePanel"></div>' +
            '</div></div>' +
          '</div>' +

          '<div>' +
            /* --- Picture / icon --------------------------------------- */
            /* The picture control is for vehicle types only. Their artwork is
               the design on the homepage row and the vehicles index, so it has
               to be manageable. Services no longer show a picture on their own
               page, and industries never had one, so neither offers the field. */
            '<div class="card mb-5"><div class="card-head"><h3>' +
              (hasPicture ? 'Picture and icon' : 'Icon') + '</h3></div><div class="card-body">' +
              (hasPicture
                ? '<div class="field"><span class="label">Image</span>' +
                    '<div class="img-picker">' +
                      '<span class="img-preview" id="ceImgPreview">' +
                        (item.image ? '<img src="' + FS.esc(FS.url(item.image)) + '" alt="">' : FS.icon('image')) +
                      '</span>' +
                      '<div class="img-picker-tools">' +
                        '<label class="btn btn-sm btn-outline btn-file">' + FS.icon('upload') + 'Upload' +
                          '<input type="file" accept="image/*" id="ceImgFile"></label>' +
                      '</div>' +
                    '</div>' +
                    '<input type="hidden" id="ceImage" name="image" value="' + FS.esc(item.image || '') + '">' +
                    '<div class="field mt-4 mb-0"><label class="label" for="ceImgUrl">Or paste an address</label>' +
                      '<input class="input" id="ceImgUrl" ' +
                      'value="' + FS.esc(/^data:/.test(item.image || '') ? '' : (item.image || '')) + '" ' +
                      'placeholder="assets/img/vehicles/example.png"></div>' +
                    '<p class="hint" id="ceImgHint">Any size — it is resized on upload and cropped to fit.</p>' +
                  '</div>'
                : '') +
              '<div class="field mb-0"><label class="label" for="ceIcon">Icon</label>' +
                '<select class="select" id="ceIcon" name="icon">' +
                  FS.iconNames().map(function (n) {
                    return '<option value="' + FS.esc(n) + '"' + (n === item.icon ? ' selected' : '') + '>' +
                      FS.esc(n) + '</option>';
                  }).join('') + '</select>' +
                '<div class="icon-preview mt-3" id="ceIconPreview"></div></div>' +
            '</div></div>' +

            /* --- SEO -------------------------------------------------- */
            '<div class="card"><div class="card-head"><h3>Search engine listing</h3>' +
              '<span class="text-sm text-muted" id="ceSeoCount"></span></div><div class="card-body">' +
              '<div class="serp-preview" id="ceSerp"></div>' +
              '<div class="field mt-5"><label class="label" for="ceMetaTitle">Meta title</label>' +
                '<input class="input" id="ceMetaTitle" name="metaTitle" value="' + FS.esc(seo.title || '') + '">' +
                '<p class="hint">Aim for 50–60 characters.</p></div>' +
              '<div class="field"><label class="label" for="ceMetaDesc">Meta description</label>' +
                '<textarea class="textarea" id="ceMetaDesc" name="metaDescription" style="min-height:90px">' +
                FS.esc(seo.description || '') + '</textarea>' +
                '<p class="hint">Aim for 140–160 characters.</p></div>' +
              '<div class="field"><label class="label" for="ceKeywords">Keywords</label>' +
                '<input class="input" id="ceKeywords" name="keywords" value="' + FS.esc(seo.keywords || '') + '">' +
                '<p class="hint">Primary keyword first, then the secondaries.</p></div>' +
              '<div class="field mb-0"><label class="label" for="cePath">Page address</label>' +
                '<div class="row" style="gap:6px"><span class="text-dim text-sm">fleetsquad.com/</span>' +
                '<input class="input" id="cePath" name="path" value="' + FS.esc(seo.path || '') + '"></div>' +
                '<p class="hint">The canonical URL this page declares.</p></div>' +
            '</div></div>' +
          '</div>' +

        '</div></form>';

      paintBullets();
      paintPanel();
      wire();
    }

    /* --- Bullets ------------------------------------------------------ */
    function collectBullets() {
      bullets = FS.$$('#ceBullets [data-bullet]', host).map(function (i) { return i.value.trim(); });
    }
    function paintBullets() {
      var list = document.getElementById('ceBullets');
      list.innerHTML = bullets.length
        ? bullets.map(function (b, i) {
            return '<div class="repeat-row" data-i="' + i + '">' +
              '<input class="input" data-bullet aria-label="Line ' + (i + 1) + '" ' +
              'value="' + FS.esc(b) + '" placeholder="Something this covers">' +
              '<button type="button" class="btn btn-xs btn-danger" data-bulletdel ' +
                'aria-label="Remove line">' + FS.icon('trash') + '</button></div>';
          }).join('')
        : '<p class="text-dim text-sm">No lines yet.</p>';
      FS.hydrateIcons(list);
      FS.$$('[data-bulletdel]', list).forEach(function (b) {
        b.addEventListener('click', function () {
          collectBullets();
          bullets.splice(Number(b.closest('.repeat-row').dataset.i), 1);
          paintBullets();
        });
      });
    }

    /* --- Feature / stat panel ----------------------------------------- */
    function collectPanel() {
      FS.$$('#cePanel .repeat-item', host).forEach(function (el) {
        var row = panel[Number(el.dataset.i)];
        if (!row) return;
        if (kind === 'industry') {
          row.v = el.querySelector('[data-pv]').value.trim();
          row.l = el.querySelector('[data-pl]').value.trim();
        } else {
          row.icon = el.querySelector('[data-picon]').value;
          row.title = el.querySelector('[data-ptitle]').value.trim();
          row.text = el.querySelector('[data-ptext]').value.trim();
        }
      });
    }
    function paintPanel() {
      var list = document.getElementById('cePanel');
      list.innerHTML = panel.length
        ? panel.map(function (p, i) {
            var inner = kind === 'industry'
              ? '<div class="field-row field-row-2">' +
                  '<div class="field mb-0"><span class="label">Value</span>' +
                    '<input class="input" data-pv aria-label="Value" value="' + FS.esc(p.v || '') + '" placeholder="4.2 hrs"></div>' +
                  '<div class="field mb-0"><span class="label">Label</span>' +
                    '<input class="input" data-pl aria-label="Label" value="' + FS.esc(p.l || '') + '" placeholder="Average turnaround"></div>' +
                '</div>'
              : '<div class="field-row field-row-2">' +
                  '<div class="field"><span class="label">Icon</span>' +
                    '<select class="select" data-picon aria-label="Icon">' +
                      FS.iconNames().map(function (n) {
                        return '<option value="' + FS.esc(n) + '"' + (n === p.icon ? ' selected' : '') + '>' + FS.esc(n) + '</option>';
                      }).join('') + '</select></div>' +
                  '<div class="field"><span class="label">Heading</span>' +
                    '<input class="input" data-ptitle aria-label="Heading" value="' + FS.esc(p.title || '') + '"></div>' +
                '</div>' +
                '<div class="field mb-0"><span class="label">Text</span>' +
                  '<textarea class="textarea" data-ptext aria-label="Text" style="min-height:56px">' + FS.esc(p.text || '') + '</textarea></div>';
            return '<div class="repeat-item repeat-item--block" data-i="' + i + '">' +
              '<div class="repeat-fields">' + inner + '</div>' +
              '<div class="repeat-actions">' +
                '<button type="button" class="btn btn-xs btn-danger" data-paneldel ' +
                  'aria-label="Remove">' + FS.icon('trash') + '</button>' +
              '</div></div>';
          }).join('')
        : '<p class="text-dim text-sm">Nothing here yet.</p>';
      FS.hydrateIcons(list);
      FS.$$('[data-paneldel]', list).forEach(function (b) {
        b.addEventListener('click', function () {
          collectPanel();
          panel.splice(Number(b.closest('.repeat-item').dataset.i), 1);
          paintPanel();
        });
      });
    }

    /* --- Wiring -------------------------------------------------------- */
    function wire() {
      var name = document.getElementById('ceName');
      var shortField = document.getElementById('ceShort');
      var mt = document.getElementById('ceMetaTitle');
      var md = document.getElementById('ceMetaDesc');
      var pathField = document.getElementById('cePath');

      /* The short name is what the nav bar and footer show. Rename the record
         and it follows along, until someone types a different one by hand —
         otherwise the menus keep showing the old name and look broken. */
      var shortIsAuto = !shortField.value.trim() || shortField.value.trim() === item.name;
      shortField.addEventListener('input', function () { shortIsAuto = false; });
      name.addEventListener('input', function () {
        if (shortIsAuto) shortField.value = name.value;
      });

      function paintSerp() {
        var t = mt.value || (name.value + ' | FleetSquad');
        var d = md.value || document.getElementById('ceExcerpt').value;
        document.getElementById('ceSerp').innerHTML =
          '<div class="serp-url">fleetsquad.com › ' + FS.esc(String(pathField.value).replace(/[/]$/, '')) + '</div>' +
          '<div class="serp-title">' + FS.esc(t.slice(0, 62)) + (t.length > 62 ? '…' : '') + '</div>' +
          '<div class="serp-desc">' + FS.esc(d.slice(0, 165)) + (d.length > 165 ? '…' : '') + '</div>';
        document.getElementById('ceSeoCount').textContent =
          'Title ' + t.length + '/60 · Description ' + d.length + '/160';
      }
      [name, mt, md, pathField, document.getElementById('ceExcerpt')].forEach(function (el) {
        el.addEventListener('input', paintSerp);
      });
      paintSerp();

      var iconSel = document.getElementById('ceIcon');
      function paintIcon() {
        document.getElementById('ceIconPreview').innerHTML = FS.icon(iconSel.value);
      }
      iconSel.addEventListener('change', paintIcon);
      paintIcon();

      /* Picture — vehicle types only; the other two catalogs have no field. */
      if (hasPicture) {
        var image = document.getElementById('ceImage');
        var preview = document.getElementById('ceImgPreview');
        var urlField = document.getElementById('ceImgUrl');
        var setImage = function (v, note) {
          image.value = v || '';
          preview.innerHTML = v ? '<img src="' + FS.esc(FS.url(v)) + '" alt="">' : FS.icon('image');
          FS.hydrateIcons(preview);
          if (note) document.getElementById('ceImgHint').textContent = note;
        };
        document.getElementById('ceImgFile').addEventListener('change', function () {
          var file = this.files[0];
          if (!file) return;
          FS.readImage(file, 1400, function (url, err, info) {
            if (err) { FS.toast('Could not use that file', err, 'warn'); return; }
            setImage(url, info.width + '×' + info.height + ' · about ' + Math.round(info.bytes / 1024) + ' KB.');
            urlField.value = '';
          });
        });
        urlField.addEventListener('input', function () { setImage(this.value.trim(), 'Loaded from an address.'); });
      }

      document.getElementById('ceAddBullet').addEventListener('click', function () {
        collectBullets();
        bullets.push('');
        paintBullets();
        var last = host.querySelector('#ceBullets .repeat-row:last-child [data-bullet]');
        if (last) last.focus();
      });
      document.getElementById('ceAddPanel').addEventListener('click', function () {
        collectPanel();
        panel.push(kind === 'industry' ? { v: '', l: '' } : { icon: 'check-circle', title: '', text: '' });
        paintPanel();
      });

      document.getElementById('ceSave').addEventListener('click', save);
      FS.hydrateIcons(host);
    }

    function save() {
      collectBullets();
      collectPanel();
      var form = FS.formData(document.getElementById('ceForm'));

      if (!String(form.name).trim()) {
        FS.toast('A name is needed', 'Every ' + meta.label.toLowerCase() + ' needs a name.', 'warn');
        return;
      }

      // Keep the slug URL-safe and unique inside this catalog.
      var newSlug = Store.uniqueSlug(kind, form.slug || form.name, item.slug);

      var patch = {
        slug: newSlug,
        name: form.name,
        short: form.short || form.name,
        icon: form.icon,
        // Without a picture control on the form there is no value to read, so
        // whatever the record already holds is carried through untouched.
        image: hasPicture ? form.image : item.image,
        excerpt: form.excerpt,
        hero: form.hero || form.name,
        intro: form.intro,
        bullets: bullets.filter(Boolean),
        seo: {
          title: form.metaTitle,
          description: form.metaDescription,
          keywords: form.keywords,
          path: String(form.path || newSlug + '/').replace(/^[/]/, '')
        }
      };
      if (kind === 'industry') {
        patch.stats = panel.filter(function (p) { return p.v || p.l; });
      } else {
        patch.features = panel.filter(function (p) { return p.title || p.text; });
      }

      Store.saveCatalogItem(kind, item.slug, patch);
      item = Store.catalogItem(kind, newSlug);

      if (!Store.lastWriteOk) {
        FS.toast('Saved, but not kept', 'This browser refused the write — usually an image too ' +
          'large for the store. The change is live until you reload.', 'warn');
      } else {
        FS.toast(meta.label + ' saved', item.name, 'ok');
      }

      if (newSlug !== slug) {
        slug = newSlug;
        window.history.replaceState({}, '', FS.url('admin/catalog-edit.html?t=' + kind + '&s=' + newSlug));
      }
      render();
    }
  }

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
    'inbox': inbox,
    'cms': cms,
    'blog': blog,
    'blog-edit': blogEdit,
    'service-areas': serviceAreas,
    'services': catalogList,
    'industries': catalogList,
    'vehicles': catalogList,
    'catalog-edit': catalogEdit,
    'users': users,
    'settings': settings
  };

  function init() {
    var v = VIEWS[document.body.dataset.view];
    if (v) v();
    FS.hydrateIcons(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
