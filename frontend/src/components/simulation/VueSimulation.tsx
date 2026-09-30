"use client";

import { useMemo, useState } from "react";
import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import Graphe, { type EtatActif } from "@/components/graphe/Graphe";
import { useApi } from "@/hooks/useApi";
import { useEnvironnement } from "@/hooks/useEnvironnement";
import type { Comparaison, Scenario } from "@/lib/types";
import CarteScore from "./CarteScore";
import ListeAtteignables from "./ListeAtteignables";
import PanneauMesures from "./PanneauMesures";
import SelecteurScenario from "./SelecteurScenario";

export default function VueSimulation() {
  // --- Données venant de l'API ---
  const { donnees: env, erreur: erreurEnv, reveil } = useEnvironnement();
  const { donnees: scenarios, erreur: erreurSc } = useApi<Scenario[]>("/scenarios");
  const { donnees: mesuresApi, erreur: erreurMes } =
    useApi<Record<string, number>>("/mesures");

  // --- Ce dont la page se souvient ---
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [depart, setDepart] = useState<string | null>(null); // actif compromis
  const [actives, setActives] = useState<string[]>([]); // mesures cochées
  const [vue, setVue] = useState<"avant" | "apres">("apres"); // graphe affiché

  // --- La simulation : relancée automatiquement dès que l'actif ou les mesures changent ---
  const chemin = depart
    ? `/comparaison/${encodeURIComponent(depart)}?mesures=${actives.join(",")}`
    : null;
  const { donnees: comp, erreur: erreurComp } = useApi<Comparaison>(chemin);
  // On ignore un résultat qui concerne un autre actif que celui choisi.
  const resultat = comp && comp.depart === depart ? comp : null;

  // --- Ce que le graphe doit montrer, déduit du résultat (avant ou après) ---
  const { etats, liensActifs, probasLiens } = useMemo(() => {
    if (!resultat || !env) {
      return { etats: undefined, liensActifs: undefined, probasLiens: undefined };
    }
    const ev = resultat[vue];
    // Par défaut, tout actif est « épargné » (estompé)...
    const etats: Record<string, EtatActif> = {};
    for (const n of env.noeuds) etats[n.id] = "epargne";
    etats[ev.depart] = "depart"; // ...sauf le départ...
    const liensActifs = new Set<string>();
    for (const a of ev.atteignables) {
      etats[a.cible] = "atteint"; // ...et les actifs atteints
      // Chaque paire consécutive du chemin est un lien emprunté.
      for (let i = 0; i < a.chemin.length - 1; i++) {
        liensActifs.add(`${a.chemin[i]}-${a.chemin[i + 1]}`);
      }
    }
    return { etats, liensActifs, probasLiens: ev.liens };
  }, [resultat, vue, env]);

  // --- Actions de l'utilisateur ---
  function choisirScenario(s: Scenario) {
    setScenarioId(s.id);
    setDepart(s.depart);
    setActives([]); // on repart de la situation normale : tu actives les mesures toi-même
  }
  function choisirActif(id: string | null) {
    if (id === null) return; // un clic dans le vide ne change rien
    setScenarioId(null); // actif libre : plus de scénario prédéfini
    setDepart(id);
  }
  function basculerMesure(m: string) {
    setActives((l) => (l.includes(m) ? l.filter((x) => x !== m) : [...l, m]));
  }
  function reinitialiser() {
    setScenarioId(null);
    setDepart(null);
    setActives([]);
  }

  // Tant que les données de base ne sont pas là : squelette ou erreur.
  if (!env || !scenarios || !mesuresApi) {
    return <EtatApi erreur={erreurEnv ?? erreurSc ?? erreurMes} reveil={reveil} />;
  }

  const nomDepart = env.noeuds.find((n) => n.id === depart)?.nom ?? "";
  const suggerees = scenarios.find((s) => s.id === scenarioId)?.mesures_suggerees ?? [];

  return (
    <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
      {/* Colonne de gauche : configuration */}
      <div className="space-y-4">
        <Carte titre="Scénario">
          <SelecteurScenario
            scenarios={scenarios}
            choisi={scenarioId}
            onChoisir={choisirScenario}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Ou clique directement sur un actif du graphe.
          </p>
        </Carte>
        <Carte titre="Mesures de sécurité">
          <PanneauMesures
            mesures={Object.keys(mesuresApi)}
            actives={actives}
            suggerees={suggerees}
            onBasculer={basculerMesure}
            onReinitialiser={reinitialiser}
          />
        </Carte>
      </div>

      {/* Centre : le graphe */}
      <Carte>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div
            role="group"
            aria-label="Affichage du graphe"
            className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-600"
          >
            {(["avant", "apres"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vue === v}
                onClick={() => setVue(v)}
                className={`px-3 py-1 text-sm ${
                  vue === v
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {v === "avant" ? "Avant mesures" : "Après mesures"}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadre rouge : compromis au départ · orange : atteint · estompé : non atteint
          </p>
        </div>
        <Graphe
          env={env}
          selection={null}
          onSelect={choisirActif}
          etats={etats}
          liensActifs={liensActifs}
          probasLiens={probasLiens}
          afficherProbabilites
        />
      </Carte>

      {/* Colonne de droite : résultats */}
      <div className="space-y-4">
        <Carte titre="Résultat">
          {erreurComp ? (
            <EtatApi erreur={erreurComp} reveil={false} />
          ) : !resultat ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {depart
                ? "Calcul en cours…"
                : "Choisis un scénario ou clique sur un actif du graphe."}
            </p>
          ) : (
            <CarteScore comp={resultat} nomDepart={nomDepart} />
          )}
        </Carte>
        {resultat && (
          <Carte titre="Actifs atteignables (avant → après)">
            <ListeAtteignables comp={resultat} env={env} />
          </Carte>
        )}
      </div>
    </div>
  );
}