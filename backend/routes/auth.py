from __future__ import annotations

import json
import secrets
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import flask
from flask import Blueprint, jsonify, request, session, current_app
from google_auth_oauthlib.flow import Flow

from backend.models import User
from backend.services.auth_service import AuthService

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def get_auth_service():
    return current_app.config.get("AUTH_SERVICE", AuthService)


@auth_bp.post("/login")
def login():
    """Authenticate or auto-register a user based on email."""

    payload = request.get_json(silent=True) or {}
    email = payload.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    service = get_auth_service()
    user = service.login_or_create_user(email)
    session["user_id"] = user.id
    return jsonify({"user": _serialise_user(user)})


@auth_bp.get("/profile")
def profile():
    """Return the current authenticated user's profile."""

    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    service = get_auth_service()
    user = service.get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(_serialise_user(user))


@auth_bp.post("/logout")
def logout():
    """Clear the current session."""

    session.clear()
    return jsonify({"message": "Logged out"})


@auth_bp.get("/google")
def google_authorize():
    """Build the Google OAuth authorization URL and redirect the user."""

    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    redirect_uri = current_app.config.get("GOOGLE_REDIRECT_URI")
    scope = current_app.config.get("GOOGLE_OAUTH_SCOPE")

    if not client_id or not redirect_uri:
        return jsonify({"error": "Google OAuth not configured"}), 500

    state = secrets.token_urlsafe(24)
    session["google_oauth_state"] = state

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scope,
        "state": state,
    }
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"
    return flask.redirect(f"{authorize_url}?{urlencode(params)}")


@auth_bp.get("/google/callback")
def google_callback():
    """Verify OAuth state and capture the authorization code."""

    error = request.args.get("error")
    if error:
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
        return flask.redirect(frontend_url)

    state = request.args.get("state")
    expected_state = session.pop("google_oauth_state", None)
    if not state or not expected_state or state != expected_state:
        return jsonify({"error": "Invalid OAuth state"}), 400

    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing authorization code"}), 400

    scopes = (current_app.config.get("GOOGLE_OAUTH_SCOPE") or "").split()
    client_secrets_file = current_app.config.get("GOOGLE_CLIENT_SECRETS_FILE")
    redirect_uri = current_app.config.get("GOOGLE_REDIRECT_URI")

    flow = Flow.from_client_secrets_file(
        client_secrets_file,
        scopes=scopes,
        state=expected_state,
    )
    flow.redirect_uri = redirect_uri
    flow.fetch_token(code=code)

    credentials = flow.credentials
    session["google_credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "granted_scopes": list(credentials.granted_scopes or []),
        "expires_at": credentials.expiry.isoformat() if credentials.expiry else None,
    }

    userinfo = _fetch_google_userinfo(credentials.token)
    if "error" in userinfo:
        return jsonify(userinfo), 400

    email = userinfo.get("email")
    if not email:
        return jsonify({"error": "Email not available from Google"}), 400
    given_name = userinfo.get("given_name") or None
    family_name = userinfo.get("family_name") or None
    display_name = userinfo.get("name") or " ".join(
        part for part in [given_name, family_name] if part
    ).strip() or None

    service = get_auth_service()
    user = service.login_or_create_user(
        email,
        display_name=display_name,
        given_name=given_name,
        family_name=family_name,
    )
    session["user_id"] = user.id

    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
    return flask.redirect(frontend_url)


@auth_bp.get("/google/complete")
def google_complete():
    """Return the authorization code without exposing it in the URL."""

    credentials = session.get("google_credentials")
    if not credentials:
        return jsonify({"error": "No OAuth credentials available"}), 400

    granted_scopes = credentials.get("granted_scopes", [])
    scope_status = check_granted_scopes(granted_scopes or [])

    return jsonify(
        {
            "message": "OAuth tokens stored",
            "granted_scopes": granted_scopes,
            "scope_status": scope_status,
        }
    )


def _serialise_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
    }


def check_granted_scopes(granted_scopes: list[str]) -> dict:
    scope_set = set(granted_scopes)
    return {
        "userinfo_email": "https://www.googleapis.com/auth/userinfo.email" in scope_set,
        "userinfo_profile": "https://www.googleapis.com/auth/userinfo.profile" in scope_set,
        "openid": "openid" in scope_set,
    }


def _fetch_google_userinfo(token: str) -> dict:
    request_obj = Request(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urlopen(request_obj, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as exc:  # pragma: no cover - network errors
        return {"error": "Failed to fetch user info", "details": str(exc)}
