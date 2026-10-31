from typing import Any

import requests
from django.conf import settings

from .base import BasePaymentAdapter


class ZarinPalV4Adapter(BasePaymentAdapter):
    """
    ZarinPal REST API v4 integration for both Sandbox and Production.
    Enforces server-to-server verification and strict Toman-to-Rial conversion.
    """

    SANDBOX_BASE_URL = "https://sandbox.zarinpal.com/pg/v4/payment"
    SANDBOX_STARTPAY_URL = "https://sandbox.zarinpal.com/pg/StartPay"

    PRODUCTION_BASE_URL = "https://payment.zarinpal.com/pg/v4/payment"
    PRODUCTION_STARTPAY_URL = "https://payment.zarinpal.com/pg/StartPay"

    def __init__(self, is_sandbox: bool = None, merchant_id: str = None):
        if is_sandbox is None:
            self.is_sandbox = (
                getattr(settings, "ZARINPAL_ENV", "sandbox").lower() == "sandbox"
            )
        else:
            self.is_sandbox = is_sandbox

        self.merchant_id = merchant_id or getattr(
            settings, "ZARINPAL_MERCHANT_ID", "00000000-0000-0000-0000-000000000000"
        )

        if self.is_sandbox:
            self.base_url = self.SANDBOX_BASE_URL
            self.startpay_url = self.SANDBOX_STARTPAY_URL
        else:
            self.base_url = self.PRODUCTION_BASE_URL
            self.startpay_url = self.PRODUCTION_STARTPAY_URL

    def request_payment(
        self, order, amount_toman: int, callback_url: str
    ) -> tuple[bool, str, str, str, dict[str, Any]]:
        url = f"{self.base_url}/request.json"
        amount_rial = self.toman_to_rial(amount_toman)

        payload = {
            "merchant_id": self.merchant_id,
            "amount": amount_rial,
            "currency": "IRR",
            "description": f"خرید {order.quantity} بلیت ورودی موسیقی زنده - سفارش {order.public_id}",
            "callback_url": callback_url,
            "metadata": {
                "mobile": order.purchaser_phone,
            },
        }
        if order.purchaser_email:
            payload["metadata"]["email"] = order.purchaser_email

        try:
            response = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15,
            )
            data = response.json()
        except requests.exceptions.RequestException as e:
            return (
                False,
                "",
                "",
                f"خطا در اتصال به درگاه زرین‌پال: {e!s}",
                {"error": str(e)},
            )
        except ValueError:
            return (
                False,
                "",
                "",
                "پاسخ نامعتبر از درگاه زرین‌پال دریافت شد.",
                {"raw_text": response.text},
            )

        res_data = data.get("data", {})
        code = res_data.get("code")
        authority = res_data.get("authority", "")

        if code == 100 and authority:
            redirect_url = f"{self.startpay_url}/{authority}"
            return True, authority, redirect_url, "", data

        errors = data.get("errors", [])
        error_msg = (
            f"کد خطا {code}: {data.get('message', 'تراکنش توسط درگاه پذیرفته نشد.')}"
        )
        if errors:
            error_msg += f" ({errors})"
        return False, "", "", error_msg, data

    def verify_payment(
        self, authority: str, amount_toman: int
    ) -> tuple[bool, str, int, str, dict[str, Any]]:
        url = f"{self.base_url}/verify.json"
        amount_rial = self.toman_to_rial(amount_toman)

        payload = {
            "merchant_id": self.merchant_id,
            "amount": amount_rial,
            "authority": authority,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15,
            )
            data = response.json()
        except requests.exceptions.RequestException as e:
            return (
                False,
                "",
                -999,
                f"خطای شبکه در اعتبارسنجی زرین‌پال: {e!s}",
                {"error": str(e)},
            )
        except ValueError:
            return (
                False,
                "",
                -998,
                "پاسخ نامعتبر سرور زرین‌پال هنگام اعتبارسنجی.",
                {"raw_text": response.text},
            )

        res_data = data.get("data", {})
        code = res_data.get("code")
        ref_id = str(res_data.get("ref_id", ""))

        # Code 100: Success
        # Code 101: Already Verified
        if code in (100, 101):
            return True, ref_id, code, "", data

        errors = data.get("errors", [])
        error_msg = f"اعتبارسنجی ناموفق بود (کد {code})"
        if errors:
            error_msg += f" - {errors}"
        return False, "", code or -1, error_msg, data
