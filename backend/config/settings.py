import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

APP_ENV = os.getenv("APP_ENV", "development").lower()
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
SECRET_KEY = os.getenv(
    "SECRET_KEY", "dev-insecure-secret-key-change-in-production-only-abcdef1234567890"
)

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
        "PASSWORD": os.getenv("DB_PASSWORD", "ticketing_secret"),
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
] + [
    "http://192.168.1.101:3000",
    "http://192.168.1.101:8000",
    "http://0.0.0.0:3000",
    "http://0.0.0.0:8000",
]

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
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
QR_ENCRYPTION_KEY = os.getenv(
    "QR_ENCRYPTION_KEY", "qwHiMJaVJrDf0tF73NgSWxLEjy_CSXyllr840hPSE2A="
)

# Production Safety Assertion
if APP_ENV == "production":
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
