import { COULEURS_BARRE } from "@/lib/niveaux";
import type { Niveau } from "@/lib/types";

// Une barre horizontale qui représente un score de 0 à 100.
// Le score étant déjà sur 100, on s'en sert directement comme largeur en %.
export default function BarreScore({
  score,
  niveau,
}: {
  score: number;
  niveau: Niveau;
}) {
  const largeur = Math.min(100, Math.max(0, score)); // borne entre 0 et 100
  return (
    <div
      role="img" // décrit la barre aux lecteurs d'écran
      aria-label={`Score ${score} sur 100`}
      className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700"
    >
      <div
        className={`h-2 rounded-full ${COULEURS_BARRE[niveau]}`}
        style={{ width: `${largeur}%` }}
      />
    </div>
  );
}