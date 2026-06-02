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

    # ── create any new tables (classes, upload_history, etc.) ────────────────
    db.create_all()

    print("Database schema updated successfully!")
