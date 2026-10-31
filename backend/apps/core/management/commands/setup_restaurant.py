import os
import secrets
from apps.accounts.models import StaffProfile, StaffRole
from apps.core.models import RestaurantSettings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Idempotently initializes restaurant singleton settings and provisions initial administrative roles without resetting existing passwords."

    def add_arguments(self, parser):
        parser.add_argument(
            "--admin-username", default="admin", help="Super admin username"
        )
        parser.add_argument(
            "--admin-password",
            default=None,
            help="Super admin password (only used when initially creating user)",
        )
        parser.add_argument(
            "--staff-username", default="scanner_staff", help="Check-in staff username"
        )
        parser.add_argument(
            "--staff-password",
            default=None,
            help="Check-in staff password (only used when initially creating user)",
        )

    def handle(self, *args, **options):
        self.stdout.write("Initializing Restaurant Singleton Settings...")
        settings_obj = RestaurantSettings.get_settings()
        self.stdout.write(
            self.style.SUCCESS(
                f"Restaurant Settings Ready: '{settings_obj.restaurant_name}', "
                f"Price: {settings_obj.ticket_price_toman:,} Toman (Demo={settings_obj.is_demo_price})"
            )
        )

        admin_username = options["admin_username"]
        admin_password = (
            options["admin_password"]
            or os.getenv("INITIAL_ADMIN_PASSWORD")
            or "AdminSecret123!"
        )

        admin_user, created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                "email": "admin@restaurant.example",
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            admin_user.set_password(admin_password)
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Super Admin account '{admin_username}' provisioned successfully."
                )
            )
        else:
            self.stdout.write(
                self.style.NOTICE(
                    f"Super Admin account '{admin_username}' already exists. Password preserved (not overwritten)."
                )
            )

        profile, _ = StaffProfile.objects.get_or_create(
            user=admin_user,
            defaults={"role": StaffRole.SUPER_ADMIN, "display_name": "مدیر کل سیستم"},
        )
        if profile.role != StaffRole.SUPER_ADMIN:
            profile.role = StaffRole.SUPER_ADMIN
            profile.save(update_fields=["role"])

        staff_username = options["staff_username"]
        staff_password = (
            options["staff_password"]
            or os.getenv("INITIAL_STAFF_PASSWORD")
            or "StaffSecret123!"
        )

        staff_user, s_created = User.objects.get_or_create(
            username=staff_username,
            defaults={
                "email": "scanner@restaurant.example",
                "is_staff": True,
                "is_superuser": False,
            },
        )

        if s_created:
            staff_user.set_password(staff_password)
            staff_user.is_staff = True
            staff_user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Scanner Staff account '{staff_username}' provisioned successfully."
                )
            )
        else:
            self.stdout.write(
                self.style.NOTICE(
                    f"Scanner Staff account '{staff_username}' already exists. Password preserved (not overwritten)."
                )
            )

        s_profile, _ = StaffProfile.objects.get_or_create(
            user=staff_user,
            defaults={
                "role": StaffRole.STAFF_SCANNER,
                "display_name": "مسئول گیت ورودی",
            },
        )
        if s_profile.role != StaffRole.STAFF_SCANNER:
            s_profile.role = StaffRole.STAFF_SCANNER
            s_profile.save(update_fields=["role"])
