from __future__ import annotations

from typing import Optional

from sqlalchemy import func

from backend.models import RosterStudent, User, db
from backend.repositories import user_repository


class AuthService:
    """Service encapsulating authentication-related operations."""

    @staticmethod
    def login_or_create_user(email: str, display_name: Optional[str] = None) -> User:
        email_lower = email.lower()

        roster_entry = (
            db.session.execute(
                db.select(RosterStudent).filter(
                    func.lower(RosterStudent.email) == email_lower,
                    RosterStudent.deleted_at.is_(None),
                )
            )
            .scalars()
            .first()
        )

        preferred_name = (
            f"{roster_entry.first_name} {roster_entry.last_name}".strip()
            if roster_entry
            else None
        )

        user = user_repository.get_by_email(email)

        if not user:
            name = preferred_name or display_name or email.split("@")[0].replace(".", " ").title()
            user = user_repository.create_user(email=email, name=name, role="student")
            db.session.commit()
        else:
            if roster_entry and preferred_name and user.name != preferred_name:
                user.name = preferred_name
            elif not roster_entry and display_name and user.name != display_name:
                user.name = display_name

            if db.session.is_modified(user):
                db.session.commit()

        return user

    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[User]:
        return user_repository.get_by_id(user_id)

    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        return user_repository.get_by_email(email)
