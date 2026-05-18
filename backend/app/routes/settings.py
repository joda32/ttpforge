from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.app_setting import AppSetting
from app.utils.auth import require_roles, ADMIN

bp = Blueprint("settings", __name__, url_prefix="/api/settings")

# Keys that are allowed to be read/written via the API
ALLOWED_KEYS = {"mitre_tactics_url", "mitre_techniques_url"}


@bp.get("/")
@require_roles(ADMIN)
def get_settings():
    rows = AppSetting.query.filter(AppSetting.key.in_(ALLOWED_KEYS)).all()
    data = {r.key: r.value for r in rows}
    return jsonify(data)


@bp.put("/")
@require_roles(ADMIN)
def update_settings():
    data = request.get_json() or {}
    for key, value in data.items():
        if key not in ALLOWED_KEYS:
            continue
        AppSetting.set(key, value)
    db.session.commit()
    rows = AppSetting.query.filter(AppSetting.key.in_(ALLOWED_KEYS)).all()
    return jsonify({r.key: r.value for r in rows})
