from unittest.mock import AsyncMock

import pytest

from app.core.mail import EMAIL_TEMPLATES_DIR, MailService


def test_email_templates_directory_contains_expected_files() -> None:
    expected = {
        "base.html",
        "verify_email.html",
        "password_reset.html",
        "email_change_confirm.html",
        "email_change_notice.html",
    }
    assert expected.issubset({p.name for p in EMAIL_TEMPLATES_DIR.iterdir()})


def test_render_all_email_templates_and_autoescape() -> None:
    service = MailService()

    verify_html = service.render_template(
        "verify_email.html",
        verify_url="https://yupiboard.localhost/verify-email?token=abc",
        expire_hours=24,
    )
    assert "Verify Email" in verify_html
    assert "https://yupiboard.localhost/verify-email?token=abc" in verify_html

    reset_html = service.render_template(
        "password_reset.html",
        reset_url="https://yupiboard.localhost/reset-password?token=xyz",
        expire_hours=24,
    )
    assert "Reset Password" in reset_html
    assert "https://yupiboard.localhost/reset-password?token=xyz" in reset_html

    confirm_html = service.render_template(
        "email_change_confirm.html",
        new_email="new@example.com",
        confirm_url="https://yupiboard.localhost/confirm-email-change?token=tok",
        expire_hours=24,
    )
    assert "new@example.com" in confirm_html
    assert "Confirm New Email" in confirm_html

    notice_html = service.render_template(
        "email_change_notice.html",
        new_email="<script>alert(1)</script>@example.com",
    )
    assert "<script>" not in notice_html
    assert "&lt;script&gt;alert(1)&lt;/script&gt;@example.com" in notice_html


@pytest.mark.asyncio
async def test_mail_service_email_change_methods_call_send() -> None:
    service = MailService()
    service._send = AsyncMock()  # type: ignore[method-assign]

    await service.send_email_change_confirmation("new@example.com", "tok123")
    await service.send_email_change_notice("old@example.com", "new@example.com")

    assert service._send.await_count == 2
    first_call = service._send.await_args_list[0].kwargs
    assert first_call["email"] == "new@example.com"
    assert "confirm-email-change?token=tok123" in first_call["html_body"]
    second_call = service._send.await_args_list[1].kwargs
    assert second_call["email"] == "old@example.com"
    assert "new@example.com" in second_call["html_body"]
