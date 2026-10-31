from datetime import date, datetime, time
from zoneinfo import ZoneInfo

import pytest
from apps.business_time.services import BusinessTimeService
from apps.core.models import RestaurantSettings


@pytest.mark.django_db
class TestBusinessTimeService:
    def test_default_midnight_cutoff(self):
        tehran_tz = ZoneInfo("Asia/Tehran")
        settings_obj = RestaurantSettings.get_settings()
        settings_obj.business_day_cutoff = time(0, 0, 0)
        settings_obj.save()

        # 2026-10-31 23:30 in Tehran
        dt_tehran = datetime(2026, 10, 31, 23, 30, tzinfo=tehran_tz)
        biz_date = BusinessTimeService.get_business_date(dt_tehran, settings_obj)
        assert biz_date == date(2026, 10, 31)

        # Expiration boundary: Next day at 00:00:00 Tehran (2026-11-01 00:00:00)
        boundary_utc = BusinessTimeService.get_business_day_boundary_utc(
            biz_date, settings_obj
        )
        boundary_tehran = boundary_utc.astimezone(tehran_tz)
        assert boundary_tehran.year == 2026
        assert boundary_tehran.month == 11
        assert boundary_tehran.day == 1
        assert boundary_tehran.hour == 0
        assert boundary_tehran.minute == 0

    def test_late_night_cutoff_at_04_am(self):
        tehran_tz = ZoneInfo("Asia/Tehran")
        settings_obj = RestaurantSettings.get_settings()
        settings_obj.business_day_cutoff = time(4, 0, 0)
        settings_obj.save()

        # At 02:30 AM on Nov 1st -> Should belong to Oct 31st business date!
        dt_tehran = datetime(2026, 11, 1, 2, 30, tzinfo=tehran_tz)
        biz_date = BusinessTimeService.get_business_date(dt_tehran, settings_obj)
        assert biz_date == date(2026, 10, 31)

        # At 04:05 AM on Nov 1st -> Now belongs to Nov 1st business date!
        dt_after = datetime(2026, 11, 1, 4, 5, tzinfo=tehran_tz)
        biz_date_after = BusinessTimeService.get_business_date(dt_after, settings_obj)
        assert biz_date_after == date(2026, 11, 1)

    def test_checkout_cutoff_safety_margin(self):
        tehran_tz = ZoneInfo("Asia/Tehran")
        settings_obj = RestaurantSettings.get_settings()
        settings_obj.business_day_cutoff = time(0, 0, 0)
        settings_obj.checkout_cutoff_margin_minutes = 10
        settings_obj.save()

        # Boundary is midnight (2026-11-01 00:00:00 Tehran). Safety cutoff is 23:50.
        # At 23:45 -> Checkout allowed
        dt_allowed = datetime(2026, 10, 31, 23, 45, tzinfo=tehran_tz)
        allowed, _, remaining = BusinessTimeService.is_checkout_allowed(
            dt_allowed, settings_obj
        )
        assert allowed is True
        assert remaining > 0

        # At 23:55 -> Within 10-minute margin, checkout blocked
        dt_blocked = datetime(2026, 10, 31, 23, 55, tzinfo=tehran_tz)
        allowed, reason, _ = BusinessTimeService.is_checkout_allowed(
            dt_blocked, settings_obj
        )
        assert allowed is False
        assert "توقف فروش" in reason
