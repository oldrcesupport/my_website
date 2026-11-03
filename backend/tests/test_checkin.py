from datetime import UTC, datetime, timedelta

import pytest
from apps.checkin.models import CheckInResult
from apps.checkin.services import CheckInService
from apps.orders.models import OrderStatus
from apps.orders.services import OrderService
from apps.tickets.models import TicketStatus
from apps.tickets.services import TicketService


@pytest.mark.django_db
class TestCheckInRedemption:
    def test_successful_checkin_and_single_use(self, scanner_user):
        order, _, _ = OrderService.create_order(
            "پژمان جمشیدی", "09121239876", quantity=1
        )
        order.status = OrderStatus.PAID
        order.save()

        ticket = TicketService.issue_tickets_for_order(order)[0]
        raw_token = ticket.get_raw_token()

        # First scan -> SUCCESS
        res, msg, t, record, used_at = CheckInService.redeem_ticket(
            raw_token, scanner_user, "device-gate-1"
        )
        assert res == CheckInResult.SUCCESS
        assert t.status == TicketStatus.USED
        assert t.used_at is not None
        assert record.result == CheckInResult.SUCCESS

        # Second scan of identical token -> ALREADY_USED
        res2, msg2, t2, record2, used_at2 = CheckInService.redeem_ticket(
            raw_token, scanner_user, "device-gate-1"
        )
        assert res2 == CheckInResult.ALREADY_USED
        assert "قبلاً" in msg2
        assert record2.result == CheckInResult.ALREADY_USED

    def test_unpaid_order_checkin_rejected(self, scanner_user):
        order, _, _ = OrderService.create_order(
            "سفارش پرداخت‌نشده", "09129998877", quantity=1
        )
        # Simulate a previously issued ticket whose order was subsequently
        # moved out of PAID, to test the scanner's independent safeguard.
        order.status = OrderStatus.PAID
        order.save(update_fields=["status"])
        ticket = TicketService.issue_tickets_for_order(order)[0]
        order.status = OrderStatus.PENDING_PAYMENT
        order.save(update_fields=["status"])
        raw_token = ticket.get_raw_token()

        res, msg, _, _, _ = CheckInService.redeem_ticket(raw_token, scanner_user)
        assert res == CheckInResult.ORDER_UNPAID

    def test_expired_ticket_checkin_rejected(self, scanner_user):
        order, _, _ = OrderService.create_order("بلیت منقضی", "09125554433", quantity=1)
        order.status = OrderStatus.PAID
        order.save()

        ticket = TicketService.issue_tickets_for_order(order)[0]
        raw_token = ticket.get_raw_token()

        future_time = ticket.valid_until + timedelta(hours=1)
        res, msg, _, _, _ = CheckInService.redeem_ticket(
            raw_token, scanner_user, now_utc=future_time
        )
        assert res == CheckInResult.EXPIRED
        assert "منقضی" in msg

    def test_cancelled_ticket_rejected(self, scanner_user):
        order, _, _ = OrderService.create_order(
            "بلیت لغوشده", "09121113322", quantity=1
        )
        order.status = OrderStatus.PAID
        order.save()

        ticket = TicketService.issue_tickets_for_order(order)[0]
        ticket.status = TicketStatus.CANCELLED
        ticket.save()
        raw_token = ticket.get_raw_token()

        res, msg, _, _, _ = CheckInService.redeem_ticket(raw_token, scanner_user)
        assert res == CheckInResult.CANCELLED

    def test_manual_ticket_number_checkin(self, scanner_user):
        order, _, _ = OrderService.create_order(
            "مشتری ورود دستی", "09127778899", quantity=1
        )
        order.status = OrderStatus.PAID
        order.save()

        ticket = TicketService.issue_tickets_for_order(order)[0]

        # Redeem via human-readable serial number: TKT-20261031-XXXXXX
        res, msg, t, record, _ = CheckInService.redeem_ticket(
            ticket.ticket_number, scanner_user, "manual-input"
        )
        assert res == CheckInResult.SUCCESS
        assert t.id == ticket.id
        assert t.status == TicketStatus.USED
        assert "ورود مجاز است" in msg

    def test_duplicate_scan_displays_tehran_time_and_handles_missing_time(self, scanner_user):
        order, _, _ = OrderService.create_order("Guest", "09121111111", quantity=1)
        order.status = OrderStatus.PAID
        order.save(update_fields=["status"])
        ticket = TicketService.issue_tickets_for_order(order)[0]
        ticket.status = TicketStatus.USED
        ticket.used_at = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
        ticket.save(update_fields=["status", "used_at"])
        result, message, *_ = CheckInService.redeem_ticket(ticket.ticket_number, scanner_user)
        assert result == CheckInResult.ALREADY_USED
        assert "15:30:00" in message
        ticket.used_at = None
        ticket.save(update_fields=["used_at"])
        assert CheckInService.redeem_ticket(ticket.ticket_number, scanner_user)[0] == CheckInResult.ALREADY_USED


@pytest.mark.django_db
def test_dashboard_only_counts_currently_redeemable_tickets(admin_user):
    from rest_framework.test import APIClient

    order, _, _ = OrderService.create_order("Dashboard Test", "09121111111", 3)
    order.status = OrderStatus.PAID
    order.save(update_fields=["status"])
    tickets = TicketService.issue_tickets_for_order(order)
    tickets[1].valid_from = tickets[1].valid_until + timedelta(minutes=1)
    tickets[1].save(update_fields=["valid_from"])
    tickets[2].status = TicketStatus.CANCELLED
    tickets[2].save(update_fields=["status"])
    client = APIClient()
    client.force_authenticate(user=admin_user)
    assert client.get("/api/v1/admin/dashboard/").json()["today_unused_valid_tickets"] == 1
    order.status = OrderStatus.PAYMENT_FAILED
    order.save(update_fields=["status"])
    assert client.get("/api/v1/admin/dashboard/").json()["today_unused_valid_tickets"] == 0
