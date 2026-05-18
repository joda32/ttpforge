from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app.extensions import db
from app.models.exercise_entry import ExerciseEntry
from app.models.ttp import TTP
from app.services import ttp_service
from app.utils.auth import require_roles, ADMIN

bp = Blueprint("ttps", __name__, url_prefix="/api/ttps")


@bp.get("/coverage")
@jwt_required()
def get_coverage():
    rows = (
        db.session.query(
            TTP.mitre_id,
            ExerciseEntry.outcome,
            func.count(ExerciseEntry.id).label("cnt"),
        )
        .join(ExerciseEntry, TTP.id == ExerciseEntry.ttp_id)
        .group_by(TTP.mitre_id, ExerciseEntry.outcome)
        .all()
    )

    coverage = {}
    for mitre_id, outcome, cnt in rows:
        if mitre_id not in coverage:
            coverage[mitre_id] = {"total": 0, "detected": 0, "missed": 0, "partial": 0}
        coverage[mitre_id]["total"] += cnt
        if outcome in ("detected", "missed", "partial"):
            coverage[mitre_id][outcome] += cnt

    return jsonify(coverage)


@bp.get("/")
@jwt_required()
def list_ttps():
    search    = request.args.get("search")
    tactic    = request.args.get("tactic")
    platform  = request.args.get("platform")
    framework = request.args.get("framework")
    ttps    = ttp_service.list_ttps(search=search, tactic=tactic, platform=platform, framework=framework)
    tactics = ttp_service.get_distinct_tactics(framework=framework)
    return jsonify({"data": [t.to_dict() for t in ttps], "total": len(ttps), "tactics": tactics})


@bp.post("/")
@require_roles(ADMIN)
def create_ttp():
    data = request.get_json() or {}
    for required in ("mitre_id", "name", "tactic"):
        if not data.get(required):
            return jsonify({"error": f"{required} is required"}), 400
    ttp = ttp_service.create_ttp(data)
    return jsonify(ttp.to_dict()), 201


@bp.get("/<int:ttp_id>")
@jwt_required()
def get_ttp(ttp_id):
    ttp = ttp_service.get_ttp(ttp_id)
    return jsonify(ttp.to_dict())


@bp.put("/<int:ttp_id>")
@require_roles(ADMIN)
def update_ttp(ttp_id):
    data = request.get_json() or {}
    ttp = ttp_service.update_ttp(ttp_id, data)
    return jsonify(ttp.to_dict())


@bp.delete("/<int:ttp_id>")
@require_roles(ADMIN)
def delete_ttp(ttp_id):
    ttp_service.delete_ttp(ttp_id)
    return jsonify({}), 204
