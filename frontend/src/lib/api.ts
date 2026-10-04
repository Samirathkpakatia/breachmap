import type { Environnement } from "./types";

// On réexporte les types pour que les imports `from "@/lib/api"` continuent de marcher.
export * from "./types";

// Adresse de l'API : lue dans la variable d'environnement.
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Erreur « attendue » : l'API a répondu, mais pour refuser la demande.
export class ErreurApi extends Error {}

const TENTATIVES = 6; // nombre d'essais avant d'abandonner
const PAUSE_MS = 4000; // attente entre deux essais
const DELAI_MS = 15000; // au-delà, un essai est considéré comme échoué

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

// FastAPI renvoie « detail » sous forme de texte (nos erreurs) ou de liste
// (erreurs de validation des données envoyées). On en fait un texte lisible.
function messageDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (!d || typeof d.msg !== "string") return "";
        const msg = d.msg.replace(/^Value error, /, "");
        const lieu = Array.isArray(d.loc) ? d.loc.slice(1).join(".") : "";
        return lieu ? `${lieu} : ${msg}` : msg;
      })
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

// Appelle l'API et renvoie la réponse.
// - Sans `corps` : requête GET. Avec `corps` (du JSON déjà converti en texte) : POST.
// - L'API gratuite de Render s'endort : on réessaie plusieurs fois au lieu
//   d'afficher une panne tout de suite.
// - `surReveil` est appelée dès le premier échec, pour afficher « Réveil du serveur ».
export async function appeler<T>(
  chemin: string,
  surReveil?: () => void,
  corps?: string
): Promise<T> {
  const options: RequestInit =
    corps === undefined
      ? {}
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: corps };

  for (let essai = 0; essai < TENTATIVES; essai++) {
    // AbortController permet d'interrompre un essai trop long.
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), DELAI_MS);
    try {
      const res = await fetch(`${API_URL}${chemin}`, { ...options, signal: controle.signal });

      // Erreur 4xx : la demande est invalide. Réessayer ne servirait à rien :
      // on transmet le message de l'API.
      if (res.status >= 400 && res.status < 500) {
        const reponse = await res.json().catch(() => null);
        throw new ErreurApi(messageDetail(reponse?.detail) || "Demande refusée par l'API");
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

// Charge le laboratoire d'exemple (utilisé par l'éditeur).
export const chargerEnvironnement = () => appeler<Environnement>("/environnement");