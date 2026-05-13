"""add attack_path to exercise_entries

Revision ID: g3b4c5d6e7f8
Revises: f2a3b4c5d6e7
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = 'g3b4c5d6e7f8'
down_revision = 'f2a3b4c5d6e7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('exercise_entries',
        sa.Column('attack_path_include', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('exercise_entries',
        sa.Column('attack_path_step', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('exercise_entries', 'attack_path_step')
    op.drop_column('exercise_entries', 'attack_path_include')
