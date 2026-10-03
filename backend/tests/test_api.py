import pytest
from fastapi.testclient import TestClient

from main import app
from ml.chemins import MODELE

# TestClient appelle l'API directement, sans lancer de serveur.
client = TestClient(app)


def test_accueil():
    r = client.get("/")
    assert r.status_code == 200
    assert "opérationnelle" in r.json()["message"]


def test_environnement():
    env = client.get("/environnement").json()
    assert len(env["noeuds"]) == 13
    assert len(env["relations"]) == 18


def test_scenarios():
    assert len(client.get("/scenarios").json()) == 4


def test_comparaison():
    r = client.get("/comparaison/serveur_web?mesures=segmentation").json()
    assert r["avant"]["score"] == pytest.approx(20.1)
    assert r["apres"]["score"] == pytest.approx(6.3)
    assert r["reduction_pct"] == pytest.approx(68.7)
    # La probabilité de chaque lien est fournie pour le dessin du graphe.
    assert r["apres"]["liens"]["serveur_web-serveur_app"] == pytest.approx(0.35)


def test_validation_des_entrees():
    # Une entrée invalide doit être refusée, jamais traitée.
    assert client.get("/comparaison/serveur_web?mesures=truc").status_code == 400
    assert client.get("/comparaison/nimporte_quoi").status_code == 404
    assert client.get("/simulation/nimporte_quoi").status_code == 404
    assert client.get("/risque/nimporte_quoi").status_code == 404


def test_registre():
    reg = client.get("/registre").json()
    assert len(reg["risques"]) == 12
    assert len(reg["grille"]) == 25


def test_tableau_de_bord_classe_les_scenarios():
    tdb = client.get("/tableau-de-bord").json()
    scores = [s["score_avant"] for s in tdb["scenarios"]]
    assert scores == sorted(scores, reverse=True)
    assert tdb["scenarios"][0]["id"] == "admin"
    assert tdb["repartition_risques"] == {"critique": 2, "élevé": 9, "moyen": 1, "faible": 0}


@pytest.mark.skipif(not MODELE.exists(), reason="modèle ML non entraîné")
def test_priorisation():
    p = client.get("/priorisation").json()
    assert len(p["scenarios"]) == 4
    assert sorted(s["rang_ml"] for s in p["scenarios"]) == [1, 2, 3, 4]
    assert p["metriques"]["exactitude"] > p["metriques"]["exactitude_reference"]


# --- Sécurité : le CORS n'autorise que nos deux sites ---

def test_cors_site_autorise():
    origine = "https://breachmap-peach.vercel.app"
    r = client.get("/", headers={"Origin": origine})
    assert r.headers.get("access-control-allow-origin") == origine


def test_cors_site_inconnu_refuse():
    r = client.get("/", headers={"Origin": "https://site-malveillant.example"})
    assert "access-control-allow-origin" not in r.headers


def test_methode():
    m = client.get("/methode").json()
    assert m["seuils_score"] == {"critique": 35, "élevé": 20, "moyen": 10}
    assert m["efficacite_mesures"]["mfa"] == 0.6
    assert m["seuils_registre"] == {"critique": 20, "élevé": 10, "moyen": 5}