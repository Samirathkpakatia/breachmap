import EnTetePage from "@/components/layout/EnTetePage";
import VueTableauDeBord from "@/components/tableau-de-bord/VueTableauDeBord";

export default function PageTableauDeBord() {
  return (
    <>
      <EnTetePage
        titre="Tableau de bord"
        description="Vue d'ensemble des scénarios et des niveaux de risque."
      />
      <VueTableauDeBord />
    </>
  );
}