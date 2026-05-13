"""add caption to entry_images

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-05-13 00:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("entry_images", sa.Column("caption", sa.String(500), nullable=True))


def downgrade():
    op.drop_column("entry_images", "caption")
