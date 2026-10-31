import pytest
from apps.orders.services import OrderService
from apps.orders.models import OrderStatus
from apps.payments.models import PaymentAttempt, PaymentAttemptStatus
from apps.tickets.services import TicketService
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestGuestOwnershipAndIDORPrevention:
    """
    Verifies that paid orders, tickets, and QR images CANNOT be accessed by anonymous attackers
    via IDOR, and that raw bearer tokens are not leaked in responses.
    """

    def test_anonymous_cannot_view_paid_order_or_tickets_without_token(self, client):
        # 1. Create a paid order
        order, guest_token, _ = OrderService.create_order(
            purchaser_name="خریدار محترم",
            purchaser_phone="09121111111",
            quantity=2,
        )
        order.status = OrderStatus.PAID
        order.save()
        TicketService.issue_tickets_for_order(order)
        ticket = order.tickets.first()

        # 2. Attacker attempts to fetch order status without guest token -> 403 Forbidden
        status_url = f"/api/v1/orders/{order.public_id}/status/"
        res_status = client.get(status_url)
        assert res_status.status_code == 403
        assert "عدم دسترسی" in res_status.json().get("error", "")

        # 3. Attacker attempts to fetch tickets without guest token -> 403 Forbidden
        tickets_url = f"/api/v1/orders/{order.public_id}/tickets/"
        res_tickets = client.get(tickets_url)
        assert res_tickets.status_code == 403

        # 4. Attacker attempts to fetch QR image without guest token -> 403 Forbidden
        qr_url = f"/api/v1/tickets/{ticket.public_id}/qr/"
        res_qr = client.get(qr_url)
        assert res_qr.status_code == 403

    def test_authorized_guest_with_token_can_access_paid_tickets(self, client):
        order, guest_token, _ = OrderService.create_order(
            purchaser_name="خریدار محترم",
            purchaser_phone="09121111111",
            quantity=1,
        )
        order.status = OrderStatus.PAID
        order.save()
        TicketService.issue_tickets_for_order(order)
        ticket = order.tickets.first()

        # Authorized request with X-Guest-Token
        tickets_url = f"/api/v1/orders/{order.public_id}/tickets/"
        res = client.get(tickets_url, HTTP_X_GUEST_TOKEN=guest_token)
        assert res.status_code == 200
        data = res.json()
        assert data["order_public_id"] == str(order.public_id)
        assert len(data["tickets"]) == 1

        # Check raw_token and guest_access_token are NOT leaked in response
        assert "guest_access_token" not in data
        assert "raw_token" not in data["tickets"][0]
        assert "qr_data_uri" in data["tickets"][0]

        # Authorized QR image retrieval
        qr_url = f"/api/v1/tickets/{ticket.public_id}/qr/"
        res_qr = client.get(qr_url, HTTP_X_GUEST_TOKEN=guest_token)
        assert res_qr.status_code == 200
        assert res_qr["Content-Type"] == "image/png"

    def test_staff_admin_can_inspect_order_without_guest_token(self, admin_user):
        order, guest_token, _ = OrderService.create_order(
            purchaser_name="خریدار تستی",
            purchaser_phone="09122222222",
            quantity=1,
        )
        order.status = OrderStatus.PAID
        order.save()
        TicketService.issue_tickets_for_order(order)

        api_client = APIClient()
        api_client.force_authenticate(user=admin_user)

        tickets_url = f"/api/v1/orders/{order.public_id}/tickets/"
        res = api_client.get(tickets_url)
        assert res.status_code == 200
        assert res.json()["order_public_id"] == str(order.public_id)
