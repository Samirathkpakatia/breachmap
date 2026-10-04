import EnTetePage from "@/components/layout/EnTetePage";
import VueEditeur from "@/components/editeur/VueEditeur";

export default function PageEditeur() {
  return (
    <>
      <EnTetePage
        titre="Mon environnement"
        description="Décris ton propre système d'information, simule la compromission d'un actif et exporte le résultat."
      />
      <VueEditeur />
    </>
  );
}