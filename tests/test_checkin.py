"""Tests for LastWord Check-in view."""

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


def test_checkin_page_renders(client):
    """GET /checkin renders with bento layout, heartbeat actions, and status telemetry."""
    response = client.get("/checkin")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    assert "bento-container" in html
    assert "Confirm You Are Well" in html
    assert "btnCheckinPage" in html
    assert "Immediate Escalation Cancellation" in html


def test_checkin_pulse_submission(client):
    """POST /checkin updates status and returns success message."""
    response = client.post("/checkin", data={"pulse": "1"})
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Pulse Recorded &amp; Verified" in html

