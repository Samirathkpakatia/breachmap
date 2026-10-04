import type { EtatActif } from "@/components/graphe/Graphe";
import type { Environnement, Evaluation } from "./types";

// Transforme le résultat d'une simulation en ce que le graphe doit afficher :
// l'état de chaque actif, les liens empruntés et leurs probabilités.
export function projeter(env: Environnement, ev: Evaluation) {
  // Par défaut, tout actif est « épargné » (estompé)...
  const etats: Record<string, EtatActif> = {};
  for (const n of env.noeuds) etats[n.id] = "epargne";
  etats[ev.depart] = "depart"; // ...sauf le départ...
  const liensActifs = new Set<string>();
  for (const a of ev.atteignables) {
    etats[a.cible] = "atteint"; // ...et les actifs atteints.
    for (let i = 0; i < a.chemin.length - 1; i++) {
      liensActifs.add(`${a.chemin[i]}-${a.chemin[i + 1]}`);
    }
  }
  return { etats, liensActifs, probasLiens: ev.liens };
}