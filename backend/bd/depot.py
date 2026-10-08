"""Lecture et écriture des environnements dans la base.

Ce fichier traduit entre deux formats :
- les dictionnaires du moteur (le même format que lab.json) ;
- les lignes de la base de données.
Le moteur de calcul n'a donc pas à savoir que la base existe.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from bd.modeles import ActifBD, EnvironnementBD, RelationBD
from moteur.modeles import Environnement as EnvironnementEntree


def importer_environnement(
    session: Session, brut: dict, *, est_exemple: bool = False
) -> EnvironnementBD:
    """Enregistre un environnement (dictionnaire au format lab.json) dans la base.

    Il est d'abord validé par les règles de moteur/modeles.py : la base ne
    reçoit jamais de données invalides. Cette fonction ne valide PAS la
    transaction (pas de commit) : c'est à l'appelant de le faire.
    """
    env = EnvironnementEntree.model_validate(brut)  # lève ValidationError si invalide

    ligne = EnvironnementBD(nom=env.nom, est_exemple=est_exemple)
    ligne.actifs = [
        ActifBD(
            cle=a.id, nom=a.nom, type=a.type, zone=a.zone,
            criticite=a.criticite, x=a.x, y=a.y,
        )
        for a in env.noeuds
    ]
    ligne.relations = [
        RelationBD(
            source=r.source, cible=r.cible, protocole=r.protocole,
            probabilite=r.probabilite, mesures=list(r.mesures),
        )
        for r in env.relations
    ]
    session.add(ligne)
    return ligne


def exporter_environnement(session: Session, env_id: int) -> dict | None:
    """Relit un environnement dans la base, au format que le moteur comprend."""
    env = session.get(EnvironnementBD, env_id)
    if env is None:
        return None
    return {
        "nom": env.nom,
        "noeuds": [
            {
                "id": a.cle, "nom": a.nom, "type": a.type, "zone": a.zone,
                "criticite": a.criticite, "x": a.x, "y": a.y,
            }
            for a in env.actifs
        ],
        "relations": [
            {
                "source": r.source, "cible": r.cible, "protocole": r.protocole,
                "probabilite": r.probabilite, "mesures": list(r.mesures),
            }
            for r in env.relations
        ],
    }


def lister_environnements(session: Session) -> list[dict]:
    """Résumé de tous les environnements (numéro, nom, tailles)."""
    lignes = session.scalars(select(EnvironnementBD).order_by(EnvironnementBD.id))
    return [
        {
            "id": e.id, "nom": e.nom, "est_exemple": e.est_exemple,
            "nb_actifs": len(e.actifs), "nb_relations": len(e.relations),
        }
        for e in lignes
    ]