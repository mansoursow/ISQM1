import "server-only";

import { del, get, head, put } from "@vercel/blob";
import type { EtatPartage } from "@/lib/collab";
import type { Backend } from "./backend";

/**
 * Stockage sur Vercel Blob, pour un hébergement sans disque persistant.
 *
 * Les blobs sont créés en accès `private` : les livrables déposés ne sont pas
 * atteignables par une URL publique, ils ne transitent que par les route
 * handlers de l'application.
 */

export const PREFIXE_DOCUMENTS = "isqm1/livrables";
const CHEMIN_ETAT = "isqm1/etat.json";

/** `pathname` du blob d'un document, dérivé de son localisateur. */
function pathname(localisateur: string): string {
  return localisateur;
}

async function versBuffer(flux: ReadableStream<Uint8Array>): Promise<Buffer> {
  const morceaux: Uint8Array[] = [];
  const lecteur = flux.getReader();
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    if (value) morceaux.push(value);
  }
  return Buffer.concat(morceaux);
}

export const backendBlob: Backend = {
  nom: "blob",

  async lire() {
    try {
      // `useCache: false` : on veut l'état écrit par l'autre instance, pas
      // une version mise en cache par le CDN.
      const resultat = await get(CHEMIN_ETAT, {
        access: "private",
        useCache: false,
      });
      if (!resultat || resultat.statusCode !== 200) return null;
      return JSON.parse((await versBuffer(resultat.stream)).toString("utf8"));
    } catch {
      return null;
    }
  },

  async ecrire(etat: EtatPartage) {
    await put(CHEMIN_ETAT, JSON.stringify(etat, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  },

  async deposer(code, nomFichier, donnees, typeMime) {
    const chemin = `${PREFIXE_DOCUMENTS}/${code}/${nomFichier}`;
    await put(chemin, donnees, {
      access: "private",
      contentType: typeMime,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return chemin;
  },

  async ouvrir(localisateur) {
    const resultat = await get(pathname(localisateur), {
      access: "private",
      useCache: false,
    });
    if (!resultat || resultat.statusCode !== 200) {
      throw new Error("Blob introuvable.");
    }
    return versBuffer(resultat.stream);
  },

  async retirer(localisateur) {
    await del(pathname(localisateur));
  },
};

/**
 * Vérifie qu'un blob téléversé depuis le navigateur existe bien, et renvoie sa
 * taille et son type réels : les métadonnées envoyées par le client ne sont
 * jamais prises pour argent comptant.
 */
export async function verifierBlob(
  localisateur: string,
): Promise<{ taille: number; typeMime: string } | null> {
  try {
    const info = await head(pathname(localisateur));
    return { taille: info.size, typeMime: info.contentType };
  } catch {
    return null;
  }
}
