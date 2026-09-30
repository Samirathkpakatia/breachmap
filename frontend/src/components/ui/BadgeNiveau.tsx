import { NIVEAUX } from "@/lib/niveaux";
import type { Niveau } from "@/lib/types";

// Petite pastille colorée qui affiche un niveau de risque.
// Les couleurs viennent de niveaux.ts : elles sont identiques partout.
export default function BadgeNiveau({ niveau }: { niveau: Niveau }) {
  const n = NIVEAUX[niveau];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${n.classes}`}
    >
      {n.libelle}
    </span>
  );
}