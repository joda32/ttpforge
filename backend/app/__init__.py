from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db, migrate


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=["http://localhost:5173"])

    # Import models so Alembic can detect them
    from app.models import Exercise, TTP, ExerciseEntry  # noqa: F401

    from app.routes import register_blueprints
    register_blueprints(app)

    return app
