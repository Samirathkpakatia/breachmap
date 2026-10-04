import type { ActifSaisi, RelationSaisie } from "@/lib/editeur";
import { libelleMesure } from "@/lib/mesures";
import { BOUTON, CHAMP } from "./styles";

// Le tableau des relations : « depuis A, l'attaquant peut atteindre B ».
export default function EditeurRelations({
  actifs,
  relations,
  mesuresDispo,
  onModifier,
  onAjouter,
  onSupprimer,
}: {
  actifs: ActifSaisi[];
  relations: RelationSaisie[];
  mesuresDispo: string[];
  onModifier: (index: number, patch: Partial<RelationSaisie>) => void;
  onAjouter: () => void;
  onSupprimer: (index: number) => void;
}) {
  // Active ou retire une mesure sur une relation.
  const basculer = (index: number, r: RelationSaisie, m: string) =>
    onModifier(index, {
      mesures: r.mesures.includes(m) ? r.mesures.filter((x) => x !== m) : [...r.mesures, m],
    });

  return (
    <div className="space-y-2">
      {relations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                {["Depuis", "Vers", "Passage (protocole)", "Probabilité (%)", "Mesures qui la protègent", ""].map((t) => (
                  <th key={t} scope="col" className="px-1 pb-1 font-medium">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relations.map((r, i) => (
                <tr key={i} className="align-top">
                  <td className="p-1">
                    <select
                      className={CHAMP}
                      value={r.source}
                      aria-label={`Source de la relation ${i + 1}`}
                      onChange={(e) => onModifier(i, { source: e.target.value })}
                    >
                      {actifs.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nom || a.id}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <select
                      className={CHAMP}
                      value={r.cible}
                      aria-label={`Cible de la relation ${i + 1}`}
                      onChange={(e) => onModifier(i, { cible: e.target.value })}
                    >
                      {actifs.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nom || a.id}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      className={CHAMP}
                      value={r.protocole}
                      maxLength={60}
                      aria-label={`Protocole de la relation ${i + 1}`}
                      onChange={(e) => onModifier(i, { protocole: e.target.value })}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      className={`${CHAMP} w-20`}
                      type="number"
                      min={1}
                      max={100}
                      value={Math.round(r.probabilite * 100)}
                      aria-label={`Probabilité de la relation ${i + 1}, en pourcentage`}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        // Borné entre 1 % et 100 % : l'API exige au moins 0,01.
                        if (Number.isFinite(v)) {
                          onModifier(i, { probabilite: Math.min(1, Math.max(0.01, v / 100)) });
                        }
                      }}
                    />
                  </td>
                  <td className="p-1">
                    <div className="flex flex-wrap gap-x-3 text-sm">
                      {mesuresDispo.map((m) => (
                        <label key={m} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={r.mesures.includes(m)}
                            onChange={() => basculer(i, r, m)}
                          />
                          {libelleMesure(m)}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      className={BOUTON}
                      aria-label={`Supprimer la relation ${i + 1}`}
                      onClick={() => onSupprimer(i)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" className={BOUTON} onClick={onAjouter} disabled={actifs.length < 2}>
        + Ajouter une relation
      </button>
      {actifs.length < 2 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Il faut au moins deux actifs pour créer une relation.
        </p>
      )}
    </div>
  );
}