from moteur.graphe import charger_environnement, charger_scenarios
from moteur.registre import charger_registre
from moteur.risque import comparer

NIVEAUX = ("critique", "élevé", "moyen", "faible")


def synthese():
    """Assemble les données du tableau de bord.

    Aucun calcul nouveau : on réutilise le moteur de risque et le registre,
    pour que le tableau de bord et la page Simulation donnent toujours
    les mêmes chiffres.
    """
    env = charger_environnement()
    noms = {n["id"]: n["nom"] for n in env["noeuds"]}

    scenarios = []
    for s in charger_scenarios():
        # Comparaison sans mesure / avec les mesures suggérées par le scénario.
        c = comparer(env, s["depart"], s["mesures_suggerees"])
        scenarios.append(
            {
                "id": s["id"],
                "nom": s["nom"],
                "depart": s["depart"],
                "depart_nom": noms[s["depart"]],
                "mesures": s["mesures_suggerees"],
                "score_avant": c["avant"]["score"],
                "niveau_avant": c["avant"]["niveau"],
                "score_apres": c["apres"]["score"],
                "niveau_apres": c["apres"]["niveau"],
                "reduction_pct": c["reduction_pct"],
                "nb_atteints": len(c["avant"]["atteignables"]),
            }
        )
    # Les scénarios les plus risqués (sans mesure) en premier.
    scenarios.sort(key=lambda s: s["score_avant"], reverse=True)

    # Nombre de risques du registre pour chaque niveau.
    risques = charger_registre()
    repartition = {n: sum(1 for r in risques if r["niveau"] == n) for n in NIVEAUX}

    return {
        "environnement": {
            "nom": env["nom"],
            "actifs": len(env["noeuds"]),
            "relations": len(env["relations"]),
        },
        "scenarios": scenarios,
        "repartition_risques": repartition,
        "nb_risques": len(risques),
    }