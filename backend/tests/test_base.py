import json
import os

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from bd import connexion  # noqa: F401  (importer ce module charge backend/.env)
from bd.connexion import engine
from bd.depot import exporter_environnement, importer_environnement
from bd.modeles import ActifBD, EnvironnementBD, RelationBD
from moteur.graphe import CHEMIN_LAB, charger_environnement
from moteur.risque import comparer

# Sans adresse de base (ex. sur une machine sans .env), ces tests sont ignorés.
pytestmark = pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"), reason="DATABASE_URL absente : tests de base ignorés"
)

CHEMIN_PME = CHEMIN_LAB.parent / "exemple_pme.json"


@pytest.fixture
def session():
    """Une session par test ; tout ce que le test écrit est annulé à la fin."""
    with Session(engine()) as s:
        yield s
        s.rollback()


def id_exemple(session, nom):
    """Numéro de l'environnement d'exemple de ce nom."""
    return session.scalars(
        select(EnvironnementBD.id).where(
            EnvironnementBD.nom == nom, EnvironnementBD.est_exemple.is_(True)
        )
    ).one()


def compter(session, modele, env_id):
    return session.scalar(
        select(func.count()).select_from(modele).where(modele.environnement_id == env_id)
    )


def test_les_deux_exemples_sont_en_base(session):
    noms = set(session.scalars(select(EnvironnementBD.nom).where(EnvironnementBD.est_exemple.is_(True))))
    assert {"Laboratoire BreachMap", "PME e-commerce (exemple)"} <= noms


@pytest.mark.parametrize("chemin", [CHEMIN_LAB, CHEMIN_PME])
def test_export_identique_au_fichier(session, chemin):
    """Ce qui sort de la base est exactement ce qu'on y a mis."""
    with open(chemin, encoding="utf-8") as f:
        fichier = json.load(f)
    base = exporter_environnement(session, id_exemple(session, fichier["nom"]))

    assert {a["id"]: (a["nom"], a["criticite"]) for a in base["noeuds"]} == {
        a["id"]: (a["nom"], a["criticite"]) for a in fichier["noeuds"]
    }

    def relations(env):
        return {
            (r["source"], r["cible"], r["protocole"], r["probabilite"], tuple(sorted(r["mesures"])))
            for r in env["relations"]
        }

    assert relations(base) == relations(fichier)


@pytest.mark.parametrize(
    "depart, mesures, avant, apres",
    [
        ("serveur_web", ["segmentation"], 20.1, 6.3),
        ("compte_admin", ["mfa", "moindre_privilege"], 40.0, 12.2),
        ("postes", ["mfa", "segmentation"], 24.8, 7.0),
        ("vpn", ["segmentation", "mfa"], 31.9, 4.8),
    ],
)
def test_scores_identiques_depuis_la_base(session, depart, mesures, avant, apres):
    """Les 4 scénarios donnent les mêmes scores depuis la base que depuis le fichier."""
    depuis_base = exporter_environnement(session, id_exemple(session, "Laboratoire BreachMap"))
    r_base = comparer(depuis_base, depart, mesures)
    r_fichier = comparer(charger_environnement(), depart, mesures)

    assert r_base["avant"]["score"] == r_fichier["avant"]["score"] == pytest.approx(avant)
    assert r_base["apres"]["score"] == r_fichier["apres"]["score"] == pytest.approx(apres)


def test_base_refuse_une_relation_vers_un_actif_inexistant(session):
    env_id = id_exemple(session, "Laboratoire BreachMap")
    session.add(RelationBD(environnement_id=env_id, source="fantome", cible="serveur_web",
                           protocole="", probabilite=0.5, mesures=[]))
    with pytest.raises(IntegrityError):
        session.flush()


def test_base_refuse_une_probabilite_invalide(session):
    env_id = id_exemple(session, "Laboratoire BreachMap")
    # Paire valide et libre (internet -> serveur_rh n'existe pas) : seule la probabilité est fautive.
    session.add(RelationBD(environnement_id=env_id, source="internet", cible="serveur_rh",
                           protocole="", probabilite=1.5, mesures=[]))
    with pytest.raises(IntegrityError) as erreur:
        session.flush()
    assert "ck_relation_probabilite" in str(erreur.value)


def test_import_refuse_un_environnement_invalide(session):
    invalide = {
        "nom": "Invalide",
        "noeuds": [{"id": "a", "nom": "A", "criticite": 3}, {"id": "b", "nom": "B", "criticite": 3}],
        "relations": [{"source": "a", "cible": "b", "probabilite": 1.5, "mesures": []}],
    }
    with pytest.raises(ValidationError):
        importer_environnement(session, invalide)


def test_suppression_en_cascade(session):
    petit = {
        "nom": "Test cascade",
        "noeuds": [{"id": "a", "nom": "A", "criticite": 3}, {"id": "b", "nom": "B", "criticite": 3}],
        "relations": [{"source": "a", "cible": "b", "probabilite": 0.5, "mesures": []}],
    }
    env = importer_environnement(session, petit)
    session.flush()
    env_id = env.id
    assert compter(session, ActifBD, env_id) == 2
    assert compter(session, RelationBD, env_id) == 1

    session.delete(env)
    session.flush()
    assert compter(session, ActifBD, env_id) == 0
    assert compter(session, RelationBD, env_id) == 0