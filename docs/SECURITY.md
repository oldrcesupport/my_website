# Application Security & Threat Model (OWASP ASVS Aligned)

## 1. Threat Mitigation Strategies

### 1.1 Insecure Direct Object References (IDOR) on Orders & Tickets
- **Risk**: An attacker guesses or enumerates sequential IDs to view another customer's ticket passes and QR codes.
- **Defense**:
  1. Orders and Tickets expose non-sequential UUIDv4 `public_id`s.
  2. Access to `/api/v1/orders/{public_id}/tickets/` strictly requires a high-entropy `guest_access_token` generated at checkout.
  3. The token's SHA-256 hash is verified against `orders.guest_access_token_hash`.
  4. The raw token is stored only in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie and returned in the initial JSON response for immediate client hydration.

### 1.2 QR Credential Forgery & Guessability
- **Risk**: Counterfeiters manufacture fake QR codes.
- **Defense**:
  1. Each ticket credential contains a 256-bit cryptographically secure pseudorandom token (`secrets.token_urlsafe(32)`).
  2. Entropy: >256 bits, practically impossible to brute-force.
  3. The database indexes only `sha256(raw_token)` to prevent plain token disclosure in database snapshots.
  4. The raw token is encrypted at rest using AES-GCM/Fernet via `QR_ENCRYPTION_KEY`.
  5. The QR payload contains zero Personally Identifiable Information (PII) — no customer names, phones, or prices.

### 1.3 Check-In Double-Redemption (Race Condition)
- **Risk**: Two staff members scan the same QR code simultaneously on two different tablets.
- **Defense**:
  1. The redemption endpoint wraps the query and update in a PostgreSQL database transaction.
  2. `Ticket.objects.select_for_update().get(...)` locks the row at the database level.
  3. The second scan request blocks until the first completes, then reads `ticket.status == 'USED'`, immediately rejecting the duplicate with HTTP 409.

### 1.4 Payment Callback Spoofing
- **Risk**: A customer crafts a fake callback request to get free tickets.
- **Defense**:
  1. Returning from the gateway is never treated as proof of payment.
  2. The server independently calls ZarinPal's `/verify.json` endpoint over TLS.
  3. The server confirms that the returned transaction status is valid and that the verified amount in Rial strictly matches `order.total_price_toman * 10`.

### 1.5 Role-Based Authorization
- **Super Administrator**: Can modify pricing, brand settings, cancel tickets, and manage staff.
- **Administrator**: Can view operational dashboard, orders, and tickets.
- **Check-In Staff**: Has access only to `/api/v1/staff/check-in/` and their own recent scans. Forbidden from viewing financial totals, pricing, or modifying configuration.

---

## 2. Secrets Management & Environment Hygiene
- No secrets committed to git.
- `.env.example` provides sanitized template values.
- Development uses safe placeholders; Production requires hardened keys.

