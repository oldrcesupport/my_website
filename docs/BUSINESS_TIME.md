# Business Time & Day Boundary Calculations

## 1. Principles
- **Centralized Service**: All business-time calculations must flow through `BusinessTimeService`. No ad-hoc `datetime.now()` or timezone manipulations may exist in views or models.
- **Timezone**: All business calculations evaluate in `Asia/Tehran` (UTC+03:30).
- **Storage**: All database timestamps (`timestamptz`) are stored in **UTC**.

---

## 2. Business Day Cutoff Logic

A venue may operate past midnight (e.g. closing at 02:00 AM or 04:00 AM). Therefore:
- The **cutoff time** marks the start of a new business day.
- By default, `business_day_cutoff = 00:00:00` (midnight).

### Mathematical Definition
Given current local Tehran datetime $T_{local}$ and cutoff time $C$:
1. If $T_{local}.time() \ge C$:
   - Current business date $D_{biz} = T_{local}.date()$
   - Next boundary instant $T_{next\_boundary} = \text{combine}(D_{biz} + 1\text{ day}, C)$
2. If $T_{local}.time() < C$:
   - Current business date $D_{biz} = T_{local}.date() - 1\text{ day}$
   - Next boundary instant $T_{next\_boundary} = \text{combine}(D_{biz} + 1\text{ day}, C) = \text{combine}(T_{local}.date(), C)$

### Example 1: Default Midnight Cutoff (`00:00:00`)
- At `2026-10-31 22:30:00 Asia/Tehran`:
  - Business date = `2026-10-31`
  - Ticket expires at = `2026-11-01 00:00:00 Asia/Tehran` (`2026-10-31 20:30:00 UTC`).

### Example 2: Late-Night Cutoff (`04:00:00`)
- At `2026-11-01 01:30:00 Asia/Tehran`:
  - Because `01:30 < 04:00`, current business date = `2026-10-31`.
  - Ticket expires at = `2026-11-01 04:00:00 Asia/Tehran` (`2026-11-01 00:30:00 UTC`).

---

## 3. Immutability of Issued Tickets
When an order is verified and tickets are created:
```python
ticket.business_date = current_business_date
ticket.valid_from = confirmed_payment_time_utc
ticket.valid_until = next_boundary_utc
```
If an administrator subsequently updates the restaurant's `business_day_cutoff` setting, previously issued tickets retain their original `valid_until` UTC timestamps. No retroactive alteration of existing tickets is permitted.

---

## 4. Checkout Cutoff Margin
To avoid selling tickets to customers seconds before the venue closes:
- A configurable safety buffer (`checkout_cutoff_margin_minutes`, default: 5 minutes) is enforced.
- If $T_{local} \ge (T_{next\_boundary} - 5\text{ minutes})$, checkout is disabled with an explanatory Persian banner:
  «فروش بلیت آنلاین برای امروز به پایان رسیده است.»

