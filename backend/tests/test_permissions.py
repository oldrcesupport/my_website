import pytest
from apps.core.models import RestaurantSettings
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestRolePermissions:
    def test_anonymous_cannot_access_admin_dashboard(self):
        client = APIClient()
        resp = client.get("/api/v1/admin/dashboard/")
        assert resp.status_code in (401, 403)

    def test_scanner_staff_cannot_access_financial_dashboard_or_settings(
        self, scanner_user
    ):
        client = APIClient()
        client.force_authenticate(user=scanner_user)

        resp_dash = client.get("/api/v1/admin/dashboard/")
        assert resp_dash.status_code == 403

        resp_set = client.patch(
            "/api/v1/admin/settings/", {"ticket_price_toman": 150000}
        )
        assert resp_set.status_code == 403

    def test_admin_can_access_dashboard_but_cannot_change_price(self, admin_user):
        client = APIClient()
        client.force_authenticate(user=admin_user)

        resp_dash = client.get("/api/v1/admin/dashboard/")
        assert resp_dash.status_code == 200

        # Attempt to change price -> Should be forbidden for non-superadmin
        resp_price = client.patch(
            "/api/v1/admin/settings/", {"ticket_price_toman": 200000}
        )
        assert resp_price.status_code == 403

    def test_superadmin_can_change_price(self, superadmin_user):
        client = APIClient()
        client.force_authenticate(user=superadmin_user)

        resp = client.patch("/api/v1/admin/settings/", {"ticket_price_toman": 120000})
        assert resp.status_code == 200
        settings_obj = RestaurantSettings.get_settings()
        assert settings_obj.ticket_price_toman == 120000
