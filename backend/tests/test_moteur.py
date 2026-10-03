import itertools

import pytest

from moteur.graphe import charger_environnement, construire_graphe, simuler
from moteur.mesures import EFFICACITE
from moteur.risque import comparer, evaluer, niveau


@pytest.fixture(scope="module")
def env():
    """Le laboratoire, chargé une seule fois pour tous les tests de ce fichier."""
    return charger_environnement()


# --- Scores sans mesure : les 4 scénarios de démonstration ---

@pytest.mark.parametrize(
    "depart, score_attendu, niveau_attendu",
    [
        ("serveur_web", 20.1, "élevé"),
        ("compte_admin", 40.0, "critique"),
        ("postes", 24.8, "élevé"),
        ("vpn", 31.9, "élevé"),
    ],
)
def test_score_sans_mesure(env, depart, score_attendu, niveau_attendu):
    r = evaluer(construire_graphe(env), depart)
    assert r["score"] == pytest.approx(score_attendu)
    assert r["niveau"] == niveau_attendu


# --- Comparaison avant/après : scores et réductions validés à la main ---

@pytest.mark.parametrize(
    "depart, mesures, apres, niveau_apres, reduction",
    [
        ("serveur_web", ["segmentation"], 6.3, "faible", 68.7),
        ("compte_admin", ["mfa"], 16.0, "moyen", 60.0),
        ("compte_admin", ["mfa", "moindre_privilege"], 12.2, "moyen", 69.5),
        ("vpn", ["segmentation", "mfa"], 4.8, "faible", 85.0),
        ("postes", ["mfa", "segmentation"], 7.0, "faible", 71.8),
        # Une mesure qui ne protège aucune relation du chemin ne change rien.
        ("serveur_web", ["mfa"], 20.1, "élevé", 0.0),
    ],
)
def test_comparaison_avec_mesures(env, depart, mesures, apres, niveau_apres, reduction):
    c = comparer(env, depart, mesures)
    assert c["apres"]["score"] == pytest.approx(apres)
    assert c["apres"]["niveau"] == niveau_apres
    assert c["reduction_pct"] == pytest.approx(reduction)


# --- Chemins et probabilités : produit des probabilités de chaque étape ---

def test_probabilites_depuis_le_serveur_web(env):
    g = construire_graphe(env)
    probas = {a["cible"]: a["probabilite"] for a in simuler(g, "serveur_web")}
    # Exemple : base de données = 0.7 x 0.7 = 0.49
    assert probas == pytest.approx(
        {
            "serveur_app": 0.7,
            "base_donnees": 0.49,
            "donnees_sensibles": 0.441,
            "sauvegardes": 0.294,
        }
    )


# --- Propriétés qui doivent toujours être vraies ---

def test_une_mesure_ne_peut_jamais_augmenter_le_risque(env):
    """Pour chaque actif et chaque combinaison de mesures : après <= avant."""
    mesures = list(EFFICACITE)
    for n in env["noeuds"]:
        avant = evaluer(construire_graphe(env), n["id"])["score"]
        for k in range(1, len(mesures) + 1):
            for combinaison in itertools.combinations(mesures, k):
                apres = evaluer(construire_graphe(env, list(combinaison)), n["id"])["score"]
                assert apres <= avant, f"{n['id']} + {combinaison} : {apres} > {avant}"


def test_le_score_reste_entre_0_et_100(env):
    g = construire_graphe(env)
    for n in env["noeuds"]:
        assert 0 <= evaluer(g, n["id"])["score"] <= 100


def test_un_actif_sans_relation_sortante_n_atteint_rien(env):
    r = evaluer(construire_graphe(env), "donnees_sensibles")
    assert r["atteignables"] == []
    assert r["score"] == 0.0
    assert r["niveau"] == "faible"


def test_actif_inconnu(env):
    with pytest.raises(ValueError):
        simuler(construire_graphe(env), "actif_qui_n_existe_pas")


# --- Seuils des niveaux (35, 20, 10) : on teste de chaque côté de la limite ---

@pytest.mark.parametrize(
    "score, attendu",
    [(35.0, "critique"), (34.9, "élevé"), (20.0, "élevé"), (19.9, "moyen"),
     (10.0, "moyen"), (9.9, "faible"), (0.0, "faible")],
)
def test_seuils_des_niveaux(score, attendu):
    assert niveau(score) == attendu