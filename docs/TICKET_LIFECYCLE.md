# Ticket Lifecycle & Entrance Redemption Specification
> **2026-11-02 update:** New QR payloads are raw one-time credentials rather than URLs; they are returned to authorized owners in qr_payload and encoded in qr_data_uri. The material below is a historical snapshot and may contain outdated claims. For the current status see [ENGINEERING_PROGRESS.md](ENGINEERING_PROGRESS.md), [API.md](API.md) and [PAYMENT_FLOW.md](PAYMENT_FLOW.md).

## 1. Ticket States & Transitions

A ticket has an immutable persisted `status` column in the database and an **effective status** dynamically evaluated at runtime.

### 1.1 Persisted Database Statuses
- `ISSUED`: Created upon confirmed payment. Ready for presentation and entry.
- `USED`: Successfully scanned and redeemed at the entrance. Terminal state.
- `CANCELLED`: Voided by an administrator. Terminal state.

### 1.2 Computed Effective Statuses
When queried by client APIs, the effective status is calculated:
1. If `ticket.status == 'CANCELLED'` -> `CANCELLED`
2. If `ticket.status == 'USED'` -> `USED`
3. If `current_utc_time > ticket.valid_until` -> `EXPIRED`
4. If `current_utc_time < ticket.valid_from` -> `NOT_YET_VALID`
5. Otherwise -> `VALID`

This eliminates the need for cron jobs or scheduled workers to proactively update expired records in the database.

---

## 2. Check-In & Redemption Rules
At the venue entrance:
1. **QR Token Extraction**: The scanner parses the QR payload and extracts the raw high-entropy token.
2. **Hash Lookup**: Computes `hash = sha256(raw_token)` and queries the ticket:
   ```python
   ticket = Ticket.objects.select_for_update().get(qr_token_hash=hash)
   ```
3. **Validation Invariants**:
   - Order must be `PAID`.
   - Ticket status must be `ISSUED`.
   - `valid_from <= now <= valid_until`.
   - `used_at` must be `None`.
4. **Redemption Action**:
   - Set `status = 'USED'`.
   - Set `used_at = timezone.now()`.
   - Create `CheckInRecord(ticket=ticket, staff_user=request.user, result='SUCCESS', ...)`.
   - Commit transaction.
5. **Rejection Cases**:
   - If `status == 'USED'`: Return `409 Conflict` (`ALREADY_USED`) with the recorded previous scan timestamp.
   - If `now > valid_until`: Return `400 Bad Request` (`EXPIRED`).
   - If `status == 'CANCELLED'`: Return `400 Bad Request` (`CANCELLED`).
   - If token not found: Return `404 Not Found` (`INVALID_TOKEN`).

