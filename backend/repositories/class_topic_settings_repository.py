from __future__ import annotations

from datetime import datetime
from typing import Iterable

from backend.models import ClassTopicSetting, db


def list_by_class(class_id: int) -> Iterable[ClassTopicSetting]:
    query = db.select(ClassTopicSetting).filter_by(class_id=class_id).order_by(ClassTopicSetting.topic_id.asc())
    return db.session.execute(query).scalars().all()


def get_by_class_and_topic(class_id: int, topic_id: str) -> ClassTopicSetting | None:
    query = db.select(ClassTopicSetting).filter_by(class_id=class_id, topic_id=topic_id)
    return db.session.execute(query).scalar_one_or_none()


def upsert(class_id: int, topic_id: str, *, is_enabled: bool, available_at, updated_at: datetime | None = None) -> ClassTopicSetting:
    row = get_by_class_and_topic(class_id, topic_id)
    if row is None:
        row = ClassTopicSetting(class_id=class_id, topic_id=topic_id)
        db.session.add(row)
    row.is_enabled = is_enabled
    row.available_at = available_at
    row.updated_at = updated_at or datetime.utcnow()
    db.session.flush()
    return row
