"""Tests for the LastWord landing page UI."""

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
    """GET / renders successfully with stage container and core elements."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    # Core UI elements
    assert "LastWord" in html
    assert "stage-container" in html
    assert "app-mockup" in html
    assert "countdown-visual" in html
    assert "retro-notice-card" in html
    assert "Create your switch" in html
    assert "See how it works" in html


def test_static_assets_available(client):
    """Verify static assets are served properly."""
    css_resp = client.get("/static/css/main.css")
    assert css_resp.status_code == 200

    js_resp = client.get("/static/js/motion.js")
    assert js_resp.status_code == 200

    gsap_resp = client.get("/static/vendor/gsap.min.js")
    assert gsap_resp.status_code == 200
