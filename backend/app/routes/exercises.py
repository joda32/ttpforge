from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services import exercise_service
from app.utils.auth import require_roles, ADMIN, RED

bp = Blueprint("exercises", __name__, url_prefix="/api/exercises")


@bp.get("/")
@jwt_required()
def list_exercises():
    exercises = exercise_service.list_exercises()
    return jsonify({"data": [e.to_dict() for e in exercises], "total": len(exercises)})


@bp.post("/")
@require_roles(ADMIN, RED)
def create_exercise():
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    exercise = exercise_service.create_exercise(data)
    return jsonify(exercise.to_dict()), 201


@bp.get("/<int:exercise_id>")
@jwt_required()
def get_exercise(exercise_id):
    exercise = exercise_service.get_exercise(exercise_id)
    return jsonify(exercise.to_dict())


@bp.put("/<int:exercise_id>")
@require_roles(ADMIN, RED)
def update_exercise(exercise_id):
    data = request.get_json() or {}
    exercise = exercise_service.update_exercise(exercise_id, data)
    return jsonify(exercise.to_dict())


@bp.delete("/<int:exercise_id>")
@require_roles(ADMIN)
def delete_exercise(exercise_id):
    exercise_service.delete_exercise(exercise_id)
    return jsonify({}), 204


@bp.get("/<int:exercise_id>/summary")
@jwt_required()
def get_summary(exercise_id):
    summary = exercise_service.get_summary(exercise_id)
    return jsonify(summary)


@bp.get("/<int:exercise_id>/entries")
@jwt_required()
def get_entries(exercise_id):
    from app.services import entry_service
    outcome = request.args.get("outcome")
    tactic = request.args.get("tactic")
    entries = entry_service.list_entries(exercise_id, outcome=outcome, tactic=tactic)
    return jsonify({"data": [e.to_dict() for e in entries], "total": len(entries)})


@bp.post("/<int:exercise_id>/import-template")
@require_roles(ADMIN, RED)
def import_template(exercise_id):
    from app.extensions import db
    from app.models import Exercise, ExerciseEntry
    from app.models.ttp import TTP

    if not Exercise.query.get(exercise_id):
        return jsonify({"error": "Exercise not found"}), 404

    body = request.get_json(silent=True) or {}
    items = body.get("entries", [])
    if not isinstance(items, list):
        return jsonify({"error": "entries must be a list"}), 400

    imported, skipped = [], []
    for item in items:
        mitre_id = (item.get("mitre_id") or "").strip()
        if not mitre_id:
            skipped.append({"mitre_id": mitre_id, "reason": "missing mitre_id"})
            continue
        ttp = TTP.query.filter_by(mitre_id=mitre_id).first()
        if not ttp:
            skipped.append({"mitre_id": mitre_id, "reason": "TTP not found in library"})
            continue
        entry = ExerciseEntry(
            exercise_id=exercise_id,
            ttp_id=ttp.id,
            tool_used=item.get("tool_used") or None,
            command_used=item.get("command_used") or None,
        )
        db.session.add(entry)
        imported.append(mitre_id)

    db.session.commit()
    return jsonify({"imported": len(imported), "skipped": skipped}), 201


@bp.post("/<int:exercise_id>/import-navigator")
@require_roles(ADMIN, RED)
def import_navigator_layer(exercise_id):
    from app.extensions import db
    from app.models import Exercise, ExerciseEntry
    from app.models.ttp import TTP
    from sqlalchemy import func

    if not Exercise.query.get(exercise_id):
        return jsonify({"error": "Exercise not found"}), 404

    body = request.get_json(silent=True) or {}
    techniques = body.get("techniques")
    if not isinstance(techniques, list):
        return jsonify({"error": "Invalid Navigator layer: missing 'techniques' array"}), 400

    max_step = db.session.query(func.max(ExerciseEntry.attack_path_step)).filter(
        ExerciseEntry.exercise_id == exercise_id,
        ExerciseEntry.attack_path_include == True,
    ).scalar() or 0

    imported, skipped = [], []
    for tech in techniques:
        if tech.get("enabled") is False:
            continue
        mitre_id = (tech.get("techniqueID") or "").strip().upper()
        if not mitre_id:
            continue

        ttp = TTP.query.filter(func.upper(TTP.mitre_id) == mitre_id).first()
        if not ttp and "." in mitre_id:
            parent_id = mitre_id.split(".")[0]
            ttp = TTP.query.filter(func.upper(TTP.mitre_id) == parent_id).first()

        if not ttp:
            skipped.append({"mitre_id": mitre_id, "reason": "TTP not found in library"})
            continue

        max_step += 1
        entry = ExerciseEntry(
            exercise_id=exercise_id,
            ttp_id=ttp.id,
            red_notes=tech.get("comment") or None,
            attack_path_include=True,
            attack_path_step=max_step,
        )
        db.session.add(entry)
        imported.append(mitre_id)

    db.session.commit()
    return jsonify({"imported": len(imported), "skipped": skipped}), 201


@bp.patch("/<int:exercise_id>/attack-path")
@require_roles(ADMIN, RED)
def reorder_attack_path(exercise_id):
    from app.services import entry_service
    from app.models import Exercise
    if not Exercise.query.get(exercise_id):
        return jsonify({"error": "Exercise not found"}), 404
    body = request.get_json(silent=True) or {}
    steps = body.get("steps", [])
    entry_service.reorder_attack_path(exercise_id, steps)
    return jsonify({"ok": True})


@bp.delete("/<int:exercise_id>/attack-path/<int:entry_id>")
@require_roles(ADMIN, RED)
def remove_from_attack_path(exercise_id, entry_id):
    from app.services import entry_service
    entry = entry_service.remove_from_attack_path(entry_id)
    return jsonify(entry.to_dict())
