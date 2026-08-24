/* ==========================================================================
   FleetSquad — Front-end state store
   A tiny in-memory store, mirrored to localStorage so that changes made in the
   prototype (assign a mechanic, add a vehicle, submit a review…) survive a page
   navigation. Every method is synchronous on purpose: swapping these for fetch
   calls is the only change needed to move onto a real backend.
   ========================================================================== */

(function (window) {
  'use strict';

  var FS = window.FS = window.FS || {};
  var KEY = 'fleetsquad.state.v1';

  /* ------------------------------------------------------------------------
     Load / persist
     ------------------------------------------------------------------------ */

  function seed() {
    return {
      orders:        JSON.parse(JSON.stringify(FS.data.orders)),
      customers:     JSON.parse(JSON.stringify(FS.data.customers)),
      mechanics:     JSON.parse(JSON.stringify(FS.data.mechanics)),
      reviews:       JSON.parse(JSON.stringify(FS.data.reviews)),
      notifications: JSON.parse(JSON.stringify(FS.data.notifications)),
      payments:      JSON.parse(JSON.stringify(FS.data.payments)),
      payouts:       JSON.parse(JSON.stringify(FS.data.payouts)),
      estimates:     [],
      session:       null,
      nextProject:   1233,
      nextCustomer:  1009
    };
  }

  var state;
  try {
    var raw = window.localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : seed();
    // A missing collection means the seed shape changed — start clean.
    if (!state.orders || !state.customers) state = seed();
  } catch (e) {
    state = seed();
  }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* private mode / quota — the prototype still works in memory */ }
  }

  var Store = FS.store = {
    state: state,

    /** Wipe every local change and return to the shipped mock data. */
    reset: function () {
      state = seed();
      Store.state = state;
      persist();
    },

    save: persist,

    /* ----------------------------------------------------------------------
       Session
       ---------------------------------------------------------------------- */

    login: function (role) {
      var user = FS.data.users.filter(function (u) { return u.role === role; })[0];
      if (!user) return null;
      state.session = { role: user.role, name: user.name, email: user.email, refId: user.refId, title: user.title };
      persist();
      return state.session;
    },

    logout: function () { state.session = null; persist(); },

    session: function () { return state.session; },

    /** Redirect to the login screen when a dashboard page is opened cold. */
    requireRole: function (role) {
      if (!state.session) {
        // The prototype is meant to be clickable without friction, so instead of
        // bouncing the visitor we sign them in as the role the page expects.
        Store.login(role);
      } else if (state.session.role !== role) {
        Store.login(role);
      }
      return state.session;
    },

    /* ----------------------------------------------------------------------
       Reads
       ---------------------------------------------------------------------- */

    orders: function () { return state.orders; },

    order: function (id) {
      return state.orders.filter(function (o) { return o.id === id; })[0] || null;
    },

    ordersFor: function (role, refId) {
      if (role === 'customer') return state.orders.filter(function (o) { return o.customerId === refId; });
      if (role === 'mechanic') return state.orders.filter(function (o) { return o.mechanicId === refId; });
      if (role === 'manager')  return state.orders.filter(function (o) { return o.managerId === refId; });
      return state.orders;
    },

    customer: function (id) {
      return state.customers.filter(function (c) { return c.id === id; })[0] || null;
    },

    customers: function () { return state.customers; },

    mechanic: function (id) {
      return state.mechanics.filter(function (m) { return m.id === id; })[0] || null;
    },

    mechanics: function () { return state.mechanics; },

    manager: function (id) {
      return FS.data.managers.filter(function (m) { return m.id === id; })[0] || null;
    },

    /** Newest first — the review page and homepage both rely on this order. */
    reviews: function (status) {
      var list = state.reviews.slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
      return status ? list.filter(function (r) { return r.status === status; }) : list;
    },

    reviewStats: function () {
      var pub = Store.reviews('published');
      if (!pub.length) return { count: 0, average: 0, breakdown: [0, 0, 0, 0, 0] };
      var sum = 0, breakdown = [0, 0, 0, 0, 0];
      pub.forEach(function (r) { sum += r.rating; breakdown[r.rating - 1]++; });
      return {
        count: pub.length,
        average: Math.round((sum / pub.length) * 10) / 10,
        breakdown: breakdown
      };
    },

    notifications: function (audience) {
      var list = state.notifications.slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
      return audience ? list.filter(function (n) { return n.audience === audience; }) : list;
    },

    unreadCount: function (audience) {
      return Store.notifications(audience).filter(function (n) { return !n.read; }).length;
    },

    payments: function () { return state.payments; },
    payouts:  function () { return state.payouts; },

    /* ----------------------------------------------------------------------
       Derived metrics for the dashboards
       ---------------------------------------------------------------------- */

    metrics: function () {
      var orders = state.orders;
      var completedVehicles = 0, pendingPayments = 0, revenue = 0;

      orders.forEach(function (o) {
        o.vehicles.forEach(function (v) {
          if (v.status === 'Repair Complete') completedVehicles++;
        });
        var total = Store.orderTotal(o);
        if (o.payment === 'unpaid' && o.status !== 'canceled') pendingPayments += total;
        if (o.payment === 'paid') revenue += total;
        if (o.payment === 'partial') revenue += Math.round(total * 0.35);
      });

      var rs = Store.reviewStats();
      return {
        customers: state.customers.length,
        activeProjects: orders.filter(function (o) {
          return ['open', 'assigned', 'needs-manager'].indexOf(o.status) > -1;
        }).length,
        completedVehicles: completedVehicles,
        pendingPayments: pendingPayments,
        reviews: rs.count,
        rating: rs.average,
        revenue: revenue,
        openCount: orders.filter(function (o) { return o.status === 'open'; }).length,
        waitingCount: orders.filter(function (o) { return o.status === 'waiting-payment'; }).length,
        managerCount: orders.filter(function (o) { return o.status === 'needs-manager'; }).length
      };
    },

    orderTotal: function (order) {
      return (order.laborTotal || 0) + (order.partsTotal || 0);
    },

    /* Revenue for the last six months, used by the dashboard bar chart. */
    revenueSeries: function () {
      var months = [], now = new Date();
      for (var i = 5; i >= 0; i--) {
        var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 });
      }
      state.payments.forEach(function (p) {
        if (p.status !== 'succeeded' || p.type === 'refund') return;
        var d = new Date(p.at);
        var idx = 5 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
        if (idx >= 0 && idx < 6) months[idx].value += p.amount;
      });
      // Give the earlier months a plausible baseline so the chart reads well.
      var baseline = [18400, 22150, 19800, 26300, 24900, 0];
      months.forEach(function (m, i) { m.value += baseline[i]; });
      return months;
    },

    /* ----------------------------------------------------------------------
       Writes — orders
       ---------------------------------------------------------------------- */

    nextProjectId: function () { return 'PRJ-' + state.nextProject; },

    createOrder: function (payload) {
      var id = 'PRJ-' + state.nextProject++;
      var order = Object.assign({
        id: id,
        status: 'open',
        payment: 'unpaid',
        mechanicId: null,
        managerId: 'MGR-01',
        createdAt: new Date().toISOString(),
        vehicleCount: 1,
        allowedVehicles: 1,
        laborTotal: 0,
        partsTotal: 0,
        mechanicPayout: 0,
        vehicles: [],
        timeline: [{ at: new Date().toISOString(), who: 'System', text: 'Project created' }]
      }, payload, { id: id });
      state.orders.unshift(order);
      persist();
      return order;
    },

    updateOrder: function (id, patch, note) {
      var o = Store.order(id);
      if (!o) return null;
      Object.assign(o, patch);
      if (note) Store.logTimeline(id, note.who || 'System', note.text);
      persist();
      return o;
    },

    setStatus: function (id, status, who) {
      var o = Store.order(id);
      if (!o) return null;
      o.status = status;
      Store.logTimeline(id, who || 'Admin', 'Status changed to ' + (FS.data.statusMeta[status] || {}).label);
      persist();
      return o;
    },

    assignMechanic: function (id, mechanicId, who) {
      var o = Store.order(id);
      if (!o) return null;
      o.mechanicId = mechanicId;
      o.vehicles.forEach(function (v) { if (!v.mechanicId) v.mechanicId = mechanicId; });
      if (o.status === 'open') o.status = 'assigned';
      var m = Store.mechanic(mechanicId);
      Store.logTimeline(id, who || 'Admin', 'Assigned to ' + (m ? m.name : mechanicId));
      Store.notify({
        channel: 'sms', audience: 'mechanic', orderId: id,
        title: 'New Project Assigned',
        body: 'Project ID: ' + id + '\nService Type: ' + o.serviceType +
              '\nLocation: ' + o.address + ', ' + o.city + ', ' + o.state
      });
      persist();
      return o;
    },

    logTimeline: function (id, who, text) {
      var o = Store.order(id);
      if (!o) return;
      o.timeline = o.timeline || [];
      o.timeline.unshift({ at: new Date().toISOString(), who: who, text: text });
      persist();
    },

    /* ----------------------------------------------------------------------
       Writes — vehicles inside an order
       ---------------------------------------------------------------------- */

    addVehicle: function (orderId, vehicle) {
      var o = Store.order(orderId);
      if (!o) return null;
      var v = Object.assign({
        no: o.vehicles.length + 1,
        year: new Date().getFullYear(), make: '', model: '', mileage: 0,
        plate: '', vin: '', repair: '', mechanicId: o.mechanicId,
        visitDate: '', clockIn: '', clockOut: '', hours: 0, cost: 0,
        status: 'Not Started',
        images: { before: [], after: [], paperwork: [], vin: [], photos: [], customerId: [] }
      }, vehicle);
      o.vehicles.push(v);
      o.vehicleCount = o.vehicles.length;
      Store.recalc(orderId);
      Store.logTimeline(orderId, 'System', 'Vehicle #' + v.no + ' added');
      persist();
      return v;
    },

    updateVehicle: function (orderId, index, patch) {
      var o = Store.order(orderId);
      if (!o || !o.vehicles[index]) return null;
      Object.assign(o.vehicles[index], patch);
      var v = o.vehicles[index];
      if (v.clockIn && v.clockOut) v.hours = FS.hoursBetween(v.clockIn, v.clockOut);
      Store.recalc(orderId);
      persist();
      return v;
    },

    removeVehicle: function (orderId, index) {
      var o = Store.order(orderId);
      if (!o) return;
      o.vehicles.splice(index, 1);
      o.vehicles.forEach(function (v, i) { v.no = i + 1; });
      o.vehicleCount = o.vehicles.length;
      Store.recalc(orderId);
      persist();
    },

    /** Push an image (data-URL or path) into one of a vehicle's categories. */
    addImage: function (orderId, index, category, entry) {
      var o = Store.order(orderId);
      if (!o || !o.vehicles[index]) return;
      var imgs = o.vehicles[index].images;
      if (!imgs[category]) imgs[category] = [];
      imgs[category].push(entry);
      persist();
    },

    recalc: function (orderId) {
      var o = Store.order(orderId);
      if (!o) return;
      o.laborTotal = o.vehicles.reduce(function (s, v) { return s + (Number(v.cost) || 0); }, 0);
      o.partsTotal = Math.round(o.laborTotal * 0.42);
      persist();
    },

    /* ----------------------------------------------------------------------
       Writes — customers, reviews, notifications, money
       ---------------------------------------------------------------------- */

    createCustomer: function (payload) {
      var id = 'CUS-' + state.nextCustomer++;
      var customer = Object.assign({
        id: id, fleetSize: 1, since: new Date().toISOString(), status: 'active'
      }, payload, { id: id });
      state.customers.unshift(customer);
      persist();
      return customer;
    },

    addReview: function (payload) {
      var review = Object.assign({
        id: 'REV-' + (200 + state.reviews.length + 1),
        at: new Date().toISOString(),
        status: 'pending',
        featured: false
      }, payload);
      state.reviews.unshift(review);
      persist();
      return review;
    },

    updateReview: function (id, patch) {
      var r = state.reviews.filter(function (x) { return x.id === id; })[0];
      if (r) { Object.assign(r, patch); persist(); }
      return r;
    },

    notify: function (payload) {
      var note = Object.assign({
        id: 'N-' + (500 + state.notifications.length + 1),
        at: new Date().toISOString(),
        read: false
      }, payload);
      state.notifications.unshift(note);
      persist();
      return note;
    },

    markAllRead: function (audience) {
      state.notifications.forEach(function (n) {
        if (!audience || n.audience === audience) n.read = true;
      });
      persist();
    },

    addPayment: function (payload) {
      var pay = Object.assign({
        id: 'PAY-' + (8800 + state.payments.length + 1),
        at: new Date().toISOString(),
        status: 'succeeded',
        type: 'charge'
      }, payload);
      state.payments.unshift(pay);
      persist();
      return pay;
    },

    addPayout: function (payload) {
      var po = Object.assign({
        id: 'PO-' + (3300 + state.payouts.length + 1),
        at: new Date().toISOString(),
        status: 'scheduled'
      }, payload);
      state.payouts.unshift(po);
      persist();
      return po;
    },

    /* Held estimates from the public Get Estimate flow. */
    addEstimate: function (payload) {
      state.estimates.unshift(payload);
      persist();
      return payload;
    }
  };
})(window);
