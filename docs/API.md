# API reference

Current as of 2026-11-02. See `backend/config/urls.py` and the serializers for
the authoritative implementation. The generated OpenAPI schema has known
inference warnings and is not a complete contract.

Serve the frontend and `/api/` on the same origin. Staff authentication uses a
Django session cookie, not JWT or DRF tokens. Before login and other unsafe
session requests, `GET /api/v1/auth/csrf/` and send the `csrftoken` value in
`X-CSRFToken`. Login returns `user` and an HttpOnly session cookie, not a token.

## Public and guest endpoints

| Method and path | Behavior |
|---|---|
| `GET /api/v1/health/` | Database connectivity probe. |
| `GET /api/v1/public/settings/` | Public settings; `ticket_price_toman` can be null if unavailable, with sales disabled. |
| `POST /api/v1/orders/` | Guest order plus gateway request; body includes `purchaser_name`, `purchaser_phone`, `quantity`, and optional `purchaser_email`. Optional `Idempotency-Key` is at most 128 characters. |
| `GET /api/v1/orders/{public_id}/status/` | Owner or administrator only; returns `public_id`, `status`, `tickets_count`, `reference_id` and order information. |
| `GET /api/v1/orders/{public_id}/tickets/` | Owner or administrator only; returns individual passes, including `qr_payload` and `qr_data_uri`. |
| `GET /api/v1/tickets/{public_id}/qr/` | Owner or administrator only; PNG. `.png` is also accepted. |
| `GET /api/v1/payments/zarinpal/callback/` | Provider browser return with `Authority` and `Status`; server verification precedes issuance. |

The order creation response contains `order_public_id`, `quantity`,
`unit_price_toman`, `total_price_toman`, `currency_unit`, `business_date`,
`payment_deadline` and `payment_redirect_url`. It sets HttpOnly guest cookies;
it does not return the guest ownership token in JSON. Existing clients may send
`X-Guest-Token` or Bearer credentials, but browser clients use cookies. A
repeated key returns 409; recovery after a lost creation response remains open.

`qr_payload` contains the **one-time admission credential**, and `qr_data_uri`
encodes the same credential in an image. Treat both as sensitive: only the owner
or an administrator may receive them; never log or put them in a URL. Historical
URL-format QR codes are still accepted by the scanner.

## Staff and administration

- `POST /api/v1/auth/login/`, `POST /api/v1/auth/logout/`, `GET /api/v1/auth/me/`.
- `POST /api/v1/staff/check-in/`: `qr_token` and optional `scanner_device_id`;
  `SUCCESS` is 200, `ALREADY_USED` 409, `INVALID_TOKEN` 404, and expired,
  cancelled or unpaid states 400. The body includes `result`, `message`,
  `ticket_number`, `scanned_at`, and `used_at`.
- `GET /api/v1/staff/check-in/history/`: up to 30 recent records; scanner
  accounts see their own.
- Admin endpoints include dashboard, orders and order detail, tickets and ticket
  cancellation, payments and verification retry, settings, staff and audit logs.
  List views currently cap results at 100 rather than implementing full
  pagination. Scanner accounts cannot use administrative endpoints.

Guest and staff permissions are enforced server-side. Session-authenticated
unsafe requests require CSRF. Do not assume a successful HTTP redirect or
frontend query parameter means a payment was verified.
