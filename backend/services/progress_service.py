from __future__ import annotations

from datetime import datetime
from typing import Dict, Iterable, List, Optional, Sequence

from backend.models import StudentProgress, StudentResponse, db
from backend.repositories import progress_repository
from backend.services.subtopic_completion import slot_progress, slots_for_topic


class ProgressService:
    """Business logic for tracking student progress."""

    @staticmethod
    def get_user_progress(user_id: int, class_id: int) -> Iterable[StudentProgress]:
        return progress_repository.get_by_user(user_id, class_id=class_id)

    @staticmethod
    def get_topic_progress(
        user_id: int, topic_id: str, class_id: int
    ) -> Optional[StudentProgress]:
        return progress_repository.get_by_user_and_topic(
            user_id, topic_id, class_id=class_id
        )

    @staticmethod
    def _responses_for_topic(user_id: int, topic_id: str, class_id: int) -> list:
        return (
            db.session.execute(
                db.select(StudentResponse).filter(
                    StudentResponse.user_id == user_id,
                    StudentResponse.topic == topic_id,
                    StudentResponse.class_id == class_id,
                )
            )
            .scalars()
            .all()
        )

    @classmethod
    def resolve_slots(
        cls, topic_id: str, data: Dict, total_subtopics: int
    ) -> List[str]:
        # Frontend topic sources (src/topics/*.ts) are the catalog of record.
        catalog_slots = slots_for_topic(topic_id)
        if catalog_slots:
            return catalog_slots
        payload_slots = data.get("subtopic_slots")
        if isinstance(payload_slots, list) and payload_slots:
            return [str(slot) for slot in payload_slots]
        # Last resort: unknown catalog; treat as total anonymous slots.
        return [f"slot-{index}" for index in range(total_subtopics)]

    @classmethod
    def reconcile_completed_count(
        cls,
        user_id: int,
        topic_id: str,
        class_id: int,
        *,
        slots: Sequence[str],
    ) -> int:
        """Authoritative completed count from response replay + slot catalog."""
        responses = cls._responses_for_topic(user_id, topic_id, class_id)
        _, _, completed_count = slot_progress(slots, responses)
        return completed_count

    @classmethod
    def update_or_create_progress(
        cls, user_id: int, topic_id: str, data: Dict, class_id: int
    ) -> tuple[StudentProgress, bool]:
        total_subtopics = int(data["total_subtopics"])
        slots = cls.resolve_slots(topic_id, data, total_subtopics)
        if slots:
            total_subtopics = len(slots)
        subtopics_completed = cls.reconcile_completed_count(
            user_id,
            topic_id,
            class_id,
            slots=slots,
        )

        progress = progress_repository.get_by_user_and_topic(
            user_id, topic_id, class_id=class_id
        )
        created = False
        if progress:
            progress.subtopics_completed = subtopics_completed
            # Replay of full response history is already the high-water mark.
            progress.max_subtopics_completed = subtopics_completed
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
        class_id: int,
        *,
        timestamp: Optional[datetime] = None,
    ) -> StudentProgress:
        if timestamp is None:
            timestamp = datetime.utcnow()

        progress = progress_repository.get_by_user_and_topic(
            user_id, topic_id, class_id=class_id
        )

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
