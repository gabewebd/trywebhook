# trywebhook

# Careers application pages

Seven role pages, one shared stylesheet, one shared script, one role config.
Each page was rebuilt from its live `*.netlify.app` page with the job content and form fields unchanged.
Untouched snapshots of every original are in `/.originals/`.

```
index.html                     Careers listing — the site root (/)
applications/<slug>.html       one page per role, served at /<slug> (rewrite in _redirects)
css/careers.css                Careers page styles
css/application.css            shared role-page styles + scoped per-role overrides at the bottom
js/careers.js                  Careers page filter
js/application.js              shared validation, upload, submit and webhook logic
config/application-roles.js    role → slug, title, Netlify form name, webhook
assets/logo.png                shared logo (was inlined 16× as base64)
email-templates/               applicant confirmation email (for GHL)
_redirects                     /<slug> rewrites + old /careers/... URLs → new URLs
```

## Role map

| File in `applications/` (served at `/<slug>`) | Job title | Netlify form name (do not rename) | Original URL |
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
- `application.js` validates the form, then sends a multipart `fetch` POST to `/` (Netlify's AJAX pattern). Then, if the role has a webhook, it sends a JSON copy (see "GHL webhook" below). The success panel appears only if every step succeeds. On failure the button is re-enabled and the role's error message is shown. A second submit is ignored while a request is in flight.
- Without JavaScript, the form posts normally and Netlify redirects to `action` (`/<slug>?applied=1`), which shows the success panel.

## Adding or changing a role

1. Copy a role `.html` file in `applications/`, rename it to the new slug, and edit the content and fields. Keep `id="appForm"` and the hidden `form-name` value equal to the form's `name`.
2. Set `<body data-role="<slug>">`.
3. Add an entry to `config/application-roles.js`.
4. Add a rewrite to `_redirects`: `/<slug>  /applications/<slug>.html  200`.
5. Point the Careers card in `index.html` to `href="/<slug>"`.

Role pages load shared files with root paths (`/css/…`, `/js/…`, `/config/…`, `/assets/…`), so they work at both `/<slug>` and `/applications/<slug>.html`.

## GHL webhook (testing)

Every role currently posts to the GHL test webhook (`GHL_TEST_WEBHOOK` in `config/application-roles.js`). Set a role's `webhook.endpoint` to `null` to turn it off, or to a different URL to give that role its own workflow.

How a submission works:
1. `application.js` validates the form.
2. It POSTs the form (multipart, with files) to Netlify Forms. If this fails, the applicant sees the original error.
3. It POSTs a flat JSON copy of the answers to the role's webhook. GHL allows browser requests (`Access-Control-Allow-Origin: *`).
4. The success panel appears only after both succeed. If only the webhook failed, pressing Submit again resends just the webhook, with the same payload, so Netlify does not get a duplicate.

Payload: one key per form field name (e.g. `first-name`, `position`, `years-bim`). Checkbox groups drop the `[]` suffix and join ticked values with ", ". Unticked or empty fields are sent as `""`. Added keys: `submission-id` (also stored in Netlify), `role-slug`, `submitted-at`, `page-url`, and for each file input `<name>-type` and `<name>-size-kb`. The honeypot is never sent, and entries where the honeypot is filled skip the webhook.

Resumes: GHL receives the **file name, type and size only**. The file itself is stored in Netlify Forms. To find it, search the Netlify submission by `submission-id`. GHL cannot read the resume's contents from this payload.

Limits of the browser-side approach:
- The webhook URL is visible in page source, so anyone could post fake entries to it. It is not an API key, but for production consider moving it to a Netlify Function and environment variable.
- The no-JavaScript fallback posts to Netlify only.
- To give GHL a link to the resume file, use a server-side `submission-created` Netlify Function. It receives Netlify's stored submission, including upload links.
