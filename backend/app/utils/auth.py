from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

ADMIN = "admin"
RED   = "red_team"
BLUE  = "blue_team"


def current_user():
    from app.models.user import User
    return User.query.get(int(get_jwt_identity()))


def require_roles(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = current_user()
            if not user or not user.is_approved or not user.is_active:
                return jsonify({"error": "Unauthorized"}), 403
            if roles and user.role not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
