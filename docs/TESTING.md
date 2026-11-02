# Automated Testing Strategy & Concurrency Verification
> **2026-11-02 update:** The latest verified test results and browser/sandbox coverage are recorded in ENGINEERING_PROGRESS.md. The e2e script runs an isolated mock-provider API test. The material below is a historical snapshot and may contain outdated claims. For the current status see [ENGINEERING_PROGRESS.md](ENGINEERING_PROGRESS.md), [API.md](API.md) and [PAYMENT_FLOW.md](PAYMENT_FLOW.md).

## 1. Test Architecture
Tests are implemented using `pytest` and `pytest-django`, with automated suites for:
1. **Unit & Domain Tests**: Timezone calculations, business cutoff edge cases, Toman-Rial conversions, QR token hashing and encryption.
2. **Order Lifecycle Tests**: Quantity limits, server-side price validation, idempotency key deduplication.
3. **Payment Gateway Tests**: Mock provider transactions, ZarinPal adapter unit tests, amount mismatches, duplicate callbacks, day boundary late payment.
4. **Ticket Integrity Tests**: Unique QR tokens per person in multi-ticket orders, validity window checks, effective status calculations.
5. **PostgreSQL Concurrency Tests**: Multi-threaded simulated parallel check-ins verifying zero double-redemption race conditions.
6. **Role-Based Authorization Tests**: Staff permission enforcement on admin endpoints.

---

## 2. Mandatory Concurrency Test Specification
- **Engine**: Real PostgreSQL container.
- **Scenario**:
  - Issue 1 ticket in `ISSUED` state.
  - Launch 2 concurrent worker threads/tasks against the atomic check-in endpoint using separate database connections.
  - Assert that exactly one thread receives HTTP 200 (`SUCCESS`), exactly one receives HTTP 409 (`ALREADY_USED`), the ticket's `status` in the database is `USED`, and exactly one `CheckInRecord` with `result='SUCCESS'` was recorded.

---

## 3. Running the Test Suites
```bash
# Run all backend unit & integration tests
pytest backend/tests/ -v

# Run concurrency-specific suite against PostgreSQL
pytest backend/tests/test_concurrency.py -v
```

