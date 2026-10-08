"""Charge les deux environnements d'exemple (laboratoire et PME) dans la base.

Lancement : python -m bd.semer   (depuis le dossier backend)
Idempotent : on peut le relancer sans créer de doublons.
"""
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from bd.connexion import engine
from bd.depot import importer_environnement
from bd.modeles import EnvironnementBD
from moteur.graphe import CHEMIN_LAB

FICHIERS = [CHEMIN_LAB, CHEMIN_LAB.parent / "exemple_pme.json"]


def semer() -> None:
    with Session(engine()) as session:
        for chemin in FICHIERS:
            with open(chemin, encoding="utf-8") as f:
                brut = json.load(f)
            existe = session.scalar(
                select(EnvironnementBD).where(
                    EnvironnementBD.nom == brut["nom"],
                    EnvironnementBD.est_exemple.is_(True),
                )
            )
            if existe:
                print(f"{brut['nom']} : déjà présent (id {existe.id})")
                continue
            env = importer_environnement(session, brut, est_exemple=True)
            session.flush()  # envoie les lignes à la base pour obtenir le numéro (id)
            print(
                f"{brut['nom']} : importé (id {env.id}, "
                f"{len(env.actifs)} actifs, {len(env.relations)} relations)"
            )
        session.commit()  # une seule validation à la fin : tout ou rien


if __name__ == "__main__":
    semer()