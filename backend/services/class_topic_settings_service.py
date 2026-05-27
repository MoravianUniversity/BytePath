from __future__ import annotations

from datetime import datetime, timezone

from backend.models import db
from backend.repositories import class_topic_settings_repository, topic_repository


class ClassTopicSettingsService:
    @staticmethod
    def _parse_available_at(value):
        if value in (None, ''):
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            text = value.strip()
            if text.endswith('Z'):
                text = text[:-1] + '+00:00'
            parsed = datetime.fromisoformat(text)
            if parsed.tzinfo is not None:
                return parsed.astimezone(timezone.utc).replace(tzinfo=None)
            return parsed
        raise ValueError('available_at must be an ISO datetime string or null')

    @staticmethod
    def effective_enabled(row, now: datetime) -> bool:
        if row.available_at and row.available_at > now:
            return False
        return True if row.available_at else bool(row.is_enabled)

    @staticmethod
    def ensure_topic(topic_id: str, name: str | None = None) -> None:
        if topic_repository.get_by_id(topic_id):
            return
        topic_repository.create_topic(topic_id=topic_id, name=name or topic_id.replace('-', ' ').title())

    @staticmethod
    def apply_due_schedules(class_id: int) -> None:
        now = datetime.utcnow()
        changed = False
        for row in class_topic_settings_repository.list_by_class(class_id):
            if row.available_at and row.available_at <= now:
                row.available_at = None
                row.is_enabled = True
                row.updated_at = now
                changed = True
        if changed:
            db.session.commit()

    @staticmethod
    def list_settings(class_id: int):
        ClassTopicSettingsService.apply_due_schedules(class_id)
        now = datetime.utcnow()
        rows = class_topic_settings_repository.list_by_class(class_id)
        return [
            {
                'topic_id': row.topic_id,
                'is_enabled': bool(row.is_enabled),
                'available_at': row.available_at.isoformat() if row.available_at else None,
                'effective_enabled': ClassTopicSettingsService.effective_enabled(row, now),
            }
            for row in rows
        ]

    @staticmethod
    def bulk_upsert(class_id: int, settings: list[dict]):
        now = datetime.utcnow()
        for item in settings:
            topic_id = str(item['topic_id'])
            ClassTopicSettingsService.ensure_topic(topic_id, item.get('name'))
            class_topic_settings_repository.upsert(
                class_id,
                topic_id,
                is_enabled=bool(item.get('is_enabled', True)),
                available_at=ClassTopicSettingsService._parse_available_at(item.get('available_at')),
                updated_at=now,
            )
        db.session.commit()
        return ClassTopicSettingsService.list_settings(class_id)

    @staticmethod
    def update_one(class_id: int, topic_id: str, payload: dict):
        row = class_topic_settings_repository.get_by_class_and_topic(class_id, topic_id)
        if row is None:
            row = class_topic_settings_repository.upsert(
                class_id,
                topic_id,
                is_enabled=bool(payload.get('is_enabled', True)),
                available_at=ClassTopicSettingsService._parse_available_at(payload.get('available_at')),
            )
        else:
            class_topic_settings_repository.upsert(
                class_id,
                topic_id,
                is_enabled=bool(payload.get('is_enabled', row.is_enabled)),
                available_at=ClassTopicSettingsService._parse_available_at(payload.get('available_at')) if 'available_at' in payload else row.available_at,
            )
        db.session.commit()
        ClassTopicSettingsService.apply_due_schedules(class_id)
        setting = class_topic_settings_repository.get_by_class_and_topic(class_id, topic_id)
        now = datetime.utcnow()
        return {
            'topic_id': setting.topic_id,
            'is_enabled': bool(setting.is_enabled),
            'available_at': setting.available_at.isoformat() if setting.available_at else None,
            'effective_enabled': ClassTopicSettingsService.effective_enabled(setting, now),
        }
