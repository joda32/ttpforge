from flask import Blueprint, jsonify
from app.services import mitre_service
from app.utils.auth import require_roles, ADMIN

bp = Blueprint("mitre", __name__, url_prefix="/api/mitre")


@bp.post("/refresh")
@require_roles(ADMIN)
def refresh():
    try:
        result = mitre_service.refresh_all()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
