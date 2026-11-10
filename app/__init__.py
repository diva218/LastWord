"""Flask app factory for LastWord."""

from __future__ import annotations

from flask import Flask

from app.config import load_config
from app.models import db
from app.routes.auth import auth_bp
from app.routes.internal import internal_bp
from app.routes.switch import switch_bp


def create_app() -> Flask:
    """Create and configure the Flask application instance."""

    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.update(load_config())

    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(switch_bp)
    app.register_blueprint(internal_bp)

    return app
