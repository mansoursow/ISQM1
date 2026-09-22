"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ETAT_VIDE,
  EXTENSION_PAR_TYPE,
  typeDeFichier,
  type EtatPartage,
} from "./collab";
import { LIVRABLES_PAR_ETAPE, type EtatLivrable, type Livrable } from "./isqm";

/** Intervalle de rafraîchissement : de quoi voir arriver les observations des autres. */
const PERIODE_SYNCHRO_MS = 10_000;

async function appeler(url: string, init?: RequestInit): Promise<EtatPartage> {
  const reponse = await fetch(url, { cache: "no-store", ...init });
  if (!reponse.ok) {
    const details = (await reponse.json().catch(() => null)) as {
      erreur?: string;
    } | null;
    throw new Error(details?.erreur ?? "Le serveur a refusé l'opération.");
  }
  return (await reponse.json()) as EtatPartage;
}

export type Collab = {
  etatPartage: EtatPartage;
  /** Message d'erreur de la dernière opération, à afficher tel quel. */
  erreur: string | null;
  effacerErreur: () => void;
  termines: Set<string>;
  /** Premier livrable non terminé de la démarche (celui qui clignote). */
  actif: Livrable | undefined;
  etat: (l: Livrable) => EtatLivrable;
  rafraichir: () => Promise<void>;
  definirStatut: (code: string, termine: boolean) => Promise<void>;
  deposerDocument: (
    code: string,
    fichier: File,
    auteur: string,
  ) => Promise<void>;
  retirerDocument: (code: string, id: string) => Promise<void>;
  ajouterObservation: (
    code: string,
    auteur: string,
    texte: string,
  ) => Promise<void>;
  reinitialiser: () => Promise<void>;
};

/**
 * @param initial  état rendu par le serveur
 * @param stockageDistant  `true` quand les fichiers vont vers Vercel Blob :
 *   le navigateur téléverse alors directement, sans passer par le serveur, qui
 *   plafonnerait le dépôt à quelques mégaoctets.
 */
export function useCollab(
  initial: EtatPartage = ETAT_VIDE,
  stockageDistant = false,
): Collab {
  const [etatPartage, setEtatPartage] = useState<EtatPartage>(initial);
  const [erreur, setErreur] = useState<string | null>(null);

  const rafraichir = useCallback(async () => {
    try {
      setEtatPartage(await appeler("/api/etat"));
      setErreur(null);
    } catch {
      setErreur("Serveur injoignable : l'affichage peut être périmé.");
    }
  }, []);

  // L'état initial vient du rendu serveur ; on ne fait ici que rester à jour
  // avec ce que les autres postes modifient.
  useEffect(() => {
    const minuterie = setInterval(() => void rafraichir(), PERIODE_SYNCHRO_MS);
    const surRetour = () => void rafraichir();
    window.addEventListener("focus", surRetour);
    return () => {
      clearInterval(minuterie);
      window.removeEventListener("focus", surRetour);
    };
  }, [rafraichir]);

  /** Exécute une mutation et adopte l'état complet renvoyé par le serveur. */
  const muter = useCallback(async (url: string, init: RequestInit) => {
    try {
      setEtatPartage(await appeler(url, init));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Opération impossible.");
      throw e;
    }
  }, []);

  const definirStatut = useCallback(
    (code: string, termine: boolean) =>
      muter(`/api/livrables/${code}/statut`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termine }),
      }),
    [muter],
  );

  const deposerDocument = useCallback(
    async (code: string, fichier: File, auteur: string) => {
      if (!stockageDistant) {
        const corps = new FormData();
        corps.append("fichier", fichier);
        corps.append("auteur", auteur);
        await muter(`/api/livrables/${code}/documents`, {
          method: "POST",
          body: corps,
        });
        return;
      }

      const typeMime = typeDeFichier(fichier);
      if (!typeMime) {
        const refus = new Error(
          "Format refusé : déposez un PDF ou un document Word.",
        );
        setErreur(refus.message);
        throw refus;
      }

      try {
        const { upload } = await import("@vercel/blob/client");
        const blob = await upload(
          `isqm1/livrables/${code}/${crypto.randomUUID()}${EXTENSION_PAR_TYPE[typeMime]}`,
          fichier,
          {
            access: "private",
            contentType: typeMime,
            handleUploadUrl: `/api/livrables/${code}/televersement`,
            multipart: fichier.size > 8 * 1024 * 1024,
          },
        );
        // Le fichier est en place : on l'enregistre dans la feuille de route.
        await muter(`/api/livrables/${code}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: fichier.name,
            auteur,
            chemin: blob.pathname,
          }),
        });
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Le dépôt du fichier a échoué.";
        setErreur(message);
        throw e;
      }
    },
    [muter, stockageDistant],
  );

  const retirerDocument = useCallback(
    (code: string, id: string) =>
      muter(`/api/livrables/${code}/documents/${id}`, { method: "DELETE" }),
    [muter],
  );

  const ajouterObservation = useCallback(
    (code: string, auteur: string, texte: string) =>
      muter(`/api/livrables/${code}/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auteur, texte }),
      }),
    [muter],
  );

  const reinitialiser = useCallback(
    () => muter("/api/etat", { method: "DELETE" }),
    [muter],
  );

  const termines = useMemo(
    () => new Set(etatPartage.termines),
    [etatPartage.termines],
  );

  // Le déverrouillage est strictement séquentiel : tant que l'étape N n'est pas
  // terminée, les étapes N+1 et suivantes restent grisées.
  const actif = LIVRABLES_PAR_ETAPE.find((l) => !termines.has(l.code));

  const etat = useCallback(
    (l: Livrable): EtatLivrable => {
      if (termines.has(l.code)) return "termine";
      return actif && l.code === actif.code ? "actif" : "verrouille";
    },
    [actif, termines],
  );

  return {
    etatPartage,
    erreur,
    effacerErreur: useCallback(() => setErreur(null), []),
    termines,
    actif,
    etat,
    rafraichir,
    definirStatut,
    deposerDocument,
    retirerDocument,
    ajouterObservation,
    reinitialiser,
  };
}
