"""
Service layer for roster student operations.

Provides pagination helpers and CSV upsert utilities so that the
Flask routes remain thin.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Tuple

from sqlalchemy import func, or_

from backend.models import RosterStudent, UploadHistory, db
from backend.services.class_service import touch_class_updated_at

SECTION_MAX_LENGTH = 64


def normalize_section(value: str | None) -> str:
    """Trim and cap section to a short string; empty string when blank."""
    if not value:
        return ""
    return value.strip()[:SECTION_MAX_LENGTH]


@dataclass
class RosterStudentRow:
    first_name: str
    last_name: str
    email: str
    section: str = ""


def list_students(
    page: int,
    page_size: int,
    search: str | None = None,
    include_deleted: bool = False,
    class_id: int | None = None,
    email_filter: str | None = None,
    first_name_filter: str | None = None,
    last_name_filter: str | None = None,
    notes_filter: str | None = None,
    section: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> dict:
    """Return paginated roster students with filtering and sorting."""

    query = RosterStudent.query

    # Filter soft-deleted by default
    if not include_deleted:
        query = query.filter(RosterStudent.deleted_at.is_(None))

    # Filter by class
    if class_id:
        query = query.filter(RosterStudent.class_id == class_id)

    # Filter by section (single exact section, including empty string support)
    if section is not None:
        query = query.filter(RosterStudent.section == section)

    # Column-specific text filters
    if email_filter:
        query = query.filter(func.lower(RosterStudent.email).like(f"%{email_filter.lower()}%"))
    if first_name_filter:
        query = query.filter(func.lower(RosterStudent.first_name).like(f"%{first_name_filter.lower()}%"))
    if last_name_filter:
        query = query.filter(func.lower(RosterStudent.last_name).like(f"%{last_name_filter.lower()}%"))
    if notes_filter:
        query = query.filter(func.lower(func.coalesce(RosterStudent.notes, "")).like(f"%{notes_filter.lower()}%"))

    # Search filter
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(RosterStudent.first_name).like(pattern),
                func.lower(RosterStudent.last_name).like(pattern),
                func.lower(RosterStudent.email).like(pattern),
            )
        )

    # Sorting
    sort_column = {
        "email": RosterStudent.email,
        "first_name": RosterStudent.first_name,
        "last_name": RosterStudent.last_name,
        "section": RosterStudent.section,
        "notes": RosterStudent.notes,
        "created_at": RosterStudent.created_at,
        "class_id": RosterStudent.class_id,
    }.get(sort_by, RosterStudent.created_at)

    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=page_size, error_out=False)

    return {
        "items": [student.to_dict() for student in pagination.items],
        "page": pagination.page,
        "page_size": pagination.per_page,
        "total": pagination.total,
        "total_pages": pagination.pages,
    }


def list_sections(class_id: int | None = None, include_empty: bool = False) -> list[str]:
    """Distinct non-empty section names for a class roster."""
    query = db.session.query(RosterStudent.section).filter(RosterStudent.deleted_at.is_(None))
    if class_id is not None:
        query = query.filter(RosterStudent.class_id == class_id)

    sections = {normalize_section(row[0]) for row in query.distinct().all()}
    if not include_empty:
        sections.discard("")
    return sorted(sections)


def bulk_upsert(
    rows: Iterable[Tuple[int, RosterStudentRow]]
) -> tuple[dict, list[dict]]:
    """
    Upsert roster students.

    Returns (summary, errors).
    """

    inserted = updated = skipped = 0
    errors: list[dict] = []

    for line_number, row in rows:
        first_name = row.first_name.strip()
        last_name = row.last_name.strip()
        email = row.email.strip().lower()

        if not email:
            errors.append(
                {
                    "line": line_number,
                    "reason": f"Missing email ('{email}')",
                }
            )
            skipped += 1
            continue

        existing = RosterStudent.query.filter_by(email=email).first()
        if existing:
            if first_name:
                existing.first_name = first_name
            if last_name:
                existing.last_name = last_name
            updated += 1
        else:
            db.session.add(
                RosterStudent(
                    email=email, first_name=first_name, last_name=last_name
                )
            )
            inserted += 1

    db.session.commit()

    summary = {
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
        "total_processed": inserted + updated + skipped,
    }

    return summary, errors


def add_students_from_csv(
    rows: Iterable[Tuple[int, RosterStudentRow]],
    filename: str,
    user_id: int | None = None,
    class_id: int | None = None,
    default_section: str = "",
) -> tuple[dict, list[dict], UploadHistory]:
    """
    Add students from CSV to the roster bank.
    
    Returns (summary, errors, upload_history).
    """
    added = restored = skipped = 0
    errors: list[dict] = []
    changes: list[dict] = []
    fallback_section = normalize_section(default_section)

    for line_number, row in rows:
        first_name = row.first_name.strip()
        last_name = row.last_name.strip()
        email = row.email.strip().lower()
        row_section = normalize_section(row.section)
        section = row_section if row_section else fallback_section

        if not email:
            errors.append(
                {
                    "line": line_number,
                    "email": email,
                    "reason": "Missing email",
                }
            )
            skipped += 1
            continue

        display = f"{first_name} {last_name}".strip() or email

        # Check if student exists in this class (not soft-deleted)
        existing = RosterStudent.query.filter_by(
            email=email, class_id=class_id, deleted_at=None
        ).first()

        if existing:
            skipped += 1
            changes.append({
                "type": "skipped",
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "action": f"{display} already exists",
            })
            continue

        # Check if soft-deleted in this class (can restore)
        deleted = RosterStudent.query.filter_by(
            email=email, class_id=class_id
        ).filter(RosterStudent.deleted_at.isnot(None)).first()

        if deleted:
            deleted.deleted_at = None
            if first_name:
                deleted.first_name = first_name
            if last_name:
                deleted.last_name = last_name
            deleted.section = section
            deleted.last_updated_via = "csv_add"
            restored += 1
            changes.append({
                "type": "restored",
                "email": email,
                "first_name": deleted.first_name,
                "last_name": deleted.last_name,
                "action": f"{display} restored",
            })
        else:
            # Create new
            student = RosterStudent(
                email=email,
                first_name=first_name,
                last_name=last_name,
                section=section,
                class_id=class_id,
                last_updated_via="csv_add",
            )
            db.session.add(student)
            added += 1
            changes.append({
                "type": "added",
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "action": f"{display} added",
            })

    if class_id is not None and (added > 0 or restored > 0):
        touch_class_updated_at(class_id)

    # Create upload history record
    upload_history = UploadHistory(
        filename=filename,
        uploaded_by=user_id,
        action="add",
        students_added=added,
        students_restored=restored,
        students_skipped=skipped,
        total_processed=added + restored + skipped,
        change_log=json.dumps(changes),
    )
    db.session.add(upload_history)
    db.session.flush()

    # Link students to upload
    for change in changes:
        if change["type"] in ("added", "restored"):
            student = RosterStudent.query.filter_by(email=change["email"]).first()
            if student:
                student.last_upload_id = upload_history.id

    db.session.commit()

    summary = {
        "added": added,
        "restored": restored,
        "skipped": skipped,
        "total_processed": added + restored + skipped,
    }

    return summary, errors, upload_history


def drop_students_from_csv(
    rows: Iterable[Tuple[int, RosterStudentRow]], filename: str, user_id: int | None = None
) -> tuple[dict, list[dict], UploadHistory]:
    """
    Drop (soft delete) students from CSV.
    
    Returns (summary, errors, upload_history).
    """
    removed = not_found = skipped = 0
    errors: list[dict] = []
    changes: list[dict] = []

    for line_number, row in rows:
        first_name = row.first_name.strip()
        last_name = row.last_name.strip()
        email = row.email.strip().lower()

        if not email:
            errors.append(
                {
                    "line": line_number,
                    "email": email,
                    "reason": "Missing email",
                }
            )
            skipped += 1
            continue

        display = f"{first_name} {last_name}".strip() or email

        # Find active student (not soft-deleted)
        student = RosterStudent.query.filter_by(
            email=email, deleted_at=None
        ).first()

        if student:
            # Soft delete
            student.deleted_at = datetime.utcnow()
            student.last_updated_via = "csv_drop"
            removed += 1
            changes.append({
                "type": "removed",
                "email": email,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "action": f"{display} removed",
            })
        else:
            # Not found in active roster
            not_found += 1
            changes.append({
                "type": "not_found",
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "action": f"{display} not found in active roster",
            })

    # Create upload history record
    upload_history = UploadHistory(
        filename=filename,
        uploaded_by=user_id,
        action="drop",
        students_removed=removed,
        students_not_found=not_found,
        students_skipped=skipped,
        total_processed=removed + not_found + skipped,
        change_log=json.dumps(changes),
    )
    db.session.add(upload_history)
    db.session.flush()

    # Link students to upload
    for change in changes:
        if change["type"] == "removed":
            student = RosterStudent.query.filter_by(email=change["email"]).first()
            if student:
                student.last_upload_id = upload_history.id

    db.session.commit()

    summary = {
        "removed": removed,
        "not_found": not_found,
        "skipped": skipped,
        "total_processed": removed + not_found + skipped,
    }

    return summary, errors, upload_history


def template_csv() -> str:
    """Return the CSV template string for downloads."""

    return (
        "first_name,last_name,email,section\n"
        "Ada,Lovelace,ada@example.com,Section A\n"
        ",,alan@example.com,\n"
    )

