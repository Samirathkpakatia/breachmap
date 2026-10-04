"""Validation des environnements envoyés par l'utilisateur.

Ces données viennent de l'extérieur : on ne leur fait jamais confiance.
Chaque règle ci-dessous refuse une entrée incohérente ou dangereuse
(par exemple un graphe trop gros) avant que le moteur ne la voie.
"""
from pydantic import BaseModel, Field, field_validator, model_validator

from moteur.mesures import EFFICACITE

MAX_ACTIFS = 60
MAX_RELATIONS = 300
# Identifiant technique d'un actif : minuscules, chiffres et tiret bas.
MOTIF_ID = r"^[a-z0-9_]{1,40}$"


def _mesures_connues(valeurs):
    """Refuse toute mesure inconnue et supprime les doublons."""
    inconnues = [m for m in valeurs if m not in EFFICACITE]
    if inconnues:
        raise ValueError(f"Mesure inconnue : {', '.join(inconnues)}")
    return list(dict.fromkeys(valeurs))


class Actif(BaseModel):
    id: str = Field(pattern=MOTIF_ID)
    nom: str = Field(min_length=1, max_length=60)
    type: str = Field(default="autre", max_length=30)
    zone: str = Field(default="", max_length=40)
    criticite: int = Field(ge=1, le=5)  # importance de l'actif, de 1 à 5
    x: float | None = None  # position facultative (le frontend sait la calculer)
    y: float | None = None


class Relation(BaseModel):
    source: str = Field(pattern=MOTIF_ID)
    cible: str = Field(pattern=MOTIF_ID)
    protocole: str = Field(default="", max_length=60)
    # Probabilité strictement positive : le calcul des chemins prend un logarithme.
    probabilite: float = Field(ge=0.01, le=1.0)
    mesures: list[str] = Field(default_factory=list, max_length=len(EFFICACITE))

    @field_validator("mesures")
    @classmethod
    def mesures_valides(cls, valeurs):
        return _mesures_connues(valeurs)


class Environnement(BaseModel):
    nom: str = Field(min_length=1, max_length=80)
    noeuds: list[Actif] = Field(min_length=2, max_length=MAX_ACTIFS)
    relations: list[Relation] = Field(default_factory=list, max_length=MAX_RELATIONS)

    @model_validator(mode="after")
    def coherence(self):
        """Vérifie que les actifs et les relations forment un ensemble cohérent."""
        ids = [n.id for n in self.noeuds]
        if len(set(ids)) != len(ids):
            raise ValueError("Deux actifs ont le même identifiant")
        connus = set(ids)
        vues = set()
        for r in self.relations:
            if r.source not in connus or r.cible not in connus:
                raise ValueError(f"Relation vers un actif inexistant : {r.source} -> {r.cible}")
            if r.source == r.cible:
                raise ValueError("Une relation ne peut pas relier un actif à lui-même")
            if (r.source, r.cible) in vues:
                raise ValueError(f"Relation en double : {r.source} -> {r.cible}")
            vues.add((r.source, r.cible))
        return self


class DemandeClassement(BaseModel):
    """Demande : calculer le score de chaque actif pris comme point de départ."""

    environnement: Environnement
    mesures: list[str] = Field(default_factory=list, max_length=len(EFFICACITE))

    @field_validator("mesures")
    @classmethod
    def mesures_valides(cls, valeurs):
        return _mesures_connues(valeurs)


class DemandeAnalyse(DemandeClassement):
    """Demande : comparer le risque avant/après pour un actif compromis."""

    depart: str = Field(pattern=MOTIF_ID)

    @model_validator(mode="after")
    def depart_existe(self):
        if self.depart not in {n.id for n in self.environnement.noeuds}:
            raise ValueError("L'actif de départ n'existe pas dans l'environnement")
        return self