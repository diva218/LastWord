"""Tests for LastWord Dashboard view."""

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


def test_dashboard_renders(client):
    """GET /dashboard renders with bento layout, countdown digits, and check-in button."""
    response = client.get("/dashboard")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    assert "bento-container" in html
    assert "countdownDigits" in html
    assert "btnCheckin" in html
    assert "I'm OK — Check in" in html
    assert "Escalation Stream" in html


def test_checkin_endpoint(client):
    """POST /checkin returns successful JSON pulse or redirects."""
    response = client.post("/checkin", headers={"X-Requested-With": "XMLHttpRequest"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
