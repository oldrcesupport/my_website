# Security notes

Current as of 2026-11-02; these notes are not a security certification. See
`ENGINEERING_PROGRESS.md` for outstanding risks and verification limits.

- Guest orders use a random ownership credential, stored hashed and encrypted
  in the database and supplied to browsers in HttpOnly SameSite cookies. The
  initial JSON and callback redirect do not expose it. Existing header-based
  guest access remains supported. Production cookie security depends on the
  configured HTTPS deployment.
- Ticket passes include a raw one-time `qr_payload` and a rendered QR image.
  Both are bearer credentials visible to the authorized owner or administrator;
  QR data must not be logged, shared in URLs, or exposed to other guests. New QR
  images contain the token rather than a URL. Ticket token hashes are indexed;
  token material is encrypted at rest with Fernet.
- Staff use Django sessions and CSRF, with explicit scanner, administrator and
  super-administrator checks. `is_staff` alone does not grant scanner or admin
  rights. See `SESSION_AUTH_MIGRATION.md` for deployment topology.
- Payment success depends on server-to-server verification. PostgreSQL locks
  protect payment finalization and ticket redemption. Sandbox verification does
  not prove production readiness or all failure and concurrency scenarios.
- Production settings reject missing or known insecure key material and demo
  pricing. The draft proxy trusts forwarded HTTPS only across its documented
  loopback boundary. Never expose that internal proxy to untrusted clients.
- Previously published credentials and keys may already be compromised; rotate
  them in any existing installation. Source changes do not revoke old secrets.
  Do not commit `.env` or `.env.production` files.

Remaining issues include safe guest recovery after a lost checkout response,
automatic payment reconciliation, provider contract confirmation, and complete
deployment, dependency, access-control and browser security verification.
