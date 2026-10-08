"""Configuration d'Alembic : où est la base, et quelles tables suivre."""
from alembic import context

from bd.connexion import engine  # même connexion que le reste de l'application
from bd.modeles import Base

# Alembic compare cette description (nos tables) à la base réelle pour
# préparer les migrations.
target_metadata = Base.metadata


def run_migrations_online() -> None:
    """Applique les migrations en se connectant à la base."""
    with engine().connect() as connexion:
        context.configure(connection=connexion, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


run_migrations_online()