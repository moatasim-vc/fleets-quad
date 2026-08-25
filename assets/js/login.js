/* ==========================================================================
   FleetSquad — Login screen
   Signs a visitor in against the local credential store and drops them on the
   dashboard for their role. Anyone in the directory can sign in, so an admin
   can hand a customer or a technician their own username and password.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var FS = window.FS;
  var D = FS.data;
  var Store = FS.store;

  var ROLE_HOME = {
    admin:    'admin/index.html',
    manager:  'manager/index.html',
    customer: 'customer/index.html',
    mechanic: 'mechanic/index.html'
  };

  var ROLE_LABEL = {
    admin:    { title: 'Administrator', text: 'Full platform access — orders, people, money and content.' },
    manager:  { title: 'Fleet Manager', text: 'Projects, vehicles and technician payouts for your region.' },
    customer: { title: 'Fleet Customer', text: 'Your projects, vehicles, invoices and reviews.' },
    mechanic: { title: 'Technician', text: 'Your assigned jobs, clock-in and payment history.' }
  };

  function goTo(role) {
    window.location.href = FS.url(ROLE_HOME[role] || 'index.html');
  }

  function init() {
    /* Coming from the homepage dashboard widget? Say so, so the redirect does
       not feel arbitrary. */
    if (FS.param('next') === 'dashboard') {
      document.getElementById('authLead').textContent =
        'Sign in to open your full fleet dashboard.';
    }

    /* An already-signed-in visitor is sent straight through. */
    var existing = Store.session();
    if (existing && FS.param('stay') !== '1') {
      goTo(existing.role);
      return;
    }

    renderRoles();
    wireForm();
    wireForgot();
    FS.hydrateIcons(document);
  }

  /* ------------------------------------------------------------------------
     One-click demo sign-in per role
     ------------------------------------------------------------------------ */
  function renderRoles() {
    var host = document.getElementById('authRoles');
    host.innerHTML = D.users.map(function (u) {
      var meta = ROLE_LABEL[u.role];
      return '<button class="auth-role" type="button" data-role="' + u.role + '">' +
        '<span class="auth-role-icon">' + FS.icon(
          u.role === 'admin' ? 'shield-badge' : u.role === 'manager' ? 'briefcase' :
          u.role === 'mechanic' ? 'wrench' : 'truck') + '</span>' +
        '<span class="auth-role-body">' +
          '<strong>' + FS.esc(meta.title) + '</strong>' +
          '<small>' + FS.esc(meta.text) + '</small>' +
        '</span>' +
        FS.icon('chevron-right') +
      '</button>';
    }).join('');

    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-role]');
      if (!btn) return;
      Store.login(btn.dataset.role);
      goTo(btn.dataset.role);
    });
  }

  /* ------------------------------------------------------------------------
     Email + password
     ------------------------------------------------------------------------ */
  function wireForm() {
    var form = document.getElementById('loginForm');
    var error = document.getElementById('loginError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      error.hidden = true;

      if (!FS.validate(form)) return;

      var data = FS.formData(form);
      var result = Store.authenticate(data.email, data.password);

      if (!result.ok) {
        error.textContent = result.error;
        error.hidden = false;
        return;
      }
      goTo(result.session.role);
    });
  }

  /* ------------------------------------------------------------------------
     Password reset — mirrors what the admin screen sends
     ------------------------------------------------------------------------ */
  function wireForgot() {
    document.getElementById('forgotLink').addEventListener('click', function () {
      FS.modal({
        title: 'Reset your password',
        subtitle: 'We will email you a temporary password',
        body: '<div class="field"><label class="label" for="fpEmail">Email address</label>' +
          '<input class="input" id="fpEmail" type="email" placeholder="you@yourcompany.com" ' +
          'value="' + FS.esc(document.getElementById('loginEmail').value) + '"></div>' +
          '<p class="hint">Use the address your project confirmation was sent to.</p>',
        footer: '<button class="btn btn-outline" data-close>Cancel</button>' +
                '<button class="btn btn-primary" id="fpSend">Send reset email</button>',
        onMount: function (root, close) {
          root.querySelector('#fpSend').addEventListener('click', function () {
            var email = root.querySelector('#fpEmail').value.trim().toLowerCase();
            var person = Store.directory().filter(function (p) {
              return p.email.toLowerCase() === email;
            })[0];

            if (!person) {
              FS.toast('Address not found', 'No portal account uses that email.', 'warn');
              return;
            }
            var reset = Store.resetPassword(person.key, 'You');
            close();
            FS.modal({
              title: 'Reset email sent',
              subtitle: person.email,
              body: '<div class="msg-preview">' +
                  '<div class="msg-preview-head">' + FS.icon('mail') + 'Email to ' + FS.esc(person.email) + '</div>' +
                  '<div class="msg-preview-body">Subject: Reset your FleetSquad password\n\n' +
                  'Hi ' + FS.esc(person.name) + ',\n' +
                  'Sign in at fleetsquad.com/login with:\n' +
                  'Username: ' + FS.esc(person.email) + '\n' +
                  'Temporary password: ' + FS.esc(reset.password) + '</div>' +
                '</div>' +
                '<p class="hint mt-4">Shown here because the prototype has no mail server. ' +
                'In production only the recipient sees this.</p>',
              footer: '<button class="btn btn-primary" data-close>Got it</button>'
            });
          });
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
