"use client";

import { useSyncExternalStore } from "react";

const sansAbonnement = () => () => {};

/**
 * `false` pendant le rendu serveur et l'hydratation, `true` ensuite.
 *
 * Sert de garde pour tout ce qui dépend du navigateur (date du jour, stockage
 * local) sans provoquer d'écart d'hydratation ni de `setState` dans un effet.
 */
export function useEstClient(): boolean {
  return useSyncExternalStore(
    sansAbonnement,
    () => true,
    () => false,
  );
}
