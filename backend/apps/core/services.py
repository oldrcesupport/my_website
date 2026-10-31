from .models import AuditLog


def log_audit(
    actor,
    action: str,
    target_model: str = "",
    target_id: str = "",
    metadata: dict = None,
):
    """
    Safely creates an audit log record, ensuring no sensitive data is leaked.
    """
    safe_metadata = dict(metadata or {})
    # Strip any potential secrets if accidentally passed
    for key in ["password", "token", "raw_token", "secret", "cvv", "card"]:
        safe_metadata.pop(key, None)

    return AuditLog.objects.create(
        actor=actor if actor and getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_model=target_model,
        target_id=str(target_id),
        metadata=safe_metadata,
    )
