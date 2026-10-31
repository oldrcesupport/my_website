# Silent Failure Audit and Remediation Ledger
**Project:** oldrcesupport/my_website  
**Objective:** Total elimination of swallowed exceptions, false positives, misleading loading states, and phantom fallbacks.

---

## Catalog of Audited Silent Failure Vectors

### 1. Homepage Restaurant Settings Fallback
- **Defect:** `frontend/src/app/page.tsx` catches fetch errors and returns `null`. The page then silently substituted `ticketPrice = 100000`, falsely presenting a demo price to visitors when the backend was offline.
- **Resolution:**
  - Create an explicit `SettingsErrorState` component.
  - Disable ticket purchase completely until authoritative settings are verified.
  - Show a clear Persian error message: «ارتباط با سامانه مدیریت سالن موقتاً برقرار نشد. لطفاً مجدداً تلاش فرمایید.» with a retry button.

### 2. Purchase Form Fail-Open on Unavailable Settings
- **Defect:** In `frontend/src/components/home/TicketPurchaseForm.tsx`, `isSalesDisabled = settings ? !settings.sales_enabled : false`. If `settings` was `null`, `isSalesDisabled` evaluated to `false`, leaving checkout enabled on offline settings.
- **Resolution:**
  - Enforce strict fail-closed: `isSalesDisabled = !settings || !settings.sales_enabled`.
  - Disable quantity inputs and the payment submit button whenever `!settings`.

### 3. Masking Gateway Rejection Codes in Scanner
- **Defect:** `frontend/src/app/staff/scanner/page.tsx` previously caught errors and defaulted to `INVALID_TOKEN` for HTTP 500, 401, or network dropouts.
- **Resolution:**
  - Standardize machine-readable error responses (`code: NETWORK_ERROR | SERVER_ERROR | FORBIDDEN | EXPIRED | ALREADY_USED | INVALID_TOKEN`).
  - Distinguish between "بلیت نامعتبر است" and "ارتباط با سرور قطع شد - تلاش مجدد".
  - Provide an immediate retry button for transient network failures.

### 4. Continuous Scanning Frame Collision
- **Defect:** Video frame scanner in `frontend/src/app/staff/scanner/page.tsx` did not freeze on detection. It submitted the same QR token repeatedly in milliseconds, triggering an immediate `ALREADY_USED` 409 conflict that masked the initial successful redemption.
- **Resolution:**
  - Call `html5QrCode.pause(true)` immediately upon first frame detection.
  - Retain camera pause until staff operator presses «اسکن بلیت بعدی».
  - Add client-side timestamp debounce (6000ms window) for duplicate frames.

### 5. Silent In-Flight Polling Memory Leak
- **Defect:** In `frontend/src/app/tickets/[orderId]/page.tsx`, `setInterval` continued polling even when tab was in background, network was disconnected, or order was in terminal state.
- **Resolution:**
  - Hook into `document.addEventListener('visibilitychange')`.
  - Pause background polling when `document.hidden`.
  - Stop polling permanently once all tickets are redeemed or marked cancelled.
  - Attach `AbortController` to cancel in-flight queries upon unmount.

