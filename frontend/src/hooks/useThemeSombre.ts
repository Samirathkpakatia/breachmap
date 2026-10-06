import { useEffect, useState } from "react";

// Indique si le thème sombre est actif (classe « dark » sur <html>) et se met
// à jour quand l'utilisateur change de thème.
export function useThemeSombre() {
  const [sombre, setSombre] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const lire = () => setSombre(html.classList.contains("dark"));
    lire();
    // MutationObserver : être prévenu quand la classe de <html> change.
    const observateur = new MutationObserver(lire);
    observateur.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observateur.disconnect();
  }, []);
  return sombre;
}