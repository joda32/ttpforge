from datetime import datetime, timezone
from app.extensions import db
from app.models.exercise_entry import ExerciseEntry
from app.models.ttp import TTP
from app.services.tag_service import set_tags


def list_entries(exercise_id, outcome=None, tactic=None):
    q = (
        ExerciseEntry.query
        .filter_by(exercise_id=exercise_id)
        .join(ExerciseEntry.ttp)
    )
    if outcome:
        q = q.filter(ExerciseEntry.outcome == outcome)
    if tactic:
        q = q.filter(TTP.tactic == tactic)
    return q.order_by(ExerciseEntry.created_at.desc()).all()


def get_entry(entry_id):
    return ExerciseEntry.query.get_or_404(entry_id)


def _next_attack_step(exercise_id):
    from sqlalchemy import func
    max_step = db.session.query(func.max(ExerciseEntry.attack_path_step)).filter(
        ExerciseEntry.exercise_id == exercise_id,
        ExerciseEntry.attack_path_include == True,
    ).scalar()
    return (max_step or 0) + 1


def create_entry(data):
    include = bool(data.get("attack_path_include", True))
    step = None
    if include:
        step = data.get("attack_path_step") or _next_attack_step(data["exercise_id"])

    entry = ExerciseEntry(
        exercise_id=data["exercise_id"],
        ttp_id=data["ttp_id"],
        executed_at=_parse_dt(data.get("executed_at")),
        tool_used=data.get("tool_used"),
        command_used=data.get("command_used"),
        source=data.get("source"),
        destination=data.get("destination"),
        red_notes=data.get("red_notes"),
        detected=data.get("detected"),
        detected_at=_parse_dt(data.get("detected_at")),
        detection_method=data.get("detection_method"),
        alert_name=data.get("alert_name"),
        response_action=data.get("response_action"),
        blue_notes=data.get("blue_notes"),
        outcome=data.get("outcome"),
        gap_identified=data.get("gap_identified"),
        attack_path_include=include,
        attack_path_step=step,
    )
    db.session.add(entry)
    db.session.flush()
    set_tags(entry, data.get("tag_ids"))
    db.session.commit()
    return entry


def update_entry(entry_id, data):
    entry = ExerciseEntry.query.get_or_404(entry_id)
    simple_fields = (
        "tool_used", "command_used", "source", "destination", "red_notes",
        "detected", "detection_method", "alert_name",
        "response_action", "blue_notes", "outcome", "gap_identified",
    )
    for field in simple_fields:
        if field in data:
            setattr(entry, field, data[field])
    if "executed_at" in data:
        entry.executed_at = _parse_dt(data["executed_at"])
    if "detected_at" in data:
        entry.detected_at = _parse_dt(data["detected_at"])
    if "attack_path_include" in data:
        include = bool(data["attack_path_include"])
        entry.attack_path_include = include
        if include:
            if data.get("attack_path_step"):
                entry.attack_path_step = int(data["attack_path_step"])
            elif not entry.attack_path_step:
                entry.attack_path_step = _next_attack_step(entry.exercise_id)
        else:
            entry.attack_path_step = None
    elif "attack_path_step" in data and entry.attack_path_include:
        entry.attack_path_step = int(data["attack_path_step"]) if data["attack_path_step"] else None
    set_tags(entry, data.get("tag_ids"))
    db.session.commit()
    return entry


def reorder_attack_path(exercise_id, steps):
    """steps: list of {entry_id, attack_path_step}"""
    for item in steps:
        entry = ExerciseEntry.query.filter_by(id=item["entry_id"], exercise_id=exercise_id).first()
        if entry:
            entry.attack_path_step = item["attack_path_step"]
    db.session.commit()


def remove_from_attack_path(entry_id):
    entry = ExerciseEntry.query.get_or_404(entry_id)
    entry.attack_path_include = False
    entry.attack_path_step = None
    db.session.commit()
    return entry


def delete_entry(entry_id):
    entry = ExerciseEntry.query.get_or_404(entry_id)
    db.session.delete(entry)
    db.session.commit()


def _parse_dt(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None
