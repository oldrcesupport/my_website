# Engineering status — 2026-11-02

## Recommendation

Not ready for production. This file records work actually done and known gaps;
older audit documents are historical and may describe a different implementation.

## Implemented

- Staff authentication uses an HttpOnly Django session and CSRF validation.
  Staff cannot use the former DRF token API. Role checks and staff management
  reject escalation to or modification of super administrators by ordinary admins.
- Callbacks no longer grant guest ownership based on the provider authority;
  order responses do not expose the guest secret. The frontend uses cookies.
- Payment finalization locks the order, checks amounts, marks ambiguous network
  errors as unknown, and routes a second verified charge to review. A successful
  payment is required before ticket issuance; QR redemption and cancellation use
  database locks. QR codes created now carry a one-time token without a URL.
- The public page hides an unconfigured production price. Staff cannot enable
  unsupported capacity control, set a non-Tehran timezone or change the currency.
- Default setup passwords were removed; setup preserves existing roles. A draft
  production container configuration and session migration notes were added.
- The former end-to-end script no longer manually changes a payment or order to
  paid. It runs an isolated API test using the mock provider, including callback,
  ticket issuance, session login, scan and duplicate scan.
- The customer homepage introduction was redesigned; failure messaging, focus
  styles and narrow navigation received targeted changes. Other routes have not
  received a complete redesign or comprehensive accessibility review.

## Evidence

- `python -m pytest -q`: 52 passed on PostgreSQL, including two-thread payment
  and scan tests and the boundary snapshot regression.
- A randomly named empty PostgreSQL database was migrated and used for the mock
  end-to-end API test. A separate fresh-schema database and test row were dumped
  and restored into a second temporary database; data and the new migration
  record were verified. The temporary databases were then removed.
- A separate temporary database was migrated to orders 0002, given a legacy order,
  and migrated forward; the order survived 0003 with a null legacy boundary.
- `npm run build`: passed after the changes to the scanner and purchase form.
- `npm audit`: no advisories reported after removing unused form dependencies and
  overriding Next's nested PostCSS. This is not a full security audit.
- `npm run lint`: failed because the existing command requests interactive ESLint
  configuration; no lint result is available.
- `manage.py check` and `makemigrations --check --dry-run`: passed.
- `docker compose --env-file .env.production.example -f docker-compose.production.yml config --no-env-resolution --quiet`: passed. This only validates configuration syntax.
- Both Docker images built before the latest browser-driven fixes; rebuild them
  before deployment. `manage.py check` also ran inside the earlier backend image.
- `manage.py check --deploy` under the existing development environment exited
  zero but reported 29 warnings, including development security settings and
  incomplete OpenAPI schema inference. This is not a production-settings check.
- An isolated configuration-only production check exited zero with 26 warnings:
  HSTS is unset, the intentionally fake test secret is weak, and schema inference
  is incomplete. It did not connect to a payment provider or deploy the system.
- An isolated local PostgreSQL database and explicitly test-only mock gateway were
  used for browser checks. A two-ticket purchase, mock confirmation, ticket
  rendering, staff login, successful manual redemption, duplicate redemption,
  mock cancellation, scanner access restriction, admin lists and settings save
  were observed. With the backend stopped, scanner and admin showed server errors;
  both recovered after restart. This particular run used the local mock gateway.
- Homepage width and document overflow were checked at 320, 360, 430, 768, 1280
  and 1440 pixels. This does not establish responsive behavior for every route.
- Browser testing found and corrected a missing slashless CSRF route, a ticket
  page polling loop, zero-value settings handling, and UTC in a duplicate-scan
  message. The browser test helpers require APP_ENV=testing and an isolated
  `codex_browser_` database and are excluded from the backend container image.
- Actual ZarinPal sandbox browser checks succeeded with the isolated local
  database: one-ticket and two-ticket purchases, displayed IRR/IRT conversion,
  server verification code 100, repeated provider verification code 101,
  duplicate callback, cancellation with no tickets, and manual redemption with
  duplicate rejection. No production payment was attempted.
- At 320px, the scanner header and administrative navigation were corrected and
  rechecked. Other routes and widths are not comprehensively verified for
  accessibility or responsive behavior.

## Remaining blockers and limitations

- Production provider verification amount remains unconfirmed; the sandbox flow
  was verified on 2026-11-02 with rial in both calls. See the discrepancy and
  source in `PRODUCTION_DRAFT.md`. No real payment was made.
- The creation response can be lost before the ownership cookie reaches the
  browser. Repeated same-key requests are rejected to avoid a second payment, but
  secure recovery of that order is not yet implemented. No self-service recovery
  exists after cookies are cleared or a device changes.
- Callback verification after a transient failure requires an administrator to
  retry; robust automated reconciliation and provider-side request idempotency are
  not implemented. New orders snapshot the business-day boundary; older orders
  retain a nullable legacy fallback because their original cutoff is unknown.
- The proposed deployment has not been validated on a VPS with TLS, real domain,
  backup/restore, updates, rollback, load or operational monitoring. Image build
  results must be checked separately. Existing dependency ranges are not locked.
- Responsive, keyboard and assistive-technology tests across all routes, complete
  UI redesign, full endpoint and migration audits, and backup restoration remain.
  Existing database rows were not audited or migrated against a production copy.
- Secrets already exposed by prior versions, including setup passwords and keys,
  must be rotated by the operator; source changes cannot revoke old credentials.
