import "server-only";

import { randomUUID } from "node:crypto";
import {
  ETAT_VIDE,
  TYPE_DOC,
  TYPE_DOCX,
  TYPE_PDF,
  type DocumentLivrable,
  type EtatPartage,
} from "@/lib/collab";
import { LIVRABLES } from "@/lib/isqm";
import type { Backend } from "./backend";
import { backendBlob, verifierBlob } from "./backend-blob";
import { backendDisque } from "./backend-disque";

/**
 * Stockage partagé de la feuille de route : avancement, observations et
 * documents déposés.
 *
 * Deux backends, choisis selon l'environnement :
 *   - `BLOB_READ_WRITE_TOKEN` défini  → Vercel Blob (hébergement sans disque) ;
 *   - sinon                           → disque local (`data/`).
 *
 * C'est la seule porte d'entrée vers le stockage : pour passer à une base de
 * données, il suffit d'ajouter un backend.
 */

/** `true` quand les fichiers sont téléversés depuis le navigateur vers Blob. */
export const STOCKAGE_DISTANT = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const backend: Backend = STOCKAGE_DISTANT ? backendBlob : backendDisque;

export const TAILLE_MAX_OCTETS = 25 * 1024 * 1024;

/** Types acceptés, et extension imposée sur le stockage. */
export const TYPES_ACCEPTES: Record<string, string> = {
  [TYPE_PDF]: ".pdf",
  [TYPE_DOCX]: ".docx",
  [TYPE_DOC]: ".doc",
};

export type { DocumentLivrable, EtatPartage, Observation } from "@/lib/collab";

const CODES_VALIDES = new Set(LIVRABLES.map((l) => l.code));

/** Valide un code livrable venant de l'URL (empêche toute traversée de chemin). */
export function codeValide(code: string): boolean {
  return CODES_VALIDES.has(code);
}

// ── Sérialisation ──────────────────────────────────────────────────────────

function normaliser(brut: unknown): EtatPartage {
  if (typeof brut !== "object" || brut === null) return { ...ETAT_VIDE };
  const o = brut as Partial<EtatPartage>;
  return {
    termines: Array.isArray(o.termines)
      ? o.termines.filter((c): c is string => typeof c === "string")
      : [],
    documents: typeof o.documents === "object" && o.documents ? o.documents : {},
    observations:
      typeof o.observations === "object" && o.observations ? o.observations : {},
  };
}

// ── Sérialisation des accès concurrents ────────────────────────────────────

/**
 * Les requêtes arrivent en parallèle (plusieurs personnes sur le même dossier).
 * Toutes les opérations passent par cette file pour qu'un lecteur ne voie
 * jamais un état à moitié écrit et qu'aucune écriture n'en écrase une autre.
 *
 * La file ne couvre qu'une instance du serveur : sur un hébergement qui en
 * lance plusieurs, deux écritures simultanées restent possibles, la dernière
 * l'emporte. C'est acceptable pour une équipe de quelques personnes.
 */
let file: Promise<unknown> = Promise.resolve();

function enFile<T>(tache: () => Promise<T>): Promise<T> {
  const suivant = file.then(tache, tache);
  file = suivant.catch(() => undefined);
  return suivant;
}

async function lireBrut(): Promise<EtatPartage> {
  return normaliser(await backend.lire());
}

export function lireEtat(): Promise<EtatPartage> {
  return enFile(lireBrut);
}

export function modifierEtat(
  transformer: (etat: EtatPartage) => EtatPartage | Promise<EtatPartage>,
): Promise<EtatPartage> {
  return enFile(async () => {
    const maj = await transformer(await lireBrut());
    await backend.ecrire(maj);
    return maj;
  });
}

// ── Documents ──────────────────────────────────────────────────────────────

/** Nom de fichier imposé : identifiant généré + extension du type accepté. */
export function nomDeFichier(typeMime: string): string {
  return `${randomUUID()}${TYPES_ACCEPTES[typeMime]}`;
}

/** Chemin que le navigateur doit utiliser pour téléverser vers Blob. */
export function cheminTeleversement(code: string, typeMime: string): string {
  return `isqm1/livrables/${code}/${nomDeFichier(typeMime)}`;
}

/** Résultat d'un dépôt : le nouvel état, et le document qui vient d'entrer. */
export type Depot = { etat: EtatPartage; document: DocumentLivrable };

async function ajouterDocument(
  code: string,
  document: DocumentLivrable,
): Promise<Depot> {
  const etat = await modifierEtat((e) => ({
    ...e,
    documents: {
      ...e.documents,
      [code]: [...(e.documents[code] ?? []), document],
    },
  }));
  return { etat, document };
}

/** Dépôt passant par le serveur (backend disque). */
export async function enregistrerDocument(
  code: string,
  donnees: Buffer,
  meta: { nom: string; typeMime: string; auteur: string },
): Promise<Depot> {
  const fichier = await backend.deposer(
    code,
    nomDeFichier(meta.typeMime),
    donnees,
    meta.typeMime,
  );

  return ajouterDocument(code, {
    id: randomUUID(),
    nom: meta.nom,
    typeMime: meta.typeMime,
    taille: donnees.byteLength,
    auteur: meta.auteur,
    deposeLe: new Date().toISOString(),
    fichier,
  });
}

/**
 * Enregistre un fichier déjà téléversé par le navigateur vers Blob. La taille
 * et le type sont relus depuis le blob : les valeurs annoncées par le client
 * ne sont pas fiables.
 */
export async function enregistrerDocumentTeleverse(
  code: string,
  meta: { nom: string; auteur: string; localisateur: string },
): Promise<Depot | null> {
  if (!meta.localisateur.startsWith(`isqm1/livrables/${code}/`)) return null;

  const reel = await verifierBlob(meta.localisateur);
  if (!reel || !(reel.typeMime in TYPES_ACCEPTES)) return null;
  if (reel.taille === 0 || reel.taille > TAILLE_MAX_OCTETS) return null;

  return ajouterDocument(code, {
    id: randomUUID(),
    nom: meta.nom,
    typeMime: reel.typeMime,
    taille: reel.taille,
    auteur: meta.auteur,
    deposeLe: new Date().toISOString(),
    fichier: meta.localisateur,
  });
}

export async function supprimerDocument(
  code: string,
  id: string,
): Promise<EtatPartage | null> {
  const etat = await lireEtat();
  const doc = etat.documents[code]?.find((d) => d.id === id);
  if (!doc) return null;

  try {
    await backend.retirer(doc.fichier);
  } catch {
    // Fichier déjà absent : on retire quand même l'entrée de l'index.
  }

  return modifierEtat((e) => ({
    ...e,
    documents: {
      ...e.documents,
      [code]: (e.documents[code] ?? []).filter((d) => d.id !== id),
    },
  }));
}

export async function trouverDocument(
  code: string,
  id: string,
): Promise<DocumentLivrable | undefined> {
  const etat = await lireEtat();
  return etat.documents[code]?.find((d) => d.id === id);
}

/** Octets d'un document, quel que soit le backend. */
export function lireContenuDocument(doc: DocumentLivrable): Promise<Buffer> {
  return backend.ouvrir(doc.fichier);
}
