"""
Routes for roster student management (CSV upload + pagination).
"""

from __future__ import annotations

import csv
from io import BytesIO, StringIO

from flask import Blueprint, jsonify, request, send_file, session
from sqlalchemy.exc import SQLAlchemyError

from backend.models import db
from backend.services import student_service
from backend.services.class_service import touch_class_updated_at
from backend.services.student_service import RosterStudentRow, normalize_section

students_bp = Blueprint("students", __name__, url_prefix="/api/students")


@students_bp.get("/sections")
def list_sections():
    class_id = request.args.get("class_id", default=None, type=int)
    include_empty = request.args.get("include_empty", default=False, type=bool)
    sections = student_service.list_sections(class_id=class_id, include_empty=include_empty)
    return jsonify({"sections": sections})


@students_bp.get("")
def list_students():
    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("page_size", default=20, type=int)
    search = request.args.get("search", default="", type=str)
    include_deleted = request.args.get("include_deleted", default=False, type=bool)
    class_id = request.args.get("class_id", default=None, type=int)
    email_filter = request.args.get("email_filter", default="", type=str).strip()
    first_name_filter = request.args.get("first_name_filter", default="", type=str).strip()
    last_name_filter = request.args.get("last_name_filter", default="", type=str).strip()
    notes_filter = request.args.get("notes_filter", default="", type=str).strip()
    section = request.args.get("section", default=None, type=str)
    sort_by = request.args.get("sort_by", default="created_at", type=str)
    sort_order = request.args.get("sort_order", default="desc", type=str)

    data = student_service.list_students(
        page=page,
        page_size=page_size,
        search=search,
        include_deleted=include_deleted,
        class_id=class_id,
        email_filter=email_filter or None,
        first_name_filter=first_name_filter or None,
        last_name_filter=last_name_filter or None,
        notes_filter=notes_filter or None,
        section=normalize_section(section) if section is not None else None,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return jsonify(data)


def read_csv_file() -> list[RosterStudentRow] | tuple[str, int]:
    """Read a CSV file and return a list of RosterStudentRow objects."""
    if "file" not in request.files:
        return "Missing file field", 400

    file = request.files["file"]
    if not file.filename:
        return "Missing filename", 400

    try:
        stream = StringIO(file.stream.read().decode("utf-8"))
    except UnicodeDecodeError:
        return "Unable to decode file; make sure it is UTF-8", 400

    # skip BOM if it exists
    if stream.getvalue()[:1] == "\ufeff":
        stream.seek(1)

    for csv_row in reader:
        rows.append(
            RosterStudentRow(
                first_name=csv_row.get("first_name", ""),
                last_name=csv_row.get("last_name", ""),
                email=csv_row.get("email", ""),
                section=csv_row.get("section", ""),
            )
        )

    return rows


@students_bp.post("/add")
def add_students():
    """Add students to the roster bank via CSV upload."""
    rows = read_csv_file()
    if isinstance(rows, tuple):
        return jsonify({"error": rows[0]}), rows[1]

    try:
        user_id = session.get("user_id")
        class_id = request.form.get("class_id", type=int)
        default_section = normalize_section(request.form.get("default_section"))
        summary, errors, upload_history = student_service.add_students_from_csv(
            enumerate(rows, start=2),  # header is line 1
            filename=file.filename,
            user_id=user_id,
            class_id=class_id,
            default_section=default_section,
        )
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Unable to save roster", "details": str(e)}), 500

    return jsonify({
        "upload_id": upload_history.id,
        "action": "add",
        "summary": summary,
        "errors": errors,
        "upload_history": upload_history.to_dict(),
    }), 201


@students_bp.post("/drop")
def drop_students():
    """Drop (soft delete) students from the roster bank via CSV upload."""
    rows = read_csv_file()
    if isinstance(rows, tuple):
        return jsonify({"error": rows[0]}), rows[1]

    try:
        user_id = session.get("user_id")
        summary, errors, upload_history = student_service.drop_students_from_csv(
            enumerate(rows, start=2),  # header is line 1
            filename=file.filename,
            user_id=user_id,
        )
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({"error": "Unable to process drop", "details": str(e)}), 500

    return jsonify({
        "upload_id": upload_history.id,
        "action": "drop",
        "summary": summary,
        "errors": errors,
        "upload_history": upload_history.to_dict(),
    }), 200


@students_bp.post("/upload")
def upload_students():
    """Legacy endpoint - kept for backward compatibility, redirects to /add."""
    # For backward compatibility, treat as add operation
    return add_students()


@students_bp.get("/<int:id>")
def get_student(id: int):
    """Get single student by ID."""
    from backend.models import RosterStudent
    
    student = db.session.get(RosterStudent, id)
    if not student or student.deleted_at:
        return jsonify({"error": "Student not found"}), 404
    
    return jsonify(student.to_dict())


@students_bp.post("")
def create_student():
    """Create a single student manually."""
    from backend.models import RosterStudent
    from sqlalchemy.exc import IntegrityError
    
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    notes = data.get("notes", "").strip() or None
    section = normalize_section(data.get("section"))
    class_id = data.get("class_id") or None

    if not email or not first_name or not last_name:
        return jsonify({"error": "Email, first_name, and last_name are required"}), 400

    # Check if already exists in the same class (not soft-deleted)
    existing = RosterStudent.query.filter_by(email=email, class_id=class_id, deleted_at=None).first()
    if existing:
        return jsonify({"error": "Student with this email already exists in this class"}), 409

    try:
        student = RosterStudent(
            email=email,
            first_name=first_name,
            last_name=last_name,
            notes=notes,
            section=section,
            class_id=class_id,
            last_updated_via="manual",
        )
        db.session.add(student)
        touch_class_updated_at(class_id)
        db.session.commit()
        return jsonify(student.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Student with this email already exists"}), 409


@students_bp.patch("/<int:id>")
def update_student(id: int):
    """Partially update a student (for inline editing)."""
    from backend.models import RosterStudent
    from sqlalchemy.exc import IntegrityError
    
    student = db.session.get(RosterStudent, id)
    if not student or student.deleted_at:
        return jsonify({"error": "Student not found"}), 404
    
    data = request.get_json(silent=True) or {}
    
    # Update fields if provided
    if "email" in data:
        new_email = data["email"].strip().lower()
        if new_email != student.email:
            # Check uniqueness
            existing = RosterStudent.query.filter_by(email=new_email, deleted_at=None).first()
            if existing and existing.id != id:
                return jsonify({"error": "Email already in use"}), 409
            student.email = new_email
    
    if "first_name" in data:
        student.first_name = data["first_name"].strip()
    if "last_name" in data:
        student.last_name = data["last_name"].strip()
    if "notes" in data:
        student.notes = data["notes"].strip() or None
    if "section" in data:
        student.section = normalize_section(data["section"])
    if "class_id" in data:
        new_class_id = data["class_id"] or None
        if new_class_id != student.class_id:
            student.class_id = new_class_id
            touch_class_updated_at(new_class_id)

    student.last_updated_via = "inline"

    try:
        db.session.commit()
        return jsonify(student.to_dict())
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already in use"}), 409


@students_bp.delete("/<int:id>")
def delete_student(id: int):
    """Soft delete a student."""
    from backend.models import RosterStudent
    from datetime import datetime
    
    student = db.session.get(RosterStudent, id)
    if not student:
        return jsonify({"error": "Student not found"}), 404
    
    hard = request.args.get("hard", default=False, type=bool)
    
    if hard:
        # Permanent delete (admin only - consider adding permission check)
        db.session.delete(student)
    else:
        # Soft delete
        student.deleted_at = datetime.utcnow()
        student.last_updated_via = "manual"
    
    db.session.commit()
    return "", 204


@students_bp.patch("/<int:id>/restore")
def restore_student(id: int):
    """Restore a soft-deleted student."""
    from backend.models import RosterStudent
    
    student = db.session.get(RosterStudent, id)
    if not student:
        return jsonify({"error": "Student not found"}), 404
    
    if not student.deleted_at:
        return jsonify({"error": "Student is not deleted"}), 400
    
    student.deleted_at = None
    student.last_updated_via = "manual"
    db.session.commit()
    
    return jsonify(student.to_dict())


@students_bp.delete("/bulk")
def bulk_delete_students():
    """Bulk soft delete multiple students."""
    from backend.models import RosterStudent
    from datetime import datetime
    
    data = request.get_json(silent=True) or {}
    student_ids = data.get("student_ids", [])
    hard = data.get("hard", False)
    
    if not student_ids:
        return jsonify({"error": "student_ids array is required"}), 400
    
    deleted_count = 0
    for student_id in student_ids:
        student = db.session.get(RosterStudent, student_id)
        if student:
            if hard:
                db.session.delete(student)
            else:
                student.deleted_at = datetime.utcnow()
                student.last_updated_via = "manual"
            deleted_count += 1
    
    db.session.commit()
    return jsonify({"deleted": deleted_count})


@students_bp.get("/upload-history")
def get_upload_history():
    """Get list of all CSV uploads with pagination."""
    from backend.models import UploadHistory
    
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    from_date = request.args.get("from_date", default=None, type=str)
    to_date = request.args.get("to_date", default=None, type=str)
    
    query = UploadHistory.query
    
    # Date filtering (if needed later)
    # if from_date:
    #     query = query.filter(UploadHistory.uploaded_at >= from_date)
    # if to_date:
    #     query = query.filter(UploadHistory.uploaded_at <= to_date)
    
    pagination = query.order_by(UploadHistory.uploaded_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "uploads": [upload.to_dict() for upload in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "total_pages": pagination.pages,
        }
    })


@students_bp.get("/upload-history/<int:id>")
def get_upload_details(id: int):
    """Get detailed change log for a specific upload."""
    from backend.models import UploadHistory
    
    upload = db.session.get(UploadHistory, id)
    if not upload:
        return jsonify({"error": "Upload not found"}), 404
    
    return jsonify(upload.to_dict())


@students_bp.get("/template")
def download_template():
    csv_content = student_service.template_csv()
    buffer = BytesIO()
    buffer.write(csv_content.encode("utf-8"))
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype="text/csv",
        as_attachment=True,
        download_name="students_template.csv",
    )

