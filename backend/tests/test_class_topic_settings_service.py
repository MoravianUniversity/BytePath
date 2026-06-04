from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace

from backend.services.class_topic_settings_service import ClassTopicSettingsService


def test_list_settings_returns_global_and_section_overrides(monkeypatch):
    now = datetime.utcnow()
    rows = [
        SimpleNamespace(
            topic_id="t1",
            section=None,
            is_enabled=True,
            available_at=None,
            is_assigned=False,
            due_at=None,
        ),
        SimpleNamespace(
            topic_id="t2",
            section="A",
            is_enabled=False,
            available_at=now + timedelta(days=1),
            is_assigned=True,
            due_at=now + timedelta(days=7),
        ),
    ]

    monkeypatch.setattr(
        "backend.services.class_topic_settings_service.class_topic_settings_repository.list_by_class",
        lambda _class_id: rows,
    )
    monkeypatch.setattr(
        ClassTopicSettingsService,
        "apply_due_schedules",
        staticmethod(lambda _class_id: None),
    )

    result = ClassTopicSettingsService.list_settings(1)
    assert "global_settings" in result
    assert "section_overrides" in result
    assert len(result["global_settings"]) == 1
    assert result["global_settings"][0]["topic_id"] == "t1"
    assert "A" in result["section_overrides"]
    assert result["section_overrides"]["A"][0]["topic_id"] == "t2"


def test_bulk_upsert_replace_scope_deletes_missing(monkeypatch):
    upserts: list[tuple] = []
    delete_calls: list[tuple] = []

    monkeypatch.setattr(
        ClassTopicSettingsService,
        "ensure_topic",
        staticmethod(lambda *_args, **_kwargs: None),
    )
    monkeypatch.setattr(
        "backend.services.class_topic_settings_service.class_topic_settings_repository.get_by_class_and_topic",
        lambda *_args, **_kwargs: None,
    )
    monkeypatch.setattr(
        "backend.services.class_topic_settings_service.class_topic_settings_repository.upsert",
        lambda class_id, topic_id, **kwargs: upserts.append((class_id, topic_id, kwargs)),
    )
    monkeypatch.setattr(
        "backend.services.class_topic_settings_service.touch_class_updated_at",
        lambda *_args, **_kwargs: None,
    )
    monkeypatch.setattr(
        "backend.services.class_topic_settings_service.class_topic_settings_repository.delete_missing_for_scope",
        lambda class_id, *, section, keep_topic_ids: delete_calls.append((class_id, section, keep_topic_ids)),
    )
    monkeypatch.setattr(
        "backend.services.class_topic_settings_service.db.session.commit",
        lambda: None,
    )
    monkeypatch.setattr(
        ClassTopicSettingsService,
        "list_settings",
        staticmethod(lambda _class_id: {"global_settings": [], "section_overrides": {}}),
    )

    ClassTopicSettingsService.bulk_upsert(
        7,
        [{
            "topic_id": "topic-1",
            "is_enabled": True,
            "available_at": None,
            "is_assigned": False,
            "due_at": None,
        }],
        section="A",
        replace_scope=True,
    )

    assert len(upserts) == 1
    assert upserts[0][0] == 7
    assert upserts[0][1] == "topic-1"
    assert upserts[0][2]["section"] == "A"
    assert delete_calls == [(7, "A", {"topic-1"})]
