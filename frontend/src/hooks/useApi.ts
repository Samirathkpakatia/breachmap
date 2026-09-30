"use client";

import { useEffect, useState } from "react";
import { appeler } from "@/lib/api";

// Un « hook » est une fonction réutilisable qui donne de la mémoire et des
// réactions à un composant. Celui-ci charge des données depuis l'API et suit
// les quatre états possibles : chargement, réveil, erreur, données reçues.
// Passer `null` comme chemin met le chargement en pause.
export function useApi<T>(chemin: string | null) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [reveil, setReveil] = useState(false);

  useEffect(() => {
    if (chemin === null) return;

    // `annule` évite d'afficher une réponse arrivée trop tard, par exemple
    // si tu as changé d'actif ou quitté la page entre-temps.
    let annule = false;
    setChargement(true);
    setErreur(null);

    appeler<T>(chemin, () => {
      if (!annule) setReveil(true);
    })
      .then((d) => {
        if (!annule) setDonnees(d);
      })
      .catch((e: Error) => {
        if (!annule) setErreur(e.message);
      })
      .finally(() => {
        if (!annule) {
          setChargement(false);
          setReveil(false);
        }
      });

    // Fonction de nettoyage : exécutée quand le chemin change ou que
    // le composant disparaît.
    return () => {
      annule = true;
    };
  }, [chemin]); // on relance seulement si le chemin change

  return { donnees, erreur, chargement, reveil };
}