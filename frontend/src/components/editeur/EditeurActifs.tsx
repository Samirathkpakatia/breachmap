import { TYPES, type ActifSaisi } from "@/lib/editeur";
import { BOUTON, CHAMP } from "./styles";

// Le tableau des actifs : un actif par ligne, tous les champs modifiables.
export default function EditeurActifs({
  actifs,
  onModifier,
  onAjouter,
  onSupprimer,
}: {
  actifs: ActifSaisi[];
  onModifier: (id: string, patch: Partial<ActifSaisi>) => void;
  onAjouter: () => void;
  onSupprimer: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {actifs.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aucun actif. Ajoute-en, importe un fichier ou charge l'exemple.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr>
                {["Nom", "Type", "Zone", "Criticité", ""].map((t) => (
                  <th key={t} scope="col" className="px-1 pb-1 font-medium">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actifs.map((a, i) => (
                <tr key={a.id}>
                  <td className="p-1">
                    <input
                      className={CHAMP}
                      value={a.nom}
                      maxLength={60}
                      aria-label={`Nom de l'actif ${i + 1}`}
                      onChange={(e) => onModifier(a.id, { nom: e.target.value })}
                    />
                  </td>
                  <td className="p-1">
                    <select
                      className={CHAMP}
                      value={a.type}
                      aria-label={`Type de l'actif ${i + 1}`}
                      onChange={(e) => onModifier(a.id, { type: e.target.value })}
                    >
                      {/* Un type importé hors liste reste sélectionnable. */}
                      {(a.type in TYPES ? Object.keys(TYPES) : [...Object.keys(TYPES), a.type]).map((t) => (
                        <option key={t} value={t}>
                          {TYPES[t] ?? t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      className={CHAMP}
                      value={a.zone}
                      maxLength={40}
                      aria-label={`Zone de l'actif ${i + 1}`}
                      onChange={(e) => onModifier(a.id, { zone: e.target.value })}
                    />
                  </td>
                  <td className="p-1">
                    <select
                      className={CHAMP}
                      value={a.criticite}
                      aria-label={`Criticité de l'actif ${i + 1}`}
                      onChange={(e) => onModifier(a.id, { criticite: Number(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      className={BOUTON}
                      aria-label={`Supprimer l'actif ${a.nom || i + 1}`}
                      onClick={() => onSupprimer(a.id)}
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
      <button type="button" className={BOUTON} onClick={onAjouter}>
        + Ajouter un actif
      </button>
    </div>
  );
}