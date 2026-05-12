from datetime import datetime, timezone
from app.extensions import db


class TTP(db.Model):
    __tablename__ = "ttps"

    id = db.Column(db.Integer, primary_key=True)
    mitre_id = db.Column(db.String(20), nullable=False, unique=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    tactic = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text)
    platform = db.Column(db.String(200))
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    entries = db.relationship("ExerciseEntry", back_populates="ttp", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "mitre_id": self.mitre_id,
            "name": self.name,
            "tactic": self.tactic,
            "description": self.description,
            "platform": self.platform,
        }
