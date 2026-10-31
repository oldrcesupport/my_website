from django.conf import settings

from .base import BasePaymentAdapter
from .mock import MockPaymentAdapter
from .zarinpal import ZarinPalV4Adapter


def get_payment_adapter() -> BasePaymentAdapter:
    provider = getattr(settings, "PAYMENT_PROVIDER", "zarinpal").lower()
    if provider == "mock":
        return MockPaymentAdapter()
    return ZarinPalV4Adapter()
