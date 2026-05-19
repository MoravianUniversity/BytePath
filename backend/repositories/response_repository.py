from __future__ import annotations

from typing import Iterable, Optional

from backend.models import StudentResponse, db


def add_response(response: StudentResponse) -> StudentResponse:
    db.session.add(response)
    db.session.flush()
    return response


def get_by_user(user_id: int, class_id: Optional[int] = None) -> Iterable[StudentResponse]:
    query = (
        db.select(StudentResponse)
        .filter_by(user_id=user_id)
        .order_by(StudentResponse.attempted_at.desc())
    )
    if class_id is not None:
        query = query.filter(StudentResponse.class_id == class_id)
    return db.session.execute(query).scalars().all()


def get_by_user_and_topic(user_id: int, topic_id: str) -> Iterable[StudentResponse]:
    return (
        db.session.execute(
            db.select(StudentResponse)
            .filter_by(user_id=user_id, topic=topic_id)
            .order_by(StudentResponse.attempted_at.desc())
        )
        .scalars()
        .all()
    )
