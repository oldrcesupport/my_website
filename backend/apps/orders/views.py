from apps.accounts.permissions import IsAdminUserRole
from apps.payments.services import PaymentService
from django.core.exceptions import ValidationError
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import CreateOrderSerializer, OrderStatusSerializer
from .services import OrderService


def extract_guest_token(request, public_id=None) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[-1].strip()
        if token.startswith("agt_"):
            return token

    custom_header = request.headers.get("X-Guest-Token", "").strip()
    if custom_header.startswith("agt_"):
        return custom_header

    if public_id:
        cookie_scoped = request.COOKIES.get(f"guest_token_{public_id}", "")
        if cookie_scoped.startswith("agt_"):
            return cookie_scoped

    cookie_token = request.COOKIES.get("guest_access_token", "")
    if cookie_token.startswith("agt_"):
        return cookie_token

    return ""


class CreateOrderView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        idempotency_key = request.headers.get("Idempotency-Key", "").strip() or None

        try:
            order, guest_token, is_created = OrderService.create_order(
                purchaser_name=data["purchaser_name"],
                purchaser_phone=data["purchaser_phone"],
                quantity=data["quantity"],
                purchaser_email=data.get("purchaser_email", ""),
                idempotency_key=idempotency_key,
            )
        except ValidationError as e:
            return Response(
                {"error": str(e.message if hasattr(e, "message") else e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Initiate payment strictly using configured PAYMENT_CALLBACK_URL (no client-header poisoning)
        pay_success, redirect_url, attempt, pay_err = PaymentService.initiate_payment(order)
        if not pay_success:
            return Response(
                {
                    "error": f"عدم امکان ایجاد نشست پرداخت: {pay_err}",
                    "order_public_id": str(order.public_id),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        response_data = {
            "order_public_id": str(order.public_id),
            "quantity": order.quantity,
            "unit_price_toman": order.unit_price_toman,
            "total_price_toman": order.total_price_toman,
            "currency_unit": order.currency_unit,
            "business_date": str(order.business_date),
            "payment_deadline": order.payment_deadline.isoformat(),
            "payment_redirect_url": redirect_url,
            "guest_access_token": guest_token,
        }

        from django.conf import settings
        is_prod = getattr(settings, "APP_ENV", "development") == "production"

        resp = Response(response_data, status=status.HTTP_201_CREATED)
        if guest_token:
            resp.set_cookie(
                f"guest_token_{order.public_id}",
                guest_token,
                max_age=86400 * 7,
                httponly=True,
                samesite="Lax",
                secure=is_prod,
            )
            resp.set_cookie(
                "guest_access_token",
                guest_token,
                max_age=86400 * 7,
                httponly=True,
                samesite="Lax",
                secure=is_prod,
            )
        return resp


class OrderStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, public_id):
        try:
            order = Order.objects.get(public_id=public_id)
        except Order.DoesNotExist:
            return Response(
                {"error": "سفارش یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        # Allow authenticated admins (Super Admin / Admin) or verified guest owner
        # Note: Scanner staff (STAFF_SCANNER) do NOT have access to customer orders
        profile = getattr(request.user, "staff_profile", None)
        is_admin_user = (
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or (profile and profile.is_admin))
        )
        if not is_admin_user:
            token = extract_guest_token(request, public_id=order.public_id)
            if not token or not order.verify_access_token(token):
                return Response(
                    {"error": "عدم دسترسی به سفارش."}, status=status.HTTP_403_FORBIDDEN
                )

        return Response(OrderStatusSerializer(order).data)


class AdminOrderListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        qs = Order.objects.prefetch_related("tickets", "payment_attempts").all()

        status_filter = request.query_params.get("status")
        if status_filter and status_filter.lower() != "undefined" and status_filter.strip():
            qs = qs.filter(status=status_filter.strip())

        search = request.query_params.get("search", "").strip()
        if search and search.lower() != "undefined":
            qs = qs.filter(
                Q(purchaser_phone__icontains=search)
                | Q(purchaser_name__icontains=search)
                | Q(public_id__icontains=search)
            )

        date_filter = request.query_params.get("date")
        if date_filter and date_filter.lower() != "undefined" and date_filter.strip():
            qs = qs.filter(business_date=date_filter.strip())

        orders = qs.order_by("-created_at")[:100]
        return Response(OrderStatusSerializer(orders, many=True).data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request, public_id):
        try:
            order = Order.objects.prefetch_related("tickets", "payment_attempts").get(
                public_id=public_id
            )
        except Order.DoesNotExist:
            return Response(
                {"error": "سفارش یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        data = OrderStatusSerializer(order).data
        data["payment_attempts"] = [
            {
                "id": att.id,
                "provider": att.provider,
                "authority": att.authority,
                "amount_toman": att.amount_toman,
                "amount_rial": att.amount_rial,
                "status": att.status,
                "reference_id": att.reference_id,
                "gateway_response_code": att.gateway_response_code,
                "created_at": att.created_at.isoformat(),
                "verified_at": att.verified_at.isoformat() if att.verified_at else None,
            }
            for att in order.payment_attempts.all()
        ]
        data["tickets"] = [
            {
                "id": t.id,
                "public_id": str(t.public_id),
                "ticket_number": t.ticket_number,
                "status": t.status,
                "effective_status": t.get_effective_status(),
                "used_at": t.used_at.isoformat() if t.used_at else None,
            }
            for t in order.tickets.all()
        ]
        return Response(data)
