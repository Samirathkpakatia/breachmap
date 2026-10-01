import BadgeNiveau from "@/components/ui/BadgeNiveau";
import { COULEURS_BARRE } from "@/lib/niveaux";
import type { Niveau } from "@/lib/types";

const ORDRE: Niveau[] = ["critique", "élevé", "moyen", "faible"];

// Répartition des risques du registre par niveau : une barre empilée
// (chaque segment est proportionnel au nombre de risques) et le détail chiffré.
export default function RepartitionRisques({
  repartition,
  total,
}: {
  repartition: Record<Niveau, number>;
  total: number;
}) {
  // Pourcentage d'un niveau, sans diviser par zéro si le registre est vide.
  const pct = (n: Niveau) => (total > 0 ? Math.round((100 * repartition[n]) / total) : 0);

  return (
    <div>
      <div
        role="img"
        aria-label="Répartition des risques par niveau"
        className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        {ORDRE.filter((n) => repartition[n] > 0).map((n) => (
          <div
            key={n}
            className={COULEURS_BARRE[n]}
            style={{ width: `${(100 * repartition[n]) / total}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {ORDRE.map((n) => (
          <li key={n} className="flex items-center justify-between">
            <BadgeNiveau niveau={n} />
            <span className="tabular-nums">
              {repartition[n]}{" "}
              <span className="text-slate-500 dark:text-slate-400">({pct(n)} %)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}