from apps.accounts.permissions import IsAdminUserRole
from apps.core.services import log_audit
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PaymentAttempt
from .services import PaymentService


class ZarinPalCallbackView(APIView):
    """
    Receives customer redirection from ZarinPal.
    Executes authoritative server-to-server verification and fulfills tickets.
    Then redirects the browser to the frontend return page.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        authority = request.query_params.get("Authority", "").strip()
        gateway_status = request.query_params.get("Status", "").strip()

        frontend_base = getattr(
            settings, "FRONTEND_URL", "http://localhost:3000"
        ).rstrip("/")

        if not authority:
            return redirect(
                f"{frontend_base}/payment/return?status=error&message=missing_authority"
            )

        result_state, msg, order = PaymentService.process_callback(
            authority, gateway_status
        )

        frontend_base = getattr(
            settings, "FRONTEND_URL", "http://localhost:3000"
        ).rstrip("/")

        order_id_param = f"&order_id={order.public_id}" if order else ""

        guest_token = order.get_guest_access_token() if order else ""
        token_param = f"&token={guest_token}" if guest_token else ""

        ref_id = ""
        if order:
            verified_att = order.payment_attempts.filter(status="VERIFIED").first()
            if verified_att and verified_att.reference_id:
                ref_id = verified_att.reference_id
        ref_param = f"&ref_id={ref_id}" if ref_id else ""

        redirect_url = f"{frontend_base}/payment/return?status={result_state.lower()}{order_id_param}{token_param}{ref_param}&auth={authority}"
        resp = redirect(redirect_url)
        if guest_token and order:
            is_prod = getattr(settings, "APP_ENV", "development") == "production"
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


class AdminPaymentListView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        qs = PaymentAttempt.objects.select_related("order").all()

        status_filter = request.query_params.get("status")
        if status_filter and status_filter.lower() != "undefined" and status_filter.strip():
            qs = qs.filter(status=status_filter.strip())

        authority_filter = request.query_params.get("authority")
        if authority_filter and authority_filter.lower() != "undefined" and authority_filter.strip():
            qs = qs.filter(authority__icontains=authority_filter.strip())

        attempts = qs.order_by("-created_at")[:100]
        data = [
            {
                "id": a.id,
                "order_public_id": str(a.order.public_id),
                "purchaser_name": a.order.purchaser_name,
                "purchaser_phone": a.order.purchaser_phone,
                "provider": a.provider,
                "authority": a.authority,
                "amount_toman": a.amount_toman,
                "amount_rial": a.amount_rial,
                "status": a.status,
                "reference_id": a.reference_id,
                "gateway_response_code": a.gateway_response_code,
                "created_at": a.created_at.isoformat(),
                "verified_at": a.verified_at.isoformat() if a.verified_at else None,
                "last_checked_at": a.last_checked_at.isoformat()
                if a.last_checked_at
                else None,
            }
            for a in attempts
        ]
        return Response(data)


class AdminRetryVerificationView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            attempt = PaymentAttempt.objects.select_related("order").get(pk=pk)
        except PaymentAttempt.DoesNotExist:
            return Response(
                {"error": "تراکنش پرداخت یافت نشد."}, status=status.HTTP_404_NOT_FOUND
            )

        if not attempt.authority:
            return Response(
                {"error": "این تراکنش فاقد شناسه درگاه (Authority) است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result_state, msg, order = PaymentService.process_callback(
            attempt.authority, "OK"
        )
        log_audit(
            request.user,
            "RETRY_PAYMENT_VERIFICATION",
            "PaymentAttempt",
            attempt.id,
            {"result": result_state},
        )

        return Response(
            {
                "result": result_state,
                "message": msg,
                "order_status": order.status if order else "UNKNOWN",
            }
        )
