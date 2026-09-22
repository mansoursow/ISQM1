import { couleurPour, initiales } from "@/lib/membres";

export function Avatar({
  nom,
  taille = "size-7",
}: {
  nom: string;
  taille?: string;
}) {
  return (
    <span
      className={`grid ${taille} shrink-0 place-items-center rounded-full text-[10px] font-bold ${couleurPour(nom)}`}
      aria-hidden
    >
      {initiales(nom)}
    </span>
  );
}
