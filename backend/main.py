from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from moteur.mesures import EFFICACITE
from moteur.risque import SEUILS_SCORE, comparer, evaluer
from moteur.registre import SEUILS, charger_registre, grille
from moteur.synthese import synthese
from moteur.modeles import DemandeAnalyse, DemandeClassement
from ml.priorisation import metriques as metriques_ml, prioriser
from moteur.graphe import (
    charger_environnement,
    charger_scenarios,
    construire_graphe,
    simuler,
)

app = FastAPI(title="BreachMap")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://breachmap-peach.vercel.app",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
def accueil():
    return {"message": "BreachMap API opérationnelle"}

@app.get("/environnement")
def environnement():
    return charger_environnement()


@app.get("/simulation/{depart}")
def simulation(depart: str):
    g = construire_graphe(charger_environnement())
    try:
        return {"depart": depart, "atteignables": simuler(g, depart)}
    except ValueError:
        raise HTTPException(status_code=404, detail="Actif inconnu")    

@app.get("/risque/{depart}")
def risque(depart: str):
    g = construire_graphe(charger_environnement())
    try:
        return evaluer(g, depart)
    except ValueError:
        raise HTTPException(status_code=404, detail="Actif inconnu")


@app.get("/mesures")
def mesures():
    return EFFICACITE


@app.get("/comparaison/{depart}")
def comparaison(depart: str, mesures: str = ""):
    liste = [m for m in mesures.split(",") if m]
    inconnues = [m for m in liste if m not in EFFICACITE]
    if inconnues:
        raise HTTPException(
            status_code=400, detail=f"Mesure inconnue : {', '.join(inconnues)}"
        )
    try:
        return comparer(charger_environnement(), depart, liste)
    except ValueError:
        raise HTTPException(status_code=404, detail="Actif inconnu")


@app.get("/scenarios")
def scenarios():
    """Renvoie les scénarios de démonstration (actif de départ, mesures suggérées)."""
    return charger_scenarios()


@app.get("/registre")
def registre():
    """Renvoie le registre des risques, la grille de la matrice et les seuils."""
    return {
        "risques": charger_registre(),
        "grille": grille(),
        "seuils": dict(SEUILS),
    }

@app.get("/tableau-de-bord")
def tableau_de_bord():
    """Renvoie la synthèse : indicateurs, scénarios classés, répartition des risques."""
    return synthese()

@app.get("/priorisation")
def priorisation():
    """Compare la priorisation du modèle ML à celle du moteur, avec les métriques."""
    try:
        return {"scenarios": prioriser(), "metriques": metriques_ml()}
    except FileNotFoundError:
        # 409 et non 503 : le frontend affiche le message tout de suite
        # au lieu de croire que Render se réveille et de réessayer.
        raise HTTPException(status_code=409, detail="Modèle non entraîné")


@app.get("/methode")
def methode():
    """Renvoie les paramètres de la méthode : seuils et efficacité des mesures."""
    return {
        "seuils_score": dict(SEUILS_SCORE),
        "efficacite_mesures": EFFICACITE,
        "seuils_registre": dict(SEUILS),
    }


@app.post("/analyse")
def analyse(demande: DemandeAnalyse):
    """Compare le risque avant/après pour un environnement envoyé par l'utilisateur.

    Rien n'est stocké : l'environnement est validé, utilisé pour le calcul,
    puis oublié. FastAPI refuse automatiquement (erreur 422) toute entrée
    qui ne respecte pas les règles de moteur/modeles.py.
    """
    return comparer(demande.environnement.model_dump(), demande.depart, demande.mesures)


@app.post("/analyse/classement")
def analyse_classement(demande: DemandeClassement):
    """Score de chaque actif pris comme point de compromission (scénarios générés)."""
    env = demande.environnement.model_dump()
    g = construire_graphe(env, demande.mesures)
    lignes = []
    for n in env["noeuds"]:
        ev = evaluer(g, n["id"])
        lignes.append(
            {
                "depart": n["id"],
                "nom": n["nom"],
                "score": ev["score"],
                "niveau": ev["niveau"],
                "nb_atteints": len(ev["atteignables"]),
            }
        )
    # Les actifs dont la compromission est la plus grave en premier.
    lignes.sort(key=lambda l: l["score"], reverse=True)
    return lignes