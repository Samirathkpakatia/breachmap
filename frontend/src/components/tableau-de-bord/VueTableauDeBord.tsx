"use client";

import Link from "next/link";
import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useApi } from "@/hooks/useApi";
import type { TableauDeBord } from "@/lib/types";
import RepartitionRisques from "./RepartitionRisques";
import TableauScenarios from "./TableauScenarios";

// Un indicateur : un grand chiffre et son libellé.
function Indicateur({ valeur, libelle }: { valeur: number; libelle: string }) {
  return (
    <Carte>
      <div className="text-3xl font-bold tabular-nums">{valeur}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{libelle}</div>
    </Carte>
  );
}

// Les raccourcis vers les autres pages.
const ACTIONS = [
  { href: "/simulation", libelle: "Lancer une simulation" },
  { href: "/risques", libelle: "Consulter le registre des risques" },
  { href: "/rapport", libelle: "Générer un rapport" },
];

export default function VueTableauDeBord() {
  const { donnees: tdb, erreur, reveil } = useApi<TableauDeBord>("/tableau-de-bord");

  // Tant que les données ne sont pas là : squelette ou erreur.
  if (!tdb) return <EtatApi erreur={erreur} reveil={reveil} />;

  return (
    <div className="space-y-4">
      {/* Les chiffres viennent tous de l'API : rien n'est écrit en dur. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicateur valeur={tdb.environnement.actifs} libelle="Actifs modélisés" />
        <Indicateur valeur={tdb.environnement.relations} libelle="Relations entre actifs" />
        <Indicateur valeur={tdb.scenarios.length} libelle="Scénarios simulés" />
        <Indicateur valeur={tdb.nb_risques} libelle="Risques au registre" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Carte titre="Répartition des risques du registre par niveau">
          <RepartitionRisques
            repartition={tdb.repartition_risques}
            total={tdb.nb_risques}
          />
        </Carte>
        <Carte titre="Actions rapides">
          <ul className="space-y-2">
            {ACTIONS.map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="block rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {a.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </Carte>
      </div>

      <Carte titre="Scénarios classés par niveau de risque">
        <TableauScenarios scenarios={tdb.scenarios} />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Score de 0 à 100 : part de la valeur du système d'information attendue
          comme compromise à partir de l'actif de départ. « Après mesures » applique
          les mesures suggérées pour chaque scénario.
        </p>
      </Carte>
    </div>
  );
}