"use client";

import { useCallback, useSyncExternalStore } from "react";

const CLE = "isqm1:identite";

/**
 * Qui utilise ce poste. Retenu dans le navigateur, pas sur le serveur : c'est
 * une signature pour les dépôts et les observations, pas une authentification.
 */
let nom: string | null | undefined;
const abonnes = new Set<() => void>();

function lireStockage(): string | null {
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut && brut.trim() ? brut : null;
  } catch {
    return null;
  }
}

function instantane(): string | null {
  if (nom === undefined) nom = lireStockage();
  return nom;
}

const instantaneServeur = (): string | null => null;

function sAbonner(cb: () => void) {
  abonnes.add(cb);
  const surStockage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== CLE) return;
    nom = lireStockage();
    cb();
  };
  window.addEventListener("storage", surStockage);
  return () => {
    abonnes.delete(cb);
    window.removeEventListener("storage", surStockage);
  };
}

export function useIdentite(): [string | null, (valeur: string) => void] {
  const identite = useSyncExternalStore(
    sAbonner,
    instantane,
    instantaneServeur,
  );

  const definir = useCallback((valeur: string) => {
    const propre = valeur.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!propre) return;
    nom = propre;
    try {
      window.localStorage.setItem(CLE, propre);
    } catch {
      // Stockage indisponible : l'identité tiendra le temps de la session.
    }
    for (const cb of abonnes) cb();
  }, []);

  return [identite, definir];
}
