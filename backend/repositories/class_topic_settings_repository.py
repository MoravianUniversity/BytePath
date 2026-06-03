from __future__ import annotations

from datetime import datetime
from typing import Iterable

from backend.models import ClassTopicSetting, db


def list_by_class(class_id: int) -> Iterable[ClassTopicSetting]:
    query = (
        db.select(ClassTopicSetting)
        .filter_by(class_id=class_id)
        .order_by(
            ClassTopicSetting.section.asc().nullsfirst(),
            ClassTopicSetting.topic_id.asc(),
        )
    )
    return db.session.execute(query).scalars().all()


def get_by_class_and_topic(class_id: int, topic_id: str, section: str | None = None) -> ClassTopicSetting | None:
    query = db.select(ClassTopicSetting).filter_by(class_id=class_id, topic_id=topic_id, section=section)
    return db.session.execute(query).scalar_one_or_none()


def upsert(
    class_id: int,
    topic_id: str,
    *,
    section: str | None = None,
    is_enabled: bool,
    available_at,
    is_assigned: bool = False,
    due_at=None,
    updated_at: datetime | None = None,
) -> ClassTopicSetting:
    row = get_by_class_and_topic(class_id, topic_id, section)
    if row is None:
        row = ClassTopicSetting(class_id=class_id, topic_id=topic_id, section=section)
        db.session.add(row)
    row.section = section
    row.is_enabled = is_enabled
    row.available_at = available_at
    row.is_assigned = is_assigned
    row.due_at = due_at
    row.updated_at = updated_at or datetime.utcnow()
    db.session.flush()
    return row


def delete_missing_for_scope(class_id: int, *, section: str | None, keep_topic_ids: set[str]) -> None:
    query = db.delete(ClassTopicSetting).where(
        ClassTopicSetting.class_id == class_id,
        ClassTopicSetting.section.is_(section) if section is None else ClassTopicSetting.section == section,
    )
    if keep_topic_ids:
        query = query.where(~ClassTopicSetting.topic_id.in_(keep_topic_ids))
    db.session.execute(query)
