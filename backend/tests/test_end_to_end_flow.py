import pytest
from django.test import Client, override_settings

from apps.accounts.models import StaffProfile, StaffRole
from django.contrib.auth import get_user_model


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="mock")
def test_checkout_verification_and_session_scanner_flow():
    """Exercise payment verification and ticket issuance through the API."""
    guest = Client(enforce_csrf_checks=True)
    response = guest.post(
        "/api/v1/orders/",
        {"purchaser_name": "Test Guest", "purchaser_phone": "09120000000", "quantity": 2},
        content_type="application/json", HTTP_IDEMPOTENCY_KEY="integration-flow-unique-key",
    )
    assert response.status_code == 201
    body = response.json()
    assert "guest_access_token" not in body
    order_id = body["order_public_id"]
    authority = body["payment_redirect_url"].rsplit("/", 1)[-1]
    assert guest.get(f"/api/v1/orders/{order_id}/tickets/").json()["tickets"] == []
    assert Client().get(f"/api/v1/orders/{order_id}/status/").status_code == 403

    callback = guest.get("/api/v1/payments/zarinpal/callback/", {"Authority": authority, "Status": "OK"})
    assert callback.status_code == 302
    assert authority not in callback["Location"]
    status = guest.get(f"/api/v1/orders/{order_id}/status/").json()
    assert status["status"] == "PAID"
    tickets = guest.get(f"/api/v1/orders/{order_id}/tickets/").json()["tickets"]
    assert len(tickets) == 2
    guest.get("/api/v1/payments/zarinpal/callback/", {"Authority": authority, "Status": "OK"})
    assert len(guest.get(f"/api/v1/orders/{order_id}/tickets/").json()["tickets"]) == 2

    scanner = get_user_model().objects.create_user("gate", password="Unique-test-password")
    StaffProfile.objects.create(user=scanner, role=StaffRole.STAFF_SCANNER)
    staff = Client(enforce_csrf_checks=True)
    staff.get("/api/v1/auth/csrf/")
    csrf = staff.cookies["csrftoken"].value
    assert staff.post("/api/v1/auth/login/", {"username": "gate", "password": "Unique-test-password"}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf).status_code == 200
    csrf = staff.cookies["csrftoken"].value
    assert staff.get("/api/v1/admin/orders/").status_code == 403
    scan = lambda: staff.post("/api/v1/staff/check-in/", {"qr_token": tickets[0]["ticket_number"]}, content_type="application/json", HTTP_X_CSRFTOKEN=csrf)
    assert scan().json()["result"] == "SUCCESS"
    assert scan().json()["result"] == "ALREADY_USED"
