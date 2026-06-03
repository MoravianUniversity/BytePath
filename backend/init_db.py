from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import func

from backend.app import create_app
from backend.models import StudentProgress, StudentResponse, Topic, User, db
from backend.topic_definitions import DEFAULT_TOPICS, TOPIC_DEFINITIONS, TOPIC_META_BY_ID


def _utc_now() -> datetime:
    """Return a naive datetime representing the current UTC time."""

    return datetime.now(timezone.utc).replace(tzinfo=None)


def initialise_database(seed: bool = False, realistic: bool = False) -> None:
    """Create the database schema and optionally insert seed data."""

    app = create_app()

    with app.app_context():
        db.create_all()

        if seed:
            _seed_topics()
            _seed_users()

        if realistic:
            seed_realistic_dataset()

        db.session.commit()
        print("Database initialised successfully.")


def _seed_topics() -> None:
    """Insert default topics if they do not already exist."""

    for topic_id, name, is_visible, order_index in DEFAULT_TOPICS:
        topic = db.session.get(Topic, topic_id)
        if not topic:
            db.session.add(
                Topic(
                    id=topic_id,
                    name=name,
                    is_visible=is_visible,
                    order_index=order_index,
                )
            )
        else:
            topic.name = name
            if topic.order_index is None:
                topic.order_index = order_index


def _seed_users() -> None:
    """Insert default users if they do not already exist."""

    for email, name, role in DEFAULT_USERS:
        if not db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none():
            db.session.add(User(email=email, name=name, role=role))


def seed_realistic_dataset() -> None:
    """Populate the database with a realistic set of users, responses, and progress."""

    existing_responses = db.session.execute(
        db.select(func.count(StudentResponse.id))
    ).scalar_one()

    if existing_responses and existing_responses >= 500:
        print("Realistic dataset detected (>=500 responses); skipping population.")
        return

    random.seed(42)

    _seed_topics()
    _seed_users()

    instructor = db.session.execute(
        db.select(User).filter_by(email="bush@moravian.edu")
    ).scalar_one_or_none()
    if not instructor:
        instructor = User(email="bush@moravian.edu", name="Dr. Bush", role="instructor")
        db.session.add(instructor)
        db.session.flush()

    student_profiles = [
        ("mia.hughes@bytepath.dev", "Mia Hughes", "strong"),
        ("liam.patel@bytepath.dev", "Liam Patel", "strong"),
        ("noah.smith@bytepath.dev", "Noah Smith", "strong"),
        ("emma.jones@bytepath.dev", "Emma Jones", "strong"),
        ("olivia.brown@bytepath.dev", "Olivia Brown", "average"),
        ("ava.davis@bytepath.dev", "Ava Davis", "average"),
        ("isabella.martinez@bytepath.dev", "Isabella Martinez", "average"),
        ("sophia.garcia@bytepath.dev", "Sophia Garcia", "average"),
        ("jackson.lee@bytepath.dev", "Jackson Lee", "average"),
        ("logan.moore@bytepath.dev", "Logan Moore", "average"),
        ("harper.clark@bytepath.dev", "Harper Clark", "struggling"),
        ("elijah.thomas@bytepath.dev", "Elijah Thomas", "struggling"),
        ("amelia.white@bytepath.dev", "Amelia White", "struggling"),
        ("lucas.harris@bytepath.dev", "Lucas Harris", "struggling"),
        ("zoe.king@bytepath.dev", "Zoe King", "inactive"),
        ("aiden.scott@bytepath.dev", "Aiden Scott", "inactive"),
    ]

    archetype_config = {
        "strong": {
            "accuracy": (0.82, 0.95),
            "questions": (70, 90),
            "avg_time": 48,
            "time_sd": 12,
            "skip_rate": 0.02,
        },
        "average": {
            "accuracy": (0.68, 0.8),
            "questions": (55, 75),
            "avg_time": 55,
            "time_sd": 15,
            "skip_rate": 0.04,
        },
        "struggling": {
            "accuracy": (0.42, 0.65),
            "questions": (40, 60),
            "avg_time": 65,
            "time_sd": 18,
            "skip_rate": 0.07,
        },
        "inactive": {
            "accuracy": (0.45, 0.7),
            "questions": (5, 12),
            "avg_time": 70,
            "time_sd": 20,
            "skip_rate": 0.1,
        },
    }

    students = []
    for email, name, archetype in student_profiles:
        user = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
        if not user:
            user = User(email=email, name=name, role="student")
            db.session.add(user)
            db.session.flush()
        students.append({"user": user, "archetype": archetype})

    db.session.flush()

    start_datetime = _utc_now() - timedelta(days=45)

    progress_summary: dict[tuple[int, str], dict[str, object]] = {}
    responses_created = 0

    topic_ids = [topic["id"] for topic in TOPIC_DEFINITIONS]

    for student in students:
        archetype = student["archetype"]
        config = archetype_config[archetype]
        user: User = student["user"]

        target_questions = random.randint(*config["questions"])
        accuracy_target = random.uniform(*config["accuracy"])

        for _ in range(target_questions):
            topic_id = random.choice(topic_ids)
            topic_meta = TOPIC_META_BY_ID[topic_id]
            subtopic = random.choice(topic_meta["subtopics"])

            base_value = random.randint(2, 12)
            question_code = (
                "# BytePath auto-generated question\n"
                f"# Topic: {topic_id}\n"
                f"# Subtopic: {subtopic}\n"
                f"value = {base_value}\n"
                "answer = value * 2\n"
                "answer"
            )
            correct_answer = str(base_value * 2)

            is_correct = random.random() < accuracy_target
            skip = False
            if not is_correct and random.random() < config["skip_rate"]:
                skip = True
                status = "skipped"
                student_answer = None
                time_spent = random.randint(5, 20)
            else:
                status = "correct" if is_correct else "incorrect"
                student_answer = (
                    correct_answer if is_correct else str(base_value * 2 + random.randint(1, 3))
                )
                time_raw = random.gauss(config["avg_time"], config["time_sd"])
                if is_correct:
                    time_raw *= random.uniform(0.85, 1.05)
                time_spent = max(8, min(240, int(time_raw)))

            attempted_at = start_datetime + timedelta(
                days=random.randint(0, 45),
                seconds=random.randint(0, 86_399),
            )
            attempted_at = min(attempted_at, _utc_now())

            response = StudentResponse(
                user_id=user.id,
                topic=topic_id,
                subtopic_type=subtopic,
                question_code=question_code,
                student_answer=student_answer,
                correct_answer=correct_answer,
                is_correct=is_correct and not skip,
                status=status,
                time_spent=time_spent,
                attempted_at=attempted_at,
            )
            db.session.add(response)
            responses_created += 1

            key = (user.id, topic_id)
            summary = progress_summary.setdefault(
                key,
                {
                    "attempts": 0,
                    "correct": 0,
                    "last_accessed": attempted_at,
                },
            )
            summary["attempts"] = int(summary["attempts"]) + 1
            if is_correct and not skip:
                summary["correct"] = int(summary.get("correct", 0)) + 1
            summary["last_accessed"] = max(summary["last_accessed"], attempted_at)

    db.session.flush()

    for (user_id, topic_id), summary in progress_summary.items():
        topic_meta = TOPIC_META_BY_ID.get(topic_id)
        total_subtopics = topic_meta["total_subtopics"] if topic_meta else 5
        attempts = int(summary["attempts"])
        correct = int(summary.get("correct", 0))
        accuracy = correct / attempts if attempts else 0.0
        subtopics_completed = int(
            round(
                min(
                    total_subtopics,
                    max(
                        0,
                        total_subtopics * accuracy * random.uniform(0.8, 1.05),
                    ),
                )
            )
        )
        progress = db.session.execute(
            db.select(StudentProgress).filter_by(user_id=user_id, topic=topic_id)
        ).scalar_one_or_none()

        if not progress:
            progress = StudentProgress(
                user_id=user_id,
                topic=topic_id,
                subtopics_completed=subtopics_completed,
                max_subtopics_completed=subtopics_completed,
                total_subtopics=total_subtopics,
                questions_answered=attempts,
                last_accessed=summary["last_accessed"],
            )
            db.session.add(progress)
        else:
            progress.subtopics_completed = subtopics_completed
            progress.max_subtopics_completed = max(
                progress.max_subtopics_completed or 0, subtopics_completed
            )
            progress.total_subtopics = total_subtopics
            progress.questions_answered = attempts
            progress.last_accessed = summary["last_accessed"]

    db.session.commit()

    print(
        f"Seeded realistic dataset: {len(students)} students, "
        f"{responses_created} responses, {len(progress_summary)} progress records."
    )


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for the initialisation script."""

    parser = argparse.ArgumentParser(description="Initialise the BytePath database.")
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Insert default topics and users after creating tables.",
    )
    parser.add_argument(
        "--realistic",
        action="store_true",
        help="Populate the database with realistic sample data (users, responses, progress).",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    initialise_database(seed=args.seed, realistic=args.realistic)
