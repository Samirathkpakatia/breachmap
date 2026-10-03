import pytest

from moteur.graphe import charger_scenarios
from moteur.registre import charger_registre, grille, niveau_risque


def test_registre_contient_12_risques():
    assert len(charger_registre()) == 12


def test_niveaux_du_registre_conformes_au_document():
    """Les niveaux calculés doivent être ceux du document d'analyse des risques."""
    niveaux = {r["id"]: r["niveau"] for r in charger_registre()}
    attendu = {"R01": "critique", "R02": "critique", "R12": "moyen"}
    attendu.update({f"R{i:02d}": "élevé" for i in range(3, 12)})  # R03 à R11
    assert niveaux == attendu


@pytest.mark.parametrize(
    "vraisemblance, impact, attendu",
    [(4, 5, "critique"), (5, 4, "critique"), (4, 4, "élevé"), (2, 5, "élevé"),
     (2, 3, "moyen"), (1, 5, "moyen"), (2, 2, "faible"), (1, 1, "faible")],
)
def test_seuils_du_registre(vraisemblance, impact, attendu):
    assert niveau_risque(vraisemblance, impact) == attendu


def test_la_grille_a_25_cases():
    assert len(grille()) == 25


def test_chaque_risque_renvoie_a_un_scenario_existant():
    ids = {s["id"] for s in charger_scenarios()}
    for r in charger_registre():
        assert r["scenario"] is None or r["scenario"] in ids, r["id"]