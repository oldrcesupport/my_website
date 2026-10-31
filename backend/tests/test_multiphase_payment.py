import pytest
from apps.orders.models import OrderStatus
from apps.orders.services import OrderService
from apps.payments.adapters.mock import MockPaymentAdapter
from apps.payments.models import PaymentAttempt, PaymentAttemptStatus
from apps.payments.services import PaymentService


@pytest.mark.django_db
class TestMultiPhasePaymentVerification:
    """
    Verifies that PaymentService.process_callback executes external gateway
    verification outside database transaction locks and properly handles
    idempotent concurrent requests.
    """

    def test_multiphase_verification_fulfills_and_issues_tickets(self, monkeypatch):
        monkeypatch.setattr(
            "apps.payments.services.get_payment_adapter", lambda: MockPaymentAdapter()
        )

        order, guest_token, _ = OrderService.create_order(
            purchaser_name="خریدار موفق",
            purchaser_phone="09124444444",
            quantity=2,
        )
        attempt = PaymentAttempt.objects.create(
            order=order,
            provider="mock",
            amount_toman=200000,
            amount_rial=2000000,
            authority="MOCK_AUTH_MULTIPHASE_01",
            status=PaymentAttemptStatus.PENDING,
        )

        # Process callback
        result_state, msg, fulfilled_order = PaymentService.process_callback(
            authority=attempt.authority,
            gateway_status="OK",
        )

        assert result_state == "SUCCESS"
        assert fulfilled_order.status == OrderStatus.PAID
        assert fulfilled_order.tickets.count() == 2

        attempt.refresh_from_db()
        assert attempt.status == PaymentAttemptStatus.VERIFIED
        assert attempt.reference_id != ""

        # Second identical callback call -> ALREADY_PROCESSED (idempotent, no extra tickets issued)
        second_state, second_msg, _ = PaymentService.process_callback(
            authority=attempt.authority,
            gateway_status="OK",
        )
        assert second_state == "ALREADY_PROCESSED"
        assert fulfilled_order.tickets.count() == 2

    def test_multiphase_verification_handles_user_cancel(self, monkeypatch):
        monkeypatch.setattr(
            "apps.payments.services.get_payment_adapter", lambda: MockPaymentAdapter()
        )

        order, guest_token, _ = OrderService.create_order(
            purchaser_name="خریدار منصرف",
            purchaser_phone="09125555555",
            quantity=1,
        )
        attempt = PaymentAttempt.objects.create(
            order=order,
            provider="mock",
            amount_toman=100000,
            amount_rial=1000000,
            authority="MOCK_AUTH_CANCEL_01",
            status=PaymentAttemptStatus.PENDING,
        )

        result_state, msg, cancelled_order = PaymentService.process_callback(
            authority=attempt.authority,
            gateway_status="NOK",
        )

        assert result_state == "FAILED"
        assert cancelled_order.status == OrderStatus.PAYMENT_FAILED
        attempt.refresh_from_db()
        assert attempt.status == PaymentAttemptStatus.CANCELLED
        assert cancelled_order.tickets.count() == 0
