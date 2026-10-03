from moteur.graphe import construire_graphe, simuler


# Seuils du niveau de risque sur le score (0 à 100), du plus haut au plus bas.
# Source unique : la page « Méthode » du frontend les reçoit de l'API.
SEUILS_SCORE = [("critique", 35), ("élevé", 20), ("moyen", 10)]


def niveau(score):
    """Convertit un score (0 à 100) en niveau de risque."""
    for nom, minimum in SEUILS_SCORE:
        if score >= minimum:
            return nom
    return "faible"


def evaluer(g, depart):
    """Calcule le score de risque d'un scénario de compromission.

    Le score est le pourcentage de la valeur du système d'information
    qui est attendu comme compromis à partir de l'actif de départ.
    """
    atteignables = simuler(g, depart)

    # Criticité totale de tous les actifs, sauf celui qui est déjà compromis.
    total = sum(d["criticite"] for n, d in g.nodes(data=True) if n != depart)

    # Valeur attendue perdue : somme de (probabilité x criticité) par actif atteint.
    exposition = sum(a["probabilite"] * a["criticite"] for a in atteignables)

    # Rapporté à 100 pour obtenir un score lisible.
    score = round(100 * exposition / total, 1)

    # Probabilité de CHAQUE relation, mesures comprises : {"source-cible": proba}.
    # Le frontend s'en sert pour dessiner les flèches sans refaire aucun calcul.
    liens = {f"{a}-{b}": round(d["probabilite"], 3) for a, b, d in g.edges(data=True)}

    return {
        "depart": depart,
        "score": score,
        "niveau": niveau(score),
        "atteignables": atteignables,
        "liens": liens,
    }

def comparer(env, depart, mesures):
    avant = evaluer(construire_graphe(env), depart)
    apres = evaluer(construire_graphe(env, mesures), depart)
    reduction = 0.0
    if avant["score"]:
        reduction = round(100 * (avant["score"] - apres["score"]) / avant["score"], 1)
    return {
        "depart": depart,
        "mesures": mesures,
        "avant": avant,
        "apres": apres,
        "reduction_pct": reduction,
    }