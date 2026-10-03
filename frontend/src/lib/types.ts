// Types de données : ils décrivent la forme exacte de ce que renvoie l'API.
// TypeScript s'en sert pour signaler une faute de frappe avant l'exécution.

// Un actif du système d'information (serveur, base de données, etc.).
export type Noeud = {
  id: string;
  nom: string;
  type: string;
  zone: string;
  criticite: number; // de 1 (faible) à 5 (critique)
  x: number; // position dans le graphe
  y: number;
};

// Une relation : depuis `source`, l'attaquant peut atteindre `cible`.
export type Relation = {
  source: string;
  cible: string;
  protocole: string;
  probabilite: number; // facilité du passage, entre 0 et 1
  mesures: string[]; // mesures qui protègent cette relation
};

// Le laboratoire complet, tel que décrit dans lab.json.
export type Environnement = {
  nom: string;
  noeuds: Noeud[];
  relations: Relation[];
};

// Un actif que l'attaquant peut atteindre, avec le chemin le plus probable.
export type Atteignable = {
  cible: string;
  chemin: string[];
  probabilite: number;
  criticite: number;
};

// Les quatre niveaux de risque définis par le moteur.
export type Niveau = "faible" | "moyen" | "élevé" | "critique";

// Le résultat d'une évaluation : score, niveau et actifs atteints.
export type Evaluation = {
  depart: string;
  score: number;
  niveau: Niveau;
  atteignables: Atteignable[];
  liens: Record<string, number>; // probabilité de chaque relation ("source-cible")
};

// La comparaison avant/après l'activation de mesures de sécurité.
export type Comparaison = {
  depart: string;
  mesures: string[];
  avant: Evaluation;
  apres: Evaluation;
  reduction_pct: number;
};

// Un scénario de démonstration proposé à l'utilisateur.
export type Scenario = {
  id: string;
  nom: string;
  description: string;
  depart: string; // identifiant de l'actif compromis au départ
  mesures_suggerees: string[];
};

// Un risque du registre (système d'information ou solution).
export type Risque = {
  id: string;
  portee: "si" | "solution";
  actif: string;
  menace: string;
  vulnerabilite: string;
  vraisemblance: number; // de 1 à 5
  impact: number; // de 1 à 5
  criticite: number; // vraisemblance x impact, calculée par l'API
  niveau: Niveau;
  traitement: string;
  scenario: string | null; // scénario simulé correspondant, le cas échéant
};

// Ce que renvoie la route /registre.
export type Registre = {
  risques: Risque[];
  grille: Record<string, Niveau>; // niveau de chaque case "vraisemblance-impact"
  seuils: Record<string, number>; // seuils des niveaux sur le produit
};


// Résumé d'un scénario, tel que renvoyé par /tableau-de-bord.
export type ResumeScenario = {
  id: string;
  nom: string;
  depart: string;
  depart_nom: string;
  mesures: string[]; // mesures suggérées appliquées pour le score « après »
  score_avant: number;
  niveau_avant: Niveau;
  score_apres: number;
  niveau_apres: Niveau;
  reduction_pct: number;
  nb_atteints: number;
};

// Ce que renvoie la route /tableau-de-bord.
export type TableauDeBord = {
  environnement: { nom: string; actifs: number; relations: number };
  scenarios: ResumeScenario[]; // déjà classés du plus au moins risqué
  repartition_risques: Record<Niveau, number>;
  nb_risques: number;
};

// Paramètres de la méthode, tels que renvoyés par /methode.
export type Methode = {
  seuils_score: Record<string, number>; // seuils des niveaux sur le score (0 à 100)
  efficacite_mesures: Record<string, number>; // part de probabilité retirée par mesure
  seuils_registre: Record<string, number>; // seuils des niveaux sur vraisemblance x impact
};