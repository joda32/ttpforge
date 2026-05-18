from datetime import date
from sqlalchemy import func
from app.extensions import db
from app.models.exercise import Exercise
from app.models.exercise_entry import ExerciseEntry
from app.services.tag_service import set_tags


def list_exercises():
    last_entry_sq = (
        db.session.query(
            ExerciseEntry.exercise_id,
            func.max(ExerciseEntry.updated_at).label("last_entry_at"),
        )
        .group_by(ExerciseEntry.exercise_id)
        .subquery()
    )

    rows = (
        db.session.query(Exercise, last_entry_sq.c.last_entry_at)
        .outerjoin(last_entry_sq, Exercise.id == last_entry_sq.c.exercise_id)
        .order_by(Exercise.created_at.desc())
        .all()
    )

    exercises = []
    for ex, last_entry_at in rows:
        d = ex.to_dict()
        d["last_entry_at"] = last_entry_at.isoformat() if last_entry_at else None
        exercises.append(d)
    return exercises


def get_exercise(exercise_id):
    return Exercise.query.get_or_404(exercise_id)


def create_exercise(data):
    exercise = Exercise(
        name=data["name"],
        description=data.get("description"),
        start_date=_parse_date(data.get("start_date")),
        end_date=_parse_date(data.get("end_date")),
        status=data.get("status", "planned"),
    )
    db.session.add(exercise)
    db.session.flush()
    set_tags(exercise, data.get("tag_ids"))
    db.session.commit()
    return exercise


def update_exercise(exercise_id, data):
    exercise = Exercise.query.get_or_404(exercise_id)
    for field in ("name", "description", "status"):
        if field in data:
            setattr(exercise, field, data[field])
    if "start_date" in data:
        exercise.start_date = _parse_date(data["start_date"])
    if "end_date" in data:
        exercise.end_date = _parse_date(data["end_date"])
    set_tags(exercise, data.get("tag_ids"))
    db.session.commit()
    return exercise


def delete_exercise(exercise_id):
    exercise = Exercise.query.get_or_404(exercise_id)
    db.session.delete(exercise)
    db.session.commit()


def get_summary(exercise_id):
    Exercise.query.get_or_404(exercise_id)

    entries = (
        ExerciseEntry.query
        .filter_by(exercise_id=exercise_id)
        .join(ExerciseEntry.ttp)
        .all()
    )

    total = len(entries)
    detected_count = sum(1 for e in entries if e.outcome == "detected")
    missed_count = sum(1 for e in entries if e.outcome == "missed")
    partial_count = sum(1 for e in entries if e.outcome == "partial")

    times = [e.time_to_detect_minutes() for e in entries if e.time_to_detect_minutes() is not None]
    avg_time = round(sum(times) / len(times), 1) if times else None

    tactic_map = {}
    for entry in entries:
        tactic = entry.ttp.tactic if entry.ttp else "Unknown"
        if tactic not in tactic_map:
            tactic_map[tactic] = {"total": 0, "detected": 0}
        tactic_map[tactic]["total"] += 1
        if entry.outcome == "detected":
            tactic_map[tactic]["detected"] += 1

    tactic_breakdown = {
        tactic: {
            **counts,
            "detection_rate": round(counts["detected"] / counts["total"], 3) if counts["total"] else 0,
        }
        for tactic, counts in tactic_map.items()
    }

    last_entry_at = None
    if entries:
        latest = max((e.updated_at for e in entries if e.updated_at), default=None)
        if latest:
            last_entry_at = latest.isoformat()

    return {
        "exercise_id": exercise_id,
        "total_entries": total,
        "detected": detected_count,
        "missed": missed_count,
        "partial": partial_count,
        "detection_rate": round(detected_count / total, 3) if total else 0,
        "avg_time_to_detect_minutes": avg_time,
        "tactic_breakdown": tactic_breakdown,
        "last_entry_at": last_entry_at,
    }


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)
