from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

ALLOWED_SIGNUP_ROLES = {"red_team", "blue_team"}


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is disabled"}), 403

    if not user.is_approved:
        return jsonify({"error": "Account is pending approval by an administrator"}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()})


@bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    email    = (data.get("email") or "").strip() or None
    role     = (data.get("role") or "").strip()

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    if role not in ALLOWED_SIGNUP_ROLES:
        return jsonify({"error": "role must be red_team or blue_team"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 409

    user = User(username=username, email=email, role=role, is_approved=False)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Account created. Awaiting administrator approval."}), 201


@bp.get("/me")
@jwt_required()
def me():
    from app.utils.auth import current_user
    user = current_user()
    if not user or not user.is_active:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(user.to_dict())


@bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"message": "Logged out"})
