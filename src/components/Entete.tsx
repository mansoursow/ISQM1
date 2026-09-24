"use client";

import { useState } from "react";
import {
  ECHEANCE_FINALE,
  PROJET,
  TOTAL_LIVRABLES,
  formaterDate,
  joursRestants,
} from "@/lib/isqm";
import {
  IconeAlerte,
  IconeBouclier,
  IconeCadenas,
  IconeCheck,
} from "./icons";

export function BarreMarque() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <span className="grid size-9 place-items-center rounded-xl bg-navy-700 text-white">
          <IconeBouclier className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold tracking-wide text-navy-900">
            ISQM 1
          </span>
          <span className="block text-[11px] font-medium tracking-wide text-orange-500">
            Système de gestion de la qualité · Feuille de route
          </span>
        </span>
      </div>
    </header>
  );
}

type Props = {
  nbTermines: number;
  aujourdhui: Date | null;
  erreur: string | null;
  onReinitialiser: () => void;
};

export function Entete({
  nbTermines,
  aujourdhui,
  erreur,
  onReinitialiser,
}: Props) {
  const [confirmation, setConfirmation] = useState(false);
  const total = TOTAL_LIVRABLES;
  const pourcent = Math.round((nbTermines / total) * 100);
  const restants = aujourdhui ? joursRestants(ECHEANCE_FINALE, aujourdhui) : null;

  return (
    <section className="mx-auto max-w-5xl px-4 pt-10 pb-8 text-center sm:px-6 sm:pt-14">
      <h1 className="text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">
        Conformité <span className="text-orange-500">ISQM 1</span>
      </h1>
      <p className="mt-3 text-base text-navy-900/70 sm:text-lg">
        {TOTAL_LIVRABLES} livrables répartis dans les 8 composantes
      </p>

      <div className="mx-auto mt-9 max-w-3xl rounded-2xl border border-line bg-white p-5 text-left shadow-[0_10px_30px_-22px_rgba(10,31,68,0.55)] sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-navy-900">
            Avancement global
          </p>
          <p className="text-sm font-bold text-navy-700">
            {nbTermines}
            <span className="text-muted"> / {total}</span>
          </p>
        </div>

        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-line-soft"
          role="progressbar"
          aria-valuenow={pourcent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avancement des livrables ISQM 1"
        >
          <div
            className="h-full rounded-full bg-orange-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pourcent}%` }}
          />
        </div>

        <dl className="mt-5 grid gap-3 border-t border-line-soft pt-4 sm:grid-cols-3">
          <Stat libelle="Lancement" valeur={formaterDate(PROJET.debut)} />
          <Stat
            libelle="Échéance finale"
            valeur={formaterDate(ECHEANCE_FINALE)}
          />
          <Stat
            libelle="Temps restant"
            valeur={
              restants === null
                ? "—"
                : restants > 0
                  ? `${restants} jour${restants > 1 ? "s" : ""}`
                  : restants === 0
                    ? "Dernier jour"
                    : `${Math.abs(restants)} jour${Math.abs(restants) > 1 ? "s" : ""} de retard`
            }
            accent={restants !== null && restants <= 0}
          />
        </dl>
      </div>

      {erreur ? (
        <p className="mx-auto mt-4 flex max-w-3xl items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-left text-xs leading-relaxed text-orange-600">
          <IconeAlerte className="mt-px size-4 shrink-0" />
          {erreur}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="isqm-dot size-2 rounded-full bg-orange-500" />
          Étape ouverte — elle clignote
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconeCheck className="size-3.5 text-navy-700" />
          Livrable terminé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <IconeCadenas className="size-3.5" />
          Verrouillé tant que l&apos;étape précédente n&apos;est pas validée
        </span>
        {confirmation ? null : (
          <button
            type="button"
            onClick={() => setConfirmation(true)}
            disabled={nbTermines === 0}
            className="cursor-pointer rounded-lg border border-line px-2.5 py-1 font-semibold text-navy-900 transition-colors hover:bg-line-soft disabled:cursor-not-allowed disabled:border-transparent disabled:text-muted disabled:hover:bg-transparent"
          >
            Réinitialiser le parcours
          </button>
        )}
      </div>

      {confirmation ? (
        <div className="mx-auto mt-4 max-w-md rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-xs leading-relaxed text-orange-600">
            Cela efface l&apos;avancement <strong>pour tout le monde</strong>.
            Les documents et les observations sont conservés.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onReinitialiser();
                setConfirmation(false);
              }}
              className="flex-1 cursor-pointer rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="flex-1 cursor-pointer rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-navy-900 transition-colors hover:bg-line-soft"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({
  libelle,
  valeur,
  accent,
}: {
  libelle: string;
  valeur: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">
        {libelle}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-semibold ${
          accent ? "text-orange-500" : "text-navy-900"
        }`}
      >
        {valeur}
      </dd>
    </div>
  );
}
