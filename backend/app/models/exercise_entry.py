from datetime import datetime, timezone
from app.extensions import db


class ExerciseEntry(db.Model):
    __tablename__ = "exercise_entries"

    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(
        db.Integer,
        db.ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ttp_id = db.Column(
        db.Integer, db.ForeignKey("ttps.id"), nullable=False, index=True
    )

    # Red team
    executed_at = db.Column(db.DateTime(timezone=True))
    tool_used = db.Column(db.String(200))
    command_used = db.Column(db.Text)
    source = db.Column(db.String(200))
    destination = db.Column(db.String(200))
    red_notes = db.Column(db.Text)

    # Blue team
    detected = db.Column(db.Boolean)
    detected_at = db.Column(db.DateTime(timezone=True))
    detection_method = db.Column(db.String(200))
    alert_name = db.Column(db.String(200))
    response_action = db.Column(db.Text)
    blue_notes = db.Column(db.Text)

    # Outcome
    outcome = db.Column(
        db.Enum("detected", "missed", "partial", name="outcome_enum")
    )
    gap_identified = db.Column(db.Text)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    exercise = db.relationship("Exercise", back_populates="entries")
    ttp = db.relationship("TTP", back_populates="entries")

    def time_to_detect_minutes(self):
        if self.executed_at and self.detected_at:
            delta = self.detected_at - self.executed_at
            return round(delta.total_seconds() / 60, 1)
        return None

    def to_dict(self):
        return {
            "id": self.id,
            "exercise_id": self.exercise_id,
            "ttp_id": self.ttp_id,
            "ttp": self.ttp.to_dict() if self.ttp else None,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "tool_used": self.tool_used,
            "command_used": self.command_used,
            "source": self.source,
            "destination": self.destination,
            "red_notes": self.red_notes,
            "detected": self.detected,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "detection_method": self.detection_method,
            "alert_name": self.alert_name,
            "response_action": self.response_action,
            "blue_notes": self.blue_notes,
            "outcome": self.outcome,
            "gap_identified": self.gap_identified,
            "time_to_detect_minutes": self.time_to_detect_minutes(),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
