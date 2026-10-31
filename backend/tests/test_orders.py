import pytest
from apps.core.models import RestaurantSettings
from apps.orders.models import OrderStatus
from apps.orders.services import OrderService
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestOrderService:
    def test_create_single_ticket_order(self):
        order, token, is_created = OrderService.create_order(
            purchaser_name="سارا حسینی", purchaser_phone="09129876543", quantity=1
        )
        assert is_created is True
        assert order.quantity == 1
        assert order.unit_price_toman == 100000
        assert order.total_price_toman == 100000
        assert order.status == OrderStatus.PENDING_PAYMENT
        assert token.startswith("agt_")
        assert order.verify_access_token(token) is True

    def test_create_multiple_tickets_order(self):
        order, token, is_created = OrderService.create_order(
            purchaser_name="رضا صادقی", purchaser_phone="09351234567", quantity=4
        )
        assert is_created is True
        assert order.quantity == 4
        assert order.total_price_toman == 400000

    def test_order_idempotency(self):
        idem_key = "test-idem-key-1234"
        order1, token1, created1 = OrderService.create_order(
            purchaser_name="خریدار اول",
            purchaser_phone="09121111111",
            quantity=2,
            idempotency_key=idem_key,
        )
        assert created1 is True

        # Second request with same idempotency key
        order2, token2, created2 = OrderService.create_order(
            purchaser_name="خریدار دوم",
            purchaser_phone="09122222222",
            quantity=3,
            idempotency_key=idem_key,
        )
        assert created2 is False
        assert order2.id == order1.id
        assert order2.quantity == 2  # Preserved original quantity

    def test_invalid_quantity_rejected(self):
        with pytest.raises(ValidationError):
            OrderService.create_order(
                purchaser_name="تست منفی", purchaser_phone="09121111111", quantity=0
            )

        with pytest.raises(ValidationError):
            OrderService.create_order(
                purchaser_name="تست سقف", purchaser_phone="09121111111", quantity=51
            )

    def test_disabled_sales_rejected(self):
        settings_obj = RestaurantSettings.get_settings()
        settings_obj.sales_enabled = False
        settings_obj.save()

        with pytest.raises(ValidationError) as exc:
            OrderService.create_order(
                purchaser_name="تست فروش غیرفعال",
                purchaser_phone="09121111111",
                quantity=1,
            )
        assert "غیرفعال" in str(exc.value)
