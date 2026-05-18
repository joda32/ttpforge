from flask import Blueprint, jsonify, request
from app.services import mitre_service
from app.utils.auth import require_roles, ADMIN

bp = Blueprint("mitre", __name__, url_prefix="/api/mitre")

VALID_FRAMEWORKS = {"enterprise", "ics", "mobile"}


@bp.post("/refresh")
@require_roles(ADMIN)
def refresh():
    framework = request.args.get("framework") or (request.get_json() or {}).get("framework")
    if framework and framework not in VALID_FRAMEWORKS:
        return jsonify({"error": f"Invalid framework. Must be one of: {', '.join(VALID_FRAMEWORKS)}"}), 400
    try:
        result = mitre_service.refresh_all(framework=framework)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
