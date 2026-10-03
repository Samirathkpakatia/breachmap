import EnTetePage from "@/components/layout/EnTetePage";
import VueMethode from "@/components/methode/VueMethode";

export default function PageMethode() {
  return (
    <>
      <EnTetePage
        titre="Méthode et limites"
        description="Formule de risque, hypothèses retenues et limites assumées du prototype."
      />
      <VueMethode />
    </>
  );
}