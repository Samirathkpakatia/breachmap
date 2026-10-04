import type { Environnement } from "./types";

// --- Les données saisies dans l'éditeur ---

// Un actif tel que saisi par l'utilisateur. L'`id` est créé une fois à
// l'ajout et ne change plus : renommer un actif ne casse donc pas ses relations.
export type ActifSaisi = {
  id: string;
  nom: string;
  type: string;
  zone: string;
  criticite: number;
};

export type RelationSaisie = {
  source: string; // id de l'actif de départ
  cible: string; // id de l'actif atteint
  protocole: string;
  probabilite: number; // entre 0.01 et 1
  mesures: string[];
};

export type EtatEditeur = {
  nom: string;
  actifs: ActifSaisi[];
  relations: RelationSaisie[];
};

export const ETAT_VIDE: EtatEditeur = { nom: "Mon environnement", actifs: [], relations: [] };

// Types d'actifs proposés (libellés affichés).
export const TYPES: Record<string, string> = {
  serveur: "Serveur",
  base: "Base de données",
  poste: "Poste utilisateur",
  reseau: "Équipement réseau",
  securite: "Sécurité (pare-feu…)",
  acces_distant: "Accès distant (VPN)",
  identite: "Compte / identité",
  donnees: "Données",
  sauvegarde: "Sauvegarde",
  externe: "Externe (Internet)",
  autre: "Autre",
};

const MOTIF_ID = /^[a-z0-9_]{1,40}$/;
const MAX_ACTIFS = 60;
const MAX_RELATIONS = 300;

// Fabrique un identifiant technique unique à partir d'un texte :
// « Base clients » -> « base_clients », puis « base_clients_2 » s'il existe déjà.
export function creerId(texte: string, existants: string[]): string {
  const base =
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // retire les accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 30) || "actif";
  let id = base;
  let n = 2;
  while (existants.includes(id)) {
    id = `${base}_${n}`;
    n++;
  }
  return id;
}

// --- Mise en page automatique ---
// Les actifs sont rangés en couches : la couche d'un actif est sa distance
// (en nombre de relations) depuis les actifs sans relation entrante.
// Plus besoin d'écrire des coordonnées à la main.
export function miseEnPage(
  ids: string[],
  relations: { source: string; cible: string }[]
): Record<string, { x: number; y: number }> {
  const sortantes = new Map<string, string[]>(ids.map((i) => [i, []]));
  const nbEntrantes = new Map<string, number>(ids.map((i) => [i, 0]));
  for (const r of relations) {
    if (sortantes.has(r.source) && nbEntrantes.has(r.cible)) {
      sortantes.get(r.source)!.push(r.cible);
      nbEntrantes.set(r.cible, nbEntrantes.get(r.cible)! + 1);
    }
  }

  const couche = new Map<string, number>();
  // Parcours en largeur à partir d'une liste d'actifs placés en couche 0.
  const parcourir = (racines: string[]) => {
    const file = [...racines];
    racines.forEach((r) => couche.set(r, 0));
    while (file.length > 0) {
      const courant = file.shift()!;
      for (const suivant of sortantes.get(courant) ?? []) {
        if (!couche.has(suivant)) {
          couche.set(suivant, couche.get(courant)! + 1);
          file.push(suivant);
        }
      }
    }
  };
  // 1) à partir des actifs sans relation entrante (les points d'entrée) ;
  parcourir(ids.filter((i) => nbEntrantes.get(i) === 0));
  // 2) puis pour ce qui reste (groupes d'actifs qui ne forment qu'un cycle).
  for (const id of ids) {
    if (!couche.has(id)) parcourir([id]);
  }

  // Les actifs d'une même couche sont répartis horizontalement et centrés.
  const parCouche = new Map<number, string[]>();
  for (const id of ids) {
    const n = couche.get(id) ?? 0;
    parCouche.set(n, [...(parCouche.get(n) ?? []), id]);
  }
  const positions: Record<string, { x: number; y: number }> = {};
  parCouche.forEach((liste, n) => {
    liste.forEach((id, i) => {
      positions[id] = { x: (i - (liste.length - 1) / 2) * 200, y: n * 130 };
    });
  });
  return positions;
}

// --- Conversions ---

// Saisie -> environnement complet (avec positions), prêt pour l'API et le graphe.
export function versEnvironnement(e: EtatEditeur): Environnement {
  const pos = miseEnPage(e.actifs.map((a) => a.id), e.relations);
  return {
    nom: e.nom.trim() || "Environnement",
    noeuds: e.actifs.map((a) => ({
      id: a.id,
      nom: a.nom.trim() || a.id,
      type: a.type,
      zone: a.zone,
      criticite: a.criticite,
      x: pos[a.id]?.x ?? 0,
      y: pos[a.id]?.y ?? 0,
    })),
    relations: e.relations,
  };
}

// Environnement de l'API -> saisie (on garde seulement ce qui est modifiable).
export function depuisEnvironnement(env: Environnement): EtatEditeur {
  return {
    nom: env.nom,
    actifs: env.noeuds.map(({ id, nom, type, zone, criticite }) => ({ id, nom, type, zone, criticite })),
    relations: env.relations.map((r) => ({ ...r })),
  };
}

// Texte JSON exporté : même format que le fichier du laboratoire.
export const exporterJson = (env: Environnement) =>
  JSON.stringify({ nom: env.nom, noeuds: env.noeuds, relations: env.relations }, null, 2);

// Lit un fichier JSON importé. Contrôle de forme minimal : l'API refera une
// validation complète, c'est elle qui fait autorité.
export function depuisJson(texte: string): EtatEditeur {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  const o = (typeof brut === "object" && brut !== null ? brut : {}) as Record<string, unknown>;
  if (!Array.isArray(o.noeuds) || !Array.isArray(o.relations)) {
    throw new Error("Le fichier doit contenir les listes « noeuds » et « relations ».");
  }
  const txt = (v: unknown, defaut = "") => (typeof v === "string" ? v : defaut);
  const nb = (v: unknown, defaut: number) => (typeof v === "number" && Number.isFinite(v) ? v : defaut);

  return {
    nom: txt(o.nom, "Environnement importé"),
    actifs: o.noeuds.map((n: unknown) => {
      const x = (n ?? {}) as Record<string, unknown>;
      return {
        id: txt(x.id),
        nom: txt(x.nom, txt(x.id)),
        type: txt(x.type, "autre"),
        zone: txt(x.zone),
        criticite: nb(x.criticite, 3),
      };
    }),
    relations: o.relations.map((n: unknown) => {
      const x = (n ?? {}) as Record<string, unknown>;
      return {
        source: txt(x.source),
        cible: txt(x.cible),
        protocole: txt(x.protocole),
        probabilite: nb(x.probabilite, 0.5),
        mesures: Array.isArray(x.mesures)
          ? x.mesures.filter((m): m is string => typeof m === "string")
          : [],
      };
    }),
  };
}

// --- Vérification locale (confort de saisie : l'API refait toujours la sienne) ---
export function verifier(e: EtatEditeur): string[] {
  const erreurs: string[] = [];
  if (e.actifs.length < 2) erreurs.push("Il faut au moins deux actifs.");
  if (e.actifs.length > MAX_ACTIFS) erreurs.push(`Maximum ${MAX_ACTIFS} actifs.`);
  if (e.relations.length > MAX_RELATIONS) erreurs.push(`Maximum ${MAX_RELATIONS} relations.`);
  if (e.actifs.some((a) => a.nom.trim() === "")) erreurs.push("Chaque actif doit avoir un nom.");

  const noms = e.actifs.map((a) => a.nom.trim().toLowerCase());
  if (new Set(noms).size !== noms.length) erreurs.push("Deux actifs portent le même nom.");

  const ids = e.actifs.map((a) => a.id);
  if (ids.some((i) => !MOTIF_ID.test(i))) {
    erreurs.push("Identifiant d'actif invalide : minuscules, chiffres et _ uniquement (fichier importé).");
  }
  if (new Set(ids).size !== ids.length) erreurs.push("Deux actifs ont le même identifiant.");

  const vues = new Set<string>();
  for (const r of e.relations) {
    if (!ids.includes(r.source) || !ids.includes(r.cible)) {
      erreurs.push("Une relation pointe vers un actif inexistant.");
    }
    if (r.source === r.cible) erreurs.push("Une relation ne peut pas relier un actif à lui-même.");
    const cle = `${r.source}>${r.cible}`;
    if (vues.has(cle)) erreurs.push("Deux relations ont la même source et la même cible.");
    vues.add(cle);
  }
  return Array.from(new Set(erreurs)); // chaque message une seule fois
}