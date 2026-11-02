# Staff session migration

Reviewed against the current implementation on 2026-11-02.

Staff API authentication now uses Django's server-side session cookie. The login
response no longer contains a DRF token, and the API no longer authenticates
`Authorization: Token ...`. Existing staff clients must sign in again.

Serve the UI and `/api/` from the same HTTPS origin (for example, route `/api/`
to Django through the frontend reverse proxy). Keep `NEXT_PUBLIC_API_URL` empty.
The browser obtains the CSRF cookie from `GET /api/v1/auth/csrf/` and sends its
value in `X-CSRFToken` for unsafe requests, including login. Session cookies are
HttpOnly; production sets Secure on session and CSRF cookies. Configure Django's
trusted hosts and CSRF origins for the actual public origin. Do not expose the
backend directly as a separate cross-origin browser API without a separately
reviewed cookie and CSRF design.

New ticket QR codes contain the one-time admission token as text instead of a
URL. The scanner continues to accept old `/verify/` payloads for existing
tickets. Old URL-style QR codes can leak in browser or proxy history; operational
handling of already issued codes should take that into account.

This is an authentication migration, not a production deployment guide. Existing
deployment and live payment configurations still require end-to-end validation.
