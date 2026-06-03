#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime

from sqlalchemy import func

from backend.app import create_app
from backend.models import RosterStudent, StudentProgress, Topic, User, db
from backend.repositories import progress_repository, topic_repository


PYTHON_BASICS_TOPICS = [
    {"id": "basic-arithmetic", "name": "Basic Arithmetic", "total_subtopics": 9},
    {"id": "basic-variables", "name": "Basic Variables", "total_subtopics": 10},
    {"id": "string-concat", "name": "String Concatenation", "total_subtopics": 6},
    {"id": "string-length", "name": "String Length", "total_subtopics": 6},
    {"id": "string-index", "name": "String Indexing", "total_subtopics": 9},
    {"id": "basic-prints", "name": "Basic Printing", "total_subtopics": 9},
]


def _ensure_topics_exist() -> None:
    for topic in PYTHON_BASICS_TOPICS:
        existing = topic_repository.get_by_id(topic["id"])
        if existing:
            continue
        topic_repository.create_topic(
            topic_id=topic["id"],
            name=topic["name"],
            is_visible=True,
        )


def _fetch_user_ids_for_roster(class_name: str | None) -> list[int]:
    query = (
        db.select(User.id)
        .join(RosterStudent, func.lower(RosterStudent.email) == func.lower(User.email))
        .filter(RosterStudent.deleted_at.is_(None))
    )
    if class_name:
        query = query.filter(RosterStudent.class_name == class_name)

    return [row[0] for row in db.session.execute(query).all()]


def _count_roster_students(class_name: str | None) -> int:
    query = db.select(func.count(RosterStudent.id)).filter(
        RosterStudent.deleted_at.is_(None)
    )
    if class_name:
        query = query.filter(RosterStudent.class_name == class_name)

    return int(db.session.execute(query).scalar() or 0)


def mark_python_basics_complete(*, class_name: str | None) -> dict:
    _ensure_topics_exist()

    roster_count = _count_roster_students(class_name)
    user_ids = _fetch_user_ids_for_roster(class_name)
    matched_user_count = len(user_ids)

    created = 0
    updated = 0
    now = datetime.utcnow()

    for user_id in user_ids:
        for topic in PYTHON_BASICS_TOPICS:
            total_subtopics = topic["total_subtopics"]
            progress = progress_repository.get_by_user_and_topic(user_id, topic["id"])
            if progress:
                progress.subtopics_completed = total_subtopics
                progress.max_subtopics_completed = max(
                    progress.max_subtopics_completed or 0, total_subtopics
                )
                progress.total_subtopics = total_subtopics
                progress.last_accessed = now
                progress_repository.save(progress)
                updated += 1
            else:
                progress_repository.add_progress(
                    StudentProgress(
                        user_id=user_id,
                        topic=topic["id"],
                        subtopics_completed=total_subtopics,
                        max_subtopics_completed=total_subtopics,
                        total_subtopics=total_subtopics,
                        questions_answered=0,
                        last_accessed=now,
                    )
                )
                created += 1

    db.session.commit()

    return {
        "roster_students": roster_count,
        "matched_users": matched_user_count,
        "missing_users": roster_count - matched_user_count,
        "progress_created": created,
        "progress_updated": updated,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Mark Python Basics topics complete for roster students."
    )
    parser.add_argument(
        "--class-name",
        dest="class_name",
        default=None,
        help="Optional class_name to filter roster students.",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        summary = mark_python_basics_complete(class_name=args.class_name)

    print("Done.")
    print(f"Roster students: {summary['roster_students']}")
    print(f"Matched users: {summary['matched_users']}")
    print(f"Missing users (no login yet): {summary['missing_users']}")
    print(f"Progress created: {summary['progress_created']}")
    print(f"Progress updated: {summary['progress_updated']}")


if __name__ == "__main__":
    main()
