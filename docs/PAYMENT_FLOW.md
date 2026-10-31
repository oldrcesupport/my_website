# Payment Lifecycle & State Machine

## 1. Sequence Diagram: Purchase to Ticket Issuance

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Guest Customer
    participant Frontend as Next.js Web App
    participant Backend as Django API
    participant ZarinPal as ZarinPal v4 Sandbox
    participant DB as PostgreSQL 18

    Customer->>Frontend: Select quantity (e.g. 2) & Enter details
    Frontend->>Backend: POST /api/v1/orders/ (qty, name, phone, Idempotency-Key)
    Backend->>Backend: Validate cutoff margin & server price snapshot
    Backend->>DB: INSERT Order (PENDING_PAYMENT, 5-min deadline)
    Backend->>ZarinPal: POST /pg/v4/payment/request.json (Amount in Rials = Toman * 10)
    ZarinPal-->>Backend: Response { code: 100, authority: "A000..." }
    Backend->>DB: INSERT PaymentAttempt (authority, status=PENDING)
    Backend-->>Frontend: { order_public_id, payment_redirect_url, guest_access_token }
    Frontend->>Customer: Redirect to ZarinPal StartPay
    Customer->>ZarinPal: Submit test payment in Sandbox
    ZarinPal->>Backend: GET /api/v1/payments/zarinpal/callback/?Authority=A000...&Status=OK
    Backend->>DB: Lock Order & PaymentAttempt (select_for_update)
    Backend->>ZarinPal: POST /pg/v4/payment/verify.json (merchant_id, authority, amount_rial)
    ZarinPal-->>Backend: Response { code: 100, ref_id: 12345678 }
    alt Boundary check: Business date still active
        Backend->>DB: UPDATE PaymentAttempt (VERIFIED), Order (PAID)
        Backend->>DB: INSERT 2 distinct Tickets (unique 256-bit QR tokens)
        Backend-->>Customer: Redirect to /payment/return?order_id=...&status=success
    else Boundary check: Verification arrived AFTER business date ended
        Backend->>DB: UPDATE Order (PAID_LATE_REVIEW), NO tickets issued
        Backend-->>Customer: Redirect to /payment/return?order_id=...&status=late_review
    end
    Customer->>Frontend: View Order & Digital Ticket Passes
    Frontend->>Backend: GET /api/v1/orders/{public_id}/tickets/ (Bearer guest_access_token)
    Backend-->>Frontend: Return individual ticket passes with rendered QR codes
```

---

## 2. Order State Machine Transitions

| Current State | Event | Target State | Notes |
|---|---|---|---|
| `*` | Order Initiated | `PENDING_PAYMENT` | Initial state with snapshot price and 5-min deadline |
| `PENDING_PAYMENT` | Verification succeeds before day cutoff | `PAID` | Generates 1..N unique tickets in same transaction |
| `PENDING_PAYMENT` | Verification succeeds AFTER day cutoff | `PAID_LATE_REVIEW` | Money captured, but admission day expired. Alert admin |
| `PENDING_PAYMENT` | Gateway returns NOK / User cancels | `PAYMENT_FAILED` | Safe terminal state |
| `PENDING_PAYMENT` | Payment deadline passes without verify | `EXPIRED` | Order expired, no tickets issued |
| `PAID_LATE_REVIEW` | Admin initiates refund | `REFUND_PENDING` / `REFUNDED` | Handled via admin manual workflow |
| `PAID` | Admin cancels entire order | `CANCELLED` | All child tickets set to `CANCELLED` |

---

## 3. Idempotency & Duplicate Protection
1. **Frontend Double-Submit**: A generated UUID v4 `Idempotency-Key` prevents double order creation on multiple button clicks.
2. **Duplicate Callback**: Gateway callbacks might trigger multiple times. If `PaymentAttempt.status == 'VERIFIED'` and `Order.status == 'PAID'`, subsequent callbacks return the existing order outcome without creating duplicate tickets or running verification twice.
3. **ZarinPal Code 101**: Code 101 signifies that this specific authority was already verified previously. The system accepts code 101 only if the local database already associates this authority with the corresponding order.

