"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StatutApi from "./StatutApi";

// Les sept pages de l'application : une seule liste à modifier pour
// ajouter ou retirer une entrée du menu.
const LIENS = [
  { href: "/", libelle: "Tableau de bord" },
  { href: "/laboratoire", libelle: "Laboratoire" },
  { href: "/simulation", libelle: "Simulation" },
  { href: "/risques", libelle: "Registre des risques" },
  { href: "/priorisation", libelle: "Priorisation (ML)" },
  { href: "/rapport", libelle: "Rapport" },
  { href: "/methode", libelle: "Méthode et limites" },
];

export default function MenuLateral() {
  // Adresse de la page affichée : sert à surligner l'entrée active.
  const chemin = usePathname();

  return (
    // Sur grand écran : colonne fixe à gauche. Sur petit écran : bandeau en haut.
    <aside className="print:hidden border-b border-slate-200 bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between p-3 md:block md:p-4">
        <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
          BreachMap
        </span>
        <div className="md:mt-1">
          <StatutApi />
        </div>
      </div>

      <nav
        aria-label="Navigation principale"
        className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible"
      >
        {LIENS.map((l) => {
          // « / » ne doit être actif que sur l'accueil, pas sur toutes les pages.
          const actif = l.href === "/" ? chemin === "/" : chemin.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                actif
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {l.libelle}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}