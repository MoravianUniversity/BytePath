def test_get_student_report(client, student1_id):
    response = client.get(f"/api/reports/student/{student1_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["student_id"] == student1_id
    assert "overall_stats" in data
    assert "topic_breakdown" in data


def test_get_student_report_not_found(client):
    response = client.get("/api/reports/student/99999")
    assert response.status_code == 404


def test_get_topic_report(client):
    response = client.get("/api/reports/topic/test-topic-1")
    assert response.status_code == 200
    data = response.get_json()
    assert data["topic"] == "test-topic-1"
    assert "overall_stats" in data
    assert "subtopic_difficulty" in data
    assert "student_status" in data
    assert set(data["student_status"].keys()) == {"not_started", "in_progress", "completed"}


def test_get_topic_report_not_found(client):
    response = client.get("/api/reports/topic/unknown-topic")
    assert response.status_code == 404


def test_get_class_overview(client):
    response = client.get("/api/reports/class/overview")
    assert response.status_code == 200
    data = response.get_json()
    assert "total_students" in data
    assert "class_avg_accuracy" in data
    assert "topics_overview" in data


def test_get_class_results(client):
    response = client.get("/api/reports/class/results")
    assert response.status_code == 200
    data = response.get_json()
    assert "students" in data
    assert "sections" in data
    assert "topic_settings" in data
    assert "progress" in data
    assert "activity_bounds" in data
    assert "responses" in data
    assert isinstance(data["students"], list)
    assert isinstance(data["responses"], list)


def test_get_question_analytics(client):
    response = client.get("/api/reports/question/test-topic-1/analytics")
    assert response.status_code == 200
    data = response.get_json()
    assert data["topic"] == "test-topic-1"
    assert "analytics" in data
    assert isinstance(data["analytics"], list)

