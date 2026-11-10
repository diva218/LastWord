"""Internal-only routes."""

from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request


internal_bp = Blueprint("internal", __name__)


@internal_bp.route("/internal/scan", methods=["POST"])
def internal_scan():
    """Protected scan trigger endpoint (stub)."""

    provided = request.headers.get("X-Scan-Secret", "")
    expected = current_app.config.get("SCAN_SECRET", "")

    if not expected or provided != expected:
        return jsonify({"error": "unauthorized"}), 401

    # TODO: implement periodic switch scan and escalation logic.
    return jsonify({"message": "scan stub"}), 202
