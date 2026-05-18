from sqlalchemy import func
from app.extensions import db
from app.models.tactic import Tactic, ttp_tactics


def list_tactics(framework=None):
    counts = (
        db.session.query(
            ttp_tactics.c.tactic_id,
            func.count(ttp_tactics.c.ttp_id).label("cnt"),
        )
        .group_by(ttp_tactics.c.tactic_id)
        .subquery()
    )

    q = db.session.query(Tactic, counts.c.cnt).outerjoin(counts, Tactic.id == counts.c.tactic_id)
    if framework:
        q = q.filter(Tactic.framework == framework)

    rows = q.order_by(Tactic.mitre_id).all()
    return [{**tactic.to_dict(), "technique_count": cnt or 0} for tactic, cnt in rows]
