"use client";

import { useState } from "react";
import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useApi } from "@/hooks/useApi";
import { useEnvironnement } from "@/hooks/useEnvironnement";
import { libelleMesure } from "@/lib/mesures";
import type { Comparaison, Registre, Scenario } from "@/lib/types";
import FeuilleRapport from "./FeuilleRapport";

export default function VueRapport() {
  // --- Données venant de l'API ---
  const { donnees: env, erreur: e1, reveil } = useEnvironnement();
  const { donnees: scenarios, erreur: e2 } = useApi<Scenario[]>("/scenarios");
  const { donnees: reg, erreur: e3 } = useApi<Registre>("/registre");
  const { donnees: mesuresApi, erreur: e4 } = useApi<Record<string, number>>("/mesures");

  // --- Choix de l'utilisateur ---
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  // null = « utiliser les mesures suggérées par le scénario »
  const [choisies, setChoisies] = useState<string[] | null>(null);
  const [auteur, setAuteur] = useState("");

  // Scénario retenu (le premier par défaut) et mesures appliquées.
  const scenario = scenarios ? (scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]) : undefined;
  const mesures = choisies ?? scenario?.mesures_suggerees ?? [];

  // Simulation demandée à l'API (aucun calcul dans l'interface).
  const chemin = scenario ? `/comparaison/${scenario.depart}?mesures=${mesures.join(",")}` : null;
  const { donnees: comp, erreur: e5 } = useApi<Comparaison>(chemin);

  if (!env || !scenarios || !reg || !mesuresApi || !scenario) {
    return <EtatApi erreur={e1 ?? e2 ?? e3 ?? e4} reveil={reveil} />;
  }

  function basculer(m: string) {
    const base = choisies ?? scenario?.mesures_suggerees ?? [];
    setChoisies(base.includes(m) ? base.filter((x) => x !== m) : [...base, m]);
  }

  const risques = reg.risques.filter((r) => r.scenario === scenario.id);
  // On ignore un résultat qui ne correspond pas au scénario affiché.
  const resultat = comp && comp.depart === scenario.depart ? comp : null;

  return (
    <div className="space-y-4">
      {/* Réglages : masqués à l'impression */}
      <div className="print:hidden">
        <Carte titre="Réglages du rapport">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm">
              Scénario
              <select
                value={scenario.id}
                onChange={(e) => {
                  setScenarioId(e.target.value);
                  setChoisies(null); // retour aux mesures suggérées du nouveau scénario
                }}
                className="mt-1 w-full rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600"
              >
                {scenarios.map((s, i) => (
                  <option key={s.id} value={s.id}>
                    Scénario {i + 1} : {s.nom}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="text-sm">
              <legend>Mesures appliquées</legend>
              {Object.keys(mesuresApi).map((m) => (
                <label key={m} className="flex items-center gap-2 py-0.5">
                  <input type="checkbox" checked={mesures.includes(m)} onChange={() => basculer(m)} />
                  {libelleMesure(m)}
                </label>
              ))}
            </fieldset>
            <div className="space-y-2 text-sm">
              <label className="block">
                Auteur (facultatif)
                <input
                  value={auteur}
                  onChange={(e) => setAuteur(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-slate-600"
                />
              </label>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!resultat}
                className="rounded-lg bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
              >
                Imprimer / enregistrer en PDF
              </button>
            </div>
          </div>
        </Carte>
      </div>

      {e5 ? (
        <EtatApi erreur={e5} reveil={false} />
      ) : resultat ? (
        <FeuilleRapport
          env={env}
          scenario={scenario}
          comp={resultat}
          mesures={mesures}
          risques={risques}
          auteur={auteur}
          date={new Date().toLocaleDateString("fr-FR")}
        />
      ) : (
        <p className="text-sm">Calcul en cours…</p>
      )}
    </div>
  );
}