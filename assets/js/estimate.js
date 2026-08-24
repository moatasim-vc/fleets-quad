/* ==========================================================================
   FleetSquad — Get Estimate multi-step flow
   Step 1 customer info (zip auto-populates city/state)
   Step 2 vehicle info (simulated address autocomplete + up to 5 photos)
   Step 3 confirmation with a generated Project ID
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var Store = FS.store;

  var form = document.getElementById('estForm');
  if (!form) return;

  var steps = FS.$$('.est-step', form);
  var dots = FS.$$('.step', document.getElementById('estStepper'));
  var uploader;

  /* ------------------------------------------------------------------------
     Populate the selects from the mock data
     ------------------------------------------------------------------------ */
  function fillSelects() {
    var svc = document.getElementById('serviceType');
    D.serviceTypes.forEach(function (t) {
      svc.appendChild(FS.el('option', { value: t }, t));
    });

    var urg = document.getElementById('urgency');
    D.urgencies.forEach(function (u) {
      urg.appendChild(FS.el('option', { value: u }, u));
    });

    var loc = document.getElementById('location');
    D.locations.forEach(function (l) {
      loc.appendChild(FS.el('option', { value: l }, l));
    });

    /* 1 – 1000. Listing a thousand <option> elements is slow and unusable, so
       the range is grouped: every value 1-20, then sensible steps up to 1000. */
    var count = document.getElementById('vehicleCount');
    count.appendChild(FS.el('option', { value: '' }, 'How many vehicles?'));
    var values = [];
    for (var i = 1; i <= 20; i++) values.push(i);
    for (var j = 25; j <= 100; j += 5) values.push(j);
    for (var k = 125; k <= 500; k += 25) values.push(k);
    for (var m = 550; m <= 1000; m += 50) values.push(m);
    values.forEach(function (v) {
      count.appendChild(FS.el('option', { value: v }, String(v)));
    });
  }

  /* ------------------------------------------------------------------------
     Zip -> city / state
     ------------------------------------------------------------------------ */
  function wireZip() {
    var zip = document.getElementById('zip');
    var city = document.getElementById('city');
    var state = document.getElementById('state');
    var hint = document.getElementById('zipHint');

    zip.addEventListener('input', function () {
      var v = zip.value.replace(/\D/g, '').slice(0, 5);
      zip.value = v;
      if (v.length < 5) {
        city.value = ''; state.value = '';
        hint.className = 'hint';
        hint.textContent = 'City and state fill in automatically.';
        return;
      }
      // Simulate the round-trip a real postal lookup would make.
      hint.className = 'hint';
      hint.textContent = 'Looking up…';
      setTimeout(function () {
        var hit = D.zipLookup[v];
        if (!hit) {
          var keys = Object.keys(D.zipLookup);
          hit = D.zipLookup[keys[Number(v) % keys.length]];
        }
        city.value = hit.city;
        state.value = hit.state;
        hint.className = 'hint text-ok text-semi';
        hint.textContent = 'Matched ' + hit.city + ', ' + hit.state + '.';
      }, 420);
    });
  }

  /* ------------------------------------------------------------------------
     Address autocomplete (simulated Google Places)
     ------------------------------------------------------------------------ */
  function wireAddress() {
    var input = document.getElementById('address');
    var list = document.getElementById('addressList');
    var cursor = -1;
    var STREETS = ['Industrial Blvd', 'Commerce Way', 'Logistics Park Dr', 'Terminal Rd',
                   'Distribution Center', 'Freight St', 'Depot Ave', 'Yard 4 Access Rd'];

    function suggestions(q) {
      var city = document.getElementById('city').value || 'New York';
      var state = document.getElementById('state').value || 'NY';
      var zip = document.getElementById('zip').value || '10001';
      var num = (q.match(/^\d+/) || ['4' + (q.length * 7 % 90 + 10)])[0];
      return STREETS.slice(0, 5).map(function (s, i) {
        return {
          line1: num + (i * 20) + ' ' + s,
          line2: city + ', ' + state + ' ' + zip
        };
      });
    }

    function render(items) {
      cursor = -1;
      list.innerHTML = items.map(function (s, i) {
        return '<button type="button" role="option" data-i="' + i + '">' +
          FS.icon('map-pin') +
          '<span><strong>' + FS.esc(s.line1) + '</strong><small>' + FS.esc(s.line2) + '</small></span>' +
        '</button>';
      }).join('') + '<div class="autocomplete-foot">Address suggestions (simulated)</div>';
      list.classList.add('is-open');
      list._items = items;
    }

    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (q.length < 3) { list.classList.remove('is-open'); return; }
      render(suggestions(q));
    });

    input.addEventListener('keydown', function (e) {
      var opts = FS.$$('button', list);
      if (!list.classList.contains('is-open') || !opts.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        cursor = e.key === 'ArrowDown'
          ? Math.min(cursor + 1, opts.length - 1)
          : Math.max(cursor - 1, 0);
        opts.forEach(function (o, i) { o.classList.toggle('is-cursor', i === cursor); });
      } else if (e.key === 'Enter' && cursor > -1) {
        e.preventDefault();
        opts[cursor].click();
      } else if (e.key === 'Escape') {
        list.classList.remove('is-open');
      }
    });

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-i]');
      if (!btn) return;
      var pick = list._items[Number(btn.dataset.i)];
      input.value = pick.line1 + ', ' + pick.line2;
      list.classList.remove('is-open');
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#addressAC')) list.classList.remove('is-open');
    });
  }

  /* ------------------------------------------------------------------------
     Step navigation
     ------------------------------------------------------------------------ */
  function goto(n) {
    steps.forEach(function (s) { s.classList.toggle('is-active', Number(s.dataset.step) === n); });
    dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i + 1 === n);
      d.classList.toggle('is-done', i + 1 < n);
      if (i + 1 < n) d.querySelector('.step-dot').innerHTML = FS.icon('check');
      else d.querySelector('.step-dot').textContent = String(i + 1);
    });
    window.scrollTo({ top: Math.max(0, form.getBoundingClientRect().top + window.scrollY - 120), behavior: 'smooth' });
  }

  form.addEventListener('click', function (e) {
    var next = e.target.closest('[data-next]');
    if (next) {
      var current = next.closest('.est-step');
      if (!FS.validate(current)) return;
      goto(Number(next.dataset.next));
      return;
    }
    var back = e.target.closest('[data-back]');
    if (back) goto(Number(back.dataset.back));
  });

  /* ------------------------------------------------------------------------
     Submit — create the project and show the confirmation
     ------------------------------------------------------------------------ */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var step2 = form.querySelector('[data-step="2"]');
    if (!FS.validate(step2)) return;

    var f = FS.formData(form);
    var count = Number(f.vehicleCount) || 1;

    // Create (or reuse) the customer record, then the project.
    var customer = Store.createCustomer({
      company: f.company,
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email,
      phone: f.phone,
      city: f.city,
      state: f.state,
      zip: f.zip,
      fleetSize: count
    });

    var order = Store.createOrder({
      customerId: customer.id,
      serviceType: f.serviceType,
      urgency: f.urgency,
      vehicleCount: count,
      allowedVehicles: count,
      address: f.address,
      city: f.city,
      state: f.state,
      zip: f.zip,
      location: f.location,
      details: f.details,
      photos: (uploader ? uploader.files.length : 0)
    });

    // Simulated outbound notifications, visible in the admin notification centre.
    Store.notify({
      channel: 'sms', audience: 'admin', orderId: order.id,
      title: 'New Project #' + order.id,
      body: 'Service Type: ' + f.serviceType +
            '\nVehicles: ' + count +
            '\nDetails: ' + String(f.details).slice(0, 90) +
            '\nCity: ' + f.city + ', ' + f.state
    });
    Store.notify({
      channel: 'email', audience: 'customer', orderId: order.id,
      title: 'We received your request',
      body: 'Thanks ' + f.firstName + ' — your project ' + order.id + ' is in the queue. ' +
            'A FleetSquad coordinator will confirm your technician and visit window shortly.'
    });

    renderDone(order, customer, f);
    goto(3);
    FS.toast('Request submitted', 'Project ' + order.id + ' created.', 'ok');
  });

  /* ------------------------------------------------------------------------
     Confirmation panel
     ------------------------------------------------------------------------ */
  function renderDone(order, customer, f) {
    var host = document.getElementById('estDone');
    host.innerHTML =
      '<div class="success-hero">' +
        '<div class="success-mark">' + FS.icon('check') + '</div>' +
        '<h2>Request received</h2>' +
        '<p class="text-muted" style="max-width:46ch;margin:10px auto 0">' +
          'A FleetSquad coordinator is reviewing your project now. You will get an SMS and an email ' +
          'as soon as a technician is assigned.' +
        '</p>' +
        '<div class="mt-6"><span class="ref-badge"><small>Project ID</small><strong>' + FS.esc(order.id) + '</strong></span></div>' +
      '</div>' +

      '<div class="card mt-6"><div class="card-head"><h4>Your request</h4>' +
        '<span class="badge badge--open">Open</span></div>' +
        '<div class="card-body">' +
          '<dl class="dl dl--2">' +
            row('Contact', f.firstName + ' ' + f.lastName) +
            row('Company', f.company) +
            row('Cell Phone', f.phone) +
            row('Email', f.email) +
            row('Service Type', f.serviceType) +
            row('Urgency', f.urgency) +
            row('Number of Vehicles', f.vehicleCount) +
            row('Vehicle Location', f.location) +
            row('Address', f.address) +
            row('City / State / Zip', f.city + ', ' + f.state + ' ' + f.zip) +
          '</dl>' +
          '<div class="divider"></div>' +
          '<dt class="text-xs uppercase text-muted text-bold mb-2">Project Details</dt>' +
          '<p class="text-muted">' + FS.esc(f.details) + '</p>' +
          (order.photos ? '<p class="hint mt-3">' + order.photos + ' photo(s) attached.</p>' : '') +
        '</div>' +
      '</div>' +

      '<div class="alert alert--info mt-5">' + FS.icon('info') +
        '<div><strong>What happens next</strong><br>' +
        'We confirm scope and pricing, assign an ASE Master Tech, and text you the visit window. ' +
        'Nothing is charged until you approve the estimate.</div>' +
      '</div>' +

      '<div class="row row-wrap mt-6" style="gap:var(--sp-3)">' +
        '<a class="btn btn-primary" href="' + FS.url('login.html?role=customer') + '">Track in your portal' + FS.icon('arrow-right') + '</a>' +
        '<a class="btn btn-outline" href="' + FS.url('index.html') + '">Back to home</a>' +
      '</div>';

    FS.hydrateIcons(host);
  }

  function row(label, value) {
    return '<div><dt>' + FS.esc(label) + '</dt><dd>' + FS.esc(value || '—') + '</dd></div>';
  }

  /* ------------------------------------------------------------------------ */
  function init() {
    fillSelects();
    wireZip();
    wireAddress();
    uploader = FS.uploader({
      zone: document.getElementById('estUpload'),
      input: document.getElementById('estFile'),
      list: document.getElementById('estThumbs'),
      max: 5
    });
    FS.hydrateIcons(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
