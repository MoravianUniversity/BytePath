def test_complete_student_workflow(client):
    """End-to-end workflow covering login, responses, and progress."""

    login_response = client.post(
        "/api/auth/login",
        json={"email": "integration@test.com"},
    )
    assert login_response.status_code == 200
    user_id = login_response.get_json()["user"]["id"]

    submit_payload = {
        "user_id": user_id,
        "topic": "test-topic-1",
        "subtopic_type": "IntegrationTest",
        "question_code": "x = 42\nx",
        "student_answer": "42",
        "correct_answer": "42",
        "is_correct": True,
        "status": "correct",
        "time_spent": 30,
        "class_id": 1,
    }
    submit_response = client.post("/api/responses", json=submit_payload)
    assert submit_response.status_code in (200, 201)

    progress_update = client.put(
        f"/api/progress/{user_id}/test-topic-1",
        json={
            "subtopics_completed": 1,
            "total_subtopics": 5,
            "class_id": 1,
        },
    )
    assert progress_update.status_code == 200

    responses_check = client.get(f"/api/responses/student/{user_id}")
    assert responses_check.status_code == 200
    assert len(responses_check.get_json()["responses"]) >= 1

    progress_check = client.get(f"/api/progress/{user_id}?class_id=1")
    assert progress_check.status_code == 200
    assert len(progress_check.get_json()["progress"]) >= 1


def test_instructor_view_student_data(client, student1_id):
    """Instructor-level views for student data."""

    responses = client.get(f"/api/responses/student/{student1_id}")
    assert responses.status_code == 200

    progress = client.get(f"/api/progress/{student1_id}?class_id=1")
    assert progress.status_code == 200

    topics = client.get("/api/topics?role=instructor")
    assert topics.status_code == 200

