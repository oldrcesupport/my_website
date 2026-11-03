# Frontend behavior and limits

The Next.js client centralizes requests in `frontend/src/lib/api.ts`, sends
cookies, obtains CSRF cookies for unsafe requests, and distinguishes scanner
business results from network, authentication and server errors. Checkout
normalizes Persian and Arabic phone digits, calculates the display total from
server settings, disables submission while pending, and retains an idempotency
key for the current mounted form. The server remains authoritative for price,
payment and ticket status.

The ticket page polls at four-second intervals while applicable and clears its
timer on unmount. Its callback does not depend on response data, avoiding a
previous repeated-fetch loop. A refresh failure is shown while existing data
remains visible. Admin and scanner session checks show an error for a server
failure rather than treating it as an invalid ticket or an expired login.

The current client does **not** implement a universal typed error hierarchy,
request timeouts, or AbortController for every request. Idempotency does not
provide secure recovery after the creation response is lost or the page reloads.
The homepage and selected scanner/admin states were inspected in a browser;
responsive, keyboard, accessibility and error-path coverage is incomplete. See
`ENGINEERING_PROGRESS.md` for evidence and `RESPONSIVE_QA.md` for prior notes.


## November 2026 update

The public, payment, ticket, scanner and admin pages have been visually refreshed.
The public footer no longer advertises staff/admin links; this is presentation,
not an authorization boundary. Vazirmatn variable font is bundled locally via
`next/font/local`, and the hero uses an illustrative generated WebP asset.
Development and production Next.js artifacts use separate directories.
Checkout rejects mismatched browser origins before order creation. Payment return
distinguishes unavailable ownership/status from pending and offers a retry.
The scanner shows history failures, prevents overlapping scans, asks for camera
access on activation and stops the camera on logout. Physical camera testing,
full accessibility and comprehensive cross-device testing remain outstanding.
