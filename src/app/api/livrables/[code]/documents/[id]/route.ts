import type { NextRequest } from "next/server";
import { erreur, refuserCodeInvalide } from "@/server/api";
import {
  lireContenuDocument,
  supprimerDocument,
  trouverDocument,
} from "@/server/stockage";

/** Sert le document déposé, pour lecture dans le site ou téléchargement. */
export async function GET(
  requete: NextRequest,
  contexte: RouteContext<"/api/livrables/[code]/documents/[id]">,
) {
  const { code, id } = await contexte.params;
  const refus = refuserCodeInvalide(code);
  if (refus) return refus;

  // Le localisateur du fichier vient de l'index, jamais de l'URL.
  const doc = await trouverDocument(code, id);
  if (!doc) return erreur("Document introuvable.", 404);

  let donnees: Buffer;
  try {
    donnees = await lireContenuDocument(doc);
  } catch {
    return erreur("Fichier absent du stockage.", 410);
  }

  const telechargement = requete.nextUrl.searchParams.has("telecharger");
  const nom = encodeURIComponent(doc.nom);

  return new Response(new Uint8Array(donnees), {
    headers: {
      "Content-Type": doc.typeMime,
      "Content-Length": String(donnees.byteLength),
      "Content-Disposition": `${
        telechargement ? "attachment" : "inline"
      }; filename*=UTF-8''${nom}`,
      // Empêche le navigateur de réinterpréter un fichier déposé comme du HTML.
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

/** Retire un document du dossier partagé. */
export async function DELETE(
  _requete: NextRequest,
  contexte: RouteContext<"/api/livrables/[code]/documents/[id]">,
) {
  const { code, id } = await contexte.params;
  const refus = refuserCodeInvalide(code);
  if (refus) return refus;

  const etat = await supprimerDocument(code, id);
  if (!etat) return erreur("Document introuvable.", 404);
  return Response.json(etat);
}
