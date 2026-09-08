"""Tests for roster student CRUD routes."""

from datetime import datetime

import pytest

from backend.models import Class, RosterStudent, db

BACKDATED = datetime(2020, 1, 1)


@pytest.fixture
def class_id(app):
    with app.app_context():
        klass = Class(class_name="Test Class", instructor_id=1)
        db.session.add(klass)
        db.session.commit()
        return klass.id


@pytest.fixture
def other_class_id(app):
    with app.app_context():
        klass = Class(class_name="Other Class", instructor_id=1)
        db.session.add(klass)
        db.session.commit()
        return klass.id


def _backdate_classes(app, *class_ids):
    """Age the classes so a later touch is detectable."""
    with app.app_context():
        for cid in class_ids:
            db.session.get(Class, cid).updated_at = BACKDATED
        db.session.commit()


def _updated_at(app, class_id):
    with app.app_context():
        return db.session.get(Class, class_id).updated_at


def _create_student(client, class_id, **overrides):
    payload = {
        "email": "removed@test.com",
        "first_name": "Removed",
        "last_name": "Student",
        "section": "A",
        "class_id": class_id,
    }
    payload.update(overrides)
    return client.post("/api/students", json=payload)


def test_create_student(client, class_id):
    """A brand new student is created."""

    response = _create_student(client, class_id)
    assert response.status_code == 201

    data = response.get_json()
    assert data["email"] == "removed@test.com"
    assert data["deleted_at"] is None


def test_create_duplicate_active_student_conflicts(client, class_id):
    """Adding a student who is already active in the class is still a conflict."""

    assert _create_student(client, class_id).status_code == 201

    response = _create_student(client, class_id)
    assert response.status_code == 409
    assert "already exists" in response.get_json()["error"]


def test_re_adding_removed_student_reactivates(client, app, class_id):
    """Re-adding a removed student reactivates their row instead of erroring."""

    student_id = _create_student(client, class_id).get_json()["id"]
    assert client.delete(f"/api/students/{student_id}").status_code == 204

    response = _create_student(client, class_id)
    assert response.status_code == 200

    data = response.get_json()
    assert data["id"] == student_id
    assert data["deleted_at"] is None

    with app.app_context():
        assert RosterStudent.query.filter_by(
            email="removed@test.com", class_id=class_id
        ).count() == 1


def test_re_adding_removed_student_updates_details(client, class_id):
    """Values supplied on re-add overwrite the removed student's stale details."""

    student_id = _create_student(client, class_id).get_json()["id"]
    client.delete(f"/api/students/{student_id}")

    response = _create_student(
        client, class_id, first_name="Renamed", section="B", notes="back again"
    )
    assert response.status_code == 200

    data = response.get_json()
    assert data["first_name"] == "Renamed"
    assert data["section"] == "B"
    assert data["notes"] == "back again"


def test_re_added_student_appears_in_class_roster(client, class_id):
    """A reactivated student shows up again in the class roster listing."""

    student_id = _create_student(client, class_id).get_json()["id"]
    client.delete(f"/api/students/{student_id}")

    assert client.get(f"/api/classes/{class_id}/students").get_json() == []

    _create_student(client, class_id)

    roster = client.get(f"/api/classes/{class_id}/students").get_json()
    assert [s["id"] for s in roster] == [student_id]


def test_class_remove_student_soft_deletes(client, app, class_id):
    """Removing via the class endpoint soft deletes rather than orphaning the row."""

    student_id = _create_student(client, class_id).get_json()["id"]

    response = client.delete(f"/api/classes/{class_id}/students/{student_id}")
    assert response.status_code == 204

    assert client.get(f"/api/classes/{class_id}/students").get_json() == []

    with app.app_context():
        student = db.session.get(RosterStudent, student_id)
        assert student.deleted_at is not None
        assert student.class_id == class_id


def test_class_remove_then_re_add_reactivates(client, app, class_id):
    """A student removed via the class endpoint can be added back without a duplicate."""

    student_id = _create_student(client, class_id).get_json()["id"]
    client.delete(f"/api/classes/{class_id}/students/{student_id}")

    response = _create_student(client, class_id)
    assert response.status_code == 200
    assert response.get_json()["id"] == student_id

    with app.app_context():
        assert RosterStudent.query.filter_by(email="removed@test.com").count() == 1


def test_class_remove_then_assign_reactivates(client, class_id):
    """Assigning a removed student back to the class restores their record."""

    student_id = _create_student(client, class_id).get_json()["id"]
    client.delete(f"/api/classes/{class_id}/students/{student_id}")

    response = client.post(f"/api/classes/{class_id}/students/{student_id}")
    assert response.status_code == 200
    assert response.get_json()["deleted_at"] is None

    roster = client.get(f"/api/classes/{class_id}/students").get_json()
    assert [s["id"] for s in roster] == [student_id]


def test_class_remove_student_twice_is_not_found(client, class_id):
    """Removing a student who is not in the class returns 404."""

    student_id = _create_student(client, class_id).get_json()["id"]
    assert client.delete(f"/api/classes/{class_id}/students/{student_id}").status_code == 204

    response = client.delete(f"/api/classes/{class_id}/students/{student_id}")
    assert response.status_code == 404


def test_delete_student_bumps_class_updated_at(client, app, class_id):
    """Removing a student marks the class as recently changed."""

    student_id = _create_student(client, class_id).get_json()["id"]
    _backdate_classes(app, class_id)

    client.delete(f"/api/students/{student_id}")

    assert _updated_at(app, class_id) > BACKDATED


def test_hard_delete_student_bumps_class_updated_at(client, app, class_id):
    """A permanent delete bumps the class even though the row is gone."""

    student_id = _create_student(client, class_id).get_json()["id"]
    _backdate_classes(app, class_id)

    assert client.delete(f"/api/students/{student_id}?hard=true").status_code == 204

    assert _updated_at(app, class_id) > BACKDATED
    with app.app_context():
        assert db.session.get(RosterStudent, student_id) is None


def test_restore_student_bumps_class_updated_at(client, app, class_id):
    """Restoring a student marks the class as recently changed."""

    student_id = _create_student(client, class_id).get_json()["id"]
    client.delete(f"/api/students/{student_id}")
    _backdate_classes(app, class_id)

    assert client.patch(f"/api/students/{student_id}/restore").status_code == 200

    assert _updated_at(app, class_id) > BACKDATED


def test_bulk_delete_bumps_class_updated_at(client, app, class_id, other_class_id):
    """A bulk delete bumps every class it touched."""

    first = _create_student(client, class_id).get_json()["id"]
    second = _create_student(
        client, other_class_id, email="second@test.com"
    ).get_json()["id"]
    _backdate_classes(app, class_id, other_class_id)

    response = client.delete(
        "/api/students/bulk", json={"student_ids": [first, second]}
    )
    assert response.status_code == 200

    assert _updated_at(app, class_id) > BACKDATED
    assert _updated_at(app, other_class_id) > BACKDATED


def test_moving_student_bumps_both_classes(client, app, class_id, other_class_id):
    """Reassigning a student marks both the old and new class as changed."""

    student_id = _create_student(client, class_id).get_json()["id"]
    _backdate_classes(app, class_id, other_class_id)

    response = client.patch(
        f"/api/students/{student_id}", json={"class_id": other_class_id}
    )
    assert response.status_code == 200

    assert _updated_at(app, class_id) > BACKDATED
    assert _updated_at(app, other_class_id) > BACKDATED
