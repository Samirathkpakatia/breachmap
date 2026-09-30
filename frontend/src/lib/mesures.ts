// Noms affichables des mesures de sécurité. L'API renvoie des identifiants
// techniques ("moindre_privilege") : on les traduit ici, à un seul endroit.
export const LIBELLES_MESURES: Record<string, string> = {
  mfa: "MFA",
  segmentation: "Segmentation",
  moindre_privilege: "Moindre privilège",
  durcissement: "Durcissement",
};

// Si une mesure n'est pas dans la liste, on affiche son identifiant tel quel.
export const libelleMesure = (m: string) => LIBELLES_MESURES[m] ?? m;