"use client";

import Carte from "@/components/ui/Carte";
import EtatApi from "@/components/ui/EtatApi";
import { useApi } from "@/hooks/useApi";
import { libelleMesure } from "@/lib/mesures";
import { NIVEAUX } from "@/lib/niveaux";
import type { Methode, Niveau } from "@/lib/types";

// Les limites assumées de l'outil (plan de soutenance, point 19, complété).
const LIMITES = [
  "Les probabilités des relations et l'efficacité des mesures sont des hypothèses de modélisation, pas des fréquences mesurées.",
  "Les étapes d'un chemin sont supposées indépendantes : la probabilité d'un chemin est le produit des probabilités de ses étapes.",
  "Pour chaque actif atteignable, seul le chemin le plus probable est retenu, pas la combinaison de tous les chemins.",
  "Plusieurs mesures sur une même relation se cumulent par multiplication, comme si elles agissaient indépendamment.",
  "La criticité d'un actif est une note fixe de 1 à 5 : le modèle ignore la détection, la réaction et le temps.",
  "Le simulateur ne garantit pas qu'une attaque réelle suivra le chemin calculé.",
  "Les résultats dépendent de la qualité des informations saisies sur le système d'information.",
  "Le modèle de Machine Learning imite le moteur de risque sur des données synthétiques : c'est une aide à la priorisation, pas une prédiction d'attaque.",
  "Le prototype ne remplace ni un test d'intrusion, ni un scanner professionnel, ni une équipe de sécurité.",
];

// Un bloc de la page : un titre et son contenu.
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <Carte titre={titre}>
      <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </Carte>
  );
}

// Une formule, en police à chasse fixe.
function Formule({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
      {children}
    </pre>
  );
}

export default function VueMethode() {
  const { donnees: m, erreur, reveil } = useApi<Methode>("/methode");
  if (!m) return <EtatApi erreur={erreur} reveil={reveil} />;

  // Légende d'un jeu de seuils : « Critique ≥ 35 · Élevé ≥ 20 · ... · Faible < 10 ».
  const legende = (seuils: Record<string, number>) =>
    Object.entries(seuils)
      .map(([n, v]) => `${NIVEAUX[n as Niveau].libelle} ≥ ${v}`)
      .join(" · ") + ` · Faible < ${Math.min(...Object.values(seuils))}`;

  // Exemple d'effet du MFA sur une relation à 80 %, calculé avec la valeur de l'API.
  const mfa = m.efficacite_mesures["mfa"];

  return (
    <div className="space-y-4">
      <Section titre="1. Principe">
        <p>
          Le système d'information est représenté par un <b>graphe orienté</b> : les nœuds sont
          les actifs (serveurs, bases, comptes, postes…), les flèches sont les passages
          possibles d'un actif compromis vers un autre. Chaque flèche porte une{" "}
          <b>probabilité</b> de passage, et chaque actif une <b>criticité</b> de 1 à 5.
        </p>
      </Section>

      <Section titre="2. Propagation d'une compromission">
        <p>
          À partir de l'actif compromis, le moteur recherche tous les actifs atteignables et,
          pour chacun, le chemin le plus probable. La probabilité d'un chemin est le produit
          des probabilités de ses étapes.
        </p>
        <Formule>P(chemin) = P(étape 1) × P(étape 2) × … × P(étape n)</Formule>
        <p>Exemple : serveur Web → serveur applicatif → base de données = 0,7 × 0,7 = 0,49.</p>
      </Section>

      <Section titre="3. Effet des mesures de sécurité">
        <p>
          Chaque relation indique les mesures qui la protègent. Quand une mesure est active, la
          probabilité de ces relations est multipliée par (1 − efficacité).
        </p>
        <ul className="list-disc pl-5">
          {Object.entries(m.efficacite_mesures).map(([nom, eff]) => (
            <li key={nom}>
              {libelleMesure(nom)} : efficacité {Math.round(eff * 100)} % (une relation à 80 %
              passe à {Math.round(80 * (1 - eff))} %)
            </li>
          ))}
        </ul>
        <p>
          Exemple avec le MFA : 0,8 × (1 − {mfa}) = {(0.8 * (1 - mfa)).toFixed(2)}. Les
          efficacités sont des hypothèses ; leur sensibilité est à discuter dans la validation.
        </p>
      </Section>

      <Section titre="4. Score de risque d'un scénario">
        <Formule>
          {"exposition = Σ (probabilité d'atteindre l'actif × criticité de l'actif)\n"}
          {"score      = 100 × exposition ÷ (somme des criticités des autres actifs)"}
        </Formule>
        <p>
          Le score, de 0 à 100, est la part de la valeur du système d'information attendue comme
          compromise. Exemple (serveur Web compromis) : 0,7×4 + 0,49×5 + 0,441×5 + 0,294×4 =
          8,63 ; criticité des 12 autres actifs = 43 ; score = 100 × 8,63 ÷ 43 = 20,1.
        </p>
        <p>
          <b>Niveaux :</b> {legende(m.seuils_score)}
        </p>
      </Section>

      <Section titre="5. Registre des risques">
        <p>
          Chaque risque est évalué par son analyste en vraisemblance et en impact (de 1 à 5) :
          niveau = vraisemblance × impact. <b>Niveaux :</b> {legende(m.seuils_registre)}. Chaque
          risque du système d'information est rattaché à un scénario simulé, qui quantifie sa
          propagation et l'effet des mesures.
        </p>
      </Section>

      <Section titre="6. Machine Learning">
        <p>
          Un modèle de forêt aléatoire estime le niveau de risque à partir de 8 caractéristiques
          du graphe. Il est entraîné sur des situations générées en variant le laboratoire, dont
          les niveaux sont calculés par le moteur. Détails et métriques : page « Priorisation ».
        </p>
      </Section>

      <Section titre="7. Limites assumées">
        <ul className="list-disc space-y-1 pl-5">
          {LIMITES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section titre="8. Cadre d'utilisation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Les analyses ne portent que sur des systèmes appartenant à l'utilisateur ou explicitement autorisés.</li>
          <li>Les démonstrations utilisent un laboratoire ou des données simulées ; aucune attaque réelle n'est lancée.</li>
          <li>Aucune donnée sensible n'est stockée par l'application de démonstration.</li>
        </ul>
      </Section>
    </div>
  );
}