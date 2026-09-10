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
  var KEY = 'fleetsquad.state.v2';

  /* ------------------------------------------------------------------------
     Load / persist
     ------------------------------------------------------------------------ */

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function seed() {
    /* Credentials live beside the people records so an admin password reset
       has something real to change. Everything is local to this browser. */
    var credentials = {};
    FS.data.users.forEach(function (u) { credentials[u.email.toLowerCase()] = u.password; });
    FS.data.customers.forEach(function (c) { credentials[c.email.toLowerCase()] = 'demo1234'; });
    FS.data.mechanics.forEach(function (m) { credentials[m.email.toLowerCase()] = 'demo1234'; });
    FS.data.managers.forEach(function (m) { credentials[m.email.toLowerCase()] = 'demo1234'; });

    return {
      orders:        clone(FS.data.orders),
      // The sign-in accounts live in the state too, so an admin can edit their
      // own record the same way as everybody else's.
      users:         clone(FS.data.users),
      customers:     clone(FS.data.customers),
      mechanics:     clone(FS.data.mechanics),
      managers:      clone(FS.data.managers),
      reviews:       clone(FS.data.reviews),
      notifications: clone(FS.data.notifications),
      payments:      clone(FS.data.payments),
      payouts:       clone(FS.data.payouts),
      posts:         clone(FS.data.posts),
      serviceAreas:  clone(FS.data.serviceAreas),
      cmsPages:      clone(FS.data.cmsPages),
      partners:      clone(FS.data.partners),
      services:      clone(FS.data.services),
      industries:    clone(FS.data.industries),
      vehicleTypes:  clone(FS.data.vehicleTypes),
      faqs:          clone(FS.data.faqs),
      inbox:         clone(FS.data.inbox),
      jobs:          clone(FS.data.jobs),
      applications:  clone(FS.data.applications),
      credentials:   credentials,
      settings:      { stripe: {}, stripeMode: 'test', stripeConnected: false },
      estimates:     [],
      session:       null,
      impersonator:  null,
      nextProject:   1233,
      nextCustomer:  1009,
      nextMessage:   1005,
      nextJob:       8,
      nextApplication: 2005,
      seedVersion:   SEED_VERSION
    };
  }

  /* Bumped when the shipped data changes in a way a saved state must pick up.
     Anything not listed in migrate() below is left exactly as the user left
     it — this is deliberately narrow, not a reset. */
  var SEED_VERSION = 5;

  /**
   * Fold new shipped data into a state that was saved by an earlier build.
   * @param {object} saved what is in localStorage
   * @param {object} fresh what this build ships
   * @param {number|undefined} was the version the state was saved at. Passed in
   *   rather than read off `saved`, because the fill-in-missing-keys pass runs
   *   first and would already have copied the current version onto it.
   */
  function migrate(saved, fresh, was) {
    if (was === SEED_VERSION) return;

    // v2: the client supplied their SEO sheet. Take the meta record for every
    // CMS page from it, but leave headings, body copy and status alone — those
    // are the admin's, the meta is the sheet's. Only for a state that predates
    // the sheet; re-running it later would undo the admin's own meta edits.
    if (!(was >= 2)) {
      fresh.cmsPages.forEach(function (f) {
        var mine = saved.cmsPages.filter(function (p) { return p.slug === f.slug; })[0];
        if (!mine) { saved.cmsPages.push(f); return; }
        mine.metaTitle = f.metaTitle;
        mine.metaDescription = f.metaDescription;
        mine.keywords = f.keywords;
        mine.path = f.path;
      });
    }

    // v3: the homepage joined the CMS page list so its meta record is editable
    // too. Add any page this build ships that the saved state has never seen;
    // a page already there keeps whatever the admin made of it.
    fresh.cmsPages.forEach(function (f) {
      var mine = saved.cmsPages.filter(function (p) { return p.slug === f.slug; })[0];
      if (!mine) saved.cmsPages.push(f);
    });

    // v5: Contact ships the real Google listing instead of the New York
    // placeholder it was built against, and Service Areas now draws the same
    // record beside its area check.
    //
    // v4 tried this but only matched a record still reading exactly
    // 'New York, NY', so a state whose map was blank — saved before the fields
    // existed, or cleared since — was skipped and then stamped v4, which put it
    // permanently out of reach. Hence the re-run at v5 and the wider test: a
    // record counts as untouched when no embed is set and the address is either
    // blank or that placeholder. Anything the admin actually typed is theirs and
    // is left exactly as it is.
    if (!(was >= 5)) {
      var freshContact = fresh.cmsPages.filter(function (p) { return p.slug === 'contact'; })[0];
      var myContact = saved.cmsPages.filter(function (p) { return p.slug === 'contact'; })[0];
      var myAddr = String((myContact && myContact.mapAddress) || '').trim();
      if (freshContact && myContact &&
          !String(myContact.mapEmbed || '').trim() &&
          (!myAddr || myAddr === 'New York, NY')) {
        myContact.mapAddress = freshContact.mapAddress;
        myContact.mapEmbed = freshContact.mapEmbed;
        myContact.mapLabel = myContact.mapLabel || freshContact.mapLabel;
      }
    }

    saved.seedVersion = SEED_VERSION;
  }

  var state;
  try {
    var raw = window.localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : seed();
    // The core collections missing means the saved shape is unusable — start
    // clean. A *newly added* collection is filled in from the seed instead, so
    // a demo that has already been edited keeps the edits.
    if (!state.orders || !state.customers || !state.posts || !state.serviceAreas) {
      state = seed();
    } else {
      var fresh = seed();
      var savedVersion = state.seedVersion;
      Object.keys(fresh).forEach(function (k) {
        if (state[k] === undefined) state[k] = fresh[k];
      });
      migrate(state, fresh, savedVersion);
    }
  } catch (e) {
    state = seed();
  }

  /**
   * Mirror the state to disk.
   * @returns {boolean} false when the browser refused it — a full quota or a
   *   private window. The caller can then tell the user rather than letting an
   *   apparently successful save vanish on the next page load.
   */
  function persist() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false; /* private mode / quota — the prototype still works in memory */
    }
  }

  var Store = FS.store = {
    state: state,

    /* Set by every write that can plausibly be refused for size. */
    lastWriteOk: true,

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
      var user = Store.users().filter(function (u) { return u.role === role; })[0];
      if (!user) return null;
      state.session = { role: user.role, name: user.name, email: user.email, refId: user.refId, title: user.title };
      state.impersonator = null;
      persist();
      return state.session;
    },

    /**
     * Sign in with an email + password pair. Any account in the directory
     * works, so an admin can hand a customer or a technician their own login.
     * @returns {{ok:boolean, session?:object, error?:string}}
     */
    authenticate: function (email, password) {
      email = String(email || '').trim().toLowerCase();
      if (!email) return { ok: false, error: 'Enter your email address.' };

      var stored = state.credentials[email];
      if (stored == null) return { ok: false, error: 'We do not recognise that email address.' };
      if (password !== stored) return { ok: false, error: 'That password is not correct.' };

      var person = Store.directory().filter(function (p) { return p.email.toLowerCase() === email; })[0];
      if (!person) return { ok: false, error: 'That account has no portal access yet.' };

      state.session = {
        role: person.role, name: person.name, email: person.email,
        refId: person.refId, title: person.title
      };
      state.impersonator = null;
      persist();
      return { ok: true, session: state.session };
    },

    logout: function () { state.session = null; state.impersonator = null; persist(); },

    session: function () { return state.session; },

    /* ----------------------------------------------------------------------
       Impersonation — an admin or manager opens the portal as another user.
       The original session is parked so it can be restored in one click.
       ---------------------------------------------------------------------- */

    impersonate: function (personKey) {
      var person = Store.directory().filter(function (p) { return p.key === personKey; })[0];
      if (!person) return null;
      if (!state.impersonator && state.session) state.impersonator = state.session;
      state.session = {
        role: person.role, name: person.name, email: person.email,
        refId: person.refId, title: person.title
      };
      persist();
      return state.session;
    },

    isImpersonating: function () { return !!state.impersonator; },

    impersonator: function () { return state.impersonator; },

    stopImpersonating: function () {
      if (!state.impersonator) return null;
      state.session = state.impersonator;
      state.impersonator = null;
      persist();
      return state.session;
    },

    /** Redirect to the login screen when a dashboard page is opened cold. */
    requireRole: function (role) {
      if (!state.session) {
        // The prototype is meant to be clickable without friction, so instead of
        // bouncing the visitor we sign them in as the role the page expects.
        Store.login(role);
      } else if (state.session.role !== role) {
        // An impersonated session survives navigation inside the portal it was
        // opened for; walking back into the impersonator's own area ends it.
        if (state.impersonator && state.impersonator.role === role) Store.stopImpersonating();
        else if (!state.impersonator) Store.login(role);
      }
      return state.session;
    },

    /* ----------------------------------------------------------------------
       User directory — every person with portal access, newest account first.
       ---------------------------------------------------------------------- */

    directory: function (type) {
      var list = [];

      Store.users().filter(function (u) { return u.role === 'admin'; }).forEach(function (u) {
        list.push({
          key: 'ADM-' + u.email, role: 'admin', type: 'Admin', name: u.name, email: u.email,
          phone: '(888) 391-6324', city: 'New York', state: 'NY', company: 'FleetSquad',
          title: u.title, refId: null, since: null, sortAt: 0
        });
      });

      (state.managers || []).forEach(function (m) {
        list.push({
          key: m.id, role: 'manager', type: 'Manager', name: m.name, email: m.email,
          phone: m.phone, city: m.city || '—', state: m.state || '—', company: m.region + ' region',
          title: 'Regional Fleet Manager', refId: m.id, since: m.since,
          sortAt: m.since ? new Date(m.since).getTime() : 0
        });
      });

      state.mechanics.forEach(function (m) {
        list.push({
          key: m.id, role: 'mechanic', type: 'Mechanic', name: m.name, email: m.email,
          phone: m.phone, city: m.city, state: m.state, company: m.certs,
          title: 'ASE Master Technician', refId: m.id, since: m.since,
          sortAt: m.since ? new Date(m.since).getTime() : 0
        });
      });

      state.customers.forEach(function (c) {
        list.push({
          key: c.id, role: 'customer', type: 'Customer', name: c.firstName + ' ' + c.lastName,
          email: c.email, phone: c.phone, city: c.city, state: c.state, company: c.company,
          title: c.company, refId: c.id, since: c.since,
          sortAt: c.since ? new Date(c.since).getTime() : 0
        });
      });

      // Newest account at the top, oldest at the bottom.
      list.sort(function (a, b) { return b.sortAt - a.sortAt; });
      return type ? list.filter(function (p) { return p.role === type; }) : list;
    },

    person: function (key) {
      return Store.directory().filter(function (p) { return p.key === key; })[0] || null;
    },

    users: function () { return state.users || FS.data.users; },

    /**
     * The record behind a directory key, and which collection it came from.
     * The four kinds of account are stored in four different shapes, so
     * anything that edits a person resolves it here rather than guessing.
     * @returns {{role:string, person:object, record:object}|null}
     */
    personRecord: function (key) {
      var p = Store.person(key);
      if (!p) return null;
      var record =
        p.role === 'admin'    ? Store.users().filter(function (u) { return 'ADM-' + u.email === key; })[0] :
        p.role === 'manager'  ? Store.manager(p.refId) :
        p.role === 'mechanic' ? Store.mechanic(p.refId) :
                                Store.customer(p.refId);
      return record ? { role: p.role, person: p, record: record } : null;
    },

    /**
     * Write an edited account back to whichever collection holds it. The form
     * is built from FS.data.personFields, so the patch is already in the
     * record's own field names and can be applied as it stands.
     * @returns {{ok:boolean, error?:string, person?:object}}
     */
    savePerson: function (key, patch) {
      var found = Store.personRecord(key);
      if (!found) return { ok: false, error: 'That account no longer exists.' };

      var record = found.record;
      var oldEmail = String(record.email || '').toLowerCase();
      var email = patch.email === undefined ? record.email : String(patch.email).trim();
      if (!email) return { ok: false, error: 'An email address is needed — it is also the portal username.' };

      // Two accounts on one address would make signing in ambiguous.
      var clash = Store.directory().filter(function (p) {
        return p.key !== key && String(p.email).toLowerCase() === email.toLowerCase();
      })[0];
      if (clash) return { ok: false, error: clash.name + ' already signs in with that address.' };

      // Number fields arrive from the form as strings; a blank one is left as
      // it was rather than written as NaN.
      (FS.data.personFields[found.role] || []).forEach(function (f) {
        if (f.type !== 'number' || patch[f.key] === undefined) return;
        if (String(patch[f.key]).trim() === '') delete patch[f.key];
        else patch[f.key] = Number(patch[f.key]);
      });

      Object.assign(record, patch, { email: email });

      /* The password is filed under the address, so a changed email has to
         take the credential with it or the account cannot sign in again. */
      if (oldEmail && oldEmail !== email.toLowerCase()) {
        state.credentials[email.toLowerCase()] = state.credentials[oldEmail] || 'demo1234';
        delete state.credentials[oldEmail];
      }

      /* Whoever is signed in may be the person just edited — or may be
         impersonating them — so the topbar has to follow the change. */
      var after = Store.person(found.role === 'admin' ? 'ADM-' + email : key);
      if (after) {
        [state.session, state.impersonator].forEach(function (s) {
          if (!s) return;
          var same = (after.refId && s.refId === after.refId) ||
                     (oldEmail && String(s.email || '').toLowerCase() === oldEmail);
          if (!same) return;
          s.name = after.name;
          s.email = after.email;
          s.title = after.title;
        });
      }

      Store.lastWriteOk = persist();
      return { ok: true, person: after };
    },

    /**
     * Issue a new temporary password and post the notification the customer or
     * technician would receive. Returns the password so the admin can read it
     * back to them if the email bounces.
     */
    resetPassword: function (personKey, who) {
      var person = Store.person(personKey);
      if (!person) return null;

      var pwd = 'FS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      state.credentials[person.email.toLowerCase()] = pwd;

      Store.notify({
        channel: 'email', audience: person.role, orderId: null,
        title: 'Your FleetSquad password was reset',
        body: 'Subject: Reset your FleetSquad password\n\n' +
              'Hi ' + person.name + ',\n' +
              (who ? who + ' at FleetSquad reset your password.\n' : '') +
              'Sign in at fleetsquad.com/login with:\n' +
              'Username: ' + person.email + '\n' +
              'Temporary password: ' + pwd + '\n\n' +
              'You will be asked to choose a new password on first sign-in.'
      });
      persist();
      return { person: person, password: pwd };
    },

    setPassword: function (email, password) {
      state.credentials[String(email).toLowerCase()] = password;
      persist();
    },

    /* ----------------------------------------------------------------------
       Blog posts
       ---------------------------------------------------------------------- */

    posts: function (status) {
      var list = state.posts.slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
      return status ? list.filter(function (p) { return p.status === status; }) : list;
    },

    post: function (slug) {
      return state.posts.filter(function (p) { return p.slug === slug; })[0] || null;
    },

    savePost: function (slug, patch) {
      var p = Store.post(slug);
      if (!p) return null;
      Object.assign(p, patch);
      // An uploaded header image is carried inside the record, so a save can
      // legitimately be refused for size. Store.lastWriteOk lets the editor
      // report that instead of showing a success it cannot honour.
      Store.lastWriteOk = persist();
      return p;
    },

    createPost: function (payload) {
      var post = Object.assign({
        slug: 'new-post-' + (state.posts.length + 1),
        title: 'Untitled post',
        category: FS.data.postCategories[0],
        author: (state.session && state.session.name) || 'FleetSquad',
        at: new Date().toISOString(),
        read: 5,
        image: 'assets/img/services/preventive-maintenance.jpg',
        excerpt: '',
        body: [''],
        status: 'draft',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        related: []
      }, payload);
      state.posts.unshift(post);
      persist();
      return post;
    },

    deletePost: function (slug) {
      state.posts = state.posts.filter(function (p) { return p.slug !== slug; });
      // Drop the deleted slug from every remaining article's related list.
      state.posts.forEach(function (p) {
        p.related = (p.related || []).filter(function (s) { return s !== slug; });
      });
      persist();
    },

    /* ----------------------------------------------------------------------
       Service areas
       ---------------------------------------------------------------------- */

    serviceAreas: function (activeOnly) {
      var list = state.serviceAreas.slice().sort(function (a, b) {
        return a.state.localeCompare(b.state);
      });
      return activeOnly ? list.filter(function (a) { return a.active; }) : list;
    },

    serviceArea: function (id) {
      return state.serviceAreas.filter(function (a) { return a.id === id; })[0] || null;
    },

    saveServiceArea: function (id, patch) {
      var a = Store.serviceArea(id);
      if (!a) return null;
      Object.assign(a, patch);
      persist();
      return a;
    },

    createServiceArea: function (payload) {
      var n = state.serviceAreas.length + 1;
      var area = Object.assign({
        id: 'SA-' + (n < 10 ? '0' + n : n),
        code: '', state: '', counties: [], cities: [], active: true
      }, payload);
      state.serviceAreas.push(area);
      persist();
      return area;
    },

    deleteServiceArea: function (id) {
      state.serviceAreas = state.serviceAreas.filter(function (a) { return a.id !== id; });
      persist();
    },

    /** Does a city / county / state string fall inside a covered area? */
    lookupArea: function (query) {
      var q = String(query || '').trim().toLowerCase();
      if (!q) return null;
      var hit = null;
      Store.serviceAreas(true).some(function (a) {
        var cityMatch = a.cities.filter(function (c) { return c.toLowerCase() === q; })[0];
        var countyMatch = (a.counties || []).filter(function (c) { return c.toLowerCase() === q; })[0];
        if (cityMatch || countyMatch || a.state.toLowerCase() === q || a.code.toLowerCase() === q) {
          hit = { area: a, city: cityMatch || null, county: countyMatch || null };
          return true;
        }
        return false;
      });
      return hit;
    },

    /* ----------------------------------------------------------------------
       CMS pages
       ---------------------------------------------------------------------- */

    cmsPages: function () { return state.cmsPages; },

    cmsPage: function (slug) {
      return state.cmsPages.filter(function (p) { return p.slug === slug; })[0] || null;
    },

    saveCmsPage: function (slug, patch) {
      var p = Store.cmsPage(slug);
      if (!p) return null;
      Object.assign(p, patch, { updated: new Date().toISOString() });
      Store.lastWriteOk = persist();
      return p;
    },

    /** The editable body sections of a page, or [] for pages without any. */
    cmsBlocks: function (slug) {
      var p = Store.cmsPage(slug);
      return (p && p.blocks) || [];
    },

    /** Whether a page's body is editable in the CMS at all. */
    hasBlocks: function (slug) {
      var p = Store.cmsPage(slug);
      return !!(p && Array.isArray(p.blocks));
    },

    newBlock: function () { return { heading: '', style: 'text', text: '' }; },

    faqs: function () { return state.faqs; },

    saveFaqs: function (list) {
      state.faqs = list.map(function (faq) {
        return { q: faq.q, a: faq.a };
      });
      return persist();
    },

    /* ----------------------------------------------------------------------
       Partners
       The cards on the public Partners page. Edited inside the CMS Pages
       modal for that page, so the copy and the cards are saved together.
       ---------------------------------------------------------------------- */

    partners: function () { return state.partners; },

    partner: function (id) {
      return state.partners.filter(function (p) { return p.id === id; })[0] || null;
    },

    /**
     * Replace the whole partner list in one go. The editor rebuilds the array
     * from its rows, which keeps the order the admin sees and the order the
     * public page renders identical.
     * @param {Array<{id:string,name:string,logo:string,type:string,text:string}>} list
     * @returns {boolean} whether the change reached localStorage
     */
    savePartners: function (list) {
      state.partners = list.map(function (p, i) {
        return {
          id:   p.id || 'PTR-' + Date.now() + '-' + i,
          name: p.name,
          logo: p.logo,
          type: p.type,
          text: p.text
        };
      });
      return persist();
    },

    /* ----------------------------------------------------------------------
       Catalog — services, industries and vehicle types
       All three drive a public template page, the nav and the footer, and all
       three are edited the same way, so one set of methods covers them. The
       `kind` is 'service' | 'industry' | 'vehicle'.
       ---------------------------------------------------------------------- */

    /** The state key and the public page each kind lives on. */
    catalogMeta: {
      service:  { key: 'services',     page: 'service.html',  param: 's', label: 'Service' },
      industry: { key: 'industries',   page: 'industry.html', param: 'i', label: 'Industry' },
      vehicle:  { key: 'vehicleTypes', page: 'vehicle.html',  param: 'v', label: 'Vehicle type' }
    },

    catalog: function (kind) {
      var meta = Store.catalogMeta[kind];
      return meta ? state[meta.key] : [];
    },

    catalogItem: function (kind, slug) {
      return Store.catalog(kind).filter(function (x) { return x.slug === slug; })[0] || null;
    },

    /**
     * Write a patch onto one record. A slug change is applied here too, so
     * every caller goes through one place that can keep it URL-safe.
     * @returns {object|null} the updated record
     */
    saveCatalogItem: function (kind, slug, patch) {
      var item = Store.catalogItem(kind, slug);
      if (!item) return null;
      if (patch.slug) patch.slug = Store.slugify(patch.slug) || item.slug;
      Object.assign(item, patch);
      Store.lastWriteOk = persist();
      return item;
    },

    /** Append a blank record and return it, ready to edit. */
    createCatalogItem: function (kind) {
      var meta = Store.catalogMeta[kind];
      if (!meta) return null;
      var n = state[meta.key].length + 1;
      var slug = Store.uniqueSlug(kind, 'new-' + kind + '-' + n);
      var item = {
        slug: slug,
        name: 'New ' + meta.label.toLowerCase(),
        short: '',
        icon: 'truck-wrench',
        image: kind === 'industry' ? '' : 'assets/img/services/preventive-maintenance.jpg',
        excerpt: '',
        hero: '',
        intro: '',
        features: [],
        stats: [],
        bullets: [],
        seo: { title: '', description: '', keywords: '', path: slug + '/' }
      };
      state[meta.key].push(item);
      Store.lastWriteOk = persist();
      return item;
    },

    deleteCatalogItem: function (kind, slug) {
      var meta = Store.catalogMeta[kind];
      if (!meta) return false;
      var before = state[meta.key].length;
      state[meta.key] = state[meta.key].filter(function (x) { return x.slug !== slug; });
      persist();
      return state[meta.key].length < before;
    },

    /** Move a record up or down; the order drives the nav and every grid. */
    moveCatalogItem: function (kind, slug, by) {
      var list = Store.catalog(kind);
      var i = list.map(function (x) { return x.slug; }).indexOf(slug);
      var to = i + by;
      if (i < 0 || to < 0 || to >= list.length) return false;
      list.splice(to, 0, list.splice(i, 1)[0]);
      persist();
      return true;
    },

    slugify: function (text) {
      return String(text || '').trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    },

    /** A slug not already taken inside the same catalog. */
    uniqueSlug: function (kind, wanted, ignore) {
      var base = Store.slugify(wanted) || 'untitled';
      var taken = Store.catalog(kind)
        .filter(function (x) { return x.slug !== ignore; })
        .map(function (x) { return x.slug; });
      var slug = base, n = 2;
      while (taken.indexOf(slug) > -1) { slug = base + '-' + n; n++; }
      return slug;
    },

    /**
     * The primary navigation, rebuilt from the catalogs so anything added in
     * the admin appears in the header, the drawer and the footer.
     */
    nav: function () {
      return [
        { label: 'Services', children: state.services.map(function (s) {
            return { label: s.short || s.name, href: 'service.html?s=' + s.slug }; }) },
        { label: 'Industries', children: state.industries.map(function (i) {
            return { label: i.name, href: 'industry.html?i=' + i.slug }; }) },
        { label: 'Vehicles', children: state.vehicleTypes.map(function (v) {
            return { label: v.name, href: 'vehicle.html?v=' + v.slug }; }) }
      ].concat(FS.data.nav.slice(3));
    },

    newPartner: function () {
      return {
        id: 'PTR-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name: '', logo: '', type: '', text: ''
      };
    },

    /* ----------------------------------------------------------------------
       Settings (Stripe)
       ---------------------------------------------------------------------- */

    settings: function () { return state.settings; },

    saveSettings: function (patch) {
      Object.assign(state.settings, patch);
      persist();
      return state.settings;
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
      return (state.managers || FS.data.managers).filter(function (m) { return m.id === id; })[0] || null;
    },

    managers: function () { return state.managers || FS.data.managers; },

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
      // Give the new account a portal password straight away — New Sale reads
      // it back on the confirmation screen.
      if (customer.email) {
        state.credentials[customer.email.toLowerCase()] =
          payload.password || ('FS-' + Math.random().toString(36).slice(2, 8).toUpperCase());
      }
      persist();
      return customer;
    },

    /** The password held for an account, so it can be shown once at creation. */
    passwordFor: function (email) {
      return state.credentials[String(email || '').toLowerCase()] || null;
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

    /* ----------------------------------------------------------------------
       Contact inbox
       What the public contact form collects. Nothing is posted anywhere —
       there is no mail server behind this prototype — so a message is filed
       in this browser and read in Admin → Inbox, addressed to the support
       desk in FS.data.company.contactEmail.
       ---------------------------------------------------------------------- */

    /** Every message, newest first. */
    inbox: function () {
      return state.inbox.slice().sort(function (a, b) {
        return new Date(b.at) - new Date(a.at);
      });
    },

    inboxMessage: function (id) {
      return state.inbox.filter(function (m) { return m.id === id; })[0] || null;
    },

    /** How many are still unread — the red count in the sidebar. */
    inboxUnread: function () {
      return state.inbox.filter(function (m) { return !m.read; }).length;
    },

    /**
     * File a message from the contact form.
     * @param {{name:string, company:string, email:string, phone:string,
     *          topic:string, message:string}} payload
     * @returns {object} the stored record
     */
    addMessage: function (payload) {
      var msg = Object.assign({
        id: 'MSG-' + state.nextMessage++,
        at: new Date().toISOString(),
        to: FS.data.company.contactEmail,
        read: false
      }, payload);
      state.inbox.unshift(msg);
      Store.lastWriteOk = persist();
      return msg;
    },

    /** Flip one message's read flag. Pass `false` to mark it unread again. */
    markMessageRead: function (id, read) {
      var m = Store.inboxMessage(id);
      if (!m) return null;
      m.read = read !== false;
      persist();
      return m;
    },

    markAllMessagesRead: function () {
      state.inbox.forEach(function (m) { m.read = true; });
      persist();
    },

    deleteMessage: function (id) {
      state.inbox = state.inbox.filter(function (m) { return m.id !== id; });
      persist();
    },

    /* ----------------------------------------------------------------------
       Careers — open roles and the applications they attract
       The roles drive the public careers page and are edited in Admin → Jobs.
       An application is what the Apply form on that page collected: there is
       no mail server behind the prototype, so it is filed in this browser and
       read in Admin → Jobs → Applications.
       ---------------------------------------------------------------------- */

    /** @param {string} [status] 'open' | 'draft' | 'closed'. Omit for all. */
    jobs: function (status) {
      var list = state.jobs || [];
      return status ? list.filter(function (j) { return j.status === status; }) : list;
    },

    job: function (id) {
      return (state.jobs || []).filter(function (j) { return j.id === id; })[0] || null;
    },

    saveJob: function (id, patch) {
      var j = Store.job(id);
      if (!j) return null;
      Object.assign(j, patch);
      Store.lastWriteOk = persist();
      return j;
    },

    /** Append a blank role, ready to edit. New roles start as a draft so a
        half-written posting never appears on the public page. */
    createJob: function () {
      var n = state.nextJob || ((state.jobs || []).length + 1);
      state.nextJob = n + 1;
      var job = {
        id: 'JOB-' + (n < 10 ? '0' : '') + n,
        status: 'draft',
        posted: new Date().toISOString(),
        title: 'New role',
        dept: FS.data.jobDepartments[0],
        location: '',
        type: FS.data.jobTypes[0],
        text: ''
      };
      state.jobs.push(job);
      Store.lastWriteOk = persist();
      return job;
    },

    deleteJob: function (id) {
      state.jobs = (state.jobs || []).filter(function (j) { return j.id !== id; });
      persist();
    },

    /** Move a role up or down. The order here is the order on the page. */
    moveJob: function (id, by) {
      var list = state.jobs || [];
      var i = list.map(function (j) { return j.id; }).indexOf(id);
      var to = i + by;
      if (i < 0 || to < 0 || to >= list.length) return false;
      list.splice(to, 0, list.splice(i, 1)[0]);
      persist();
      return true;
    },

    /** Newest application first, which is the order the admin reads them in. */
    applications: function (jobId) {
      var list = (state.applications || []).slice().sort(function (a, b) {
        return new Date(b.at) - new Date(a.at);
      });
      return jobId ? list.filter(function (a) { return a.jobId === jobId; }) : list;
    },

    application: function (id) {
      return (state.applications || []).filter(function (a) { return a.id === id; })[0] || null;
    },

    applicationsUnread: function () {
      return (state.applications || []).filter(function (a) { return !a.read; }).length;
    },

    /** File what the Apply form collected. Returns the stored application. */
    addApplication: function (payload) {
      var job = payload.jobId ? Store.job(payload.jobId) : null;
      var app = Object.assign({
        id: 'APP-' + (state.nextApplication || 2005),
        at: new Date().toISOString(),
        read: false,
        jobTitle: job ? job.title : (payload.jobTitle || 'General application')
      }, payload);
      state.nextApplication = (state.nextApplication || 2005) + 1;
      state.applications.unshift(app);
      Store.lastWriteOk = persist();
      return app;
    },

    markApplicationRead: function (id, read) {
      var a = Store.application(id);
      if (!a) return null;
      a.read = read === undefined ? true : !!read;
      persist();
      return a;
    },

    markAllApplicationsRead: function () {
      (state.applications || []).forEach(function (a) { a.read = true; });
      persist();
    },

    deleteApplication: function (id) {
      state.applications = (state.applications || []).filter(function (a) { return a.id !== id; });
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
