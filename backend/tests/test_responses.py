def test_submit_response(client, student1_id):
    """Submitting a valid response persists it."""

    payload = {
        "user_id": student1_id,
        "topic": "test-topic-1",
        "subtopic_type": "TestSubtopic",
        "question_code": "x = 10\nx",
        "student_answer": "10",
        "correct_answer": "10",
        "is_correct": True,
        "status": "correct",
        "time_spent": 45,
        "class_id": 1,
    }

    response = client.post("/api/responses", json=payload)
    assert response.status_code == 201

    data = response.get_json()
    assert data["response"]["topic"] == "test-topic-1"
    assert data["response"]["is_correct"] is True


def test_submit_response_missing_fields(client, student1_id):
    """Missing required fields should raise validation errors."""

    response = client.post(
        "/api/responses",
        json={
            "user_id": student1_id,
            "topic": "test-topic-1",
        },
    )
    assert response.status_code == 400


def test_get_student_responses(client, student1_id):
    """Students can fetch their recorded responses."""

    response = client.get(f"/api/responses/student/{student1_id}")
    assert response.status_code == 200

    data = response.get_json()
    assert "responses" in data
    assert isinstance(data["responses"], list)


def test_get_nonexistent_student_responses(client):
    """Requests for unknown students return an empty list."""

    response = client.get("/api/responses/student/9999")
    assert response.status_code == 200

    data = response.get_json()
    assert data["responses"] == []


def test_submit_response_invalid_status(client, student1_id):
    """Invalid status values should be rejected."""

    payload = {
        "user_id": student1_id,
        "topic": "test-topic-1",
        "subtopic_type": "TestSubtopic",
        "question_code": "x = 10\nx",
        "student_answer": "10",
        "correct_answer": "10",
        "is_correct": True,
        "status": "maybe",
        "time_spent": 45,
        "class_id": 1,
    }

    response = client.post("/api/responses", json=payload)
    assert response.status_code == 400


def test_submit_response_unknown_user(client):
    """Submitting for an unknown user should fail."""

    payload = {
        "user_id": 9999,
        "topic": "test-topic-1",
        "subtopic_type": "TestSubtopic",
        "question_code": "x = 10\nx",
        "student_answer": "10",
        "correct_answer": "10",
        "is_correct": True,
        "status": "correct",
        "time_spent": 45,
        "class_id": 1,
    }

    response = client.post("/api/responses", json=payload)
    assert response.status_code == 404
