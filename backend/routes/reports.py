from __future__ import annotations

from flask import Blueprint, jsonify, request, current_app

from backend.services.report_service import ReportService

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _normalize_section(section: str | None) -> str | None:
    if section is None:
        return None
    return section.strip()


@reports_bp.get("/student/<int:student_id>")
def get_student_report(student_id: int):
    class_id = request.args.get("class_id", type=int)
    section = request.args.get("section")
    service = current_app.config.get("REPORT_SERVICE", ReportService)
    normalized_section = _normalize_section(section)
    report = service.get_student_report(student_id, class_id=class_id, section=normalized_section)
    if not report:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(report), 200


@reports_bp.get("/topic/<string:topic_id>")
def get_topic_report(topic_id: str):
    class_id = request.args.get("class_id", type=int)
    section = request.args.get("section")
    service = current_app.config.get("REPORT_SERVICE", ReportService)
    normalized_section = _normalize_section(section)
    report = service.get_topic_report(topic_id, class_id=class_id, section=normalized_section)
    if not report:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify(report), 200


@reports_bp.get("/class/overview")
def get_class_overview():
    class_id = request.args.get("class_id", type=int)
    section = request.args.get("section")
    service = current_app.config.get("REPORT_SERVICE", ReportService)
    normalized_section = _normalize_section(section)
    overview = service.get_class_overview(class_id=class_id, section=normalized_section)
    return jsonify(overview), 200


@reports_bp.get("/question/<string:topic_id>/analytics")
def get_question_analytics(topic_id: str):
    subtopic_type = request.args.get("subtopic_type")
    class_id = request.args.get("class_id", type=int)
    section = request.args.get("section")
    service = current_app.config.get("REPORT_SERVICE", ReportService)
    normalized_section = _normalize_section(section)
    analytics = service.get_question_analytics(
        topic_id,
        subtopic_type=subtopic_type,
        class_id=class_id,
        section=normalized_section,
    )
    return jsonify(analytics), 200
