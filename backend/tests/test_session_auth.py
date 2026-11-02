import pytest
from django.test import Client


@pytest.mark.django_db
def test_staff_session_requires_csrf_and_logout_revokes_session(admin_user):
    client = Client(enforce_csrf_checks=True)
    credentials = {"username": admin_user.username, "password": "pass12345"}
    url = "/api/v1/auth/login/"
    assert client.post(url, credentials, content_type="application/json").status_code == 403
    # Next's same-origin rewrite may omit the final slash.
    assert client.get("/api/v1/auth/csrf").status_code == 200
    csrf = client.cookies["csrftoken"].value
    response = client.post(url, credentials, content_type="application/json", HTTP_X_CSRFTOKEN=csrf)
    assert response.status_code == 200
    assert "token" not in response.json()
    assert response.cookies["sessionid"]["httponly"]
    assert client.get("/api/v1/admin/dashboard/").status_code == 200
    assert client.post("/api/v1/auth/logout/").status_code == 403
    csrf = client.cookies["csrftoken"].value
    assert client.post("/api/v1/auth/logout/", HTTP_X_CSRFTOKEN=csrf).status_code == 200
    assert client.get("/api/v1/admin/dashboard/").status_code in (401, 403)
