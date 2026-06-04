"""
Database migration entry point for deploy scripts.

Historical one-off migrations have all been applied. This script runs db.create_all()
and applies small additive schema patches for existing SQLite databases.
"""

from backend.app import create_app
from backend.models import db

app = create_app()

with app.app_context():
    inspector = db.inspect(db.engine)

    if inspector.has_table("classes"):
        class_cols = {col["name"] for col in inspector.get_columns("classes")}
        if "updated_at" not in class_cols:
            print("Adding updated_at to classes...")
            with db.engine.connect() as conn:
                conn.execute(
                    db.text("ALTER TABLE classes ADD COLUMN updated_at DATETIME")
                )
                conn.execute(
                    db.text(
                        "UPDATE classes SET updated_at = created_at "
                        "WHERE updated_at IS NULL"
                    )
                )
                conn.commit()

    db.create_all()
    print("Database schema is up to date.")
