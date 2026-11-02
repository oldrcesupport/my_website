import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.accounts.models import StaffRole
from apps.orders.services import OrderService
from apps.orders.models import OrderStatus
from apps.payments.adapters.mock import MockPaymentAdapter
from apps.payments.models import PaymentAttemptStatus
from apps.payments.services import PaymentService


@pytest.mark.django_db
def test_admin_cannot_promote_or_modify_superuser(admin_user, superadmin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    response = client.post('/api/v1/admin/staff/', {
        'username': 'escalate', 'password': 'safe-password-123', 'role': StaffRole.SUPER_ADMIN,
    }, format='json')
    assert response.status_code == 403
    assert not get_user_model().objects.filter(username='escalate').exists()
    response = client.patch(f'/api/v1/admin/staff/{superadmin_user.pk}/', {'password': 'changed-password'}, format='json')
    assert response.status_code == 403
    superadmin_user.refresh_from_db()
    assert not superadmin_user.check_password('changed-password')


@pytest.mark.django_db
def test_callback_does_not_grant_guest_ownership(client, monkeypatch):
    monkeypatch.setattr('apps.payments.services.get_payment_adapter', lambda: MockPaymentAdapter())
    order, _, _ = OrderService.create_order('Guest', '09121111111', 1)
    _, _, attempt, _ = PaymentService.initiate_payment(order)
    response = client.get('/api/v1/payments/zarinpal/callback/', {'Authority': attempt.authority, 'Status': 'OK'})
    assert response.status_code == 302
    assert not response.cookies
    assert attempt.authority not in response['Location']
    assert client.get(f'/api/v1/orders/{order.public_id}/status/').status_code == 403


@pytest.mark.django_db
def test_second_successful_attempt_requires_review(monkeypatch):
    monkeypatch.setattr('apps.payments.services.get_payment_adapter', lambda: MockPaymentAdapter())
    order, _, _ = OrderService.create_order('Guest', '09121111111', 2)
    _, _, first, _ = PaymentService.initiate_payment(order)
    _, _, second, _ = PaymentService.initiate_payment(order)
    assert PaymentService.process_callback(first.authority, 'OK')[0] == 'SUCCESS'
    assert PaymentService.process_callback(second.authority, 'OK')[0] == 'LATE_REVIEW'
    order.refresh_from_db()
    second.refresh_from_db()
    assert order.status == OrderStatus.PAID
    assert order.tickets.count() == 2
    assert second.status == PaymentAttemptStatus.REVIEW_REQUIRED


@pytest.mark.django_db
def test_verification_timeout_preserves_pending_order(monkeypatch):
    class TimeoutAdapter(MockPaymentAdapter):
        def verify_payment(self, authority, amount_toman):
            return False, '', -999, 'timeout', {}
    monkeypatch.setattr('apps.payments.services.get_payment_adapter', lambda: TimeoutAdapter())
    order, _, _ = OrderService.create_order('Guest', '09121111111', 1)
    _, _, attempt, _ = PaymentService.initiate_payment(order)
    assert PaymentService.process_callback(attempt.authority, 'OK')[0] == 'PENDING'
    order.refresh_from_db()
    attempt.refresh_from_db()
    assert order.status == OrderStatus.PENDING_PAYMENT
    assert attempt.status == PaymentAttemptStatus.UNKNOWN
    assert not order.tickets.exists()


@pytest.mark.django_db
def test_production_hides_unconfigured_price(client, settings):
    from apps.core.models import RestaurantSettings

    config = RestaurantSettings.get_settings()
    config.is_demo_price = True
    config.sales_enabled = True
    config.save()
    settings.APP_ENV = "production"
    response = client.get("/api/v1/public/settings/")
    assert response.status_code == 200
    assert response.json()["ticket_price_toman"] is None
    assert response.json()["sales_enabled"] is False


@pytest.mark.django_db
def test_admin_cannot_enable_unimplemented_capacity(superadmin_user):
    client = APIClient()
    client.force_authenticate(user=superadmin_user)
    response = client.patch("/api/v1/admin/settings/", {"capacity_enabled": True}, format="json")
    assert response.status_code == 400


@pytest.mark.django_db
def test_health_probe_checks_database(client):
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
