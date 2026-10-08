"""Structure de la base de données (les tables), décrite en Python avec SQLAlchemy.

Trois tables qui reproduisent la structure de lab.json :
- environnements : un système d'information décrit (le laboratoire, la PME...) ;
- actifs : les actifs d'un environnement (les « noeuds » du graphe) ;
- relations : les passages possibles d'un actif vers un autre.

Les règles de cohérence sont écrites DANS la base : elle les fait respecter
même si un bug du programme tentait d'écrire une donnée invalide.
"""
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Classe de base de toutes les tables."""


class EnvironnementBD(Base):
    __tablename__ = "environnements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nom: Mapped[str] = mapped_column(String(80))
    # Les exemples (laboratoire, PME) sont fournis avec l'outil, pas saisis par un utilisateur.
    est_exemple: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )
    cree_le: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # cascade : supprimer l'environnement supprime aussi ses actifs et ses relations.
    actifs: Mapped[list["ActifBD"]] = relationship(
        back_populates="environnement", cascade="all, delete-orphan", order_by="ActifBD.id"
    )
    relations: Mapped[list["RelationBD"]] = relationship(
        back_populates="environnement", cascade="all, delete-orphan", order_by="RelationBD.id"
    )


class ActifBD(Base):
    __tablename__ = "actifs"
    __table_args__ = (
        # Deux actifs d'un même environnement ne peuvent pas avoir la même clé.
        UniqueConstraint("environnement_id", "cle", name="uq_actif_cle"),
        CheckConstraint("criticite BETWEEN 1 AND 5", name="ck_actif_criticite"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    environnement_id: Mapped[int] = mapped_column(
        ForeignKey("environnements.id", ondelete="CASCADE")
    )
    cle: Mapped[str] = mapped_column(String(40))  # identifiant technique : « serveur_web »
    nom: Mapped[str] = mapped_column(String(60))
    type: Mapped[str] = mapped_column(String(30), default="autre")
    zone: Mapped[str] = mapped_column(String(40), default="")
    criticite: Mapped[int] = mapped_column(Integer)
    x: Mapped[float | None] = mapped_column(Float, nullable=True)  # position (facultative)
    y: Mapped[float | None] = mapped_column(Float, nullable=True)

    environnement: Mapped["EnvironnementBD"] = relationship(back_populates="actifs")


class RelationBD(Base):
    __tablename__ = "relations"
    __table_args__ = (
        # Une relation ne peut viser que des actifs QUI EXISTENT dans le même environnement.
        ForeignKeyConstraint(
            ["environnement_id", "source"],
            ["actifs.environnement_id", "actifs.cle"],
            ondelete="CASCADE",
            name="fk_relation_source",
        ),
        ForeignKeyConstraint(
            ["environnement_id", "cible"],
            ["actifs.environnement_id", "actifs.cle"],
            ondelete="CASCADE",
            name="fk_relation_cible",
        ),
        UniqueConstraint("environnement_id", "source", "cible", name="uq_relation_paire"),
        CheckConstraint("probabilite BETWEEN 0.01 AND 1", name="ck_relation_probabilite"),
        CheckConstraint("source <> cible", name="ck_relation_pas_de_boucle"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    environnement_id: Mapped[int] = mapped_column(
        ForeignKey("environnements.id", ondelete="CASCADE")
    )
    source: Mapped[str] = mapped_column(String(40))  # clé de l'actif de départ
    cible: Mapped[str] = mapped_column(String(40))  # clé de l'actif atteint
    protocole: Mapped[str] = mapped_column(String(60), default="")
    probabilite: Mapped[float] = mapped_column(Float)
    # Liste de mesures (« mfa », « segmentation »...), stockée comme tableau PostgreSQL.
    mesures: Mapped[list[str]] = mapped_column(
        ARRAY(String(30)), default=list, server_default=text("'{}'")
    )

    environnement: Mapped["EnvironnementBD"] = relationship(back_populates="relations")