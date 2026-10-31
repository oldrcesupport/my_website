from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class StaffRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "مدیر ارشد (Super Admin)"
    ADMIN = "ADMIN", "مدیر سیستم (Admin)"
    STAFF_SCANNER = "STAFF_SCANNER", "مسئول ورود / کنترل بلیت (Scanner Staff)"


class StaffProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="staff_profile"
    )
    role = models.CharField(
        max_length=32,
        choices=StaffRole.choices,
        default=StaffRole.STAFF_SCANNER,
        db_index=True,
        verbose_name="نقش کاربری",
    )
    display_name = models.CharField(
        max_length=150, blank=True, default="", verbose_name="نام و نام خانوادگی"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "پروفایل پرسنل"
        verbose_name_plural = "پروفایل‌های پرسنل"

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    @property
    def is_super_admin(self) -> bool:
        return self.user.is_superuser or self.role == StaffRole.SUPER_ADMIN

    @property
    def is_admin(self) -> bool:
        return self.is_super_admin or self.role == StaffRole.ADMIN

    @property
    def can_scan(self) -> bool:
        return (
            self.is_super_admin or self.is_admin or self.role == StaffRole.STAFF_SCANNER
        )
