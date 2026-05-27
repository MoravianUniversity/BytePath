import os
from typing import Optional, Type, Union

from dotenv import load_dotenv
load_dotenv()

class Config:
    """Base configuration shared across environments."""

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = (
        f"sqlite:///{os.path.join(BASE_DIR, 'bytepath.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")
    SECRET_KEY = os.environ.get("BYTEPATH_SECRET_KEY", "dev-secret-key-change-me")
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_REDIRECT_URI = os.environ.get(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:5000/api/auth/google/callback",
    )
    GOOGLE_OAUTH_SCOPE = os.environ.get(
        "GOOGLE_OAUTH_SCOPE",
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
    )
    GOOGLE_CLIENT_SECRETS_FILE = os.environ.get(
        "GOOGLE_CLIENT_SECRETS_FILE",
        os.path.join(BASE_DIR, "credentials", "client_secret.json"),
    )
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    FLASK_RUN_PORT = int(os.environ.get("FLASK_RUN_PORT", 5000))


class DevelopmentConfig(Config):
    """Configuration for local development."""

    DEBUG = True


class ProductionConfig(Config):
    """Configuration for production deployments."""

    DEBUG = False


class TestingConfig(Config):
    """Configuration for running automated tests."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config(config_name: Optional[str] = None) -> Type[Config]:
    """Fetch the configuration class matching the provided name."""

    if not config_name:
        return DevelopmentConfig

    return config_by_name.get(config_name.lower(), DevelopmentConfig)
