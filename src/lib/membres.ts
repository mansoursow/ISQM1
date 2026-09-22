/**
 * Personnes qui interviennent sur la feuille de route.
 *
 * C'est un annuaire de signature, pas une authentification : chacun choisit son
 * nom sur son poste et ce nom est attaché à ses dépôts de documents et à ses
 * observations. Pour ajouter ou retirer quelqu'un, il suffit de modifier cette
 * liste.
 */

export type Membre = {
  id: string;
  nom: string;
  initiales: string;
  /** Classes Tailwind de la pastille d'avatar. */
  couleur: string;
};

export const MEMBRES: Membre[] = [
  {
    id: "ibrahima-gueye",
    nom: "Ibrahima Gueye",
    initiales: "IG",
    couleur: "bg-navy-700 text-white",
  },
  {
    id: "alpha-gueye",
    nom: "Alpha Gueye",
    initiales: "AG",
    couleur: "bg-orange-500 text-white",
  },
  {
    id: "fatou-kine",
    nom: "Fatou Kiné",
    initiales: "FK",
    couleur: "bg-navy-500 text-white",
  },
];

const PALETTE = [
  "bg-navy-700 text-white",
  "bg-orange-500 text-white",
  "bg-navy-500 text-white",
  "bg-orange-600 text-white",
];

export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  return (mots[0][0] + (mots[1]?.[0] ?? "")).toUpperCase();
}

/** Couleur stable pour un nom qui ne figure pas dans l'annuaire. */
export function couleurPour(nom: string): string {
  const connu = MEMBRES.find((m) => m.nom === nom);
  if (connu) return connu.couleur;
  let somme = 0;
  for (const c of nom) somme = (somme + c.charCodeAt(0)) % 997;
  return PALETTE[somme % PALETTE.length];
}
