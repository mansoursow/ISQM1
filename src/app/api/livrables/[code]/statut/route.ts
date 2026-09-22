import type { NextRequest } from "next/server";
import { erreur, refuserCodeInvalide } from "@/server/api";
import { modifierEtat } from "@/server/stockage";

/** Valide ou rouvre un livrable. Corps attendu : `{ termine: boolean }`. */
export async function POST(
  requete: NextRequest,
  contexte: RouteContext<"/api/livrables/[code]/statut">,
) {
  const { code } = await contexte.params;
  const refus = refuserCodeInvalide(code);
  if (refus) return refus;

  const corps: unknown = await requete.json().catch(() => null);
  const termine = (corps as { termine?: unknown } | null)?.termine;
  if (typeof termine !== "boolean") {
    return erreur("Champ « termine » manquant ou invalide.", 400);
  }

  return Response.json(
    await modifierEtat((etat) => ({
      ...etat,
      termines: termine
        ? etat.termines.includes(code)
          ? etat.termines
          : [...etat.termines, code]
        : etat.termines.filter((c) => c !== code),
    })),
  );
}
