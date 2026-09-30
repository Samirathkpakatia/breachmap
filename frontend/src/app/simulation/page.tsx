import EnTetePage from "@/components/layout/EnTetePage";
import VueSimulation from "@/components/simulation/VueSimulation";

export default function PageSimulation() {
  return (
    <>
      <EnTetePage
        titre="Simulation"
        description="Simule la compromission d'un actif et compare le risque avant et après les mesures de sécurité."
      />
      <VueSimulation />
    </>
  );
}