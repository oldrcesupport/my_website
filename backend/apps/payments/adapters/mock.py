import uuid
from typing import Any

from .base import BasePaymentAdapter


class MockPaymentAdapter(BasePaymentAdapter):
    """
    In-memory mock payment provider for automated tests and offline simulation.
    """

    def __init__(
        self, should_succeed_request: bool = True, should_succeed_verify: bool = True
    ):
        self.should_succeed_request = should_succeed_request
        self.should_succeed_verify = should_succeed_verify
        self.recorded_requests = []
        self.recorded_verifications = []

    def request_payment(
        self, order, amount_toman: int, callback_url: str
    ) -> tuple[bool, str, str, str, dict[str, Any]]:
        self.recorded_requests.append(
            {
                "order_id": order.id,
                "amount_toman": amount_toman,
                "amount_rial": self.toman_to_rial(amount_toman),
                "callback_url": callback_url,
            }
        )

        if not self.should_succeed_request:
            return False, "", "", "خطای شبیه‌سازی درگاه تست", {"mock_error": True}

        authority = f"MOCK_{uuid.uuid4().hex[:24]}"
        redirect_url = f"https://mock-gateway.example/pay/{authority}"
        return (
            True,
            authority,
            redirect_url,
            "",
            {"mock_code": 100, "authority": authority},
        )

    def verify_payment(
        self, authority: str, amount_toman: int
    ) -> tuple[bool, str, int, str, dict[str, Any]]:
        self.recorded_verifications.append(
            {
                "authority": authority,
                "amount_toman": amount_toman,
                "amount_rial": self.toman_to_rial(amount_toman),
            }
        )

        if not self.should_succeed_verify:
            return False, "", -1, "تراکنش تست توسط کاربر لغو شد", {"mock_code": -1}

        ref_id = f"REF_{uuid.uuid4().hex[:10].upper()}"
        return True, ref_id, 100, "", {"mock_code": 100, "ref_id": ref_id}
