"use client";

import { useEffect, useState } from "react";

const CLE = "breachmap.theme"; // clé de stockage, la même que dans le script du layout

// Icône de soleil, dessinée en SVG : aucune bibliothèque à installer.
function Soleil() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

// Icône de lune.
function Lune() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function BoutonTheme() {
  const [sombre, setSombre] = useState(false); // clair par défaut

  // Au premier affichage : on lit l'état réel de la page. Le script du layout a
  // déjà posé (ou non) la classe « dark » avant l'affichage.
  useEffect(() => {
    setSombre(document.documentElement.classList.contains("dark"));
  }, []);

  // Applique le choix : classe sur <html> + enregistrement dans ce navigateur.
  function choisir(versSombre: boolean) {
    setSombre(versSombre);
    document.documentElement.classList.toggle("dark", versSombre);
    try {
      localStorage.setItem(CLE, versSombre ? "sombre" : "clair");
    } catch {
      /* stockage indisponible : le choix vaut pour cette visite seulement */
    }
  }

  // Style commun aux deux boutons ; le bouton actif est bleu.
  const base = "flex h-8 w-8 items-center justify-center rounded-full";
  const actif = "bg-blue-600 text-white";
  const inactif =
    "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";

  return (
    <div
      role="group"
      aria-label="Thème de l'interface"
      className="inline-flex rounded-full border border-slate-300 p-0.5 dark:border-slate-600"
    >
      <button
        type="button"
        aria-label="Thème clair"
        aria-pressed={!sombre} // annonce l'état aux lecteurs d'écran
        title="Thème clair"
        onClick={() => choisir(false)}
        className={`${base} ${!sombre ? actif : inactif}`}
      >
        <Soleil />
      </button>
      <button
        type="button"
        aria-label="Thème sombre"
        aria-pressed={sombre}
        title="Thème sombre"
        onClick={() => choisir(true)}
        className={`${base} ${sombre ? actif : inactif}`}
      >
        <Lune />
      </button>
    </div>
  );
}