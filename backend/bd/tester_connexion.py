"""Petit test : se connecte à la base et affiche sa version.
Lancement : python -m bd.tester_connexion  (depuis le dossier backend)
"""
from sqlalchemy import text

from bd.connexion import engine

if __name__ == "__main__":
    with engine().connect() as connexion:
        version = connexion.execute(text("select version()")).scalar()
        # On n'affiche JAMAIS l'adresse de connexion : elle contient le mot de passe.
        print("Connexion réussie :", version)