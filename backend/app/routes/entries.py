from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services import entry_service
from app.utils.auth import require_roles, current_user, ADMIN, RED

bp = Blueprint("entries", __name__, url_prefix="/api/entries")


@bp.post("/")
@require_roles(ADMIN, RED)
def create_entry():
    data = request.get_json() or {}
    for required in ("exercise_id", "ttp_id"):
        if not data.get(required):
            return jsonify({"error": f"{required} is required"}), 400
    entry = entry_service.create_entry(data)
    return jsonify(entry.to_dict()), 201


@bp.get("/<int:entry_id>")
@jwt_required()
def get_entry(entry_id):
    entry = entry_service.get_entry(entry_id)
    return jsonify(entry.to_dict())


@bp.put("/<int:entry_id>")
@jwt_required()
def update_entry(entry_id):
    data = request.get_json() or {}
    user = current_user()
    if not user or not user.is_approved or not user.is_active:
        return jsonify({"error": "Unauthorized"}), 403
    entry = entry_service.update_entry(entry_id, data, role=user.role)
    return jsonify(entry.to_dict())


@bp.delete("/<int:entry_id>")
@require_roles(ADMIN, RED)
def delete_entry(entry_id):
    entry_service.delete_entry(entry_id)
    return jsonify({}), 204
