// Titre et description en haut de chaque page, pour un rendu homogène.
export default function EnTetePage({
  titre,
  description,
}: {
  titre: string;
  description: string;
}) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold">{titre}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </header>
  );
}