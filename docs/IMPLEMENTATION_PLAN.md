# Implementation Plan: Premium Live Music Restaurant Ticketing Platform

## 1. Project Overview & Architectural Vision
This project is a dedicated admission ticketing platform for the live-music area of a premium restaurant. It is architected as a modular monolith:
- **Backend**: Python 3.14 + Django 6.1 + Django REST Framework + PostgreSQL 18.
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS (v4) + Lucide Icons + Vazirmatn Variable Persian font.
- **Payment Gateway**: ZarinPal v4 REST API Sandbox integration (with server-to-server verification, Toman-to-Rial conversion, and idempotency guarantees) + Mock Provider for automated tests.
- **Security & Concurrency**: Cryptographic QR tokens, row-level PostgreSQL locking (`select_for_update`) for atomic check-in, guest order access tokens, and strict role-based access control (Super Admin, Admin, Check-in Staff).
- **Design System**: Warm, light-themed premium hospitality editorial aesthetic (70–80% `#F5F0E7` / `#FFFCF6`, `#203D33` deep forest green, `#C3A16A` brass/gold accent), RTL-first Persian interface (`fa-IR`, `TOMAN`).

---

## 2. Phased Execution Roadmap

### Phase 1: Planning, Audit & Documentation
- [x] Audit workspace, runtime environment (Python 3.14.7, Node 26.13, npm 11.20, Docker Compose).
- [x] Draft `docs/IMPLEMENTATION_PLAN.md`.
- [x] Create core specifications: `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, `ERD.md`, `API.md`, `PAYMENT_FLOW.md`, `ZARINPAL_SANDBOX.md`, `TICKET_LIFECYCLE.md`, `BUSINESS_TIME.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `OPEN_QUESTIONS.md`.

### Phase 2: Environment & Database Infrastructure
- [ ] Create Docker Compose configuration for PostgreSQL 18 (`db` service) and development network.
- [ ] Create Python virtual environment and install backend dependencies:
  - `Django>=6.1,<6.2` (or latest compatible Django 6.x release on PyPI; check availability for Python 3.14)
  - `djangorestframework`
  - `psycopg[binary]>=3.2`
  - `django-cors-headers`
  - `cryptography`
  - `qrcode[pil]`
  - `requests`
  - `drf-spectacular`
  - `pytest`, `pytest-django`, `pytest-xdist`, `ruff`
- [ ] Establish environment variable specifications (`.env.example` and local `.env`).

### Phase 3: Domain Models & Business Logic Services
- [ ] **RestaurantSettings**: Singleton configuration model (`restaurant_name`, `tagline`, `logo`, `description`, `address`, `phone`, `ticket_price_toman`, `is_demo_price`, `sales_enabled`, `business_timezone`, `business_day_cutoff`, `capacity_enabled`, `capacity_policy`, `capacity_limit`).
- [ ] **BusinessTimeService**: Timezone calculations (`Asia/Tehran`), configurable day cutoff (e.g. `00:00`), calculating business dates, start/end boundaries, and ensuring ticket validity intervals are stored immutably in UTC.
- [ ] **Order**: Customer order entity with guest purchaser information, price snapshot, idempotency key, business date, status state-machine (`PENDING_PAYMENT`, `PAID`, `PAYMENT_FAILED`, `CANCELLED`, `EXPIRED`, `PAID_LATE_REVIEW`, `REFUNDED`), and guest access token hash.
- [ ] **PaymentAttempt**: Payment tracking per order (`provider`, `authority`, `amount_toman`, `amount_rial`, `status`, `reference_id`, `idempotency_key`, gateway payload logging sanitized).
- [ ] **Ticket**: Individual ticket per person (`order`, `public_id`, `qr_token_hash`, `encrypted_qr_token`, `status`, `business_date`, `valid_from`, `valid_until`, `used_at`, `cancelled_at`).
- [ ] **CheckInRecord**: Durable audit entry for each scan attempt (`ticket`, `staff_user`, `result`, `scanned_at`, `scanner_device_id`).
- [ ] **AuditLog**: Sensitive administrative operation logs.
- [ ] **QR Cryptography Service**: Secure 256-bit entropy token generation, hashing for lookups, symmetric encryption (Fernet / AES-GCM) at rest, payload rendering format.

### Phase 4: ZarinPal Payment Integration & Workflows
- [ ] ZarinPal v4 Sandbox Adapter:
  - Currency conversion: 1 Toman = 10 Rials at the boundary.
  - Request endpoint: `https://sandbox.zarinpal.com/pg/v4/payment/request.json`.
  - StartPay redirect: `https://sandbox.zarinpal.com/pg/StartPay/{authority}`.
  - Verify endpoint: `https://sandbox.zarinpal.com/pg/v4/payment/verify.json`.
  - Strict server-to-server verification; duplicate callback protection; result codes 100/101 handling.
- [ ] Mock Payment Adapter for automated CI/unit tests.
- [ ] Order checkout service: Quantity validation, cutoff margin validation (e.g., minimum 5 minutes before business-day cutoff), atomic order creation.
- [ ] Payment callback processor: Transactional verification, boundary check (moving to `PAID_LATE_REVIEW` if confirmed after business date expired), atomic issuance of exactly `N` tickets with unique QR tokens.

### Phase 5: Check-In Service & Atomic Concurrency
- [ ] Atomic check-in endpoint: `POST /api/v1/staff/check-in/`.
- [ ] PostgreSQL `select_for_update()` row-level locking to guarantee zero race conditions on concurrent scans.
- [ ] Verification rules: exists, paid order, status ISSUED, current time within `[valid_from, valid_until]`, not already used, not cancelled.
- [ ] Immediate status transition to `USED` and persistence of `CheckInRecord`.

### Phase 6: REST API & Role-Based Authorization
- [ ] Public Endpoints:
  - `GET /api/v1/public/settings/` (Branding, ticket price, demo notice, sales status, currency).
  - `POST /api/v1/orders/` (Guest checkout, idempotency key).
  - `GET /api/v1/orders/{public_id}/` (Protected by guest order access token).
  - `GET /api/v1/payments/zarinpal/callback/` (Server-side callback handling).
  - `GET /api/v1/orders/{public_id}/tickets/` (Protected guest tickets view).
- [ ] Staff Endpoints:
  - `POST /api/v1/staff/check-in/`
  - `GET /api/v1/staff/check-in/history/`
- [ ] Admin Endpoints:
  - `POST /api/v1/auth/login/`, `POST /api/v1/auth/logout/`, `GET /api/v1/auth/me/`
  - `GET /api/v1/admin/dashboard/` (Real operational metrics, zero fabricated numbers).
  - `GET /api/v1/admin/orders/`, `GET /api/v1/admin/orders/{id}/`
  - `GET /api/v1/admin/tickets/`, `POST /api/v1/admin/tickets/{id}/cancel/`
  - `GET /api/v1/admin/payments/`, `POST /api/v1/admin/payments/{id}/retry-verification/`
  - `GET /api/v1/admin/settings/`, `PATCH /api/v1/admin/settings/`
  - `GET /api/v1/admin/staff/`, `POST /api/v1/admin/staff/`, `PATCH /api/v1/admin/staff/{id}/`
  - `GET /api/v1/admin/reports/`
- [ ] OpenAPI 3.0 schema generation via `drf-spectacular`.

### Phase 7: Customer-Facing Frontend (Next.js & Design System)
- [ ] Setup Next.js App Router project with TypeScript, Tailwind CSS, Lucide React, and Vazirmatn Variable font.
- [ ] Visual Identity & Theme Configuration:
  - Warm light palette: Background `#F5F0E7`, Surface `#FFFCF6`, Primary `#203D33`, Accent `#C3A16A`, Terracotta `#A85E48`, Border `#E6DED1`.
  - RTL-first typography, Persian number formatting, Toman currency styling.
- [ ] Public Customer Pages:
  - Refined Navigation Header (editable brand name, navigation links, buy CTA).
  - Hero Section (warm, high-hospitality ambiance, clear message: separate live-music admission, price in Toman, 1-person admission).
  - Live Music Experience section.
  - Interactive Ticket Purchase section (quantity selector, live calculation in Toman, demo price banner if applicable, guest checkout form).
  - How It Works process steps.
  - FAQ section (validity today only, single person, QR delivery, live music vs dining area).
  - Footer with editable restaurant identity and legal links.
- [ ] Checkout Flow & Status Pages:
  - Instant client validation + loading states + double submission prevention.
  - Payment redirect to ZarinPal Sandbox.
  - Payment Return / Callback status page (Success, Failure, Pending/Late Review).
  - Ticket Pass Display page: Individual cards with distinct QR codes, ticket public ID, validity interval, print / download capability.

### Phase 8: Custom Administration Dashboard & Staff Scanner
- [ ] Staff Scanner Interface:
  - Responsive mobile-first interface for entrance staff.
  - Live camera QR scanning with fallback to manual code entry.
  - Clear multi-state feedback (Valid & Checked In, Already Used with timestamp, Expired, Invalid, Unpaid).
  - Recent scan history drawer.
- [ ] Custom Admin Panel:
  - Refined light admin layout with deep forest green sidebar.
  - Real-time KPIs: Today's paid tickets, today's revenue in Toman, check-in count, unused valid tickets, pending reviews.
  - Orders management table (search, filter by status, view tickets).
  - Tickets management table (search by ticket ID, status, audit).
  - Payments management table (provider status, retry verification action).
  - Staff management (roles: Super Admin, Admin, Check-in Staff).
  - Restaurant settings form (name, address, phone, price, demo toggle, cutoff time, sales toggle).

### Phase 9: Testing, Quality Assurance & Concurrency Verification
- [ ] Unit & Service tests: Business day calculations, cutoff shifts, price/Rial conversions, QR token cryptography, state machines.
- [ ] Order & Payment tests: Checkout flow, mock provider, ZarinPal adapter tests, duplicate callbacks, day boundary late payment.
- [ ] Concurrency tests on PostgreSQL: Multi-threaded / parallel requests scanning the exact same QR code simultaneously to verify single-use integrity.
- [ ] Permission tests: Staff vs Admin vs Super Admin vs anonymous boundaries.
- [ ] Frontend build verification: `npm run build`, responsive design checks (360px, 390px, 768px, 1440px).

### Phase 10: Documentation & Deployment Handover
- [ ] Complete all 14 markdown documentation files in `docs/`.
- [ ] Comprehensive `README.md` and sanitized `.env.example`.
- [ ] Seed script / management command `setup_restaurant` for initial demo data and superadmin creation.

