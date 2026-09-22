import { VueFeuilleDeRoute } from "@/components/VueFeuilleDeRoute";
import { STOCKAGE_DISTANT, lireEtat } from "@/server/stockage";

/** L'état vit dans le stockage partagé : la page est rendue à chaque requête. */
export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <VueFeuilleDeRoute
      initial={await lireEtat()}
      stockageDistant={STOCKAGE_DISTANT}
    />
  );
}
