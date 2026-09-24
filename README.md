# ISQM 1 — Feuille de route de conformité

Espace de travail partagé pour la mise en conformité à la norme **ISQM 1**
(IAASB) : les livrables du système de gestion de la qualité (SGQ), répartis
dans les **8 composantes** de la norme et présentés sous forme d'organigramme.
Chaque livrable est un dossier où l'on dépose le document produit et où
l'équipe laisse ses observations.

## Principe

- **En-tête** : titre, avancement global et dates clés (lancement, échéance
  finale, temps restant).
- **Arborescence** : racine « Système de gestion de la qualité » → 8 composantes
  → livrables.
- **Déverrouillage séquentiel.** Un seul livrable est ouvert à la fois : il
  clignote en orange. Les suivants restent grisés et non cliquables tant qu'il
  n'est pas validé.
- L'ordre de déverrouillage suit la **démarche de mise en œuvre** en 6 phases
  (et non la numérotation L1..L24) : Phase 1 gouvernance → Phase 2 risques →
  Phase 3 réponses → Phase 4 communication → Phase 5 suivi → Phase 6 évaluation
  annuelle.
- Chaque livrable porte une **échéance** calculée en jours ouvrés depuis le
  lancement du projet.

### Regroupement de livrables

La norme définit 24 livrables (L1 → L24), mais **L1, L2 et L3 sont réunis en un
document unique** — ce que la section 5 de la note technique autorise pour un
cabinet modeste : « Objectifs, risques et réponses regroupés dans un document
unique (L1, L2, L3) ». Il n'y a donc **qu'un seul fichier à joindre** pour les
trois, et **22 documents** à produire au total.

Ce livrable groupé porte le code `L1-L3`, ouvre la démarche, et traverse les
composantes 1 et 2 ainsi que les phases 1 et 2. Sa fiche détaille les trois
contenus que le document doit couvrir, pour qu'aucune exigence de la norme ne
se perde dans le regroupement.

Pour regrouper d'autres livrables, renseigner le champ `composition` dans
[`src/lib/isqm.ts`](src/lib/isqm.ts) et renuméroter les `step`. Le total
affiché partout vient de `TOTAL_LIVRABLES` : aucun nombre n'est écrit en dur
dans l'interface.

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

Un seul module, [`src/server/stockage.ts`](src/server/stockage.ts), avec deux
backends choisis automatiquement :

| Condition | Backend | Où vont les données |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` défini | Vercel Blob | store `isqm1-prive`, en accès **privé** |
| sinon | disque | `data/etat.json` et `data/fichiers/` |

`data/` n'est jamais versionné. Sur Blob, l'état vit dans `isqm1/etat.json` et
les livrables dans `isqm1/livrables/<code>/<identifiant>.<ext>`.

**Les fichiers déposés ne sont pas publics.** Le store est en accès privé :
une requête directe sur l'URL du blob renvoie `403`. Les documents ne
transitent que par le route handler de l'application, qui les relit côté
serveur avec le jeton du store.

Sur Blob, le navigateur **téléverse directement** vers le stockage, avec un
jeton à portée restreinte délivré par `/api/livrables/[code]/televersement` :
passer par le serveur plafonnerait le dépôt à quelques mégaoctets (limite de
taille du corps des requêtes serverless). Le serveur relit ensuite la taille et
le type réels du blob — les métadonnées annoncées par le client ne sont pas
prises pour argent comptant.

Les écritures concurrentes sont sérialisées par une file, et le fichier d'état
est écrit de façon atomique sur disque. La file ne couvre qu'une instance :
sur un hébergement qui en lance plusieurs, deux écritures simultanées restent
possibles et la dernière l'emporte.

## Déploiement

| | |
| --- | --- |
| Production | https://isqm1.vercel.app |
| Dépôt | https://github.com/mansoursow/ISQM1 |
| Projet Vercel | `mansour-sows-projects/isqm1` |
| Store Blob | `isqm1-prive` (région `iad1`, accès privé) |

Le dépôt GitHub est connecté au projet : **un `git push` sur `main` déclenche
un déploiement en production**. Un déploiement manuel se fait avec :

```bash
vercel --prod
```

Le store Blob est relié au projet, ce qui injecte `BLOB_READ_WRITE_TOKEN` dans
les trois environnements. En local, sans ce jeton, l'application retombe
automatiquement sur le disque — inutile de configurer quoi que ce soit pour
développer.

> Ne pas faire `vercel env pull` pour travailler en local : cela ramènerait le
> jeton de production et le poste écrirait dans le stockage partagé.

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
`debut`). Modifier `debut` décale automatiquement toutes les échéances et
l'échéance finale.

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/lib/isqm.ts` | Référentiel : composantes, phases, livrables, regroupements, échéances |
| `src/lib/membres.ts` | Annuaire des intervenants |
| `src/lib/collab.ts` | Types et formatages partagés serveur / navigateur |
| `src/lib/useCollab.ts` | État partagé côté client, mutations, rafraîchissement |
| `src/lib/assainir.ts` | Filtrage du HTML issu d'un document Word |
| `src/server/stockage.ts` | Persistance : façade et choix du backend |
| `src/server/backend-disque.ts` | Backend disque local |
| `src/server/backend-blob.ts` | Backend Vercel Blob (accès privé) |
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

L'application est servie sur http://localhost:3000, avec le stockage sur
disque. La version partagée par l'équipe est sur https://isqm1.vercel.app.
