"use client";

/**
 * Nettoie le HTML produit à partir d'un document Word avant affichage.
 *
 * La conversion reconstruit le HTML depuis le contenu du .docx, mais le fichier
 * vient d'un dépôt utilisateur : on retire tout ce qui pourrait exécuter du
 * code avant de l'injecter dans la page.
 */

const BALISES_INTERDITES = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "BASE",
  "FORM",
]);

const PROTOCOLES_SURS = new Set(["http:", "https:", "mailto:"]);

function lienSur(valeur: string): boolean {
  try {
    return PROTOCOLES_SURS.has(new URL(valeur, window.location.href).protocol);
  } catch {
    return false;
  }
}

export function assainirHtml(brut: string): string {
  const doc = new DOMParser().parseFromString(brut, "text/html");

  for (const element of Array.from(doc.body.querySelectorAll("*"))) {
    if (BALISES_INTERDITES.has(element.tagName)) {
      element.remove();
      continue;
    }

    for (const attribut of Array.from(element.attributes)) {
      const nom = attribut.name.toLowerCase();

      if (nom.startsWith("on")) {
        element.removeAttribute(attribut.name);
        continue;
      }
      // Les images converties arrivent en data: ; les liens doivent rester http(s).
      if (nom === "href" && !lienSur(attribut.value)) {
        element.removeAttribute(attribut.name);
      }
      if (nom === "src" && !attribut.value.startsWith("data:image/")) {
        element.removeAttribute(attribut.name);
      }
    }

    if (element.tagName === "A" && element.hasAttribute("href")) {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  }

  return doc.body.innerHTML;
}
