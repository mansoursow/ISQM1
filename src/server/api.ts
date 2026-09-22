import "server-only";

import { codeValide } from "./stockage";

export function erreur(message: string, statut: number): Response {
  return Response.json({ erreur: message }, { status: statut });
}

/**
 * Valide le code livrable d'une URL. Renvoie une réponse d'erreur à retourner
 * telle quelle, ou `null` si le code est bon.
 */
export function refuserCodeInvalide(code: string): Response | null {
  return codeValide(code) ? null : erreur("Livrable inconnu.", 404);
}

/** Nettoie un nom d'auteur saisi côté client (ce n'est pas une authentification). */
export function nettoyerAuteur(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const nom = valeur.replace(/\s+/g, " ").trim().slice(0, 60);
  return nom.length > 0 ? nom : null;
}
