"use client";

import { useState } from "react";
import BadgeNiveau from "@/components/ui/BadgeNiveau";
import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useApi } from "@/hooks/useApi";
import { NIVEAUX } from "@/lib/niveaux";
import type { Niveau, Registre, Scenario } from "@/lib/types";
import MatriceCriticite from "./MatriceCriticite";
import TableauRegistre from "./TableauRegistre";

const ORDRE: Niveau[] = ["critique", "élevé", "moyen", "faible"];

export default function VueRegistre() {
  const { donnees: reg, erreur, reveil } = useApi<Registre>("/registre");
  const { donnees: scenarios } = useApi<Scenario[]>("/scenarios");
  // Filtres choisis par l'utilisateur.
  const [portee, setPortee] = useState<"tous" | "si" | "solution">("tous");
  const [niveau, setNiveau] = useState<"tous" | Niveau>("tous");

  if (!reg || !scenarios) return <EtatApi erreur={erreur} reveil={reveil} />;

  // Risques visibles : ceux qui passent les deux filtres.
  const visibles = reg.risques.filter(
    (r) =>
      (portee === "tous" || r.portee === portee) &&
      (niveau === "tous" || r.niveau === niveau)
  );

  // Légende des seuils construite à partir de l'API (aucun chiffre en dur ici).
  const minimum = Math.min(...Object.values(reg.seuils));
  const legende =
    Object.entries(reg.seuils)
      .map(([n, m]) => `${NIVEAUX[n as Niveau].libelle} ≥ ${m}`)
      .join(" · ") + ` · Faible < ${minimum}`;

  return (
    <div className="space-y-4">
      {/* Compteurs par niveau : on compte simplement les risques de chaque niveau */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ORDRE.map((n) => (
          <Carte key={n}>
            <BadgeNiveau niveau={n} />
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {reg.risques.filter((r) => r.niveau === n).length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              sur {reg.risques.length} risques
            </div>
          </Carte>
        ))}
      </div>

      <Carte titre="Matrice de criticité">
        <MatriceCriticite risques={reg.risques} grille={reg.grille} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Niveau = vraisemblance × impact. {legende}
        </p>
      </Carte>

      <Carte titre="Registre des risques">
        <div className="mb-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            Portée
            <select
              value={portee}
              onChange={(e) => setPortee(e.target.value as typeof portee)}
              className="rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600"
            >
              <option value="tous">Tous</option>
              <option value="si">Système d'information</option>
              <option value="solution">Solution</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Niveau
            <select
              value={niveau}
              onChange={(e) => setNiveau(e.target.value as typeof niveau)}
              className="rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600"
            >
              <option value="tous">Tous</option>
              {ORDRE.map((n) => (
                <option key={n} value={n}>
                  {NIVEAUX[n].libelle}
                </option>
              ))}
            </select>
          </label>
          <span className="self-center text-slate-500 dark:text-slate-400">
            {visibles.length} risque(s) affiché(s)
          </span>
        </div>
        <TableauRegistre risques={visibles} scenarios={scenarios} />
      </Carte>
    </div>
  );
}