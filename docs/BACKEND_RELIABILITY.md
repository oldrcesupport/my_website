# Backend Reliability and Concurrency Specification
**Project:** oldrcesupport/my_website  
**Database:** PostgreSQL 18  
**ORM / Framework:** Django 6.1, DRF  

---

## 1. ACID Concurrency & Transaction Architecture

### 1.1 Non-Blocking Multi-Phase Payment Verification
To avoid holding database row locks during external network calls to ZarinPal, `PaymentService.process_callback` is structured into three discrete phases:

```text
[Step 1: Atomic Claim]
  - Open Transaction
  - SELECT FOR UPDATE on PaymentAttempt & Order
  - Verify attempt is in PENDING/REQUESTING state
  - Set status = VERIFYING (acquire distributed lease)
  - Commit & Release PostgreSQL Row Locks

[Step 2: External HTTP I/O (Outside DB Transaction)]
  - Execute ZarinPal verification call via ZarinPalV4Adapter
  - Receive verified: bool, ref_id: str, code: int

[Step 3: Short Atomic Finalization]
  - Open Transaction
  - SELECT FOR UPDATE on PaymentAttempt & Order by ID
  - Check idempotency (if already VERIFIED, return ALREADY_PROCESSED)
  - Update PaymentAttempt status (VERIFIED or FAILED)
  - Update Order status (PAID or PAID_LATE_REVIEW or PAYMENT_FAILED)
  - Issue tickets: exactly order.quantity records with unique cryptographic credentials
  - Commit Transaction
```

### 1.2 Exactly-Once Entrance Check-In
- Check-in employs `Ticket.objects.select_for_update().select_related('order').get(...)`.
- The database enforces row locking so that concurrent scans on the same QR token execute sequentially.
- The first scan updates `status = USED`, `used_at = now_utc`, and writes a `CheckInRecord(result=SUCCESS)`.
- The second scan immediately reads `status == USED` and writes `CheckInRecord(result=ALREADY_USED)` with HTTP 409 conflict.

---

## 2. Integrity Constraints & Invariants

1. **Currency Invariant:** Integer Toman exclusively in database tables. Zero float operations. Rial conversion strictly confined inside payment gateway adapter boundary (1 Toman = 10 Rials).
2. **Business Day Invariant:** Ticket validity interval fixed to `[paid_at, business_day_boundary_utc]`. Future changes to restaurant cutoff configuration never retroactively alter already-issued tickets.
3. **Quantity Invariant:** Exactly `order.quantity` distinct `Ticket` records issued per `Order`. Database constraint enforces `order.tickets.count() == order.quantity`.
4. **Idempotency Invariant:** Unique `idempotency_key` stored on `Order`. Duplicate submissions within 24 hours return the exact existing order without re-requesting a gateway session.

