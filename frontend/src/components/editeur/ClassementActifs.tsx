import BadgeNiveau from "@/components/ui/BadgeNiveau";
import BarreScore from "@/components/ui/BarreScore";
import type { LigneClassement } from "@/lib/types";

// Les scénarios générés automatiquement : chaque actif pris comme point de
// départ, classé du plus grave au moins grave. Un clic le sélectionne.
export default function ClassementActifs({
  lignes,
  depart,
  onChoisir,
}: {
  lignes: LigneClassement[];
  depart: string | null;
  onChoisir: (id: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {lignes.map((l, i) => (
        <li key={l.depart}>
          <button
            type="button"
            aria-pressed={l.depart === depart}
            onClick={() => onChoisir(l.depart)}
            className={`w-full rounded-lg border p-2 text-left text-sm ${
              l.depart === depart
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span>
                {i + 1}. {l.nom}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold tabular-nums">{l.score.toFixed(1)}</span>
                <BadgeNiveau niveau={l.niveau} />
              </span>
            </div>
            <div className="mt-1">
              <BarreScore score={l.score} niveau={l.niveau} />
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {l.nb_atteints} actif(s) atteignable(s)
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}