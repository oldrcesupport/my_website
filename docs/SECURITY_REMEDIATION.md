# Security Remediation Plan and Specification
**Project:** oldrcesupport/my_website  
**Standard:** OWASP Top 10 / Application Security & Financial Transaction Isolation  

---

## 1. Threat Matrix & Vulnerability Analysis

| Vulnerability ID | Classification | Surface | Severity | CVSS v3.1 | Status |
|---|---|---|---|---|---|
| SEC-01 | Insecure Direct Object Reference (IDOR) | `/api/v1/orders/<id>/tickets/`, `/status/`, `/qr.png` | Critical | 9.1 | REMEDIATING |
| SEC-02 | Payment Callback Destination Poisoning | `/api/v1/orders/` (`Origin` header reflection) | Critical | 8.8 | REMEDIATING |
| SEC-03 | Predictable / Hardcoded Staff Credentials | `StaffListCreateView` fallback `"TempPass123!"` | High | 8.2 | REMEDIATING |
| SEC-04 | Overly Permissive Global Permissions & CORS | `REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'] = AllowAny` | High | 7.5 | REMEDIATING |
| SEC-05 | Insecure Credential Storage in LocalStorage | Client `localStorage.setItem('staff_token', ...)` | Medium | 6.5 | REMEDIATING |
| SEC-06 | Sensitive Data Exposure in Database Notes | `CheckInRecord.notes` logging raw token prefixes | Medium | 6.0 | REMEDIATING |

---

## 2. Technical Remediation Architectures

### Remediation SEC-01: Zero-Trust Scoped Guest Ownership
1. **Model & Token Generation:**
   - On `POST /api/v1/orders`, `OrderService.create_order` generates a high-entropy guest access token `agt_<32_bytes_urlsafe>`.
   - The token's SHA-256 hash is saved to `order.guest_access_token_hash`.
   - The raw token is encrypted using AES-128-CBC/Fernet via `QRCryptoService` and stored in `order.encrypted_guest_token`.
2. **Delivery & Session Binding:**
   - Server sets an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie named `guest_token_<order_public_id>` (and generic `guest_access_token`).
   - The creator receives the token once in the creation response header / payload.
3. **Strict Authorization Verification:**
   - For every access to `/orders/<id>/status/`, `/orders/<id>/tickets/`, or `/tickets/<id>/qr.png`:
     ```python
     is_authorized_staff = request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)
     if not is_authorized_staff:
         token = extract_guest_token(request, public_id=order.public_id)
         if not token or not order.verify_access_token(token):
             return Response({"error": "عدم دسترسی به این سفارش."}, status=status.HTTP_403_FORBIDDEN)
     ```
   - All `order.status in ["PAID", ...]` bypass conditions are deleted completely.

### Remediation SEC-02: Deterministic Payment Callback Enforcement
1. **Explicit Server Configuration:**
   - Settings strictly enforce `PAYMENT_CALLBACK_URL` from environment (`http://127.0.0.1:8000/api/v1/payments/zarinpal/callback/`).
   - `FRONTEND_PAYMENT_RETURN_URL` strictly configured to whitelist (`http://localhost:3000/payment/return/`).
2. **Zero Client Header Reliance:**
   - Delete all code that dynamically builds callback destinations from `request.headers.get("Origin")` or `request.headers.get("Referer")`.
   - Whitelist verification applied before any HTTP redirect.

### Remediation SEC-03: Elimination of Hardcoded & Fallback Passwords
1. **Serializer Validation:**
   - `StaffCreateUpdateSerializer` marks `password` as `required=True` on user creation.
   - Deletion of `"TempPass123!"` and removal of any published passwords from public `README.md`.
2. **Production Safety Assertions:**
   - Server asserts during startup (`APP_ENV == "production"`) that `SECRET_KEY`, `QR_ENCRYPTION_KEY`, and database passwords do not match development defaults.

### Remediation SEC-04: Least-Privilege DRF Permission Policy
1. **Default Deny:**
   - `DEFAULT_PERMISSION_CLASSES` set to `['rest_framework.permissions.IsAuthenticated']`.
2. **Explicit Public Exceptions:**
   - Public-facing endpoints explicitly declare `permission_classes = [permissions.AllowAny]`:
     - `PublicSettingsView`
     - `CreateOrderView`
     - `OrderStatusView` (protected by guest token verification)
     - `OrderTicketsView` (protected by guest token verification)
     - `TicketQrImageView` (protected by guest token verification)
     - `ZarinPalCallbackView`
     - `LoginView`

