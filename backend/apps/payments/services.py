from apps.business_time.services import BusinessTimeService
from apps.core.services import log_audit
from apps.orders.models import Order, OrderStatus
from apps.tickets.services import TicketService
from django.conf import settings
from django.db import transaction

from .adapters import get_payment_adapter
from .models import PaymentAttempt, PaymentAttemptStatus


def safe_gateway_payload(payload):
    """Keep diagnostic codes only; provider payloads may contain card data."""
    if not isinstance(payload, dict):
        return {}
    data = payload.get("data")
    if isinstance(data, dict):
        return {"code": data.get("code")}
    return {key: payload[key] for key in ("mock_code", "error") if key in payload}


class PaymentService:
    @classmethod
    def initiate_payment(
        cls, order: Order, callback_url: str = None
    ) -> tuple[bool, str, PaymentAttempt | None, str]:
        """
        Creates a payment attempt record and requests a payment session from the configured gateway.
        Returns: (success: bool, redirect_url: str, attempt: PaymentAttempt, error_message: str)
        """
        adapter = get_payment_adapter()
        amount_toman = order.total_price_toman
        amount_rial = adapter.toman_to_rial(amount_toman)

        default_callback = getattr(
            settings,
            "PAYMENT_CALLBACK_URL",
            "http://localhost:8000/api/v1/payments/zarinpal/callback/",
        )
        resolved_callback = callback_url or default_callback

        attempt = PaymentAttempt.objects.create(
            order=order,
            provider=getattr(settings, "PAYMENT_PROVIDER", "zarinpal"),
            amount_toman=amount_toman,
            amount_rial=amount_rial,
            status=PaymentAttemptStatus.REQUESTING,
        )

        success, authority, redirect_url, err_msg, raw_payload = (
            adapter.request_payment(
                order=order, amount_toman=amount_toman, callback_url=resolved_callback
            )
        )

        attempt.gateway_payload = safe_gateway_payload(raw_payload)
        if success:
            attempt.authority = authority
            attempt.status = PaymentAttemptStatus.PENDING
            attempt.save(update_fields=["authority", "status", "gateway_payload"])
            return True, redirect_url, attempt, ""
        else:
            attempt.status = PaymentAttemptStatus.FAILED
            attempt.save(update_fields=["status", "gateway_payload"])
            return False, "", attempt, err_msg

    @classmethod
    def process_callback(
        cls, authority: str, gateway_status: str
    ) -> tuple[str, str, Order | None]:
        """
        Processes server-to-server callback response using non-blocking multi-phase verification.
        - Phase 1: Short atomic transaction locks attempt, validates gateway status, claims attempt (VERIFYING).
        - External verification: Calls gateway API completely outside database transactions (zero DB lock duration).
        - Phase 2: Short atomic transaction locks attempt, updates status, checks boundary, issues tickets.

        Returns: (result_state: str, message: str, order: Order)
        Where result_state is one of: 'SUCCESS', 'FAILED', 'LATE_REVIEW', 'ALREADY_PROCESSED'
        """
        cleaned_auth = authority.strip()

        # --- Phase 1: Claim & Validate Attempt in Short DB Transaction ---
        with transaction.atomic():
            attempt = (
                PaymentAttempt.objects.select_for_update()
                .select_related("order")
                .filter(authority=cleaned_auth)
                .first()
            )

            if not attempt:
                return "FAILED", "تراکنش پرداخت در سامانه یافت نشد.", None

            order = Order.objects.select_for_update().get(pk=attempt.order_id)

            # Idempotency check: Already fulfilled
            if (
                attempt.status == PaymentAttemptStatus.VERIFIED
                and order.status in (OrderStatus.PAID, OrderStatus.PAID_LATE_REVIEW)
            ):
                return (
                    "ALREADY_PROCESSED",
                    "این تراکنش قبلاً با موفقیت تأیید و بلیت‌ها صادر شده‌اند.",
                    order,
                )

            # User cancellation or gateway error status
            if gateway_status.upper() != "OK":
                attempt.status = PaymentAttemptStatus.CANCELLED
                attempt.save(update_fields=["status"])
                if order.status == OrderStatus.PENDING_PAYMENT:
                    order.status = OrderStatus.PAYMENT_FAILED
                    order.save(update_fields=["status"])
                return (
                    "FAILED",
                    "پرداخت توسط کاربر لغو شد یا در درگاه با خطا مواجه گردید.",
                    order,
                )

            if attempt.amount_toman != order.total_price_toman or attempt.amount_rial != order.total_price_toman * 10:
                attempt.status = PaymentAttemptStatus.REVIEW_REQUIRED
                attempt.save(update_fields=["status"])
                return "LATE_REVIEW", "مبلغ تراکنش با سفارش مطابقت ندارد و نیازمند بررسی است.", order

            attempt.status = PaymentAttemptStatus.VERIFYING
            attempt.save(update_fields=["status"])
            amount_toman = attempt.amount_toman

        # --- External Provider Verification (ZERO DATABASE LOCK HELD) ---
        adapter = get_payment_adapter()
        verified, ref_id, code, err_msg, raw_payload = adapter.verify_payment(
            authority=cleaned_auth, amount_toman=amount_toman
        )
        now_utc = BusinessTimeService.get_now_utc()

        # --- Phase 2: Finalize Attempt & Order in Short DB Transaction ---
        with transaction.atomic():
            attempt = (
                PaymentAttempt.objects.select_for_update()
                .select_related("order")
                .filter(authority=cleaned_auth)
                .first()
            )
            order = Order.objects.select_for_update().get(pk=attempt.order_id)

            # Double-check idempotency in case of concurrent execution
            if (
                attempt.status == PaymentAttemptStatus.VERIFIED
                and order.status in (OrderStatus.PAID, OrderStatus.PAID_LATE_REVIEW)
            ):
                return (
                    "ALREADY_PROCESSED",
                    "این تراکنش قبلاً با موفقیت تأیید و بلیت‌ها صادر شده‌اند.",
                    order,
                )

            attempt.gateway_response_code = code
            attempt.gateway_payload = safe_gateway_payload(raw_payload)
            attempt.last_checked_at = now_utc

            if not verified:
                # Transport failures do not establish that a payment failed.
                attempt.status = PaymentAttemptStatus.UNKNOWN if code in (-999, -998) else PaymentAttemptStatus.FAILED
                attempt.save(
                    update_fields=[
                        "status",
                        "gateway_response_code",
                        "gateway_payload",
                        "last_checked_at",
                    ]
                )
                if code not in (-999, -998) and order.status == OrderStatus.PENDING_PAYMENT:
                    order.status = OrderStatus.PAYMENT_FAILED
                    order.save(update_fields=["status"])
                if code in (-999, -998):
                    return "PENDING", "وضعیت پرداخت نامشخص است؛ تأیید مجدد لازم است.", order
                return "FAILED", f"اعتبارسنجی پرداخت ناموفق بود: {err_msg}", order

            # Verified by gateway!
            attempt.status = PaymentAttemptStatus.VERIFIED
            attempt.reference_id = ref_id
            attempt.verified_at = now_utc
            attempt.save(
                update_fields=[
                    "status",
                    "reference_id",
                    "verified_at",
                    "gateway_response_code",
                    "gateway_payload",
                    "last_checked_at",
                ]
            )

            if order.status not in (OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_FAILED):
                # A second successful charge or a cancelled/refunded order needs
                # reconciliation, never a second fulfillment or state reversal.
                attempt.status = PaymentAttemptStatus.REVIEW_REQUIRED
                attempt.save(update_fields=["status"])
                return "LATE_REVIEW", "پرداخت تأیید شد و نیازمند بررسی مدیریت است.", order

            # Check boundary condition: Did payment verification complete AFTER order's business date ended?
            boundary_utc = order.business_day_end or BusinessTimeService.get_business_day_boundary_utc(order.business_date)
            if now_utc >= boundary_utc:
                order.status = OrderStatus.PAID_LATE_REVIEW
                order.paid_at = now_utc
                order.save(update_fields=["status", "paid_at"])
                log_audit(
                    None,
                    "PAYMENT_PAID_LATE_REVIEW",
                    "Order",
                    order.id,
                    {
                        "ref_id": ref_id,
                        "boundary_utc": str(boundary_utc),
                    },
                )
                return (
                    "LATE_REVIEW",
                    "پرداخت با موفقیت انجام شد اما به دلیل عبور از ساعت پایان روز کاری سالن، بلیت صادر نشد و سفارش جهت بررسی و استرداد به مدیریت ارجاع گردید.",
                    order,
                )

            # Standard successful fulfillment
            order.status = OrderStatus.PAID
            order.paid_at = now_utc
            order.save(update_fields=["status", "paid_at"])

            # Issue tickets
            TicketService.issue_tickets_for_order(order, paid_at=now_utc)

            log_audit(
                None,
                "ORDER_PAID_FULFILLED",
                "Order",
                order.id,
                {
                    "ref_id": ref_id,
                    "quantity": order.quantity,
                },
            )

            return "SUCCESS", "پرداخت با موفقیت انجام شد و بلیت‌ها صادر گردیدند.", order
