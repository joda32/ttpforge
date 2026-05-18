from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db, migrate, jwt


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173"])

    # Import models so Alembic can detect them
    from app.models import Exercise, TTP, ExerciseEntry, User, LLMConfig, AppSetting  # noqa: F401

    from app.routes import register_blueprints
    register_blueprints(app)

    _register_cli(app)

    return app


def _register_cli(app):
    @app.cli.command("seed-users")
    def seed_users():
        from app.models.user import User
        seeds = [
            ("admin",    "admin",    "admin",     True),
            ("redteam",  "redteam",  "red_team",  True),
            ("blueteam", "blueteam", "blue_team", True),
        ]
        created = 0
        for username, password, role, approved in seeds:
            if not User.query.filter_by(username=username).first():
                u = User(username=username, role=role, is_approved=approved)
                u.set_password(password)
                db.session.add(u)
                created += 1
        db.session.commit()
        print(f"Seeded {created} user(s).")
