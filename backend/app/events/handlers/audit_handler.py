import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.models.outbox import AuditLog


def record_audit_entry(
    db: Session,
    entity_name: str,
    entity_id: str,
    action: str,
    actor_id: int = None,
    actor_email: str = None,
    details: dict = None
):
    details_str = json.dumps(details, default=str) if details else None
    audit = AuditLog(
        entity_name=entity_name,
        entity_id=str(entity_id),
        action=action,
        actor_id=actor_id,
        actor_email=actor_email or "System / Background Worker",
        details_json=details_str,
        created_at=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
