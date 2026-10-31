from apps.business_time.services import BusinessTimeService
from apps.core.services import log_audit
from apps.orders.models import Order, OrderStatus
from apps.tickets.services import TicketService
from django.conf import settings
from django.db import transaction

from .adapters import get_payment_adapter
from .models import PaymentAttempt, PaymentAttemptStatus


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

        attempt.gateway_payload = raw_payload
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
        Processes server-to-server callback response.
        Atomically locks Order and PaymentAttempt to enforce idempotency and safe ticket issuance.
        Handles boundary late payments without issuing invalid tickets.

        Returns: (result_state: str, message: str, order: Order)
        Where result_state is one of: 'SUCCESS', 'FAILED', 'LATE_REVIEW', 'ALREADY_PROCESSED'
        """
        cleaned_auth = authority.strip()
        with transaction.atomic():
            attempt = (
                PaymentAttempt.objects.select_for_update()
                .select_related("order")
                .filter(authority=cleaned_auth)
                .first()
            )

            if not attempt:
                return "FAILED", "تراکنش پرداخت در سامانه یافت نشد.", None

            order = attempt.order

            # Idempotency check: Already fulfilled
            if (
                attempt.status == PaymentAttemptStatus.VERIFIED
                and order.status == OrderStatus.PAID
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

            # Verify with provider
            attempt.status = PaymentAttemptStatus.VERIFYING
            attempt.save(update_fields=["status"])

            adapter = get_payment_adapter()
            verified, ref_id, code, err_msg, raw_payload = adapter.verify_payment(
                authority=cleaned_auth, amount_toman=attempt.amount_toman
            )

            attempt.gateway_response_code = code
            attempt.gateway_payload = raw_payload
            now_utc = BusinessTimeService.get_now_utc()
            attempt.last_checked_at = now_utc

            if not verified:
                attempt.status = PaymentAttemptStatus.FAILED
                attempt.save(
                    update_fields=[
                        "status",
                        "gateway_response_code",
                        "gateway_payload",
                        "last_checked_at",
                    ]
                )
                if order.status == OrderStatus.PENDING_PAYMENT:
                    order.status = OrderStatus.PAYMENT_FAILED
                    order.save(update_fields=["status"])
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

            # Check boundary condition: Did payment verification complete AFTER order's business date ended?
            boundary_utc = BusinessTimeService.get_business_day_boundary_utc(
                order.business_date
            )
            if now_utc > boundary_utc:
                order.status = OrderStatus.PAID_LATE_REVIEW
                order.paid_at = now_utc
                order.save(update_fields=["status", "paid_at"])
                log_audit(
                    None,
                    "PAYMENT_PAID_LATE_REVIEW",
                    "Order",
                    order.id,
                    {
                        "authority": cleaned_auth,
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
                    "authority": cleaned_auth,
                    "ref_id": ref_id,
                    "quantity": order.quantity,
                },
            )

            return "SUCCESS", "پرداخت با موفقیت انجام شد و بلیت‌ها صادر گردیدند.", order
