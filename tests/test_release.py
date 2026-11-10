"""Tests for LastWord Release view."""

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


def test_release_renders(client):
    """GET /release renders with bento layout, released status, and unlocked assets."""
    response = client.get("/release/tok_test_123")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    assert "bento-container" in html
    assert "Vault Released to Beneficiary" in html
    assert "Sarah Vance" in html
    assert "DECRYPTED (AES-256)" in html
    assert "tok_test_123" in html

