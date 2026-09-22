# ISQM 1 — Feuille de route de conformité

Espace de travail partagé pour la mise en conformité à la norme **ISQM 1**
(IAASB) : les **24 livrables** du système de gestion de la qualité (SGQ),
répartis dans les **8 composantes** de la norme et présentés sous forme
d'organigramme. Chaque livrable est un dossier où l'on dépose le document
produit et où l'équipe laisse ses observations.

## Principe

- **En-tête** : titre, avancement global et dates clés (lancement, échéance
  finale, temps restant).
- **Arborescence** : racine « Système de gestion de la qualité » → 8 composantes
  → livrables (L1 → L24).
- **Déverrouillage séquentiel.** Un seul livrable est ouvert à la fois : il
  clignote en orange. Les suivants restent grisés et non cliquables tant qu'il
  n'est pas validé.
- L'ordre de déverrouillage suit la **démarche de mise en œuvre** en 6 phases
  (et non la numérotation L1..L24) : Phase 1 gouvernance → Phase 2 risques →
  Phase 3 réponses → Phase 4 communication → Phase 5 suivi → Phase 6 évaluation
  annuelle.
- Chaque livrable porte une **échéance** calculée en jours ouvrés depuis le
  lancement du projet.

## Travail à plusieurs

Ouvrir un livrable donne accès à trois onglets :

| Onglet | Contenu |
| --- | --- |
| **Documents** | Dépôt du livrable en PDF ou Word, lecture dans le site, téléchargement, retrait |
| **Observations** | Fil de discussion : chacun commente le livrable depuis son poste |
| **Fiche** | Contenu attendu par la norme, fréquence, composante, phase, échéance |

- **Lecture dans le site** : les PDF s'ouvrent dans la visionneuse du
  navigateur ; les fichiers `.docx` sont convertis en HTML côté navigateur
  (via `mammoth`) puis filtrés avant affichage. Les `.doc` (ancien format
  binaire) ne sont pas convertibles : ils restent téléchargeables.
- **Signature** : le nom est demandé **au moment de l'action** — en cliquant
  sur « Publier » pour une observation, ou après avoir choisi un fichier pour
  un dépôt. Le dernier nom utilisé sur le poste est retenu et présélectionné,
  pour n'avoir qu'un clic à faire. Ce n'est **pas** une authentification — il
  n'y a ni mot de passe ni contrôle d'accès. L'annuaire se modifie dans
  [`src/lib/membres.ts`](src/lib/membres.ts).
- **Synchronisation** : l'état initial vient du rendu serveur, puis la page se
  rafraîchit toutes les 10 secondes et à chaque retour sur l'onglet. Ce n'est
  pas du temps réel : une observation d'un collègue apparaît en une dizaine de
  secondes.

## Stockage

Tout est écrit sur le disque du serveur, via
[`src/server/stockage.ts`](src/server/stockage.ts) :

```
data/
  etat.json          avancement, observations, index des documents
  fichiers/<code>/   pièces jointes (nom de fichier généré, jamais celui de l'URL)
```

Les écritures concurrentes sont sérialisées par une file, et `etat.json` est
écrit de façon atomique.

> **Hébergement.** Un hébergeur au système de fichiers éphémère (Vercel,
> Netlify) perdrait ces données à chaque déploiement. Il faut un serveur avec
> un disque persistant, ou remplacer `src/server/stockage.ts` par une base de
> données — c'est le seul module à réécrire.

## Calendrier

Le planning est piloté par une seule constante, `PROJET` dans
[`src/lib/isqm.ts`](src/lib/isqm.ts) :

```ts
export const PROJET = {
  debut: "2026-09-22",
  dureeJoursOuvres: 15, // 3 semaines
};
```

Chaque livrable déclare un `jourOuvre` (décalage en jours ouvrés depuis
`debut`). Modifier `debut` décale automatiquement les 24 échéances et
l'échéance finale.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/lib/isqm.ts` | Référentiel : composantes, phases, 24 livrables, calcul des échéances |
| `src/lib/membres.ts` | Annuaire des intervenants |
| `src/lib/collab.ts` | Types et formatages partagés serveur / navigateur |
| `src/lib/useCollab.ts` | État partagé côté client, mutations, rafraîchissement |
| `src/lib/assainir.ts` | Filtrage du HTML issu d'un document Word |
| `src/server/stockage.ts` | Persistance sur disque (seule porte d'entrée) |
| `src/app/api/**` | Route handlers : état, statut, documents, observations |
| `src/components/VueFeuilleDeRoute.tsx` | Assemblage de la page |
| `src/components/Entete.tsx` | En-tête, avancement global et dates |
| `src/components/ChoixAuteur.tsx` | Choix du signataire au moment de l'action |
| `src/components/Arborescence.tsx` | Organigramme |
| `src/components/PanneauLivrable.tsx` | Dossier d'un livrable (3 onglets) |
| `src/components/VisionneuseDocument.tsx` | Lecture PDF / Word dans le site |

## Limites connues

- Pas d'authentification : toute personne qui atteint le site peut déposer,
  commenter, valider et retirer. À réserver à un réseau de confiance, ou à
  compléter par une authentification.
- Les observations ne sont ni modifiables ni supprimables une fois publiées.
- « Réinitialiser le parcours » efface l'avancement **pour tout le monde**
  (les documents et observations sont conservés) ; une confirmation est
  demandée.
- Rien n'empêche quelqu'un de publier sous le nom d'un collègue : le sélecteur
  de nom est une signature déclarative.

## Charte graphique

Reprise du portail SONES : navy `#0A2F73` / `#0A1F44`, orange `#E64501`,
fond `#F5F7FB`, police Inter.

## Démarrage

```bash
npm install
npm run dev
```

L'application est servie sur http://localhost:3000. Pour que l'équipe y accède,
lancer `npm run build && npm start` sur un poste ou un serveur du réseau et
partager son adresse.
