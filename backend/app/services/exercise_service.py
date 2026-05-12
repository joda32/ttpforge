from datetime import date
from app.extensions import db
from app.models.exercise import Exercise
from app.models.exercise_entry import ExerciseEntry


def list_exercises():
    return Exercise.query.order_by(Exercise.created_at.desc()).all()


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

    return {
        "exercise_id": exercise_id,
        "total_entries": total,
        "detected": detected_count,
        "missed": missed_count,
        "partial": partial_count,
        "detection_rate": round(detected_count / total, 3) if total else 0,
        "avg_time_to_detect_minutes": avg_time,
        "tactic_breakdown": tactic_breakdown,
    }


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)
