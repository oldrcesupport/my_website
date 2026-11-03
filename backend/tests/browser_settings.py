"""Local browser-test settings. Never use these settings for deployment."""
import os

from config.settings import *  # noqa: F403

if os.environ.get("APP_ENV") != "testing":
    raise RuntimeError("Browser test settings require APP_ENV=testing")
if not os.environ.get("DB_NAME", "").startswith("codex_browser_"):
    raise RuntimeError("Browser tests require an isolated codex_browser_ database")

ROOT_URLCONF = "tests.browser_urls"
PAYMENT_PROVIDER = "mock"
FRONTEND_URL = "http://127.0.0.1:3000"
PAYMENT_CALLBACK_URL = "http://127.0.0.1:3000/api/v1/payments/zarinpal/callback/"
