from __future__ import annotations

from flask import Blueprint, jsonify, request, current_app

from backend.repositories import topic_repository, user_repository
from backend.services.progress_service import ProgressService
from backend.services.response_service import ResponseService

responses_bp = Blueprint("responses", __name__, url_prefix="/api/responses")


def get_response_service():
    return current_app.config.get("RESPONSE_SERVICE", ResponseService)


def get_progress_service():
    return current_app.config.get("PROGRESS_SERVICE", ProgressService)


def get_user_repository():
    return current_app.config.get("USER_REPOSITORY", user_repository)


def get_topic_repository():
    return current_app.config.get("TOPIC_REPOSITORY", topic_repository)


@responses_bp.post("")
def create_response():
    """Persist a new student response and update progress metrics."""

    payload = request.get_json(silent=True) or {}

    response_service = get_response_service()
    progress_service = get_progress_service()

    is_valid, message = response_service.validate_payload(payload)
    if not is_valid:
        return jsonify({"error": message}), 400

    users = get_user_repository()
    topics_repo = get_topic_repository()

    user = users.get_by_id(payload["user_id"])
    if not user:
        return (
            jsonify(
                {"error": "NotFound", "message": f"User {payload['user_id']} does not exist."}
            ),
            404,
        )

    topic = topics_repo.get_by_id(payload["topic"])
    if not topic:
        topic = topics_repo.create_topic(
            topic_id=payload["topic"],
            name=payload["topic"].replace("-", " ").title(),
            is_visible=True,
        )

    response = response_service.create_response(payload)
    progress_service.increment_questions_answered(
        user_id=user.id,
        topic_id=topic.id,
        class_id=payload.get("class_id"),
    )

    return (
        jsonify({"message": "Response recorded successfully.", "response": response.to_dict()}),
        201,
    )


@responses_bp.get("/student/<int:student_id>")
def get_responses_for_student(student_id: int):
    """Return all responses recorded for a given student."""

    class_id = request.args.get("class_id", type=int)

    response_service = get_response_service()
    responses = response_service.get_student_responses(student_id, class_id=class_id)
    return jsonify({"responses": [response.to_dict() for response in responses]}), 200
