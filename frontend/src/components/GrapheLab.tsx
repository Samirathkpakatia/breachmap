"use client"; // ce composant s'exécute dans le navigateur

import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // styles de React Flow
import { chargerEnvironnement, type Environnement } from "@/lib/api";

// Couleur d'un actif selon sa criticité : du gris (faible) au rouge (critique).
const COULEURS: Record<number, string> = {
  1: "#475569",
  2: "#2563eb",
  3: "#0891b2",
  4: "#d97706",
  5: "#dc2626",
};

export default function GrapheLab() {
  // État : le laboratoire reçu de l'API, et un éventuel message d'erreur.
  const [env, setEnv] = useState<Environnement | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Au chargement de la page, on interroge l'API une seule fois.
  useEffect(() => {
    chargerEnvironnement()
      .then(setEnv)
      .catch(() => setErreur("API injoignable"));
  }, []);

  // Transforme les actifs de l'API en nœuds React Flow.
  // useMemo évite de tout recalculer à chaque affichage.
  const noeuds: Node[] = useMemo(
    () =>
      env
        ? env.noeuds.map((n) => ({
            id: n.id,
            position: { x: n.x, y: n.y },
            data: { label: n.nom },
            style: {
              background: COULEURS[n.criticite],
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              padding: 10,
              width: 160,
              fontSize: 13,
            },
          }))
        : [],
    [env]
  );

  // Transforme les relations en flèches (source -> cible).
  const liens: Edge[] = useMemo(
    () =>
      env
        ? env.relations.map((r) => ({
            id: `${r.source}-${r.cible}`,
            source: r.source,
            target: r.cible,
            markerEnd: { type: MarkerType.ArrowClosed }, // pointe de flèche
          }))
        : [],
    [env]
  );

  if (erreur) return <p className="p-6">{erreur}</p>;
  if (!env) return <p className="p-6">Chargement du laboratoire...</p>;

  return (
    // Le conteneur doit avoir une hauteur, sinon le graphe est invisible.
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow nodes={noeuds} edges={liens} colorMode="system" fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}