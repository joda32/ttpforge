"""add tactics table and ttp_tactics association

Revision ID: d3f1a2b4c5e6
Revises: b469e8f9339d
Create Date: 2026-05-12 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd3f1a2b4c5e6'
down_revision = 'b469e8f9339d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'tactics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('mitre_id', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('mitre_id'),
    )
    op.create_index('ix_tactics_mitre_id', 'tactics', ['mitre_id'])

    op.create_table(
        'ttp_tactics',
        sa.Column('ttp_id', sa.Integer(), nullable=False),
        sa.Column('tactic_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['ttp_id'], ['ttps.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tactic_id'], ['tactics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('ttp_id', 'tactic_id'),
    )


def downgrade():
    op.drop_table('ttp_tactics')
    op.drop_index('ix_tactics_mitre_id', table_name='tactics')
    op.drop_table('tactics')
