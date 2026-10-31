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


def extract_guest_token(request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[-1].strip()
        if token.startswith("agt_"):
            return token

    param_token = request.query_params.get("token", "")
    if param_token.startswith("agt_"):
        return param_token

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

        origin = (
            request.headers.get("origin")
            or request.headers.get("referer", "")
            or request.META.get("HTTP_ORIGIN", "")
        ).rstrip("/")
        if "/api" in origin:
            origin = origin.split("/api")[0]
        if "/#" in origin:
            origin = origin.split("/#")[0]

        try:
            order, guest_token, is_created = OrderService.create_order(
                purchaser_name=data["purchaser_name"],
                purchaser_phone=data["purchaser_phone"],
                quantity=data["quantity"],
                purchaser_email=data.get("purchaser_email", ""),
                idempotency_key=idempotency_key,
                frontend_origin=origin,
            )
        except ValidationError as e:
            return Response(
                {"error": str(e.message if hasattr(e, "message") else e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve callback URL dynamically so it matches where the user came from (e.g. phone on LAN)
        callback_url = None
        if origin:
            callback_url = f"{origin.rstrip('/')}/api/v1/payments/zarinpal/callback/"
        elif request.get_host():
            scheme = "https" if request.is_secure() else "http"
            callback_url = f"{scheme}://{request.get_host()}/api/v1/payments/zarinpal/callback/"

        # Initiate payment
        pay_success, redirect_url, attempt, pay_err = PaymentService.initiate_payment(
            order, callback_url=callback_url
        )
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

        resp = Response(response_data, status=status.HTTP_201_CREATED)
        if guest_token:
            resp.set_cookie(
                "guest_access_token",
                guest_token,
                max_age=86400 * 7,
                httponly=True,
                samesite="Lax",
                secure=False,  # Set to True in production
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

        # Allow authenticated admins or guest owner with valid token/authority/paid order
        is_staff_admin = (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
        if not is_staff_admin:
            token = extract_guest_token(request)
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
