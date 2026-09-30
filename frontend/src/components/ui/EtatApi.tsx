// Ce qu'on affiche quand les données ne sont pas encore là :
// une erreur, ou un squelette de chargement avec un message si l'API se réveille.
export default function EtatApi({
  erreur,
  reveil,
}: {
  erreur: string | null;
  reveil: boolean;
}) {
  if (erreur) {
    return (
      <div
        role="alert" // annoncé par les lecteurs d'écran
        className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
      >
        {erreur}
      </div>
    );
  }
  return (
    <div role="status" className="space-y-2">
      {/* Squelette : des blocs gris qui pulsent pendant le chargement */}
      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      {reveil && (
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          Réveil du serveur en cours (cela peut prendre jusqu'à une minute)…
        </p>
      )}
    </div>
  );
}