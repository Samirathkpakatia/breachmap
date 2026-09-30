import Carte from "@/components/ui/Carte";
import { libelleMesure } from "@/lib/mesures";
import type { Environnement, Noeud, Relation } from "@/lib/types";

// Une ligne de relation : l'autre actif, la probabilité, le protocole et les
// mesures qui protègent ce passage.
function LigneRelation({ autre, r }: { autre: string; r: Relation }) {
  return (
    <li className="border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800">
      <div className="flex justify-between text-sm">
        <span>{autre}</span>
        <span className="font-medium">{Math.round(r.probabilite * 100)} %</span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {r.protocole}
        {r.mesures.length > 0 &&
          ` · Mesures : ${r.mesures.map(libelleMesure).join(", ")}`}
      </div>
    </li>
  );
}

export default function FicheActif({
  env,
  noeud,
}: {
  env: Environnement;
  noeud: Noeud;
}) {
  // Retrouve le nom affiché d'un actif à partir de son identifiant.
  const nom = (id: string) => env.noeuds.find((n) => n.id === id)?.nom ?? id;

  // Relations qui ARRIVENT sur cet actif et relations qui en PARTENT.
  const entrantes = env.relations.filter((r) => r.cible === noeud.id);
  const sortantes = env.relations.filter((r) => r.source === noeud.id);

  return (
    <Carte titre={noeud.nom}>
      <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-500 dark:text-slate-400">Type</dt>
        <dd>{noeud.type}</dd>
        <dt className="text-slate-500 dark:text-slate-400">Zone</dt>
        <dd>{noeud.zone}</dd>
        <dt className="text-slate-500 dark:text-slate-400">Criticité</dt>
        <dd>{noeud.criticite} / 5</dd>
      </dl>

      <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        Peut être atteint depuis
      </h3>
      {entrantes.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune relation entrante.</p>
      ) : (
        <ul className="mb-3">
          {entrantes.map((r) => (
            <LigneRelation key={r.source} autre={nom(r.source)} r={r} />
          ))}
        </ul>
      )}

      <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        Peut atteindre
      </h3>
      {sortantes.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune relation sortante.</p>
      ) : (
        <ul>
          {sortantes.map((r) => (
            <LigneRelation key={r.cible} autre={nom(r.cible)} r={r} />
          ))}
        </ul>
      )}
    </Carte>
  );
}