from datetime import timedelta

import pytest

from app.core.exceptions import UnauthorizedException
from app.core.security import (
    create_access_token,
    create_action_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)


def test_password_hashing() -> None:
    raw_password = "SuperSecretPassword123!"
    hashed = get_password_hash(raw_password)

    assert hashed != raw_password
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False


def test_token_creation_and_decoding() -> None:
    user_id = "123e4567-e89b-12d3-a456-426614174000"

    # Access Token
    access_token = create_access_token(
        subject=user_id,
        additional_claims={"role": "admin", "email": "test@example.com"},
    )
    payload = decode_token(access_token, expected_type="access")
    assert payload["sub"] == user_id
    assert payload["type"] == "access"
    assert payload["role"] == "admin"
    assert payload["email"] == "test@example.com"
    assert "jti" in payload

    # Refresh Token
    refresh_token = create_refresh_token(subject=user_id)
    refresh_payload = decode_token(refresh_token, expected_type="refresh")
    assert refresh_payload["sub"] == user_id
    assert refresh_payload["type"] == "refresh"
    assert "jti" in refresh_payload

    # Action Token
    action_token = create_action_token(subject=user_id, action="verify_email")
    action_payload = decode_token(action_token, expected_type="verify_email")
    assert action_payload["sub"] == user_id
    assert action_payload["type"] == "verify_email"


def test_decode_token_wrong_type() -> None:
    token = create_access_token(subject="user-123")
    with pytest.raises(UnauthorizedException) as exc_info:
        decode_token(token, expected_type="refresh")
    assert "Invalid token" in str(exc_info.value.detail)


def test_decode_token_expired() -> None:
    expired_token = create_access_token(
        subject="user-123",
        expires_delta=timedelta(seconds=-10),
    )
    with pytest.raises(UnauthorizedException) as exc_info:
        decode_token(expired_token, expected_type="access")
    assert "expired" in str(exc_info.value.detail).lower()


def test_decode_token_tampered() -> None:
    token = create_access_token(subject="user-123")
    tampered_token = token[:-5] + "aaaaa"
    with pytest.raises(UnauthorizedException):
        decode_token(tampered_token, expected_type="access")


def test_hash_token() -> None:
    raw_token = "some-random-refresh-token-string"
    digest1 = hash_token(raw_token)
    digest2 = hash_token(raw_token)

    assert digest1 == digest2
    assert len(digest1) == 64  # SHA-256 hex string length
    assert hash_token("different-token") != digest1
