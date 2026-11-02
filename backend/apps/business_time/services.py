from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

from apps.core.models import RestaurantSettings


class BusinessTimeService:
    """
    Centralized service for all business-time calculations, timezone conversions,
    business-day boundaries, and ticket validity intervals.
    """

    @classmethod
    def get_timezone(cls, settings_obj: RestaurantSettings | None = None) -> ZoneInfo:
        # The business timezone is part of the admission rule, not an
        # operator-controlled display preference. Legacy rows may contain a
        # different value, but must never change ticket validity.
        return ZoneInfo("Asia/Tehran")

    @classmethod
    def get_now_utc(cls) -> datetime:
        return datetime.now(UTC)

    @classmethod
    def get_now_tehran(cls, settings_obj: RestaurantSettings | None = None) -> datetime:
        tz = cls.get_timezone(settings_obj)
        return cls.get_now_utc().astimezone(tz)

    @classmethod
    def to_tehran(
        cls, dt: datetime, settings_obj: RestaurantSettings | None = None
    ) -> datetime:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        tz = cls.get_timezone(settings_obj)
        return dt.astimezone(tz)

    @classmethod
    def to_utc(cls, dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=UTC)
        return dt.astimezone(UTC)

    @classmethod
    def get_business_date(
        cls, dt: datetime | None = None, settings_obj: RestaurantSettings | None = None
    ) -> date:
        """
        Calculates the business date for a given datetime (or now).
        A local time earlier than the configured cutoff belongs to the previous business date.
        Formula: business_date = (local_datetime - cutoff_duration).date()
        """
        settings = settings_obj or RestaurantSettings.get_settings()
        if dt is None:
            local_dt = cls.get_now_tehran(settings)
        else:
            local_dt = cls.to_tehran(dt, settings)

        cutoff = settings.business_day_cutoff
        cutoff_duration = timedelta(
            hours=cutoff.hour, minutes=cutoff.minute, seconds=cutoff.second
        )
        return (local_dt - cutoff_duration).date()

    @classmethod
    def get_business_day_boundary_utc(
        cls, business_date: date, settings_obj: RestaurantSettings | None = None
    ) -> datetime:
        """
        Calculates the exact UTC instant when the specified business date ends.
        End instant = (business_date + 1 day) combined with the configured cutoff in Tehran time.
        """
        settings = settings_obj or RestaurantSettings.get_settings()
        tz = cls.get_timezone(settings)
        cutoff = settings.business_day_cutoff

        # Boundary is (business_date + 1 day) at cutoff time in Tehran
        next_day = business_date + timedelta(days=1)
        boundary_tehran = datetime.combine(next_day, cutoff, tzinfo=tz)
        return boundary_tehran.astimezone(UTC)

    @classmethod
    def get_business_day_start_utc(
        cls, business_date: date, settings_obj: RestaurantSettings | None = None
    ) -> datetime:
        """
        Calculates the exact UTC instant when the specified business date starts.
        Start instant = business_date combined with cutoff in Tehran time.
        """
        settings = settings_obj or RestaurantSettings.get_settings()
        tz = cls.get_timezone(settings)
        cutoff = settings.business_day_cutoff

        start_tehran = datetime.combine(business_date, cutoff, tzinfo=tz)
        return start_tehran.astimezone(UTC)

    @classmethod
    def is_checkout_allowed(
        cls, dt: datetime | None = None, settings_obj: RestaurantSettings | None = None
    ) -> tuple[bool, str, int]:
        """
        Verifies whether purchasing a ticket for the current business day is permitted.
        Checks sales_enabled and enforces the safety margin before day cutoff.
        Returns: (allowed: bool, reason: str, remaining_seconds_until_close: int)
        """
        settings = settings_obj or RestaurantSettings.get_settings()
        if not settings.sales_enabled:
            return False, "فروش بلیت آنلاین در حال حاضر غیرفعال است.", 0

        now_utc = dt or cls.get_now_utc()
        current_business_date = cls.get_business_date(now_utc, settings)
        boundary_utc = cls.get_business_day_boundary_utc(
            current_business_date, settings
        )

        margin_minutes = settings.checkout_cutoff_margin_minutes
        cutoff_safety_instant_utc = boundary_utc - timedelta(minutes=margin_minutes)

        remaining_seconds = max(0, int((boundary_utc - now_utc).total_seconds()))

        if now_utc >= boundary_utc:
            return False, "روز کاری جاری به پایان رسیده است.", 0

        if now_utc >= cutoff_safety_instant_utc:
            return (
                False,
                f"فروش بلیت آنلاین برای امروز به پایان رسیده است (توقف فروش {margin_minutes} دقیقه پیش از پایان روز کاری).",
                remaining_seconds,
            )

        return True, "خرید بلیت مجاز است.", remaining_seconds
