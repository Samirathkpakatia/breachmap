import type { Niveau } from "./types";

// Source unique pour l'apparence des niveaux de risque.
// Les couleurs sont les mêmes partout dans l'application : c'est la cohérence
// visuelle dont le jury a besoin pour lire les résultats sans effort.
export const NIVEAUX: Record<Niveau, { libelle: string; classes: string }> = {
  faible: {
    libelle: "Faible",
    classes: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  },
  moyen: {
    libelle: "Moyen",
    classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  élevé: {
    libelle: "Élevé",
    classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  critique: {
    libelle: "Critique",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  },
};