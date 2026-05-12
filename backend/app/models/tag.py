from datetime import datetime, timezone
from app.extensions import db

exercise_tags = db.Table(
    "exercise_tags",
    db.Column("exercise_id", db.Integer, db.ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

entry_tags = db.Table(
    "entry_tags",
    db.Column("entry_id", db.Integer, db.ForeignKey("exercise_entries.id", ondelete="CASCADE"), primary_key=True),
    db.Column("tag_id", db.Integer, db.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    color = db.Column(db.String(7), nullable=False, default="#6366f1")
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {"id": self.id, "name": self.name, "color": self.color}
