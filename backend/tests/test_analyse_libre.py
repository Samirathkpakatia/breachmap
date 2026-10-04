import copy
import json
import random
import time
from math import prod

import networkx as nx
import pytest
from fastapi.testclient import TestClient

from main import app
from moteur.graphe import CHEMIN_LAB, charger_environnement, construire_graphe, simuler
from moteur.mesures import EFFICACITE
from moteur.modeles import MAX_ACTIFS, MAX_RELATIONS, Environnement

client = TestClient(app)
CHEMIN_PME = CHEMIN_LAB.parent / "exemple_pme.json"


def demande(env, depart="serveur_web", mesures=None):
    """Corps de requête pour la route /analyse."""
    return {"environnement": env, "depart": depart, "mesures": mesures or []}


# --- Le nouvel algorithme donne les mêmes résultats que l'énumération exhaustive ---

@pytest.mark.parametrize("mesures", [[], list(EFFICACITE)])
def test_dijkstra_equivaut_a_l_enumeration_exhaustive(mesures):
    g = construire_graphe(charger_environnement(), mesures)
    for depart in g.nodes:
        attendu = {}
        for cible in nx.descendants(g, depart):
            attendu[cible] = max(
                prod(g[a][b]["probabilite"] for a, b in zip(c, c[1:]))
                for c in nx.all_simple_paths(g, depart, cible)
            )
        obtenu = {r["cible"]: r["probabilite"] for r in simuler(g, depart)}
        assert obtenu == pytest.approx(attendu, abs=1e-3)


# --- Validation : un environnement incohérent ou dangereux est refusé (422) ---

def _doublon_id(env): env["noeuds"].append(dict(env["noeuds"][0]))
def _proba_trop_haute(env): env["relations"][0]["probabilite"] = 1.5
def _proba_nulle(env): env["relations"][0]["probabilite"] = 0
def _mesure_inconnue(env): env["relations"][0]["mesures"] = ["truc"]
def _relation_vers_inconnu(env): env["relations"][0]["cible"] = "fantome"
def _boucle(env): env["relations"][0]["cible"] = env["relations"][0]["source"]
def _relation_en_double(env): env["relations"].append(dict(env["relations"][0]))
def _criticite_hors_echelle(env): env["noeuds"][0]["criticite"] = 6
def _identifiant_invalide(env): env["noeuds"][0]["id"] = "Serveur Web"


def _trop_d_actifs(env):
    env["noeuds"] = [{"id": f"a{i}", "nom": f"A{i}", "criticite": 3} for i in range(MAX_ACTIFS + 1)]
    env["relations"] = []


def _un_seul_actif(env):
    env["noeuds"] = env["noeuds"][:1]
    env["relations"] = []


@pytest.mark.parametrize(
    "alteration",
    [_doublon_id, _proba_trop_haute, _proba_nulle, _mesure_inconnue, _relation_vers_inconnu,
     _boucle, _relation_en_double, _criticite_hors_echelle, _identifiant_invalide,
     _trop_d_actifs, _un_seul_actif],
)
def test_environnement_invalide_refuse(alteration):
    env = copy.deepcopy(charger_environnement())
    alteration(env)
    assert client.post("/analyse", json=demande(env)).status_code == 422


def test_le_laboratoire_est_un_environnement_valide():
    Environnement.model_validate(charger_environnement())


def test_depart_inconnu_refuse():
    env = charger_environnement()
    assert client.post("/analyse", json=demande(env, depart="fantome")).status_code == 422


def test_mesure_inconnue_refusee():
    env = charger_environnement()
    assert client.post("/analyse", json=demande(env, mesures=["truc"])).status_code == 422


# --- Résultats ---

def test_analyse_libre_equivaut_au_laboratoire():
    """Envoyer le laboratoire à /analyse doit donner le même résultat que la route GET."""
    attendu = client.get("/comparaison/serveur_web?mesures=segmentation").json()
    obtenu = client.post(
        "/analyse", json=demande(charger_environnement(), mesures=["segmentation"])
    ).json()
    assert obtenu["avant"]["score"] == attendu["avant"]["score"] == pytest.approx(20.1)
    assert obtenu["apres"]["score"] == attendu["apres"]["score"] == pytest.approx(6.3)
    assert obtenu["reduction_pct"] == attendu["reduction_pct"]


def test_classement_des_actifs():
    lignes = client.post(
        "/analyse/classement", json={"environnement": charger_environnement(), "mesures": []}
    ).json()
    scores = [l["score"] for l in lignes]
    assert len(lignes) == 13
    assert scores == sorted(scores, reverse=True)
    # Internet, origine de l'attaque externe, atteint presque tout le système
    # (score calculé à la main : 43,1). Le compte administrateur vient juste après.
    assert lignes[0]["depart"] == "internet" and lignes[0]["score"] == pytest.approx(43.1)
    assert lignes[1]["depart"] == "compte_admin" and lignes[1]["score"] == pytest.approx(40.0)


def test_second_si_differents_du_laboratoire():
    """Un SI sans rapport avec le laboratoire est simulé avec des scores calculés à la main."""
    with open(CHEMIN_PME, encoding="utf-8") as f:
        pme = json.load(f)
    r = client.post("/analyse", json=demande(pme, depart="internet", mesures=["mfa"])).json()
    assert r["avant"]["score"] == pytest.approx(38.5)
    assert r["avant"]["niveau"] == "critique"
    assert r["apres"]["score"] == pytest.approx(31.6)
    assert r["apres"]["niveau"] == "élevé"


# --- Robustesse : un grand graphe dense ne doit pas bloquer le serveur ---

def _grand_environnement(nb_actifs, nb_relations, graine=1):
    rng = random.Random(graine)
    noeuds = [{"id": f"a{i}", "nom": f"Actif {i}", "criticite": rng.randint(1, 5)} for i in range(nb_actifs)]
    paires = set()
    while len(paires) < nb_relations:
        a, b = rng.sample(range(nb_actifs), 2)
        paires.add((a, b))
    relations = [
        {"source": f"a{a}", "cible": f"a{b}", "probabilite": round(rng.uniform(0.1, 0.9), 2), "mesures": []}
        for a, b in sorted(paires)
    ]
    return {"nom": "Grand environnement", "noeuds": noeuds, "relations": relations}


def test_un_grand_environnement_se_calcule_vite():
    env = _grand_environnement(MAX_ACTIFS, MAX_RELATIONS)
    debut = time.perf_counter()
    r = client.post("/analyse/classement", json={"environnement": env, "mesures": []})
    assert r.status_code == 200
    assert len(r.json()) == MAX_ACTIFS
    assert time.perf_counter() - debut < 5  # avec l'énumération des chemins : jamais terminé