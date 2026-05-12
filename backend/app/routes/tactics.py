from flask import Blueprint, jsonify
from app.services import tactic_service

bp = Blueprint("tactics", __name__, url_prefix="/api/tactics")


@bp.get("/")
def list_tactics():
    return jsonify({"data": tactic_service.list_tactics()})
