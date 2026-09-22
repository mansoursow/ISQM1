/** Types et formatages partagés entre le serveur et le navigateur. */

export type DocumentLivrable = {
  id: string;
  nom: string;
  typeMime: string;
  taille: number;
  auteur: string;
  deposeLe: string;
  /** Nom du fichier sur le disque du serveur ; inutile côté navigateur. */
  fichier: string;
};

export type Observation = {
  id: string;
  auteur: string;
  texte: string;
  ecritLe: string;
};

export type EtatPartage = {
  termines: string[];
  documents: Record<string, DocumentLivrable[]>;
  observations: Record<string, Observation[]>;
};

export const ETAT_VIDE: EtatPartage = {
  termines: [],
  documents: {},
  observations: {},
};

export const TYPE_PDF = "application/pdf";
export const TYPE_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const TYPE_DOC = "application/msword";

/** Extension du fichier selon son type, et inversement. */
export const EXTENSION_PAR_TYPE: Record<string, string> = {
  [TYPE_PDF]: ".pdf",
  [TYPE_DOCX]: ".docx",
  [TYPE_DOC]: ".doc",
};

const TYPE_PAR_EXTENSION: Record<string, string> = {
  ".pdf": TYPE_PDF,
  ".docx": TYPE_DOCX,
  ".doc": TYPE_DOC,
};

/**
 * Type d'un fichier choisi dans le navigateur. Le type annoncé par le système
 * n'est pas toujours renseigné : on retombe alors sur l'extension.
 */
export function typeDeFichier(fichier: File): string | null {
  if (fichier.type in EXTENSION_PAR_TYPE) return fichier.type;
  const point = fichier.name.lastIndexOf(".");
  if (point < 0) return null;
  return TYPE_PAR_EXTENSION[fichier.name.slice(point).toLowerCase()] ?? null;
}

export function estPdf(doc: DocumentLivrable): boolean {
  return doc.typeMime === TYPE_PDF;
}

export function estDocx(doc: DocumentLivrable): boolean {
  return doc.typeMime === TYPE_DOCX;
}

/** `true` si le document peut être lu directement dans le site. */
export function lisibleEnLigne(doc: DocumentLivrable): boolean {
  return estPdf(doc) || estDocx(doc);
}

export function urlDocument(
  code: string,
  id: string,
  telecharger = false,
): string {
  return `/api/livrables/${code}/documents/${id}${telecharger ? "?telecharger=1" : ""}`;
}

export function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
}

const FORMAT_HORODATAGE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formaterHorodatage(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : FORMAT_HORODATAGE.format(d);
}
