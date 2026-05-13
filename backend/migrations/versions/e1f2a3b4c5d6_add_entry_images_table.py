"""add entry_images table

Revision ID: e1f2a3b4c5d6
Revises: d3f1a2b4c5e6
Create Date: 2026-05-12 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "e1f2a3b4c5d6"
down_revision = "d3f1a2b4c5e6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "entry_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entry_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False, server_default="image.png"),
        sa.Column("mime_type", sa.String(50), nullable=False, server_default="image/png"),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["entry_id"],
            ["exercise_entries.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_entry_images_entry_id", "entry_images", ["entry_id"])


def downgrade():
    op.drop_index("ix_entry_images_entry_id", table_name="entry_images")
    op.drop_table("entry_images")
