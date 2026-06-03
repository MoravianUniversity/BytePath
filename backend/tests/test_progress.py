def test_get_user_progress(client, student1_id):
    """Fetch overall progress for a user."""

    response = client.get(f"/api/progress/{student1_id}")
    assert response.status_code == 200

    data = response.get_json()
    assert "progress" in data
    assert isinstance(data["progress"], list)


def test_get_topic_progress(client, student1_id):
    """Fetch per-topic progress entry."""

    response = client.get(f"/api/progress/{student1_id}/test-topic-1")
    assert response.status_code == 200

    data = response.get_json()
    assert data["topic"] == "test-topic-1"


def test_update_progress(client, student1_id):
    """Updating progress should return the updated record."""

    response = client.put(
        f"/api/progress/{student1_id}/test-topic-1",
        json={"subtopics_completed": 5, "total_subtopics": 7},
    )
    assert response.status_code == 200

    data = response.get_json()
    assert data["progress"]["subtopics_completed"] == 5
    assert data["progress"]["max_subtopics_completed"] == 5
    assert data["progress"]["best_completion_percentage"] == round(5 / 7 * 100, 2)


def test_max_subtopics_completed_monotonic(client, student1_id):
    """max_subtopics_completed keeps the peak even when current progress drops."""

    client.put(
        f"/api/progress/{student1_id}/test-topic-1",
        json={"subtopics_completed": 6, "total_subtopics": 10},
    )
    response = client.put(
        f"/api/progress/{student1_id}/test-topic-1",
        json={"subtopics_completed": 2, "total_subtopics": 10},
    )
    assert response.status_code == 200

    progress = response.get_json()["progress"]
    assert progress["subtopics_completed"] == 2
    assert progress["max_subtopics_completed"] == 6
    assert progress["completion_percentage"] == 20.0
    assert progress["best_completion_percentage"] == 60.0


def test_create_new_progress(client, student1_id):
    """Creating progress for a new topic should succeed."""

    response = client.put(
        f"/api/progress/{student1_id}/test-topic-2",
        json={"subtopics_completed": 1, "total_subtopics": 5},
    )
    assert response.status_code == 200


def test_update_progress_invalid_data(client, student1_id):
    """Invalid payloads are rejected."""

    response = client.put(
        f"/api/progress/{student1_id}/test-topic-1",
        json={"subtopics_completed": -1, "total_subtopics": 0},
    )
    assert response.status_code == 400


def test_increment_questions_answered(client, student1_id):
    """Increment endpoint should create or update progress."""

    response = client.post(f"/api/progress/{student1_id}/new-topic/increment")
    assert response.status_code == 200
    assert response.get_json()["questions_answered"] == 1

    # Increment again and ensure it increments.
    response = client.post(f"/api/progress/{student1_id}/new-topic/increment")
    assert response.status_code == 200
    assert response.get_json()["questions_answered"] == 2


def test_progress_unknown_user(client):
    """Requests for unknown users return 404."""

    response = client.get("/api/progress/9999")
    assert response.status_code == 404
