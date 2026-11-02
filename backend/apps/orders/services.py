from datetime import timedelta

from apps.business_time.services import BusinessTimeService
from apps.core.models import RestaurantSettings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.conf import settings as django_settings

from .models import Order, OrderStatus


class OrderService:
    @classmethod
    def create_order(
        cls,
        purchaser_name: str,
        purchaser_phone: str,
        quantity: int,
        purchaser_email: str = "",
        idempotency_key: str = None,
        frontend_origin: str = "",
    ) -> tuple[Order, str, bool]:
        """
        Atomically creates a guest order with server-calculated pricing snapshot,
        business date, payment deadline, and high-entropy access token.
        Returns: (order, raw_guest_access_token, is_created)
        """
        if idempotency_key:
            existing = Order.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                recovered_token = existing.get_guest_access_token()
                return existing, recovered_token, False

        settings = RestaurantSettings.get_settings()
        if django_settings.APP_ENV == "production" and (settings.is_demo_price or settings.ticket_price_toman <= 0):
            raise ValidationError("قیمت واقعی بلیت هنوز تنظیم نشده است.")
        allowed, reason, _ = BusinessTimeService.is_checkout_allowed(
            settings_obj=settings
        )
        if not allowed:
            raise ValidationError(reason)

        if not quantity or quantity < 1 or quantity > 50:
            raise ValidationError("تعداد بلیت باید بین ۱ تا ۵۰ عدد باشد.")

        cleaned_phone = purchaser_phone.strip()
        cleaned_name = purchaser_name.strip()
        if not cleaned_phone or len(cleaned_phone) < 10:
            raise ValidationError("شماره تماس معتبر نیست.")
        if not cleaned_name:
            raise ValidationError("نام خریدار الزامی است.")

        unit_price = settings.ticket_price_toman
        total_price = unit_price * quantity

        now_utc = BusinessTimeService.get_now_utc()
        current_biz_date = BusinessTimeService.get_business_date(now_utc, settings)
        boundary_utc = BusinessTimeService.get_business_day_boundary_utc(
            current_biz_date, settings
        )

        # 5-minute payment deadline, but never beyond the business-day boundary
        standard_deadline = now_utc + timedelta(minutes=5)
        payment_deadline = min(standard_deadline, boundary_utc)

        raw_access_token = Order.generate_access_token()

        with transaction.atomic():
            order = Order(
                purchaser_name=cleaned_name,
                purchaser_phone=cleaned_phone,
                purchaser_email=purchaser_email.strip() if purchaser_email else "",
                quantity=quantity,
                unit_price_toman=unit_price,
                total_price_toman=total_price,
                currency_unit=settings.currency_unit,
                business_date=current_biz_date,
                status=OrderStatus.PENDING_PAYMENT,
                idempotency_key=idempotency_key or None,
                frontend_origin=frontend_origin.strip(),
                payment_deadline=payment_deadline,
                business_day_end=boundary_utc,
            )
            order.set_guest_access_token(raw_access_token)
            order.save()

        return order, raw_access_token, True
