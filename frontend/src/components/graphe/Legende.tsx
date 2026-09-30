// Explique la jauge de criticité à côté du graphe.
const ECHELLE = [
  { niveau: 1, libelle: "Très faible" },
  { niveau: 2, libelle: "Faible" },
  { niveau: 3, libelle: "Modérée" },
  { niveau: 4, libelle: "Forte" },
  { niveau: 5, libelle: "Critique" },
];

export default function Legende() {
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400">
      Criticité de l'actif (jauge de 5 barres) :{" "}
      {ECHELLE.map((e) => `${e.niveau} ${e.libelle}`).join(" · ")}
    </p>
  );
}