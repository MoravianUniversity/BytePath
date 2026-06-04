from __future__ import annotations

from datetime import datetime
from typing import Iterable

from backend.models import Class, db


def class_sort_key(klass: Class) -> datetime:
    """Sort key: most recently updated first (fallback to created_at)."""
    return klass.updated_at or klass.created_at or datetime.min


def sort_classes_by_updated(classes: Iterable[Class]) -> list[Class]:
    return sorted(classes, key=class_sort_key, reverse=True)


def touch_class_updated_at(class_id: int | None) -> None:
    """Set classes.updated_at to now (no-op if class_id is missing)."""
    if class_id is None:
        return
    klass = db.session.get(Class, class_id)
    if klass is not None:
        klass.updated_at = datetime.utcnow()
