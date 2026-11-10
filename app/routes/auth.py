"""Authentication routes: register, login, and logout."""

from __future__ import annotations

import bcrypt
from flask import Blueprint, jsonify, request, session

from app.models import User, db


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user with bcrypt password hashing."""

    payload = request.get_json(silent=True) or request.form
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return jsonify({"message": "registered"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and create a session."""

    payload = request.get_json(silent=True) or request.form
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "invalid credentials"}), 401

    session["user_id"] = user.id
    return jsonify({"message": "logged in"}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Clear the current login session."""

    session.pop("user_id", None)
    return jsonify({"message": "logged out"}), 200
