#!/usr/bin/env python3
"""Replay response history and rewrite student_progress to match slot completion.

Uses the same two-correct-after-wrong + per-slot credit rules as live progress
updates and instructor analytics. Run from the repo root:

  python3 backend/scripts/reconcile_progress_from_responses.py
  python3 backend/scripts/reconcile_progress_from_responses.py --apply
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app import create_app
from backend.models import StudentProgress, StudentResponse, db
from backend.services.subtopic_completion import slot_progress, slots_for_topic


def reconcile(*, apply_changes: bool) -> int:
    rows = db.session.execute(db.select(StudentProgress)).scalars().all()
    updated = 0
    for progress in rows:
        slots = slots_for_topic(progress.topic)
        if not slots:
            if progress.total_subtopics:
                slots = [f"slot-{index}" for index in range(progress.total_subtopics)]
            else:
                continue

        responses = (
            db.session.execute(
                db.select(StudentResponse).filter(
                    StudentResponse.user_id == progress.user_id,
                    StudentResponse.topic == progress.topic,
                    StudentResponse.class_id == progress.class_id,
                )
            )
            .scalars()
            .all()
        )
        _, _, completed_count = slot_progress(slots, responses)
        total = len(slots)
        changed = (
            progress.subtopics_completed != completed_count
            or progress.total_subtopics != total
        )
        if not changed:
            continue

        updated += 1
        print(
            f"user={progress.user_id} topic={progress.topic} class={progress.class_id}: "
            f"{progress.subtopics_completed}/{progress.total_subtopics} -> "
            f"{completed_count}/{total}"
        )
        if apply_changes:
            progress.subtopics_completed = completed_count
            progress.total_subtopics = total
            # Same source of truth as current completion (full response replay).
            progress.max_subtopics_completed = completed_count

    if apply_changes:
        db.session.commit()
    return updated


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write reconciled values to the database (otherwise dry-run).",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        count = reconcile(apply_changes=args.apply)
        mode = "updated" if args.apply else "would update"
        print(f"{mode} {count} progress row(s)")


if __name__ == "__main__":
    main()
