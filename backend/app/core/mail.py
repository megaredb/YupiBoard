import logging
from pathlib import Path
from typing import Any

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pydantic import ValidationError

from app.core.config import settings

logger = logging.getLogger("yupiboard.mail")

EMAIL_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates" / "emails"


class MailService:
    def __init__(self) -> None:
        self.template_env = Environment(
            loader=FileSystemLoader(EMAIL_TEMPLATES_DIR),
            autoescape=select_autoescape(["html", "xml"]),
        )
        self.enabled = bool(settings.MAIL_SERVER)
        if self.enabled:
            mail_from = settings.MAIL_FROM
            if not mail_from or mail_from.endswith(".localhost"):
                mail_from = "noreply@yupiboard.com"
            use_creds = bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD)
            try:
                self.conf = ConnectionConfig(
                    MAIL_USERNAME=settings.MAIL_USERNAME or "mailpit",
                    MAIL_PASSWORD=settings.MAIL_PASSWORD or "",
                    MAIL_FROM=mail_from,
                    MAIL_PORT=settings.MAIL_PORT,
                    MAIL_SERVER=settings.MAIL_SERVER,
                    MAIL_STARTTLS=settings.MAIL_STARTTLS,
                    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
                    USE_CREDENTIALS=use_creds,
                    VALIDATE_CERTS=settings.is_production,
                    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
                )
                self.fastmail = FastMail(self.conf)
            except (ValidationError, ValueError) as e:
                logger.warning(
                    "Failed to initialize FastMail ConnectionConfig: %s. Falling back to mock.",
                    e,
                )
                self.fastmail = None
        else:
            self.fastmail = None  # type: ignore[assignment]

    def render_template(self, template_name: str, **context: Any) -> str:
        template = self.template_env.get_template(template_name)
        return template.render(**context)

    async def send_verification_email(self, email: str, token: str) -> None:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your email address — YupiBoard"
        body = self.render_template(
            "verify_email.html",
            verify_url=verify_url,
            expire_hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
        )
        await self._send(email=email, subject=subject, html_body=body)

    async def send_password_reset_email(self, email: str, token: str) -> None:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Password Reset Request — YupiBoard"
        body = self.render_template(
            "password_reset.html",
            reset_url=reset_url,
            expire_hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
        )
        await self._send(email=email, subject=subject, html_body=body)

    async def send_email_change_confirmation(self, new_email: str, token: str) -> None:
        confirm_url = f"{settings.FRONTEND_URL}/confirm-email-change?token={token}"
        subject = "Confirm your new email address — YupiBoard"
        body = self.render_template(
            "email_change_confirm.html",
            new_email=new_email,
            confirm_url=confirm_url,
            expire_hours=settings.EMAIL_CHANGE_TOKEN_EXPIRE_HOURS,
        )
        await self._send(email=new_email, subject=subject, html_body=body)

    async def send_email_change_notice(self, old_email: str, new_email: str) -> None:
        subject = "Email Change Requested — YupiBoard"
        body = self.render_template(
            "email_change_notice.html",
            new_email=new_email,
        )
        await self._send(email=old_email, subject=subject, html_body=body)

    async def _send(self, email: str, subject: str, html_body: str) -> None:
        if not self.enabled or self.fastmail is None:
            logger.info(
                "[MOCK EMAIL] To: %s | Subject: %s | Preview Body: %s",
                email,
                subject,
                html_body[:120].strip(),
            )
            return

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=html_body,
            subtype=MessageType.html,
        )
        try:
            await self.fastmail.send_message(message)
            logger.info(
                "Email successfully sent to %s with subject: %s", email, subject
            )
        except Exception as e:
            logger.error("Failed to send email to %s: %s", email, str(e))
            # Don't crash main flow in case of email transport failure in development
            if settings.is_production:
                raise
