"""
Routes for class management.
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request, session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from backend.models import Class, Instructor, RosterStudent, User, db

classes_bp = Blueprint("classes", __name__, url_prefix="/api/classes")


@classes_bp.get("")
def list_classes():
    """List all classes where the current user is the owner or a co-instructor."""
    user_id = session.get("user_id")
    owned = Class.query.filter_by(instructor_id=user_id).all()
    co_class_ids = db.session.execute(
        db.select(Instructor.class_id).where(Instructor.user_id == user_id)
    ).scalars().all()
    co_classes = Class.query.filter(
        Class.id.in_(co_class_ids), Class.instructor_id != user_id
    ).all()
    all_classes = sorted(owned + co_classes, key=lambda c: c.created_at, reverse=True)
    return jsonify([c.to_dict() for c in all_classes])


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


@classes_bp.get("/<int:id>/instructors")
def list_class_instructors(id: int):
    """List co-instructors for a class."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404
    entries = Instructor.query.filter_by(class_id=id).all()
    return jsonify([e.to_dict() for e in entries])


@classes_bp.post("/<int:id>/instructors")
def add_class_instructor(id: int):
    """Add a co-instructor to a class by email. Only the class owner can do this."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404

    current_user_id = session.get("user_id")
    if c.instructor_id != current_user_id:
        return jsonify({"error": "Only the class owner can add co-instructors"}), 403

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "email is required"}), 400

    user = User.query.filter(func.lower(User.email) == email).first()
    if not user:
        return jsonify({"error": "No user with that email found. They must log in first."}), 404

    if user.id == c.instructor_id:
        return jsonify({"error": "That user is already the class owner"}), 400

    existing = Instructor.query.filter_by(user_id=user.id, class_id=id).first()
    if existing:
        return jsonify({"error": "That user is already a co-instructor for this class"}), 409

    if user.role != "instructor":
        user.role = "instructor"

    entry = Instructor(user_id=user.id, class_id=id, added_by=current_user_id)
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@classes_bp.delete("/<int:id>/instructors/<int:user_id>")
def remove_class_instructor(id: int, user_id: int):
    """Remove a co-instructor from a class. Only the class owner can do this."""
    c = db.session.get(Class, id)
    if not c:
        return jsonify({"error": "Class not found"}), 404

    current_user_id = session.get("user_id")
    if c.instructor_id != current_user_id:
        return jsonify({"error": "Only the class owner can remove co-instructors"}), 403

    entry = Instructor.query.filter_by(user_id=user_id, class_id=id).first()
    if not entry:
        return jsonify({"error": "Co-instructor not found for this class"}), 404

    db.session.delete(entry)
    db.session.commit()
    return "", 204
