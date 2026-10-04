"use client";

import { useRef, useState } from "react";
import { chargerEnvironnement } from "@/lib/api";
import { depuisEnvironnement, depuisJson, exporterJson, type EtatEditeur } from "@/lib/editeur";
import type { Environnement } from "@/lib/types";
import { BOUTON } from "./styles";

const TAILLE_MAX = 1_000_000; // 1 Mo : un fichier plus gros n'est pas lu

export default function BarreOutils({
  env,
  onCharger,
  onVider,
}: {
  env: Environnement; // l'environnement actuel, pour l'export
  onCharger: (e: EtatEditeur) => void;
  onVider: () => void;
}) {
  const champFichier = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);

  // Lit un fichier JSON choisi par l'utilisateur.
  async function importer(fichier: File) {
    if (fichier.size > TAILLE_MAX) {
      setMessage({ texte: "Fichier trop volumineux (1 Mo maximum).", erreur: true });
      return;
    }
    try {
      onCharger(depuisJson(await fichier.text()));
      setMessage({ texte: `« ${fichier.name} » importé.`, erreur: false });
    } catch (e) {
      setMessage({ texte: e instanceof Error ? e.message : "Import impossible.", erreur: true });
    }
  }

  // Charge le laboratoire de démonstration depuis l'API.
  async function chargerExemple() {
    try {
      onCharger(depuisEnvironnement(await chargerEnvironnement()));
      setMessage({ texte: "Laboratoire d'exemple chargé.", erreur: false });
    } catch {
      setMessage({ texte: "API injoignable.", erreur: true });
    }
  }

  // Télécharge l'environnement actuel en fichier JSON.
  function exporter() {
    const blob = new Blob([exporterJson(env)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "environnement_breachmap.json";
    lien.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={BOUTON} onClick={chargerExemple}>
          Charger le laboratoire d'exemple
        </button>
        <button type="button" className={BOUTON} onClick={() => champFichier.current?.click()}>
          Importer un fichier JSON
        </button>
        <button type="button" className={BOUTON} onClick={exporter}>
          Exporter en JSON
        </button>
        <button
          type="button"
          className={BOUTON}
          onClick={() => {
            if (window.confirm("Effacer l'environnement en cours ?")) {
              onVider();
              setMessage(null);
            }
          }}
        >
          Nouvel environnement vide
        </button>
        {/* Champ de fichier caché : on l'ouvre depuis le bouton ci-dessus */}
        <input
          ref={champFichier}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importer(f);
            e.target.value = ""; // permet de réimporter le même fichier
          }}
        />
      </div>
      {message && (
        <p
          role={message.erreur ? "alert" : "status"}
          className={`text-sm ${message.erreur ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
        >
          {message.texte}
        </p>
      )}
    </div>
  );
}