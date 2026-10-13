# Careers application pages

Seven role pages, one shared stylesheet, one shared script, one role config.
Each page was rebuilt from its live `*.netlify.app` page with the job content and form fields unchanged.
Untouched snapshots of every original are in `/.originals/`.

```
careers/
├── index.html                 Careers listing (was /careers.html)
├── css/careers.css
├── js/careers.js
├── assets/logo.png            shared logo (was inlined 16× as base64)
└── applications/
    ├── css/application.css    shared styles + scoped per-role overrides at the bottom
    ├── js/application.js      shared validation, upload, submit and success logic
    ├── config/application-roles.js   role → slug, title, Netlify form name, webhook
    └── <slug>.html            one page per role
```

## Role map

| Slug (file name) | Job title | Netlify form name (do not rename) | Original URL |
|---|---|---|---|
| `architectural-bim-modeler.html` | Architectural BIM Modeler | `architectural-bim-modeler-application` | https://archibim.netlify.app |
| `mechanical-electrical-bim-modeler.html` | Mechanical & Electrical BIM Modeler | `me-bim-modeler-application` | https://mechbim.netlify.app |
| `structural-bim-modeler.html` | Structural BIM Modeler | `structural-bim-modeler-application` | https://strucbim.netlify.app |
| `facade-architectural-skilled-drafter.html` | Façade & Architectural Skilled Drafter | `skilled-drafter-application` | https://dgsrecruitment.netlify.app |
| `senior-it-support.html` | Senior IT Support | `senior-it-support-application` | https://senioritsupport.netlify.app |
| `microsoft-365-teams-specialist.html` | Microsoft 365 / Teams Specialist | `m365-teams-specialist-application` | https://specialist365.netlify.app |
| `accounts-administration-officer.html` | Accounts & Administration Officer | `accounts-admin-officer-application` | https://acctsandadminofficer.netlify.app |

Each submission already carries the role: the hidden `form-name` (the form name) and `position` (the job title) fields.

## How submission works (Netlify Forms)

- Each `<form>` has `data-netlify="true"` and `netlify-honeypot="bot-field"`. Netlify finds these forms when the site is deployed and then removes the attributes from the served HTML. The live pages no longer showed them, so they were added back here.
- `application.js` validates the form, then sends a multipart `fetch` POST to the page's own path. The success panel appears only if Netlify returns 2xx. On failure the button is re-enabled and the role's error message is shown. A second submit is ignored while a request is in flight.
- Without JavaScript, the form posts normally and Netlify redirects to `action` (`/careers/applications/<slug>.html?applied=1`), which shows the success panel.

## Adding or changing a role

1. Copy a role `.html` file, rename it to the new slug, and edit the content and fields. Keep `id="appForm"` and the hidden `form-name` value equal to the form's `name`.
2. Set `<body data-role="<slug>">`.
3. Add an entry to `config/application-roles.js`.
4. Point the Careers card to `applications/<slug>.html`.

## Connecting webhooks (next phase)

No webhook is connected. `application.js` never calls one, and every role has `webhook: { status: 'not-configured', endpoint: null }`.

Send to webhooks **from the server, after Netlify accepts the submission**, not from the browser. If the browser sent twice (Netlify plus webhook), one copy could succeed while the other fails, and the webhook URL would be public.

**Option A, recommended (no code):** In the Netlify dashboard, go to Site configuration → Notifications → Form submission notifications → Add notification → **Outgoing webhook**. Choose the event *New form submission*, pick **one form** (for example `senior-it-support-application`), and paste that role's webhook URL. Repeat for each of the 7 forms. It fires only for verified, non-spam submissions. Then update the role's `webhook.status` in the config to record it.

**Option B (custom routing or payload shaping):** Add a Netlify Function named `submission-created`. Netlify runs it after every verified submission. It can `require('../../careers/applications/config/application-roles.js')` and use `byFormName(payload.form_name)` to find the role. Keep each URL in a Netlify environment variable (for example `WEBHOOK_SENIOR_IT_SUPPORT`), never in this repo. This needs a CLI or Git deploy, because drag-and-drop deploys do not run functions.

Uploaded files reach webhooks as Netlify file links, not as attachments. Check that the receiving system (such as GoHighLevel) can open them.
