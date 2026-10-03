import random

import pandas as pd

from ml.caracteristiques import caracteristiques
from ml.chemins import DATASET
from moteur.graphe import charger_environnement, construire_graphe
from moteur.mesures import EFFICACITE
from moteur.risque import evaluer

NB_VARIANTES = 150             # nombre de variantes du laboratoire
COMBINAISONS_PAR_VARIANTE = 4  # combinaisons de mesures testées par variante
GRAINE = 42                    # rend la génération reproductible


def varier(env, rng):
    """Crée une variante du laboratoire, comme une autre organisation possible."""
    variante = {"nom": env["nom"], "noeuds": [], "relations": []}
    for n in env["noeuds"]:
        copie = dict(n)
        # La criticité varie de -1, 0 ou +1 (0 est plus fréquent), bornée à [1, 5].
        copie["criticite"] = min(5, max(1, n["criticite"] + rng.choice([-1, 0, 0, 1])))
        variante["noeuds"].append(copie)
    for r in env["relations"]:
        if rng.random() < 0.08:  # 8 % des relations disparaissent
            continue
        copie = dict(r)
        # La probabilité est multipliée par un facteur entre 0.7 et 1.3, bornée.
        copie["probabilite"] = min(1.0, max(0.05, r["probabilite"] * rng.uniform(0.7, 1.3)))
        variante["relations"].append(copie)
    return variante


def generer():
    """Génère le jeu de données : une ligne par (variante, mesures, actif compromis)."""
    rng = random.Random(GRAINE)
    env0 = charger_environnement()
    mesures_possibles = list(EFFICACITE)
    lignes = []

    for numero in range(NB_VARIANTES):
        env = varier(env0, rng)
        for _ in range(COMBINAISONS_PAR_VARIANTE):
            # Entre 0 et 4 mesures actives, tirées au hasard.
            mesures = rng.sample(mesures_possibles, rng.randint(0, len(mesures_possibles)))
            g = construire_graphe(env, mesures)
            for n in env["noeuds"]:
                depart = n["id"]
                ev = evaluer(g, depart)  # le MOTEUR fournit l'étiquette
                ligne = caracteristiques(env, g, depart, mesures)
                ligne.update(
                    {
                        "variante": numero,  # sert à séparer entraînement et test
                        "depart": depart,
                        "score": ev["score"],
                        "niveau": ev["niveau"],  # ce que le modèle devra prédire
                    }
                )
                lignes.append(ligne)

    df = pd.DataFrame(lignes)
    df.to_csv(DATASET, index=False)
    return df


if __name__ == "__main__":
    df = generer()
    print(f"{len(df)} lignes écrites dans {DATASET}")
    print("Répartition des niveaux :")
    print(df["niveau"].value_counts())
