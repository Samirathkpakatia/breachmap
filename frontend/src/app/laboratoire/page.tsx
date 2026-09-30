import EnTetePage from "@/components/layout/EnTetePage";
import VueLaboratoire from "@/components/graphe/VueLaboratoire";

// La page reste très simple : un titre, puis la vue qui fait le travail.
export default function PageLaboratoire() {
  return (
    <>
      <EnTetePage
        titre="Laboratoire"
        description="Environnement simulé : actifs, zones, relations et niveau d'exposition."
      />
      <VueLaboratoire />
    </>
  );
}