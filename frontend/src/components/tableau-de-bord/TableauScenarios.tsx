import BadgeNiveau from "@/components/ui/BadgeNiveau";
import BarreScore from "@/components/ui/BarreScore";
import { libelleMesure } from "@/lib/mesures";
import type { ResumeScenario } from "@/lib/types";

// Le classement des scénarios : du plus risqué au moins risqué (sans mesure).
// Pour chacun : score avant, mesures suggérées, score après, réduction.
export default function TableauScenarios({
  scenarios,
}: {
  scenarios: ResumeScenario[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr>
            {["Rang", "Scénario", "Avant mesures", "Mesures suggérées", "Après mesures", "Réduction"].map(
              (t) => (
                <th
                  key={t}
                  scope="col"
                  className="border-b border-slate-200 px-2 py-2 dark:border-slate-700"
                >
                  {t}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s, i) => (
            <tr
              key={s.id}
              className="border-b border-slate-100 align-top dark:border-slate-800"
            >
              <td className="px-2 py-3 font-semibold tabular-nums">{i + 1}</td>
              <td className="px-2 py-3">
                <div className="font-medium">{s.nom}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Départ : {s.depart_nom} · {s.nb_atteints} actif(s) atteignable(s)
                </div>
              </td>
              <td className="w-40 px-2 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums">
                    {s.score_avant.toFixed(1)}
                  </span>
                  <BadgeNiveau niveau={s.niveau_avant} />
                </div>
                <BarreScore score={s.score_avant} niveau={s.niveau_avant} />
              </td>
              <td className="px-2 py-3 text-xs">
                {s.mesures.map(libelleMesure).join(", ")}
              </td>
              <td className="w-40 px-2 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums">
                    {s.score_apres.toFixed(1)}
                  </span>
                  <BadgeNiveau niveau={s.niveau_apres} />
                </div>
                <BarreScore score={s.score_apres} niveau={s.niveau_apres} />
              </td>
              <td className="px-2 py-3 text-base font-semibold tabular-nums">
                −{s.reduction_pct} %
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}