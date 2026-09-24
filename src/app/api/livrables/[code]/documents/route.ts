import type { NextRequest } from "next/server";
import { erreur, nettoyerAuteur, refuserCodeInvalide } from "@/server/api";
import { notifierDepot } from "@/server/courriel";
import {
  STOCKAGE_DISTANT,
  TAILLE_MAX_OCTETS,
  TYPES_ACCEPTES,
  enregistrerDocument,
  enregistrerDocumentTeleverse,
} from "@/server/stockage";

/** Extensions tolérées quand le navigateur n'envoie pas de type MIME fiable. */
const EXTENSIONS: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
};

function typeRetenu(nom: string, typeAnnonce: string): string | null {
  if (typeAnnonce in TYPES_ACCEPTES) return typeAnnonce;
  const point = nom.lastIndexOf(".");
  if (point < 0) return null;
  return EXTENSIONS[nom.slice(point).toLowerCase()] ?? null;
}

function nomPropre(brut: string): string {
  return brut.replace(/[\r\n"]/g, "").slice(0, 160) || "document";
}

/**
 * Enregistre un livrable déposé.
 *
 * Deux chemins selon le stockage :
 *   - disque  : le fichier arrive en `multipart/form-data` ;
 *   - Blob    : le navigateur a déjà téléversé le fichier, la requête ne porte
 *               que les métadonnées, revérifiées côté serveur.
 */
export async function POST(
  requete: NextRequest,
  contexte: RouteContext<"/api/livrables/[code]/documents">,
) {
  const { code } = await contexte.params;
  const refus = refuserCodeInvalide(code);
  if (refus) return refus;

  return requete.headers.get("content-type")?.includes("application/json")
    ? enregistrerTeleversement(code, requete)
    : recevoirFichier(code, requete);
}

async function enregistrerTeleversement(code: string, requete: NextRequest) {
  if (!STOCKAGE_DISTANT) {
    return erreur("Ce serveur attend le fichier lui-même.", 400);
  }

  const corps = (await requete.json().catch(() => null)) as {
    nom?: unknown;
    auteur?: unknown;
    chemin?: unknown;
  } | null;

  const auteur = nettoyerAuteur(corps?.auteur);
  if (!auteur) return erreur("Indiquez qui dépose le document.", 400);
  if (typeof corps?.chemin !== "string" || typeof corps.nom !== "string") {
    return erreur("Métadonnées de dépôt incomplètes.", 400);
  }

  const depot = await enregistrerDocumentTeleverse(code, {
    nom: nomPropre(corps.nom),
    auteur,
    localisateur: corps.chemin,
  });
  if (!depot) return erreur("Le fichier téléversé a été refusé.", 400);

  await notifierDepot(code, depot.document);
  return Response.json(depot.etat, { status: 201 });
}

async function recevoirFichier(code: string, requete: NextRequest) {
  const formulaire = await requete.formData().catch(() => null);
  if (!formulaire) return erreur("Requête illisible.", 400);

  const fichier = formulaire.get("fichier");
  const auteur = nettoyerAuteur(formulaire.get("auteur"));

  if (!(fichier instanceof File) || fichier.size === 0) {
    return erreur("Aucun fichier reçu.", 400);
  }
  if (!auteur) return erreur("Indiquez qui dépose le document.", 400);
  if (fichier.size > TAILLE_MAX_OCTETS) {
    return erreur(
      `Fichier trop volumineux (maximum ${Math.round(TAILLE_MAX_OCTETS / 1024 / 1024)} Mo).`,
      413,
    );
  }

  const typeMime = typeRetenu(fichier.name, fichier.type);
  if (!typeMime) {
    return erreur("Format refusé : déposez un PDF ou un document Word.", 415);
  }

  const depot = await enregistrerDocument(
    code,
    Buffer.from(await fichier.arrayBuffer()),
    { nom: nomPropre(fichier.name), typeMime, auteur },
  );

  // L'envoi est attendu pour ne pas être interrompu par la fin de la fonction,
  // mais il n'échoue jamais : le dépôt reste enregistré quoi qu'il arrive.
  await notifierDepot(code, depot.document);
  return Response.json(depot.etat, { status: 201 });
}
