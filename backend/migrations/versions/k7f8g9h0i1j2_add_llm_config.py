"""add llm_configs table

Revision ID: k7f8g9h0i1j2
Revises: j6e7f8g9h0i1
Create Date: 2026-05-18

"""
from alembic import op
import sqlalchemy as sa

revision = 'k7f8g9h0i1j2'
down_revision = 'j6e7f8g9h0i1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'llm_configs',
        sa.Column('id',         sa.Integer,     primary_key=True),
        sa.Column('provider',   sa.String(20),  nullable=False, server_default='anthropic'),
        sa.Column('model',      sa.String(100), nullable=False, server_default='claude-opus-4-7'),
        sa.Column('api_key',    sa.Text,        nullable=True),
        sa.Column('base_url',   sa.String(255), nullable=True),
        sa.Column('max_tokens', sa.Integer,     nullable=False, server_default='4096'),
        sa.Column('is_active',  sa.Boolean,     nullable=False, server_default=sa.true()),
        sa.Column('updated_at', sa.DateTime,    server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('llm_configs')
