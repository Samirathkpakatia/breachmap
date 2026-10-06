"use client";

import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useApi } from "@/hooks/useApi";
import type { Priorisation } from "@/lib/types";
import ComparaisonClassements from "./ComparaisonClassements";
import ImportanceVariables from "./ImportanceVariables";
import MatriceConfusion from "./MatriceConfusion";
import MetriquesModele from "./MetriquesModele";

export default function VuePriorisation() {
  const { donnees: p, erreur, reveil } = useApi<Priorisation>("/priorisation");

  // Tant que les données ne sont pas là : squelette ou message d'erreur.
  if (!p) return <EtatApi erreur={erreur} reveil={reveil} />;

  const m = p.metriques;
  return (
    <div className="space-y-4">

      <Carte titre="Priorisation des scénarios : modèle ML et moteur de risque">
        <ComparaisonClassements scenarios={p.scenarios} />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Classement selon l'indice de priorité du modèle (probabilité d'être au moins
          « élevé »). Le moteur reste la référence : en cas de désaccord, c'est le cas à
          examiner de près, par exemple un score proche d'un seuil.
        </p>
      </Carte>

      <Carte titre="Performances du modèle">
        <MetriquesModele m={m} />
      </Carte>

      <div className="grid gap-4 lg:grid-cols-2">
        <Carte titre="Matrice de confusion">
          <MatriceConfusion classes={m.classes} matrice={m.matrice_confusion} />
        </Carte>
        <Carte titre="Variables les plus utilisées par le modèle">
          <ImportanceVariables importances={m.importance_variables} />
        </Carte>
      </div>
    </div>
  );
}