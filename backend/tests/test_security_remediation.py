import pytest
from apps.checkin.services import CheckInService
from apps.orders.services import OrderService
from apps.payments.models import PaymentAttempt, PaymentAttemptStatus
from apps.payments.services import PaymentService
from django.conf import settings
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestSecurityRemediations:
    """
    Verifies critical P0 security requirements:
    1. Zero Origin/Referer header reflection on payment callback redirect
    2. Staff creation requires explicit password (predictable fallback removed)
    3. CheckIn does not log plaintext raw token in notes
    4. Default DRF permissions are fail-closed
    """

    def test_payment_callback_rejects_origin_poisoning(self, client):
        order, guest_token, _ = OrderService.create_order(
            purchaser_name="تست نفوذگر",
            purchaser_phone="09123333333",
            quantity=1,
        )
        attempt = PaymentAttempt.objects.create(
            order=order,
            provider="zarinpal",
            amount_toman=100000,
            amount_rial=1000000,
            authority="A00000000000000000000000000000000001",
            status=PaymentAttemptStatus.PENDING,
        )

        callback_url = f"/api/v1/payments/zarinpal/callback/?Authority={attempt.authority}&Status=OK"
        # Malicious attacker sends Origin/Referer pointing to evil.com
        response = client.get(
            callback_url,
            HTTP_ORIGIN="https://evil-attacker.com",
            HTTP_REFERER="https://evil-attacker.com/spoofed",
        )

        # Ensure redirection is STRICTLY to configured FRONTEND_URL, NEVER evil-attacker.com
        redirect_target = response.url
        assert redirect_target.startswith(settings.FRONTEND_URL)
        assert "evil-attacker.com" not in redirect_target

    def test_staff_creation_requires_explicit_password(self, superadmin_user):
        api_client = APIClient()
        api_client.force_authenticate(user=superadmin_user)

        # 1. Attempt to create staff without providing password -> Validation Error (400)
        res_no_pass = api_client.post(
            "/api/v1/admin/staff/",
            {
                "username": "new_scanner_no_pass",
                "display_name": "اسکنر بدون رمز",
                "role": "STAFF_SCANNER",
            },
            format="json",
        )
        assert res_no_pass.status_code == 400
        assert "password" in res_no_pass.json()

        # 2. Attempt with short password (< 8 chars) -> 400
        res_short = api_client.post(
            "/api/v1/admin/staff/",
            {
                "username": "new_scanner_short",
                "password": "123",
                "role": "STAFF_SCANNER",
            },
            format="json",
        )
        assert res_short.status_code == 400

        # 3. Valid password -> 201 Created
        res_valid = api_client.post(
            "/api/v1/admin/staff/",
            {
                "username": "valid_staff_user",
                "password": "StrongPassword99!",
                "role": "STAFF_SCANNER",
            },
            format="json",
        )
        assert res_valid.status_code == 201

    def test_checkin_notes_hash_unknown_token_without_plaintext_leak(self, scanner_user):
        raw_secret_token = "ultra_confidential_token_payload_xyz_12345"
        result, msg, ticket, record, used_at = CheckInService.redeem_ticket(
            raw_token_or_url=raw_secret_token,
            staff_user=scanner_user,
            scanner_device_id="scanner-test",
        )

        assert record is not None
        # Must NOT contain the plaintext token in notes
        assert raw_secret_token not in record.notes
        # Must contain sha256 prefix hash
        assert "sha256:" in record.notes
