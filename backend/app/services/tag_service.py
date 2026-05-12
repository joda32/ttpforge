from app.extensions import db
from app.models.tag import Tag


def list_tags():
    return Tag.query.order_by(Tag.name).all()


def get_tag(tag_id):
    return Tag.query.get_or_404(tag_id)


def create_tag(data):
    tag = Tag(name=data["name"], color=data.get("color", "#6366f1"))
    db.session.add(tag)
    db.session.commit()
    return tag


def update_tag(tag_id, data):
    tag = Tag.query.get_or_404(tag_id)
    if "name" in data:
        tag.name = data["name"]
    if "color" in data:
        tag.color = data["color"]
    db.session.commit()
    return tag


def delete_tag(tag_id):
    tag = Tag.query.get_or_404(tag_id)
    db.session.delete(tag)
    db.session.commit()


def set_tags(obj, tag_ids):
    """Replace all tags on an exercise or entry. Skipped if tag_ids is None."""
    if tag_ids is None:
        return
    obj.tags = Tag.query.filter(Tag.id.in_(tag_ids)).all() if tag_ids else []
