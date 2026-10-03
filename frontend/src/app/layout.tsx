import type { Metadata } from "next";
import "./globals.css";
import MenuLateral from "@/components/layout/MenuLateral";

// Titre de l'onglet du navigateur.
export const metadata: Metadata = {
  title: "BreachMap",
  description:
    "Simulation de scénarios de compromission et évaluation du risque cybersécurité",
};

// Ce cadre entoure TOUTES les pages : le menu à gauche,
// le contenu de la page choisie à droite (`children`).
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <div className="md:flex">
          <MenuLateral />
          <main className="min-w-0 flex-1 p-4 md:p-6 print:p-0">{children}</main>
        </div>
      </body>
    </html>
  );
}