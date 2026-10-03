import json
from functools import lru_cache

import joblib
import pandas as pd

from ml.caracteristiques import NOMS, caracteristiques
from ml.chemins import METRIQUES, MODELE
from moteur.graphe import charger_environnement, charger_scenarios, construire_graphe
from moteur.risque import evaluer


@lru_cache(maxsize=1)
def _modele():
    """Charge le modèle une seule fois (mémoire cache), puis le réutilise.

    Sécurité : un fichier .joblib peut exécuter du code à son ouverture.
    On ne charge donc QUE le fichier produit par notre propre entraînement.
    """
    return joblib.load(MODELE)["modele"]


def metriques():
    """Renvoie les performances mesurées lors de l'entraînement."""
    with open(METRIQUES, encoding="utf-8") as f:
        return json.load(f)


def prioriser():
    """Compare, pour chaque scénario, l'avis du modèle et celui du moteur."""
    if not MODELE.exists():
        raise FileNotFoundError("Modèle non entraîné")
    modele = _modele()
    env = charger_environnement()
    g = construire_graphe(env)  # situation actuelle : aucune mesure

    resultats = []
    for s in charger_scenarios():
        # Les caractéristiques sont calculées par la MÊME fonction qu'à l'entraînement.
        ligne = caracteristiques(env, g, s["depart"], [])
        x = pd.DataFrame([ligne], columns=NOMS)
        # predict_proba : la probabilité estimée de chaque niveau.
        probas = dict(zip(modele.classes_, (float(p) for p in modele.predict_proba(x)[0])))
        niveau_ml = max(probas, key=probas.get)
        ev = evaluer(g, s["depart"])  # l'avis du moteur, pour comparaison
        resultats.append(
            {
                "id": s["id"],
                "nom": s["nom"],
                "score_moteur": ev["score"],
                "niveau_moteur": ev["niveau"],
                "niveau_ml": niveau_ml,
                "confiance_ml": round(probas[niveau_ml], 3),
                "probas": {k: round(v, 3) for k, v in probas.items()},
                # Indice de priorité : probabilité d'être au moins « élevé »
                "indice_priorite": round(probas.get("élevé", 0) + probas.get("critique", 0), 3),
                "concordance": niveau_ml == ev["niveau"],
            }
        )

    # Rang selon le moteur (score) et selon le modèle (indice de priorité).
    for rang, r in enumerate(sorted(resultats, key=lambda r: -r["score_moteur"]), 1):
        r["rang_moteur"] = rang
    resultats.sort(key=lambda r: -r["indice_priorite"])
    for rang, r in enumerate(resultats, 1):
        r["rang_ml"] = rang
    return resultats