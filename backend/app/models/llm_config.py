from app.extensions import db


class LLMConfig(db.Model):
    __tablename__ = "llm_configs"

    id          = db.Column(db.Integer, primary_key=True)
    provider    = db.Column(db.String(20), nullable=False, default="anthropic")
    model       = db.Column(db.String(100), nullable=False, default="claude-opus-4-7")
    api_key     = db.Column(db.Text, nullable=True)
    base_url    = db.Column(db.String(255), nullable=True)
    max_tokens  = db.Column(db.Integer, nullable=False, default=8192)
    is_active   = db.Column(db.Boolean, nullable=False, default=True)
    updated_at  = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self, include_key=False):
        d = {
            "id":         self.id,
            "provider":   self.provider,
            "model":      self.model,
            "api_key_set": bool(self.api_key),
            "base_url":   self.base_url,
            "max_tokens": self.max_tokens,
            "is_active":  self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_key:
            d["api_key"] = self.api_key
        return d
