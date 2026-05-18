from app.extensions import db

ttp_tactics = db.Table(
    "ttp_tactics",
    db.Column("ttp_id", db.Integer, db.ForeignKey("ttps.id", ondelete="CASCADE"), primary_key=True),
    db.Column("tactic_id", db.Integer, db.ForeignKey("tactics.id", ondelete="CASCADE"), primary_key=True),
)


class Tactic(db.Model):
    __tablename__ = "tactics"

    id = db.Column(db.Integer, primary_key=True)
    mitre_id = db.Column(db.String(20), nullable=False, unique=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    framework = db.Column(db.String(20), nullable=False, default="enterprise")

    def to_dict(self):
        return {"id": self.id, "mitre_id": self.mitre_id, "name": self.name, "framework": self.framework}
