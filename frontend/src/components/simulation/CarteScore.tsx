import BadgeNiveau from "@/components/ui/BadgeNiveau";
import type { Comparaison, Evaluation } from "@/lib/types";

// Un bloc : le score et le niveau d'une évaluation (avant OU après).
function Bloc({ titre, ev }: { titre: string; ev: Evaluation }) {
  return (
    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">{titre}</div>
      <div className="text-3xl font-bold tabular-nums">{ev.score.toFixed(1)}</div>
      <BadgeNiveau niveau={ev.niveau} />
    </div>
  );
}

// Le comparatif avant/après : le cœur de la démonstration.
export default function CarteScore({
  comp,
  nomDepart,
}: {
  comp: Comparaison;
  nomDepart: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm">
        Actif compromis : <b>{nomDepart}</b>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Bloc titre="Avant mesures" ev={comp.avant} />
        <Bloc titre="Après mesures" ev={comp.apres} />
      </div>
      <p className="mt-2 text-sm">
        Réduction du risque : <b>{comp.reduction_pct} %</b>
      </p>
      {comp.mesures.length === 0 && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Aucune mesure active : les deux scores sont identiques.
        </p>
      )}
    </div>
  );
}