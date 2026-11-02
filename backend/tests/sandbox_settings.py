"""Isolated browser tests against ZarinPal sandbox; never use for deployment."""
from tests.browser_settings import *  # noqa: F403

ROOT_URLCONF = "config.urls"
PAYMENT_PROVIDER = "zarinpal"
ZARINPAL_ENV = "sandbox"
ZARINPAL_MERCHANT_ID = "00000000-0000-0000-0000-000000000000"
