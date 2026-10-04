import { useEffect, useState } from "react";

// Renvoie `valeur` avec un retard de `delai` ms : tant que la valeur change
// plus vite que ce délai, la valeur retardée ne bouge pas. Sans cela, chaque
// frappe au clavier dans l'éditeur enverrait une requête à l'API.
export function useDebounce<T>(valeur: T, delai: number): T {
  const [retardee, setRetardee] = useState(valeur);
  useEffect(() => {
    const minuteur = setTimeout(() => setRetardee(valeur), delai);
    return () => clearTimeout(minuteur); // une nouvelle frappe annule l'attente en cours
  }, [valeur, delai]);
  return retardee;
}