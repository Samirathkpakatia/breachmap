"use client";

import { useEffect, useMemo, useState } from "react";
import Graphe from "@/components/graphe/Graphe";
import CarteScore from "@/components/simulation/CarteScore";
import ListeAtteignables from "@/components/simulation/ListeAtteignables";
import PanneauMesures from "@/components/simulation/PanneauMesures";
import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import {
  creerId,
  ETAT_VIDE,
  verifier,
  versEnvironnement,
  type ActifSaisi,
  type EtatEditeur,
  type RelationSaisie,
} from "@/lib/editeur";
import { projeter } from "@/lib/simulation";
import type { Comparaison, LigneClassement } from "@/lib/types";
import BarreOutils from "./BarreOutils";
import ClassementActifs from "./ClassementActifs";
import EditeurActifs from "./EditeurActifs";
import EditeurRelations from "./EditeurRelations";
import { CHAMP } from "./styles";

// Clé sous laquelle le brouillon est gardé dans CE navigateur (jamais envoyé ailleurs).
const CLE_STOCKAGE = "breachmap.editeur.v1";

export default function VueEditeur() {
  // --- Ce dont la page se souvient ---
  const [etat, setEtat] = useState<EtatEditeur>(ETAT_VIDE); // la saisie
  const [pret, setPret] = useState(false); // le brouillon enregistré a-t-il été relu ?
  const [depart, setDepart] = useState<string | null>(null); // actif compromis
  const [actives, setActives] = useState<string[]>([]); // mesures cochées
  const { donnees: mesuresApi, erreur: erreurMesures, reveil } = useApi<Record<string, number>>("/mesures");

  // Au premier affichage : reprend le brouillon enregistré dans ce navigateur.
  useEffect(() => {
    try {
      const texte = localStorage.getItem(CLE_STOCKAGE);
      if (texte) {
        const brouillon = JSON.parse(texte) as EtatEditeur;
        if (Array.isArray(brouillon.actifs) && Array.isArray(brouillon.relations)) setEtat(brouillon);
      }
    } catch {
      /* stockage indisponible ou brouillon illisible : on repart de zéro */
    }
    setPret(true);
  }, []);

  // Enregistre le brouillon à chaque modification. Sans le drapeau `pret`, on
  // écraserait le brouillon par une saisie vide avant même de l'avoir relu.
  useEffect(() => {
    if (!pret) return;
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    } catch {
      /* ignoré */
    }
  }, [etat, pret]);

  // --- Valeurs déduites de la saisie ---
  const erreurs = useMemo(() => verifier(etat), [etat]);
  const env = useMemo(() => versEnvironnement(etat), [etat]);
  const valide = erreurs.length === 0;
  const departValide = depart !== null && etat.actifs.some((a) => a.id === depart);

  // Corps des requêtes envoyées à l'API, en JSON. On attend 500 ms après la
  // dernière modification avant d'envoyer, pour ne pas appeler l'API à chaque frappe.
  const corpsAnalyse = useDebounce(
    valide && departValide ? JSON.stringify({ environnement: env, depart, mesures: actives }) : null,
    500
  );
  const corpsClassement = useDebounce(
    valide ? JSON.stringify({ environnement: env, mesures: actives }) : null,
    500
  );
  const { donnees: comp, erreur: erreurAnalyse } = useApi<Comparaison>(
    corpsAnalyse ? "/analyse" : null,
    corpsAnalyse ?? undefined
  );
  const { donnees: classement } = useApi<LigneClassement[]>(
    corpsClassement ? "/analyse/classement" : null,
    corpsClassement ?? undefined
  );

  // On n'affiche un résultat que s'il correspond à l'actif choisi et à une saisie valide.
  const resultat = valide && departValide && comp && comp.depart === depart ? comp : null;
  const projection = useMemo(() => (resultat ? projeter(env, resultat.apres) : null), [env, resultat]);

  // --- Actions sur la saisie ---
  const modifierActif = (id: string, patch: Partial<ActifSaisi>) =>
    setEtat((e) => ({ ...e, actifs: e.actifs.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const ajouterActif = () =>
    setEtat((e) => ({
      ...e,
      actifs: [
        ...e.actifs,
        {
          id: creerId("actif", e.actifs.map((a) => a.id)),
          nom: `Actif ${e.actifs.length + 1}`,
          type: "serveur",
          zone: "",
          criticite: 3,
        },
      ],
    }));

  // Supprimer un actif supprime aussi ses relations.
  const supprimerActif = (id: string) => {
    setEtat((e) => ({
      ...e,
      actifs: e.actifs.filter((a) => a.id !== id),
      relations: e.relations.filter((r) => r.source !== id && r.cible !== id),
    }));
    if (depart === id) setDepart(null);
  };

  const modifierRelation = (index: number, patch: Partial<RelationSaisie>) =>
    setEtat((e) => ({
      ...e,
      relations: e.relations.map((r, k) => (k === index ? { ...r, ...patch } : r)),
    }));

    // Ajoute une relation sur la première paire (source, cible) encore libre,
  // pour qu'un clic ne crée jamais un doublon.
  const ajouterRelation = () =>
    setEtat((e) => {
      if (e.actifs.length < 2) return e;
      const prises = new Set(e.relations.map((r) => `${r.source}>${r.cible}`));
      for (const a of e.actifs) {
        for (const b of e.actifs) {
          if (a.id !== b.id && !prises.has(`${a.id}>${b.id}`)) {
            return {
              ...e,
              relations: [
                ...e.relations,
                { source: a.id, cible: b.id, protocole: "", probabilite: 0.5, mesures: [] },
              ],
            };
          }
        }
      }
      return e; // toutes les paires existent déjà : rien à ajouter
    });

  const supprimerRelation = (index: number) =>
    setEtat((e) => ({ ...e, relations: e.relations.filter((_, k) => k !== index) }));

  const charger = (nouveau: EtatEditeur) => {
    setEtat(nouveau);
    setDepart(null);
    setActives([]);
  };

  const basculerMesure = (m: string) =>
    setActives((l) => (l.includes(m) ? l.filter((x) => x !== m) : [...l, m]));

  // --- Affichage ---
  if (!pret || !mesuresApi) return <EtatApi erreur={erreurMesures} reveil={reveil} />;
  const nomDepart = etat.actifs.find((a) => a.id === depart)?.nom ?? "";

  return (
    <div className="space-y-4">
      <Carte>
        <BarreOutils env={env} onCharger={charger} onVider={() => charger(ETAT_VIDE)} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Ta saisie reste dans ce navigateur. L'API ne la reçoit que pour calculer, et
          l'application ne la conserve pas. N'y mets pas d'informations réelles et sensibles.
        </p>
      </Carte>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Colonne de gauche : la saisie */}
        <div className="space-y-4">
          <Carte titre="Environnement">
            <label className="block text-sm">
              Nom
              <input
                className={`${CHAMP} mt-1`}
                value={etat.nom}
                maxLength={80}
                onChange={(e) => setEtat((s) => ({ ...s, nom: e.target.value }))}
              />
            </label>
          </Carte>
          <Carte titre={`Actifs (${etat.actifs.length})`}>
            <EditeurActifs
              actifs={etat.actifs}
              onModifier={modifierActif}
              onAjouter={ajouterActif}
              onSupprimer={supprimerActif}
            />
          </Carte>
          <Carte titre={`Relations (${etat.relations.length})`}>
            <EditeurRelations
              actifs={etat.actifs}
              relations={etat.relations}
              mesuresDispo={Object.keys(mesuresApi)}
              onModifier={modifierRelation}
              onAjouter={ajouterRelation}
              onSupprimer={supprimerRelation}
            />
          </Carte>
          {erreurs.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
            >
              <b>À corriger avant de simuler :</b>
              <ul className="mt-1 list-disc pl-5">
                {erreurs.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Colonne de droite : le graphe et les résultats */}
        <div className="space-y-4">
          <Carte titre="Graphe de l'environnement">
            {etat.actifs.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Le graphe apparaîtra dès le premier actif.</p>
            ) : (
              <Graphe
                env={env}
                selection={departValide ? depart : null}
                onSelect={(id) => {
                  if (id) setDepart(id); // clic sur un actif = point de compromission
                }}
                etats={projection?.etats}
                liensActifs={projection?.liensActifs}
                probasLiens={projection?.probasLiens}
                afficherProbabilites
              />
            )}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Clique sur un actif pour simuler sa compromission. Positions calculées automatiquement.
            </p>
          </Carte>

          <Carte titre="Mesures de sécurité">
            <PanneauMesures
              mesures={Object.keys(mesuresApi)}
              actives={actives}
              suggerees={[]}
              onBasculer={basculerMesure}
              onReinitialiser={() => {
                setActives([]);
                setDepart(null);
              }}
            />
          </Carte>

          <Carte titre="Résultat">
            {valide && erreurAnalyse ? (
              <EtatApi erreur={erreurAnalyse} reveil={false} />
            ) : resultat ? (
              <CarteScore comp={resultat} nomDepart={nomDepart} />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {valide ? "Clique sur un actif du graphe ou du classement." : "Corrige la saisie pour lancer une simulation."}
              </p>
            )}
          </Carte>

          {resultat && (
            <Carte titre="Actifs atteignables (avant → après)">
              <ListeAtteignables comp={resultat} env={env} />
            </Carte>
          )}

          {valide && classement && classement.length > 0 && (
            <Carte titre="Scénarios générés : chaque actif comme point de départ">
              <ClassementActifs lignes={classement} depart={departValide ? depart : null} onChoisir={setDepart} />
            </Carte>
          )}
        </div>
      </div>
    </div>
  );
}