"use client";

import { useApi } from "@/hooks/useApi";

// Le petit voyant du menu : il interroge la route d'accueil de l'API.
// Il sert aussi à réveiller Render dès que tu ouvres le site.
export default function StatutApi() {
  const { donnees, erreur, reveil } = useApi<{ message: string }>("/");

  let texte = "Connexion à l'API…";
  let couleur = "bg-slate-400";
  if (reveil) {
    texte = "Réveil du serveur…";
    couleur = "bg-yellow-500";
  } else if (erreur) {
    texte = "API hors ligne";
    couleur = "bg-red-500";
  } else if (donnees) {
    texte = "API en ligne";
    couleur = "bg-green-500";
  }

  return (
    <p
      role="status"
      className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
    >
      <span className={`h-2 w-2 rounded-full ${couleur}`} />
      {texte}
    </p>
  );
}