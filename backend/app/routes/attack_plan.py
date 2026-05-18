from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.llm_config import LLMConfig
from app.utils.auth import require_roles, ADMIN, RED
from app.services import attack_plan_service

bp = Blueprint("attack_plan", __name__, url_prefix="/api/attack-plan")


# ── LLM config ────────────────────────────────────────────────────────────────

@bp.get("/config")
@require_roles(ADMIN)
def get_config():
    cfg = LLMConfig.query.filter_by(is_active=True).first()
    if not cfg:
        return jsonify(None)
    return jsonify(cfg.to_dict())


@bp.put("/config")
@require_roles(ADMIN)
def update_config():
    data = request.get_json() or {}
    cfg = LLMConfig.query.filter_by(is_active=True).first()
    if not cfg:
        cfg = LLMConfig()
        db.session.add(cfg)

    if "provider" in data:
        cfg.provider = data["provider"]
    if "model" in data:
        cfg.model = data["model"]
    if "api_key" in data and data["api_key"]:
        cfg.api_key = data["api_key"]
    if "base_url" in data:
        cfg.base_url = data["base_url"] or None
    if "max_tokens" in data:
        cfg.max_tokens = int(data["max_tokens"])

    db.session.commit()
    return jsonify(cfg.to_dict())


# ── analyze report ────────────────────────────────────────────────────────────

@bp.post("/analyze")
@require_roles(ADMIN, RED)
def analyze():
    source_type = request.form.get("source_type") or (request.get_json() or {}).get("source_type")

    if source_type == "pdf":
        f = request.files.get("file")
        if not f:
            return jsonify({"error": "file is required for pdf source"}), 400
        content = f.read()
    elif source_type == "url":
        body = request.get_json() or {}
        content = body.get("url", "")
        if not content:
            return jsonify({"error": "url is required"}), 400
    elif source_type == "text":
        body = request.get_json() or {}
        content = body.get("text", "")
        if not content:
            # fallback: form field
            content = request.form.get("text", "")
        if not content:
            return jsonify({"error": "text is required"}), 400
    else:
        return jsonify({"error": "source_type must be url, pdf, or text"}), 400

    try:
        result = attack_plan_service.analyze_report(source_type, content)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {e}"}), 500

    return jsonify(result)


# ── convert plan to exercise ──────────────────────────────────────────────────

@bp.post("/convert")
@require_roles(ADMIN, RED)
def convert():
    data = request.get_json() or {}
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400
    if not data.get("ttps"):
        return jsonify({"error": "ttps list is required"}), 400

    try:
        exercise = attack_plan_service.create_exercise_from_plan(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"exercise_id": exercise.id, "name": exercise.name}), 201
