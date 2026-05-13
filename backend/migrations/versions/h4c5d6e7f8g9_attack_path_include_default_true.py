"""attack_path_include default true

Revision ID: h4c5d6e7f8g9
Revises: g3b4c5d6e7f8
Create Date: 2026-05-13

"""
from alembic import op

revision = 'h4c5d6e7f8g9'
down_revision = 'g3b4c5d6e7f8'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('exercise_entries', 'attack_path_include',
                     server_default='true')


def downgrade():
    op.alter_column('exercise_entries', 'attack_path_include',
                     server_default='false')
