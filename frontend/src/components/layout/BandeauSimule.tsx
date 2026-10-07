// Rappel permanent : l'outil ne traite que des données simulées.
// La fiche de soutenance exige que ce caractère soit explicite partout.
export default function BandeauSimule() {
  return (
    <div
      role="note"
      className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 print:hidden dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
    >
      <b>Environnement simulé</b> : prototype de démonstration, aucune donnée réelle.
      N'y saisis pas d'informations sensibles.
    </div>
  );
}