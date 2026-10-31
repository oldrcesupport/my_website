import io
import pytest
from apps.accounts.models import StaffRole
from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()


@pytest.mark.django_db
class TestSetupRestaurantCommand:
    """
    Verifies that setup_restaurant is idempotent, preserves existing user passwords,
    and never prints sensitive passwords or tokens to stdout.
    """

    def test_setup_command_idempotent_and_preserves_passwords(self):
        # 1. Create an admin with custom password
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@test.example",
            password="OriginalSecretPassword123!",
        )
        original_hash = admin_user.password

        # 2. Run setup_restaurant command
        out = io.StringIO()
        call_command("setup_restaurant", stdout=out)
        output_str = out.getvalue()

        # 3. Refresh user and ensure password hash is UNCHANGED
        admin_user.refresh_from_db()
        assert admin_user.password == original_hash
        assert admin_user.check_password("OriginalSecretPassword123!")

        # 4. Verify stdout does NOT print sensitive passwords
        assert "OriginalSecretPassword123!" not in output_str
        assert "Password='AdminSecret123!'" not in output_str
        assert "Password='StaffSecret123!'" not in output_str

        # 5. Run setup_restaurant a SECOND time
        out2 = io.StringIO()
        call_command("setup_restaurant", stdout=out2)
        admin_user.refresh_from_db()
        assert admin_user.password == original_hash
        assert "already exists. Password preserved" in out2.getvalue()

    def test_scanner_staff_password_preserved(self):
        scanner = User.objects.create_user(
            username="scanner_staff",
            email="scanner@test.example",
            password="ScannerSecretPassword456!",
            is_staff=True,
        )
        original_scanner_hash = scanner.password

        out = io.StringIO()
        call_command("setup_restaurant", stdout=out)

        scanner.refresh_from_db()
        assert scanner.password == original_scanner_hash
        assert scanner.check_password("ScannerSecretPassword456!")
        assert "ScannerSecretPassword456!" not in out.getvalue()

