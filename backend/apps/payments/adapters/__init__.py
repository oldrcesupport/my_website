from django.conf import settings

from .base import BasePaymentAdapter
from .mock import MockPaymentAdapter
from .zarinpal import ZarinPalV4Adapter


def get_payment_adapter() -> BasePaymentAdapter:
    provider = getattr(settings, "PAYMENT_PROVIDER", "zarinpal").lower()
    if provider == "mock":
        if getattr(settings, "APP_ENV", "development") == "production":
            raise ValueError("Mock payments are prohibited in production")
        return MockPaymentAdapter()
    if provider == "zarinpal":
        if settings.ZARINPAL_ENV != "sandbox" and not settings.LIVE_PAYMENTS_ENABLED:
            raise ValueError("Live payments are disabled")
        return ZarinPalV4Adapter()
    raise ValueError("Unknown payment provider")
