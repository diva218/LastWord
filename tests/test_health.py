"""Minimal health check test for LastWord using app factory and SQLite."""

import os
import pytest

# Ensure environment uses SQLite in-memory for testing
os.environ["ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app import create_app  # noqa: E402
from app.models import db   # noqa: E402


@pytest.fixture
def client():
    """Create a configured Flask test client with SQLite in-memory database."""
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


def test_health_endpoint(client):
    """GET /health must return status ok and HTTP 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data == {"status": "ok"}
