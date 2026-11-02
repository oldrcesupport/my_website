# Comprehensive Forensic Bug Audit
> **2026-11-02 update:** This audit, plan or report records an earlier snapshot; its claims and test results are historical, not current production-readiness evidence. The material below is a historical snapshot and may contain outdated claims. For the current status see [ENGINEERING_PROGRESS.md](ENGINEERING_PROGRESS.md), [API.md](API.md) and [PAYMENT_FLOW.md](PAYMENT_FLOW.md).
**Project:** oldrcesupport/my_website (Premium Live Music Restaurant Ticketing Platform)  
**Date:** 2026-10-31  
**Severity Framework:**  
- **P0**: Critical Security, Financial Integrity, Unauthorized Data Exposure, or Concurrency Corruption  
- **P1**: Major Functional Defect, Silent Workflow Failure, Authentication/Fulfillment Breakdown  
- **P2**: UX, Responsive, Performance, or Reliability Defect  
- **P3**: Minor Visual, Documentation, or Maintainability Polish  

---

## Forensic Defect Ledger

### BUG-001 (Severity: P0) — Unauthorized IDOR Fallback on Paid Orders
- **File & Function:** `backend/apps/orders/views.py` (`OrderStatusView.get`), `backend/apps/tickets/views.py` (`OrderTicketsView.get`, `TicketQrImageView.get`)
- **Reproduction Steps:**
  1. An order is marked `PAID`.
  2. An unauthenticated attacker (or customer B) issues `GET /api/v1/orders/<public_id>/tickets/` with zero tokens or credentials.
- **Actual Behavior:** Authorization check evaluates `if not has_access and order.status in ["PAID", "PAID_LATE_REVIEW"]: has_access = True` and leaks full purchaser names, phone numbers, and scannable tickets.
- **Expected Behavior:** Unauthenticated or unauthorized requests MUST receive `403 Forbidden` or `401 Unauthorized`. A public UUID and paid status do NOT confer ownership.
- **Root Cause:** Insecure authorization fallback added for guest viewing convenience.
- **Remediation:** Remove all `order.status in ["PAID", ...]` access grant bypasses. Enforce strict token/cookie verification or staff authorization.
- **Regression Test:** `backend/tests/test_guest_ownership.py::test_anonymous_cannot_access_paid_order_tickets`

---

### BUG-002 (Severity: P0) — Raw QR Secret Token Leaked in Ticket Serialization
- **File & Function:** `backend/apps/tickets/serializers.py` (`TicketPassSerializer`) & `backend/apps/tickets/views.py` (`OrderTicketsView.get`)
- **Reproduction Steps:**
  1. Inspect response JSON of `GET /api/v1/orders/<public_id>/tickets/`.
- **Actual Behavior:** Response includes `"raw_token": "..."` and `"guest_access_token": "..."`.
- **Expected Behavior:** Raw unencrypted tokens must never be exposed via JSON. Only the rendered QR image data URI or QR download endpoint should be provided.
- **Root Cause:** `raw_token` included in `TicketPassSerializer.Meta.fields` and `guest_access_token` returned in view response.
- **Remediation:** Remove `raw_token` from serializer and `guest_access_token` from JSON payload.

---

### BUG-003 (Severity: P0) — Payment Provider Callback URL Poisoning via Client Request Headers
- **File & Function:** `backend/apps/orders/views.py` (`CreateOrderView.post`)
- **Reproduction Steps:**
  1. Send `POST /api/v1/orders` with header `Origin: https://attacker-controlled-site.com`.
- **Actual Behavior:** Callback URL sent to ZarinPal gateway is dynamically constructed as `https://attacker-controlled-site.com/api/v1/payments/zarinpal/callback/`.
- **Expected Behavior:** Gateway callback destination must strictly use server-controlled `PAYMENT_CALLBACK_URL` from environment configuration.
- **Root Cause:** Client headers (`Origin` / `Referer`) were used to dynamically assemble the payment callback.
- **Remediation:** Hardcode/configure callback URL from server settings, completely ignoring client request headers.
- **Regression Test:** `backend/tests/test_payments.py::test_malicious_origin_header_ignored_in_callback`

---

### BUG-004 (Severity: P0) — Database Row Locking During Third-Party Network I/O
- **File & Function:** `backend/apps/payments/services.py` (`PaymentService.process_callback`)
- **Reproduction Steps:**
  1. ZarinPal callback arrives.
  2. Transaction begins with `select_for_update()`.
  3. External network call `adapter.verify_payment(...)` is executed while the transaction is open.
- **Actual Behavior:** PostgreSQL row lock on `PaymentAttempt` and `Order` is held throughout external HTTP latency. If ZarinPal hangs, DB connections and row locks are exhausted.
- **Expected Behavior:** Multi-phase verification: claim attempt atomically -> release DB transaction -> perform external HTTP verification -> re-acquire short DB transaction with lock to finalize status and fulfill tickets.
- **Root Cause:** Network call placed directly inside `with transaction.atomic():` block.
- **Remediation:** Refactor `process_callback` into a 3-phase lease/verify/commit pipeline.

---

### BUG-005 (Severity: P0) — Predictable Staff Password Fallback
- **File & Function:** `backend/apps/accounts/views.py` (`StaffListCreateView.post`)
- **Reproduction Steps:**
  1. Admin creates staff user without specifying password in request payload.
- **Actual Behavior:** Password defaults to hardcoded `"TempPass123!"`.
- **Expected Behavior:** Explicit password provisioning is mandatory; serializer must raise validation error.
- **Root Cause:** `password = data.get("password") or "TempPass123!"` in view.
- **Remediation:** Enforce `password = serializers.CharField(required=True)` in `StaffCreateUpdateSerializer`.

---

### BUG-006 (Severity: P1) — Silent Hardcoded Price Fallback on Homepage API Failure
- **File & Function:** `frontend/src/app/page.tsx` & `frontend/src/components/home/TicketPurchaseForm.tsx`
- **Reproduction Steps:**
  1. Backend server is stopped or returns 500 error.
  2. User opens homepage.
- **Actual Behavior:** `getSettings()` returns `null`, but page silently falls back to `ticketPrice = 100000` and `isSalesDisabled = false`, giving the illusion that sales are active.
- **Expected Behavior:** Fail-closed design: display a clear error alert, disable checkout, and provide an explicit retry button.
- **Root Cause:** Overly permissive `|| 100000` and `settings ? !settings.sales_enabled : false` defaults.
- **Remediation:** Introduce `SettingsErrorBanner`, explicitly disable purchase when settings unavailable.

---

### BUG-007 (Severity: P1) — Pseudo-Random Idempotency Generation on Purchase
- **File & Function:** `frontend/src/components/home/TicketPurchaseForm.tsx` (`handleSubmit`)
- **Reproduction Steps:**
  1. Form submitted.
- **Actual Behavior:** Idempotency key generated with `Date.now() + Math.random()`, creating weak entropy.
- **Expected Behavior:** Use cryptographically secure `crypto.randomUUID()`, generated once per purchase attempt and reused during network retries.
- **Root Cause:** Math.random() used instead of Web Crypto API.
- **Remediation:** Replace with `crypto.randomUUID()`.

---

### BUG-008 (Severity: P1) — Reusable Guest Access Credentials Stored in Unprotected LocalStorage
- **File & Function:** `frontend/src/app/tickets/[orderId]/page.tsx`, `frontend/src/components/home/TicketPurchaseForm.tsx`
- **Reproduction Steps:**
  1. Customer completes checkout.
  2. Token stored in `localStorage.setItem('token_' + orderId, ...)`.
- **Actual Behavior:** Tokens are permanently stored in client localStorage accessible to any XSS.
- **Expected Behavior:** Rely on scoped HttpOnly cookies set by backend, or short-lived session memory.
- **Root Cause:** Client-side token persistence without HttpOnly flags.
- **Remediation:** Transition guest ownership to scoped HttpOnly cookies (`guest_token_<orderId>`).

---

### BUG-009 (Severity: P1) — Indefinite and Unbounded Ticket Page Polling
- **File & Function:** `frontend/src/app/tickets/[orderId]/page.tsx`
- **Reproduction Steps:**
  1. Open ticket pass page and leave tab open or minimize browser.
- **Actual Behavior:** Unconditional `setInterval` runs every 4 seconds indefinitely, even when tab is hidden or order reached terminal status.
- **Expected Behavior:** Stop polling when document is hidden (`document.hidden`), apply bounded backoff on network failures, stop after terminal check-in, and cancel in-flight requests with `AbortController`.
- **Root Cause:** Naive `setInterval` without lifecycle guards.
- **Remediation:** Implement bounded polling with `visibilitychange` listener and `AbortController`.

---

### BUG-010 (Severity: P1) — Unknown Token Logged into Database Notes
- **File & Function:** `backend/apps/checkin/services.py` (`CheckInService.redeem_ticket`)
- **Reproduction Steps:**
  1. Scanner scans an unknown or malicious QR code.
- **Actual Behavior:** The first 32 characters of raw scanned token are logged directly into `CheckInRecord.notes`.
- **Expected Behavior:** Raw tokens must never be logged. Only safe cryptographic fingerprints (e.g. SHA-256 slice) or generic categories should be stored.
- **Root Cause:** `notes = f"Unknown token/serial: {raw_input[:32]}"`.
- **Remediation:** Replace with `f"sha256:{hashlib.sha256(raw_input.encode()).hexdigest()[:16]}"`.

