from __future__ import annotations

from datetime import datetime, timezone

from backend.models import db
from backend.repositories import class_topic_settings_repository, topic_repository
from backend.services.class_service import touch_class_updated_at


class ClassTopicSettingsService:
    @staticmethod
    def _parse_datetime(value, field_name: str):
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
        raise ValueError(f'{field_name} must be an ISO datetime string or null')

    @staticmethod
    def _parse_available_at(value):
        return ClassTopicSettingsService._parse_datetime(value, 'available_at')

    @staticmethod
    def _parse_due_at(value):
        return ClassTopicSettingsService._parse_datetime(value, 'due_at')

    @staticmethod
    def effective_enabled(row, now: datetime) -> bool:
        if row.available_at and row.available_at > now:
            return False
        return True if row.available_at else bool(row.is_enabled)

    @staticmethod
    def normalize_section(value):
        if value is None:
            return None
        text = str(value).strip()
        return text if text else ""

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
            touch_class_updated_at(class_id)
            db.session.commit()

    @staticmethod
    def list_settings(class_id: int):
        ClassTopicSettingsService.apply_due_schedules(class_id)
        now = datetime.utcnow()
        rows = class_topic_settings_repository.list_by_class(class_id)
        global_settings = []
        section_overrides: dict[str, list[dict]] = {}

        for row in rows:
            payload = {
                'topic_id': row.topic_id,
                'section': row.section,
                'is_enabled': bool(row.is_enabled),
                'available_at': row.available_at.isoformat() if row.available_at else None,
                'is_assigned': bool(row.is_assigned),
                'due_at': row.due_at.isoformat() if row.due_at else None,
                'effective_enabled': ClassTopicSettingsService.effective_enabled(row, now),
            }
            if row.section is None:
                global_settings.append(payload)
            else:
                section_overrides.setdefault(row.section, []).append(payload)

        return {
            'global_settings': global_settings,
            'section_overrides': section_overrides,
        }

    @staticmethod
    def _topic_schedule_changed(
        existing,
        *,
        is_enabled: bool,
        due_at,
    ) -> bool:
        if existing is None:
            return is_enabled or due_at is not None
        if existing.is_enabled != is_enabled:
            return True
        return existing.due_at != due_at

    @staticmethod
    def bulk_upsert(class_id: int, settings: list[dict], section: str | None = None, replace_scope: bool = False):
        now = datetime.utcnow()
        normalized_section = ClassTopicSettingsService.normalize_section(section)
        keep_topic_ids: set[str] = set()
        class_touched = False
        for item in settings:
            topic_id = str(item['topic_id'])
            ClassTopicSettingsService.ensure_topic(topic_id, item.get('name'))
            existing = class_topic_settings_repository.get_by_class_and_topic(
                class_id, topic_id, normalized_section
            )
            is_enabled = bool(item.get('is_enabled', True))
            due_at = ClassTopicSettingsService._parse_due_at(item.get('due_at'))
            if ClassTopicSettingsService._topic_schedule_changed(
                existing, is_enabled=is_enabled, due_at=due_at
            ):
                class_touched = True
            class_topic_settings_repository.upsert(
                class_id,
                topic_id,
                section=normalized_section,
                is_enabled=is_enabled,
                available_at=ClassTopicSettingsService._parse_available_at(item.get('available_at')),
                is_assigned=bool(item.get('is_assigned', False)),
                due_at=due_at,
                updated_at=now,
            )
            keep_topic_ids.add(topic_id)
        if replace_scope:
            class_topic_settings_repository.delete_missing_for_scope(
                class_id,
                section=normalized_section,
                keep_topic_ids=keep_topic_ids,
            )
        if class_touched:
            touch_class_updated_at(class_id)
        db.session.commit()
        return ClassTopicSettingsService.list_settings(class_id)

    @staticmethod
    def update_one(class_id: int, topic_id: str, payload: dict, section: str | None = None):
        normalized_section = ClassTopicSettingsService.normalize_section(
            payload.get('section', section)
        )
        row = class_topic_settings_repository.get_by_class_and_topic(class_id, topic_id, normalized_section)
        is_enabled = bool(payload.get('is_enabled', row.is_enabled if row else True))
        due_at = (
            ClassTopicSettingsService._parse_due_at(payload.get('due_at'))
            if 'due_at' in payload
            else (row.due_at if row else None)
        )
        class_touched = ClassTopicSettingsService._topic_schedule_changed(
            row, is_enabled=is_enabled, due_at=due_at
        )
        if row is None:
            class_topic_settings_repository.upsert(
                class_id,
                topic_id,
                section=normalized_section,
                is_enabled=is_enabled,
                available_at=ClassTopicSettingsService._parse_available_at(payload.get('available_at')),
                is_assigned=bool(payload.get('is_assigned', False)),
                due_at=due_at,
            )
        else:
            class_topic_settings_repository.upsert(
                class_id,
                topic_id,
                section=normalized_section,
                is_enabled=is_enabled,
                available_at=ClassTopicSettingsService._parse_available_at(payload.get('available_at')) if 'available_at' in payload else row.available_at,
                is_assigned=bool(payload.get('is_assigned', row.is_assigned)),
                due_at=due_at,
            )
        if class_touched:
            touch_class_updated_at(class_id)
        db.session.commit()
        ClassTopicSettingsService.apply_due_schedules(class_id)
        setting = class_topic_settings_repository.get_by_class_and_topic(class_id, topic_id, normalized_section)
        now = datetime.utcnow()
        return {
            'topic_id': setting.topic_id,
            'section': setting.section,
            'is_enabled': bool(setting.is_enabled),
            'available_at': setting.available_at.isoformat() if setting.available_at else None,
            'is_assigned': bool(setting.is_assigned),
            'due_at': setting.due_at.isoformat() if setting.due_at else None,
            'effective_enabled': ClassTopicSettingsService.effective_enabled(setting, now),
        }
