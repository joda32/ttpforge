from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models import EntryImage, ExerciseEntry
from app.utils.auth import require_roles, ADMIN, RED

bp = Blueprint("images", __name__, url_prefix="/api/images")

MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@bp.post("/")
@require_roles(ADMIN, RED)
def upload():
    entry_id = request.form.get("entry_id", type=int)
    if not entry_id:
        return jsonify({"error": "entry_id required"}), 400
    if not ExerciseEntry.query.get(entry_id):
        return jsonify({"error": "Entry not found"}), 404

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file required"}), 400
    if not file.mimetype.startswith("image/"):
        return jsonify({"error": "Only image files are accepted"}), 400

    data = file.read()
    if len(data) > MAX_SIZE:
        return jsonify({"error": "File exceeds 10 MB limit"}), 413

    img = EntryImage(
        entry_id=entry_id,
        filename=file.filename or "image.png",
        mime_type=file.mimetype,
        data=data,
    )
    db.session.add(img)
    db.session.commit()
    return jsonify(img.to_dict()), 201


@bp.get("/")
@jwt_required()
def list_images():
    entry_id = request.args.get("entry_id", type=int)
    if not entry_id:
        return jsonify({"error": "entry_id required"}), 400
    images = EntryImage.query.filter_by(entry_id=entry_id).order_by(EntryImage.created_at).all()
    return jsonify([img.to_dict() for img in images])


@bp.patch("/<int:image_id>")
@require_roles(ADMIN, RED)
def update_image(image_id):
    img = EntryImage.query.get_or_404(image_id)
    body = request.get_json(silent=True) or {}
    if "caption" in body:
        img.caption = body["caption"] or None
    db.session.commit()
    return jsonify(img.to_dict())


@bp.delete("/<int:image_id>")
@require_roles(ADMIN, RED)
def delete_image(image_id):
    img = EntryImage.query.get_or_404(image_id)
    db.session.delete(img)
    db.session.commit()
    return "", 204
