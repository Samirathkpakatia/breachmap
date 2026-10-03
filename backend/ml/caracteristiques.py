import networkx as nx

# Les 8 variables du modèle, dans l'ordre. Une SEULE liste, utilisée à
# l'entraînement ET à la prédiction.
NOMS = [
    "criticite_depart",            # importance de l'actif compromis (1 à 5)
    "degre_sortant",               # nombre de relations qui partent de cet actif
    "nb_atteignables",             # nombre d'actifs atteignables (sans probabilités)
    "criticite_moy_atteignables",  # criticité moyenne des actifs atteignables
    "proba_moy_sortantes",         # probabilité moyenne des relations qui en partent
    "proba_moy_globale",           # probabilité moyenne de toutes les relations
    "nb_mesures",                  # nombre de mesures de sécurité actives
    "part_relations_protegees",    # part des relations couvertes par une mesure active
]


def caracteristiques(env, g, depart, mesures):
    """Décrit une situation (actif compromis + mesures actives) par 8 nombres.

    `g` est le graphe construit AVEC les mesures : les probabilités sont
    donc déjà réduites. On n'utilise ni le score, ni les chemins : ce sont
    justement ce que le modèle doit estimer.
    """
    atteignables = nx.descendants(g, depart)  # actifs atteignables (structure seule)
    sortantes = [d["probabilite"] for _, _, d in g.out_edges(depart, data=True)]
    toutes = [d["probabilite"] for _, _, d in g.edges(data=True)]
    criticites = [g.nodes[n]["criticite"] for n in atteignables]

    # Relations protégées par au moins une des mesures actives.
    actives = set(mesures)
    protegees = sum(1 for r in env["relations"] if actives & set(r["mesures"]))

    # Les moyennes sont protégées contre la division par zéro (liste vide).
    return {
        "criticite_depart": g.nodes[depart]["criticite"],
        "degre_sortant": len(sortantes),
        "nb_atteignables": len(atteignables),
        "criticite_moy_atteignables": sum(criticites) / len(criticites) if criticites else 0.0,
        "proba_moy_sortantes": sum(sortantes) / len(sortantes) if sortantes else 0.0,
        "proba_moy_globale": sum(toutes) / len(toutes) if toutes else 0.0,
        "nb_mesures": len(actives),
        "part_relations_protegees": protegees / len(env["relations"]) if env["relations"] else 0.0,
    }
