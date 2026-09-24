"use client";

import type { DocumentLivrable, Observation } from "@/lib/collab";
import {
  COMPOSANTES,
  ORDRE_COMPOSANTES,
  TOTAL_LIVRABLES,
  echeance,
  formaterDateCourt,
  joursRestants,
  livrablesDeComposante,
  type EtatLivrable,
  type Livrable,
} from "@/lib/isqm";
import {
  IconeBulle,
  IconeCadenas,
  IconeCheck,
  IconeDocument,
  IconeFleche,
} from "./icons";

type Props = {
  etat: (l: Livrable) => EtatLivrable;
  termines: Set<string>;
  documents: Record<string, DocumentLivrable[]>;
  observations: Record<string, Observation[]>;
  aujourdhui: Date | null;
  onOuvrir: (l: Livrable) => void;
};

export function Arborescence({
  etat,
  termines,
  documents,
  observations,
  aujourdhui,
  onOuvrir,
}: Props) {
  const tousTermines = termines.size === TOTAL_LIVRABLES;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <RacineSGQ nbTermines={termines.size} acheve={tousTermines} />
      <div className="isqm-trunk" />

      <div className="isqm-branch">
        {ORDRE_COMPOSANTES.map((id) => {
          const composante = COMPOSANTES.find((c) => c.id === id)!;
          const livrables = livrablesDeComposante(id);
          const etats = livrables.map(etat);
          const etatComposante: EtatLivrable = etats.every(
            (e) => e === "termine",
          )
            ? "termine"
            : etats.some((e) => e !== "verrouille")
              ? "actif"
              : "verrouille";

          return (
            <div
              key={id}
              className="isqm-node pb-8 last:pb-0"
              style={{ "--elbow": "2.1rem" } as React.CSSProperties}
            >
              <EnteteComposante
                numero={composante.id}
                titre={composante.titre}
                objet={composante.objet}
                nbTermines={etats.filter((e) => e === "termine").length}
                nbTotal={livrables.length}
                etat={etatComposante}
              />

              <div className="isqm-branch mt-5">
                {livrables.map((l) => (
                  <div
                    key={l.code}
                    id={`livrable-${l.code}`}
                    className="isqm-node scroll-mt-28 pb-4 last:pb-0"
                    style={{ "--elbow": "2rem" } as React.CSSProperties}
                  >
                    <CarteLivrable
                      livrable={l}
                      etat={etat(l)}
                      nbDocuments={documents[l.code]?.length ?? 0}
                      nbObservations={observations[l.code]?.length ?? 0}
                      aujourdhui={aujourdhui}
                      onOuvrir={onOuvrir}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RacineSGQ({
  nbTermines,
  acheve,
}: {
  nbTermines: number;
  acheve: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-navy-700 px-7 py-6 text-white shadow-[0_18px_40px_-24px_rgba(10,47,115,0.9)]">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-orange-200 uppercase">
          Norme ISQM 1 · IAASB
        </p>
        <h2 className="mt-1.5 text-xl font-bold sm:text-2xl">
          Système de gestion de la qualité
        </h2>
        <p className="mt-1.5 text-[13px] text-white/70">
          8 composantes · {TOTAL_LIVRABLES} livrables · 6 phases de mise en
          œuvre
        </p>
      </div>
      <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold">
        {acheve ? (
          <>
            <IconeCheck className="size-3.5 text-orange-200" />
            Démarche complète
          </>
        ) : (
          <>
            <span className="isqm-dot size-1.5 rounded-full bg-orange-500" />
            {nbTermines} livrable{nbTermines > 1 ? "s" : ""} validé
            {nbTermines > 1 ? "s" : ""}
          </>
        )}
      </p>
    </div>
  );
}

function EnteteComposante({
  numero,
  titre,
  objet,
  nbTermines,
  nbTotal,
  etat,
}: {
  numero: number;
  titre: string;
  objet: string;
  nbTermines: number;
  nbTotal: number;
  etat: EtatLivrable;
}) {
  const verrouille = etat === "verrouille";

  return (
    <div
      className={`rounded-3xl px-6 py-5 transition-colors ${
        verrouille
          ? "border border-line bg-line-soft text-muted"
          : "bg-navy-700 text-white shadow-[0_14px_32px_-26px_rgba(10,47,115,0.95)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
            verrouille
              ? "bg-white text-muted"
              : "bg-orange-500 text-white"
          }`}
        >
          Composante {numero}
        </span>
        <span
          className={`text-xs font-semibold ${
            verrouille ? "text-muted" : "text-white/60"
          }`}
        >
          {nbTermines}/{nbTotal} livrable{nbTotal > 1 ? "s" : ""}
        </span>
        {etat === "termine" ? (
          <IconeCheck className="size-4 text-orange-200" />
        ) : verrouille ? (
          <IconeCadenas className="size-3.5" />
        ) : null}
      </div>
      <h3 className="mt-2.5 text-base font-bold sm:text-lg">{titre}</h3>
      <p
        className={`mt-1.5 text-[13px] leading-relaxed ${
          verrouille ? "text-muted" : "text-white/70"
        }`}
      >
        {objet}
      </p>
    </div>
  );
}

function CarteLivrable({
  livrable,
  etat,
  nbDocuments,
  nbObservations,
  aujourdhui,
  onOuvrir,
}: {
  livrable: Livrable;
  etat: EtatLivrable;
  nbDocuments: number;
  nbObservations: number;
  aujourdhui: Date | null;
  onOuvrir: (l: Livrable) => void;
}) {
  const date = echeance(livrable);
  const restants = aujourdhui ? joursRestants(date, aujourdhui) : null;
  const enRetard = etat !== "termine" && restants !== null && restants < 0;
  const verrouille = etat === "verrouille";
  const actif = etat === "actif";

  return (
    <button
      type="button"
      onClick={() => onOuvrir(livrable)}
      disabled={verrouille}
      aria-label={`${livrable.code} — ${livrable.titre}${
        verrouille ? " (verrouillé)" : ""
      }`}
      className={`w-full rounded-3xl border px-5 py-4.5 text-left transition-all ${
        verrouille
          ? "cursor-not-allowed border-line bg-white/60 opacity-60"
          : "cursor-pointer bg-white hover:-translate-y-0.5"
      } ${
        actif
          ? "isqm-pulse border-orange-500 ring-2 ring-orange-500/20"
          : etat === "termine"
            ? "border-navy-100 bg-navy-100/60"
            : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
            verrouille
              ? "bg-line-soft text-muted"
              : etat === "termine"
                ? "bg-navy-700 text-white"
                : "bg-orange-50 text-orange-600"
          }`}
        >
          {livrable.code}
        </span>
        <span
          className={`text-xs font-semibold ${
            verrouille ? "text-muted" : "text-navy-500"
          }`}
        >
          Étape {livrable.step}/{TOTAL_LIVRABLES}
        </span>
        <span className="text-xs text-muted">·</span>
        <span className="text-xs text-muted">{livrable.frequence}</span>
        {livrable.composition ? (
          <span
            className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
              verrouille
                ? "bg-line-soft text-muted"
                : "bg-navy-100 text-navy-700"
            }`}
          >
            {livrable.composition.length} livrables réunis
          </span>
        ) : null}
        {livrable.siApplicable ? (
          <span className="rounded-lg border border-line px-2 py-0.5 text-[11px] font-medium text-muted">
            si applicable
          </span>
        ) : null}
      </div>

      <p
        className={`mt-2 text-base font-semibold ${
          verrouille ? "text-muted" : "text-navy-900"
        }`}
      >
        {livrable.titre}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2.5">
          <span
            className={`text-xs font-medium ${
              enRetard ? "text-orange-500" : "text-muted"
            }`}
          >
            Échéance {formaterDateCourt(date)}
            {enRetard ? " · en retard" : ""}
          </span>
          {nbDocuments > 0 ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500"
              title={`${nbDocuments} document${nbDocuments > 1 ? "s" : ""} déposé${nbDocuments > 1 ? "s" : ""}`}
            >
              <IconeDocument className="size-3.5" />
              {nbDocuments}
            </span>
          ) : null}
          {nbObservations > 0 ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500"
              title={`${nbObservations} observation${nbObservations > 1 ? "s" : ""}`}
            >
              <IconeBulle className="size-3.5" />
              {nbObservations}
            </span>
          ) : null}
        </span>

        {etat === "termine" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-700 px-3.5 py-2 text-xs font-semibold text-white">
            <IconeCheck className="size-3.5" />
            Terminé
          </span>
        ) : actif ? (
          <span className="isqm-blink inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-2 text-xs font-bold text-white">
            Cliquez ici
            <IconeFleche className="size-3.5" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-line-soft px-3.5 py-2 text-xs font-semibold text-muted">
            <IconeCadenas className="size-3.5" />
            Verrouillé
          </span>
        )}
      </div>
    </button>
  );
}
