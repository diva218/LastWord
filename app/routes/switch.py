"""Switch/public routes."""

from __future__ import annotations

from flask import Blueprint, jsonify


switch_bp = Blueprint("switch", __name__)


@switch_bp.route("/health", methods=["GET"])
def health():
    """ALB health check endpoint."""

    return jsonify({"status": "ok"}), 200
