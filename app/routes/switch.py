"""Switch/public routes."""

from __future__ import annotations

from flask import Blueprint, jsonify, render_template


switch_bp = Blueprint("switch", __name__)


@switch_bp.route("/", methods=["GET"])
def index():
    """Public landing page."""

    return render_template("index.html")


@switch_bp.route("/health", methods=["GET"])
def health():
    """ALB health check endpoint."""

    return jsonify({"status": "ok"}), 200
