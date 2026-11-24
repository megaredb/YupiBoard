from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, UUIDMixin


class AuditActionType(StrEnum):
    EVENT_APPROVED = "EVENT_APPROVED"
    EVENT_REJECTED = "EVENT_REJECTED"
    EVENT_AUTO_REJECTED = "EVENT_AUTO_REJECTED"
    USER_DELETED = "USER_DELETED"


class AdminAuditLog(Base, UUIDMixin):
    __tablename__ = "admin_audit_logs"
    __table_args__ = (
        Index("ix_admin_audit_logs_target", "target_entity", "target_id"),
        Index("ix_admin_audit_logs_executed_at", "executed_at"),
    )

    admin_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_entity: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    justification_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
