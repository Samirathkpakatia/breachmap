import BadgeNiveau from "@/components/ui/BadgeNiveau";
import { pourcent } from "@/lib/ml";
import type { ScenarioML } from "@/lib/types";

// Le classement du modèle, avec l'avis du moteur à côté pour comparer.
// Les scénarios arrivent déjà triés selon le modèle (rang_ml).
export default function ComparaisonClassements({
  scenarios,
}: {
  scenarios: ScenarioML[];
}) {
  const entetes = ["Rang ML", "Scénario", "Moteur de risque", "Modèle ML", "Accord"];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr>
            {entetes.map((t) => (
              <th key={t} scope="col" className="border-b border-slate-200 px-2 py-2 dark:border-slate-700">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.id} className="border-b border-slate-100 align-top dark:border-slate-800">
              <td className="px-2 py-3 font-semibold tabular-nums">{s.rang_ml}</td>
              <td className="px-2 py-3">{s.nom}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold tabular-nums">{s.score_moteur.toFixed(1)}</span>
                  <BadgeNiveau niveau={s.niveau_moteur} />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Rang {s.rang_moteur}
                </div>
              </td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <BadgeNiveau niveau={s.niveau_ml} />
                  <span className="tabular-nums">{pourcent(s.confiance_ml, 0)}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Indice de priorité {pourcent(s.indice_priorite, 0)}
                </div>
              </td>
              {/* Le texte, pas seulement la couleur, porte l'information */}
              <td className="px-2 py-3">
                {s.concordance ? "✔ Même niveau" : "≠ Niveaux différents"}
                {s.rang_ml !== s.rang_moteur && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Rang différent
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}