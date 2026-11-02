"""Fake gateway for isolated manual browser testing only."""
from urllib.parse import urlencode

from django.http import Http404, HttpResponse
from django.urls import re_path
from django.utils.html import escape

from apps.payments.adapters.mock import MockPaymentAdapter
from apps.payments.models import PaymentAttempt
from apps.payments import services
from config.urls import urlpatterns as application_urls


class BrowserMockAdapter(MockPaymentAdapter):
    def request_payment(self, order, amount_toman, callback_url):
        ok, authority, _, message, payload = super().request_payment(order, amount_toman, callback_url)
        return ok, authority, f"http://localhost:3000/api/v1/browser-test-gateway/{authority}/", message, payload


def fake_gateway(request, authority):
    if not PaymentAttempt.objects.filter(authority=authority).exists():
        raise Http404
    base = "/api/v1/payments/zarinpal/callback/?"
    ok = escape(base + urlencode({"Authority": authority, "Status": "OK"}))
    cancel = escape(base + urlencode({"Authority": authority, "Status": "NOK"}))
    return HttpResponse(f'''<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8">
    <title>درگاه آزمایشی محلی</title><body><main><h1>درگاه آزمایشی محلی</h1>
    <p>این صفحه تنها برای آزمون است و هیچ پرداخت واقعی انجام نمی‌شود.</p>
    <p><a href="{ok}">شبیه‌سازی تأیید پرداخت</a></p>
    <p><a href="{cancel}">شبیه‌سازی انصراف</a></p></main></body></html>''')


services.get_payment_adapter = lambda: BrowserMockAdapter()
urlpatterns = [re_path(r"^api/v1/browser-test-gateway/(?P<authority>[^/]+)/?$", fake_gateway)] + application_urls
