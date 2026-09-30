"use client";

import { useState } from "react";
import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useEnvironnement } from "@/hooks/useEnvironnement";
import FicheActif from "./FicheActif";
import Graphe from "./Graphe";
import Legende from "./Legende";

// Assemble la page Laboratoire : le graphe à gauche, les informations à droite.
export default function VueLaboratoire() {
  const { donnees: env, erreur, reveil } = useEnvironnement();
  // Mémoire de la page : actif sélectionné, et affichage des probabilités.
  const [selection, setSelection] = useState<string | null>(null);
  const [probabilites, setProbabilites] = useState(false);

  // Tant que les données ne sont pas là : squelette, ou message d'erreur.
  if (!env) return <EtatApi erreur={erreur} reveil={reveil} />;

  const noeud = env.noeuds.find((n) => n.id === selection);
  // Les chiffres sont calculés depuis les données, jamais écrits en dur.
  const nbZones = new Set(env.noeuds.map((n) => n.zone)).size;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Carte>
        <div className="mb-3 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={probabilites}
              onChange={(e) => setProbabilites(e.target.checked)}
            />
            Afficher la probabilité de passage sur chaque flèche
          </label>
          <Legende />
        </div>
        <Graphe
          env={env}
          selection={selection}
          onSelect={setSelection}
          afficherProbabilites={probabilites}
        />
      </Carte>

      <div className="space-y-4">
        <Carte titre="Environnement">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Nom</dt>
            <dd>{env.nom}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Actifs</dt>
            <dd>{env.noeuds.length}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Relations</dt>
            <dd>{env.relations.length}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Zones</dt>
            <dd>{nbZones}</dd>
          </dl>
        </Carte>

        {noeud ? (
          <FicheActif env={env} noeud={noeud} />
        ) : (
          <Carte>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Clique sur un actif du graphe pour afficher sa fiche.
            </p>
          </Carte>
        )}
      </div>
    </div>
  );
}