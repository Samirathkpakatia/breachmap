import json
from pathlib import Path
import math
import networkx as nx
from moteur.mesures import EFFICACITE

CHEMIN_LAB = Path(__file__).resolve().parent.parent / "data" / "lab.json"
CHEMIN_SCENARIOS = CHEMIN_LAB.parent / "scenarios.json"


def charger_environnement():
    with open(CHEMIN_LAB, encoding="utf-8") as f:
        return json.load(f)


def charger_scenarios():
    """Lit scenarios.json : la liste des scénarios proposés à l'utilisateur."""
    with open(CHEMIN_SCENARIOS, encoding="utf-8") as f:
        return json.load(f)
        

def construire_graphe(env, mesures_actives=None):
    actives = set(mesures_actives or [])
    g = nx.DiGraph()
    for n in env["noeuds"]:
        g.add_node(n["id"], **{k: v for k, v in n.items() if k != "id"})
    for r in env["relations"]:
        proba = r["probabilite"]
        for m in r["mesures"]:
            if m in actives:
                proba *= 1 - EFFICACITE[m]
        g.add_edge(
            r["source"],
            r["cible"],
            protocole=r["protocole"],
            probabilite=proba,
            mesures=r["mesures"],
        )
    return g


def simuler(g, depart):
    """Liste tout ce qu'un attaquant peut atteindre depuis l'actif `depart`.

    Pour chaque actif atteignable, on garde le chemin le PLUS PROBABLE.

    Méthode : la probabilité d'un chemin est le produit des probabilités de ses
    étapes. Maximiser un produit revient à minimiser une somme de -log(p)
    (log d'un produit = somme des logs). On cherche donc le chemin de coût
    minimum avec l'algorithme de Dijkstra, qui reste rapide même sur de gros
    graphes, contrairement à l'énumération de tous les chemins possibles.
    """
    if depart not in g:
        raise ValueError(f"Actif inconnu : {depart}")

    def cout(a, b, donnees):
        # -log(1) = 0 : une relation certaine ne coûte rien.
        # max(...) évite un logarithme de zéro.
        return -math.log(max(donnees["probabilite"], 1e-12))

    _, chemins = nx.single_source_dijkstra(g, depart, weight=cout)

    resultats = []
    for cible, chemin in chemins.items():
        if cible == depart:
            continue
        # On recalcule le produit réel des probabilités le long du chemin.
        proba = 1.0
        for a, b in zip(chemin, chemin[1:]):
            proba *= g[a][b]["probabilite"]
        resultats.append(
            {
                "cible": cible,
                "chemin": chemin,
                "probabilite": round(proba, 3),
                "criticite": g.nodes[cible]["criticite"],
            }
        )
    # Les actifs les plus faciles à atteindre en premier.
    resultats.sort(key=lambda r: r["probabilite"], reverse=True)
    return resultats