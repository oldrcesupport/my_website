import hashlib
import secrets

from cryptography.fernet import Fernet
from django.conf import settings


class QRCryptoService:
    """
    Cryptographic service for ticket QR credentials.
    - Generates 256-bit cryptographically secure random tokens.
    - Computes SHA-256 hash for constant-time index lookups.
    - Encrypts/decrypts raw tokens at rest using Fernet (AES).
    """

    @classmethod
    def _get_cipher(cls) -> Fernet:
        key = getattr(settings, "QR_ENCRYPTION_KEY", None)
        if not key:
            # Fallback for dev/tests if key was omitted
            key = Fernet.generate_key().decode()
        if isinstance(key, str):
            key = key.encode("utf-8")
        return Fernet(key)

    @classmethod
    def generate_token(cls) -> str:
        """
        Generates at least 256 bits of cryptographically secure randomness.
        secrets.token_urlsafe(32) generates 32 bytes = 256 bits of entropy.
        """
        return secrets.token_urlsafe(32)

    @classmethod
    def hash_token(cls, raw_token: str) -> str:
        """Computes SHA-256 hash of the raw token."""
        return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()

    @classmethod
    def encrypt_token(cls, raw_token: str) -> str:
        """Encrypts the raw token using AES/Fernet."""
        cipher = cls._get_cipher()
        encrypted = cipher.encrypt(raw_token.strip().encode("utf-8"))
        return encrypted.decode("utf-8")

    @classmethod
    def decrypt_token(cls, encrypted_token: str) -> str:
        """Decrypts the stored token back to its raw form."""
        cipher = cls._get_cipher()
        decrypted = cipher.decrypt(encrypted_token.encode("utf-8"))
        return decrypted.decode("utf-8")

    @classmethod
    def build_qr_payload(cls, raw_token: str) -> str:
        """
        Builds the payload embedded in the QR image.
        Contains strictly the token URL without any PII (no name, phone, or price).
        """
        frontend_url = getattr(
            settings, "FRONTEND_URL", "http://localhost:3000"
        ).rstrip("/")
        return f"{frontend_url}/verify/{raw_token}"
