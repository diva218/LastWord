"""State machine signatures for switch escalation lifecycle.

Only function signatures and docstrings are defined here for now.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.models import Switch


def compute_next_deadline(last_checkin: Optional[datetime], interval_s: int) -> Optional[datetime]:
    """Compute the next check-in deadline from last check-in timestamp and interval."""


def determine_state(switch: Switch, now: datetime) -> str:
    """Determine the expected switch state (ACTIVE/WARNED/GRACE/RELEASED) at a given time."""


def escalate_if_needed(switch: Switch, now: datetime) -> bool:
    """Advance switch state if deadlines are missed; return whether state changed."""


def handle_release(switch: Switch, now: datetime) -> None:
    """Perform RELEASED-state side effects (token creation, notifications)."""
