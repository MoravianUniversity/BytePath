from __future__ import annotations

from datetime import datetime
from typing import Dict, Iterable, Optional, Tuple

from backend.models import StudentResponse, db
from backend.repositories import response_repository


class ResponseService:
    """Business logic for student responses."""

    REQUIRED_FIELDS = {
        "user_id",
        "topic",
        "subtopic_type",
        "question_code",
        "correct_answer",
        "is_correct",
        "status",
    }

    @classmethod
    def create_response(cls, data: Dict) -> StudentResponse:
        response = StudentResponse(
            user_id=data["user_id"],
            class_id=data.get("class_id"),
            topic=data["topic"],
            subtopic_type=data["subtopic_type"],
            question_code=data["question_code"],
            student_answer=data.get("student_answer"),
            correct_answer=data["correct_answer"],
            is_correct=bool(data["is_correct"]),
            status=data["status"],
            time_spent=data.get("time_spent"),
            attempted_at=datetime.utcnow(),
        )
        response_repository.add_response(response)
        db.session.commit()
        return response

    @staticmethod
    def get_student_responses(
        user_id: int, class_id: Optional[int] = None
    ) -> Iterable[StudentResponse]:
        return response_repository.get_by_user(user_id, class_id=class_id)

    @staticmethod
    def get_student_responses_for_topic(user_id: int, topic_id: str) -> Iterable[StudentResponse]:
        return response_repository.get_by_user_and_topic(user_id, topic_id)

    @classmethod
    def validate_payload(cls, data: Dict) -> Tuple[bool, str]:
        missing = cls.REQUIRED_FIELDS.difference(data.keys() if data else [])
        if missing:
            return False, f"Missing required fields: {', '.join(sorted(missing))}"

        if data["status"] not in {"correct", "incorrect", "skipped"}:
            return False, "Invalid status value"

        return True, ""
