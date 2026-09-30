import type { Comparaison, Environnement } from "./types";

// On réexporte les types pour que les anciens imports
// (`from "@/lib/api"`) continuent de fonctionner.
export * from "./types";

// Adresse de l'API : lue dans la variable d'environnement
// (127.0.0.1:8000 en local, Render en ligne).
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Erreur « attendue » : l'API a répondu, mais pour refuser la demande.
export class ErreurApi extends Error {}

const TENTATIVES = 6; // nombre d'essais avant d'abandonner
const PAUSE_MS = 4000; // attente entre deux essais
const DELAI_MS = 15000; // au-delà, un essai est considéré comme échoué

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Appelle l'API et renvoie la réponse. Deux protections :
// 1) l'API gratuite de Render s'endort : on réessaie plusieurs fois
//    au lieu d'afficher une panne tout de suite ;
// 2) `surReveil` est appelée dès le premier échec, pour que l'interface
//    puisse afficher « Réveil du serveur en cours ».
export async function appeler<T>(
  chemin: string,
  surReveil?: () => void
): Promise<T> {
  for (let essai = 0; essai < TENTATIVES; essai++) {
    // AbortController permet d'interrompre un essai trop long.
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), DELAI_MS);
    try {
      const res = await fetch(`${API_URL}${chemin}`, { signal: controle.signal });

      // Erreur 4xx : la demande est invalide (ex. actif inconnu).
      // Réessayer ne servirait à rien : on transmet le message de l'API.
      if (res.status >= 400 && res.status < 500) {
        const corps = await res.json().catch(() => null);
        throw new ErreurApi(corps?.detail ?? "Demande refusée par l'API");
      }
      if (!res.ok) throw new Error("Erreur serveur");
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof ErreurApi) throw e; // pas de nouvel essai
      if (essai === TENTATIVES - 1) throw new ErreurApi("API injoignable");
      if (essai === 0) surReveil?.(); // premier échec : on prévient l'interface
      await attendre(PAUSE_MS);
    } finally {
      clearTimeout(minuteur); // on annule le minuteur dans tous les cas
    }
  }
  throw new ErreurApi("API injoignable");
}

// --- Fonctions utilisées par le composant GrapheLab actuel ---

export const chargerEnvironnement = () => appeler<Environnement>("/environnement");

export async function chargerMesures(): Promise<string[]> {
  // L'API renvoie {"mfa": 0.6, ...} : on ne garde que les noms.
  return Object.keys(await appeler<Record<string, number>>("/mesures"));
}

export const comparer = (depart: string, mesures: string[]) =>
  appeler<Comparaison>(
    `/comparaison/${encodeURIComponent(depart)}?mesures=${mesures.join(",")}`
  );