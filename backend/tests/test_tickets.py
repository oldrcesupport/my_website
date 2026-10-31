from datetime import timedelta

import pytest
from apps.orders.services import OrderService
from apps.tickets.crypto import QRCryptoService
from apps.tickets.models import TicketStatus
from apps.tickets.services import TicketService


@pytest.mark.django_db
class TestTicketLifecycle:
    def test_multi_ticket_independence(self):
        order, _, _ = OrderService.create_order(
            "خانواده رضایی", "09128889999", quantity=3
        )
        tickets = TicketService.issue_tickets_for_order(order)

        assert len(tickets) == 3
        token_hashes = [t.qr_token_hash for t in tickets]
        ticket_numbers = [t.ticket_number for t in tickets]

        # Every ticket must have a distinct hash and ticket number
        assert len(set(token_hashes)) == 3
        assert len(set(ticket_numbers)) == 3

    def test_token_encryption_and_decryption(self):
        token = QRCryptoService.generate_token()
        enc = QRCryptoService.encrypt_token(token)
        dec = QRCryptoService.decrypt_token(enc)
        assert dec == token

    def test_effective_status_transitions(self):
        order, _, _ = OrderService.create_order("تست وضعیت", "09120001111", quantity=1)
        ticket = TicketService.issue_tickets_for_order(order)[0]

        # Initially VALID
        assert ticket.get_effective_status() == "VALID"

        # If time passes valid_until -> EXPIRED
        future = ticket.valid_until + timedelta(minutes=10)
        assert ticket.get_effective_status(now_utc=future) == "EXPIRED"

        # If marked USED -> USED
        ticket.status = TicketStatus.USED
        assert ticket.get_effective_status() == "USED"

        # If marked CANCELLED -> CANCELLED
        ticket.status = TicketStatus.CANCELLED
        assert ticket.get_effective_status() == "CANCELLED"
