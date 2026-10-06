import type { Niveau } from "@/lib/types";

// Couleur d'une case selon le type de résultat :
// - diagonale : bonne prédiction ;
// - sous la diagonale (prédit < réel) : le risque est SOUS-ESTIMÉ (erreur grave) ;
// - au-dessus : le risque est surestimé (erreur moins grave).
function classeCase(reel: number, predit: number, n: number) {
  if (n === 0) return "text-slate-400";
  if (reel === predit) return "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200";
  if (predit < reel) return "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200";
  return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
}

export default function MatriceConfusion({
  classes,
  matrice,
}: {
  classes: Niveau[];
  matrice: number[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-sm">
        <caption className="mb-2 text-left text-xs text-slate-500 dark:text-slate-400">
          Lignes : niveau réel (calculé par le moteur) · Colonnes : niveau prédit par le modèle
        </caption>
        <thead>
          <tr>
            <th />
            {classes.map((c) => (
              <th key={c} scope="col" className="px-2 text-xs font-medium capitalize">
                Prédit : {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrice.map((ligne, i) => (
            <tr key={classes[i]}>
              <th scope="row" className="pr-2 text-left text-xs font-medium capitalize">
                Réel : {classes[i]}
              </th>
              {ligne.map((n, j) => (
                <td
                  key={classes[j]}
                  className={`h-10 min-w-20 rounded text-center font-semibold tabular-nums ${classeCase(i, j, n)}`}
                >
                  {n}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Vert : correct · Rouge : risque sous-estimé (le plus grave) · Orange : risque surestimé.
      </p>
    </div>
  );
}