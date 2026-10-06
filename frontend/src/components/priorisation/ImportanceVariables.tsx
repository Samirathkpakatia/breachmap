import { libelleVariable, pourcent } from "@/lib/ml";

// Les variables sur lesquelles le modèle s'appuie le plus, en barres.
export default function ImportanceVariables({
  importances,
}: {
  importances: Record<string, number>;
}) {
  // Tri décroissant ; la plus importante sert de référence de largeur.
  const lignes = Object.entries(importances).sort((a, b) => b[1] - a[1]);
  const max = lignes.length > 0 ? lignes[0][1] : 1;
  return (
    <ul className="space-y-2">
      {lignes.map(([nom, v]) => (
        <li key={nom} className="text-sm">
          <div className="flex justify-between">
            <span>{libelleVariable(nom)}</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{pourcent(v)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${max > 0 ? (100 * v) / max : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}