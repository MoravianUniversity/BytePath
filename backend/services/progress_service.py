from __future__ import annotations

from datetime import datetime
from typing import Dict, Iterable, Optional

from backend.models import StudentProgress, db
from backend.repositories import progress_repository


class ProgressService:
    """Business logic for tracking student progress."""

    @staticmethod
    def get_user_progress(
        user_id: int, class_id: Optional[int] = None
    ) -> Iterable[StudentProgress]:
        return progress_repository.get_by_user(user_id, class_id=class_id)

    @staticmethod
    def get_topic_progress(
        user_id: int, topic_id: str, class_id: Optional[int] = None
    ) -> Optional[StudentProgress]:
        return progress_repository.get_by_user_and_topic(user_id, topic_id, class_id=class_id)

    @staticmethod
    def update_or_create_progress(
        user_id: int, topic_id: str, data: Dict[str, int], class_id: Optional[int] = None
    ) -> tuple[StudentProgress, bool]:
        subtopics_completed = data["subtopics_completed"]
        total_subtopics = data["total_subtopics"]

        progress = progress_repository.get_by_user_and_topic(user_id, topic_id, class_id=class_id)
        created = False
        if progress:
            progress.subtopics_completed = subtopics_completed
            progress.max_subtopics_completed = max(
                progress.max_subtopics_completed or 0, subtopics_completed
            )
            progress.total_subtopics = total_subtopics
            progress.last_accessed = datetime.utcnow()
            progress_repository.save(progress)
        else:
            progress = StudentProgress(
                user_id=user_id,
                topic=topic_id,
                class_id=class_id,
                subtopics_completed=subtopics_completed,
                max_subtopics_completed=subtopics_completed,
                total_subtopics=total_subtopics,
                questions_answered=0,
                last_accessed=datetime.utcnow(),
            )
            progress_repository.add_progress(progress)
            created = True

        db.session.commit()
        return progress, created

    @staticmethod
    def increment_questions_answered(
        user_id: int,
        topic_id: str,
        class_id: Optional[int] = None,
        *,
        timestamp: Optional[datetime] = None,
    ) -> StudentProgress:
        if timestamp is None:
            timestamp = datetime.utcnow()

        progress = progress_repository.get_by_user_and_topic(user_id, topic_id, class_id=class_id)

        if progress:
            progress.questions_answered = (progress.questions_answered or 0) + 1
            progress.last_accessed = timestamp
            progress_repository.save(progress)
        else:
            progress = StudentProgress(
                user_id=user_id,
                topic=topic_id,
                class_id=class_id,
                subtopics_completed=0,
                total_subtopics=0,
                questions_answered=1,
                last_accessed=timestamp,
            )
            progress_repository.add_progress(progress)

        db.session.commit()
        return progress
