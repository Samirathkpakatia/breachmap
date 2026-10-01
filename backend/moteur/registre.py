import json
from pathlib import Path

CHEMIN_REGISTRE = Path(__file__).resolve().parent.parent / "data" / "registre.json"

# Seuils du niveau de risque, sur le produit vraisemblance x impact (de 1 à 25).
# Ils sont classés du plus haut au plus bas : on prend le premier atteint.
# C'est la SEULE définition de ces seuils : le frontend la reçoit de l'API.
SEUILS = [("critique", 20), ("élevé", 10), ("moyen", 5)]


def niveau_risque(vraisemblance, impact):
    """Convertit vraisemblance x impact en niveau de risque."""
    produit = vraisemblance * impact
    for nom, minimum in SEUILS:
        if produit >= minimum:
            return nom
    return "faible"


def charger_registre():
    """Lit registre.json et ajoute à chaque risque sa criticité et son niveau."""
    with open(CHEMIN_REGISTRE, encoding="utf-8") as f:
        risques = json.load(f)
    for r in risques:
        r["criticite"] = r["vraisemblance"] * r["impact"]
        r["niveau"] = niveau_risque(r["vraisemblance"], r["impact"])
    return risques


def grille():
    """Niveau de chacune des 25 cases de la matrice : {"vraisemblance-impact": niveau}."""
    return {
        f"{v}-{i}": niveau_risque(v, i) for v in range(1, 6) for i in range(1, 6)
    }