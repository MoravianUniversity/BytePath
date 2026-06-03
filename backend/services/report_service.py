from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import case, func, and_, desc

from backend.models import RosterStudent, StudentProgress, StudentResponse, Topic, User, db


class ReportService:
    """Service for generating analytics and reports."""

    @staticmethod
    def normalize_section(section: Optional[str]) -> Optional[str]:
        if section is None:
            return None
        return section.strip()

    @staticmethod
    def get_student_report(
        student_id: int,
        class_id: Optional[int] = None,
        section: Optional[str] = None,
    ) -> Optional[Dict]:
        user = db.session.get(User, student_id)
        if not user:
            return None

        roster_filter = [
            func.lower(RosterStudent.email) == func.lower(user.email),
            RosterStudent.deleted_at.is_(None),
        ]
        if class_id is not None:
            roster_filter.append(RosterStudent.class_id == class_id)
        if section is not None:
            roster_filter.append(RosterStudent.section == section)

        roster_entry = (
            db.session.execute(
                db.select(RosterStudent).filter(*roster_filter)
            )
            .scalars()
            .first()
        )

        # Hide analytics for users who are not on the roster
        if roster_entry is None:
            return None

        response_filter = [StudentResponse.user_id == student_id]
        if class_id is not None:
            response_filter.append(StudentResponse.class_id == class_id)

        responses: List[StudentResponse] = (
            db.session.execute(
                db.select(StudentResponse)
                .filter(*response_filter)
                .order_by(StudentResponse.attempted_at.asc())
            )
            .scalars()
            .all()
        )

        if not responses:
            return {
                "student_id": student_id,
                "student_name": user.name,
                "student_email": user.email,
                "overall_stats": {
                    "total_questions_answered": 0,
                    "total_correct": 0,
                    "total_incorrect": 0,
                    "total_skipped": 0,
                    "overall_accuracy": 0,
                    "avg_time_per_question": 0,
                    "topics_started": 0,
                    "topics_completed": 0,
                },
                "topic_breakdown": [],
                "performance_over_time": [],
                "struggling_subtopics": [],
            }

        total_questions = len(responses)
        correct = sum(1 for r in responses if r.status == "correct")
        incorrect = sum(1 for r in responses if r.status == "incorrect")
        skipped = sum(1 for r in responses if r.status == "skipped")

        non_skipped = [r for r in responses if r.status != "skipped" and r.time_spent]
        avg_time = (
            sum(r.time_spent for r in non_skipped) / len(non_skipped) if non_skipped else 0
        )

        overall_accuracy = (
            (correct / (correct + incorrect) * 100) if (correct + incorrect) > 0 else 0
        )

        topic_stats_filter = [StudentResponse.user_id == student_id]
        if class_id is not None:
            topic_stats_filter.append(StudentResponse.class_id == class_id)

        topic_stats = (
            db.session.execute(
                db.select(
                    StudentResponse.topic,
                    Topic.name.label("topic_name"),
                    func.count(StudentResponse.id).label("questions_answered"),
                    func.sum(case((StudentResponse.status == "correct", 1), else_=0)).label(
                        "correct"
                    ),
                    func.sum(case((StudentResponse.status == "incorrect", 1), else_=0)).label(
                        "incorrect"
                    ),
                    func.sum(case((StudentResponse.status == "skipped", 1), else_=0)).label(
                        "skipped"
                    ),
                    func.avg(
                        case(
                            (StudentResponse.status != "skipped", StudentResponse.time_spent),
                            else_=None,
                        )
                    ).label("avg_time"),
                )
                .join(Topic, StudentResponse.topic == Topic.id)
                .filter(*topic_stats_filter)
                .group_by(StudentResponse.topic, Topic.name)
            )
            .mappings()
            .all()
        )

        topic_breakdown = []
        for stat in topic_stats:
            progress_filter = {"user_id": student_id, "topic": stat["topic"]}
            if class_id is not None:
                progress_filter["class_id"] = class_id
            progress = db.session.execute(
                db.select(StudentProgress).filter_by(**progress_filter)
            ).scalar_one_or_none()

            answered = stat["correct"] + stat["incorrect"]
            accuracy = (stat["correct"] / answered * 100) if answered else 0

            topic_breakdown.append(
                {
                    "topic": stat["topic"],
                    "topic_name": stat["topic_name"],
                    "questions_answered": stat["questions_answered"],
                    "correct": stat["correct"],
                    "incorrect": stat["incorrect"],
                    "skipped": stat["skipped"],
                    "accuracy": round(accuracy, 2),
                    "avg_time": round(float(stat["avg_time"]), 2) if stat["avg_time"] else 0,
                    "completion_percentage": round(
                        (
                            progress.subtopics_completed / progress.total_subtopics * 100
                            if progress
                            and progress.total_subtopics
                            and progress.total_subtopics > 0
                            else 0
                        ),
                        2,
                    ),
                    "best_completion_percentage": round(
                        StudentProgress.best_completion_percentage(
                            progress.max_subtopics_completed if progress else 0,
                            progress.total_subtopics if progress else 0,
                        ),
                        2,
                    )
                    if progress
                    else 0,
                    "last_accessed": progress.last_accessed.isoformat() if progress else None,
                }
            )

        daily_stats = (
            db.session.execute(
                db.select(
                    func.date(StudentResponse.attempted_at).label("date"),
                    func.count(StudentResponse.id).label("questions_answered"),
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).label("accuracy"),
                )
                .filter(*response_filter)
                .group_by(func.date(StudentResponse.attempted_at))
                .order_by(func.date(StudentResponse.attempted_at))
            )
            .mappings()
            .all()
        )

        performance_over_time = [
            {
                "date": str(stat["date"]),
                "questions_answered": stat["questions_answered"],
                "accuracy": round(float(stat["accuracy"]), 2) if stat["accuracy"] else 0,
            }
            for stat in daily_stats
        ]

        subtopic_stats = (
            db.session.execute(
                db.select(
                    StudentResponse.topic,
                    StudentResponse.subtopic_type,
                    func.count(StudentResponse.id).label("attempts"),
                    func.sum(
                        case((StudentResponse.is_correct.is_(True), 1), else_=0)
                    ).label("correct"),
                )
                .filter(
                    and_(
                        *response_filter,
                        StudentResponse.status != "skipped",
                    )
                )
                .group_by(StudentResponse.topic, StudentResponse.subtopic_type)
            )
            .mappings()
            .all()
        )

        struggling = []
        for stat in subtopic_stats:
            accuracy = (stat["correct"] / stat["attempts"] * 100) if stat["attempts"] else 0
            if accuracy < 60 and stat["attempts"] >= 3:
                struggling.append(
                    {
                        "topic": stat["topic"],
                        "subtopic_type": stat["subtopic_type"],
                        "attempts": stat["attempts"],
                        "correct": stat["correct"],
                        "accuracy": round(accuracy, 2),
                    }
                )

        struggling.sort(key=lambda x: x["accuracy"])

        progress_kwargs = {"user_id": student_id}
        if class_id is not None:
            progress_kwargs["class_id"] = class_id
        progress_records: List[StudentProgress] = (
            db.session.execute(db.select(StudentProgress).filter_by(**progress_kwargs))
            .scalars()
            .all()
        )
        topics_started = len(progress_records)
        topics_completed = sum(
            1
            for record in progress_records
            if record.total_subtopics and record.subtopics_completed >= record.total_subtopics
        )

        return {
            "student_id": student_id,
            "student_name": user.name,
            "student_email": user.email,
            "overall_stats": {
                "total_questions_answered": total_questions,
                "total_correct": correct,
                "total_incorrect": incorrect,
                "total_skipped": skipped,
                "overall_accuracy": round(overall_accuracy, 2),
                "avg_time_per_question": round(avg_time, 2),
                "topics_started": topics_started,
                "topics_completed": topics_completed,
            },
            "topic_breakdown": topic_breakdown,
            "performance_over_time": performance_over_time,
            "struggling_subtopics": struggling[:5],
        }

    @staticmethod
    def get_topic_report(
        topic_id: str,
        class_id: Optional[int] = None,
        section: Optional[str] = None,
    ) -> Optional[Dict]:
        topic = db.session.get(Topic, topic_id)
        if not topic:
            return None

        roster_filter = [User.role == "student", RosterStudent.deleted_at.is_(None)]
        if class_id is not None:
            roster_filter.append(RosterStudent.class_id == class_id)
        if section is not None:
            roster_filter.append(RosterStudent.section == section)

        rostered_students_subquery = (
            db.select(User.id)
            .select_from(User)
            .join(
                RosterStudent,
                func.lower(RosterStudent.email) == func.lower(User.email),
            )
            .filter(*roster_filter)
            .subquery()
        )

        response_base_filter = [
            StudentResponse.topic == topic_id,
            StudentResponse.user_id.in_(rostered_students_subquery),
        ]
        if class_id is not None:
            response_base_filter.append(StudentResponse.class_id == class_id)

        responses: List[StudentResponse] = (
            db.session.execute(
                db.select(StudentResponse).filter(*response_base_filter)
            )
            .scalars()
            .all()
        )

        if not responses:
            return {
                "topic": topic_id,
                "topic_name": topic.name,
                "overall_stats": {
                    "total_students": 0,
                    "students_started": 0,
                    "students_completed": 0,
                    "total_attempts": 0,
                    "avg_accuracy": 0,
                    "avg_time_per_question": 0,
                },
                "subtopic_difficulty": [],
                "most_missed_questions": [],
            }

        total_students = (
            db.session.execute(
                db.select(func.count()).select_from(rostered_students_subquery)
            ).scalar_one()
        )

        students_started = db.session.execute(
            db.select(func.count(func.distinct(StudentResponse.user_id)))
            .select_from(StudentResponse)
            .filter(*response_base_filter)
        ).scalar_one()

        progress_completed_filter = [
            StudentProgress.topic == topic_id,
            StudentProgress.total_subtopics > 0,
            StudentProgress.subtopics_completed >= StudentProgress.total_subtopics,
            StudentProgress.user_id.in_(rostered_students_subquery),
        ]
        if class_id is not None:
            progress_completed_filter.append(StudentProgress.class_id == class_id)

        students_completed = db.session.execute(
            db.select(func.count(StudentProgress.id))
            .select_from(StudentProgress)
            .filter(and_(*progress_completed_filter))
        ).scalar_one()

        non_skipped = [r for r in responses if r.status != "skipped"]
        total_attempts = len(responses)
        correct = sum(1 for r in non_skipped if r.is_correct)
        avg_accuracy = (correct / len(non_skipped) * 100) if non_skipped else 0
        avg_time = (
            sum(r.time_spent for r in non_skipped if r.time_spent) / len(non_skipped)
            if non_skipped
            else 0
        )

        subtopic_stats = (
            db.session.execute(
                db.select(
                    StudentResponse.subtopic_type,
                    func.count(StudentResponse.id).label("attempts"),
                    func.count(func.distinct(StudentResponse.user_id)).label("unique_students"),
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).label("success_rate"),
                    func.avg(StudentResponse.time_spent).label("avg_time"),
                )
                .filter(
                    and_(
                        *response_base_filter,
                        StudentResponse.status != "skipped",
                    )
                )
                .group_by(StudentResponse.subtopic_type)
                .order_by(
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).asc()
                )
            )
            .mappings()
            .all()
        )

        def difficulty(success_rate: float) -> str:
            if success_rate >= 80:
                return "Easy"
            if success_rate >= 60:
                return "Medium"
            if success_rate >= 40:
                return "Hard"
            return "Very Hard"

        subtopic_difficulty = [
            {
                "subtopic_type": stat["subtopic_type"],
                "attempts": stat["attempts"],
                "unique_students": stat["unique_students"],
                "success_rate": round(float(stat["success_rate"]), 2)
                if stat["success_rate"]
                else 0,
                "avg_time": round(float(stat["avg_time"]), 2) if stat["avg_time"] else 0,
                "difficulty_rating": difficulty(float(stat["success_rate"]) if stat["success_rate"] else 0),
            }
            for stat in subtopic_stats
        ]

        question_stats = (
            db.session.execute(
                db.select(
                    StudentResponse.question_code,
                    StudentResponse.subtopic_type,
                    func.count(StudentResponse.id).label("attempts"),
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).label("success_rate"),
                )
                .filter(
                    and_(
                        *response_base_filter,
                        StudentResponse.status != "skipped",
                    )
                )
                .group_by(StudentResponse.question_code, StudentResponse.subtopic_type)
                .having(func.count(StudentResponse.id) >= 5)
                .order_by(
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).asc()
                )
                .limit(10)
            )
            .mappings()
            .all()
        )

        most_missed = [
            {
                "question_code": stat["question_code"],
                "subtopic_type": stat["subtopic_type"],
                "attempts": stat["attempts"],
                "success_rate": round(float(stat["success_rate"]), 2)
                if stat["success_rate"]
                else 0,
            }
            for stat in question_stats
        ]

        return {
            "topic": topic_id,
            "topic_name": topic.name,
            "overall_stats": {
                "total_students": total_students,
                "students_started": students_started or 0,
                "students_completed": students_completed or 0,
                "total_attempts": total_attempts,
                "avg_accuracy": round(avg_accuracy, 2),
                "avg_time_per_question": round(avg_time, 2),
            },
            "subtopic_difficulty": subtopic_difficulty,
            "most_missed_questions": most_missed,
        }

    @staticmethod
    def get_class_overview(class_id: Optional[int] = None, section: Optional[str] = None) -> Dict:
        roster_filter = [User.role == "student", RosterStudent.deleted_at.is_(None)]
        entry_filter = [RosterStudent.deleted_at.is_(None)]
        if class_id is not None:
            roster_filter.append(RosterStudent.class_id == class_id)
            entry_filter.append(RosterStudent.class_id == class_id)
        if section is not None:
            roster_filter.append(RosterStudent.section == section)
            entry_filter.append(RosterStudent.section == section)

        rostered_students_subquery = (
            db.select(User.id)
            .select_from(User)
            .join(
                RosterStudent,
                func.lower(RosterStudent.email) == func.lower(User.email),
            )
            .filter(*roster_filter)
            .subquery()
        )

        roster_entries = (
            db.session.execute(
                db.select(
                    RosterStudent.id.label("roster_id"),
                    RosterStudent.first_name,
                    RosterStudent.last_name,
                    RosterStudent.section,
                    RosterStudent.email,
                    User.id.label("user_id"),
                    User.name.label("user_name"),
                )
                .select_from(RosterStudent)
                .join(
                    User,
                    func.lower(User.email) == func.lower(RosterStudent.email),
                    isouter=True,
                )
                .filter(*entry_filter)
                .order_by(RosterStudent.last_name, RosterStudent.first_name)
            )
            .mappings()
            .all()
        )

        total_students = len(roster_entries)

        one_week_ago = datetime.utcnow() - timedelta(days=7)

        resp_filter = [StudentResponse.user_id.in_(rostered_students_subquery)]
        prog_filter = [StudentProgress.user_id.in_(rostered_students_subquery)]
        if class_id is not None:
            resp_filter.append(StudentResponse.class_id == class_id)
            prog_filter.append(StudentProgress.class_id == class_id)

        active_last_week = db.session.execute(
            db.select(func.count(func.distinct(StudentResponse.user_id)))
            .select_from(StudentResponse)
            .filter(
                *resp_filter,
                StudentResponse.attempted_at >= one_week_ago,
            )
        ).scalar_one()

        total_questions = db.session.execute(
            db.select(func.count(StudentResponse.id))
            .select_from(StudentResponse)
            .filter(*resp_filter)
        ).scalar_one()

        responses = (
            db.session.execute(
                db.select(StudentResponse)
                .select_from(StudentResponse)
                .filter(
                    *resp_filter,
                    StudentResponse.status != "skipped",
                )
            )
            .scalars()
            .all()
        )
        correct = sum(1 for r in responses if r.is_correct)
        class_avg_accuracy = (correct / len(responses) * 100) if responses else 0

        # Get started counts by topic
        started_counts = (
            db.session.execute(
                db.select(
                    Topic.id,
                    Topic.name,
                    Topic.order_index,
                    func.count(func.distinct(StudentProgress.user_id)).label("students_started"),
                )
                .select_from(Topic)
                .join(
                    StudentProgress,
                    and_(
                        Topic.id == StudentProgress.topic,
                        *prog_filter,
                    )
                )
                .group_by(Topic.id, Topic.name, Topic.order_index)
            )
            .mappings()
            .all()
        )

        # Get completed counts by topic
        completed_counts = dict(
            db.session.execute(
                db.select(
                    StudentProgress.topic,
                    func.count(func.distinct(StudentProgress.user_id)).label("completed_count")
                )
                .filter(
                    *prog_filter,
                    StudentProgress.subtopics_completed >= StudentProgress.total_subtopics,
                    StudentProgress.total_subtopics > 0,
                )
                .group_by(StudentProgress.topic)
            ).all()
        )

        # Get accuracy and time stats by topic
        topic_stats = {}
        for row in db.session.execute(
            db.select(
                StudentResponse.topic,
                func.avg(case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)).label("avg_accuracy"),
                func.avg(StudentResponse.time_spent).label("avg_time")
            )
            .filter(
                *resp_filter,
                StudentResponse.status != "skipped",
            )
            .group_by(StudentResponse.topic)
        ):
            topic_stats[row[0]] = (row[1], row[2])

        # Combine all the data
        topics_list = []
        for topic in started_counts:
            topic_id = topic["id"]
            students_started = topic["students_started"] or 0
            students_completed = completed_counts.get(topic_id, 0)
            completion_rate = (students_completed / students_started * 100) if students_started else 0
            stats = topic_stats.get(topic_id, (0, 0))

            topics_list.append({
                "topic": topic_id,
                "topic_name": topic["name"],
                "students_started": students_started,
                "students_completed": students_completed,
                "completion_rate": round(completion_rate, 2),
                "avg_accuracy": round(float(stats[0]), 2) if stats[0] is not None else 0,
                "avg_time_per_question": round(float(stats[1]), 2) if stats[1] is not None else 0,
            })

        # Sort by topic name
        topics_list.sort(key=lambda x: x.get("topic_name", ""))

        seen_emails: set = set()
        rostered_student_list = []
        for entry in roster_entries:
            if entry["email"].lower() in seen_emails:
                continue
            seen_emails.add(entry["email"].lower())
            rostered_student_list.append({
                "student_id": entry["user_id"],
                "student_name": (
                    entry["user_name"]
                    or f"{entry['first_name']} {entry['last_name']}".strip()
                    or entry["email"]
                ),
                "student_email": entry["email"],
            })

        top_performers = (
            db.session.execute(
                db.select(
                    User.id,
                    User.name,
                    func.count(StudentResponse.id).label("questions_answered"),
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).label("accuracy"),
                )
                .join(StudentResponse, User.id == StudentResponse.user_id)
                .filter(
                    and_(
                        User.role == "student",
                        *resp_filter,
                        StudentResponse.status != "skipped",
                    )
                )
                .group_by(User.id, User.name)
                .having(func.count(StudentResponse.id) >= 5)
                .order_by(desc("accuracy"))
                .limit(5)
            )
            .mappings()
            .all()
        )

        top_performer_list = [
            {
                "student_id": performer["id"],
                "student_name": performer["name"],
                "questions_answered": performer["questions_answered"],
                "accuracy": round(float(performer["accuracy"]), 2)
                if performer["accuracy"]
                else 0,
            }
            for performer in top_performers
        ]

        struggling_students = (
            db.session.execute(
                db.select(
                    User.id,
                    User.name,
                    func.count(StudentResponse.id).label("questions_answered"),
                    func.avg(
                        case((StudentResponse.is_correct.is_(True), 100.0), else_=0.0)
                    ).label("accuracy"),
                )
                .join(StudentResponse, User.id == StudentResponse.user_id)
                .filter(
                    and_(
                        User.role == "student",
                        *resp_filter,
                        StudentResponse.status != "skipped",
                    )
                )
                .group_by(User.id, User.name)
                .having(func.count(StudentResponse.id) >= 5)
                .order_by("accuracy")
                .limit(5)
            )
            .mappings()
            .all()
        )

        struggling_list = [
            {
                "student_id": student["id"],
                "student_name": student["name"],
                "questions_answered": student["questions_answered"],
                "accuracy": round(float(student["accuracy"]), 2)
                if student["accuracy"]
                else 0,
            }
            for student in struggling_students
        ]

        recent_activity = (
            db.session.execute(
                db.select(
                    func.date(StudentResponse.attempted_at).label("date"),
                    func.count(StudentResponse.id).label("questions_answered"),
                    func.count(func.distinct(StudentResponse.user_id)).label("active_students"),
                )
                .filter(
                    *resp_filter,
                    StudentResponse.attempted_at >= one_week_ago,
                )
                .group_by(func.date(StudentResponse.attempted_at))
                .order_by(func.date(StudentResponse.attempted_at))
            )
            .mappings()
            .all()
        )

        recent_activity_list = [
            {
                "date": str(activity["date"]),
                "questions_answered": activity["questions_answered"],
                "active_students": activity["active_students"],
            }
            for activity in recent_activity
        ]

        section_query = db.select(RosterStudent.section).filter(
            RosterStudent.deleted_at.is_(None)
        )
        if class_id is not None:
            section_query = section_query.filter(RosterStudent.class_id == class_id)

        section_options = sorted(
            {
                (row[0] or "").strip()
                for row in db.session.execute(section_query.distinct()).all()
            },
            key=lambda s: (s != "", s.lower()),
        )

        return {
            "total_students": total_students,
            "active_students_last_week": active_last_week or 0,
            "total_questions_answered": total_questions,
            "class_avg_accuracy": round(class_avg_accuracy, 2),
            "topics_overview": topics_list,
            "rostered_students": rostered_student_list,
            "top_performers": top_performer_list,
            "struggling_students": struggling_list,
            "recent_activity": recent_activity_list,
            "sections": section_options,
        }

    @staticmethod
    def get_question_analytics(
        topic_id: str,
        subtopic_type: Optional[str] = None,
        class_id: Optional[int] = None,
        section: Optional[str] = None,
    ) -> Dict:
        query = (
            db.session.query(
                StudentResponse.question_code,
                StudentResponse.subtopic_type,
                func.count(StudentResponse.id).label("times_shown"),
                func.sum(case((StudentResponse.status == "correct", 1), else_=0)).label(
                    "correct_count"
                ),
                func.sum(case((StudentResponse.status == "incorrect", 1), else_=0)).label(
                    "incorrect_count"
                ),
                func.sum(case((StudentResponse.status == "skipped", 1), else_=0)).label(
                    "skipped_count"
                ),
                func.avg(
                    case(
                        (StudentResponse.status != "skipped", StudentResponse.time_spent),
                        else_=None,
                    )
                ).label("avg_time"),
                func.count(func.distinct(StudentResponse.user_id)).label("students_who_saw"),
            )
            .filter(StudentResponse.topic == topic_id)
        )

        if subtopic_type:
            query = query.filter(StudentResponse.subtopic_type == subtopic_type)

        if class_id is not None:
            query = query.filter(StudentResponse.class_id == class_id)

        if section is not None:
            rostered_students_subquery = (
                db.select(User.id)
                .select_from(User)
                .join(
                    RosterStudent,
                    func.lower(RosterStudent.email) == func.lower(User.email),
                )
                .filter(
                    User.role == "student",
                    RosterStudent.deleted_at.is_(None),
                    RosterStudent.section == section,
                )
            )
            if class_id is not None:
                rostered_students_subquery = rostered_students_subquery.filter(
                    RosterStudent.class_id == class_id
                )
            query = query.filter(StudentResponse.user_id.in_(rostered_students_subquery))

        results = (
            query.group_by(StudentResponse.question_code, StudentResponse.subtopic_type)
            .order_by(func.count(StudentResponse.id).desc())
            .all()
        )

        analytics = []
        for result in results:
            total_non_skipped = result.correct_count + result.incorrect_count
            success_rate = (result.correct_count / total_non_skipped * 100) if total_non_skipped else 0

            analytics.append(
                {
                    "question_code": result.question_code,
                    "subtopic_type": result.subtopic_type,
                    "times_shown": result.times_shown,
                    "correct_count": result.correct_count,
                    "incorrect_count": result.incorrect_count,
                    "skipped_count": result.skipped_count,
                    "success_rate": round(success_rate, 2),
                    "avg_time_spent": round(float(result.avg_time), 2) if result.avg_time else 0,
                    "students_who_saw": result.students_who_saw,
                }
            )

        return {"topic": topic_id, "analytics": analytics}
