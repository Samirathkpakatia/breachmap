import EnTetePage from "@/components/layout/EnTetePage";
import VueRegistre from "@/components/risques/VueRegistre";

export default function PageRisques() {
  return (
    <>
      <EnTetePage
        titre="Registre des risques"
        description="Risques du système d'information et de la solution, avec la matrice de criticité."
      />
      <VueRegistre />
    </>
  );
}