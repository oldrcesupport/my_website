# Database Specification & Constraints

## 1. Engine & Database Rules
- **Engine**: PostgreSQL 18.
- **ORM**: Django ORM with native PostgreSQL features.
- **Timestamps**: All timestamps (`created_at`, `valid_from`, `valid_until`, `used_at`, etc.) are timezone-aware and persisted as UTC `timestamptz`.
- **Monetary Types**: Integer amounts in Iranian Toman (`BigIntegerField` or `PositiveIntegerField`). No floating-point data types.
- **UUIDs**: Cryptographically secure UUIDv4 for public identifiers (`public_id`) on Orders and Tickets to prevent enumeration attacks.
- **Row-Level Locking**: Concurrency-critical state transitions utilize `select_for_update()`.

---

## 2. Table Specifications

### 2.1 `restaurant_settings`
Singleton configuration record (constrained to `id=1`).
- `id` (int, PK, default=1)
- `restaurant_name` (varchar 255, default='نام رستوران')
- `tagline` (varchar 255, blank=True)
- `description` (text, blank=True)
- `address` (varchar 500, blank=True)
- `phone` (varchar 50, blank=True)
- `currency_unit` (varchar 20, default='TOMAN')
- `ticket_price_toman` (bigint, default=100000)
- `is_demo_price` (boolean, default=True)
- `sales_enabled` (boolean, default=True)
- `business_timezone` (varchar 50, default='Asia/Tehran')
- `business_day_cutoff` (time, default='00:00:00')
- `checkout_cutoff_margin_minutes` (int, default=5)
- `capacity_enabled` (boolean, default=False)
- `capacity_policy` (varchar 50, default='UNCONFIGURED')
- `capacity_limit` (int, null=True, blank=True)
- `created_at` (timestamptz, auto_now_add=True)
- `updated_at` (timestamptz, auto_now=True)

### 2.2 `orders`
Represents a customer purchase order.
- `id` (bigint, PK)
- `public_id` (uuid, unique, db_index=True)
- `purchaser_name` (varchar 200)
- `purchaser_phone` (varchar 32, db_index=True)
- `purchaser_email` (varchar 254, blank=True)
- `quantity` (positive_integer, check: `quantity > 0 and quantity <= 50`)
- `unit_price_toman` (bigint)
- `total_price_toman` (bigint)
- `currency_unit` (varchar 20, default='TOMAN')
- `business_date` (date, db_index=True)
- `status` (varchar 32, db_index=True)
  - Options: `PENDING_PAYMENT`, `PAID`, `PAYMENT_FAILED`, `CANCELLED`, `EXPIRED`, `PAID_LATE_REVIEW`, `REFUND_PENDING`, `REFUNDED`
- `idempotency_key` (varchar 128, unique=True, null=True, db_index=True)
- `guest_access_token_hash` (varchar 64, db_index=True)
- `payment_deadline` (timestamptz)
- `created_at` (timestamptz, auto_now_add=True, db_index=True)
- `paid_at` (timestamptz, null=True)
- `cancelled_at` (timestamptz, null=True)

### 2.3 `payment_attempts`
Tracks individual gateway transaction sessions for an order.
- `id` (bigint, PK)
- `order_id` (FK -> `orders.id`, on_delete=CASCADE, related_name='payment_attempts')
- `provider` (varchar 50, default='zarinpal')
- `authority` (varchar 100, unique=True, null=True, db_index=True)
- `provider_transaction_id` (varchar 100, blank=True)
- `amount_toman` (bigint)
- `amount_rial` (bigint)
- `status` (varchar 32, default='PENDING', db_index=True)
  - Options: `REQUESTING`, `PENDING`, `VERIFYING`, `VERIFIED`, `FAILED`, `CANCELLED`, `UNKNOWN`, `REVIEW_REQUIRED`
- `idempotency_key` (varchar 128, null=True)
- `gateway_response_code` (int, null=True)
- `reference_id` (varchar 100, blank=True, null=True, db_index=True)
- `gateway_payload` (jsonb, default=dict)
- `created_at` (timestamptz, auto_now_add=True)
- `verified_at` (timestamptz, null=True)
- `last_checked_at` (timestamptz, null=True)

### 2.4 `tickets`
Represents an individual admission credential for exactly one person.
- `id` (bigint, PK)
- `public_id` (uuid, unique, db_index=True)
- `order_id` (FK -> `orders.id`, on_delete=PROTECT, related_name='tickets')
- `ticket_number` (varchar 32, unique=True, db_index=True)
- `qr_token_hash` (varchar 64, unique=True, db_index=True)
- `encrypted_qr_token` (text)
- `status` (varchar 32, default='ISSUED', db_index=True)
  - Options: `ISSUED`, `USED`, `CANCELLED`
- `business_date` (date, db_index=True)
- `valid_from` (timestamptz, db_index=True)
- `valid_until` (timestamptz, db_index=True)
- `created_at` (timestamptz, auto_now_add=True)
- `used_at` (timestamptz, null=True, db_index=True)
- `cancelled_at` (timestamptz, null=True)

### 2.5 `check_in_records`
Permanent audit trail of every scan attempt at the venue entrance.
- `id` (bigint, PK)
- `ticket_id` (FK -> `tickets.id`, on_delete=PROTECT, related_name='check_in_records')
- `staff_user_id` (FK -> `auth_user.id`, on_delete=SET_NULL, null=True)
- `result` (varchar 32, db_index=True)
  - Options: `SUCCESS`, `ALREADY_USED`, `EXPIRED`, `CANCELLED`, `ORDER_UNPAID`, `INVALID_TOKEN`
- `scanned_at` (timestamptz, auto_now_add=True, db_index=True)
- `scanner_device_id` (varchar 128, blank=True)
- `notes` (varchar 255, blank=True)

### 2.6 `audit_logs`
- `id` (bigint, PK)
- `actor_user_id` (FK -> `auth_user.id`, on_delete=SET_NULL, null=True)
- `action` (varchar 100, db_index=True)
- `target_model` (varchar 100)
- `target_id` (varchar 100)
- `metadata` (jsonb, default=dict)
- `created_at` (timestamptz, auto_now_add=True)

