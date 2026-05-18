from app.extensions import db


class AppSetting(db.Model):
    __tablename__ = "app_settings"

    key   = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=True)

    @classmethod
    def get(cls, key, default=None):
        row = cls.query.get(key)
        return row.value if row else default

    @classmethod
    def set(cls, key, value):
        row = cls.query.get(key)
        if row:
            row.value = value
        else:
            db.session.add(cls(key=key, value=value))
