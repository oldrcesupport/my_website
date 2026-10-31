# Performance Audit and Optimization Plan
**Project:** oldrcesupport/my_website  

---

## 1. Baseline Performance Profile
- **Backend Query Optimization:**
  - `AdminOrderListView`: Uses `prefetch_related('tickets', 'payment_attempts')` to eliminate N+1 queries.
  - `AdminTicketListView`: Uses `select_related('order')` to batch load purchaser details in a single SQL join.
  - `AdminDashboardStatsView`: Employs aggregate sums (`Sum('quantity')`, `Sum('total_price_toman')`) directly in PostgreSQL.
- **Frontend Assets:**
  - Dynamic imports for heavy libraries: `html5-qrcode` loaded strictly on client-side mounting.
  - Next.js server components employed for landing page marketing blocks.
  - Strict SVG icon bundle tree-shaking via `lucide-react`.

---

## 2. Invariants & Guardrails
- **No Over-Engineering:** No unneeded Redis, Celery, or microservice dependencies introduced.
- **Database Index Coverage:** Explicit b-tree indexes on `order.public_id`, `ticket.qr_token_hash`, `ticket.ticket_number`, `ticket.business_date`, `ticket.valid_until`, and `payment_attempt.authority`.

