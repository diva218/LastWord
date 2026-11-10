"""Tests for the LastWord Bento Grid landing page UI."""

import os
import pytest

os.environ["ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app import create_app  # noqa: E402
from app.models import db   # noqa: E402


@pytest.fixture
def client():
    """Create a configured Flask test client."""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })

    with app.app_context():
        db.create_all()
        with app.test_client() as test_client:
            yield test_client
        db.session.remove()
        db.drop_all()


def test_landing_page_renders_successfully(client):
    """GET / renders successfully with bento grid container and core elements."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    # Core Bento UI elements
    assert "LastWord" in html
    assert "bento-container" in html
    assert "bento-tile" in html
    assert "Say" in html and "before" in html
    assert "countdownDigits" in html
    assert "KMS Encrypted" in html
    assert "Create your switch" in html
    assert "See how it works" in html


def test_static_assets_available(client):
    """Verify static assets are served properly."""
    css_resp = client.get("/static/css/main.css")
    assert css_resp.status_code == 200

    js_resp = client.get("/static/js/main.js")
    assert js_resp.status_code == 200
