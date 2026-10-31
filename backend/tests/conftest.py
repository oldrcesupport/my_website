import pytest
from apps.accounts.models import StaffProfile, StaffRole
from apps.core.models import RestaurantSettings
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture(autouse=True)
def setup_restaurant_settings(db):
    settings_obj = RestaurantSettings.get_settings()
    settings_obj.sales_enabled = True
    settings_obj.ticket_price_toman = 100000
    settings_obj.is_demo_price = True
    settings_obj.business_timezone = "Asia/Tehran"
    settings_obj.business_day_cutoff = "00:00:00"
    settings_obj.checkout_cutoff_margin_minutes = 5
    settings_obj.save()
    return settings_obj


@pytest.fixture
def superadmin_user(db):
    user = User.objects.create_superuser(
        "test_superadmin", "super@test.example", "pass12345"
    )
    StaffProfile.objects.create(
        user=user, role=StaffRole.SUPER_ADMIN, display_name="مدیر ارشد تست"
    )
    return user


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        "test_admin", "admin@test.example", "pass12345", is_staff=True
    )
    StaffProfile.objects.create(
        user=user, role=StaffRole.ADMIN, display_name="مدیر تست"
    )
    return user


@pytest.fixture
def scanner_user(db):
    user = User.objects.create_user(
        "test_scanner", "scanner@test.example", "pass12345", is_staff=True
    )
    StaffProfile.objects.create(
        user=user, role=StaffRole.STAFF_SCANNER, display_name="مسئول اسکن تست"
    )
    return user
