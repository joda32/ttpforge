from flask import Blueprint, jsonify
from app.services import mitre_service

bp = Blueprint("mitre", __name__, url_prefix="/api/mitre")


@bp.post("/refresh")
def refresh():
    try:
        result = mitre_service.refresh_all()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
