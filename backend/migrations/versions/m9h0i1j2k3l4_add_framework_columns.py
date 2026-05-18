"""add framework column to ttps and tactics

Revision ID: m9h0i1j2k3l4
Revises: l8g9h0i1j2k3
Create Date: 2026-05-18

"""
from alembic import op
import sqlalchemy as sa

revision = 'm9h0i1j2k3l4'
down_revision = 'l8g9h0i1j2k3'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('ttps',    sa.Column('framework', sa.String(20), nullable=False, server_default='enterprise'))
    op.add_column('tactics', sa.Column('framework', sa.String(20), nullable=False, server_default='enterprise'))


def downgrade():
    op.drop_column('ttps',    'framework')
    op.drop_column('tactics', 'framework')
