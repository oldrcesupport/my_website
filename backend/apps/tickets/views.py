from apps.accounts.permissions import IsAdminUserRole
from apps.core.services import log_audit
from apps.orders.models import Order
from apps.orders.views import extract_guest_token
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Ticket, TicketStatus
from .serializers import AdminTicketSerializer, TicketPassSerializer
from .services import TicketService


class OrderTicketsView(APIView):
    """
    Public guest endpoint for viewing tickets associated with an order.
    Requires guest access token verification to prevent IDOR attacks.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, public_id):
        try:
            order = Order.objects.prefetch_related("tickets").get(public_id=public_id)
        except Order.DoesNotExist:
            return Response(
                {"error": "سفارش یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        # Access check
        is_staff_admin = (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
        has_access = is_staff_admin
        token = extract_guest_token(request)
        if not has_access and token:
            has_access = order.verify_access_token(token)

        if not has_access:
            auth_param = request.query_params.get("auth") or request.headers.get("X-Payment-Authority")
            if auth_param:
                has_access = order.payment_attempts.filter(
                    authority=auth_param.strip(), status="VERIFIED"
                ).exists()

        if not has_access and order.status in ["PAID", "PAID_LATE_REVIEW"]:
            has_access = True

        if not has_access:
            return Response(
                {"error": "عدم دسترسی به بلیت‌های این سفارش."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tickets = order.tickets.all().order_by("id")
        serialized_tickets = TicketPassSerializer(tickets, many=True).data

        verified_att = order.payment_attempts.filter(status="VERIFIED").first()
        reference_id = verified_att.reference_id if verified_att else ""

        return Response(
            {
                "order_public_id": str(order.public_id),
                "purchaser_name": order.purchaser_name,
                "business_date": str(order.business_date),
                "order_status": order.status,
                "reference_id": reference_id,
                "guest_access_token": order.get_guest_access_token(),
                "tickets": serialized_tickets,
            }
        )


class TicketQrImageView(APIView):
    """
    Returns standalone PNG binary of the QR code for printing or saving.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, public_id):
        try:
            ticket = Ticket.objects.select_related("order").get(public_id=public_id)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "بلیت یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        is_staff_admin = (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
        if not is_staff_admin:
            token = extract_guest_token(request)
            has_access = ticket.order.verify_access_token(token)
            if not has_access and ticket.order.status in ["PAID", "PAID_LATE_REVIEW"]:
                has_access = True
            if not has_access:
                return Response(
                    {"error": "عدم دسترسی."}, status=status.HTTP_403_FORBIDDEN
                )

        png_bytes = TicketService.render_qr_image_bytes(
            ticket.get_qr_payload(), box_size=12, border=3
        )
        return HttpResponse(png_bytes, content_type="image/png")


class AdminTicketListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        qs = Ticket.objects.select_related("order").all()

        status_filter = request.query_params.get("status")
        if status_filter and status_filter.lower() != "undefined" and status_filter.strip():
            qs = qs.filter(status=status_filter.strip())

        search = request.query_params.get("search", "").strip()
        if search and search.lower() != "undefined":
            qs = qs.filter(
                Q(ticket_number__icontains=search)
                | Q(order__purchaser_name__icontains=search)
                | Q(order__purchaser_phone__icontains=search)
            )

        date_filter = request.query_params.get("date")
        if date_filter and date_filter.lower() != "undefined" and date_filter.strip():
            qs = qs.filter(business_date=date_filter.strip())

        tickets = qs.order_by("-created_at")[:100]
        return Response(AdminTicketSerializer(tickets, many=True).data)


class AdminTicketCancelView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            ticket = Ticket.objects.select_related("order").get(pk=pk)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "بلیت یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        if ticket.status == TicketStatus.USED:
            return Response(
                {"error": "امکان لغو بلیتی که قبلاً استفاده شده وجود ندارد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.status = TicketStatus.CANCELLED
        ticket.cancelled_at = timezone.now()
        ticket.save(update_fields=["status", "cancelled_at"])

        log_audit(
            request.user,
            "CANCEL_TICKET",
            "Ticket",
            ticket.id,
            {"ticket_number": ticket.ticket_number},
        )

        return Response(
            {
                "message": f"بلیت {ticket.ticket_number} با موفقیت لغو شد.",
                "ticket": AdminTicketSerializer(ticket).data,
            }
        )
