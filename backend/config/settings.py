import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

APP_ENV = os.getenv("APP_ENV", "development").lower()
if APP_ENV not in {"development", "testing", "staging", "production"}:
    raise RuntimeError("CONFIGURATION ERROR: unsupported APP_ENV")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "")

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("ALLOWED_HOSTS", "*").split(",")
    if h.strip()
]
if DEBUG:
    ALLOWED_HOSTS = ["*"]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "drf_spectacular",
    # Local apps
    "apps.core",
    "apps.business_time",
    "apps.accounts",
    "apps.orders",
    "apps.payments",
    "apps.tickets",
    "apps.checkin",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# Database configuration
DATABASES = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": os.getenv("DB_NAME", "restaurant_ticketing"),
        "USER": os.getenv("DB_USER", "ticketing_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Disable APPEND_SLASH to prevent POST redirect RuntimeError on trailing slash differences
APPEND_SLASH = False

# CORS & CSRF
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Spectacular OpenAPI Documentation
SPECTACULAR_SETTINGS = {
    "TITLE": "Live Music Restaurant Ticketing API",
    "DESCRIPTION": "Dedicated admission ticketing platform for live music restaurant venue",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Business Domain Defaults
APP_CURRENCY = os.getenv("APP_CURRENCY", "TOMAN")
APP_LOCALE = os.getenv("APP_LOCALE", "fa-IR")
BUSINESS_TIMEZONE = os.getenv("BUSINESS_TIMEZONE", "Asia/Tehran")
BUSINESS_DAY_CUTOFF = os.getenv("BUSINESS_DAY_CUTOFF", "00:00:00")
CHECKOUT_CUTOFF_MARGIN_MINUTES = int(os.getenv("CHECKOUT_CUTOFF_MARGIN_MINUTES", "5"))

RESTAURANT_NAME = os.getenv("RESTAURANT_NAME", "نام رستوران")
DEV_DEMO_TICKET_PRICE_TOMAN = int(os.getenv("DEV_DEMO_TICKET_PRICE_TOMAN", "100000"))
IS_DEMO_PRICE = os.getenv("IS_DEMO_PRICE", "true").lower() == "true"

CAPACITY_ENABLED = os.getenv("CAPACITY_ENABLED", "false").lower() == "true"
CAPACITY_POLICY = os.getenv("CAPACITY_POLICY", "UNCONFIGURED")

# Payment Provider Configuration
PAYMENT_PROVIDER = os.getenv("PAYMENT_PROVIDER", "zarinpal").lower()
ZARINPAL_ENV = os.getenv("ZARINPAL_ENV", "sandbox").lower()
ZARINPAL_MERCHANT_ID = os.getenv(
    "ZARINPAL_MERCHANT_ID", "00000000-0000-0000-0000-000000000000"
)
LIVE_PAYMENTS_ENABLED = os.getenv("LIVE_PAYMENTS_ENABLED", "false").lower() == "true"
PAYMENT_CALLBACK_URL = os.getenv(
    "PAYMENT_CALLBACK_URL", "http://localhost:8000/api/v1/payments/zarinpal/callback/"
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Cryptography Key for QR tokens
QR_ENCRYPTION_KEY = os.getenv("QR_ENCRYPTION_KEY", "")

# Production Safety Assertion
if APP_ENV == "production":
    from cryptography.fernet import Fernet
    from urllib.parse import urlparse
    from uuid import UUID
    from hashlib import sha256

    if PAYMENT_PROVIDER != "zarinpal":
        raise RuntimeError("CONFIGURATION ERROR: production requires the ZarinPal provider")

    for name in ("SECRET_KEY", "QR_ENCRYPTION_KEY", "DB_NAME", "DB_USER", "DB_PASSWORD", "ALLOWED_HOSTS", "FRONTEND_URL", "PAYMENT_CALLBACK_URL"):
        value = os.getenv(name, "")
        if not value or "replace" in value.lower() or sha256(value.encode()).hexdigest() in {'ee73a1e820000494fc091ac70c4f504cd6245ae4b5e93cd7b2ef4928a231d380', '57423305873cf9d57e762634740ba1bdbac347751c9f1305e484ff31f0eb702d'}:
            raise RuntimeError(f"CONFIGURATION ERROR: provide a secure {name} in production")
    if len(SECRET_KEY) < 50 or SECRET_KEY.startswith("dev-") or "*" in ALLOWED_HOSTS:
        raise RuntimeError("CONFIGURATION ERROR: insecure SECRET_KEY or ALLOWED_HOSTS")
    try:
        Fernet(QR_ENCRYPTION_KEY.encode())
    except (ValueError, TypeError):
        raise RuntimeError("CONFIGURATION ERROR: invalid QR_ENCRYPTION_KEY") from None
    if any(urlparse(url).scheme != "https" for url in (FRONTEND_URL, PAYMENT_CALLBACK_URL)):
        raise RuntimeError("CONFIGURATION ERROR: production URLs must use HTTPS")
    frontend_origin = urlparse(FRONTEND_URL)
    callback_origin = urlparse(PAYMENT_CALLBACK_URL)
    if not frontend_origin.hostname or (frontend_origin.scheme, frontend_origin.netloc) != (callback_origin.scheme, callback_origin.netloc):
        raise RuntimeError("CONFIGURATION ERROR: frontend and callback must share the same HTTPS origin")
    if FRONTEND_URL.rstrip("/") not in CSRF_TRUSTED_ORIGINS:
        raise RuntimeError("CONFIGURATION ERROR: include FRONTEND_URL in CSRF_TRUSTED_ORIGINS")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    if DEBUG:
        raise RuntimeError("SECURITY ERROR: DEBUG cannot be True in production!")
    if IS_DEMO_PRICE:
        raise RuntimeError(
            "SAFETY ERROR: Cannot run production with demo price enabled (IS_DEMO_PRICE=true)!"
        )
    if not LIVE_PAYMENTS_ENABLED:
        raise RuntimeError(
            "CONFIGURATION ERROR: LIVE_PAYMENTS_ENABLED must be explicitly configured for production!"
        )
    if ZARINPAL_ENV == "sandbox":
        raise RuntimeError(
            "CONFIGURATION ERROR: Production cannot use ZARINPAL_ENV=sandbox!"
        )
    if ZARINPAL_MERCHANT_ID == "00000000-0000-0000-0000-000000000000":
        raise RuntimeError(
            "CONFIGURATION ERROR: Production requires a valid ZarinPal Merchant ID!"
        )
    try:
        if UUID(ZARINPAL_MERCHANT_ID).int == 0:
            raise ValueError
    except ValueError:
        raise RuntimeError("CONFIGURATION ERROR: invalid ZarinPal Merchant ID") from None
