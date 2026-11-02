from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class RestaurantSettings(models.Model):
    """
    Singleton configuration for the restaurant.
    Guarantees exactly one active configuration record with id=1.
    """

    id = models.IntegerField(primary_key=True, default=1)
    restaurant_name = models.CharField(
        max_length=255, default="نام رستوران", verbose_name="نام رستوران"
    )
    tagline = models.CharField(
        max_length=255, blank=True, default="", verbose_name="شعار یا زیرعنوان"
    )
    description = models.TextField(
        blank=True, default="", verbose_name="توضیحات رستوران"
    )
    address = models.CharField(
        max_length=500, blank=True, default="", verbose_name="آدرس"
    )
    phone = models.CharField(
        max_length=50, blank=True, default="", verbose_name="شماره تماس"
    )

    currency_unit = models.CharField(
        max_length=20, default="TOMAN", verbose_name="واحد ارزی"
    )
    ticket_price_toman = models.BigIntegerField(
        default=100000, verbose_name="قیمت بلیت (تومان)"
    )
    is_demo_price = models.BooleanField(default=True, verbose_name="قیمت آزمایشی است")
    sales_enabled = models.BooleanField(
        default=True, verbose_name="فروش آنلاین فعال است"
    )

    business_timezone = models.CharField(
        max_length=50, default="Asia/Tehran", verbose_name="منطقه زمانی"
    )
    business_day_cutoff = models.TimeField(
        default="00:00:00", verbose_name="ساعت شروع روز کاری (برش)"
    )
    checkout_cutoff_margin_minutes = models.PositiveIntegerField(
        default=5, verbose_name="فاصله توقف فروش پیش از برش روز (دقیقه)"
    )

    capacity_enabled = models.BooleanField(
        default=False, verbose_name="محدودیت ظرفیت فعال است"
    )
    capacity_policy = models.CharField(
        max_length=50,
        default="UNCONFIGURED",
        choices=[
            ("UNCONFIGURED", "تنظیم نشده"),
            ("DAILY_SALES_LIMIT", "حداکثر فروش روزانه"),
            ("CONCURRENT_OCCUPANCY", "ظرفیت همزمان سالن"),
        ],
        verbose_name="سیاست ظرفیت",
    )
    capacity_limit = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="میزان ظرفیت"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "تنظیمات رستوران"
        verbose_name_plural = "تنظیمات رستوران"

    def save(self, *args, **kwargs):
        self.id = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """Retrieves or initializes the singleton settings record."""
        obj, created = cls.objects.get_or_create(
            id=1,
            defaults={
                "restaurant_name": getattr(settings, "RESTAURANT_NAME", "نام رستوران"),
                "ticket_price_toman": 0 if settings.APP_ENV == "production" else getattr(settings, "DEV_DEMO_TICKET_PRICE_TOMAN", 100000),
                "is_demo_price": True if settings.APP_ENV == "production" else getattr(settings, "IS_DEMO_PRICE", True),
                "sales_enabled": settings.APP_ENV != "production",
                "business_timezone": getattr(
                    settings, "BUSINESS_TIMEZONE", "Asia/Tehran"
                ),
                "business_day_cutoff": getattr(
                    settings, "BUSINESS_DAY_CUTOFF", "00:00:00"
                ),
                "checkout_cutoff_margin_minutes": getattr(
                    settings, "CHECKOUT_CUTOFF_MARGIN_MINUTES", 5
                ),
                "capacity_enabled": getattr(settings, "CAPACITY_ENABLED", False),
                "capacity_policy": getattr(settings, "CAPACITY_POLICY", "UNCONFIGURED"),
            },
        )
        return obj

    def __str__(self):
        return f"{self.restaurant_name} ({self.ticket_price_toman:,} تومان)"


class AuditLog(models.Model):
    """
    Audit log for tracking sensitive administrative operations.
    Never stores passwords, payment credentials, or raw QR tokens.
    """

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_actions",
    )
    action = models.CharField(max_length=100, db_index=True)
    target_model = models.CharField(max_length=100, blank=True, default="")
    target_id = models.CharField(max_length=100, blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "ثبت رویداد (Audit Log)"
        verbose_name_plural = "ثبت رویدادها (Audit Logs)"
        ordering = ["-created_at"]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        return f"{self.created_at:%Y-%m-%d %H:%M:%S} - {actor_name} -> {self.action}"
