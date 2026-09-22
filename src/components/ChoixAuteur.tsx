"use client";

import { useEffect, useState } from "react";
import { MEMBRES } from "@/lib/membres";
import { Avatar } from "./Avatar";

type Props = {
  titre: string;
  /** Nom retenu de la dernière fois, présélectionné pour n'avoir qu'un clic à faire. */
  defaut: string | null;
  onChoisir: (nom: string) => void;
  onAnnuler: () => void;
};

/**
 * Sélection de la personne qui signe l'action, au moment de l'action.
 *
 * Rendu dans le flux plutôt qu'en surcouche positionnée : le panneau du
 * livrable défile, et une surcouche ancrée au bouton s'y ferait rogner.
 *
 * Ce n'est pas une authentification : le nom choisi est simplement attaché à
 * l'observation ou au document déposé.
 */
export function ChoixAuteur({ titre, defaut, onChoisir, onAnnuler }: Props) {
  const [autre, setAutre] = useState("");

  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onAnnuler();
      }
    };
    // `capture` : on ferme le sélecteur sans fermer le panneau du livrable.
    window.addEventListener("keydown", surTouche, true);
    return () => window.removeEventListener("keydown", surTouche, true);
  }, [onAnnuler]);

  const noms =
    defaut && !MEMBRES.some((m) => m.nom === defaut)
      ? [defaut, ...MEMBRES.map((m) => m.nom)]
      : MEMBRES.map((m) => m.nom);

  return (
    <div
      role="dialog"
      aria-label={titre}
      className="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-left"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wide text-navy-900 uppercase">
          {titre}
        </p>
        <button
          type="button"
          onClick={onAnnuler}
          className="cursor-pointer text-[11px] font-semibold text-muted transition-colors hover:text-navy-900"
        >
          Annuler
        </button>
      </div>

      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {noms.map((nom) => (
          <li key={nom}>
            <button
              type="button"
              onClick={() => onChoisir(nom)}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-white px-2.5 py-2 text-left transition-colors ${
                nom === defaut
                  ? "border-orange-500"
                  : "border-line hover:border-navy-500"
              }`}
            >
              <Avatar nom={nom} />
              <span className="truncate text-sm font-semibold text-navy-900">
                {nom}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-1.5 flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (autre.trim()) onChoisir(autre);
        }}
      >
        <input
          value={autre}
          onChange={(e) => setAutre(e.target.value)}
          placeholder="Autre nom…"
          maxLength={60}
          aria-label="Saisir un autre nom"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-navy-900 outline-none placeholder:text-muted focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={!autre.trim()}
          className="cursor-pointer rounded-lg bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-muted"
        >
          OK
        </button>
      </form>
    </div>
  );
}
