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
};

// La comparaison avant/après l'activation de mesures de sécurité.
export type Comparaison = {
  depart: string;
  mesures: string[];
  avant: Evaluation;
  apres: Evaluation;
  reduction_pct: number;
};