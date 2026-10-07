"""Connexion à la base de données PostgreSQL.

L'adresse de la base (avec son mot de passe) est un SECRET : elle vit dans la
variable d'environnement DATABASE_URL, jamais dans le code ni dans Git.
En local, elle est lue dans backend/.env ; sur Render, elle sera saisie dans
les réglages du service.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

# Charge backend/.env dans les variables d'environnement (ne fait rien s'il n'existe pas).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

_engine: Engine | None = None  # créé une seule fois, puis réutilisé


def url_base() -> str:
    """Lit l'adresse de la base et l'adapte au pilote psycopg."""
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        raise RuntimeError(
            "Variable DATABASE_URL absente : crée backend/.env (voir .env.example)."
        )
    # Neon fournit « postgresql:// » ; SQLAlchemy doit savoir qu'on utilise
    # le pilote psycopg (version 3).
    for prefixe in ("postgresql://", "postgres://"):
        if url.startswith(prefixe):
            return "postgresql+psycopg://" + url[len(prefixe):]
    return url


def engine() -> Engine:
    """Renvoie le moteur de connexion SQLAlchemy (créé au premier appel).

    pool_pre_ping : vérifie qu'une connexion est vivante avant de s'en servir.
    Indispensable ici, car la base gratuite se met en veille après un moment
    d'inactivité, comme le service Render.
    """
    global _engine
    if _engine is None:
        _engine = create_engine(url_base(), pool_pre_ping=True)
    return _engine