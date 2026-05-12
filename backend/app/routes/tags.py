from flask import Blueprint, jsonify, request
from app.services import tag_service

bp = Blueprint("tags", __name__, url_prefix="/api/tags")


@bp.get("/")
def list_tags():
    return jsonify({"data": [t.to_dict() for t in tag_service.list_tags()]})


@bp.post("/")
def create_tag():
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    tag = tag_service.create_tag(data)
    return jsonify(tag.to_dict()), 201


@bp.put("/<int:tag_id>")
def update_tag(tag_id):
    data = request.get_json() or {}
    tag = tag_service.update_tag(tag_id, data)
    return jsonify(tag.to_dict())


@bp.delete("/<int:tag_id>")
def delete_tag(tag_id):
    tag_service.delete_tag(tag_id)
    return jsonify({}), 204
