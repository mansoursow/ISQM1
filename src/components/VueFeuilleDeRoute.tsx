"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocumentLivrable, EtatPartage } from "@/lib/collab";
import type { Livrable } from "@/lib/isqm";
import { useCollab } from "@/lib/useCollab";
import { useEstClient } from "@/lib/useEstClient";
import { useIdentite } from "@/lib/useIdentite";
import { Arborescence } from "./Arborescence";
import { BarreMarque, Entete } from "./Entete";
import { PanneauLivrable } from "./PanneauLivrable";
import { VisionneuseDocument } from "./VisionneuseDocument";

/** `initial` vient du serveur : la page s'affiche déjà peuplée, sans attente. */
export function VueFeuilleDeRoute({
  initial,
  stockageDistant,
}: {
  initial: EtatPartage;
  stockageDistant: boolean;
}) {
  const collab = useCollab(initial, stockageDistant);
  const [dernierAuteur, memoriserAuteur] = useIdentite();
  const estClient = useEstClient();

  const [ouvert, setOuvert] = useState<Livrable | null>(null);
  const [lecture, setLecture] = useState<DocumentLivrable | null>(null);
  const aInteragi = useRef(false);

  // La date du navigateur ne doit pas participer au rendu serveur, sous peine
  // d'écart d'hydratation : elle n'est lue qu'une fois l'hydratation terminée.
  const aujourdhui = useMemo(
    () => (estClient ? new Date() : null),
    [estClient],
  );

  const { actif, etat, definirStatut } = collab;

  // Un fichier lâché à côté de la zone de dépôt ferait quitter la page pour
  // l'afficher : le navigateur ne doit rien faire de ces dépôts manqués.
  useEffect(() => {
    const ignorer = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", ignorer);
    window.addEventListener("drop", ignorer);
    return () => {
      window.removeEventListener("dragover", ignorer);
      window.removeEventListener("drop", ignorer);
    };
  }, []);

  // Après une validation, on amène l'utilisateur sur l'étape qui vient de s'ouvrir.
  useEffect(() => {
    if (!aInteragi.current || !actif) return;
    document
      .getElementById(`livrable-${actif.code}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [actif]);

  const surStatut = useCallback(
    (code: string, termine: boolean) => {
      aInteragi.current = termine;
      return definirStatut(code, termine);
    },
    [definirStatut],
  );

  const surReinitialiser = useCallback(() => {
    aInteragi.current = false;
    setOuvert(null);
    void collab.reinitialiser();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [collab]);

  // Le nom choisi pour signer l'action devient le nom proposé la fois suivante.
  const deposer = useCallback(
    async (code: string, fichier: File, auteur: string) => {
      await collab.deposerDocument(code, fichier, auteur);
      memoriserAuteur(auteur);
    },
    [collab, memoriserAuteur],
  );

  const observer = useCallback(
    async (code: string, texte: string, auteur: string) => {
      await collab.ajouterObservation(code, auteur, texte);
      memoriserAuteur(auteur);
    },
    [collab, memoriserAuteur],
  );

  // Le panneau reste synchronisé avec l'état du serveur pendant qu'il est ouvert.
  const documentsOuverts = ouvert
    ? (collab.etatPartage.documents[ouvert.code] ?? [])
    : [];
  const observationsOuvertes = ouvert
    ? (collab.etatPartage.observations[ouvert.code] ?? [])
    : [];

  return (
    <>
      <BarreMarque />
      <main>
        <Entete
          nbTermines={collab.termines.size}
          aujourdhui={aujourdhui}
          erreur={collab.erreur}
          onReinitialiser={surReinitialiser}
        />
        <Arborescence
          etat={etat}
          termines={collab.termines}
          documents={collab.etatPartage.documents}
          observations={collab.etatPartage.observations}
          aujourdhui={aujourdhui}
          onOuvrir={setOuvert}
        />
      </main>

      <PanneauLivrable
        // Remonter le panneau à chaque livrable réinitialise l'onglet actif.
        key={ouvert?.code ?? "aucun"}
        livrable={ouvert}
        etat={ouvert ? etat(ouvert) : null}
        documents={documentsOuverts}
        observations={observationsOuvertes}
        dernierAuteur={dernierAuteur}
        aujourdhui={aujourdhui}
        onFermer={() => setOuvert(null)}
        onDefinirStatut={surStatut}
        onDeposer={deposer}
        onRetirer={collab.retirerDocument}
        onObserver={observer}
        onLire={setLecture}
      />

      {ouvert ? (
        <VisionneuseDocument
          // Remonter le composant à chaque document évite de réinitialiser
          // son état de conversion à la main.
          key={lecture?.id ?? "aucun"}
          code={ouvert.code}
          document={lecture}
          onFermer={() => setLecture(null)}
        />
      ) : null}
    </>
  );
}
