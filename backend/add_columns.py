"""
Migration script to update the database schema.
Run this once after pulling changes that add new columns or tables.
"""

from backend.app import create_app
from backend.models import db

app = create_app()

with app.app_context():
    inspector = db.inspect(db.engine)

    # ── roster_students ──────────────────────────────────────────────────────
    roster_cols = [col['name'] for col in inspector.get_columns('roster_students')]
    print(f"roster_students columns: {roster_cols}")

    with db.engine.connect() as conn:
        if 'deleted_at' not in roster_cols:
            print("Adding deleted_at...")
            conn.execute(db.text("ALTER TABLE roster_students ADD COLUMN deleted_at DATETIME"))
            conn.commit()

        if 'notes' not in roster_cols:
            print("Adding notes...")
            conn.execute(db.text("ALTER TABLE roster_students ADD COLUMN notes TEXT"))
            conn.commit()

        if 'last_updated_via' not in roster_cols:
            print("Adding last_updated_via...")
            conn.execute(db.text("ALTER TABLE roster_students ADD COLUMN last_updated_via VARCHAR(20)"))
            conn.commit()

        if 'last_upload_id' not in roster_cols:
            print("Adding last_upload_id...")
            conn.execute(db.text("ALTER TABLE roster_students ADD COLUMN last_upload_id INTEGER"))
            conn.commit()

        if 'class_id' not in roster_cols:
            print("Adding class_id to roster_students...")
            conn.execute(db.text("ALTER TABLE roster_students ADD COLUMN class_id INTEGER REFERENCES classes(id)"))
            conn.commit()

        if 'section' not in roster_cols:
            print("Adding section...")
            conn.execute(db.text("ALTER TABLE roster_students ADD COLUMN section VARCHAR(64) NOT NULL DEFAULT ''"))
            conn.commit()

    # ── student_responses ────────────────────────────────────────────────────
    response_cols = [col['name'] for col in inspector.get_columns('student_responses')]
    print(f"student_responses columns: {response_cols}")

    with db.engine.connect() as conn:
        if 'class_id' not in response_cols:
            print("Adding class_id to student_responses...")
            conn.execute(db.text("ALTER TABLE student_responses ADD COLUMN class_id INTEGER REFERENCES classes(id)"))
            conn.commit()

    # ── student_progress ─────────────────────────────────────────────────────
    progress_cols = [col['name'] for col in inspector.get_columns('student_progress')]
    print(f"student_progress columns: {progress_cols}")

    with db.engine.connect() as conn:
        if 'class_id' not in progress_cols:
            print("Adding class_id to student_progress...")
            conn.execute(db.text("ALTER TABLE student_progress ADD COLUMN class_id INTEGER REFERENCES classes(id)"))
            conn.commit()

        if 'max_subtopics_completed' not in progress_cols:
            print("Adding max_subtopics_completed to student_progress...")
            conn.execute(db.text(
                "ALTER TABLE student_progress ADD COLUMN max_subtopics_completed INTEGER DEFAULT 0"
            ))
            conn.execute(db.text(
                "UPDATE student_progress SET max_subtopics_completed = subtopics_completed "
                "WHERE max_subtopics_completed IS NULL OR max_subtopics_completed = 0"
            ))
            conn.commit()

    # ── fix student_progress unique constraint ───────────────────────────────
    # Old schema had UNIQUE(user_id, topic); new schema needs UNIQUE(user_id, topic, class_id)
    with db.engine.connect() as conn:
        progress_ddl = conn.execute(
            db.text("SELECT sql FROM sqlite_master WHERE name='student_progress'")
        ).scalar() or ""

        if "UNIQUE (user_id, topic)" in progress_ddl and "UNIQUE (user_id, topic, class_id)" not in progress_ddl:
            print("Recreating student_progress to fix unique constraint...")
            progress_cols = [col["name"] for col in db.inspect(db.engine).get_columns("student_progress")]
            max_select = (
                "max_subtopics_completed"
                if "max_subtopics_completed" in progress_cols
                else "subtopics_completed"
            )
            conn.execute(db.text(f"""
                CREATE TABLE student_progress_new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    class_id INTEGER REFERENCES classes(id),
                    topic VARCHAR(100) NOT NULL REFERENCES topics(id),
                    subtopics_completed INTEGER DEFAULT 0,
                    max_subtopics_completed INTEGER DEFAULT 0,
                    total_subtopics INTEGER,
                    questions_answered INTEGER DEFAULT 0,
                    last_accessed DATETIME,
                    UNIQUE (user_id, topic, class_id)
                )
            """))
            conn.execute(db.text(f"""
                INSERT INTO student_progress_new
                    (id, user_id, class_id, topic, subtopics_completed,
                     max_subtopics_completed, total_subtopics, questions_answered, last_accessed)
                SELECT id, user_id, class_id, topic, subtopics_completed,
                       {max_select}, total_subtopics, questions_answered, last_accessed
                FROM student_progress
            """))
            conn.execute(db.text("DROP TABLE student_progress"))
            conn.execute(db.text("ALTER TABLE student_progress_new RENAME TO student_progress"))
            conn.commit()
            print("student_progress recreated with UNIQUE(user_id, topic, class_id).")

    # ── fix roster_students unique constraint ────────────────────────────────
    # Old schema had UNIQUE(email); new schema needs UNIQUE(email, class_id)
    # SQLite can't drop constraints, so recreate the table if needed.
    with db.engine.connect() as conn:
        ddl = conn.execute(
            db.text("SELECT sql FROM sqlite_master WHERE name='roster_students'")
        ).scalar() or ""

        if "UNIQUE (email)" in ddl and "UNIQUE (email, class_id)" not in ddl:
            print("Recreating roster_students to fix unique constraint...")
            conn.execute(db.text("""
                CREATE TABLE roster_students_new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    first_name VARCHAR(120) NOT NULL,
                    last_name VARCHAR(120) NOT NULL,
                    created_at DATETIME,
                    updated_at DATETIME,
                    deleted_at DATETIME,
                    notes TEXT,
                    last_updated_via VARCHAR(20),
                    last_upload_id INTEGER REFERENCES upload_history(id),
                    class_id INTEGER REFERENCES classes(id),
                    UNIQUE (email, class_id)
                )
            """))
            conn.execute(db.text("""
                INSERT INTO roster_students_new
                    (id, email, first_name, last_name, created_at, updated_at,
                     deleted_at, notes, last_updated_via, last_upload_id, class_id)
                SELECT id, email, first_name, last_name, created_at, updated_at,
                       deleted_at, notes, last_updated_via, last_upload_id, class_id
                FROM roster_students
            """))
            conn.execute(db.text("DROP TABLE roster_students"))
            conn.execute(db.text("ALTER TABLE roster_students_new RENAME TO roster_students"))
            conn.commit()
            print("roster_students recreated with UNIQUE(email, class_id).")

    # ── instructors (co-instructor join table) ───────────────────────────────
    # Recreate if the table is missing class_id (old schema had only user_id).
    with db.engine.connect() as conn:
        instructor_cols = [
            col['name'] for col in inspector.get_columns('instructors')
        ] if inspector.has_table('instructors') else []
        print(f"instructors columns: {instructor_cols}")

        if 'class_id' not in instructor_cols:
            print("Recreating instructors table with class_id support...")
            conn.execute(db.text("DROP TABLE IF EXISTS instructors"))
            conn.execute(db.text("""
                CREATE TABLE instructors (
                    id INTEGER NOT NULL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    class_id INTEGER NOT NULL REFERENCES classes(id),
                    added_by INTEGER REFERENCES users(id),
                    added_at DATETIME,
                    UNIQUE (user_id, class_id)
                )
            """))
            conn.commit()
            print("instructors table recreated.")

    # ── class_topic_settings table ───────────────────────────────────────────
    if not inspector.has_table('class_topic_settings'):
        print('Creating class_topic_settings table...')
        with db.engine.connect() as conn:
            conn.execute(db.text("""
                CREATE TABLE class_topic_settings (
                    id INTEGER NOT NULL PRIMARY KEY,
                    class_id INTEGER NOT NULL REFERENCES classes(id),
                    topic_id VARCHAR(100) NOT NULL REFERENCES topics(id),
                    section VARCHAR(64),
                    is_enabled BOOLEAN NOT NULL DEFAULT 1,
                    available_at DATETIME,
                    is_assigned BOOLEAN NOT NULL DEFAULT 0,
                    due_at DATETIME,
                    updated_at DATETIME,
                    UNIQUE (class_id, topic_id, section)
                )
            """))
            conn.commit()
    else:
        cts_cols = [col['name'] for col in inspector.get_columns('class_topic_settings')]
        print(f"class_topic_settings columns: {cts_cols}")
        with db.engine.connect() as conn:
            if 'section' not in cts_cols:
                print("Recreating class_topic_settings with section support...")
                conn.execute(db.text("""
                    CREATE TABLE class_topic_settings_new (
                        id INTEGER NOT NULL PRIMARY KEY,
                        class_id INTEGER NOT NULL REFERENCES classes(id),
                        topic_id VARCHAR(100) NOT NULL REFERENCES topics(id),
                        section VARCHAR(64),
                        is_enabled BOOLEAN NOT NULL DEFAULT 1,
                        available_at DATETIME,
                        is_assigned BOOLEAN NOT NULL DEFAULT 0,
                        due_at DATETIME,
                        updated_at DATETIME,
                        UNIQUE (class_id, topic_id, section)
                    )
                """))
                conn.execute(db.text("""
                    INSERT INTO class_topic_settings_new
                        (id, class_id, topic_id, section, is_enabled, available_at, updated_at)
                    SELECT id, class_id, topic_id, NULL as section, is_enabled, available_at, updated_at
                    FROM class_topic_settings
                """))
                conn.execute(db.text("DROP TABLE class_topic_settings"))
                conn.execute(db.text("ALTER TABLE class_topic_settings_new RENAME TO class_topic_settings"))
                conn.commit()
                print("class_topic_settings recreated with section support.")

        cts_cols = [col['name'] for col in db.inspect(db.engine).get_columns('class_topic_settings')]
        with db.engine.connect() as conn:
            if 'is_assigned' not in cts_cols:
                print("Adding is_assigned to class_topic_settings...")
                conn.execute(db.text(
                    "ALTER TABLE class_topic_settings ADD COLUMN is_assigned BOOLEAN NOT NULL DEFAULT 0"
                ))
                conn.commit()
            if 'due_at' not in cts_cols:
                print("Adding due_at to class_topic_settings...")
                conn.execute(db.text(
                    "ALTER TABLE class_topic_settings ADD COLUMN due_at DATETIME"
                ))
                conn.commit()

    # ── create any new tables (classes, upload_history, etc.) ────────────────
    db.create_all()

    print("Database schema updated successfully!")
