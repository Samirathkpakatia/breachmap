import EnTetePage from "@/components/layout/EnTetePage";
import VueRapport from "@/components/rapport/VueRapport";

export default function PageRapport() {
  return (
    <>
      <div className="print:hidden">
        <EnTetePage
          titre="Rapport"
          description="Restitution d'un scénario : chemins, actifs concernés, niveau de risque et recommandations."
        />
      </div>
      <VueRapport />
    </>
  );
}