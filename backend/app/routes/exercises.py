from flask import Blueprint, jsonify, request
from app.services import exercise_service

bp = Blueprint("exercises", __name__, url_prefix="/api/exercises")


@bp.get("/")
def list_exercises():
    exercises = exercise_service.list_exercises()
    return jsonify({"data": [e.to_dict() for e in exercises], "total": len(exercises)})


@bp.post("/")
def create_exercise():
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    exercise = exercise_service.create_exercise(data)
    return jsonify(exercise.to_dict()), 201


@bp.get("/<int:exercise_id>")
def get_exercise(exercise_id):
    exercise = exercise_service.get_exercise(exercise_id)
    return jsonify(exercise.to_dict())


@bp.put("/<int:exercise_id>")
def update_exercise(exercise_id):
    data = request.get_json() or {}
    exercise = exercise_service.update_exercise(exercise_id, data)
    return jsonify(exercise.to_dict())


@bp.delete("/<int:exercise_id>")
def delete_exercise(exercise_id):
    exercise_service.delete_exercise(exercise_id)
    return jsonify({}), 204


@bp.get("/<int:exercise_id>/summary")
def get_summary(exercise_id):
    summary = exercise_service.get_summary(exercise_id)
    return jsonify(summary)


@bp.get("/<int:exercise_id>/entries")
def get_entries(exercise_id):
    from app.services import entry_service
    outcome = request.args.get("outcome")
    tactic = request.args.get("tactic")
    entries = entry_service.list_entries(exercise_id, outcome=outcome, tactic=tactic)
    return jsonify({"data": [e.to_dict() for e in entries], "total": len(entries)})
