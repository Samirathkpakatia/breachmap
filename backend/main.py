from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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