from __future__ import annotations

from typing import Optional

from sqlalchemy import func

from backend.models import RosterStudent, User, db
from backend.repositories import user_repository


class AuthService:
    """Service encapsulating authentication-related operations."""

    @staticmethod
    def _split_display_name(
        display_name: Optional[str],
        given_name: Optional[str] = None,
        family_name: Optional[str] = None,
    ) -> tuple[str, str]:
        first = (given_name or "").strip()
        last = (family_name or "").strip()
        if first or last:
            return first, last
        if not display_name:
            return "", ""
        parts = display_name.strip().split(None, 1)
        if len(parts) == 1:
            return parts[0], ""
        return parts[0], parts[1]

    @staticmethod
    def login_or_create_user(
        email: str,
        display_name: Optional[str] = None,
        given_name: Optional[str] = None,
        family_name: Optional[str] = None,
    ) -> User:
        email_lower = email.lower()

        roster_entries = (
            db.session.execute(
                db.select(RosterStudent).filter(
                    func.lower(RosterStudent.email) == email_lower,
                    RosterStudent.deleted_at.is_(None),
                )
            )
            .scalars()
            .all()
        )
        roster_entry = roster_entries[0] if roster_entries else None

        oauth_first, oauth_last = AuthService._split_display_name(
            display_name, given_name=given_name, family_name=family_name
        )

        # Backfill empty roster names from OAuth / display name on first login.
        if roster_entries and (oauth_first or oauth_last):
            for entry in roster_entries:
                if not (entry.first_name or "").strip() and oauth_first:
                    entry.first_name = oauth_first
                if not (entry.last_name or "").strip() and oauth_last:
                    entry.last_name = oauth_last

        preferred_name = (
            f"{roster_entry.first_name} {roster_entry.last_name}".strip()
            if roster_entry
            else None
        ) or None

        user = user_repository.get_by_email(email)

        if not user:
            name = preferred_name or display_name or email.split("@")[0].replace(".", " ").title()
            user = user_repository.create_user(email=email, name=name, role="student")
            db.session.commit()
        else:
            if preferred_name and user.name != preferred_name:
                user.name = preferred_name
            elif display_name and not preferred_name and user.name != display_name:
                user.name = display_name

            # Persist user updates and any roster name backfills from OAuth.
            db.session.commit()

        return user

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        return user_repository.get_by_id(user_id)

    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        return user_repository.get_by_email(email)
