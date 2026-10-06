// Titre (et description facultative) en haut de chaque page.
export default function EnTetePage({
  titre,
  description,
}: {
  titre: string;
  description?: string; // le « ? » rend ce champ facultatif
}) {
  return (
    <header className="mb-4 pr-24">
      <h1 className="text-2xl font-bold">{titre}</h1>
      {/* La description ne s'affiche que si elle est fournie */}
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      )}
    </header>
  );
}