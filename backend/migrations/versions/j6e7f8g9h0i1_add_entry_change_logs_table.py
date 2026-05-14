"""add entry_change_logs table

Revision ID: j6e7f8g9h0i1
Revises: i5d6e7f8g9h0
Create Date: 2026-05-14

"""
from alembic import op
import sqlalchemy as sa

revision = 'j6e7f8g9h0i1'
down_revision = 'i5d6e7f8g9h0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'entry_change_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entry_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('changed_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['entry_id'], ['exercise_entries.id'],
                                ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_entry_change_logs_entry_id'),
        'entry_change_logs', ['entry_id'],
    )


def downgrade():
    op.drop_index(op.f('ix_entry_change_logs_entry_id'),
                  table_name='entry_change_logs')
    op.drop_table('entry_change_logs')
