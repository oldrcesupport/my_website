import uuid

from apps.business_time.services import BusinessTimeService
from apps.orders.models import Order
from django.db import models

from .crypto import QRCryptoService


class TicketStatus(models.TextChoices):
    ISSUED = "ISSUED", "صادر شده (معتبر)"
    USED = "USED", "استفاده شده"
    CANCELLED = "CANCELLED", "لغو شده"


class Ticket(models.Model):
    public_id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True
    )
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="tickets")
    ticket_number = models.CharField(
        max_length=32, unique=True, db_index=True, verbose_name="شماره بلیت"
    )

    qr_token_hash = models.CharField(
        max_length=64, unique=True, db_index=True, verbose_name="هش توکن QR"
    )
    encrypted_qr_token = models.TextField(verbose_name="توکن رمزنگاری‌شده QR")

    status = models.CharField(
        max_length=32,
        choices=TicketStatus.choices,
        default=TicketStatus.ISSUED,
        db_index=True,
        verbose_name="وضعیت ثبت‌شده بلیت",
    )

    business_date = models.DateField(db_index=True, verbose_name="تاریخ روز کاری")
    valid_from = models.DateTimeField(db_index=True, verbose_name="آغاز اعتبار")
    valid_until = models.DateTimeField(
        db_index=True, verbose_name="پایان اعتبار (برش روز کاری)"
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    used_at = models.DateTimeField(
        null=True, blank=True, db_index=True, verbose_name="زمان پذیرش"
    )
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان لغو")

    class Meta:
        verbose_name = "بلیت"
        verbose_name_plural = "بلیت‌ها"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.ticket_number} - {self.get_status_display()}"

    def get_effective_status(self, now_utc=None) -> str:
        """
        Dynamically calculates effective ticket status:
        - CANCELLED if marked cancelled.
        - USED if redeemed.
        - EXPIRED if current time is past valid_until.
        - NOT_YET_VALID if current time is before valid_from.
        - VALID otherwise.
        """
        if self.status == TicketStatus.CANCELLED:
            return "CANCELLED"
        if self.status == TicketStatus.USED:
            return "USED"

        now = now_utc or BusinessTimeService.get_now_utc()
        if now > self.valid_until:
            return "EXPIRED"
        if now < self.valid_from:
            return "NOT_YET_VALID"

        return "VALID"

    def get_raw_token(self) -> str:
        """Decrypts and returns the raw QR token."""
        return QRCryptoService.decrypt_token(self.encrypted_qr_token)

    def get_qr_payload(self) -> str:
        """Returns the payload string encoded into the QR code."""
        return QRCryptoService.build_qr_payload(self.get_raw_token())
