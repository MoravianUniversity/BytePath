def test_login_new_user(client):
    """Creating a new user via login should auto-register them."""

    response = client.post("/api/auth/login", json={"email": "newuser@test.com"})
    assert response.status_code == 200

    data = response.get_json()
    assert "user" in data
    assert data["user"]["email"] == "newuser@test.com"
    assert data["user"]["role"] == "student"


def test_login_existing_user(client):
    """Logging in with an existing student returns their profile."""

    response = client.post("/api/auth/login", json={"email": "student1@test.com"})
    assert response.status_code == 200

    data = response.get_json()
    assert data["user"]["name"] == "Test Student1"  # Expected format from test data
    assert data["user"]["role"] == "student"


def test_login_missing_email(client):
    """Requests without an email are rejected."""

    response = client.post("/api/auth/login", json={})
    assert response.status_code == 400


def test_login_existing_instructor(client):
    """Existing instructor accounts keep their role on login."""

    response = client.post("/api/auth/login", json={"email": "instructor@test.com"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["user"]["role"] == "instructor"


def test_get_profile_requires_session(client):
    """Fetching profile without login returns 401."""

    response = client.get("/api/auth/profile")
    assert response.status_code == 401


def test_get_profile_after_login(client):
    """After logging in, profile endpoint returns the user."""

    client.post("/api/auth/login", json={"email": "student1@test.com"})
    response = client.get("/api/auth/profile")
    assert response.status_code == 200

    data = response.get_json()
    assert data["email"] == "student1@test.com"
