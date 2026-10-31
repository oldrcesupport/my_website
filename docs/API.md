# REST API Specification (OpenAPI v3 Aligned)

## Base URL
`/api/v1/`

---

## 1. Public Endpoints

### 1.1 `GET /api/v1/public/settings/`
Retrieves public brand information, current pricing, currency label, demo price status, and business cutoff details.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "restaurant_name": "نام رستوران",
  "tagline": "",
  "description": "",
  "address": "",
  "phone": "",
  "currency_unit": "TOMAN",
  "currency_label": "تومان",
  "ticket_price_toman": 100000,
  "is_demo_price": true,
  "sales_enabled": true,
  "business_timezone": "Asia/Tehran",
  "business_day_cutoff": "00:00:00",
  "current_business_date": "2026-10-31",
  "sales_cutoff_active": false
}
```

### 1.2 `POST /api/v1/orders/`
Creates a guest checkout order and initiates a payment gateway transaction.
- **Auth**: None
- **Headers**: `Idempotency-Key` (optional string)
- **Request Body**:
```json
{
  "purchaser_name": "علی محمدی",
  "purchaser_phone": "09121234567",
  "purchaser_email": "ali@example.com",
  "quantity": 2
}
```
- **Response `201 Created`**:
```json
{
  "order_public_id": "c1f7b8b2-4d22-44c1-92b1-5dfbe1d49102",
  "quantity": 2,
  "unit_price_toman": 100000,
  "total_price_toman": 200000,
  "currency": "TOMAN",
  "business_date": "2026-10-31",
  "payment_deadline": "2026-10-31T08:35:00Z",
  "payment_redirect_url": "https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000000000000",
  "guest_access_token": "agt_7f9b8c1..."
}
```

### 1.3 `GET /api/v1/orders/{public_id}/status/`
Polls or verifies current order state.
- **Auth**: Guest Access Token (Bearer header or cookie `guest_access_token`)
- **Response `200 OK`**:
```json
{
  "order_public_id": "c1f7b8b2-4d22-44c1-92b1-5dfbe1d49102",
  "status": "PAID",
  "quantity": 2,
  "total_price_toman": 200000,
  "paid_at": "2026-10-31T08:32:15Z",
  "tickets_issued": 2
}
```

### 1.4 `GET /api/v1/orders/{public_id}/tickets/`
Retrieves purchased ticket passes and rendered QR data.
- **Auth**: Guest Access Token (header or cookie)
- **Response `200 OK`**:
```json
{
  "order_public_id": "c1f7b8b2-4d22-44c1-92b1-5dfbe1d49102",
  "purchaser_name": "علی محمدی",
  "business_date": "2026-10-31",
  "tickets": [
    {
      "public_id": "e93ab210-911b-4328-98e3-fa4a8d4c9a01",
      "ticket_number": "TKT-20261031-0001",
      "status": "ISSUED",
      "effective_status": "VALID",
      "valid_from": "2026-10-31T08:32:15Z",
      "valid_until": "2026-10-31T20:30:00Z",
      "qr_payload": "https://restaurant.example/v/t/7f8a9b...",
      "qr_token": "7f8a9b..."
    }
  ]
}
```

### 1.5 `GET /api/v1/payments/zarinpal/callback/`
Server-side callback receiver when customer is redirected back from ZarinPal.
- **Parameters**: `Authority`, `Status`
- Performs server-to-server verification, confirms amount in Rial, updates Order & PaymentAttempt atomically, issues tickets, and redirects to frontend `/payment/return?order_id=...`.

---

## 2. Staff Scanner Endpoints

### 2.1 `POST /api/v1/staff/check-in/`
Atomic check-in and redemption of a scanned ticket credential.
- **Auth**: Staff JWT or Session (`STAFF_SCANNER`, `ADMIN`, or `SUPER_ADMIN`)
- **Request Body**:
```json
{
  "qr_token": "7f8a9b...",
  "scanner_device_id": "ipad-entrance-01"
}
```
- **Response `200 OK` (Success)**:
```json
{
  "result": "SUCCESS",
  "message": "ورود مجاز است",
  "ticket_number": "TKT-20261031-0001",
  "scanned_at": "2026-10-31T18:45:10Z"
}
```
- **Response `409 Conflict` (Already Used)**:
```json
{
  "result": "ALREADY_USED",
  "message": "این بلیت قبلاً استفاده شده است",
  "ticket_number": "TKT-20261031-0001",
  "previously_used_at": "2026-10-31T18:10:02Z"
}
```
- **Response `400 Bad Request` (Expired / Invalid / Unpaid)**:
```json
{
  "result": "EXPIRED",
  "message": "مهلت اعتبار بلیت منقضی شده است (مربوط به روز گذشته)"
}
```

### 2.2 `GET /api/v1/staff/check-in/history/`
Returns the 20 most recent scans performed by the authenticated staff user.

---

## 3. Administrative Endpoints (Admin & Super Admin)

### 3.1 Authentication
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/logout/`
- `GET /api/v1/auth/me/`

### 3.2 Operational Dashboard
- `GET /api/v1/admin/dashboard/`
Returns real KPI stats:
- `today_paid_tickets_count`
- `today_revenue_toman`
- `today_checkins_count`
- `today_unused_valid_tickets`
- `pending_payments_count`
- `recent_orders`
- `recent_checkins`

### 3.3 Management
- `GET /api/v1/admin/orders/` (Pagination, search by phone, status filter)
- `GET /api/v1/admin/orders/{id}/`
- `GET /api/v1/admin/tickets/` (Search by ticket number, filter by date & status)
- `POST /api/v1/admin/tickets/{id}/cancel/` (Super Admin or Admin only, records audit log)
- `GET /api/v1/admin/payments/` (Status, authority, amount)
- `POST /api/v1/admin/payments/{id}/retry-verification/` (Re-checks unverified gateway session)
- `GET /api/v1/admin/settings/`
- `PATCH /api/v1/admin/settings/` (Update restaurant name, demo price, cutoff, sales status)
- `GET /api/v1/admin/staff/`
- `POST /api/v1/admin/staff/`
- `PATCH /api/v1/admin/staff/{id}/`

