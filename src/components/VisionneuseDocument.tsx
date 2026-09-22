"use client";

import { useEffect, useState } from "react";
import { assainirHtml } from "@/lib/assainir";
import {
  estDocx,
  estPdf,
  formaterHorodatage,
  formaterTaille,
  urlDocument,
  type DocumentLivrable,
} from "@/lib/collab";
import { Avatar } from "./Avatar";
import { IconeAlerte, IconeCroix, IconeTelecharger } from "./icons";

type Props = {
  code: string;
  document: DocumentLivrable | null;
  onFermer: () => void;
};

type Rendu =
  | { phase: "chargement" }
  | { phase: "pret"; html: string }
  | { phase: "erreur" };

/** Lecture d'un livrable déposé, sans quitter le site. */
export function VisionneuseDocument({ code, document: doc, onFermer }: Props) {
  // Le parent remonte ce composant à chaque document (prop `key`), donc cet
  // état repart toujours de zéro.
  const [rendu, setRendu] = useState<Rendu>({ phase: "chargement" });

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [onFermer]);

  // Les fichiers Word sont convertis en HTML dans le navigateur.
  useEffect(() => {
    if (!doc || !estDocx(doc)) return;
    let abandonne = false;

    void (async () => {
      try {
        const reponse = await fetch(urlDocument(code, doc.id), {
          cache: "no-store",
        });
        if (!reponse.ok) throw new Error("lecture impossible");
        const arrayBuffer = await reponse.arrayBuffer();
        const { default: mammoth } = await import("mammoth");
        const converti = await mammoth.convertToHtml({ arrayBuffer });
        if (!abandonne) {
          setRendu({ phase: "pret", html: assainirHtml(converti.value) });
        }
      } catch {
        if (!abandonne) setRendu({ phase: "erreur" });
      }
    })();

    return () => {
      abandonne = true;
    };
  }, [code, doc]);

  if (!doc) return null;

  const url = urlDocument(code, doc.id);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-navy-900/70 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Lecture de ${doc.nom}`}
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-navy-900">
              {doc.nom}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <Avatar nom={doc.auteur} taille="size-4" />
              {doc.auteur} · {formaterHorodatage(doc.deposeLe)} ·{" "}
              {formaterTaille(doc.taille)}
            </p>
          </div>
          <a
            href={urlDocument(code, doc.id, true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-navy-900 transition-colors hover:bg-line-soft"
          >
            <IconeTelecharger className="size-3.5" />
            Télécharger
          </a>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer la lecture"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-line text-navy-900 transition-colors hover:bg-line-soft"
          >
            <IconeCroix className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sand-50">
          {estPdf(doc) ? (
            <iframe
              src={url}
              title={doc.nom}
              className="h-full w-full border-0 bg-white"
            />
          ) : estDocx(doc) ? (
            rendu.phase === "chargement" ? (
              <Message texte="Conversion du document Word…" />
            ) : rendu.phase === "erreur" ? (
              <Indisponible
                code={code}
                doc={doc}
                texte="La conversion de ce document Word a échoué. Téléchargez-le pour l'ouvrir dans Word."
              />
            ) : (
              <article
                className="docx-rendu mx-auto my-6 max-w-3xl rounded-2xl bg-white p-6 shadow-[0_10px_30px_-24px_rgba(10,31,68,0.6)] sm:p-10"
                // Le HTML provient de la conversion du .docx, filtré par assainirHtml.
                dangerouslySetInnerHTML={{ __html: rendu.html }}
              />
            )
          ) : (
            <Indisponible
              code={code}
              doc={doc}
              texte="Les fichiers Word au format .doc ne peuvent pas être lus dans le site. Enregistrez-les en .docx, ou téléchargez le fichier."
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Message({ texte }: { texte: string }) {
  return (
    <p className="grid h-full place-items-center px-6 text-center text-sm text-muted">
      {texte}
    </p>
  );
}

function Indisponible({
  code,
  doc,
  texte,
}: {
  code: string;
  doc: DocumentLivrable;
  texte: string;
}) {
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="max-w-sm text-center">
        <IconeAlerte className="mx-auto size-8 text-muted" />
        <p className="mt-3 text-sm leading-relaxed text-navy-900/80">{texte}</p>
        <a
          href={urlDocument(code, doc.id, true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          <IconeTelecharger className="size-4" />
          Télécharger le fichier
        </a>
      </div>
    </div>
  );
}
