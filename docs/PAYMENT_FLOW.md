# Payment and ticket flow

Current implementation as of 2026-11-03; see `ENGINEERING_PROGRESS.md` for
verified scenarios and remaining risks. The production provider contract is
not yet confirmed; do not enable live payment based on sandbox results alone.

1. Checkout validates input, snapshots price and business-day boundary, creates
   a pending order and requests a gateway session. A successful response sets
   HttpOnly guest cookies and returns the gateway redirect. An idempotency-key
   replay returns 409; it does not recover an order or create a new attempt.
2. The provider redirects the browser to the configured callback. The callback
   cannot grant guest ownership and is not itself proof of payment.
3. A short transaction locks the attempt and order, checks the amount and marks
   the attempt verifying. Provider verification runs outside the transaction.
4. A second transaction locks the records, records the response and, if verified
   before the stored business-day boundary, marks the order paid and issues
   tickets. Late verified payments enter `PAID_LATE_REVIEW` with no tickets.
   An additional verified charge against an already fulfilled order requires
   review and must not issue tickets again.
5. The browser return page fetches the authoritative order status using its
   existing ownership cookie. It does not accept a success query as proof.

The adapter sends integer toman multiplied by ten as IRR for request and
verification. This worked in the observed sandbox tests, including provider
codes 100 and 101 with a reference. It must be independently confirmed for
production; see `ZARINPAL_SANDBOX.md` and `PRODUCTION_DRAFT.md`.

Network errors, unexpected adapter exceptions and malformed verification results are marked `UNKNOWN`; administrator
retry is available, but automatic reconciliation is not. Order creation can
lose its response before the ownership cookie arrives, and a retry cannot yet
recover that order. `payment_deadline` is stored; do not assume an automated
expiration or refund workflow exists. Older orders without `business_day_end`
use the current configured boundary as a legacy fallback.

Guest cookies are host-only: the browser checkout origin must exactly match
`FRONTEND_URL` (scheme, host and port). When an Origin header is present,
checkout rejects a mismatch before creating an order. The callback still uses
only the configured server-side URL; the request Origin never controls its
redirect. In the isolated sandbox browser settings both the callback and return
use `http://127.0.0.1:3000`; do not alternate it with `localhost`. A paid order
created on another host remains accessible only in the original browser and
host while its ownership cookie is present.
