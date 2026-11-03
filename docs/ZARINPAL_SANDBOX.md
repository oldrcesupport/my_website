# ZarinPal v4 REST API Sandbox Integration Specification

> Verification on 2026-11-02: an isolated local checkout used the actual
> sandbox with the all-zero test merchant. The gateway displayed 1,000,000 IRR
> for 100,000 Toman, returned code 100 to server-side verification, and returned
> code 101 with a reference on a repeated provider verification. A separate
> cancellation issued no tickets; a two-ticket purchase displayed 2,000,000 IRR
> and issued two tickets. These are sandbox observations, not a guarantee of
> current production behavior or a substitute for provider confirmation.

> Rechecked on 2026-11-03: a two-ticket sandbox checkout returned to the same `127.0.0.1` origin, issued two tickets, and manual admission rejected a repeated scan. This was not a live payment.

## 1. Provider Endpoints

### 1.1 Development Sandbox Endpoints
- **Payment Request**:
  `POST https://sandbox.zarinpal.com/pg/v4/payment/request.json`
- **StartPay (Customer Gateway Interface)**:
  `GET https://sandbox.zarinpal.com/pg/StartPay/{authority}`
- **Payment Verification**:
  `POST https://sandbox.zarinpal.com/pg/v4/payment/verify.json`

### 1.2 Production Endpoints (Disabled by default)
- `POST https://payment.zarinpal.com/pg/v4/payment/request.json`
- `GET https://payment.zarinpal.com/pg/StartPay/{authority}`
- `POST https://payment.zarinpal.com/pg/v4/payment/verify.json`

---

## 2. Currency Conversion: Toman to Rial Rule
The internal application currency and database representation is integer **Toman**.

This implementation sends **Rial** explicitly. That choice was verified against
the sandbox in the scenarios above; the production verification contract still
requires confirmation.

```python
# Absolute Provider Boundary Rule
amount_rial = amount_toman * 10
```

- When constructing the JSON request payload for `/request.json`:
  `"amount": amount_rial`
- When constructing the verification payload for `/verify.json`:
  `"amount": amount_rial`
- **Current implementation**: verification sends the same Rial amount as the
  request. Do not treat this sandbox observation as production certification.

---

## 3. Payload Specifications

### 3.1 Payment Request Payload
```json
{
  "merchant_id": "00000000-0000-0000-0000-000000000000",
  "amount": 2000000,
  "currency": "IRR",
  "description": "خرید بلیت ورودی اجرای زنده - سفارش c1f7b8b2",
  "callback_url": "http://localhost:8000/api/v1/payments/zarinpal/callback/",
  "metadata": {
    "mobile": "09121234567"
  }
}
```

### 3.2 Payment Request Response
```json
{
  "data": {
    "code": 100,
    "message": "Success",
    "authority": "A00000000000000000000000000000000000",
    "fee_type": "Merchant",
    "fee": 0
  },
  "errors": []
}
```

### 3.3 Payment Verification Payload
```json
{
  "merchant_id": "00000000-0000-0000-0000-000000000000",
  "amount": 2000000,
  "authority": "A00000000000000000000000000000000000"
}
```

### 3.4 Payment Verification Response Codes
- `code: 100`: Transaction verified successfully.
- `code: 101`: Transaction was already verified earlier.
- `code: -50`: Amount does not match the request amount.
- `code: -51`: Session expired or invalid authority.
- `code: -52`: Operation failed on gateway.

---

## 4. Safety Controls & Production Safeguards
1. `LIVE_PAYMENTS_ENABLED` is `false` by default.
2. If `APP_ENV == 'production'`, startup checks verify that:
   - `ZARINPAL_ENV` is set to `production`.
   - `LIVE_PAYMENTS_ENABLED` is explicitly `true`.
   - `ZARINPAL_MERCHANT_ID` is not the zero placeholder UUID.
   - `IS_DEMO_PRICE` is `false`.
3. If any of the above safety constraints fail in production mode, the application halts with a detailed configuration exception.

