import hashlib
import secrets
import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class OrderStatus(models.TextChoices):
    PENDING_PAYMENT = "PENDING_PAYMENT", "در انتظار پرداخت"
    PAID = "PAID", "پرداخت شده"
    PAYMENT_FAILED = "PAYMENT_FAILED", "پرداخت ناموفق"
    CANCELLED = "CANCELLED", "لغو شده"
    EXPIRED = "EXPIRED", "منقضی شده"
    PAID_LATE_REVIEW = "PAID_LATE_REVIEW", "پرداخت دیرهنگام (نیازمند بازبینی)"
    REFUND_PENDING = "REFUND_PENDING", "در انتظار استرداد"
    REFUNDED = "REFUNDED", "مسترد شده"


class Order(models.Model):
    public_id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True
    )
    purchaser_name = models.CharField(max_length=200, verbose_name="نام خریدار")
    purchaser_phone = models.CharField(
        max_length=32, db_index=True, verbose_name="شماره تماس"
    )
    purchaser_email = models.EmailField(
        blank=True, default="", verbose_name="ایمیل خریدار"
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(50)],
        verbose_name="تعداد بلیت",
    )
    unit_price_toman = models.BigIntegerField(verbose_name="قیمت واحد بلیت (تومان)")
    total_price_toman = models.BigIntegerField(verbose_name="مبلغ کل (تومان)")
    currency_unit = models.CharField(
        max_length=20, default="TOMAN", verbose_name="واحد ارزی"
    )

    business_date = models.DateField(db_index=True, verbose_name="تاریخ روز کاری")
    status = models.CharField(
        max_length=32,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING_PAYMENT,
        db_index=True,
        verbose_name="وضعیت سفارش",
    )

    idempotency_key = models.CharField(
        max_length=128, unique=True, null=True, blank=True, db_index=True
    )
    guest_access_token_hash = models.CharField(
        max_length=64, db_index=True, verbose_name="هش توکن دسترسی مهمان"
    )
    encrypted_guest_token = models.TextField(
        blank=True, default="", verbose_name="توکن دسترسی رمزنگاری‌شده مهمان"
    )
    frontend_origin = models.CharField(
        max_length=255, blank=True, default="", verbose_name="آدرس مبدأ فرانت‌اند"
    )
    payment_deadline = models.DateTimeField(db_index=True, verbose_name="مهلت پرداخت")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "سفارش"
        verbose_name_plural = "سفارش‌ها"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1) & models.Q(quantity__lte=50),
                name="order_quantity_range",
            ),
            models.CheckConstraint(
                condition=models.Q(total_price_toman__gte=0),
                name="order_positive_total_price",
            ),
        ]

    def __str__(self):
        return f"سفارش {self.public_id} - {self.purchaser_name} ({self.quantity} بلیت) - {self.get_status_display()}"

    @staticmethod
    def hash_access_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @classmethod
    def generate_access_token(cls) -> str:
        # High entropy secret (32 bytes = 256 bits)
        return "agt_" + secrets.token_urlsafe(32)

    def verify_access_token(self, token: str) -> bool:
        if not token or not self.guest_access_token_hash:
            return False
        return secrets.compare_digest(
            self.guest_access_token_hash, self.hash_access_token(token)
        )

    def set_guest_access_token(self, raw_token: str):
        from apps.tickets.crypto import QRCryptoService

        self.guest_access_token_hash = self.hash_access_token(raw_token)
        self.encrypted_guest_token = QRCryptoService.encrypt_token(raw_token)

    def get_guest_access_token(self) -> str:
        if not self.encrypted_guest_token:
            return ""
        from apps.tickets.crypto import QRCryptoService

        try:
            return QRCryptoService.decrypt_token(self.encrypted_guest_token)
        except Exception:
            return ""
