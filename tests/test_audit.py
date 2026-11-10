"""Tests for LastWord Audit Log view."""

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


def test_audit_renders(client):
    """GET /audit renders with bento layout, log entries, and EventBridge scan rate."""
    response = client.get("/audit")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    assert "bento-container" in html
    assert "Tamper-Proof Audit Trail" in html
    assert "EVENTBRIDGE_SCAN_CYCLE" in html
    assert "1,440 Scans / Day" in html
