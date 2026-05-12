from app.routes.exercises import bp as exercises_bp
from app.routes.ttps import bp as ttps_bp
from app.routes.entries import bp as entries_bp
from app.routes.tags import bp as tags_bp
from app.routes.tactics import bp as tactics_bp
from app.routes.mitre import bp as mitre_bp


def register_blueprints(app):
    app.register_blueprint(exercises_bp)
    app.register_blueprint(ttps_bp)
    app.register_blueprint(entries_bp)
    app.register_blueprint(tags_bp)
    app.register_blueprint(tactics_bp)
    app.register_blueprint(mitre_bp)
