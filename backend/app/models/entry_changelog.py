from app.extensions import db


class EntryChangeLog(db.Model):
    __tablename__ = "entry_change_logs"

    id         = db.Column(db.Integer, primary_key=True)
    entry_id   = db.Column(
        db.Integer,
        db.ForeignKey("exercise_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id    = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    field_name = db.Column(db.String(100), nullable=False)
    old_value  = db.Column(db.Text, nullable=True)
    new_value  = db.Column(db.Text, nullable=True)
    changed_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.func.now(),
        nullable=False,
    )

    user = db.relationship("User", lazy="joined")

    def to_dict(self):
        return {
            "id":         self.id,
            "entry_id":   self.entry_id,
            "user_id":    self.user_id,
            "username":   self.user.username if self.user else "unknown",
            "field_name": self.field_name,
            "old_value":  self.old_value,
            "new_value":  self.new_value,
            "changed_at": self.changed_at.isoformat(),
        }
