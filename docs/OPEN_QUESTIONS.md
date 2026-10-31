# Open Questions & Pending Business Details

The following items are intentionally left unconfigured or marked with safe development defaults pending confirmation by the restaurant management:

1. **Restaurant Branding & Identity**:
   - Official restaurant name (default: `نام رستوران`).
   - Official logo, contact phone number, and physical street address.
   - Social media profiles.
2. **Admission Ticket Pricing**:
   - The agreed official ticket price in Iranian Toman (default development demo value: `100,000` Toman with `is_demo_price=True`).
3. **Live Music Operating Hours & Business-Day Cutoff**:
   - The official closing time / business-day boundary (default: `00:00:00` midnight Tehran time). If the lounge operates until 02:00 AM or 04:00 AM, `business_day_cutoff` should be updated in the settings dashboard.
4. **Capacity Policy**:
   - Current status: `CAPACITY_POLICY=UNCONFIGURED`, `CAPACITY_ENABLED=false`.
   - Management must decide between:
     - **Daily Sales Limit**: A maximum total number of tickets sold on any single business day.
     - **Concurrent Physical Occupancy Limit**: Maximum simultaneous people in the music room (requires an exit/checkout scanner workflow to track departures).
5. **Production ZarinPal Merchant Account**:
   - Active Merchant ID assigned by ZarinPal upon contract activation.
6. **Refund Policy Rules**:
   - Terms and operational procedures for processing refunds on `PAID_LATE_REVIEW` or manually cancelled admissions.

