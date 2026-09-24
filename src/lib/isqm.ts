/**
 * Référentiel ISQM 1 (IAASB) — Système de gestion de la qualité (SGQ).
 *
 Les livrables de la norme (L1 → L24) répartis dans 8 composantes et produits
 * au fil de 6 phases de mise en œuvre. L'ordre `step` suit la démarche du
 * document « ISQM1 — Livrables et démarche de mise en œuvre » (note technique,
 * sept. 2026), et non la numérotation L1..L24 : c'est lui qui pilote le
 * déverrouillage séquentiel de l'arborescence.
 *
 * L1, L2 et L3 sont regroupés en un document unique, comme la section 5 de la
 * note technique l'autorise pour un cabinet modeste. Le nombre de livrables à
 * produire n'est donc pas 24 : utiliser `TOTAL_LIVRABLES`, jamais une
 * constante écrite en dur.
 */

export const PROJET = {
  debut: "2026-09-22",
  /** 3 semaines = 15 jours ouvrés à partir du début. */
  dureeJoursOuvres: 15,
} as const;

export type EtatLivrable = "termine" | "actif" | "verrouille";

export type Phase = {
  id: number;
  titre: string;
  objectif: string;
  composantes: string;
};

export type Composante = {
  id: number;
  titre: string;
  objet: string;
};

/** Un des livrables de la norme regroupés dans un document unique. */
export type LivrableSource = {
  code: string;
  titre: string;
  contenu: string;
};

export type Livrable = {
  /** Code officiel de la norme, ou codes joints quand il y a regroupement. */
  code: string;
  /** Rang dans la démarche. Pilote le déverrouillage. */
  step: number;
  titre: string;
  contenu: string;
  frequence: string;
  composante: number;
  phase: number;
  /**
   * Livrables de la norme couverts par ce document unique. Renseigné seulement
   * en cas de regroupement (voir section 5 de la note technique).
   */
  composition?: LivrableSource[];
  /** Autres composantes couvertes, quand le livrable en traverse plusieurs. */
  composantesAussi?: number[];
  /** Autres phases couvertes. */
  phasesAussi?: number[];
  /** Livrable dépendant du profil du cabinet (section 5 du document). */
  siApplicable?: boolean;
  /** Décalage en jours ouvrés depuis le début du projet. */
  jourOuvre: number;
};

export const COMPOSANTES: Composante[] = [
  {
    id: 1,
    titre: "Processus d'évaluation des risques du cabinet",
    objet:
      "Établir les objectifs de qualité, identifier et évaluer les risques, concevoir les réponses.",
  },
  {
    id: 2,
    titre: "Gouvernance et leadership",
    objet:
      "Culture qualité, responsabilité ultime de la direction, structure et ressources.",
  },
  {
    id: 3,
    titre: "Règles de déontologie pertinentes",
    objet:
      "Éthique professionnelle et indépendance ; confirmation écrite annuelle du personnel.",
  },
  {
    id: 4,
    titre: "Acceptation et maintien de relations clients et de missions",
    objet:
      "Intégrité du client, capacité du cabinet, absence de biais commercial.",
  },
  {
    id: 5,
    titre: "Réalisation des missions",
    objet:
      "Direction, supervision et revue ; esprit critique ; consultation ; documentation de la mission.",
  },
  {
    id: 6,
    titre: "Ressources",
    objet:
      "Ressources humaines, technologiques et intellectuelles ; fournisseurs de services.",
  },
  {
    id: 7,
    titre: "Informations et communications",
    objet:
      "Circulation d'informations fiables, en interne et avec l'extérieur.",
  },
  {
    id: 8,
    titre: "Processus de suivi et de prise de mesures correctives",
    objet:
      "Suivi continu et périodique, causes profondes, mesures correctives.",
  },
];

export const PHASES: Phase[] = [
  {
    id: 1,
    titre: "Gouvernance et cadrage",
    objectif: "Poser les fondations : culture qualité, responsabilités et moyens.",
    composantes: "Composante 2",
  },
  {
    id: 2,
    titre: "Évaluation des risques et conception du SGQ",
    objectif:
      "Établir l'approche fondée sur les risques sur laquelle repose tout le système.",
    composantes: "Composante 1",
  },
  {
    id: 3,
    titre: "Mise en œuvre des réponses",
    objectif:
      "Déployer les réponses aux risques dans les quatre composantes opérationnelles.",
    composantes: "Composantes 3 à 6",
  },
  {
    id: 4,
    titre: "Information et communication",
    objectif:
      "Assurer la circulation d'informations fiables et pertinentes, en interne et en externe.",
    composantes: "Composante 7",
  },
  {
    id: 5,
    titre: "Suivi et mesures correctives",
    objectif:
      "Surveiller le SGQ de manière proactive et corriger durablement les déficiences.",
    composantes: "Composante 8",
  },
  {
    id: 6,
    titre: "Évaluation annuelle par la direction",
    objectif: "Boucler le cycle : la direction évalue le SGQ et conclut.",
    composantes: "Composantes 2 et 8",
  },
];

export const LIVRABLES: Livrable[] = [
  // ── Phases 1 et 2 — Gouvernance, cadrage et conception du SGQ ────────────
  {
    // La section 5 de la note technique prévoit ce regroupement : « Objectifs,
    // risques et réponses regroupés dans un document unique (L1, L2, L3) ».
    code: "L1-L3",
    step: 1,
    titre: "Manuel du SGQ : objectifs, risques et responsabilités",
    contenu:
      "Document unique réunissant les objectifs de qualité du cabinet, la cartographie des risques liés à la qualité et les réponses associées, ainsi que l'attribution écrite des responsabilités du SGQ.",
    composition: [
      {
        code: "L1",
        titre: "Manuel / documentation du SGQ",
        contenu:
          "Objectifs de qualité du cabinet, risques liés à la qualité identifiés et réponses associées pour les atténuer.",
      },
      {
        code: "L2",
        titre: "Cartographie des risques liés à la qualité",
        contenu:
          "Identification et évaluation des risques présentant une possibilité raisonnable de se concrétiser et d'affecter l'atteinte des objectifs de qualité.",
      },
      {
        code: "L3",
        titre: "Matrice d'attribution des responsabilités",
        contenu:
          "Attribution écrite de la responsabilité ultime du SGQ à la direction générale (associé directeur) et des responsabilités fonctionnelles (indépendance, suivi, etc.).",
      },
    ],
    frequence: "Continu, révisé à chaque changement",
    composante: 1,
    composantesAussi: [2],
    phase: 1,
    phasesAussi: [2],
    jourOuvre: 3,
  },
  {
    code: "L4",
    step: 2,
    titre: "Planification des ressources",
    contenu:
      "Planification des ressources financières et opérationnelles mises au service de la qualité.",
    frequence: "À la mise en place, puis à chaque changement",
    composante: 2,
    phase: 1,
    jourOuvre: 4,
  },
  {
    code: "L5",
    step: 3,
    titre: "Documentation des exigences et services du réseau",
    contenu:
      "Évaluation et adaptation des ressources, méthodes et logiciels imposés ou fournis par le réseau auquel appartient le cabinet.",
    frequence: "À la mise en place, puis à chaque changement",
    composante: 2,
    phase: 1,
    siApplicable: true,
    jourOuvre: 5,
  },

  // ── Phase 3a — Déontologie et indépendance (composante 3) ─────────────────
  {
    code: "L7",
    step: 4,
    titre: "Procédures de déontologie et d'indépendance",
    contenu:
      "Politiques garantissant le respect des principes fondamentaux (intégrité, objectivité, compétence, confidentialité, comportement professionnel) et des règles d'indépendance, y compris par les tiers (réseau, fournisseurs).",
    frequence: "Continu",
    composante: 3,
    phase: 3,
    jourOuvre: 6,
  },
  {
    code: "L8",
    step: 5,
    titre: "Confirmations annuelles d'indépendance",
    contenu:
      "Confirmations écrites individuelles et consignées de conformité aux règles d'indépendance, obtenues auprès de tout le personnel concerné.",
    frequence: "Annuel",
    composante: 3,
    phase: 3,
    jourOuvre: 6,
  },
  {
    code: "L9",
    step: 6,
    titre: "Dispositif de traitement des plaintes et allégations",
    contenu:
      "Dispositif de réception et de traitement des plaintes et des allégations.",
    frequence: "Continu",
    composante: 3,
    phase: 3,
    jourOuvre: 7,
  },

  // ── Phase 3b — Acceptation et maintien (composante 4) ─────────────────────
  {
    code: "L10",
    step: 7,
    titre: "Fiches d'évaluation préalable client / mission",
    contenu:
      "Évaluation de l'intégrité et des valeurs éthiques du client, de la capacité et des ressources du cabinet (compétences, temps, accès aux données), sans biais lié aux priorités financières ou commerciales.",
    frequence: "Par mission",
    composante: 4,
    phase: 3,
    jourOuvre: 7,
  },

  // ── Phase 3c — Réalisation des missions (composante 5) ────────────────────
  {
    code: "L11",
    step: 8,
    titre: "Consignes de direction, de supervision et de revue",
    contenu:
      "Cadre de direction, supervision et revue des travaux selon l'expérience des membres de l'équipe ; consultation et résolution des divergences d'opinions.",
    frequence: "Par mission",
    composante: 5,
    phase: 3,
    jourOuvre: 8,
  },
  {
    code: "L12",
    step: 9,
    titre: "Dossier de mission définitif assemblé",
    contenu:
      "Archivage complet et sécurisé de la documentation de la mission, à constituer au plus tard 60 jours après la date du rapport (missions ISA/ISAE).",
    frequence: "Par mission",
    composante: 5,
    phase: 3,
    jourOuvre: 8,
  },
  {
    code: "L13",
    step: 10,
    titre:
      "Registre des missions soumises à revue de qualité et documentation de la revue (EQR / ISQM 2)",
    contenu:
      "Liste des missions concernées (entités cotées ou missions à risques) et preuve de la réalisation objective de la revue.",
    frequence: "Par mission",
    composante: 5,
    phase: 3,
    siApplicable: true,
    jourOuvre: 9,
  },

  // ── Phase 3d — Ressources (composante 6) ──────────────────────────────────
  {
    code: "L14",
    step: 11,
    titre: "Plan de formation et de compétences (RH)",
    contenu:
      "Recrutement, formation continue, évaluation et affectation d'équipes qualifiées disposant du temps requis.",
    frequence: "Continu",
    composante: 6,
    phase: 3,
    jourOuvre: 9,
  },
  {
    code: "L15",
    step: 12,
    titre:
      "Revue de conformité des ressources technologiques et intellectuelles",
    contenu:
      "Applications informatiques, infrastructures, sécurité des données ; méthodologies d'audit, guides sectoriels et modèles.",
    frequence: "Continu",
    composante: 6,
    phase: 3,
    jourOuvre: 10,
  },
  {
    code: "L16",
    step: 13,
    titre: "Évaluation des fournisseurs de services",
    contenu:
      "Évaluation de la pertinence des ressources externes (experts, logiciels tiers).",
    frequence: "Périodique",
    composante: 6,
    phase: 3,
    jourOuvre: 10,
  },

  // ── Phase 4 — Information et communication (composante 7) ─────────────────
  {
    code: "L17",
    step: 14,
    titre: "Plan de communication interne du SGQ",
    contenu:
      "Transmission au personnel et aux équipes de mission de leurs responsabilités et des évolutions du SGQ.",
    frequence: "Continu",
    composante: 7,
    phase: 4,
    jourOuvre: 11,
  },
  {
    code: "L18",
    step: 15,
    titre:
      "Rapport de communication avec les responsables de la gouvernance",
    contenu:
      "Communications écrites ou comptes rendus de discussions avec les organes de gouvernance des clients (notamment entités cotées) sur la façon dont le SGQ soutient la qualité des missions.",
    frequence: "Par mission",
    composante: 7,
    phase: 4,
    siApplicable: true,
    jourOuvre: 11,
  },
  {
    code: "L19",
    step: 16,
    titre:
      "Rapport de transparence / communications publiques ou aux régulateurs",
    contenu:
      "Publication ou rapport écrit détaillant la structure et le fonctionnement du SGQ ; échanges avec le réseau et les autorités de régulation.",
    frequence: "Périodique",
    composante: 7,
    phase: 4,
    siApplicable: true,
    jourOuvre: 12,
  },

  // ── Phase 5 — Suivi et mesures correctives (composante 8) ─────────────────
  {
    code: "L20",
    step: 17,
    titre: "Programme et preuves des activités de suivi",
    contenu:
      "Programme et comptes rendus des activités de suivi continues et périodiques, incluant l'inspection cyclique d'au moins une mission achevée par associé responsable.",
    frequence: "Cyclique",
    composante: 8,
    phase: 5,
    jourOuvre: 12,
  },
  {
    code: "L21",
    step: 18,
    titre: "Rapport de constatations et d'analyse des causes profondes",
    contenu:
      "Registre des constatations issues des inspections (internes et externes) et rapports d'investigation sur les causes sous-jacentes (root causes) des déficiences.",
    frequence: "Cyclique",
    composante: 8,
    phase: 5,
    jourOuvre: 13,
  },
  {
    code: "L22",
    step: 19,
    titre: "Plan d'action et de suivi des mesures correctives",
    contenu:
      "Réponses conçues pour corriger les déficiences et évaluation de l'efficacité de ces mesures.",
    frequence: "Continu",
    composante: 8,
    phase: 5,
    jourOuvre: 13,
  },
  {
    code: "L23",
    step: 20,
    titre: "Rapports de communication interne sur le suivi",
    contenu:
      "Synthèses des activités de suivi transmises en temps opportun à la direction et aux équipes de mission.",
    frequence: "Périodique",
    composante: 8,
    phase: 5,
    jourOuvre: 14,
  },

  // ── Phase 6 — Évaluation annuelle par la direction ────────────────────────
  {
    code: "L24",
    step: 21,
    titre: "Rapport d'évaluation et conclusion annuelle de la direction",
    contenu:
      "Évaluation formalisée du SGQ et conclusion sur l'assurance raisonnable que les objectifs de qualité sont atteints (sans réserve, avec réserve ou défavorable).",
    frequence: "Annuel",
    composante: 8,
    phase: 6,
    jourOuvre: 15,
  },
  {
    code: "L6",
    step: 22,
    titre: "Évaluations périodiques de performance",
    contenu:
      "Procès-verbaux ou fiches d'évaluation de la performance des personnes responsables du SGQ et de son fonctionnement.",
    frequence: "Périodique",
    composante: 2,
    phase: 6,
    jourOuvre: 15,
  },
];

/** Ordre d'apparition des composantes dans l'arborescence (ordre de la démarche). */
export const ORDRE_COMPOSANTES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Nombre de documents à produire, regroupements pris en compte. */
export const TOTAL_LIVRABLES = LIVRABLES.length;

// ── Dates ──────────────────────────────────────────────────────────────────

/** Ajoute `n` jours ouvrés (hors samedi/dimanche) à une date ISO `YYYY-MM-DD`. */
export function ajouterJoursOuvres(isoDebut: string, n: number): string {
  const d = new Date(`${isoDebut}T00:00:00Z`);
  let restants = n;
  while (restants > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const jour = d.getUTCDay();
    if (jour !== 0 && jour !== 6) restants -= 1;
  }
  return d.toISOString().slice(0, 10);
}

/** Échéance d'un livrable, au format ISO. */
export function echeance(l: Livrable): string {
  return ajouterJoursOuvres(PROJET.debut, l.jourOuvre);
}

/** Échéance globale du projet (fin des 3 semaines). */
export const ECHEANCE_FINALE = ajouterJoursOuvres(
  PROJET.debut,
  PROJET.dureeJoursOuvres,
);

const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const FORMAT_DATE_COURT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

export function formaterDate(iso: string): string {
  return FORMAT_DATE.format(new Date(`${iso}T00:00:00Z`));
}

export function formaterDateCourt(iso: string): string {
  return FORMAT_DATE_COURT.format(new Date(`${iso}T00:00:00Z`));
}

/** Nombre de jours calendaires entre aujourd'hui et une date ISO (négatif = passé). */
export function joursRestants(iso: string, aujourdhui: Date): number {
  const cible = new Date(`${iso}T00:00:00Z`).getTime();
  const base = Date.UTC(
    aujourdhui.getFullYear(),
    aujourdhui.getMonth(),
    aujourdhui.getDate(),
  );
  return Math.round((cible - base) / 86_400_000);
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const LIVRABLES_PAR_ETAPE = [...LIVRABLES].sort((a, b) => a.step - b.step);

export function livrablesDeComposante(id: number): Livrable[] {
  return LIVRABLES_PAR_ETAPE.filter((l) => l.composante === id);
}

export function livrableParCode(code: string): Livrable | undefined {
  return LIVRABLES.find((l) => l.code === code);
}
