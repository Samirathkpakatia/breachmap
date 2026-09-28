import json
from pathlib import Path

import networkx as nx

CHEMIN_LAB = Path(__file__).resolve().parent.parent / "data" / "lab.json"


def charger_environnement():
    with open(CHEMIN_LAB, encoding="utf-8") as f:
        return json.load(f)


def construire_graphe(env):
    g = nx.DiGraph()
    for n in env["noeuds"]:
        g.add_node(n["id"], **{k: v for k, v in n.items() if k != "id"})
    for r in env["relations"]:
        g.add_edge(
            r["source"],
            r["cible"],
            protocole=r["protocole"],
            probabilite=r["probabilite"],
            mesures=r["mesures"],
        )
    return g


def simuler(g, depart):
    if depart not in g:
        raise ValueError(f"Actif inconnu : {depart}")

    resultats = []
    for cible in nx.descendants(g, depart):
        meilleur = None
        for chemin in nx.all_simple_paths(g, depart, cible):
            proba = 1.0
            for a, b in zip(chemin, chemin[1:]):
                proba *= g[a][b]["probabilite"]
            if meilleur is None or proba > meilleur[1]:
                meilleur = (chemin, proba)
        resultats.append(
            {
                "cible": cible,
                "chemin": meilleur[0],
                "probabilite": round(meilleur[1], 3),
                "criticite": g.nodes[cible]["criticite"],
            }
        )
    resultats.sort(key=lambda r: r["probabilite"], reverse=True)
    return resultats