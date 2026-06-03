"""
Database migration entry point for deploy scripts.

Historical one-off migrations have all been applied. This script only runs
db.create_all() so any newly added models get their tables on existing installs.
"""

from backend.app import create_app
from backend.models import db

app = create_app()

with app.app_context():
    db.create_all()
    print("Database schema is up to date.")
