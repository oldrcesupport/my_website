# Comprehensive Regression Test Plan
**Project:** oldrcesupport/my_website  

---

## 1. Test Architecture by Domain

### Group A: System & API Failure Resilience
- `test_api_backend_unavailable_fails_closed`: Verifies homepage renders error state and purchase is blocked if backend is unreachable.
- `test_checkout_disabled_when_sales_disabled`: Verifies orders cannot be submitted when sales are toggled off in settings.

### Group B: Checkout & Validation Integrity
- `test_create_order_valid_payload`: Validates successful order creation, integer Toman price calculation, and guest token issuance.
- `test_invalid_phone_rejected`: Rejects malformed phone numbers (missing 09 prefix, non-digit characters, short lengths).
- `test_persian_arabic_phone_digits_normalized`: Ensures numbers entered in Persian/Arabic numerals are stored as standard ASCII digits.
- `test_order_idempotency_key_duplicate_submission`: Ensures submitting identical idempotency key returns existing order without creating duplicate database records.

### Group C: Guest Ownership & IDOR Defense (Phase 2.1)
- `test_anonymous_cannot_access_paid_order_tickets`: Rejects unauthorized ticket viewing even when order status is `PAID`.
- `test_anonymous_cannot_access_ticket_qr_image`: Rejects unauthorized QR PNG image access without valid guest credential or staff session.
- `test_cross_user_order_access_prevented`: Rejects customer A accessing customer B's order using their own valid guest credential.
- `test_legitimate_guest_owner_access_succeeds`: Confirms valid guest token grants full access to digital tickets and QR barcodes.
- `test_raw_token_not_exposed_in_ticket_pass_serializer`: Ensures raw unencrypted QR secrets are absent from JSON serialized output.

### Group D: Payment Lifecycle & Concurrency (Phase 2.2 & Phase 4)
- `test_malicious_origin_header_ignored_in_callback`: Confirms payment callback destination strictly uses server-configured URL, ignoring malicious `Origin` headers.
- `test_non_blocking_multiphase_verification`: Confirms database row locks are not held during external gateway HTTP verification.
- `test_duplicate_payment_callback_idempotency`: Confirms duplicate callback does not issue duplicate tickets.
- `test_late_payment_at_business_day_boundary`: Confirms payment verified after cutoff moves order to `PAID_LATE_REVIEW` without issuing expired tickets.

### Group E: Atomic Check-In & Scanner Invariants (Phase 6)
- `test_successful_first_scan_and_redemption`: Confirms single-use check-in permanently marks ticket as `USED`.
- `test_duplicate_scan_rejected_already_used`: Confirms second scan returns HTTP 409 `ALREADY_USED`.
- `test_simultaneous_concurrent_scan_race_condition`: PostgreSQL multi-threaded concurrency test proving exactly one scan succeeds.
- `test_unknown_token_safe_logging`: Confirms raw token credentials are never saved into `CheckInRecord.notes`.

### Group F: Role Permissions & Staff Access
- `test_anonymous_cannot_access_admin_dashboard`: Confirms unauthenticated access to admin endpoints is rejected.
- `test_scanner_staff_cannot_access_financial_metrics`: Confirms entrance scanner role receives HTTP 403 on financial statistics and order lists.
- `test_admin_cannot_alter_pricing_without_superadmin`: Confirms only superuser can update ticket prices.
- `test_predictable_staff_password_rejected`: Confirms staff creation without explicit password raises validation error.

