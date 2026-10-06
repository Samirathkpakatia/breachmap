import Carte from "@/components/ui/Carte";
import { pourcent } from "@/lib/ml";
import type { LigneRapport, MetriquesML } from "@/lib/types";

// Une mesure du modèle, placée à côté du modèle « de référence »
// (celui qui répond toujours le niveau le plus fréquent).
function Comparaison({
  titre,
  valeur,
  reference,
}: {
  titre: string;
  valeur: number;
  reference: number;
}) {
  return (
    <Carte>
      <div className="text-xs text-slate-500 dark:text-slate-400">{titre}</div>
      <div className="text-3xl font-bold tabular-nums">{pourcent(valeur)}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Référence (niveau le plus fréquent) : {pourcent(reference)}
      </div>
    </Carte>
  );
}

export default function MetriquesModele({ m }: { m: MetriquesML }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Comparaison titre="Exactitude (jeu de test)" valeur={m.exactitude} reference={m.exactitude_reference} />
        <Comparaison titre="F1 moyen (jeu de test)" valeur={m.f1_moyen} reference={m.f1_moyen_reference} />
        <Carte>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Validation croisée (5 découpages, F1 moyen)
          </div>
          <div className="text-3xl font-bold tabular-nums">
            {pourcent(m.validation_croisee.moyenne)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Écart-type : {pourcent(m.validation_croisee.ecart_type)}
          </div>
        </Carte>
      </div>

      {/* Mêmes mesures sans les actifs qui n'atteignent rien (score 0, trop faciles).
          Affiché seulement si l'API fournit cette mesure. */}
      {m.non_triviales && (
        <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          <b>Sur les cas non triviaux uniquement</b> ({m.non_triviales.nb_test} lignes de
          test, actifs qui atteignent au moins un autre actif) : exactitude{" "}
          {pourcent(m.non_triviales.exactitude)} (référence{" "}
          {pourcent(m.non_triviales.exactitude_reference)}), F1 moyen{" "}
          {pourcent(m.non_triviales.f1_moyen)} (référence{" "}
          {pourcent(m.non_triviales.f1_moyen_reference)}).
        </div>
      )}

      <p className="text-sm text-slate-600 dark:text-slate-400">
        {m.modele} · {m.nb_lignes} lignes générées à partir de {m.nb_variantes} variantes du
        laboratoire · {m.nb_entrainement} pour l'entraînement, {m.nb_test} pour le test
        (séparés par variante).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="mb-2 text-left text-xs text-slate-500 dark:text-slate-400">
            Performances par niveau de risque (jeu de test)
          </caption>
          <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              {["Niveau", "Précision", "Rappel", "F1", "Lignes de test"].map((t) => (
                <th key={t} scope="col" className="border-b border-slate-200 px-2 py-1 dark:border-slate-700">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.classes.map((c) => {
              // Le rapport contient aussi des totaux : on ne garde que le niveau c.
              const l = m.rapport[c] as LigneRapport;
              return (
                <tr key={c} className="border-b border-slate-100 dark:border-slate-800">
                  <th scope="row" className="px-2 py-1 font-medium capitalize">{c}</th>
                  <td className="px-2 py-1 tabular-nums">{pourcent(l.precision)}</td>
                  <td className="px-2 py-1 tabular-nums">{pourcent(l.recall)}</td>
                  <td className="px-2 py-1 tabular-nums">{pourcent(l["f1-score"])}</td>
                  <td className="px-2 py-1 tabular-nums">{l.support}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}