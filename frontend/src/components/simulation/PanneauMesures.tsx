import { libelleMesure } from "@/lib/mesures";

// Les cases des mesures de sécurité. Les mesures suggérées par le scénario
// sont signalées, mais c'est toujours l'utilisateur qui coche.
export default function PanneauMesures({
  mesures,
  actives,
  suggerees,
  onBasculer,
  onReinitialiser,
}: {
  mesures: string[];
  actives: string[];
  suggerees: string[];
  onBasculer: (m: string) => void;
  onReinitialiser: () => void;
}) {
  return (
    <div>
      {mesures.map((m) => (
        <label key={m} className="flex items-center gap-2 py-1 text-sm">
          <input
            type="checkbox"
            checked={actives.includes(m)}
            onChange={() => onBasculer(m)}
          />
          {libelleMesure(m)}
          {suggerees.includes(m) && (
            <span className="rounded bg-blue-100 px-1.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              suggérée
            </span>
          )}
        </label>
      ))}
      <button
        type="button"
        onClick={onReinitialiser}
        className="mt-2 text-xs text-blue-600 underline dark:text-blue-400"
      >
        Réinitialiser la simulation
      </button>
    </div>
  );
}