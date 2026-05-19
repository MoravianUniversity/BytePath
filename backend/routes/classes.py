"""
Routes for class management.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request, session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from backend.models import Class, RosterStudent, db

classes_bp = Blueprint("classes", __name__, url_prefix="/api/classes")


@classes_bp.get("")
def list_classes():
    """List all classes for the current instructor."""
    instructor_id = session.get("user_id")
    classes = Class.query.filter_by(instructor_id=instructor_id).order_by(Class.created_at.desc()).all()
    return jsonify([c.to_dict() for c in classes])


@classes_bp.post("")
def create_class():
    """Create a new class."""
    data = request.get_json(silent=True) or {}
    class_name = (data.get("class_name") or "").strip()

    if not class_name:
        return jsonify({"error": "class_name is required"}), 400

    instructor_id = session.get("user_id")

    new_class = Class(class_name=class_name, instructor_id=instructor_id)
    db.session.add(new_class)
    db.session.commit()
    return jsonify(new_class.to_dict()), 201


@classes_bp.get("/my")
def get_my_classes():
    """Return classes the current user is enrolled in (by email match in roster)."""
    from backend.models import RosterStudent, User
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    roster_entries = RosterStudent.query.filter(
        func.lower(RosterStudent.email) == func.lower(user.email),
        RosterStudent.deleted_at.is_(None),
    ).all()
    class_ids = {r.class_id for r in roster_entries if r.class_id is not None}
    classes = Class.query.filter(Class.id.in_(class_ids)).all()
    return jsonify([c.to_dict() for c in classes])


@classes_bp.get("/<int:id>")
def get_class(id: int):
    """Get a single class by ID."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404
    return jsonify(c.to_dict())


@classes_bp.patch("/<int:id>")
def update_class(id: int):
    """Rename a class."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404

    data = request.get_json(silent=True) or {}
    if "class_name" in data:
        class_name = data["class_name"].strip()
        if not class_name:
            return jsonify({"error": "class_name cannot be empty"}), 400
        c.class_name = class_name

    db.session.commit()
    return jsonify(c.to_dict())


@classes_bp.delete("/<int:id>")
def delete_class(id: int):
    """Delete a class."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404

    db.session.delete(c)
    db.session.commit()
    return "", 204


@classes_bp.get("/<int:id>/students")
def list_class_students(id: int):
    """List all active students in a class."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404

    students = RosterStudent.query.filter_by(class_id=id, deleted_at=None).all()
    return jsonify([s.to_dict() for s in students])


@classes_bp.post("/<int:id>/students/<int:student_id>")
def assign_student(id: int, student_id: int):
    """Assign a roster student to this class."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404

    student = db.session.get(RosterStudent, student_id)
    if not student or student.deleted_at:
        return jsonify({"error": "Student not found"}), 404

    student.class_id = id
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Student is already in this class"}), 409

    return jsonify(student.to_dict())


@classes_bp.delete("/<int:id>/students/<int:student_id>")
def remove_student(id: int, student_id: int):
    """Remove a student from this class (clears their class assignment)."""
    student = RosterStudent.query.filter_by(id=student_id, class_id=id, deleted_at=None).first()
    if not student:
        return jsonify({"error": "Student not found in this class"}), 404

    student.class_id = None
    db.session.commit()
    return "", 204
