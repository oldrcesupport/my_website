import threading

import pytest
from apps.checkin.models import CheckInRecord, CheckInResult
from apps.checkin.services import CheckInService
from apps.orders.models import OrderStatus
from apps.orders.services import OrderService
from apps.tickets.services import TicketService
from django.db import connection, connections


@pytest.mark.django_db(transaction=True)
class TestPostgreSQLConcurrency:
    def test_simultaneous_qr_redemption_race_condition(self, scanner_user):
        """
        Executes two concurrent worker threads attempting to redeem the exact same QR token
        simultaneously using PostgreSQL row locking (select_for_update).
        Asserts that:
        - Exactly one thread receives SUCCESS.
        - Exactly one thread receives ALREADY_USED.
        - Exactly one SUCCESS CheckInRecord is persisted.
        """
        # Ensure we are running on real PostgreSQL
        assert "postgresql" in connection.settings_dict["ENGINE"], (
            "Concurrency tests must run on PostgreSQL!"
        )

        order, _, _ = OrderService.create_order(
            "خریدار مسابقه ورود", "09121234567", quantity=1
        )
        order.status = OrderStatus.PAID
        order.save()

        ticket = TicketService.issue_tickets_for_order(order)[0]
        raw_token = ticket.get_raw_token()

        results = []
        barrier = threading.Barrier(2)

        def scan_worker(thread_id: int):
            # Close connection to force new independent connection for thread
            connections.close_all()
            try:
                # Wait for both threads to hit the starting line
                barrier.wait(timeout=5)
                res, msg, t, record, _ = CheckInService.redeem_ticket(
                    raw_token_or_url=raw_token,
                    staff_user=scanner_user,
                    scanner_device_id=f"gate-thread-{thread_id}",
                )
                results.append((thread_id, res, msg))
            except Exception as e:
                results.append((thread_id, "EXCEPTION", str(e)))
            finally:
                connections.close_all()

        t1 = threading.Thread(target=scan_worker, args=(1,))
        t2 = threading.Thread(target=scan_worker, args=(2,))

        t1.start()
        t2.start()
        t1.join(timeout=10)
        t2.join(timeout=10)

        assert len(results) == 2

        outcomes = [r[1] for r in results]
        assert CheckInResult.SUCCESS in outcomes, (
            f"One thread must succeed. Results: {results}"
        )
        assert CheckInResult.ALREADY_USED in outcomes, (
            f"One thread must receive ALREADY_USED. Results: {results}"
        )

        # Re-check database state
        ticket.refresh_from_db()
        assert ticket.status == "USED"

        success_records = CheckInRecord.objects.filter(
            ticket=ticket, result=CheckInResult.SUCCESS
        ).count()
        already_used_records = CheckInRecord.objects.filter(
            ticket=ticket, result=CheckInResult.ALREADY_USED
        ).count()

        assert success_records == 1
        assert already_used_records == 1
