from unittest.mock import Mock

from apps.payments.adapters.zarinpal import ZarinPalV4Adapter


def test_verify_uses_rials_and_requires_reference(monkeypatch):
    responses = iter([{"data": {"code": 100}}, {"data": {"code": 100, "ref_id": 12345}}])
    sent = []

    def post(url, **kwargs):
        sent.append(kwargs["json"])
        response = Mock()
        response.json.return_value = next(responses)
        return response

    monkeypatch.setattr("apps.payments.adapters.zarinpal.requests.post", post)
    adapter = ZarinPalV4Adapter(is_sandbox=True, merchant_id="test")
    assert adapter.verify_payment("authority", 100000)[0:3] == (False, "", -998)
    assert adapter.verify_payment("authority", 100000)[0:3] == (True, "12345", 100)
    assert sent[0]["amount"] == 1000000


def test_verify_rejects_unexpected_json(monkeypatch):
    response = Mock()
    response.json.return_value = []
    monkeypatch.setattr("apps.payments.adapters.zarinpal.requests.post", lambda *args, **kwargs: response)
    assert ZarinPalV4Adapter(is_sandbox=True, merchant_id="test").verify_payment("a", 1)[2] == -998
