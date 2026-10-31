from abc import ABC, abstractmethod
from typing import Any


class BasePaymentAdapter(ABC):
    """
    Abstract contract for payment gateway integrations.
    """

    @staticmethod
    def toman_to_rial(amount_toman: int) -> int:
        """
        Converts internal integer Toman to gateway Rial amount.
        Centralized provider boundary rule: 1 Toman = 10 Rials.
        """
        return int(amount_toman) * 10

    @abstractmethod
    def request_payment(
        self, order, amount_toman: int, callback_url: str
    ) -> tuple[bool, str, str, str, dict[str, Any]]:
        """
        Initiates a transaction session with the payment provider.
        Returns: (success: bool, authority: str, redirect_url: str, error_message: str, raw_payload: dict)
        """

    @abstractmethod
    def verify_payment(
        self, authority: str, amount_toman: int
    ) -> tuple[bool, str, int, str, dict[str, Any]]:
        """
        Performs server-to-server verification for a completed transaction.
        Returns: (verified: bool, reference_id: str, code: int, error_message: str, raw_payload: dict)
        """
