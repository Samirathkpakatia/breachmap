"use client";

import { useEffect, useState } from "react";
import { appeler } from "@/lib/api";

// Un « hook » est une fonction réutilisable qui donne de la mémoire et des
// réactions à un composant. Celui-ci charge des données depuis l'API et suit
// les états possibles : chargement, réveil, erreur, données reçues.
// - `chemin` à null : le chargement est en pause.
// - `corps` : du JSON déjà converti en texte ; s'il est fourni, la requête est un POST.
//   Un texte se compare par valeur : la requête ne repart que si le contenu change.
export function useApi<T>(chemin: string | null, corps?: string) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [reveil, setReveil] = useState(false);

  useEffect(() => {
    if (chemin === null) return;

    // `annule` évite d'afficher une réponse arrivée trop tard, par exemple
    // si l'utilisateur a modifié sa saisie entre-temps.
    let annule = false;
    setChargement(true);
    setErreur(null);

    appeler<T>(
      chemin,
      () => {
        if (!annule) setReveil(true);
      },
      corps
    )
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

    // Nettoyage : exécuté quand le chemin ou le corps change, ou que le composant disparaît.
    return () => {
      annule = true;
    };
  }, [chemin, corps]);

  return { donnees, erreur, chargement, reveil };
}