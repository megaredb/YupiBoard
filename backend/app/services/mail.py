import logging

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import ValidationError

from app.core.config import settings

logger = logging.getLogger("yupiboard.mail")


class MailService:
    def __init__(self) -> None:
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

    async def send_verification_email(self, email: str, token: str) -> None:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your email address — YupiBoard"
        body = f"""
        <h2>Welcome to YupiBoard!</h2>
        <p>Please click the button below to verify your email address:</p>
        <p><a href="{verify_url}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
        <p>Or copy this link into your browser: {verify_url}</p>
        <p>This link will expire in {settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS} hours.</p>
        """
        await self._send(email=email, subject=subject, html_body=body)

    async def send_password_reset_email(self, email: str, token: str) -> None:
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Password Reset Request — YupiBoard"
        body = f"""
        <h2>Password Reset Request</h2>
        <p>You received this email because a password reset was requested for your YupiBoard account.</p>
        <p><a href="{reset_url}" style="display:inline-block;padding:10px 20px;background:#e11d48;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
        <p>Or copy this link into your browser: {reset_url}</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        """
        await self._send(email=email, subject=subject, html_body=body)

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
