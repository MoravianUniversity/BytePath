import sys
import types

import pytest

# Provide a lightweight stub for flask_cors if it's not installed in the test environment.
try:
    import flask_cors  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    flask_cors = types.ModuleType("flask_cors")
    flask_cors.CORS = lambda *args, **kwargs: None
    sys.modules["flask_cors"] = flask_cors

# Provide a lightweight stub for flask_sqlalchemy if it's not installed in the test environment.
try:
    import flask_sqlalchemy  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    flask_sqlalchemy = types.ModuleType("flask_sqlalchemy")

    class _DummyColumn:
        def __init__(self, *args, **kwargs):
            pass

    class _DummyRelation:
        def __call__(self, *args, **kwargs):
            return None

    class _DummyConstraint:
        def __init__(self, *args, **kwargs):
            pass

    class SQLAlchemy:
        def __init__(self, *args, **kwargs):
            self.Model = object
            self.Column = _DummyColumn
            self.Integer = int
            self.String = str
            self.Boolean = bool
            self.DateTime = str
            self.Text = str
            self.ForeignKey = lambda *a, **kw: None
            self.relationship = _DummyRelation()
            self.UniqueConstraint = _DummyConstraint
            self.session = types.SimpleNamespace(commit=lambda: None, flush=lambda: None, remove=lambda: None)

        def init_app(self, app):
            return None

        def create_all(self):
            return None

    flask_sqlalchemy.SQLAlchemy = SQLAlchemy
    sys.modules["flask_sqlalchemy"] = flask_sqlalchemy

# Provide a lightweight stub for sqlalchemy if it's not installed.
try:
    import sqlalchemy  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    sqlalchemy = types.ModuleType("sqlalchemy")
    sqlalchemy.func = types.SimpleNamespace(lower=lambda x: x)

    def _noop(*args, **kwargs):
        return None

    sqlalchemy.and_ = _noop
    sqlalchemy.desc = _noop
    sqlalchemy.case = _noop
    sqlalchemy.or_ = _noop
    exc_module = types.ModuleType("sqlalchemy.exc")
    exc_module.SQLAlchemyError = Exception
    sqlalchemy.exc = exc_module
    sys.modules["sqlalchemy"] = sqlalchemy
    sys.modules["sqlalchemy.exc"] = exc_module

from backend.app import create_app


@pytest.fixture
def app():
    """Create a Flask application instance for testing."""

    app = create_app("testing")
    app.config["TESTING"] = True
    app.config["SERVER_NAME"] = "localhost"

    _install_fake_user_repository(app)
    _install_fake_auth_service(app)
    _install_fake_topic_repository(app)
    _install_fake_report_service(app)
    _install_fake_progress_service(app)
    _install_fake_response_service(app)
    _install_fake_topic_service(app)
    yield app


@pytest.fixture
def client(app):
    """Return a Flask test client."""

    return app.test_client()


@pytest.fixture
def runner(app):
    """Return a Flask CLI runner."""

    return app.test_cli_runner()


@pytest.fixture
def instructor_id(app):
    return app.config["USER_REPOSITORY"].get_by_email("instructor@test.com").id


@pytest.fixture
def student1_id(app):
    return app.config["USER_REPOSITORY"].get_by_email("student1@test.com").id


@pytest.fixture
def student2_id(app):
    return app.config["USER_REPOSITORY"].get_by_email("student2@test.com").id


def _install_fake_auth_service(app):
    """Install a fake auth service to decouple auth tests from the database backend."""

    user_repo = app.config["USER_REPOSITORY"]

    class FakeAuthService:
        INSTRUCTOR_EMAILS = {"instructor@test.com", "bush@moravian.edu", "prof@test.com"}

        def login_or_create_user(self, email: str):
            user = user_repo.get_by_email(email)
            desired_role = "instructor" if email.lower() in self.INSTRUCTOR_EMAILS else "student"
            if user:
                if desired_role == "instructor" and user.role != "instructor":
                    user.role = "instructor"
                return user
            name = email.split("@")[0].replace(".", " ").title()
            return user_repo.create_user(email=email, name=name, role=desired_role)

        def get_user_by_id(self, user_id: int):
            return user_repo.get_by_id(user_id)

        def get_user_by_email(self, email: str):
            return user_repo.get_by_email(email)

    app.config["AUTH_SERVICE"] = FakeAuthService()


def _install_fake_user_repository(app):
    """Install a fake user repository used by multiple fakes."""

    class FakeUser:
        def __init__(self, user_id: int, email: str, name: str, role: str):
            self.id = user_id
            self.email = email
            self.name = name
            self.role = role

    class FakeUserRepository:
        def __init__(self):
            self._next_id = 4
            self.users: dict[int, FakeUser] = {
                1: FakeUser(1, "instructor@test.com", "Test Instructor", "instructor"),
                2: FakeUser(2, "student1@test.com", "Test Student1", "student"),
                3: FakeUser(3, "student2@test.com", "Test Student2", "student"),
            }
            self.email_index = {u.email.lower(): u_id for u_id, u in self.users.items()}

        def get_by_id(self, user_id: int):
            return self.users.get(user_id)

        def get_by_email(self, email: str):
            return self.users.get(self.email_index.get(email.lower()))

        def create_user(self, email: str, name: str, role: str = "student"):
            user = FakeUser(self._next_id, email, name, role)
            self.users[self._next_id] = user
            self.email_index[email.lower()] = self._next_id
            self._next_id += 1
            return user

    app.config["USER_REPOSITORY"] = FakeUserRepository()


def _install_fake_report_service(app):
    """Install a lightweight, in-memory report service so report tests don't rely on the database backend."""

    auth_service = app.config["AUTH_SERVICE"]
    student1 = auth_service.get_user_by_email("student1@test.com")
    student2 = auth_service.get_user_by_email("student2@test.com")

    class FakeReportService:
        def __init__(self, s1_id: int, s2_id: int):
            self.s1_id = s1_id
            self.s2_id = s2_id
            self.topic_id = "test-topic-1"

        def get_student_report(self, student_id: int, class_id=None, section=None):
            if student_id not in {self.s1_id, self.s2_id}:
                return None
            return {
                "student_id": student_id,
                "student_name": "Fake Student",
                "student_email": "fake@student.com",
                "overall_stats": {
                    "total_questions_answered": 5,
                    "total_correct": 4,
                    "total_incorrect": 1,
                    "total_skipped": 0,
                    "overall_accuracy": 80.0,
                    "avg_time_per_question": 12.5,
                },
                "topic_breakdown": [
                    {
                        "topic": self.topic_id,
                        "topic_name": "Test Topic 1",
                        "questions_answered": 5,
                        "correct": 4,
                        "incorrect": 1,
                        "skipped": 0,
                        "accuracy": 80.0,
                        "avg_time": 12.5,
                        "completion_percentage": 50.0,
                    }
                ],
                "struggling_subtopics": [],
                "performance_over_time": [],
            }

        def get_topic_report(self, topic_id: str, class_id=None, section=None):
            if topic_id != self.topic_id:
                return None
            return {
                "topic": topic_id,
                "topic_name": "Test Topic 1",
                "overall_stats": {
                    "total_students": 2,
                    "students_started": 2,
                    "students_completed": 0,
                    "total_attempts": 5,
                    "avg_accuracy": 80.0,
                    "avg_time_per_question": 12.5,
                },
                "subtopic_difficulty": [],
                "most_missed_questions": [],
            }

        def get_class_overview(self, class_id=None, section=None):
            return {
                "total_students": 2,
                "active_students_last_week": 2,
                "total_questions_answered": 5,
                "class_avg_accuracy": 80.0,
                "topics_overview": [
                    {
                        "topic": self.topic_id,
                        "topic_name": "Test Topic 1",
                        "students_started": 2,
                        "students_completed": 0,
                        "completion_rate": 0,
                        "avg_accuracy": 80.0,
                        "avg_time_per_question": 12.5,
                    }
                ],
                "rostered_students": [
                    {
                        "student_id": self.s1_id,
                        "student_name": "Fake Student 1",
                        "student_email": "student1@test.com",
                    },
                    {
                        "student_id": self.s2_id,
                        "student_name": "Fake Student 2",
                        "student_email": "student2@test.com",
                    },
                ],
                "sections": ["", "A", "B"],
                "top_performers": [],
                "struggling_students": [],
                "recent_activity": [],
            }

        def get_question_analytics(self, topic_id: str, subtopic_type=None, class_id=None, section=None):
            if topic_id != self.topic_id:
                return {"topic": topic_id, "analytics": []}
            return {
                "topic": topic_id,
                "analytics": [
                    {
                        "question_code": "Q1",
                        "subtopic_type": "sub",
                        "times_shown": 5,
                        "correct_count": 4,
                        "incorrect_count": 1,
                        "skipped_count": 0,
                        "success_rate": 80.0,
                        "avg_time_spent": 12.5,
                        "students_who_saw": 2,
                    }
                ],
            }

    app.config["REPORT_SERVICE"] = FakeReportService(student1.id, student2.id)


def _install_fake_progress_service(app):
    """Install a fake progress service to decouple progress tests from the database backend."""

    auth_service = app.config["AUTH_SERVICE"]
    student1 = auth_service.get_user_by_email("student1@test.com")

    class FakeProgress:
        def __init__(self, user_id: int, topic: str, subtopics_completed: int, total_subtopics: int, questions_answered: int = 0):
            self.user_id = user_id
            self.topic = topic
            self.subtopics_completed = subtopics_completed
            self.total_subtopics = total_subtopics
            self.questions_answered = questions_answered
            self.last_accessed = None

    class FakeProgressService:
        def __init__(self, s1_id: int):
            self.s1_id = s1_id
            self.topic_id = "test-topic-1"
            self.records = {
                (s1_id, self.topic_id): FakeProgress(s1_id, self.topic_id, 3, 7, 10)
            }

        def get_user_progress(self, user_id: int):
            return [record for (uid, _), record in self.records.items() if uid == user_id]

        def get_topic_progress(self, user_id: int, topic_id: str):
            return self.records.get((user_id, topic_id))

        def update_or_create_progress(self, user_id: int, topic_id: str, data):
            key = (user_id, topic_id)
            if key in self.records:
                record = self.records[key]
                record.subtopics_completed = data["subtopics_completed"]
                record.total_subtopics = data["total_subtopics"]
                created = False
            else:
                record = FakeProgress(
                    user_id,
                    topic_id,
                    data["subtopics_completed"],
                    data["total_subtopics"],
                    0,
                )
                self.records[key] = record
                created = True
            return record, created

        def increment_questions_answered(self, user_id: int, topic_id: str, timestamp=None):
            key = (user_id, topic_id)
            if key not in self.records:
                self.records[key] = FakeProgress(user_id, topic_id, 0, 0, 0)
            record = self.records[key]
            record.questions_answered = (record.questions_answered or 0) + 1
            return record

    app.config["PROGRESS_SERVICE"] = FakeProgressService(student1.id)


def _install_fake_response_service(app):
    """Install a fake response service to decouple response tests from the database backend."""

    auth_service = app.config["AUTH_SERVICE"]
    student1 = auth_service.get_user_by_email("student1@test.com")

    class FakeResponse:
        def __init__(self, data):
            self.user_id = data["user_id"]
            self.topic = data["topic"]
            self.subtopic_type = data["subtopic_type"]
            self.question_code = data["question_code"]
            self.student_answer = data.get("student_answer")
            self.correct_answer = data["correct_answer"]
            self.is_correct = bool(data["is_correct"])
            self.status = data["status"]
            self.time_spent = data.get("time_spent")

        def to_dict(self):
            return {
                "user_id": self.user_id,
                "topic": self.topic,
                "subtopic_type": self.subtopic_type,
                "question_code": self.question_code,
                "student_answer": self.student_answer,
                "correct_answer": self.correct_answer,
                "is_correct": self.is_correct,
                "status": self.status,
                "time_spent": self.time_spent,
            }

    class FakeResponseService:
        REQUIRED_FIELDS = {
            "user_id",
            "topic",
            "subtopic_type",
            "question_code",
            "correct_answer",
            "is_correct",
            "status",
        }

        def __init__(self, s1_id: int):
            self.s1_id = s1_id
            self.responses = {
                s1_id: [
                    FakeResponse(
                        {
                            "user_id": s1_id,
                            "topic": "test-topic-1",
                            "subtopic_type": "TestSubtopic",
                            "question_code": "seed",
                            "student_answer": "seed",
                            "correct_answer": "seed",
                            "is_correct": True,
                            "status": "correct",
                            "time_spent": 10,
                        }
                    )
                ]
            }

        def create_response(self, data):
            resp = FakeResponse(data)
            self.responses.setdefault(data["user_id"], []).append(resp)
            return resp

        def get_student_responses(self, user_id: int):
            return self.responses.get(user_id, [])

        def get_student_responses_for_topic(self, user_id: int, topic_id: str):
            return [r for r in self.responses.get(user_id, []) if r.topic == topic_id]

        @classmethod
        def validate_payload(cls, data):
            missing = cls.REQUIRED_FIELDS.difference(data.keys() if data else [])
            if missing:
                return False, f"Missing required fields: {', '.join(sorted(missing))}"
            if data["status"] not in {"correct", "incorrect", "skipped"}:
                return False, "Invalid status value"
            return True, ""

    app.config["RESPONSE_SERVICE"] = FakeResponseService(student1.id)


def _install_fake_topic_service(app):
    """Install a fake topic service to decouple topic tests from the database backend."""

    class FakeTopic:
        def __init__(self, topic_id: str, name: str, is_visible: bool = True, order_index: int | None = None):
            self.id = topic_id
            self.name = name
            self.is_visible = is_visible
            self.order_index = order_index
            self.created_at = None

    class FakeTopicService:
        def __init__(self):
            self.topics: dict[str, FakeTopic] = {
                "test-topic-1": FakeTopic("test-topic-1", "Test Topic 1", True, 1),
                "test-topic-2": FakeTopic("test-topic-2", "Test Topic 2", False, 2),
            }

        def list_topics(self, role: str = "student"):
            if role.lower() == "instructor":
                return list(self.topics.values())
            return [t for t in self.topics.values() if t.is_visible]

        def get_topic(self, topic_id: str):
            return self.topics.get(topic_id)

        def set_visibility(self, topic_id: str, *, is_visible: bool):
            topic = self.topics.get(topic_id)
            if not topic:
                return None
            topic.is_visible = is_visible
            return topic

        def create_topic(self, topic_id: str, name: str, *, is_visible: bool = True, order_index=None):
            topic = FakeTopic(topic_id, name, is_visible, order_index)
            self.topics[topic_id] = topic
            return topic

        def update_topic(self, topic_id: str, **fields):
            topic = self.topics.get(topic_id)
            if not topic:
                return None
            for key, value in fields.items():
                if hasattr(topic, key):
                    setattr(topic, key, value)
            return topic

    app.config["TOPIC_SERVICE"] = FakeTopicService()


def _install_fake_topic_repository(app):
    """Install a fake topic repository used by routes that check topic existence."""

    class FakeTopic:
        def __init__(self, topic_id: str, name: str, is_visible: bool = True, order_index=None):
            self.id = topic_id
            self.name = name
            self.is_visible = is_visible
            self.order_index = order_index
            self.created_at = None

    class FakeTopicRepository:
        def __init__(self):
            self.topics: dict[str, FakeTopic] = {
                "test-topic-1": FakeTopic("test-topic-1", "Test Topic 1", True, 1),
                "test-topic-2": FakeTopic("test-topic-2", "Test Topic 2", False, 2),
            }

        def get_by_id(self, topic_id: str):
            return self.topics.get(topic_id)

        def create_topic(self, topic_id: str, name: str, is_visible: bool = True, order_index=None):
            topic = FakeTopic(topic_id, name, is_visible, order_index)
            self.topics[topic_id] = topic
            return topic

        def update_topic(self, topic, **fields):
            for key, value in fields.items():
                if hasattr(topic, key):
                    setattr(topic, key, value)
            return topic

        def get_visible(self):
            return [t for t in self.topics.values() if t.is_visible]

        def get_all(self):
            return list(self.topics.values())

    app.config["TOPIC_REPOSITORY"] = FakeTopicRepository()
