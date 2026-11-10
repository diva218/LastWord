"""Switch/public routes."""

from __future__ import annotations

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, redirect, render_template, request, session, url_for

from app.models import AuditLog, Contact, Switch, User, VaultItem, db


switch_bp = Blueprint("switch", __name__)


@switch_bp.route("/", methods=["GET"])
def index():
    """Public landing page."""

    return render_template("index.html")


@switch_bp.route("/dashboard", methods=["GET"])
def dashboard():
    """User dashboard view showing live switch countdown and status."""

    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    switch = Switch.query.filter_by(user_id=user.id).first() if user else None

    # Fallback demo state if no user switch exists yet
    if not switch:
        switch = Switch(
            state="ACTIVE",
            interval_s=14 * 86400,
            warn_s=48 * 3600,
            grace_s=24 * 3600,
            last_checkin=datetime.utcnow() - timedelta(hours=3),
            next_deadline=datetime.utcnow() + timedelta(days=14, hours=8, minutes=42, seconds=19),
        )

    contacts_count = Contact.query.filter_by(user_id=user.id).count() if user else 2
    vault_count = VaultItem.query.filter_by(user_id=user.id).count() if user else 3
    recent_logs = (
        AuditLog.query.filter_by(user_id=user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(5)
        .all()
        if user
        else [
            AuditLog(
                action="HEARTBEAT_VERIFIED",
                metadata_json='{"status": "ACTIVE", "source": "web_pulse"}',
                created_at=datetime.utcnow() - timedelta(hours=3),
            ),
            AuditLog(
                action="REMINDER_DISPATCHED",
                metadata_json='{"channel": "ses_email", "attempt": 1}',
                created_at=datetime.utcnow() - timedelta(days=2),
            ),
            AuditLog(
                action="VAULT_SEAL_VERIFIED",
                metadata_json='{"items": 3, "kms_key": "active"}',
                created_at=datetime.utcnow() - timedelta(days=5),
            ),
        ]
    )

    return render_template(
        "dashboard.html",
        user=user,
        switch=switch,
        contacts_count=contacts_count,
        vault_count=vault_count,
        recent_logs=recent_logs,
        active_page="dashboard",
    )


@switch_bp.route("/vault", methods=["GET"])
def vault():
    """Vault view showing KMS encrypted assets and deposit forms."""

    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    contacts = Contact.query.filter_by(user_id=user.id).all() if user else []
    items = VaultItem.query.filter_by(user_id=user.id).all() if user else []

    if not items:
        items = [
            VaultItem(
                id=1,
                title="Bitwarden Master Recovery Password & 2FA Keys",
                note_text="Primary vault emergency recovery phrase and emergency access token for Sarah.",
                file_s3_key="s3://lastword-vault-prod/users/1/bitwarden_keys.enc",
                created_at=datetime.utcnow() - timedelta(days=12),
            ),
            VaultItem(
                id=2,
                title="LLC Operating Agreement & Swiss Bank Instructions",
                note_text="Legal directives for attorney Michael Chen regarding corporate holdings.",
                file_s3_key="s3://lastword-vault-prod/users/1/legal_directives.enc",
                created_at=datetime.utcnow() - timedelta(days=28),
            ),
            VaultItem(
                id=3,
                title="Personal Farewell Letters & Family Photos",
                note_text="Private sealed message delivered upon confirmed silence.",
                file_s3_key="s3://lastword-vault-prod/users/1/farewell_letters.enc",
                created_at=datetime.utcnow() - timedelta(days=45),
            ),
        ]

    return render_template(
        "vault.html",
        user=user,
        items=items,
        contacts=contacts,
        active_page="vault",
    )


@switch_bp.route("/checkin", methods=["POST", "GET"])
def checkin():
    """Manual heartbeat check-in trigger."""

    user_id = session.get("user_id")
    now = datetime.utcnow()

    if user_id:
        user = User.query.get(user_id)
        if user:
            switch = Switch.query.filter_by(user_id=user.id).first()
            if switch:
                switch.last_checkin = now
                switch.state = "ACTIVE"
                if switch.interval_s:
                    switch.next_deadline = now + timedelta(seconds=switch.interval_s)
                audit = AuditLog(
                    user_id=user.id,
                    action="MANUAL_CHECKIN",
                    metadata_json='{"source": "dashboard", "status": "ACTIVE"}',
                    created_at=now,
                )
                db.session.add(audit)
                db.session.commit()

    if request.headers.get("X-Requested-With") == "XMLHttpRequest" or request.is_json:
        return jsonify({
            "status": "ok",
            "message": "Checked in successfully",
            "timestamp": now.isoformat(),
        }), 200

    return redirect(url_for("switch.dashboard"))


@switch_bp.route("/health", methods=["GET"])
def health():
    """ALB health check endpoint."""

    return jsonify({"status": "ok"}), 200
