import base64
from datetime import datetime, timezone
from app.extensions import db


class EntryImage(db.Model):
    __tablename__ = "entry_images"

    id = db.Column(db.Integer, primary_key=True)
    entry_id = db.Column(
        db.Integer,
        db.ForeignKey("exercise_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = db.Column(db.String(255), nullable=False, default="image.png")
    mime_type = db.Column(db.String(50), nullable=False, default="image/png")
    data = db.Column(db.LargeBinary, nullable=False)
    caption = db.Column(db.String(500))
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "entry_id": self.entry_id,
            "filename": self.filename,
            "mime_type": self.mime_type,
            "data_url": f"data:{self.mime_type};base64,{base64.b64encode(self.data).decode()}",
            "caption": self.caption,
            "created_at": self.created_at.isoformat(),
        }
