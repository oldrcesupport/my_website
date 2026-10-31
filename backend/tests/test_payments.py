from datetime import timedelta

import pytest
from apps.business_time.services import BusinessTimeService
from apps.orders.models import OrderStatus
from apps.orders.services import OrderService
from apps.payments.adapters.base import BasePaymentAdapter
from apps.payments.adapters.mock import MockPaymentAdapter
from apps.payments.models import PaymentAttemptStatus
from apps.payments.services import PaymentService


@pytest.mark.django_db
class TestPaymentWorkflows:
    def test_toman_to_rial_conversion(self):
        # 100,000 Toman must strictly equal 1,000,000 Rial at the provider boundary
        toman = 100000
        rial = BasePaymentAdapter.toman_to_rial(toman)
        assert rial == 1000000
        assert rial == toman * 10

    def test_payment_initiation_and_fulfillment(self, monkeypatch):
        # Use mock provider
        monkeypatch.setattr(
            "apps.payments.services.get_payment_adapter", lambda: MockPaymentAdapter()
        )

        order, _, _ = OrderService.create_order("مریم کریمی", "09123334444", quantity=3)
        assert order.status == OrderStatus.PENDING_PAYMENT

        success, redirect_url, attempt, err = PaymentService.initiate_payment(order)
        assert success is True
        assert attempt.status == PaymentAttemptStatus.PENDING
        assert attempt.authority.startswith("MOCK_")
        assert attempt.amount_toman == 300000
        assert attempt.amount_rial == 3000000

        # Simulate callback
        result_state, msg, updated_order = PaymentService.process_callback(
            attempt.authority, "OK"
        )
        assert result_state == "SUCCESS"
        assert updated_order.status == OrderStatus.PAID
        assert updated_order.tickets.count() == 3

    def test_duplicate_callback_idempotency(self, monkeypatch):
        monkeypatch.setattr(
            "apps.payments.services.get_payment_adapter", lambda: MockPaymentAdapter()
        )

        order, _, _ = OrderService.create_order("حامد موسوی", "09124445555", quantity=2)
        _, _, attempt, _ = PaymentService.initiate_payment(order)

        # First callback
        res1, _, _ = PaymentService.process_callback(attempt.authority, "OK")
        assert res1 == "SUCCESS"
        assert order.tickets.count() == 2

        # Second identical callback
        res2, _, _ = PaymentService.process_callback(attempt.authority, "OK")
        assert res2 == "ALREADY_PROCESSED"
        # Must not create more tickets!
        assert order.tickets.count() == 2

    def test_payment_user_cancellation(self, monkeypatch):
        monkeypatch.setattr(
            "apps.payments.services.get_payment_adapter", lambda: MockPaymentAdapter()
        )

        order, _, _ = OrderService.create_order(
            "کاربر انصرافی", "09125556666", quantity=1
        )
        _, _, attempt, _ = PaymentService.initiate_payment(order)

        result_state, msg, updated_order = PaymentService.process_callback(
            attempt.authority, "NOK"
        )
        assert result_state == "FAILED"
        assert updated_order.status == OrderStatus.PAYMENT_FAILED
        assert updated_order.tickets.count() == 0

    def test_late_payment_at_business_day_boundary(self, monkeypatch):
        """
        If payment verification arrives AFTER the order's business date has expired,
        move order into PAID_LATE_REVIEW and DO NOT issue tickets!
        """
        monkeypatch.setattr(
            "apps.payments.services.get_payment_adapter", lambda: MockPaymentAdapter()
        )

        order, _, _ = OrderService.create_order(
            "خریدار دیررس", "09127778888", quantity=2
        )
        _, _, attempt, _ = PaymentService.initiate_payment(order)

        # Simulate time shifting 2 days into the future
        future_time = BusinessTimeService.get_now_utc() + timedelta(days=2)
        monkeypatch.setattr(
            "apps.business_time.services.BusinessTimeService.get_now_utc",
            lambda: future_time,
        )

        result_state, msg, updated_order = PaymentService.process_callback(
            attempt.authority, "OK"
        )
        assert result_state == "LATE_REVIEW"
        assert updated_order.status == OrderStatus.PAID_LATE_REVIEW
        # Invariants: No valid tickets issued!
        assert updated_order.tickets.count() == 0
