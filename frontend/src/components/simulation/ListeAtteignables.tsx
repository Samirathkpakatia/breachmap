import type { Comparaison, Environnement } from "@/lib/types";

const pct = (p: number) => `${Math.round(p * 100)} %`;

// Pour chaque actif atteignable : sa probabilité d'être compromis,
// avant puis après les mesures.
export default function ListeAtteignables({
  comp,
  env,
}: {
  comp: Comparaison;
  env: Environnement;
}) {
  const nom = (id: string) => env.noeuds.find((n) => n.id === id)?.nom ?? id;
  // Table de recherche : cible -> probabilité après mesures.
  const apres = new Map(comp.apres.atteignables.map((a) => [a.cible, a.probabilite]));

  return (
    <ul>
      {comp.avant.atteignables.map((a) => (
        <li
          key={a.cible}
          className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0 dark:border-slate-800"
        >
          <span>{nom(a.cible)}</span>
          <span className="tabular-nums text-slate-600 dark:text-slate-300">
            {pct(a.probabilite)} → <b>{pct(apres.get(a.cible) ?? 0)}</b>
          </span>
        </li>
      ))}
    </ul>
  );
}