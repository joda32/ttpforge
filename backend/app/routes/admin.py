from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.user import User
from app.utils.auth import require_roles, ADMIN

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

VALID_ROLES = {"admin", "red_team", "blue_team"}


@bp.get("/users")
@require_roles(ADMIN)
def list_users():
    users = User.query.order_by(User.is_approved, User.created_at).all()
    return jsonify({"data": [u.to_dict() for u in users]})


@bp.put("/users/<int:user_id>")
@require_roles(ADMIN)
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(silent=True) or {}

    if "role" in data:
        if data["role"] not in VALID_ROLES:
            return jsonify({"error": "Invalid role"}), 400
        user.role = data["role"]

    if "is_approved" in data:
        user.is_approved = bool(data["is_approved"])

    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    if "email" in data:
        email = (data["email"] or "").strip() or None
        if email and email != user.email:
            if User.query.filter(User.email == email, User.id != user_id).first():
                return jsonify({"error": "Email already in use by another account"}), 409
        user.email = email

    if "password" in data:
        password = data["password"]
        if not password or len(password) < 1:
            return jsonify({"error": "Password cannot be empty"}), 400
        user.set_password(password)

    db.session.commit()
    return jsonify(user.to_dict())


@bp.delete("/users/<int:user_id>")
@require_roles(ADMIN)
def delete_user(user_id):
    from app.utils.auth import current_user
    user = User.query.get_or_404(user_id)
    if user.id == current_user().id:
        return jsonify({"error": "Cannot delete your own account"}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({}), 204
