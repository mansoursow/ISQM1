import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { formaterHorodatage, formaterTaille } from "@/lib/collab";
import type { DocumentLivrable } from "@/lib/collab";
import {
  TOTAL_LIVRABLES,
  echeance,
  formaterDate,
  livrableParCode,
} from "@/lib/isqm";

/**
 * Avertit l'équipe par courriel dès qu'un document est déposé sur un livrable.
 *
 * L'envoi ne doit jamais faire échouer un dépôt : toute erreur est consignée
 * et avalée. Si le SMTP n'est pas configuré, la notification est simplement
 * inactive et l'application fonctionne normalement.
 */

/** Destinataires par défaut, remplaçables par `COURRIEL_DESTINATAIRES`. */
const DESTINATAIRES_PAR_DEFAUT = [
  "mansour.sow@adoc-consulting.com",
  "ibrahima.gueye@adoc-sn.com",
  "alpha.gueye@adoc-sn.com",
  "kine.gueye@adoc-consulting.com",
  "clarkdaniellepamelayahi@gmail.com",
];

/** Au-delà, on renonce plutôt que de faire patienter la personne qui dépose. */
const DELAI_MAX_MS = 12_000;

export const COURRIEL_ACTIF = Boolean(
  process.env.SMTP_HOTE &&
    process.env.SMTP_UTILISATEUR &&
    process.env.SMTP_MOTDEPASSE,
);

export function destinataires(): string[] {
  const brut = process.env.COURRIEL_DESTINATAIRES;
  if (!brut?.trim()) return DESTINATAIRES_PAR_DEFAUT;
  return brut
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

function expediteur(): string {
  const adresse =
    process.env.COURRIEL_EXPEDITEUR ?? process.env.SMTP_UTILISATEUR ?? "";
  return `"Feuille de route ISQM 1" <${adresse}>`;
}

export function adresseDuSite(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

let transport: Transporter | null = null;

function obtenirTransport(): Transporter {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOTE,
      port,
      // 465 impose TLS d'emblée ; 587 négocie avec STARTTLS.
      secure: port === 465,
      auth: {
        user: process.env.SMTP_UTILISATEUR,
        pass: process.env.SMTP_MOTDEPASSE,
      },
      connectionTimeout: DELAI_MAX_MS,
      greetingTimeout: DELAI_MAX_MS,
      socketTimeout: DELAI_MAX_MS,
    });
  }
  return transport;
}

// ── Composition du message ─────────────────────────────────────────────────

function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type MessageDepot = {
  sujet: string;
  texte: string;
  html: string;
};

/** Construit le message annonçant un dépôt. Testable sans envoyer quoi que ce soit. */
export function composerMessageDepot(
  code: string,
  document: DocumentLivrable,
): MessageDepot {
  const livrable = livrableParCode(code);
  const titre = livrable?.titre ?? code;
  const etape = livrable ? `étape ${livrable.step}/${TOTAL_LIVRABLES}` : code;
  const dateEcheance = livrable ? formaterDate(echeance(livrable)) : null;
  const lien = `${adresseDuSite()}/#livrable-${code}`;

  const sujet = `[ISQM 1] ${document.auteur} a déposé un document — ${code} ${titre}`;

  const lignes = [
    `${document.auteur} vient de déposer un document sur la feuille de route ISQM 1.`,
    "",
    `Livrable : ${code} — ${titre} (${etape})`,
    ...(dateEcheance ? [`Échéance : ${dateEcheance}`] : []),
    `Fichier  : ${document.nom} (${formaterTaille(document.taille)})`,
    `Déposé le : ${formaterHorodatage(document.deposeLe)}`,
    "",
    `Consulter et commenter : ${lien}`,
  ];

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f5f7fb;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#0a1f44;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;">
    <tr><td style="background:#0a2f73;border-radius:16px 16px 0 0;padding:22px 26px;">
      <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ffb088;font-weight:600;">Feuille de route ISQM 1</p>
      <p style="margin:6px 0 0;font-size:19px;font-weight:700;color:#ffffff;">Nouveau document déposé</p>
    </td></tr>
    <tr><td style="background:#ffffff;padding:26px;border:1px solid #e3e5e9;border-top:0;">
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
        <strong>${echapper(document.auteur)}</strong> vient de déposer un document
        sur le livrable <strong>${echapper(code)}</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.55;">
        ${ligne("Livrable", `${echapper(code)} — ${echapper(titre)}`)}
        ${ligne("Étape", echapper(etape))}
        ${dateEcheance ? ligne("Échéance", echapper(dateEcheance)) : ""}
        ${ligne("Fichier", `${echapper(document.nom)} · ${formaterTaille(document.taille)}`)}
        ${ligne("Déposé le", echapper(formaterHorodatage(document.deposeLe)))}
      </table>
      <p style="margin:24px 0 0;">
        <a href="${lien}" style="display:inline-block;background:#e64501;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:12px;">Consulter le livrable</a>
      </p>
      <p style="margin:18px 0 0;font-size:12px;color:#a3a9b3;line-height:1.5;">
        Vous recevez ce message parce que vous suivez la mise en conformité
        ISQM 1 du cabinet.
      </p>
    </td></tr>
  </table>
</body></html>`;

  return { sujet, texte: lignes.join("\n"), html };
}

function ligne(libelle: string, valeur: string): string {
  return `<tr>
    <td style="padding:5px 14px 5px 0;color:#a3a9b3;white-space:nowrap;vertical-align:top;">${libelle}</td>
    <td style="padding:5px 0;font-weight:600;">${valeur}</td>
  </tr>`;
}

// ── Envoi ──────────────────────────────────────────────────────────────────

/**
 * Envoie la notification de dépôt. Ne lève jamais : un incident d'envoi ne
 * doit pas empêcher le document d'être enregistré.
 */
export async function notifierDepot(
  code: string,
  document: DocumentLivrable,
): Promise<void> {
  if (!COURRIEL_ACTIF) {
    console.info(
      "[courriel] SMTP non configuré : notification de dépôt ignorée.",
    );
    return;
  }

  try {
    const message = composerMessageDepot(code, document);
    await obtenirTransport().sendMail({
      from: expediteur(),
      to: destinataires(),
      subject: message.sujet,
      text: message.texte,
      html: message.html,
    });
  } catch (e) {
    console.error(
      "[courriel] Échec de la notification de dépôt :",
      e instanceof Error ? e.message : e,
    );
  }
}
