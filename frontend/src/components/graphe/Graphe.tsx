"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Environnement } from "@/lib/types";

// États possibles d'un actif pendant une simulation (utilisés à l'étape 3) :
// - depart : l'actif compromis au départ
// - atteint : un actif que l'attaquant peut atteindre
// - epargne : un actif non atteint (affiché estompé)
export type EtatActif = "depart" | "atteint" | "epargne";

// Les données portées par chaque bloc du graphe.
type DonneesActif = {
  nom: string;
  zone: string;
  criticite: number;
  etat?: EtatActif;
  selectionne: boolean;
};
type NoeudActif = Node<DonneesActif, "actif">;

// Couleur de la jauge selon la criticité (la criticité n'est PAS sur le cadre).
const COULEURS_CRITICITE: Record<number, string> = {
  1: "bg-slate-400",
  2: "bg-blue-500",
  3: "bg-cyan-500",
  4: "bg-amber-500",
  5: "bg-red-500",
};

// Le dessin d'un actif : un bloc avec son nom, sa zone et sa jauge de criticité.
function NoeudActifVue({ data }: NodeProps<NoeudActif>) {
  // Le cadre exprime l'ÉTAT de l'actif dans la simulation.
  let cadre = "border-slate-300 dark:border-slate-600";
  if (data.etat === "depart") cadre = "border-red-600";
  else if (data.etat === "atteint") cadre = "border-orange-500";

  const estompe = data.etat === "epargne" ? "opacity-40" : "";
  const anneau = data.selectionne ? "ring-2 ring-blue-500" : "";

  return (
    <div
      className={`w-44 rounded-lg border-2 bg-white px-3 py-2 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100 ${cadre} ${estompe} ${anneau}`}
    >
      {/* Points d'accroche des flèches (invisibles) : entrée en haut, sortie en bas */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="text-sm font-semibold">{data.nom}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{data.zone}</div>
      {/* Jauge de criticité : autant de barres colorées que le niveau (1 à 5) */}
      <div
        className="mt-1 flex items-center gap-1"
        title={`Criticité ${data.criticite} sur 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-4 rounded-sm ${
              i <= data.criticite
                ? COULEURS_CRITICITE[data.criticite]
                : "bg-slate-200 dark:bg-slate-600"
            }`}
          />
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

// Déclare à React Flow que le type de bloc "actif" utilise notre dessin.
// (Défini hors du composant pour ne pas être recréé à chaque affichage.)
const nodeTypes = { actif: NoeudActifVue };

type Props = {
  env: Environnement;
  selection: string | null; // actif sélectionné (entouré en bleu)
  onSelect: (id: string | null) => void;
  etats?: Record<string, EtatActif>; // états des actifs (étape 3)
  liensActifs?: Set<string>; // liens du chemin de compromission (étape 3)
  afficherProbabilites?: boolean; // écrit le pourcentage sur chaque flèche
  probasLiens?: Record<string, number>; // probabilités à afficher (après mesures)
};

export default function Graphe({
  env,
  selection,
  onSelect,
  etats,
  liensActifs,
  afficherProbabilites = false,
  probasLiens
}: Props) {
  // Actifs de l'API -> blocs du graphe. Positions issues de lab.json.
  const noeuds: NoeudActif[] = useMemo(
    () =>
      env.noeuds.map((n) => ({
        id: n.id,
        type: "actif",
        position: { x: n.x, y: n.y },
        draggable: false,
        data: {
          nom: n.nom,
          zone: n.zone,
          criticite: n.criticite,
          etat: etats?.[n.id],
          selectionne: n.id === selection,
        },
      })),
    [env, selection, etats]
  );

   // Relations de l'API -> flèches. Celles du chemin sont orange et animées.
  const liens: Edge[] = useMemo(
    () =>
      env.relations.map((r) => {
        const id = `${r.source}-${r.cible}`;
        const actif = liensActifs?.has(id) ?? false;
        // Quand une simulation est affichée, les flèches hors chemin sont estompées.
        const estompe = liensActifs !== undefined && !actif;
        const couleur = actif ? "#f97316" : "#94a3b8";
        // Probabilité après mesures si on l'a, sinon celle du laboratoire.
        const proba = probasLiens?.[id] ?? r.probabilite;
        return {
          id,
          source: r.source,
          target: r.cible,
          animated: actif,
          label: afficherProbabilites ? `${Math.round(proba * 100)} %` : undefined,
          // Pastille sombre + texte clair : lisible en thème clair comme sombre.
          labelStyle: { fontSize: 12, fill: "#e2e8f0" },
          labelBgStyle: { fill: "#0f172a", fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
          style: {
            stroke: couleur,
            // L'épaisseur d'une flèche du chemin suit sa probabilité :
            // une mesure la fait visiblement maigrir.
            strokeWidth: actif ? 1 + 4 * proba : 1.5,
            opacity: estompe ? 0.2 : 1,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: couleur },
        };
      }),
    [env, liensActifs, afficherProbabilites, probasLiens]
  );

  return (
    // Le conteneur doit avoir une hauteur, sinon le graphe est invisible.
    <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <ReactFlow
        nodes={noeuds}
        edges={liens}
        nodeTypes={nodeTypes}
        nodesDraggable={false} // on ne déplace pas les actifs
        nodesConnectable={false} // on ne crée pas de lien à la main
        colorMode="system" // suit le thème clair/sombre du système
        fitView
        onNodeClick={(_, n) => onSelect(n.id)} // clic sur un actif = sélection
        onPaneClick={() => onSelect(null)} // clic dans le vide = désélection
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}