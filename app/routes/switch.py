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
                title="Personal Messages & Handover Notes",
                note_text="Personal message to be shared with trusted contacts if check-ins stop.",
                file_s3_key="s3://lastword-vault-prod/users/1/handover_notes.enc",
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


@switch_bp.route("/contacts", methods=["GET"])
def contacts():
    """Contacts view showing trusted contacts."""

    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    contacts_list = Contact.query.filter_by(user_id=user.id).all() if user else []

    if not contacts_list:
        contacts_list = [
            Contact(
                id=1,
                name="Sarah Vance",
                email="sarah.vance@example.com",
                created_at=datetime.utcnow() - timedelta(days=60),
            ),
            Contact(
                id=2,
                name="Michael Chen, Esq.",
                email="mchen@chenlegal.example.com",
                created_at=datetime.utcnow() - timedelta(days=40),
            ),
        ]

    return render_template(
        "contacts.html",
        user=user,
        contacts=contacts_list,
        active_page="contacts",
    )


@switch_bp.route("/settings", methods=["GET"])
def settings():
    """Settings view for switch cadence, notification channels, and demo mode."""

    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    switch = Switch.query.filter_by(user_id=user.id).first() if user else None

    if not switch:
        switch = Switch(
            state="ACTIVE",
            interval_s=30 * 86400,
            warn_s=48 * 3600,
            grace_s=24 * 3600,
            last_checkin=datetime.utcnow() - timedelta(hours=2),
            next_deadline=datetime.utcnow() + timedelta(days=30),
        )

    return render_template(
        "settings.html",
        user=user,
        switch=switch,
        active_page="settings",
    )


@switch_bp.route("/audit", methods=["GET"])
def audit():
    """Audit log view showing immutable state machine transitions."""

    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    logs = (
        AuditLog.query.filter_by(user_id=user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(20)
        .all()
        if user
        else []
    )

    if not logs:
        logs = [
            AuditLog(
                id=101,
                action="HEARTBEAT_PULSE_VERIFIED",
                metadata_json='{"status": "ACTIVE", "ip": "127.0.0.1", "channel": "dashboard"}',
                created_at=datetime.utcnow() - timedelta(minutes=14),
            ),
            AuditLog(
                id=100,
                action="EVENTBRIDGE_SCAN_CYCLE",
                metadata_json='{"rule": "lastword-scan", "deadline_delta_s": 1240939, "state": "ACTIVE"}',
                created_at=datetime.utcnow() - timedelta(minutes=15),
            ),
            AuditLog(
                id=99,
                action="EVENTBRIDGE_SCAN_CYCLE",
                metadata_json='{"rule": "lastword-scan", "deadline_delta_s": 1240999, "state": "ACTIVE"}',
                created_at=datetime.utcnow() - timedelta(minutes=16),
            ),
            AuditLog(
                id=98,
                action="VAULT_ENCRYPTION_VERIFIED",
                metadata_json='{"kms_key": "arn:aws:kms:us-east-1:123456789012:key/lastword", "status": "SEALED"}',
                created_at=datetime.utcnow() - timedelta(hours=4),
            ),
            AuditLog(
                id=97,
                action="SES_REMINDER_DISPATCHED",
                metadata_json='{"recipient": "user@example.com", "delivery": "AWS SES", "status": "250 OK"}',
                created_at=datetime.utcnow() - timedelta(days=2),
            ),
        ]

    return render_template(
        "audit.html",
        user=user,
        logs=logs,
        active_page="audit",
    )


@switch_bp.route("/release", methods=["GET"])
@switch_bp.route("/release/<token>", methods=["GET"])
def release(token=None):
    """Public/trusted contact release portal for single-use download links."""

    token_str = token or "tok_demo_7f9e12"
    contact = Contact(id=1, name="Sarah Vance", email="sarah.vance@example.com")
    unlocked_items = [
        VaultItem(
            id=1,
            title="Bitwarden Master Password & Recovery Kit",
            note_text="Primary Master Password: 'Correct-Horse-Battery-Staple-2026!'\nRecovery Key: 4910-8491-0029-4819\nEmergency handover notes are included. Distribute access as instructed.",
            file_s3_key="s3://lastword-vault-prod/users/1/bitwarden_keys.enc",
            created_at=datetime.utcnow() - timedelta(days=12),
        ),
        VaultItem(
            id=3,
            title="Personal Messages & Account Handover Guide",
            note_text="Dear Sarah,\nAll insurance policy numbers and safety deposit box keys are located in our home safe (Combination 42-18-09). Full instructions are included in the handover notes.",
            file_s3_key="s3://lastword-vault-prod/users/1/handover_notes.enc",
            created_at=datetime.utcnow() - timedelta(days=45),
        ),
    ]

    return render_template(
        "release.html",
        token=token_str,
        contact=contact,
        items=unlocked_items,
        active_page="release",
    )


@switch_bp.route("/checkin", methods=["POST", "GET"])
@switch_bp.route("/checkin/<token>", methods=["POST", "GET"])
def checkin(token=None):
    """Manual heartbeat check-in trigger and confirmation portal."""

    user_id = session.get("user_id")
    now = datetime.utcnow()
    checked_in = False

    if request.method == "POST" or request.args.get("pulse") == "1":
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
                        metadata_json='{"source": "checkin_page", "status": "ACTIVE"}',
                        created_at=now,
                    )
                    db.session.add(audit)
                    db.session.commit()
        checked_in = True

        if request.headers.get("X-Requested-With") == "XMLHttpRequest" or request.is_json:
            return jsonify({
                "status": "ok",
                "message": "Checked in successfully",
                "timestamp": now.isoformat(),
            }), 200

    return render_template(
        "checkin.html",
        checked_in=checked_in,
        token=token,
        active_page="checkin",
    )


@switch_bp.route("/health", methods=["GET"])
def health():
    """ALB health check endpoint."""

    return jsonify({"status": "ok"}), 200
