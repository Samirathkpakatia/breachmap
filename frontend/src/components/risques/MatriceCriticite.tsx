import { NIVEAUX } from "@/lib/niveaux";
import type { Niveau, Risque } from "@/lib/types";

// Libellés des axes, repris de ton document d'analyse des risques.
const VRAISEMBLANCE = ["Très faible", "Faible", "Moyenne", "Élevée", "Très élevée"];
const IMPACT = ["Très faible", "Faible", "Modéré", "Fort", "Très fort"];

// La matrice 5x5 : chaque case est colorée selon son niveau (donné par l'API)
// et contient les identifiants des risques qui s'y trouvent.
export default function MatriceCriticite({
  risques,
  grille,
}: {
  risques: Risque[];
  grille: Record<string, Niveau>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <caption className="mb-2 text-left text-slate-500 dark:text-slate-400">
          Impact (lignes) × vraisemblance (colonnes)
        </caption>
        <thead>
          <tr>
            <th />
            {[1, 2, 3, 4, 5].map((v) => (
              <th key={v} scope="col" className="px-1 pb-1 font-medium">
                {v} – {VRAISEMBLANCE[v - 1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Impact de 5 (en haut) à 1 (en bas), comme dans ton document */}
          {[5, 4, 3, 2, 1].map((i) => (
            <tr key={i}>
              <th scope="row" className="pr-2 text-left font-medium">
                {i} – {IMPACT[i - 1]}
              </th>
              {[1, 2, 3, 4, 5].map((v) => {
                const ids = risques
                  .filter((r) => r.vraisemblance === v && r.impact === i)
                  .map((r) => r.id);
                return (
                  <td
                    key={v}
                    className={`h-14 min-w-24 rounded text-center align-middle font-semibold ${NIVEAUX[grille[`${v}-${i}`]].classes}`}
                  >
                    {ids.join(", ")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}