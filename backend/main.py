from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from moteur.graphe import charger_environnement, construire_graphe, simuler
from moteur.mesures import EFFICACITE
from moteur.risque import comparer, evaluer

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