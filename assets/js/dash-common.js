/* ==========================================================================
   FleetSquad — Shared dashboard building blocks
   Badges, KPI cards, the order table, vehicle cards, image galleries and the
   modals (assign mechanic, change status, add/edit vehicle, upload images,
   record payment/payout). Every role screen composes these.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var Store = FS.store;
  var Dash = FS.dash = {};

  /* ------------------------------------------------------------------------
     Badges
     ------------------------------------------------------------------------ */

  Dash.statusBadge = function (status) {
    var m = D.statusMeta[status] || { label: status, cls: 'badge--neutral' };
    return '<span class="badge ' + m.cls + '">' + FS.esc(m.label) + '</span>';
  };

  Dash.paymentBadge = function (payment) {
    var m = D.paymentMeta[payment] || { label: payment, cls: 'badge--neutral' };
    return '<span class="badge ' + m.cls + '">' + FS.esc(m.label) + '</span>';
  };

  Dash.vehicleBadge = function (status) {
    var cls = {
      'Repair Complete': 'badge--ok',
      'Ready for Test Drive': 'badge--info',
      'In Progress': 'badge--warn',
      'Awaiting Parts': 'badge--danger',
      'Not Started': 'badge--neutral'
    }[status] || 'badge--neutral';
    return '<span class="badge ' + cls + '">' + FS.esc(status) + '</span>';
  };

  /* ------------------------------------------------------------------------
     KPI cards
     ------------------------------------------------------------------------ */

  /** @param {{icon,tone,label,value,delta,deltaDir}} k */
  Dash.kpi = function (k) {
    var delta = '';
    if (k.delta) {
      var dir = k.deltaDir || 'up';
      delta = '<div class="kpi-delta kpi-delta--' + dir + '">' +
        FS.icon(dir === 'down' ? 'arrow-down' : dir === 'flat' ? 'minus' : 'arrow-up') +
        FS.esc(k.delta) + '</div>';
    }
    return '<div class="kpi">' +
      '<div class="kpi-top">' +
        '<span class="kpi-label">' + FS.esc(k.label) + '</span>' +
        '<span class="kpi-icon' + (k.tone ? ' kpi-icon--' + k.tone : '') + '">' + FS.icon(k.icon) + '</span>' +
      '</div>' +
      '<div class="kpi-value">' + k.value + '</div>' + delta +
    '</div>';
  };

  Dash.kpiGrid = function (list, cls) {
    return '<div class="kpi-grid ' + (cls || '') + '">' + list.map(Dash.kpi).join('') + '</div>';
  };

  /* ------------------------------------------------------------------------
     Bar chart + activity feed
     ------------------------------------------------------------------------ */

  Dash.bars = function (series) {
    var max = Math.max.apply(null, series.map(function (s) { return s.value; })) || 1;
    return '<div class="bars">' + series.map(function (s) {
      var h = Math.max(6, Math.round((s.value / max) * 100));
      return '<div class="bar-col">' +
        '<span class="bar-val">' + FS.money(s.value) + '</span>' +
        '<div class="bar" style="height:' + h + '%" title="' + FS.esc(s.label) + ': ' + FS.money(s.value) + '"></div>' +
        '<small>' + FS.esc(s.label) + '</small>' +
      '</div>';
    }).join('') + '</div>';
  };

  Dash.feed = function (items) {
    if (!items.length) {
      return '<div class="text-center text-dim text-sm" style="padding:28px">No activity yet</div>';
    }
    return '<div class="feed">' + items.map(function (i) {
      return '<div class="feed-item">' +
        '<span class="feed-dot">' + FS.icon(i.icon || 'activity') + '</span>' +
        '<div class="feed-body"><p>' + i.text + '</p>' +
        '<small>' + FS.esc(i.who || '') + (i.who ? ' · ' : '') + FS.ago(i.at) + '</small></div>' +
      '</div>';
    }).join('') + '</div>';
  };

  /* ------------------------------------------------------------------------
     Order table
     opts: { columns, detailHref, actions(order) -> html, empty }
     ------------------------------------------------------------------------ */

  var ALL_COLUMNS = {
    id:       { label: 'Project ID', render: function (o, opt) {
                  return '<a class="td-strong text-blue" href="' + FS.url(opt.detailHref + '?id=' + o.id) + '">' + FS.esc(o.id) + '</a>'; } },
    customer: { label: 'Customer',   render: function (o) {
                  var c = Store.customer(o.customerId);
                  return c ? '<div class="row"><span class="avatar avatar--sm">' + FS.initials(c.company) + '</span>' +
                    '<span style="min-width:0"><span class="td-strong" style="display:block">' + FS.esc(c.company) + '</span>' +
                    '<small class="text-xs text-dim">' + FS.esc(c.firstName + ' ' + c.lastName) + '</small></span></div>'
                    : '—'; } },
    service:  { label: 'Service Type', render: function (o) { return FS.esc(o.serviceType); } },
    vehicles: { label: 'Vehicles',   render: function (o) { return '<span class="td-strong">' + o.vehicles.length + '</span>' +
                  (o.allowedVehicles > o.vehicles.length ? '<small class="text-dim"> / ' + o.allowedVehicles + '</small>' : ''); } },
    mechanic: { label: 'Assigned Mechanic', render: function (o) {
                  var m = Store.mechanic(o.mechanicId);
                  return m ? '<div class="row"><span class="avatar avatar--sm">' + FS.initials(m.name) + '</span>' +
                    '<span>' + FS.esc(m.name) + '</span></div>'
                    : '<span class="text-dim">Unassigned</span>'; } },
    status:   { label: 'Status',     render: function (o) { return Dash.statusBadge(o.status); } },
    payment:  { label: 'Payment',    render: function (o) { return Dash.paymentBadge(o.payment); } },
    total:    { label: 'Total',      render: function (o) { return '<span class="td-strong">' + FS.money(Store.orderTotal(o)) + '</span>'; } },
    created:  { label: 'Created',    render: function (o) { return FS.date(o.createdAt); } },
    location: { label: 'Location',   render: function (o) { return FS.esc(o.city + ', ' + o.state); } },
    urgency:  { label: 'Urgency',    render: function (o) {
                  var cls = o.urgency === 'ASAP' ? 'badge--danger' : 'badge--neutral';
                  return '<span class="badge ' + cls + '">' + FS.esc(o.urgency) + '</span>'; } }
  };

  Dash.orderTable = function (orders, opts) {
    opts = opts || {};
    var cols = opts.columns || ['id', 'customer', 'service', 'vehicles', 'mechanic', 'status', 'payment'];
    var withActions = typeof opts.actions === 'function';

    if (!orders.length) {
      return '<div class="table-empty">' + FS.icon('search') +
        '<p class="mt-3">' + FS.esc(opts.empty || 'No projects match this filter.') + '</p></div>';
    }

    var head = cols.map(function (c) { return '<th>' + ALL_COLUMNS[c].label + '</th>'; }).join('') +
      (withActions ? '<th class="td-actions">Actions</th>' : '');

    var rows = orders.map(function (o) {
      return '<tr data-order="' + o.id + '">' +
        cols.map(function (c) {
          return '<td data-label="' + ALL_COLUMNS[c].label + '">' + ALL_COLUMNS[c].render(o, opts) + '</td>';
        }).join('') +
        (withActions ? '<td class="td-actions" data-label="Actions">' + opts.actions(o) + '</td>' : '') +
      '</tr>';
    }).join('');

    return '<div class="scroll-x"><table class="table table--stack">' +
      '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  };

  /** The row-level "…" menu used on the admin and manager tables. */
  Dash.rowMenu = function (order, items) {
    return '<div class="dropdown">' +
      '<button class="btn-icon btn-icon--bare" data-dropdown aria-label="Actions for ' + FS.esc(order.id) + '">' +
        FS.icon('more-vertical') + '</button>' +
      '<div class="dropdown-menu">' + items.map(function (i) {
        if (i.sep) return '<div class="dropdown-sep"></div>';
        return i.href
          ? '<a href="' + FS.url(i.href) + '">' + FS.icon(i.icon) + FS.esc(i.label) + '</a>'
          : '<button data-act="' + i.act + '" data-id="' + FS.esc(order.id) + '"' +
            (i.danger ? ' class="is-danger"' : '') + '>' + FS.icon(i.icon) + FS.esc(i.label) + '</button>';
      }).join('') + '</div></div>';
  };

  /* ------------------------------------------------------------------------
     Vehicle card
     perms controls which buttons appear, so one renderer serves all four roles
     ------------------------------------------------------------------------ */

  Dash.vehicleCard = function (order, v, index, perms) {
    perms = perms || {};
    var mech = Store.mechanic(v.mechanicId);
    var totalImages = Object.keys(v.images || {}).reduce(function (s, k) { return s + v.images[k].length; }, 0);

    var actions = [];
    if (perms.edit)        actions.push(btn('edit-vehicle', 'edit', 'Edit', 'btn-outline'));
    if (perms.upload)      actions.push(btn('upload-images', 'camera', 'Upload Images', 'btn-outline'));
    if (perms.notes)       actions.push(btn('add-note', 'file-text', 'Repair Notes', 'btn-outline'));
    if (perms.clock && v.status !== 'Repair Complete') actions.push(btn('clock', 'clock', v.clockIn && !v.clockOut ? 'Clock Out' : 'Clock In', 'btn-dark'));
    if (perms.testDrive && v.status !== 'Ready for Test Drive' && v.status !== 'Repair Complete') {
      actions.push(btn('test-drive', 'play', 'Ready for Test Drive', 'btn-outline'));
    }
    if (perms.complete && v.status !== 'Repair Complete') actions.push(btn('complete', 'check-circle', 'Mark Repair Complete', 'btn-success'));

    function btn(act, icon, label, cls) {
      return '<button class="btn btn-sm ' + cls + '" data-vact="' + act + '" data-i="' + index + '">' +
        FS.icon(icon) + FS.esc(label) + '</button>';
    }

    return '<article class="vehicle-card" data-vehicle="' + index + '">' +
      '<div class="vehicle-head">' +
        '<span class="vehicle-no">#' + v.no + '</span>' +
        '<div class="vehicle-title">' +
          '<strong>' + FS.esc([v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle ' + v.no) + '</strong>' +
          '<small>' + FS.esc(v.plate || 'No plate') + ' · ' + FS.num(v.mileage) + ' mi</small>' +
        '</div>' +
        Dash.vehicleBadge(v.status) +
      '</div>' +

      '<div class="vehicle-body">' +
        '<dl class="dl dl--3 mb-5">' +
          dd('VIN', v.vin || '—') +
          dd('License Plate', v.plate || '—') +
          dd('Mileage', FS.num(v.mileage) + ' mi') +
          dd('Mechanic', mech ? mech.name : 'Unassigned') +
          dd('Visit Date', v.visitDate ? FS.date(v.visitDate) : 'Not scheduled') +
          dd('Repair Cost', FS.money(v.cost)) +
        '</dl>' +

        '<div class="mb-5">' +
          '<dt class="text-xs uppercase text-muted text-bold mb-2">Repair Description</dt>' +
          '<p class="text-muted mb-0">' + FS.esc(v.repair || 'No description yet.') + '</p>' +
        '</div>' +

        (v.notes ? '<div class="alert alert--info mb-5">' + FS.icon('file-text') +
          '<div><strong>Technician notes</strong><br>' + FS.esc(v.notes) + '</div></div>' : '') +

        /* Times are shown in 12-hour format with AM/PM, never military. */
        '<div class="clock-strip mb-5">' +
          '<div class="clock-cell"><small>Clock In</small><strong>' + FS.esc(FS.time12(v.clockIn)) + '</strong></div>' +
          '<div class="clock-cell"><small>Clock Out</small><strong>' + FS.esc(FS.time12(v.clockOut)) + '</strong></div>' +
          '<div class="clock-cell"><small>Total Hours</small><strong>' + FS.esc(FS.duration(v.hours)) + '</strong></div>' +
          '<div class="clock-cell"><small>Images</small><strong>' + totalImages + '</strong></div>' +
        '</div>' +

        Dash.gallery(v.images) +

        (actions.length ? '<div class="row row-wrap mt-5" style="gap:var(--sp-2)">' + actions.join('') + '</div>' : '') +
      '</div>' +
    '</article>';

    function dd(label, value) {
      return '<div><dt>' + label + '</dt><dd>' + FS.esc(value) + '</dd></div>';
    }
  };

  /* ------------------------------------------------------------------------
     Image galleries, grouped by the categories the spec calls for
     ------------------------------------------------------------------------ */

  Dash.IMAGE_GROUPS = [
    { key: 'before',     label: 'Before' },
    { key: 'after',      label: 'After' },
    { key: 'paperwork',  label: 'Paperwork' },
    { key: 'vin',        label: 'VIN' },
    { key: 'photos',     label: 'Vehicle Photos' },
    { key: 'customerId', label: 'Customer ID' }
  ];

  Dash.gallery = function (images) {
    images = images || {};
    var groups = Dash.IMAGE_GROUPS.filter(function (g) {
      return (images[g.key] || []).length;
    });
    if (!groups.length) {
      return '<p class="text-xs text-dim">No images uploaded yet.</p>';
    }
    return groups.map(function (g) {
      var list = images[g.key];
      return '<div class="gallery-group">' +
        '<h5>' + FS.esc(g.label) + '<span class="count">' + list.length + '</span></h5>' +
        '<div class="thumbs">' + list.map(function (img) {
          var src = img.dataUrl || img.src || '';
          return '<div class="thumb">' + (src
            ? '<img src="' + src + '" alt="' + FS.esc(img.name || g.label) + '" loading="lazy">'
            : '<span class="thumb-fallback">' + FS.esc(img.name || 'image') + '</span>') + '</div>';
        }).join('') + '</div>' +
      '</div>';
    }).join('');
  };

  /* ------------------------------------------------------------------------
     Modals
     ------------------------------------------------------------------------ */

  Dash.assignModal = function (order, done) {
    var options = Store.mechanics().map(function (m) {
      return '<label class="opt-card' + (m.id === order.mechanicId ? ' is-selected' : '') + '">' +
        '<input type="radio" name="mech" value="' + m.id + '"' + (m.id === order.mechanicId ? ' checked' : '') + '>' +
        '<span class="avatar avatar--sm">' + FS.initials(m.name) + '</span>' +
        '<span style="flex:1 1 auto;min-width:0">' +
          '<strong>' + FS.esc(m.name) + '</strong>' +
          '<span>' + FS.esc(m.certs) + ' · ' + FS.esc(m.city + ', ' + m.state) + '</span>' +
        '</span>' +
        '<span class="badge badge--' + (m.status === 'available' ? 'ok' : m.status === 'on-job' ? 'warn' : 'neutral') + '">' +
          FS.esc(m.status) + '</span>' +
      '</label>';
    }).join('');

    FS.modal({
      title: 'Assign mechanic',
      subtitle: 'Project ' + order.id + ' · ' + order.city + ', ' + order.state,
      size: 'lg',
      body: '<div class="stack" id="mechList">' + options + '</div>' +
            '<div class="alert alert--info mt-5">' + FS.icon('message') +
            '<div>An SMS is sent to the technician with the project ID, service type and location.</div></div>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="assignGo">Assign &amp; notify</button>',
      onMount: function (root, close) {
        root.querySelector('#assignGo').addEventListener('click', function () {
          var picked = root.querySelector('input[name="mech"]:checked');
          if (!picked) { FS.toast('Pick a mechanic', 'Select who should take this project.', 'warn'); return; }
          Store.assignMechanic(order.id, picked.value, FS.shell.session.name);
          close();
          FS.toast('Mechanic assigned', 'SMS notification sent.', 'ok');
          if (done) done();
        });
      }
    });
  };

  Dash.statusModal = function (order, done) {
    var options = Object.keys(D.statusMeta).map(function (k) {
      return '<label class="opt-card' + (k === order.status ? ' is-selected' : '') + '">' +
        '<input type="radio" name="st" value="' + k + '"' + (k === order.status ? ' checked' : '') + '>' +
        '<span style="flex:1 1 auto"><strong>' + FS.esc(D.statusMeta[k].label) + '</strong></span>' +
        Dash.statusBadge(k) +
      '</label>';
    }).join('');

    FS.modal({
      title: 'Change status',
      subtitle: 'Project ' + order.id,
      body: '<div class="stack">' + options + '</div>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="stGo">Save status</button>',
      onMount: function (root, close) {
        root.querySelector('#stGo').addEventListener('click', function () {
          var picked = root.querySelector('input[name="st"]:checked');
          Store.setStatus(order.id, picked.value, FS.shell.session.name);
          close();
          FS.toast('Status updated', D.statusMeta[picked.value].label, 'ok');
          if (done) done();
        });
      }
    });
  };

  /** Add or edit a vehicle row. Pass index = null to add. */
  Dash.vehicleModal = function (order, index, done, opts) {
    opts = opts || {};
    var v = index == null ? {} : order.vehicles[index];
    var isNew = index == null;

    if (isNew && order.vehicles.length >= order.allowedVehicles && opts.enforceLimit) {
      FS.toast('Vehicle limit reached',
        'This project allows ' + order.allowedVehicles + ' vehicles. Ask your manager to raise it.', 'warn');
      return;
    }

    var statusOptions = D.vehicleStatuses.map(function (s) {
      return '<option value="' + s + '"' + (s === v.status ? ' selected' : '') + '>' + s + '</option>';
    }).join('');

    var mechOptions = '<option value="">Unassigned</option>' + Store.mechanics().map(function (m) {
      return '<option value="' + m.id + '"' + (m.id === v.mechanicId ? ' selected' : '') + '>' + FS.esc(m.name) + '</option>';
    }).join('');

    FS.modal({
      title: isNew ? 'Add vehicle' : 'Edit vehicle #' + v.no,
      subtitle: 'Project ' + order.id,
      size: 'lg',
      body:
        '<form id="vForm" novalidate>' +
          '<div class="field-row field-row-3 mb-4">' +
            f('Year', 'year', 'number', v.year || new Date().getFullYear(), true) +
            f('Make', 'make', 'text', v.make, true) +
            f('Model', 'model', 'text', v.model, true) +
          '</div>' +
          '<div class="field-row field-row-3 mb-4">' +
            f('Mileage', 'mileage', 'number', v.mileage) +
            f('License Plate', 'plate', 'text', v.plate) +
            f('VIN', 'vin', 'text', v.vin) +
          '</div>' +
          '<div class="field"><label class="label" for="vRepair">Repair Description</label>' +
            '<textarea class="textarea" id="vRepair" name="repair">' + FS.esc(v.repair || '') + '</textarea></div>' +
          (opts.admin ?
          '<div class="field-row field-row-3 mb-4">' +
            '<div class="field"><label class="label" for="vMech">Mechanic Assigned</label>' +
              '<select class="select" id="vMech" name="mechanicId">' + mechOptions + '</select></div>' +
            f('Visit Date', 'visitDate', 'date', v.visitDate) +
            '<div class="field"><label class="label" for="vStatus">Status</label>' +
              '<select class="select" id="vStatus" name="status">' + statusOptions + '</select></div>' +
          '</div>' +
          '<div class="field-row field-row-3">' +
            f('Clock In', 'clockIn', 'time', v.clockIn) +
            f('Clock Out', 'clockOut', 'time', v.clockOut) +
            f('Repair Cost ($)', 'cost', 'number', v.cost) +
          '</div>' : '') +
        '</form>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="vSave">' + (isNew ? 'Add vehicle' : 'Save changes') + '</button>',
      onMount: function (root, close) {
        root.querySelector('#vSave').addEventListener('click', function () {
          var form = root.querySelector('#vForm');
          if (!FS.validate(form)) return;
          var data = FS.formData(form);
          data.year = Number(data.year) || 0;
          data.mileage = Number(data.mileage) || 0;
          data.cost = Number(data.cost) || 0;
          if (isNew) Store.addVehicle(order.id, data);
          else Store.updateVehicle(order.id, index, data);
          close();
          FS.toast(isNew ? 'Vehicle added' : 'Vehicle updated', 'Project ' + order.id, 'ok');
          if (done) done();
        });
      }
    });

    function f(label, name, type, value, required) {
      var id = 'v_' + name;
      return '<div class="field"><label class="label" for="' + id + '">' + label +
        (required ? ' <span class="req">*</span>' : '') + '</label>' +
        '<input class="input" id="' + id + '" name="' + name + '" type="' + type + '" ' +
        'value="' + FS.esc(value == null ? '' : value) + '"' + (required ? ' required' : '') + '></div>';
    }
  };

  /** Upload images into one of the six categories on a vehicle. */
  Dash.uploadModal = function (order, index, done) {
    var groupOptions = Dash.IMAGE_GROUPS.map(function (g) {
      return '<option value="' + g.key + '">' + g.label + '</option>';
    }).join('');

    var up;
    FS.modal({
      title: 'Upload images',
      subtitle: 'Project ' + order.id + ' · Vehicle #' + order.vehicles[index].no,
      body:
        '<div class="field"><label class="label" for="imgGroup">Image category</label>' +
          '<select class="select" id="imgGroup">' + groupOptions + '</select></div>' +
        '<div class="upload" id="dashUpload" role="button" tabindex="0">' +
          '<i data-icon="upload"></i><strong>Tap to choose images</strong>' +
          '<small>Before &amp; after, paperwork, VIN plate, vehicle photos or customer ID.</small>' +
        '</div>' +
        '<input type="file" id="dashFile" accept="image/*" multiple hidden>' +
        '<div class="thumbs" id="dashThumbs"></div>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="upSave">Attach images</button>',
      onMount: function (root, close) {
        up = FS.uploader({
          zone: root.querySelector('#dashUpload'),
          input: root.querySelector('#dashFile'),
          list: root.querySelector('#dashThumbs'),
          max: 10
        });
        root.querySelector('#upSave').addEventListener('click', function () {
          if (!up.files.length) { FS.toast('Nothing selected', 'Choose at least one image.', 'warn'); return; }
          var group = root.querySelector('#imgGroup').value;
          up.files.forEach(function (f) {
            Store.addImage(order.id, index, group, { name: f.name, dataUrl: f.dataUrl });
          });
          Store.logTimeline(order.id, FS.shell.session.name,
            up.files.length + ' image(s) uploaded to Vehicle #' + order.vehicles[index].no);
          close();
          FS.toast('Images attached', up.files.length + ' file(s) added.', 'ok');
          if (done) done();
        });
      }
    });
  };

  /** Technician repair notes. */
  Dash.noteModal = function (order, index, done) {
    var v = order.vehicles[index];
    FS.modal({
      title: 'Repair notes',
      subtitle: 'Vehicle #' + v.no + ' · ' + [v.year, v.make, v.model].filter(Boolean).join(' '),
      body: '<div class="field"><label class="label" for="noteText">Notes</label>' +
        '<textarea class="textarea" id="noteText" style="min-height:160px">' + FS.esc(v.notes || '') + '</textarea>' +
        '<p class="hint">Visible to the customer, the manager and the admin team.</p></div>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="noteSave">Save notes</button>',
      onMount: function (root, close) {
        root.querySelector('#noteSave').addEventListener('click', function () {
          Store.updateVehicle(order.id, index, { notes: root.querySelector('#noteText').value });
          Store.logTimeline(order.id, FS.shell.session.name, 'Repair notes updated on Vehicle #' + v.no);
          close();
          FS.toast('Notes saved', 'Vehicle #' + v.no, 'ok');
          if (done) done();
        });
      }
    });
  };

  /* ------------------------------------------------------------------------
     Money modals
     ------------------------------------------------------------------------ */

  Dash.paymentLinkModal = function (order) {
    var total = Store.orderTotal(order);
    var link = 'https://pay.fleetsquad.com/l/' + order.id.toLowerCase() + '-' +
               Math.abs(hash(order.id)).toString(36).slice(0, 8);

    FS.modal({
      title: 'Stripe payment link',
      subtitle: 'Project ' + order.id,
      body:
        '<div class="money-row"><span>Labour</span><strong>' + FS.money(order.laborTotal) + '</strong></div>' +
        '<div class="money-row"><span>Parts</span><strong>' + FS.money(order.partsTotal) + '</strong></div>' +
        '<div class="money-row money-row--total"><span>Amount due</span><strong>' + FS.money(total) + '</strong></div>' +
        '<div class="field mt-6"><label class="label" for="payLink">Shareable link</label>' +
          '<div class="row" style="gap:8px">' +
            '<input class="input" id="payLink" value="' + link + '" readonly>' +
            '<button class="btn btn-outline" id="copyLink">' + FS.icon('copy') + 'Copy</button>' +
          '</div>' +
          '<p class="hint">Simulated — no Stripe account is connected in this prototype.</p></div>' +
        '<div class="msg-preview mt-5">' +
          '<div class="msg-preview-head">' + FS.icon('mail') + 'Email preview</div>' +
          '<div class="msg-preview-body">Subject: Your FleetSquad invoice for ' + order.id + '\n\n' +
          'Your project is complete. Amount due ' + FS.money(total) + '.\n' +
          'Pay securely: ' + link + '</div>' +
        '</div>',
      footer: '<button class="btn btn-outline" data-close>Close</button>' +
              '<button class="btn btn-primary" id="sendLink">' + FS.icon('send') + 'Send to customer</button>',
      onMount: function (root, close) {
        root.querySelector('#copyLink').addEventListener('click', function () {
          var input = root.querySelector('#payLink');
          input.select();
          try { document.execCommand('copy'); } catch (e) { /* clipboard blocked on file:// */ }
          FS.toast('Link copied', 'Paste it anywhere.', 'ok');
        });
        root.querySelector('#sendLink').addEventListener('click', function () {
          var c = Store.customer(order.customerId);
          Store.notify({
            channel: 'email', audience: 'customer', orderId: order.id,
            title: 'Your invoice is ready',
            body: 'Project ' + order.id + ' is complete. Amount due ' + FS.money(total) +
                  '. Pay securely with the link in this email.'
          });
          close();
          FS.toast('Payment link sent', (c ? c.company : 'Customer') + ' notified by email.', 'ok');
        });
      }
    });
  };

  Dash.chargeModal = function (order, done) {
    var total = Store.orderTotal(order);
    FS.modal({
      title: 'Manual Stripe charge',
      subtitle: 'Project ' + order.id,
      body:
        '<div class="alert alert--warn mb-5">' + FS.icon('alert-triangle') +
          '<div>This charges the card on file immediately. Simulated in this prototype.</div></div>' +
        '<form id="chargeForm" novalidate>' +
          '<div class="field"><label class="label" for="chAmount">Amount ($) <span class="req">*</span></label>' +
            '<input class="input" id="chAmount" name="amount" type="number" value="' + total + '" required></div>' +
          '<div class="field"><label class="label" for="chCard">Card on file</label>' +
            '<select class="select" id="chCard" name="card">' +
              '<option>Visa •••• 4242 (default)</option><option>Amex •••• 1009</option><option>ACH · Chase ••6621</option>' +
            '</select></div>' +
          '<div class="field"><label class="label" for="chNote">Statement descriptor</label>' +
            '<input class="input" id="chNote" name="note" value="FLEETSQUAD ' + order.id + '"></div>' +
        '</form>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="chargeGo">' + FS.icon('credit-card') + 'Charge now</button>',
      onMount: function (root, close) {
        root.querySelector('#chargeGo').addEventListener('click', function () {
          var form = root.querySelector('#chargeForm');
          if (!FS.validate(form)) return;
          var f = FS.formData(form);
          Store.addPayment({
            orderId: order.id, customerId: order.customerId,
            amount: Number(f.amount), method: 'Stripe · ' + f.card, type: 'charge', status: 'succeeded'
          });
          Store.updateOrder(order.id, { payment: 'paid', status: 'completed' },
            { who: FS.shell.session.name, text: 'Payment of ' + FS.money(f.amount) + ' captured' });
          close();
          FS.toast('Payment captured', FS.money(f.amount) + ' charged.', 'ok');
          if (done) done();
        });
      }
    });
  };

  /**
   * Close a project out as paid without running a card — for the jobs settled
   * in cash, by cheque or by bank transfer. The project can have been assigned
   * and worked long before this happens.
   */
  Dash.markPaidModal = function (order, done) {
    if (order.payment === 'paid') {
      FS.toast('Already paid', 'Project ' + order.id + ' is settled.', 'info');
      return;
    }
    var total = Store.orderTotal(order);
    var already = Store.payments()
      .filter(function (p) { return p.orderId === order.id && p.status === 'succeeded' && p.type !== 'refund'; })
      .reduce(function (s, p) { return s + p.amount; }, 0);
    var outstanding = Math.max(0, total - already);

    FS.modal({
      title: 'Mark project fully paid',
      subtitle: order.id,
      body:
        '<div class="money-row"><span>Project total</span><strong>' + FS.money(total, true) + '</strong></div>' +
        '<div class="money-row"><span>Recorded so far</span><strong>' + FS.money(already, true) + '</strong></div>' +
        '<div class="money-row money-row--total"><span>Outstanding</span><strong>' + FS.money(outstanding, true) + '</strong></div>' +
        '<form id="mpForm" class="mt-6" novalidate>' +
          '<div class="field"><label class="label" for="mpAmount">Amount received ($) <span class="req">*</span></label>' +
            '<input class="input" id="mpAmount" name="amount" type="number" step="0.01" value="' + outstanding + '" required></div>' +
          '<div class="field"><label class="label" for="mpMethod">How was it paid?</label>' +
            '<select class="select" id="mpMethod" name="method">' +
              '<option>Cash</option><option>Check</option><option>Bank transfer / ACH</option>' +
              '<option>Card taken over the phone</option><option>Paid on a Stripe link</option><option>Other</option>' +
            '</select></div>' +
          '<div class="field"><label class="label" for="mpRef">Reference / note</label>' +
            '<input class="input" id="mpRef" name="note" placeholder="Check number, transfer reference…"></div>' +
        '</form>' +
        '<div class="alert alert--info mt-4">' + FS.icon('info') +
          '<div>The project is flagged Paid, the customer is notified, and the amount appears in Payments.</div></div>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-success" id="mpGo">' + FS.icon('check-circle') + 'Mark fully paid</button>',
      onMount: function (root, close) {
        root.querySelector('#mpGo').addEventListener('click', function () {
          var form = root.querySelector('#mpForm');
          if (!FS.validate(form)) return;
          var f = FS.formData(form);
          var amount = Number(f.amount) || 0;
          var who = (FS.shell && FS.shell.session) ? FS.shell.session.name : 'Admin';

          Store.addPayment({
            orderId: order.id, customerId: order.customerId, amount: amount,
            method: f.method + (f.note ? ' · ' + f.note : ''), type: 'charge', status: 'succeeded'
          });
          Store.updateOrder(order.id, {
            payment: 'paid',
            // Only a project that is finished in the yard moves to Completed.
            status: order.status === 'waiting-payment' ? 'completed' : order.status
          }, { who: who, text: 'Marked fully paid — ' + FS.money(amount, true) + ' by ' + f.method });

          Store.notify({
            channel: 'email', audience: 'customer', orderId: order.id,
            title: 'Payment received for ' + order.id,
            body: 'We have recorded ' + FS.money(amount, true) + ' against project ' + order.id +
                  ' (' + f.method + '). Your balance is now zero. Thank you.'
          });

          close();
          FS.toast('Project marked paid', order.id + ' · ' + FS.money(amount, true), 'ok');
          if (done) done();
        });
      }
    });
  };

  Dash.payoutModal = function (order, done) {
    var suggested = order.mechanicPayout || Math.round(order.laborTotal * 0.45);
    var mech = Store.mechanic(order.mechanicId);
    FS.modal({
      title: 'Record mechanic payment',
      subtitle: 'Project ' + order.id + (mech ? ' · ' + mech.name : ''),
      body:
        '<form id="poForm" novalidate>' +
          '<div class="field"><label class="label" for="poAmount">Payout amount ($) <span class="req">*</span></label>' +
            '<input class="input" id="poAmount" name="amount" type="number" value="' + suggested + '" required>' +
            '<p class="hint">Suggested: 45% of labour (' + FS.money(suggested) + ').</p></div>' +
          '<div class="field"><label class="label" for="poStatus">Status</label>' +
            '<select class="select" id="poStatus" name="status">' +
              '<option value="scheduled">Scheduled for next run</option>' +
              '<option value="paid">Paid now</option>' +
            '</select></div>' +
          '<div class="field"><label class="label" for="poNote">Note</label>' +
            '<input class="input" id="poNote" name="note" placeholder="Optional"></div>' +
        '</form>',
      footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
              '<button class="btn btn-primary" id="poGo">Record payout</button>',
      onMount: function (root, close) {
        root.querySelector('#poGo').addEventListener('click', function () {
          var form = root.querySelector('#poForm');
          if (!FS.validate(form)) return;
          var f = FS.formData(form);
          Store.addPayout({
            mechanicId: order.mechanicId, orderId: order.id,
            amount: Number(f.amount), status: f.status
          });
          Store.updateOrder(order.id, { mechanicPayout: Number(f.amount) },
            { who: FS.shell.session.name, text: 'Mechanic payout recorded: ' + FS.money(f.amount) });
          Store.notify({
            channel: 'email', audience: 'mechanic', orderId: order.id,
            title: 'Payout ' + (f.status === 'paid' ? 'issued' : 'scheduled'),
            body: 'Your payout of ' + FS.money(f.amount) + ' for project ' + order.id + ' is ' + f.status + '.'
          });
          close();
          FS.toast('Payout recorded', FS.money(f.amount), 'ok');
          if (done) done();
        });
      }
    });
  };

  /* ------------------------------------------------------------------------
     Notification inbox
     Shared by all four portals, so it lives here rather than in admin.js —
     the manager, customer and technician pages never load that file.
     ------------------------------------------------------------------------ */

  Dash.notificationsView = function (mount, audience, lead) {
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

      mount.querySelector('#markAll').addEventListener('click', function () {
        Store.markAllRead(audience);
        FS.toast('All caught up', '', 'ok');
        render();
      });
      FS.hydrateIcons(mount);
    }
  };

  /* ------------------------------------------------------------------------
     User directory
     Shared by the admin and manager portals. Tabs across the four account
     types, newest account at the top, and a row-level "impersonate" /
     "reset password" pair. Used by admin/users.html and manager/users.html.
     ------------------------------------------------------------------------ */

  var USER_TABS = [
    { key: 'all',      label: 'All Users' },
    { key: 'customer', label: 'Customers' },
    { key: 'mechanic', label: 'Mechanics' },
    { key: 'manager',  label: 'Managers' },
    { key: 'admin',    label: 'Admins' }
  ];

  var ROLE_HOME = {
    admin: 'admin/index.html', manager: 'manager/index.html',
    customer: 'customer/index.html', mechanic: 'mechanic/index.html'
  };

  Dash.usersView = function (mount, opts) {
    opts = opts || {};
    var actor = (FS.shell && FS.shell.session) ? FS.shell.session.name : 'Admin';
    var state = { tab: FS.param('type', 'all'), q: '' };

    render();

    function render() {
      var all = Store.directory();
      var list = state.tab === 'all' ? all : all.filter(function (p) { return p.role === state.tab; });

      if (state.q) {
        var q = state.q.toLowerCase();
        list = list.filter(function (p) {
          return [p.name, p.email, p.phone, p.city, p.state, p.company, p.type]
            .join(' ').toLowerCase().indexOf(q) > -1;
        });
      }

      mount.innerHTML =
        '<div class="page-head"><div><h2>Users</h2>' +
          '<p>' + list.length + ' account' + (list.length === 1 ? '' : 's') +
          ' — newest at the top. Open any portal as that user, or send them a password reset.</p></div></div>' +

        Dash.kpiGrid([
          { icon: 'briefcase', tone: 'navy', label: 'Customers', value: all.filter(byRole('customer')).length },
          { icon: 'wrench',    tone: 'ok',   label: 'Mechanics', value: all.filter(byRole('mechanic')).length },
          { icon: 'users',                   label: 'Managers',  value: all.filter(byRole('manager')).length },
          { icon: 'shield-badge',            label: 'Admins',    value: all.filter(byRole('admin')).length }
        ], 'kpi-grid--4') +

        '<div class="table-wrap">' +
          '<div class="toolbar"><div class="input-icon">' + FS.icon('search') +
            '<input class="input" id="userSearch" placeholder="Search name, email, phone or city…" ' +
            'value="' + FS.esc(state.q) + '"></div></div>' +
          '<div class="toolbar" style="padding-block:10px"><div class="filters">' +
            USER_TABS.map(function (t) {
              return '<button class="filter-pill' + (t.key === state.tab ? ' is-active' : '') +
                '" data-utab="' + t.key + '">' + t.label + '</button>';
            }).join('') +
          '</div></div>' +

          (list.length
            ? '<div class="scroll-x"><table class="table table--stack"><thead><tr>' +
                '<th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th>City / State</th>' +
                '<th>Joined</th><th class="td-actions">Actions</th></tr></thead><tbody>' +
              list.map(row).join('') +
              '</tbody></table></div>'
            : '<div class="table-empty">' + FS.icon('search') +
              '<p class="mt-3">No users match this filter.</p></div>') +
        '</div>';

      wire();
    }

    function byRole(r) { return function (p) { return p.role === r; }; }

    function row(p) {
      var tone = { customer: 'info', mechanic: 'ok', manager: 'warn', admin: 'neutral' }[p.role];
      return '<tr>' +
        '<td data-label="Name"><div class="row"><span class="avatar avatar--sm">' + FS.initials(p.name) + '</span>' +
          '<span style="min-width:0"><span class="td-strong" style="display:block">' + FS.esc(p.name) + '</span>' +
          '<small class="text-xs text-dim">' + FS.esc(p.company) + '</small></span></div></td>' +
        '<td data-label="Type"><span class="badge badge--' + tone + '">' + FS.esc(p.type) + '</span></td>' +
        '<td data-label="Email"><a class="text-blue" href="mailto:' + FS.esc(p.email) + '">' + FS.esc(p.email) + '</a></td>' +
        '<td data-label="Phone"><a href="tel:' + FS.esc(String(p.phone).replace(/[^\d+]/g, '')) + '">' + FS.esc(p.phone) + '</a></td>' +
        '<td data-label="City / State">' + FS.esc(p.city + ', ' + p.state) + '</td>' +
        '<td data-label="Joined">' + (p.since ? FS.date(p.since) : '—') + '</td>' +
        '<td class="td-actions" data-label="Actions">' +
          '<button class="btn btn-xs btn-outline" data-uview="' + FS.esc(p.key) + '">' + FS.icon('eye') + 'Details</button> ' +
          '<button class="btn btn-xs btn-outline" data-ureset="' + FS.esc(p.key) + '">' + FS.icon('lock') + 'Reset password</button> ' +
          (p.role === 'admin' ? '' :
            '<button class="btn btn-xs btn-dark" data-uimp="' + FS.esc(p.key) + '">' + FS.icon('user') + 'Impersonate</button>') +
        '</td>' +
      '</tr>';
    }

    function wire() {
      var search = mount.querySelector('#userSearch');
      var timer;
      search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          state.q = search.value;
          render();
          var again = mount.querySelector('#userSearch');
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }, 200);
      });

      FS.$$('[data-utab]', mount).forEach(function (b) {
        b.addEventListener('click', function () { state.tab = b.dataset.utab; render(); });
      });

      FS.$$('[data-uview]', mount).forEach(function (b) {
        b.addEventListener('click', function () { detailModal(Store.person(b.dataset.uview)); });
      });

      FS.$$('[data-ureset]', mount).forEach(function (b) {
        b.addEventListener('click', function () { resetModal(Store.person(b.dataset.ureset)); });
      });

      FS.$$('[data-uimp]', mount).forEach(function (b) {
        b.addEventListener('click', function () { impersonate(Store.person(b.dataset.uimp)); });
      });

      FS.hydrateIcons(mount);
    }

    /* --- Details ------------------------------------------------------- */
    function detailModal(p) {
      if (!p) return;
      var orders = p.role === 'customer' ? Store.ordersFor('customer', p.refId)
                 : p.role === 'mechanic' ? Store.ordersFor('mechanic', p.refId)
                 : p.role === 'manager'  ? Store.ordersFor('manager', p.refId)
                 : Store.orders();

      FS.modal({
        title: p.name,
        subtitle: p.type + ' · ' + p.company,
        size: 'lg',
        body:
          '<dl class="dl dl--2 mb-6">' +
            d('Email', p.email) + d('Phone', p.phone) +
            d('City', p.city) + d('State', p.state) +
            d('Account type', p.type) + d('Joined', p.since ? FS.date(p.since, 'long') : '—') +
            d('Portal username', p.email) + d('Reference ID', p.refId || '—') +
          '</dl>' +
          '<h4 class="mb-3">Projects (' + orders.length + ')</h4>' +
          (orders.length
            ? '<div class="scroll-x"><table class="table table--compact"><tbody>' +
              orders.slice(0, 8).map(function (o) {
                return '<tr><td class="td-strong">' + FS.esc(o.id) + '</td>' +
                  '<td>' + FS.esc(o.serviceType) + '</td>' +
                  '<td>' + Dash.statusBadge(o.status) + '</td>' +
                  '<td class="text-right td-strong">' + FS.money(Store.orderTotal(o)) + '</td></tr>';
              }).join('') + '</tbody></table></div>'
            : '<p class="text-dim">No projects yet.</p>'),
        footer: '<button class="btn btn-outline" data-close>Close</button>' +
          '<button class="btn btn-outline" id="udReset">' + FS.icon('lock') + 'Reset password</button>' +
          (p.role === 'admin' ? '' : '<button class="btn btn-primary" id="udImp">' + FS.icon('user') + 'Impersonate</button>'),
        onMount: function (root, close) {
          root.querySelector('#udReset').addEventListener('click', function () { close(); resetModal(p); });
          var imp = root.querySelector('#udImp');
          if (imp) imp.addEventListener('click', function () { close(); impersonate(p); });
        }
      });

      function d(k, v) { return '<div><dt>' + FS.esc(k) + '</dt><dd>' + FS.esc(v == null ? '—' : v) + '</dd></div>'; }
    }

    /* --- Password reset ------------------------------------------------ */
    function resetModal(p) {
      if (!p) return;
      FS.confirm('Reset password for ' + p.name + '?',
        'A new temporary password is generated and emailed to ' + p.email +
        '. Their current password stops working straight away.',
        function () {
          var out = Store.resetPassword(p.key, actor);
          FS.modal({
            title: 'Password reset sent',
            subtitle: p.name + ' · ' + p.email,
            body:
              '<div class="creds mb-5">' +
                '<div class="creds-row"><small>Portal</small><code>fleetsquad.com/login</code></div>' +
                '<div class="creds-row"><small>Username</small><code>' + FS.esc(p.email) + '</code></div>' +
                '<div class="creds-row"><small>Temporary password</small><code>' + FS.esc(out.password) + '</code></div>' +
              '</div>' +
              '<div class="msg-preview">' +
                '<div class="msg-preview-head">' + FS.icon('mail') + 'Email sent to ' + FS.esc(p.email) + '</div>' +
                '<div class="msg-preview-body">Subject: Reset your FleetSquad password\n\n' +
                'Hi ' + FS.esc(p.name) + ',\n' + FS.esc(actor) + ' at FleetSquad reset your password.\n' +
                'Sign in at fleetsquad.com/login with:\n' +
                'Username: ' + FS.esc(p.email) + '\n' +
                'Temporary password: ' + FS.esc(out.password) + '\n\n' +
                'You will be asked to choose a new password on first sign-in.</div>' +
              '</div>' +
              '<p class="hint mt-4">The password is shown here so you can read it back if the email bounces. ' +
              'It also appears in the ' + FS.esc(p.type.toLowerCase()) + ' notification inbox.</p>',
            footer: '<button class="btn btn-primary" data-close>Done</button>'
          });
          FS.toast('Password reset', p.email + ' notified.', 'ok');
          render();
        });
    }

    /* --- Impersonation -------------------------------------------------- */
    function impersonate(p) {
      if (!p) return;
      FS.confirm('Open the portal as ' + p.name + '?',
        'You will see exactly what this ' + p.type.toLowerCase() + ' sees. ' +
        'A banner stays on screen until you switch back to your own account.',
        function () {
          Store.impersonate(p.key);
          window.location.href = FS.url(ROLE_HOME[p.role]);
        });
    }
  };

  /* Small string hash used to fabricate stable-looking payment link ids. */
  function hash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return h;
  }

  /* ------------------------------------------------------------------------
     Filter helpers shared by the list screens
     ------------------------------------------------------------------------ */

  Dash.filterBar = function (active, extra) {
    var items = [['all', 'All']].concat(Object.keys(D.statusMeta).map(function (k) {
      return [k, D.statusMeta[k].label];
    }));
    return '<div class="filters">' + items.map(function (i) {
      return '<button class="filter-pill' + (i[0] === active ? ' is-active' : '') +
        '" data-filter="' + i[0] + '">' + FS.esc(i[1]) + '</button>';
    }).join('') + (extra || '') + '</div>';
  };

  Dash.searchOrders = function (orders, q) {
    if (!q) return orders;
    q = q.toLowerCase();
    return orders.filter(function (o) {
      var c = Store.customer(o.customerId);
      var m = Store.mechanic(o.mechanicId);
      return [o.id, o.serviceType, o.city, o.state, o.status,
              c ? c.company : '', c ? c.firstName + ' ' + c.lastName : '', m ? m.name : '']
        .join(' ').toLowerCase().indexOf(q) > -1;
    });
  };
})(window, document);
