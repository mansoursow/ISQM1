import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { erreur, nettoyerAuteur, refuserCodeInvalide } from "@/server/api";
import { modifierEtat } from "@/server/stockage";

const LONGUEUR_MAX = 4000;

/** Ajoute une observation au fil de discussion d'un livrable. */
export async function POST(
  requete: NextRequest,
  contexte: RouteContext<"/api/livrables/[code]/observations">,
) {
  const { code } = await contexte.params;
  const refus = refuserCodeInvalide(code);
  if (refus) return refus;

  const corps = (await requete.json().catch(() => null)) as {
    auteur?: unknown;
    texte?: unknown;
  } | null;

  const auteur = nettoyerAuteur(corps?.auteur);
  if (!auteur) return erreur("Indiquez qui laisse l'observation.", 400);

  const texte =
    typeof corps?.texte === "string" ? corps.texte.trim().slice(0, LONGUEUR_MAX) : "";
  if (!texte) return erreur("L'observation est vide.", 400);

  return Response.json(
    await modifierEtat((etat) => ({
      ...etat,
      observations: {
        ...etat.observations,
        [code]: [
          ...(etat.observations[code] ?? []),
          { id: randomUUID(), auteur, texte, ecritLe: new Date().toISOString() },
        ],
      },
    })),
    { status: 201 },
  );
}
