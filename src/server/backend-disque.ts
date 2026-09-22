import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EtatPartage } from "@/lib/collab";
import type { Backend } from "./backend";

/**
 * Stockage sur le disque du serveur. Convient à un poste ou un serveur du
 * réseau avec un disque persistant ; inutilisable sur un hébergeur au système
 * de fichiers éphémère (voir `backend-blob.ts`).
 */

const RACINE = path.join(process.cwd(), "data");
const FICHIER_ETAT = path.join(RACINE, "etat.json");
const DOSSIER_FICHIERS = path.join(RACINE, "fichiers");

/** Le localisateur d'un document est `<code>/<nom de fichier>`. */
function chemin(localisateur: string): string {
  const [code, fichier] = localisateur.split("/");
  return path.join(DOSSIER_FICHIERS, path.basename(code), path.basename(fichier));
}

export const backendDisque: Backend = {
  nom: "disque",

  async lire() {
    try {
      return JSON.parse(await readFile(FICHIER_ETAT, "utf8")) as unknown;
    } catch {
      // Premier démarrage, ou fichier illisible : le facade repart d'un état vide.
      return null;
    }
  },

  async ecrire(etat: EtatPartage) {
    await mkdir(RACINE, { recursive: true });
    // Écriture atomique : le fichier définitif n'est jamais partiellement écrit.
    const temporaire = `${FICHIER_ETAT}.${randomUUID()}.tmp`;
    await writeFile(temporaire, JSON.stringify(etat, null, 2), "utf8");
    await rename(temporaire, FICHIER_ETAT);
  },

  async deposer(code, nomFichier, donnees) {
    const dossier = path.join(DOSSIER_FICHIERS, code);
    await mkdir(dossier, { recursive: true });
    await writeFile(path.join(dossier, nomFichier), donnees);
    return `${code}/${nomFichier}`;
  },

  async ouvrir(localisateur) {
    return readFile(chemin(localisateur));
  },

  async retirer(localisateur) {
    await rm(chemin(localisateur), { force: true });
  },
};
