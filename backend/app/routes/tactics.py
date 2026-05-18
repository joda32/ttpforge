from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.services import tactic_service

bp = Blueprint("tactics", __name__, url_prefix="/api/tactics")


@bp.get("/")
@jwt_required()
def list_tactics():
    framework = request.args.get("framework")
    return jsonify({"data": tactic_service.list_tactics(framework=framework)})
