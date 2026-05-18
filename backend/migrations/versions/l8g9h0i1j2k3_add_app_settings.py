"""add app_settings table

Revision ID: l8g9h0i1j2k3
Revises: k7f8g9h0i1j2
Create Date: 2026-05-18

"""
from alembic import op
import sqlalchemy as sa

revision = 'l8g9h0i1j2k3'
down_revision = 'k7f8g9h0i1j2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'app_settings',
        sa.Column('key',   sa.String(100), primary_key=True),
        sa.Column('value', sa.Text,        nullable=True),
    )


def downgrade():
    op.drop_table('app_settings')
