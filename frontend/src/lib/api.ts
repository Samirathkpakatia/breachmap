// Adresse de l'API : lue dans la variable d'environnement
// (127.0.0.1:8000 en local, Render en ligne).
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types TypeScript : ils décrivent la forme des données reçues de l'API,
// pour que l'éditeur détecte les fautes de frappe avant l'exécution.
export type Noeud = {
  id: string;
  nom: string;
  type: string;
  zone: string;
  criticite: number; // de 1 (faible) à 5 (critique)
  x: number; // position dans le graphe
  y: number;
};

export type Relation = {
  source: string;
  cible: string;
  protocole: string;
  probabilite: number;
  mesures: string[];
};

export type Environnement = {
  nom: string;
  noeuds: Noeud[];
  relations: Relation[];
};

// Récupère le laboratoire auprès de l'API.
export async function chargerEnvironnement(): Promise<Environnement> {
  const res = await fetch(`${API_URL}/environnement`);
  if (!res.ok) throw new Error("Erreur de l'API");
  return res.json();
}