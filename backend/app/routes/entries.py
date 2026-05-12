from flask import Blueprint, jsonify, request
from app.services import entry_service

bp = Blueprint("entries", __name__, url_prefix="/api/entries")


@bp.post("/")
def create_entry():
    data = request.get_json() or {}
    for required in ("exercise_id", "ttp_id"):
        if not data.get(required):
            return jsonify({"error": f"{required} is required"}), 400
    entry = entry_service.create_entry(data)
    return jsonify(entry.to_dict()), 201


@bp.get("/<int:entry_id>")
def get_entry(entry_id):
    entry = entry_service.get_entry(entry_id)
    return jsonify(entry.to_dict())


@bp.put("/<int:entry_id>")
def update_entry(entry_id):
    data = request.get_json() or {}
    entry = entry_service.update_entry(entry_id, data)
    return jsonify(entry.to_dict())


@bp.delete("/<int:entry_id>")
def delete_entry(entry_id):
    entry_service.delete_entry(entry_id)
    return jsonify({}), 204
