from pathlib import Path

# Tous les chemins de fichiers du module ML, au même endroit.
DOSSIER = Path(__file__).resolve().parent
DATASET = DOSSIER.parent / "data" / "dataset_ml.csv"  # jeu de données généré
MODELE = DOSSIER / "modele.joblib"                     # modèle entraîné
METRIQUES = DOSSIER / "metriques.json"                 # performances mesurées

# Les niveaux de risque, du plus faible au plus élevé.
NIVEAUX = ["faible", "moyen", "élevé", "critique"]
