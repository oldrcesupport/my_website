from apps.tickets.models import Ticket
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class CheckInResult(models.TextChoices):
    SUCCESS = "SUCCESS", "ورود مجاز / تأیید شد"
    ALREADY_USED = "ALREADY_USED", "قبلاً استفاده شده"
    EXPIRED = "EXPIRED", "منقضی شده"
    CANCELLED = "CANCELLED", "لغو شده"
    ORDER_UNPAID = "ORDER_UNPAID", "سفارش پرداخت نشده"
    INVALID_TOKEN = "INVALID_TOKEN", "توکن نامعتبر"


class CheckInRecord(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="check_in_records",
        verbose_name="بلیت",
    )
    staff_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scanned_checkins",
        verbose_name="کاربر ثبت‌کننده",
    )
    result = models.CharField(
        max_length=32,
        choices=CheckInResult.choices,
        db_index=True,
        verbose_name="نتیجه اسکن",
    )
    scanned_at = models.DateTimeField(
        auto_now_add=True, db_index=True, verbose_name="زمان اسکن"
    )
    scanner_device_id = models.CharField(
        max_length=128, blank=True, default="", verbose_name="شناسه دستگاه اسکنر"
    )
    notes = models.CharField(
        max_length=255, blank=True, default="", verbose_name="توضیحات تکمیلی"
    )

    class Meta:
        verbose_name = "سابقه اسکن ورود"
        verbose_name_plural = "سوابق اسکن‌های ورود"
        ordering = ["-scanned_at"]

    def __str__(self):
        ticket_num = self.ticket.ticket_number if self.ticket else "نامشخص"
        return (
            f"{self.scanned_at:%H:%M:%S} - {ticket_num} -> {self.get_result_display()}"
        )
