import json

import joblib
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, cross_val_score

from ml.caracteristiques import NOMS
from ml.chemins import DATASET, METRIQUES, MODELE, NIVEAUX

GRAINE = 42


def nouveau_modele():
    """Forêt aléatoire : 200 arbres de décision qui votent."""
    return RandomForestClassifier(
        n_estimators=200,
        min_samples_leaf=3,        # évite d'apprendre des cas isolés par coeur
        class_weight="balanced",   # compense les niveaux peu fréquents
        random_state=GRAINE,
    )


def entrainer():
    df = pd.read_csv(DATASET)
    X = df[NOMS]            # les 8 caractéristiques
    y = df["niveau"]        # le niveau à prédire
    groupes = df["variante"]

    # Séparation 75 % / 25 % PAR VARIANTE : aucune variante n'est à la fois
    # dans l'entraînement et dans le test.
    separation = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=GRAINE)
    i_app, i_test = next(separation.split(X, y, groupes))
    X_app, X_test = X.iloc[i_app], X.iloc[i_test]
    y_app, y_test = y.iloc[i_app], y.iloc[i_test]

    # 1) Le modèle
    modele = nouveau_modele().fit(X_app, y_app)
    prediction = modele.predict(X_test)

    # 2) Le point de comparaison : répondre toujours le niveau le plus fréquent
    reference = DummyClassifier(strategy="most_frequent").fit(X_app, y_app)
    prediction_ref = reference.predict(X_test)


    # 2 bis) Mêmes mesures, mais sur les cas NON TRIVIAUX uniquement : on retire
    # les actifs qui n'atteignent rien (score 0, donc toujours « faible »),
    # trop faciles à prédire et qui gonflent les résultats.
    masque = (X_test["nb_atteignables"] > 0).to_numpy()
    y_nt = y_test[masque]
    non_triviales = {
        "nb_test": int(masque.sum()),
        "exactitude": round(accuracy_score(y_nt, prediction[masque]), 3),
        "f1_moyen": round(f1_score(y_nt, prediction[masque], average="macro"), 3),
        "exactitude_reference": round(accuracy_score(y_nt, prediction_ref[masque]), 3),
        "f1_moyen_reference": round(
            f1_score(y_nt, prediction_ref[masque], average="macro", zero_division=0), 3
        ),
    }

    # 3) Validation croisée : 5 découpages différents, pour vérifier la stabilité
    cv = cross_val_score(
        nouveau_modele(), X, y, groups=groupes,
        cv=GroupKFold(n_splits=5), scoring="f1_macro",
    )

    # Niveaux réellement présents, dans l'ordre faible -> critique
    niveaux = [n for n in NIVEAUX if n in set(y)]
    importances = sorted(
        zip(NOMS, modele.feature_importances_), key=lambda t: t[1], reverse=True
    )

    metriques = {
        "modele": "Forêt aléatoire (200 arbres)",
        "nb_lignes": len(df),
        "nb_variantes": int(groupes.nunique()),
        "nb_entrainement": len(i_app),
        "nb_test": len(i_test),
        "non_triviales": non_triviales,
        "classes": niveaux,
        "repartition": y.value_counts().to_dict(),
        "exactitude": round(accuracy_score(y_test, prediction), 3),
        "f1_moyen": round(f1_score(y_test, prediction, average="macro"), 3),
        "exactitude_reference": round(accuracy_score(y_test, prediction_ref), 3),
        "f1_moyen_reference": round(
            f1_score(y_test, prediction_ref, average="macro", zero_division=0), 3
        ),
        "validation_croisee": {
            "moyenne": round(float(cv.mean()), 3),
            "ecart_type": round(float(cv.std()), 3),
        },
        "rapport": classification_report(
            y_test, prediction, labels=niveaux, output_dict=True, zero_division=0
        ),
        "matrice_confusion": confusion_matrix(y_test, prediction, labels=niveaux).tolist(),
        "importance_variables": {nom: round(float(v), 3) for nom, v in importances},
    }

    # Sauvegarde du modèle et des métriques
    joblib.dump({"modele": modele}, MODELE)
    with open(METRIQUES, "w", encoding="utf-8") as f:
        # `default` convertit les nombres NumPy en nombres Python ordinaires
        json.dump(metriques, f, ensure_ascii=False, indent=2,
                  default=lambda o: o.item() if hasattr(o, "item") else str(o))
    return metriques


if __name__ == "__main__":
    m = entrainer()
    print(f"Lignes : {m['nb_lignes']} (entraînement {m['nb_entrainement']}, test {m['nb_test']})")
    print(f"Exactitude du modèle : {m['exactitude']}   | référence : {m['exactitude_reference']}")
    print(f"F1 moyen du modèle   : {m['f1_moyen']}   | référence : {m['f1_moyen_reference']}")
    print(f"Validation croisée   : {m['validation_croisee']}")
    print("Cas non triviaux      :", m["non_triviales"])
    print("Matrice de confusion (lignes = réel, colonnes = prédit) :")
    print(m["classes"])
    for ligne in m["matrice_confusion"]:
        print(ligne)
    print("Variables les plus utiles :", list(m["importance_variables"].items())[:4])