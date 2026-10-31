# Architecture Specification: Modular Monolith

## 1. System Overview
The platform follows a clean **Modular Monolith** architecture pattern. It couples a robust Python/Django backend with a modern Next.js/React frontend, backed by PostgreSQL.

```
+-------------------------------------------------------------+
|                     Next.js Client (App Router)             |
|  - Public Landing & Guest Checkout                          |
|  - Payment Return & Digital Ticket Passes                   |
|  - Entrance Staff Scanner (Camera + Manual Input)           |
|  - Custom Responsive Admin Dashboard                        |
+------------------------------+------------------------------+
                               | HTTPS / JSON REST API
+------------------------------v------------------------------+
|                    Django Backend Application               |
|                                                             |
|  [ Core / Settings ]       [ BusinessTime Service ]         |
|  Singleton config, brand,   Tehran tz, cutoff, expiry       |
|  pricing, capacity policy   calculations                    |
|                                                             |
|  [ Order Engine ]          [ Payment & ZarinPal Adapter ]   |
|  Guest checkout, totals,    v4 REST API, sandbox, Rial      |
|  deadlines, idempotency     conversion, server-to-server    |
|                                                             |
|  [ Ticket Lifecycle ]      [ Staff Scanner & CheckIn ]      |
|  Unique 256-bit QR tokens,  Atomic row lock (for update),   |
|  hashing, encryption        single-use guarantee, audit     |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                 PostgreSQL 18 Database Engine               |
|  - Tables: Settings, Orders, Payments, Tickets, CheckIns,   |
|            AuditLogs, Users/Staff                           |
|  - Strict Foreign Keys, Unique & Check Constraints          |
|  - ACID Row-Level Locking (select_for_update)               |
+-------------------------------------------------------------+
```

---

## 2. Component Boundaries & Responsibilities

### 2.1 Backend Domains (`apps/`)
1. **`apps.core`**:
   - `RestaurantSettings`: Singleton configuration, default brand, demo pricing flag, cutoff time.
   - `AuditLog`: Action logs for sensitive operational events.
2. **`apps.business_time`**:
   - Centralized date & time calculations.
   - Converts UTC to `Asia/Tehran`.
   - Computes current business date based on configured `business_day_cutoff`.
   - Calculates immutable `valid_until` timestamp for issued tickets.
3. **`apps.orders`**:
   - Order creation, guest details, price snapshotting, idempotency keys, order status transitions.
   - Guest order access tokens (secure cookie/token lookup to prevent IDOR).
4. **`apps.payments`**:
   - Abstract payment provider interface.
   - `ZarinPalV4SandboxAdapter`: Sandbox endpoints, currency conversion (Toman -> Rial), StartPay redirect URL builder, server-to-server verification.
   - `MockPaymentAdapter`: Deterministic provider for unit and integration testing.
   - `PaymentAttempt` records, callback status handling, late payment boundary review logic.
5. **`apps.tickets`**:
   - Ticket model with UUID public identifiers.
   - `QRCryptoService`: Generates 256-bit cryptographically secure random tokens; stores SHA-256 hash for O(1) lookup and encrypted token using AES/Fernet.
   - QR code image generator (PNG/SVG formatted for ticket passes).
   - Ticket validity evaluator (computes effective status: `VALID`, `USED`, `EXPIRED`, `CANCELLED`).
6. **`apps.checkin`**:
   - Atomic redemption service (`select_for_update` on ticket record).
   - Generates `CheckInRecord` with scanner metadata and timestamps.
7. **`apps.accounts`**:
   - Staff user management with three distinct roles: `SUPER_ADMIN`, `ADMIN`, `STAFF_SCANNER`.
   - Secure session and token authentication.

---

## 3. Frontend Architecture (`frontend/src/`)
- **`app/(public)/`**: Landing page, brand hero, restaurant atmosphere presentation, live pricing, order configuration.
- **`app/checkout/`**: Responsive guest checkout form with instant validation and double-submission protection.
- **`app/payment/return/`**: Payment return receiver, status poll/verifier, and transition to ticket view.
- **`app/tickets/[orderId]/`**: Responsive digital ticket passes, QR render, print/download view, protected by access token.
- **`app/staff/scanner/`**: Dedicated entrance checkpoint view with live camera scanner, manual code fallback, and instant audio/visual status feedback.
- **`app/admin/`**: Custom-built dashboard with KPI cards, Orders table, Tickets inspection, Payment reconciliation, Staff list, and Restaurant settings.
- **`components/ui/`**: Reusable design system components conforming to the light, warm, editorial palette.

