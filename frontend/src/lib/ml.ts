// Noms lisibles des 8 variables du modèle (les identifiants viennent du backend).
export const LIBELLES_VARIABLES: Record<string, string> = {
  criticite_depart: "Criticité de l'actif de départ",
  degre_sortant: "Nombre de relations sortantes",
  nb_atteignables: "Nombre d'actifs atteignables",
  criticite_moy_atteignables: "Criticité moyenne des actifs atteignables",
  proba_moy_sortantes: "Probabilité moyenne des relations sortantes",
  proba_moy_globale: "Probabilité moyenne de toutes les relations",
  nb_mesures: "Nombre de mesures actives",
  part_relations_protegees: "Part des relations protégées",
};

export const libelleVariable = (v: string) => LIBELLES_VARIABLES[v] ?? v;

// 0.8712 -> "87.1 %"
export const pourcent = (x: number, decimales = 1) =>
  `${(x * 100).toFixed(decimales)} %`;