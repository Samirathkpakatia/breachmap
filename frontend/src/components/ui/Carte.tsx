import type { ReactNode } from "react";

// Une « carte » : le bloc blanc à bordure qui regroupe une information.
// Toute l'application utilise le même conteneur, donc le même style.
export default function Carte({
  titre,
  children,
  className = "",
}: {
  titre?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`}
    >
      {titre && (
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {titre}
        </h2>
      )}
      {children}
    </section>
  );
}