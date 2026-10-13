/* ==========================================================================
   Digital GrowthScale — application role configuration
   One entry per role. This is the single place to look up a role's slug,
   page path, Netlify form name and future webhook.

   - Loaded in the browser as window.DGS_ROLES (used by ../js/application.js).
   - Can also be require()'d from Node (e.g. a Netlify Function) to route
     submissions by form name. See ../README.md, "Connecting webhooks".

   DO NOT rename `netlifyFormName` values. They must match the <form name="…">
   in each page exactly, and they identify the form in the Netlify dashboard.

   WEBHOOKS: none are connected yet. The browser never calls `webhook`;
   these entries are for documentation and a future server-side function.
   Do not put secret tokens in this file. It is public once deployed.
   ========================================================================== */
(function (root) {
  'use strict';

  // Shared defaults. A role overrides only what differs from its original page.
  var DEFAULTS = {
    fileLimitsMB: { resume: 3, portfolio: 4 },   // Netlify allows ~8 MB per submission
    portfolioRequired: false,
    chipNoneHint: true,                          // append "(choose "None of these"…)" to checkbox-group errors
    messages: {
      portfolioMissing: 'Please upload your portfolio or share a portfolio link. A portfolio is required for this role.',
      linkInvalid: 'Please enter a valid link that starts with https://',
      sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume to talent@digitalgrowthscale.com.'
    }
  };

  var ROLES = [
    {
      slug: 'architectural-bim-modeler',
      title: 'Architectural BIM Modeler',
      path: '/careers/applications/architectural-bim-modeler.html',
      originalUrl: 'https://archibim.netlify.app',
      netlifyFormName: 'architectural-bim-modeler-application',
      portfolioRequired: true,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.' },
      webhook: { status: 'not-configured', endpoint: null }
    },
    {
      slug: 'mechanical-electrical-bim-modeler',
      title: 'Mechanical and Electrical BIM Modeler',
      path: '/careers/applications/mechanical-electrical-bim-modeler.html',
      originalUrl: 'https://mechbim.netlify.app',
      netlifyFormName: 'me-bim-modeler-application',
      portfolioRequired: true,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.' },
      webhook: { status: 'not-configured', endpoint: null }
    },
    {
      slug: 'structural-bim-modeler',
      title: 'Structural BIM Modeler',
      path: '/careers/applications/structural-bim-modeler.html',
      originalUrl: 'https://strucbim.netlify.app',
      netlifyFormName: 'structural-bim-modeler-application',
      portfolioRequired: true,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.' },
      webhook: { status: 'not-configured', endpoint: null }
    },
    {
      slug: 'facade-architectural-skilled-drafter',
      title: 'Façade & Architectural Skilled Drafter',
      path: '/careers/applications/facade-architectural-skilled-drafter.html',
      originalUrl: 'https://dgsrecruitment.netlify.app',
      netlifyFormName: 'skilled-drafter-application',
      portfolioRequired: true,
      messages: {
        portfolioMissing: 'Please upload your portfolio or share a portfolio link.',
        linkInvalid: 'Please enter a valid portfolio link that starts with https://',
        sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.'
      },
      webhook: { status: 'not-configured', endpoint: null }
    },
    {
      slug: 'senior-it-support',
      title: 'Senior IT Support',
      path: '/careers/applications/senior-it-support.html',
      originalUrl: 'https://senioritsupport.netlify.app',
      netlifyFormName: 'senior-it-support-application',
      fileLimitsMB: { resume: 5 },
      messages: { linkInvalid: 'Please enter a valid LinkedIn link that starts with https://' },
      webhook: { status: 'not-configured', endpoint: null }
    },
    {
      slug: 'microsoft-365-teams-specialist',
      title: 'Microsoft 365 / Teams Specialist (Project-Based)',
      path: '/careers/applications/microsoft-365-teams-specialist.html',
      originalUrl: 'https://specialist365.netlify.app',
      netlifyFormName: 'm365-teams-specialist-application',
      fileLimitsMB: { resume: 5 },
      chipNoneHint: false,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your CV to talent@digitalgrowthscale.com.' },
      webhook: { status: 'not-configured', endpoint: null }
    },
    {
      slug: 'accounts-administration-officer',
      title: 'Accounts & Administration Officer',
      path: '/careers/applications/accounts-administration-officer.html',
      originalUrl: 'https://acctsandadminofficer.netlify.app',
      netlifyFormName: 'accounts-admin-officer-application',
      webhook: { status: 'not-configured', endpoint: null }
    }
  ];

  function withDefaults(role) {
    var out = {}, k;
    for (k in DEFAULTS) out[k] = DEFAULTS[k];
    for (k in role) out[k] = role[k];
    out.messages = {};
    for (k in DEFAULTS.messages) out.messages[k] = DEFAULTS.messages[k];
    for (k in (role.messages || {})) out.messages[k] = role.messages[k];
    return out;
  }

  var api = {
    roles: ROLES.map(withDefaults),
    bySlug: function (slug) {
      for (var i = 0; i < this.roles.length; i++) if (this.roles[i].slug === slug) return this.roles[i];
      return null;
    },
    byFormName: function (name) {
      for (var i = 0; i < this.roles.length; i++) if (this.roles[i].netlifyFormName === name) return this.roles[i];
      return null;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DGS_ROLES = api;
})(typeof self !== 'undefined' ? self : this);
