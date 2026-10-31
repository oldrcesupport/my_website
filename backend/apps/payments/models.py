from apps.orders.models import Order
from django.db import models


class PaymentAttemptStatus(models.TextChoices):
    REQUESTING = "REQUESTING", "در حال درخواست از درگاه"
    PENDING = "PENDING", "در انتظار پرداخت کاربر"
    VERIFYING = "VERIFYING", "در حال اعتبارسنجی تراکنش"
    VERIFIED = "VERIFIED", "تأیید و پرداخت شده"
    FAILED = "FAILED", "تراکنش ناموفق"
    CANCELLED = "CANCELLED", "لغو شده توسط کاربر"
    UNKNOWN = "UNKNOWN", "وضعیت نامشخص"
    REVIEW_REQUIRED = "REVIEW_REQUIRED", "نیازمند بازبینی دستی"


class PaymentAttempt(models.Model):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="payment_attempts"
    )
    provider = models.CharField(max_length=50, default="zarinpal", db_index=True)
    authority = models.CharField(
        max_length=100, unique=True, null=True, blank=True, db_index=True
    )
    provider_transaction_id = models.CharField(max_length=100, blank=True, default="")

    amount_toman = models.BigIntegerField(verbose_name="مبلغ به تومان")
    amount_rial = models.BigIntegerField(verbose_name="مبلغ به ریال (ارسال به درگاه)")

    status = models.CharField(
        max_length=32,
        choices=PaymentAttemptStatus.choices,
        default=PaymentAttemptStatus.PENDING,
        db_index=True,
        verbose_name="وضعیت تراکنش",
    )

    idempotency_key = models.CharField(max_length=128, null=True, blank=True)
    gateway_response_code = models.IntegerField(null=True, blank=True)
    reference_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
        verbose_name="شناسه ارجاع درگاه (RefID)",
    )
    gateway_payload = models.JSONField(
        default=dict, blank=True, verbose_name="داده‌های بازگشتی درگاه (Sanitized)"
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    last_checked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "تلاش پرداخت"
        verbose_name_plural = "تلاش‌های پرداخت"
        ordering = ["-created_at"]

    def __str__(self):
        return f"پرداخت {self.authority or self.id} - سفارش {self.order.public_id} - {self.get_status_display()}"
