from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services import tag_service
from app.utils.auth import require_roles, ADMIN, RED

bp = Blueprint("tags", __name__, url_prefix="/api/tags")


@bp.get("/")
@jwt_required()
def list_tags():
    return jsonify({"data": [t.to_dict() for t in tag_service.list_tags()]})


@bp.post("/")
@require_roles(ADMIN, RED)
def create_tag():
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    tag = tag_service.create_tag(data)
    return jsonify(tag.to_dict()), 201


@bp.put("/<int:tag_id>")
@require_roles(ADMIN, RED)
def update_tag(tag_id):
    data = request.get_json() or {}
    tag = tag_service.update_tag(tag_id, data)
    return jsonify(tag.to_dict())


@bp.delete("/<int:tag_id>")
@require_roles(ADMIN)
def delete_tag(tag_id):
    tag_service.delete_tag(tag_id)
    return jsonify({}), 204
