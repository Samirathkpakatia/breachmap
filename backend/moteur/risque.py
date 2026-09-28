from moteur.graphe import construire_graphe, simuler


def niveau(score):
    if score >= 35:
        return "critique"
    if score >= 20:
        return "élevé"
    if score >= 10:
        return "moyen"
    return "faible"


def evaluer(g, depart):
    atteignables = simuler(g, depart)
    total = sum(d["criticite"] for n, d in g.nodes(data=True) if n != depart)
    exposition = sum(a["probabilite"] * a["criticite"] for a in atteignables)
    score = round(100 * exposition / total, 1)
    return {
        "depart": depart,
        "score": score,
        "niveau": niveau(score),
        "atteignables": atteignables,
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