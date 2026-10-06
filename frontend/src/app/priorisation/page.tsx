import EnTetePage from "@/components/layout/EnTetePage";
import VuePriorisation from "@/components/priorisation/VuePriorisation";

export default function PagePriorisation() {
  return (
    <>
      <EnTetePage titre="Priorisation des scénarios" />
      <VuePriorisation />
    </>
  );
}