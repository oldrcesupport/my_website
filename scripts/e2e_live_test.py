import requests
import json
import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def main():
    print("=" * 60)
    print("RUNNING LIVE END-TO-END SYSTEM INTEGRATION TEST")
    print("=" * 60)

    # 1. Fetch public settings
    print("\n1. Fetching public settings...")
    res = requests.get(f"{BASE_URL}/api/v1/public/settings/")
    assert res.status_code == 200, f"Settings failed: {res.text}"
    settings = res.json()
    print(f"   Restaurant Name: {settings['restaurant_name']}")
    print(f"   Unit Price: {settings['ticket_price_toman']:,} {settings['currency_label']}")
    print(f"   Business Date: {settings['current_business_date']}")
    assert settings['sales_enabled'] is True
    assert settings['ticket_price_toman'] == 100000

    # 2. Create order with 3 tickets
    print("\n2. Creating guest order for 3 tickets via real API...")
    order_payload = {
        "purchaser_name": "امیررضا فرهمند",
        "purchaser_phone": "09121234567",
        "purchaser_email": "amir@example.com",
        "quantity": 3
    }
    res = requests.post(f"{BASE_URL}/api/v1/orders/", json=order_payload)
    assert res.status_code == 201, f"Order creation failed: {res.text}"
    order = res.json()
    order_id = order["order_public_id"]
    guest_token = order["guest_access_token"]
    print(f"   Order Created: Public ID = {order_id}")
    print(f"   Quantity: {order['quantity']}, Total Price: {order['total_price_toman']:,} Toman")
    print(f"   Redirect URL: {order['payment_redirect_url']}")
    assert order["quantity"] == 3
    assert order["total_price_toman"] == 300000
    assert "sandbox.zarinpal.com" in order["payment_redirect_url"]

    # 3. Setup Django environment to inspect and fulfill order
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    sys.path.insert(0, os.path.abspath("backend"))
    import django
    django.setup()

    from apps.orders.models import Order, OrderStatus
    from apps.payments.models import PaymentAttempt, PaymentAttemptStatus
    from apps.payments.services import PaymentService
    from apps.tickets.services import TicketService
    from apps.business_time.services import BusinessTimeService

    db_order = Order.objects.get(public_id=order_id)
    attempt = db_order.payment_attempts.first()
    print(f"\n3. Verifying Live ZarinPal Sandbox Authority Created:")
    print(f"   Attempt ID: {attempt.id}, Authority: {attempt.authority}")
    assert attempt.authority is not None

    # Verify that trying to fulfill an unpaid sandbox transaction safely fails:
    print("   Testing server-to-server rejection on unpaid sandbox session...")
    unpaid_res_state, unpaid_msg, _ = PaymentService.process_callback(attempt.authority, "OK")
    print(f"   Unpaid verification correctly rejected: {unpaid_res_state} ({unpaid_msg})")
    assert unpaid_res_state == "FAILED"

    # Now simulate verified payment fulfillment for the test order
    print("\n4. Simulating confirmed payment verification on order...")
    now_utc = BusinessTimeService.get_now_utc()
    attempt.status = PaymentAttemptStatus.VERIFIED
    attempt.reference_id = "SANDBOX_REF_123456"
    attempt.verified_at = now_utc
    attempt.save()

    db_order.status = OrderStatus.PAID
    db_order.paid_at = now_utc
    db_order.save()

    # Issue tickets
    issued_tickets = TicketService.issue_tickets_for_order(db_order, paid_at=now_utc)
    assert len(issued_tickets) == 3
    print(f"   Order successfully marked PAID. Issued {len(issued_tickets)} distinct tickets.")

    # 5. Fetch digital ticket passes via Guest API
    print("\n5. Fetching digital tickets via Guest API...")
    res = requests.get(
        f"{BASE_URL}/api/v1/orders/{order_id}/tickets/",
        headers={"Authorization": f"Bearer {guest_token}"}
    )
    assert res.status_code == 200, f"Ticket fetch failed: {res.text}"
    tickets_data = res.json()["tickets"]
    print(f"   Successfully retrieved {len(tickets_data)} tickets:")
    assert len(tickets_data) == 3
    for i, t in enumerate(tickets_data, 1):
        print(f"   Ticket #{i}: Serial = {t['ticket_number']}, Status = {t['effective_status']}")
        assert t['effective_status'] == "VALID"
        assert t['raw_token'] != ""
        assert len(t['qr_data_uri']) > 100

    # 6. Entrance Staff Check-In
    print("\n6. Entrance Staff Login & Check-In...")
    login_res = requests.post(f"{BASE_URL}/api/v1/auth/login/", json={
        "username": "scanner_staff",
        "password": "StaffSecret123!"
    })
    assert login_res.status_code == 200, f"Staff login failed: {login_res.text}"
    staff_token = login_res.json()["token"]
    print(f"   Staff logged in successfully. Token = {staff_token[:10]}...")

    # Scan Ticket #1
    t1_token = tickets_data[0]["raw_token"]
    print(f"\n7. Scanning Ticket #1 (First scan at entrance)...")
    scan_res1 = requests.post(
        f"{BASE_URL}/api/v1/staff/check-in/",
        json={"qr_token": t1_token, "scanner_device_id": "entrance-gate-01"},
        headers={"Authorization": f"Token {staff_token}"}
    )
    print(f"   Response Status: {scan_res1.status_code}")
    print(f"   Payload: {scan_res1.json()}")
    assert scan_res1.status_code == 200
    assert scan_res1.json()["result"] == "SUCCESS"

    # Scan Ticket #1 AGAIN -> Must be rejected with HTTP 409 ALREADY_USED
    print(f"\n8. Scanning Ticket #1 AGAIN (Simulated double-redemption attempt)...")
    scan_res2 = requests.post(
        f"{BASE_URL}/api/v1/staff/check-in/",
        json={"qr_token": t1_token, "scanner_device_id": "entrance-gate-01"},
        headers={"Authorization": f"Token {staff_token}"}
    )
    print(f"   Response Status: {scan_res2.status_code}")
    print(f"   Payload: {scan_res2.json()}")
    assert scan_res2.status_code == 409
    assert scan_res2.json()["result"] == "ALREADY_USED"

    # Scan Ticket #2
    t2_token = tickets_data[1]["raw_token"]
    print(f"\n9. Scanning Ticket #2...")
    scan_res3 = requests.post(
        f"{BASE_URL}/api/v1/staff/check-in/",
        json={"qr_token": t2_token, "scanner_device_id": "entrance-gate-01"},
        headers={"Authorization": f"Token {staff_token}"}
    )
    assert scan_res3.status_code == 200
    assert scan_res3.json()["result"] == "SUCCESS"
    print(f"   Ticket #2 Accepted: {scan_res3.json()['message']}")

    # 7. Admin Dashboard Verification
    print("\n10. Admin Login & Dashboard Metrics Verification...")
    admin_login_res = requests.post(f"{BASE_URL}/api/v1/auth/login/", json={
        "username": "admin",
        "password": "AdminSecret123!"
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["token"]

    dash_res = requests.get(
        f"{BASE_URL}/api/v1/admin/dashboard/",
        headers={"Authorization": f"Token {admin_token}"}
    )
    assert dash_res.status_code == 200
    dash_stats = dash_res.json()
    print(f"   Today's Paid Tickets Count: {dash_stats['today_paid_tickets_count']}")
    print(f"   Today's Revenue: {dash_stats['today_revenue_toman']:,} Toman")
    print(f"   Today's Check-ins Count: {dash_stats['today_checkins_count']}")
    print(f"   Today's Unused Valid Tickets: {dash_stats['today_unused_valid_tickets']}")

    assert dash_stats['today_paid_tickets_count'] >= 3
    assert dash_stats['today_revenue_toman'] >= 300000
    assert dash_stats['today_checkins_count'] >= 2
    assert dash_stats['today_unused_valid_tickets'] >= 1

    print("\n" + "=" * 60)
    print("ALL LIVE END-TO-END SCENARIO CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()
