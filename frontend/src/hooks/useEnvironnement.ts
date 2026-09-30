import { useApi } from "./useApi";
import type { Environnement } from "@/lib/types";

// Raccourci : charge le laboratoire. Toute page qui a besoin de l'environnement
// écrit simplement useEnvironnement() et récupère données, erreur et état.
export const useEnvironnement = () => useApi<Environnement>("/environnement");