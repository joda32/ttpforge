from app.extensions import db
from app.models.ttp import TTP


def list_ttps(search=None, tactic=None, platform=None, framework=None):
    q = TTP.query
    if search:
        term = f"%{search}%"
        q = q.filter(
            db.or_(TTP.name.ilike(term), TTP.mitre_id.ilike(term), TTP.description.ilike(term))
        )
    if tactic:
        q = q.filter(TTP.tactic == tactic)
    if platform:
        q = q.filter(TTP.platform.ilike(f"%{platform}%"))
    if framework:
        q = q.filter(TTP.framework == framework)
    ttps = q.order_by(TTP.tactic, TTP.mitre_id).all()
    return ttps


def get_ttp(ttp_id):
    return TTP.query.get_or_404(ttp_id)


def create_ttp(data):
    ttp = TTP(
        mitre_id=data["mitre_id"],
        name=data["name"],
        tactic=data["tactic"],
        description=data.get("description"),
        platform=data.get("platform"),
        framework=data.get("framework", "enterprise"),
    )
    db.session.add(ttp)
    db.session.commit()
    return ttp


def update_ttp(ttp_id, data):
    ttp = TTP.query.get_or_404(ttp_id)
    for field in ("name", "tactic", "description", "platform"):
        if field in data:
            setattr(ttp, field, data[field])
    db.session.commit()
    return ttp


def delete_ttp(ttp_id):
    ttp = TTP.query.get_or_404(ttp_id)
    db.session.delete(ttp)
    db.session.commit()


def get_distinct_tactics(framework=None):
    q = db.session.query(TTP.tactic).distinct()
    if framework:
        q = q.filter(TTP.framework == framework)
    return [r[0] for r in q.order_by(TTP.tactic).all()]
