import BadgeNiveau from "@/components/ui/BadgeNiveau";
import type { Risque, Scenario } from "@/lib/types";

// Le tableau des risques. Une ligne par risque.
export default function TableauRegistre({
  risques,
  scenarios,
}: {
  risques: Risque[];
  scenarios: Scenario[];
}) {
  // « Scénario 1 », « Scénario 2 »... d'après l'ordre des scénarios de l'API.
  const libelleScenario = (id: string | null) => {
    if (!id) return "—";
    const rang = scenarios.findIndex((s) => s.id === id);
    return rang >= 0 ? `Scénario ${rang + 1}` : id;
  };

  if (risques.length === 0) {
    return <p className="text-sm text-slate-500">Aucun risque pour ce filtre.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[60rem] text-left text-sm">
        <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr>
            {["ID", "Actif / processus", "Menace", "Vulnérabilité", "V", "I", "Niveau", "Traitement", "Scénario simulé"].map(
              (t) => (
                <th key={t} scope="col" className="border-b border-slate-200 px-2 py-2 dark:border-slate-700">
                  {t}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {risques.map((r) => (
            <tr key={r.id} className="border-b border-slate-100 align-top dark:border-slate-800">
              <td className="px-2 py-2 font-semibold">{r.id}</td>
              <td className="px-2 py-2">{r.actif}</td>
              <td className="px-2 py-2">{r.menace}</td>
              <td className="px-2 py-2">{r.vulnerabilite}</td>
              <td className="px-2 py-2 tabular-nums">{r.vraisemblance}</td>
              <td className="px-2 py-2 tabular-nums">{r.impact}</td>
              <td className="px-2 py-2">
                <BadgeNiveau niveau={r.niveau} />
              </td>
              <td className="px-2 py-2">{r.traitement}</td>
              <td className="px-2 py-2">{libelleScenario(r.scenario)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}