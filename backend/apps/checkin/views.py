from apps.accounts.permissions import IsAdminUserRole, IsStaffScannerUser
from apps.business_time.services import BusinessTimeService
from apps.orders.models import Order, OrderStatus
from apps.tickets.models import Ticket, TicketStatus
from django.db.models import Sum
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CheckInRecord, CheckInResult
from .serializers import CheckInRecordSerializer, StaffCheckInRequestSerializer
from .services import CheckInService


class StaffCheckInView(APIView):
    """
    Atomic entrance check-in endpoint.
    Redeems tickets using PostgreSQL row locking to strictly prevent double entry.
    """

    permission_classes = [IsStaffScannerUser]

    def post(self, request):
        serializer = StaffCheckInRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_token = serializer.validated_data["qr_token"]
        device_id = serializer.validated_data.get("scanner_device_id", "")

        result, msg, ticket, record, used_at = CheckInService.redeem_ticket(
            raw_token_or_url=raw_token,
            staff_user=request.user,
            scanner_device_id=device_id,
        )

        response_payload = {
            "result": result,
            "message": msg,
            "ticket_number": ticket.ticket_number if ticket else "",
            "scanned_at": record.scanned_at.isoformat() if record else None,
            "used_at": used_at.isoformat() if used_at else None,
        }

        if result == CheckInResult.SUCCESS:
            return Response(response_payload, status=status.HTTP_200_OK)
        elif result == CheckInResult.ALREADY_USED:
            return Response(response_payload, status=status.HTTP_409_CONFLICT)
        elif result == CheckInResult.INVALID_TOKEN:
            return Response(response_payload, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response(response_payload, status=status.HTTP_400_BAD_REQUEST)


class StaffCheckInHistoryView(APIView):
    permission_classes = [IsStaffScannerUser]

    def get(self, request):
        qs = CheckInRecord.objects.select_related("ticket", "staff_user")
        if not (request.user.is_superuser or request.user.staff_profile.is_admin):
            qs = qs.filter(staff_user=request.user)

        records = qs.order_by("-scanned_at")[:30]
        return Response(CheckInRecordSerializer(records, many=True).data)


class AdminDashboardStatsView(APIView):
    """
    Provides real operational metrics for today's active business session.
    Zero fabricated numbers.
    """

    permission_classes = [IsAdminUserRole]

    def get(self, request):
        now_utc = BusinessTimeService.get_now_utc()
        today_biz_date = BusinessTimeService.get_business_date(now_utc)
        boundary_utc = BusinessTimeService.get_business_day_boundary_utc(today_biz_date)
        start_utc = BusinessTimeService.get_business_day_start_utc(today_biz_date)

        # Orders for today
        today_paid_orders = Order.objects.filter(
            business_date=today_biz_date, status=OrderStatus.PAID
        )
        today_paid_tickets_count = (
            today_paid_orders.aggregate(total_qty=Sum("quantity"))["total_qty"] or 0
        )
        today_revenue_toman = (
            today_paid_orders.aggregate(total_rev=Sum("total_price_toman"))["total_rev"]
            or 0
        )

        # Check-ins for today
        today_checkins_count = CheckInRecord.objects.filter(
            scanned_at__gte=start_utc,
            scanned_at__lt=boundary_utc,
            result=CheckInResult.SUCCESS,
        ).count()

        # Unused valid tickets for today
        today_unused_valid_tickets = Ticket.objects.filter(
            business_date=today_biz_date,
            status=TicketStatus.ISSUED,
            valid_until__gt=now_utc,
        ).count()

        pending_payments_count = Order.objects.filter(
            status=OrderStatus.PENDING_PAYMENT
        ).count()
        late_review_orders_count = Order.objects.filter(
            status=OrderStatus.PAID_LATE_REVIEW
        ).count()

        recent_orders_qs = Order.objects.order_by("-created_at")[:8]
        recent_checkins_qs = CheckInRecord.objects.select_related(
            "ticket", "staff_user"
        ).order_by("-scanned_at")[:8]

        return Response(
            {
                "current_business_date": str(today_biz_date),
                "today_paid_tickets_count": today_paid_tickets_count,
                "today_revenue_toman": today_revenue_toman,
                "today_checkins_count": today_checkins_count,
                "today_unused_valid_tickets": today_unused_valid_tickets,
                "pending_payments_count": pending_payments_count,
                "late_review_orders_count": late_review_orders_count,
                "recent_orders": [
                    {
                        "public_id": str(o.public_id),
                        "purchaser_name": o.purchaser_name,
                        "purchaser_phone": o.purchaser_phone,
                        "quantity": o.quantity,
                        "total_price_toman": o.total_price_toman,
                        "status": o.status,
                        "created_at": o.created_at.isoformat(),
                    }
                    for o in recent_orders_qs
                ],
                "recent_checkins": CheckInRecordSerializer(
                    recent_checkins_qs, many=True
                ).data,
            }
        )
