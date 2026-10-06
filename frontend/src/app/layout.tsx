import type { Metadata } from "next";
import "./globals.css";
import MenuLateral from "@/components/layout/MenuLateral";
import BoutonTheme from "@/components/layout/BoutonTheme";

export const metadata: Metadata = {
  title: "BreachMap",
  description:
    "Simulation de scénarios de compromission et évaluation du risque cybersécurité",
};

// Ce petit script s'exécute AVANT l'affichage de la page : il lit le choix
// enregistré et pose la classe « dark » si besoin. Sans lui, la page
// clignoterait en clair avant de passer en sombre.
const SCRIPT_THEME = `(function(){try{var t=localStorage.getItem("breachmap.theme");var s=t==="sombre"||(t==="systeme"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",s);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning : le script ci-dessus modifie la classe de <html>
    // avant que React ne prenne la main, ce qui est voulu.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="min-h-screen">
        <div className="md:flex">
          <MenuLateral />
                    {/* `relative` : le bouton se place par rapport à cette zone, pas à l'écran */}
          <main className="relative min-w-0 flex-1 p-4 md:p-6 print:p-0">
            {/* Coin supérieur droit ; masqué à l'impression */}
            <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6 print:hidden">
              <BoutonTheme />
            </div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}