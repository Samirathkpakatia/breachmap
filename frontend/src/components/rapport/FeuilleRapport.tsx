import { libelleMesure } from "@/lib/mesures";
import { NIVEAUX } from "@/lib/niveaux";
import type { Comparaison, Environnement, Risque, Scenario } from "@/lib/types";

const pct = (p: number) => `${Math.round(p * 100)} %`;

// Un titre de section du rapport.
function Titre({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-5 border-b border-blue-800 pb-1 text-base font-bold text-blue-800">
      {n}. {children}
    </h2>
  );
}

// Un tableau à deux colonnes (champ / valeur).
function ChampValeur({ lignes }: { lignes: [string, string][] }) {
  return (
    <table className="w-full border-collapse text-left">
      <tbody>
        {lignes.map(([champ, valeur]) => (
          <tr key={champ}>
            <th scope="row" className="w-1/3 border border-slate-300 bg-slate-50 px-2 py-1 font-semibold">
              {champ}
            </th>
            <td className="border border-slate-300 px-2 py-1">{valeur}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FeuilleRapport({
  env,
  scenario,
  comp,
  mesures,
  risques,
  auteur,
  date,
}: {
  env: Environnement;
  scenario: Scenario;
  comp: Comparaison;
  mesures: string[]; // mesures appliquées dans ce rapport
  risques: Risque[]; // risques du registre rattachés à ce scénario
  auteur: string;
  date: string;
}) {
  const nom = (id: string) => env.noeuds.find((n) => n.id === id)?.nom ?? id;
  const apres = new Map(comp.apres.atteignables.map((a) => [a.cible, a.probabilite]));
  const nonAppliquees = scenario.mesures_suggerees.filter((m) => !mesures.includes(m));
  const lib = (m: string[]) => (m.length > 0 ? m.map(libelleMesure).join(", ") : "Aucune");

  return (
    <article
      className="mx-auto max-w-3xl bg-white p-8 text-black shadow print:max-w-none print:p-0 print:shadow-none"
      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "12pt" }}
    >
      <h1 className="text-2xl font-bold text-blue-800">Rapport d'analyse de scénario</h1>
      <p className="text-slate-600">{env.nom}</p>

      <Titre n={1}>Informations générales</Titre>
      <ChampValeur
        lignes={[
          ["Environnement", env.nom],
          ["Scénario", scenario.nom],
          ["Actif compromis", nom(scenario.depart)],
          ["Mesures appliquées", lib(mesures)],
          ["Date", date],
          ...(auteur ? ([["Auteur", auteur]] as [string, string][]) : []),
        ]}
      />

      <Titre n={2}>Description du scénario</Titre>
      <p>{scenario.description}</p>

      <Titre n={3}>Résultat</Titre>
      <ChampValeur
        lignes={[
          ["Score avant mesures", `${comp.avant.score.toFixed(1)} / 100 (${NIVEAUX[comp.avant.niveau].libelle})`],
          ["Score après mesures", `${comp.apres.score.toFixed(1)} / 100 (${NIVEAUX[comp.apres.niveau].libelle})`],
          ["Réduction du risque", `${comp.reduction_pct} %`],
        ]}
      />

      <Titre n={4}>Actifs concernés et chemins de compromission</Titre>
      {comp.avant.atteignables.length === 0 ? (
        <p>Aucun autre actif n'est atteignable depuis cet actif.</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {comp.avant.atteignables.map((a) => (
            <li key={a.cible} className="break-inside-avoid">
              <b>{nom(a.cible)}</b> : probabilité {pct(a.probabilite)} avant mesures,{" "}
              {pct(apres.get(a.cible) ?? 0)} après. Chemin le plus probable avant mesures :{" "}
              {a.chemin.map(nom).join(" → ")}.
            </li>
          ))}
        </ul>
      )}

      <Titre n={5}>Risques du registre associés</Titre>
      {risques.length === 0 ? (
        <p>Aucun risque du registre n'est rattaché à ce scénario.</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {risques.map((r) => (
            <li key={r.id}>
              <b>{r.id}</b> : {r.menace} sur {r.actif} ({r.vulnerabilite}) — niveau{" "}
              {NIVEAUX[r.niveau].libelle.toLowerCase()} (vraisemblance {r.vraisemblance}, impact {r.impact}).
            </li>
          ))}
        </ul>
      )}

      <Titre n={6}>Recommandations</Titre>
      <ul className="list-disc space-y-1 pl-5">
        <li>Mesures appliquées dans cette simulation : {lib(mesures)}.</li>
        {nonAppliquees.length > 0 && (
          <li>Mesures suggérées pour ce scénario, non appliquées ici : {lib(nonAppliquees)}.</li>
        )}
        {risques.map((r) => (
          <li key={r.id}>
            {r.id} : {r.traitement}.
          </li>
        ))}
      </ul>

      <Titre n={7}>Limites</Titre>
      <p>
        Ce rapport est une estimation fondée sur un modèle simplifié : probabilités et
        efficacités des mesures sont des hypothèses, les étapes d'un chemin sont supposées
        indépendantes, et rien ne garantit qu'une attaque réelle suivra le chemin calculé.
        Voir la page « Méthode et limites ».
      </p>
    </article>
  );
}