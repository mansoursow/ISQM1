import { lireEtat, modifierEtat } from "@/server/stockage";

/** État complet de la feuille de route, partagé par tous les postes. */
export async function GET() {
  return Response.json(await lireEtat());
}

/**
 * Remet l'avancement à zéro. Les documents déposés et les observations sont
 * conservés : seules les validations d'étapes sont effacées.
 */
export async function DELETE() {
  return Response.json(
    await modifierEtat((etat) => ({ ...etat, termines: [] })),
  );
}
