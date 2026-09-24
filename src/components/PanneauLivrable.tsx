"use client";

import { useEffect, useRef, useState } from "react";
import {
  formaterHorodatage,
  formaterTaille,
  lisibleEnLigne,
  urlDocument,
  type DocumentLivrable,
  type Observation,
} from "@/lib/collab";
import {
  COMPOSANTES,
  PHASES,
  TOTAL_LIVRABLES,
  echeance,
  formaterDate,
  joursRestants,
  type EtatLivrable,
  type Livrable,
} from "@/lib/isqm";
import { Avatar } from "./Avatar";
import { ChoixAuteur } from "./ChoixAuteur";
import {
  IconeAlerte,
  IconeBulle,
  IconeCheck,
  IconeCorbeille,
  IconeCroix,
  IconeDocument,
  IconeEnvoyer,
  IconeImport,
  IconeOeil,
  IconeTelecharger,
} from "./icons";

const FORMATS_ACCEPTES = ".pdf,.docx,.doc";

type Onglet = "documents" | "observations" | "fiche";

type Props = {
  livrable: Livrable | null;
  etat: EtatLivrable | null;
  documents: DocumentLivrable[];
  observations: Observation[];
  /** Dernier nom utilisé sur ce poste, présélectionné dans le choix d'auteur. */
  dernierAuteur: string | null;
  aujourdhui: Date | null;
  onFermer: () => void;
  onDefinirStatut: (code: string, termine: boolean) => Promise<void>;
  onDeposer: (code: string, fichier: File, auteur: string) => Promise<void>;
  onRetirer: (code: string, id: string) => Promise<void>;
  onObserver: (code: string, texte: string, auteur: string) => Promise<void>;
  onLire: (doc: DocumentLivrable) => void;
};

export function PanneauLivrable({
  livrable,
  etat,
  documents,
  observations,
  dernierAuteur,
  aujourdhui,
  onFermer,
  onDefinirStatut,
  onDeposer,
  onRetirer,
  onObserver,
  onLire,
}: Props) {
  // Le parent remonte ce panneau à chaque livrable (prop `key`) : l'onglet
  // repart donc toujours sur les documents.
  const [onglet, setOnglet] = useState<Onglet>("documents");

  useEffect(() => {
    if (!livrable) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surTouche);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", surTouche);
      document.body.style.overflow = "";
    };
  }, [livrable, onFermer]);

  if (!livrable) return null;

  const date = echeance(livrable);
  const restants = aujourdhui ? joursRestants(date, aujourdhui) : null;
  const enRetard = etat !== "termine" && restants !== null && restants < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titre-livrable"
    >
      <div
        className="absolute inset-0 bg-navy-900/45 backdrop-blur-[2px]"
        onClick={onFermer}
      />

      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="shrink-0 bg-navy-700 px-5 pt-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-orange-200 uppercase">
                Livrable {livrable.code} · Étape {livrable.step}/{TOTAL_LIVRABLES}
              </p>
              <h2 id="titre-livrable" className="mt-1 text-lg font-bold">
                {livrable.titre}
              </h2>
              <p
                className={`mt-1.5 text-xs ${
                  enRetard ? "font-semibold text-orange-200" : "text-white/70"
                }`}
              >
                Échéance {formaterDate(date)}
                {etat === "termine"
                  ? " · validé"
                  : enRetard
                    ? " · en retard"
                    : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <IconeCroix className="size-4" />
            </button>
          </div>

          <nav
            className="-mb-px mt-4 flex gap-1"
            aria-label="Sections du livrable"
          >
            <BoutonOnglet
              actif={onglet === "documents"}
              onClick={() => setOnglet("documents")}
              icone={<IconeDocument className="size-3.5" />}
              libelle="Documents"
              compteur={documents.length}
            />
            <BoutonOnglet
              actif={onglet === "observations"}
              onClick={() => setOnglet("observations")}
              icone={<IconeBulle className="size-3.5" />}
              libelle="Observations"
              compteur={observations.length}
            />
            <BoutonOnglet
              actif={onglet === "fiche"}
              onClick={() => setOnglet("fiche")}
              libelle="Fiche"
            />
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {onglet === "documents" ? (
            <SectionDocuments
              code={livrable.code}
              documents={documents}
              dernierAuteur={dernierAuteur}
              onDeposer={onDeposer}
              onRetirer={onRetirer}
              onLire={onLire}
            />
          ) : onglet === "observations" ? (
            <SectionObservations
              code={livrable.code}
              observations={observations}
              dernierAuteur={dernierAuteur}
              onObserver={onObserver}
            />
          ) : (
            <SectionFiche livrable={livrable} restants={restants} etat={etat} />
          )}
        </div>

        <footer className="shrink-0 border-t border-line bg-white px-5 py-4 sm:px-6">
          {etat === "termine" ? (
            <div className="flex items-center gap-3">
              <p className="flex flex-1 items-center gap-2 text-sm font-semibold text-navy-700">
                <IconeCheck className="size-4" />
                Livrable terminé
              </p>
              <button
                type="button"
                onClick={() => void onDefinirStatut(livrable.code, false)}
                className="cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-line-soft"
              >
                Rouvrir
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  void onDefinirStatut(livrable.code, true);
                  onFermer();
                }}
                className="w-full cursor-pointer rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                Marquer {livrable.code} comme terminé
              </button>
              <p className="mt-2 text-center text-[11px] text-muted">
                {documents.length === 0
                  ? "Aucun document n'est encore déposé pour ce livrable."
                  : "La validation déverrouille l'étape suivante de la démarche."}
              </p>
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}

// ── Onglets ────────────────────────────────────────────────────────────────

function BoutonOnglet({
  actif,
  onClick,
  icone,
  libelle,
  compteur,
}: {
  actif: boolean;
  onClick: () => void;
  icone?: React.ReactNode;
  libelle: string;
  compteur?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={actif ? "page" : undefined}
      className={`flex cursor-pointer items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
        actif
          ? "border-orange-500 bg-white/10 text-white"
          : "border-transparent text-white/60 hover:text-white"
      }`}
    >
      {icone}
      {libelle}
      {compteur !== undefined && compteur > 0 ? (
        <span className="rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
          {compteur}
        </span>
      ) : null}
    </button>
  );
}

// ── Documents ──────────────────────────────────────────────────────────────

function SectionDocuments({
  code,
  documents,
  dernierAuteur,
  onDeposer,
  onRetirer,
  onLire,
}: {
  code: string;
  documents: DocumentLivrable[];
  dernierAuteur: string | null;
  onDeposer: (code: string, fichier: File, auteur: string) => Promise<void>;
  onRetirer: (code: string, id: string) => Promise<void>;
  onLire: (doc: DocumentLivrable) => void;
}) {
  const champ = useRef<HTMLInputElement>(null);
  /** Fichier en attente du nom du déposant : seulement quand on ne le sait pas. */
  const [enAttente, setEnAttente] = useState<File | null>(null);
  /** Nom du fichier en cours d'envoi, pour que l'attente soit visible. */
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [echec, setEchec] = useState<string | null>(null);
  const [changerAuteur, setChangerAuteur] = useState(false);
  const [survol, setSurvol] = useState(false);

  const viderChamp = () => {
    if (champ.current) champ.current.value = "";
  };

  const envoyer = async (fichier: File, auteur: string) => {
    setEnAttente(null);
    setChangerAuteur(false);
    setEchec(null);
    setEnvoi(fichier.name);
    try {
      await onDeposer(code, fichier, auteur);
    } catch (e) {
      setEchec(e instanceof Error ? e.message : "Le dépôt du fichier a échoué.");
    } finally {
      setEnvoi(null);
      viderChamp();
    }
  };

  /**
   * Un fichier choisi part immédiatement : le nom n'est demandé que si on ne
   * le connaît pas encore, ou si la personne a demandé à en changer.
   */
  const choisir = (fichier: File | null | undefined) => {
    if (!fichier) return;
    setEchec(null);
    if (dernierAuteur && !changerAuteur) {
      void envoyer(fichier, dernierAuteur);
    } else {
      setEnAttente(fichier);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          choisir(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          survol || enAttente
            ? "border-orange-500 bg-orange-50"
            : "border-line bg-sand-50"
        }`}
      >
        <IconeImport className="mx-auto size-6 text-navy-500" />
        <p className="mt-2 text-sm font-semibold text-navy-900">
          {envoi ? "Envoi en cours…" : "Déposer le livrable"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {envoi ?? "PDF ou Word (.docx, .doc) — 25 Mo maximum"}
        </p>
        <input
          ref={champ}
          type="file"
          accept={FORMATS_ACCEPTES}
          className="hidden"
          onChange={(e) => choisir(e.target.files?.[0])}
        />

        <button
          type="button"
          onClick={() => champ.current?.click()}
          disabled={envoi !== null}
          className="mt-3 cursor-pointer rounded-xl bg-navy-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-muted"
        >
          {envoi ? "Envoi…" : "Choisir un fichier"}
        </button>

        {dernierAuteur && !enAttente && !envoi ? (
          <p className="mt-2.5 text-[11px] text-muted">
            Vous déposez en tant que{" "}
            <span className="font-semibold text-navy-900">{dernierAuteur}</span>
            {" · "}
            <button
              type="button"
              onClick={() => {
                setChangerAuteur(true);
                champ.current?.click();
              }}
              className="cursor-pointer font-semibold text-orange-600 underline underline-offset-2"
            >
              changer
            </button>
          </p>
        ) : null}
      </div>

      {enAttente ? (
        <div className="mt-3">
          <p className="mb-2 text-center text-xs font-semibold text-navy-900">
            « {enAttente.name} » est prêt — il ne partira qu&apos;une fois le
            nom choisi.
          </p>
          <ChoixAuteur
            titre="Qui dépose ce document ?"
            defaut={dernierAuteur}
            onChoisir={(nom) => void envoyer(enAttente, nom)}
            onAnnuler={() => {
              setEnAttente(null);
              setChangerAuteur(false);
              viderChamp();
            }}
          />
        </div>
      ) : null}

      {echec ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-[11px] leading-relaxed text-orange-600">
          <IconeAlerte className="mt-px size-3.5 shrink-0" />
          {echec}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <p className="mt-5 text-center text-xs text-muted">
          Aucun document déposé pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="rounded-2xl border border-line bg-white p-3.5"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
                  <IconeDocument className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {doc.nom}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                    <Avatar nom={doc.auteur} taille="size-4" />
                    {doc.auteur} · {formaterHorodatage(doc.deposeLe)} ·{" "}
                    {formaterTaille(doc.taille)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {lisibleEnLigne(doc) ? (
                  <button
                    type="button"
                    onClick={() => onLire(doc)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-orange-600"
                  >
                    <IconeOeil className="size-3.5" />
                    Accès au livrable
                  </button>
                ) : null}
                <a
                  href={urlDocument(code, doc.id, true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold text-navy-900 transition-colors hover:bg-line-soft"
                >
                  <IconeTelecharger className="size-3.5" />
                  Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => void onRetirer(code, doc.id)}
                  className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-orange-50 hover:text-orange-600"
                >
                  <IconeCorbeille className="size-3.5" />
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Observations ───────────────────────────────────────────────────────────

function SectionObservations({
  code,
  observations,
  dernierAuteur,
  onObserver,
}: {
  code: string;
  observations: Observation[];
  dernierAuteur: string | null;
  onObserver: (code: string, texte: string, auteur: string) => Promise<void>;
}) {
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  // Le nom de l'auteur est demandé au moment de publier, pas avant.
  const [choixOuvert, setChoixOuvert] = useState(false);

  const publier = async (auteur: string) => {
    setChoixOuvert(false);
    const propre = texte.trim();
    if (!propre) return;
    setEnvoi(true);
    try {
      await onObserver(code, propre, auteur);
      setTexte("");
    } catch {
      // Le message d'erreur est affiché en tête de page.
    } finally {
      setEnvoi(false);
    }
  };

  const triees = [...observations].sort((a, b) =>
    a.ecritLe.localeCompare(b.ecritLe),
  );

  return (
    <div>
      {triees.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">
          Aucune observation. Chacun peut commenter ce livrable depuis son poste.
        </p>
      ) : (
        <ul className="space-y-3">
          {triees.map((o) => (
            <li key={o.id} className="flex gap-2.5">
              <Avatar nom={o.auteur} taille="size-8" />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-line bg-sand-50 px-3.5 py-2.5">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-xs font-bold text-navy-900">
                    {o.auteur}
                  </span>
                  <span className="text-[10px] text-muted">
                    {formaterHorodatage(o.ecritLe)}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-navy-900/85">
                  {o.texte}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && texte.trim()) {
              e.preventDefault();
              setChoixOuvert(true);
            }
          }}
          disabled={envoi}
          rows={3}
          maxLength={4000}
          placeholder={
            dernierAuteur
              ? `Observation de ${dernierAuteur}…`
              : "Votre observation…"
          }
          aria-label="Votre observation"
          className="w-full resize-y rounded-xl border border-line px-3 py-2.5 text-sm text-navy-900 outline-none placeholder:text-muted focus:border-orange-500 disabled:bg-line-soft"
        />
        {choixOuvert ? (
          <div className="mt-2">
            <ChoixAuteur
              titre="Qui publie cette observation ?"
              defaut={dernierAuteur}
              onChoisir={(nom) => void publier(nom)}
              onAnnuler={() => setChoixOuvert(false)}
            />
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-muted">Ctrl + Entrée pour envoyer</p>
            <button
              type="button"
              onClick={() => setChoixOuvert(true)}
              disabled={envoi || !texte.trim()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-navy-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-muted"
            >
              <IconeEnvoyer className="size-3.5" />
              {envoi ? "Envoi…" : "Publier"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fiche de référence ─────────────────────────────────────────────────────

function SectionFiche({
  livrable,
  restants,
  etat,
}: {
  livrable: Livrable;
  restants: number | null;
  etat: EtatLivrable | null;
}) {
  const composante = COMPOSANTES.find((c) => c.id === livrable.composante)!;
  const phase = PHASES.find((p) => p.id === livrable.phase)!;
  const enRetard = etat !== "termine" && restants !== null && restants < 0;

  const composantesAussi = (livrable.composantesAussi ?? []).map(
    (id) => COMPOSANTES.find((c) => c.id === id)!,
  );
  const phasesAussi = (livrable.phasesAussi ?? []).map(
    (id) => PHASES.find((p) => p.id === id)!,
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Puce label={`Composante ${composante.id}`} accent />
        {composantesAussi.map((c) => (
          <Puce key={c.id} label={`Composante ${c.id}`} accent />
        ))}
        <Puce label={`Phase ${phase.id}`} />
        {phasesAussi.map((p) => (
          <Puce key={p.id} label={`Phase ${p.id}`} />
        ))}
        <Puce label={livrable.frequence} />
        {livrable.siApplicable ? <Puce label="Si applicable" /> : null}
      </div>

      {livrable.composition ? (
        <div className="mt-6 rounded-2xl border border-navy-100 bg-navy-100/40 p-4">
          <h3 className="text-[11px] font-bold tracking-[0.14em] text-navy-700 uppercase">
            Un seul document pour {livrable.composition.length} livrables
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-navy-900/75">
            Ces livrables de la norme sont réunis dans un document unique : il
            n&apos;y a donc qu&apos;un fichier à joindre, mais il doit couvrir
            les {livrable.composition.length} contenus ci-dessous.
          </p>
          <ul className="mt-3 space-y-2.5">
            {livrable.composition.map((source) => (
              <li
                key={source.code}
                className="rounded-xl bg-white px-3.5 py-3"
              >
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded-md bg-navy-700 px-2 py-0.5 text-[11px] font-bold text-white">
                    {source.code}
                  </span>
                  <span className="text-sm font-semibold text-navy-900">
                    {source.titre}
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-navy-900/75">
                  {source.contenu}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Bloc titre="Contenu attendu">
        <p className="text-sm leading-relaxed text-navy-900/80">
          {livrable.contenu}
        </p>
      </Bloc>

      <Bloc titre="Échéance">
        <p className="text-sm font-semibold text-navy-900">
          {formaterDate(echeance(livrable))}
        </p>
        {restants !== null ? (
          <p
            className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${
              enRetard ? "text-orange-500" : "text-muted"
            }`}
          >
            {enRetard ? <IconeAlerte className="size-3.5" /> : null}
            {etat === "termine"
              ? "Livrable validé"
              : restants > 0
                ? `Dans ${restants} jour${restants > 1 ? "s" : ""}`
                : restants === 0
                  ? "À rendre aujourd'hui"
                  : `${Math.abs(restants)} jour${Math.abs(restants) > 1 ? "s" : ""} de retard`}
          </p>
        ) : null}
      </Bloc>

      {[composante, ...composantesAussi].map((c) => (
        <Bloc key={c.id} titre={`Composante ${c.id} — ${c.titre}`}>
          <p className="text-sm leading-relaxed text-navy-900/80">{c.objet}</p>
        </Bloc>
      ))}

      {[phase, ...phasesAussi].map((p) => (
        <Bloc key={p.id} titre={`Phase ${p.id} — ${p.titre}`}>
          <p className="text-sm leading-relaxed text-navy-900/80">
            {p.objectif}
          </p>
          <p className="mt-1 text-xs text-muted">Couvre : {p.composantes}</p>
        </Bloc>
      ))}

      {livrable.siApplicable ? (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-orange-600">
            Ce livrable dépend du profil du cabinet (entités cotées,
            appartenance à un réseau, nature des missions). S&apos;il n&apos;est
            pas pertinent, consignez-le comme « Non applicable » dans la
            checklist avant de valider l&apos;étape.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ── Éléments partagés ──────────────────────────────────────────────────────

function Puce({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        accent
          ? "bg-orange-500 text-white"
          : "border border-line bg-line-soft text-navy-500"
      }`}
    >
      {label}
    </span>
  );
}

function Bloc({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
        {titre}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
