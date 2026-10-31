# Requirements Specification: Premium Live Music Restaurant Ticketing Platform

## 1. Business Context & Problem Statement
A high-end restaurant offers dining services in its main dining hall and operates an adjoining, dedicated live-music performance lounge. Customers may enter the restaurant to dine and subsequently choose to enter the live-music lounge. Admission to the live-music lounge requires a separate admission ticket.

This platform exclusively manages and sells admission tickets for the live-music area. It does not manage restaurant table reservations, food/beverage menus, or kitchen POS operations.

---

## 2. Business Rules & Functional Requirements

### 2.1 Ticket Properties & Admissions
1. **Per-Person Admission**: Every issued ticket grants admission to exactly one person.
2. **Unified Pricing**: All live-music admission tickets share the same price. There are no VIP, tier-based, or dynamic pricing schemes.
3. **Multi-Ticket Orders**: Customers may purchase multiple tickets in a single checkout session.
4. **Individual Record & Credential**: Every purchased ticket generates a distinct database record with its own unique, cryptographically secure QR code.
5. **Single-Day Validity**: Tickets are valid **strictly and only for the business day on which they are purchased**.
6. **No Pre-sales or Future Sessions**: Tickets cannot be purchased for future dates or selected concert slots. Live music is a continuous, standard restaurant experience.
7. **Strict Expiration**: A ticket from a past business day is invalid and must be rejected at the entrance.
8. **Single-Use Redemption**: Each ticket can be redeemed exactly once. Upon successful check-in, it is permanently marked as `USED`.
9. **Guest Checkout**: Registration or customer account creation is completely optional. Customers can purchase as guests by providing their full name and mobile phone number.

### 2.2 Currency & Monetary Calculations
1. **Display & Internal Currency**: Iranian Toman (`TOMAN`).
2. **Integer Arithmetic**: All monetary quantities in the database and business logic are stored as positive integers in Toman. No floating-point arithmetic is permitted.
3. **Gateway Conversion**: At the boundary with ZarinPal v4 REST API, Toman amounts are converted to Rial (`amount_rial = amount_toman * 10`).

### 2.3 Business Timezone & Day Boundaries
1. **Timezone**: `Asia/Tehran` (UTC+03:30 standard).
2. **Business-Day Cutoff**: Default is `00:00` (midnight Tehran time). It can be configured (e.g. to `04:00` for late-night venues) without altering the ticketing domain logic.
3. **Business Date Determination**: Local times prior to the cutoff belong to the prior calendar day's business session.
4. **Expiration Instant**: A ticket's validity ends at the next business-day cutoff. This expiration timestamp is calculated and persisted in UTC upon order fulfillment. Future changes to cutoff settings do not retroactively alter previously issued tickets.
5. **Checkout Safety Margin**: Online checkout is locked out within a configurable margin (default: 5 minutes) prior to the day cutoff to prevent paying for already-expiring tickets.

### 2.4 Staff Check-In & Entry
1. **Mobile-First Scanner**: Staff use an in-browser camera scanner or manual token input at the lounge entrance.
2. **Atomic Verification**: Check-in executes in a single database transaction with row-level locking (`select_for_update`) to prevent concurrent redemption (double-entry race condition).
3. **Clear Multi-State Feedback**: Visual and textual indication for:
   - Valid & Checked In (Green)
   - Already Used (with recorded check-in timestamp)
   - Expired (Date/time ended)
   - Cancelled
   - Invalid Credential
   - Order Unpaid

### 2.5 Administration & Roles
1. **Super Administrator**: Full control over settings, staff accounts, price configuration, financial reports, audit logs, and ticket cancellations.
2. **Administrator**: Access to operational dashboard, order management, ticket inquiries, and staff activity.
3. **Check-In Staff**: Restricted strictly to the scanner interface and recent scan records. No access to financial figures, price settings, customer contact lists, or user management.

---

## 3. Explicitly Out of Scope
The following items must not be implemented:
- Scheduled concert/event lineups or performer profiles.
- Date or session selectors.
- Table bookings or seat seat maps.
- Food, beverage, or menu ordering.
- POS / kitchen printer integrations.
- Dynamic or tiered ticket pricing (VIP, Early Bird, etc.).

