import re

from app.core.config import settings


def run_event_auto_moderation(
    *,
    title: str,
    description: str,
    game_title: str,
    has_duplicate: bool,
) -> tuple[bool, str | None]:
    """Automatic stage-1 moderation per SRS 3.2.6.

    Returns (passed, rejection_reason).
    """
    if has_duplicate:
        return (
            False,
            (
                "Duplicate event detected: you already have an event scheduled "
                "at the same time and location."
            ),
        )

    combined = f"{title}\n{game_title}\n{description}".lower()
    for word in settings.MODERATION_FORBIDDEN_WORDS:
        term = word.strip().lower()
        if not term:
            continue
        pattern = rf"(?<!\w){re.escape(term)}(?!\w)"
        if re.search(pattern, combined):
            return (
                False,
                (
                    "Event content violates platform moderation guidelines "
                    "(prohibited content detected)."
                ),
            )

    return True, None
