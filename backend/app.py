from __future__ import annotations

import logging
import os
from http import HTTPStatus
from typing import Optional, Union

from flask import Flask, jsonify

try:  # Allow tests to run without flask_cors installed
    from flask_cors import CORS  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    def CORS(*args, **kwargs):
        return None

from backend.config import get_config
from backend.models import db, Class, ClassTopicSetting, RosterStudent, Topic, UploadHistory  # Import models so SQLAlchemy discovers them
from backend.topic_definitions import TOPIC_DEFINITIONS
from backend.routes import (
    auth_bp,
    classes_bp,
    progress_bp,
    reports_bp,
    responses_bp,
    students_bp,
    topics_bp,
)


def create_app(config_name: Optional[str] = None) -> Flask:
    """
    Application factory for the BytePath backend.

    Initializes Flask extensions, applies configuration, registers routes,
    and sets up error handlers.
    """

    app = Flask(__name__)
    # Use FLASK_ENV environment variable if config_name not provided
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")
    config_class = get_config(config_name)
    app.config.from_object(config_class)

    _configure_extensions(app)
    _register_routes(app)
    _register_error_handlers(app)

    return app


def _configure_extensions(app: Flask) -> None:
    """Configure database, CORS, and any other Flask extensions."""

    db.init_app(app)

    with app.app_context():
        db.create_all()
        _seed_topics_if_empty()

    origins = app.config.get("CORS_ORIGINS", ["http://localhost:5173"])
    CORS(
        app,
        origins=origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )


def _register_routes(app: Flask) -> None:
    """Register core routes for health checks and diagnostics."""

    app.register_blueprint(auth_bp)
    app.register_blueprint(classes_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(responses_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(topics_bp)

    @app.get("/")
    def root():
        """Return API information."""
        return jsonify({
            "name": "BytePath API",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "auth": "/api/auth",
                "topics": "/api/topics",
                "responses": "/api/responses",
                "progress": "/api/progress",
                "reports": "/api/reports",
                "students": "/api/students"
            }
        }), HTTPStatus.OK

    @app.get("/health")
    def health_check():
        """Return a simple health check response."""

        return jsonify({"status": "ok"}), HTTPStatus.OK


def _register_error_handlers(app: Flask) -> None:
    """Add generic error handlers to return JSON payloads."""

    @app.errorhandler(HTTPStatus.NOT_FOUND)
    def handle_not_found(error):  # type: ignore[override]
        return (
            jsonify({"error": "Not Found", "message": str(error)}),
            HTTPStatus.NOT_FOUND,
        )

    @app.errorhandler(HTTPStatus.INTERNAL_SERVER_ERROR)
    def handle_server_error(error):  # type: ignore[override]
        logging.exception("Unhandled exception: %s", error)
        return (
            jsonify(
                {
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred.",
                }
            ),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

def _seed_topics_if_empty() -> None:
    """Insert default topics if none exist (helps local/dev environments)."""

    if not hasattr(db.session, "query"):
        # In test environments without SQLAlchemy installed, skip seeding.
        return

    existing_count = db.session.query(Topic).count()
    if existing_count > 0:
        return

    for topic in TOPIC_DEFINITIONS:
        db.session.add(
            Topic(
                id=topic["id"],
                name=topic["name"],
                is_visible=topic["is_visible"],
                order_index=topic["order_index"],
            )
        )
    db.session.commit()
    logging.info("Seeded default topics into empty database.")


# Application instance for Gunicorn
application = create_app()

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=application.config["FLASK_RUN_PORT"])
