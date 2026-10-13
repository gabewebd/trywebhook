/* ==========================================================================
   Digital GrowthScale — application role configuration
   One entry per role. This is the single place to look up a role's slug,
   page path, Netlify form name and future webhook.

   - Loaded in the browser as window.DGS_ROLES (used by js/application.js).
   - Can also be require()'d from Node (e.g. a Netlify Function) to route
     submissions by form name. See README.md, "GHL webhook".

   DO NOT rename `netlifyFormName` values. They must match the <form name="…">
   in each page exactly, and they identify the form in the Netlify dashboard.

   WEBHOOKS: when a role has `webhook.endpoint`, js/application.js posts a
   JSON copy of the application to it AFTER Netlify Forms accepts the
   submission. Leave `endpoint: null` to submit to Netlify only.
   A GHL inbound-webhook URL is not a secret key, but anyone who reads this
   file can post to it. Do not put API keys or tokens in this file. It is
   public once deployed.
   ========================================================================== */
(function (root) {
  'use strict';

  // GoHighLevel inbound webhook used for TESTING. Every role points to it for now.
  // To give a role its own workflow, replace that role's `webhook.endpoint` below.
  var GHL_TEST_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/UAA13luwQZmtw8ObS1Su/webhook-trigger/3505cc74-e748-48a9-bf08-6429c0806351';

  // Shared defaults. A role overrides only what differs from its original page.
  var DEFAULTS = {
    fileLimitsMB: { resume: 3, portfolio: 4 },   // Netlify allows ~8 MB per submission
    portfolioRequired: false,
    chipNoneHint: true,                          // append "(choose "None of these"…)" to checkbox-group errors
    messages: {
      portfolioMissing: 'Please upload your portfolio or share a portfolio link. A portfolio is required for this role.',
      linkInvalid: 'Please enter a valid link that starts with https://',
      sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume to talent@digitalgrowthscale.com.',
      // Netlify saved the application but the webhook failed. Retrying resends only the webhook.
      webhookFailed: 'Your application was saved, but we could not finish sending it to our recruitment team. Please press Submit again to retry, or email your resume to talent@digitalgrowthscale.com.'
    }
  };

  var ROLES = [
    {
      slug: 'architectural-bim-modeler',
      title: 'Architectural BIM Modeler',
      path: '/architectural-bim-modeler',
      originalUrl: 'https://archibim.netlify.app',
      netlifyFormName: 'architectural-bim-modeler-application',
      portfolioRequired: true,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.' },
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
    },
    {
      slug: 'mechanical-electrical-bim-modeler',
      title: 'Mechanical and Electrical BIM Modeler',
      path: '/mechanical-electrical-bim-modeler',
      originalUrl: 'https://mechbim.netlify.app',
      netlifyFormName: 'me-bim-modeler-application',
      portfolioRequired: true,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.' },
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
    },
    {
      slug: 'structural-bim-modeler',
      title: 'Structural BIM Modeler',
      path: '/structural-bim-modeler',
      originalUrl: 'https://strucbim.netlify.app',
      netlifyFormName: 'structural-bim-modeler-application',
      portfolioRequired: true,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.' },
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
    },
    {
      slug: 'facade-architectural-skilled-drafter',
      title: 'Façade & Architectural Skilled Drafter',
      path: '/facade-architectural-skilled-drafter',
      originalUrl: 'https://dgsrecruitment.netlify.app',
      netlifyFormName: 'skilled-drafter-application',
      portfolioRequired: true,
      messages: {
        portfolioMissing: 'Please upload your portfolio or share a portfolio link.',
        linkInvalid: 'Please enter a valid portfolio link that starts with https://',
        sendFailed: 'Something went wrong while sending your application. Please try again, or email your resume and portfolio to talent@digitalgrowthscale.com.'
      },
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
    },
    {
      slug: 'senior-it-support',
      title: 'Senior IT Support',
      path: '/senior-it-support',
      originalUrl: 'https://senioritsupport.netlify.app',
      netlifyFormName: 'senior-it-support-application',
      fileLimitsMB: { resume: 5 },
      messages: { linkInvalid: 'Please enter a valid LinkedIn link that starts with https://' },
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
    },
    {
      slug: 'microsoft-365-teams-specialist',
      title: 'Microsoft 365 / Teams Specialist (Project-Based)',
      path: '/microsoft-365-teams-specialist',
      originalUrl: 'https://specialist365.netlify.app',
      netlifyFormName: 'm365-teams-specialist-application',
      fileLimitsMB: { resume: 5 },
      chipNoneHint: false,
      messages: { sendFailed: 'Something went wrong while sending your application. Please try again, or email your CV to talent@digitalgrowthscale.com.' },
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
    },
    {
      slug: 'accounts-administration-officer',
      title: 'Accounts & Administration Officer',
      path: '/accounts-administration-officer',
      originalUrl: 'https://acctsandadminofficer.netlify.app',
      netlifyFormName: 'accounts-admin-officer-application',
      webhook: { status: 'testing', endpoint: GHL_TEST_WEBHOOK }
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
