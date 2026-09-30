import type { Scenario } from "@/lib/types";

// La liste des scénarios : un bouton par scénario, celui choisi est surligné.
export default function SelecteurScenario({
  scenarios,
  choisi,
  onChoisir,
}: {
  scenarios: Scenario[];
  choisi: string | null;
  onChoisir: (s: Scenario) => void;
}) {
  return (
    <ul className="space-y-2">
      {scenarios.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            aria-pressed={s.id === choisi} // annonce l'état aux lecteurs d'écran
            onClick={() => onChoisir(s)}
            className={`w-full rounded-lg border p-2 text-left text-sm ${
              s.id === choisi
                ? "border-blue-600 bg-blue-50 dark:bg-blue-950"
                : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            <span className="font-semibold">
              Scénario {i + 1} : {s.nom}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
              {s.description}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}