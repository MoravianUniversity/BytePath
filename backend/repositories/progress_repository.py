from __future__ import annotations

from typing import Iterable, Optional

from backend.models import StudentProgress, db


def get_by_user(user_id: int, class_id: int) -> Iterable[StudentProgress]:
    query = (
        db.select(StudentProgress)
        .filter_by(user_id=user_id, class_id=class_id)
        .order_by(StudentProgress.last_accessed.desc())
    )
    return db.session.execute(query).scalars().all()


def get_by_user_and_topic(
    user_id: int, topic_id: str, class_id: int
) -> Optional[StudentProgress]:
    query = db.select(StudentProgress).filter_by(
        user_id=user_id, topic=topic_id, class_id=class_id
    )
    return db.session.execute(query).scalar_one_or_none()


def add_progress(progress: StudentProgress) -> StudentProgress:
    db.session.add(progress)
    db.session.flush()
    return progress


def save(progress: StudentProgress) -> StudentProgress:
    db.session.flush()
    return progress
