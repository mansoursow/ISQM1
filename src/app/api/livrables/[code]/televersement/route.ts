import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";
import { erreur, refuserCodeInvalide } from "@/server/api";
import {
  STOCKAGE_DISTANT,
  TAILLE_MAX_OCTETS,
  TYPES_ACCEPTES,
} from "@/server/stockage";

/**
 * Délivre au navigateur un jeton de téléversement direct vers Vercel Blob.
 *
 * Passer par le serveur plafonnerait le dépôt à quelques mégaoctets (limite de
 * taille du corps des requêtes serverless) ; le navigateur envoie donc le
 * fichier directement au stockage, avec un jeton à portée restreinte.
 */
export async function POST(
  requete: NextRequest,
  contexte: RouteContext<"/api/livrables/[code]/televersement">,
) {
  if (!STOCKAGE_DISTANT) {
    return erreur("Téléversement direct indisponible sur ce serveur.", 404);
  }

  const { code } = await contexte.params;
  const refus = refuserCodeInvalide(code);
  if (refus) return refus;

  const corps = (await requete.json().catch(() => null)) as HandleUploadBody | null;
  if (!corps) return erreur("Requête illisible.", 400);

  try {
    return Response.json(
      await handleUpload({
        body: corps,
        request: requete,
        onBeforeGenerateToken: async (chemin) => {
          // Le jeton ne vaut que pour ce livrable et ces formats.
          if (!chemin.startsWith(`isqm1/livrables/${code}/`)) {
            throw new Error("Chemin de dépôt refusé.");
          }
          return {
            allowedContentTypes: Object.keys(TYPES_ACCEPTES),
            maximumSizeInBytes: TAILLE_MAX_OCTETS,
            addRandomSuffix: false,
          };
        },
        // L'enregistrement dans l'état se fait par POST /documents, une fois le
        // téléversement terminé : ce rappel ne parvient pas au serveur local.
        onUploadCompleted: async () => undefined,
      }),
    );
  } catch (e) {
    return erreur(
      e instanceof Error ? e.message : "Téléversement refusé.",
      400,
    );
  }
}
