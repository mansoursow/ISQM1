import "server-only";

import type { EtatPartage } from "@/lib/collab";

/**
 * Contrat commun aux backends de stockage.
 *
 * Un « localisateur » identifie un fichier déposé de façon opaque : nom de
 * fichier sur disque, URL de blob… Il est enregistré dans le champ `fichier`
 * du document et n'est jamais reconstruit depuis l'URL d'une requête.
 */
export type Backend = {
  nom: "disque" | "blob";
  /** État brut, ou `null` si rien n'a encore été écrit. */
  lire: () => Promise<unknown>;
  ecrire: (etat: EtatPartage) => Promise<void>;
  deposer: (
    code: string,
    nomFichier: string,
    donnees: Buffer,
    typeMime: string,
  ) => Promise<string>;
  ouvrir: (localisateur: string) => Promise<Buffer>;
  retirer: (localisateur: string) => Promise<void>;
};
