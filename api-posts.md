# API Posts — Opportunités, Bons Plans & Ressources
## Connect Impact

Base URL : `https://api.connectimpact.org/v1`  
Authentification : `Authorization: Bearer <token>` (requis sur les routes admin et auteur)

> Ce document couvre les trois espaces de publication de la plateforme :
> - **Opportunités** — stages, emplois, formations, alternances
> - **Bons Plans** — réductions, outils gratuits, événements, ressources utiles
> - **Ressources** — guides, templates, liens utiles pour la communauté

---

## Table des matières

1. [Modèles de données](#1-modèles-de-données)
2. [Opportunités](#2-opportunités)
3. [Bons Plans](#3-bons-plans)
4. [Ressources](#4-ressources)
5. [Événements](#5-événements)
6. [Engagement commun (likes, sauvegardes)](#6-engagement-commun)
7. [Candidatures aux opportunités](#7-candidatures-aux-opportunités)
8. [Modération & admin](#8-modération--admin)
9. [Pagination standard](#9-pagination-standard)
10. [Codes d'erreur](#10-codes-derreur)

---

## 1. Modèles de données

### `Opportunity`

```ts
{
  id: string                         // UUID
  type: "Stage" | "Emploi" | "Formation" | "Alternance"
  title: string
  org: string                        // Nom de l'organisation
  logoUrl?: string                   // URL publique du logo
  location: string                   // ex: "Paris, France" | "En ligne"
  remote: boolean                    // Télétravail possible
  duration: string                   // ex: "6 mois", "CDI"
  salary?: string                    // ex: "Selon barème légal", "32 000 €/an"
  educationLevel?: string            // ex: "Bac +4/5", "Aucun prérequis"
  domain: "Tech" | "Social" | "Environnement" | "Management" | "Communication" | "Autre"
  description: string                // Texte long (HTML autorisé côté admin)
  whyApply: string[]                 // 2 à 5 raisons de postuler
  skills: {
    hard: string[]                   // Compétences techniques
    soft: string[]                   // Compétences humaines
  }
  externalUrl: string                // Lien vers l'offre source
  sourceName: string                 // ex: "LinkedIn", "Indeed", "Site Officiel"
  tags: string[]                     // ex: ["Nouveau", "Vérifié", "Gratuit", "Urgent"]
  featured: boolean                  // Mise en avant sur la page d'accueil
  status: "draft" | "published" | "archived" | "expired"
  saves: number                      // Nombre de sauvegardes
  views: number                      // Nombre de vues
  postedAt: string                   // ISO 8601 — date de publication sur la source
  expiresAt?: string                 // ISO 8601 — date d'expiration de l'offre
  createdAt: string                  // ISO 8601 — ajout en base
  updatedAt: string
  submittedBy?: {                    // Si soumis par un membre (pas l'admin)
    userId: string
    name: string
  }
}
```

---

### `BonPlan`

```ts
{
  id: string                         // UUID
  category: "Outil" | "Événement" | "Formation gratuite" | "Réduction" | "Bourse" | "Autre"
  title: string
  org?: string                       // Organisation proposant le bon plan
  logoUrl?: string
  description: string                // Texte court (max 500 chars)
  detailContent?: ContentBlock[]     // Contenu riche (même format que Blog)
  externalUrl: string                // Lien vers le bon plan
  tags: string[]                     // ex: ["Gratuit", "Limité", "En ligne"]
  domain?: string                    // Domaine concerné
  targetAudience?: string[]          // ex: ["Étudiants", "Jeunes pros", "Tous"]
  validFrom?: string                 // ISO 8601 — début de validité
  validUntil?: string                // ISO 8601 — fin de validité
  featured: boolean
  status: "draft" | "published" | "archived" | "expired"
  saves: number
  views: number
  likes: number
  createdAt: string
  updatedAt: string
  submittedBy?: {
    userId: string
    name: string
  }
}
```

---

### `Resource`

```ts
{
  id: string                         // UUID
  type: "Guide" | "Template" | "Lien utile" | "Vidéo" | "Podcast" | "Outil"
  title: string
  description: string
  externalUrl?: string               // Si ressource externe
  fileUrl?: string                   // Si fichier hébergé (PDF, DOCX…)
  fileSize?: number                  // Octets
  fileMimeType?: string              // "application/pdf", "application/docx"…
  tags: string[]
  domain?: string
  featured: boolean
  status: "draft" | "published" | "archived"
  downloads: number                  // Compteur de téléchargements (si fichier)
  views: number
  saves: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    avatarUrl?: string
    role?: string
  }
}
```

---

### `Event`

```ts
{
  id: string                         // UUID
  type: "Webinaire" | "Débat" | "Atelier" | "Formation en direct" | "Conférence" | "Networking"
  title: string
  description: string                // Résumé court
  content?: ContentBlock[]            // Contenu riche (optionnel)
  startAt: string                    // ISO 8601 — début de l'événement
  endAt: string                      // ISO 8601 — fin de l'événement
  timezone?: string                  // ex: "Europe/Paris"
  meetingUrl: string                 // URL Google Meet / Zoom / Teams
  capacity?: number                  // Limite de participants (-1 = illimité)
  registered: number                 // Nombre d'inscrits actuels
  domain?: string                    // Tech, Social, Environnement, etc.
  tags: string[]                     // ex: ["Gratuit", "En direct", "Débutant"]
  speakers: EventSpeaker[]           // Intervenants
  language?: string                  // "FR" | "EN" | "BILINGUAL"
  featured: boolean
  status: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled"
  views: number
  likes: number
  saves: number
  createdAt: string
  updatedAt: string
}
```

---

### `EventSpeaker`

```ts
{
  id: string                         // UUID
  name: string
  bio?: string
  role?: string                      // ex: "Directrice Générale, ONG Avenir"
  company?: string
  avatarUrl?: string
  linkedinUrl?: string
  order?: number                     // Pour trier les speakers
}
```

---

### `EventRegistration`

```ts
{
  id: string                         // UUID
  eventId: string
  userId?: string                    // Si membre authentifié (optionnel)
  email: string
  firstName: string
  lastName: string
  company?: string
  registeredAt: string               // ISO 8601
  status: "confirmed" | "cancelled"
  attendanceConfirmed?: boolean      // Rempli après l'événement
}
```

---

### `ContentBlock` (partagé avec Blog)

```ts
type ContentBlock =
  | { type: "text";    html: string }
  | { type: "image";   imageId: string; caption?: string; fullWidth?: boolean }
  | { type: "quote";   text: string; attribution?: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "cta";     label: string; url: string; style?: "primary" | "secondary" }
```

---

### `Pagination`

Toutes les listes renvoient :

```ts
{
  data: T[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}
```

---

## 2. Opportunités

### 2.1 Lister les opportunités

```
GET /opportunities
```

**Query params :**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | number | `1` | Page courante |
| `perPage` | number | `12` | Par page (max 50) |
| `type` | string | — | `Stage` \| `Emploi` \| `Formation` \| `Alternance` |
| `domain` | string | — | `Tech` \| `Social` \| `Environnement` \| `Management` \| `Communication` \| `Autre` |
| `location` | string | — | Recherche partielle (ex: `Paris`) |
| `remote` | boolean | — | `true` = télétravail uniquement |
| `q` | string | — | Recherche fulltext (titre, org, description, compétences) |
| `featured` | boolean | — | `true` = uniquement les mises en avant |
| `status` | string | `published` | `published` \| `draft` \| `all` *(admin)* |
| `sort` | string | `postedAt:desc` | `postedAt:desc/asc` \| `views:desc` \| `saves:desc` |
| `tags` | string | — | Tag exact (ex: `Vérifié`) |

> La liste ne retourne pas `description`, `whyApply`, `skills` ni `detailContent`. Ces champs sont renvoyés uniquement sur le détail.

**Réponse 200 :**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "Stage",
      "title": "Chef de projet digital",
      "org": "ONG Avenir Connecté",
      "logoUrl": "https://cdn.connectimpact.org/logos/ong-avenir.webp",
      "location": "Paris, France",
      "remote": false,
      "duration": "6 mois",
      "salary": "Selon barème légal",
      "educationLevel": "Bac +4/5",
      "domain": "Tech",
      "tags": ["Nouveau", "Vérifié"],
      "featured": true,
      "saves": 23,
      "views": 412,
      "postedAt": "2026-03-25T00:00:00Z",
      "expiresAt": "2026-05-01T00:00:00Z"
    }
  ],
  "meta": { "total": 48, "page": 1, "perPage": 12, "totalPages": 4 }
}
```

---

### 2.2 Récupérer une opportunité complète

```
GET /opportunities/:id
```

Retourne l'objet `Opportunity` complet avec `description`, `whyApply`, `skills`.  
Incrémente automatiquement `views`.

**Réponse 200 :** objet `Opportunity` complet.

---

### 2.3 Créer une opportunité *(admin)*

```
POST /opportunities
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "type": "Emploi",
  "title": "Coordinateur RSE",
  "org": "EcoVibe",
  "logoUrl": "https://cdn.connectimpact.org/logos/ecovibe.webp",
  "location": "Lyon, France",
  "remote": true,
  "duration": "CDI",
  "salary": "34 000 €/an",
  "educationLevel": "Bac +3 minimum",
  "domain": "Environnement",
  "description": "Vous coordonnerez la mise en place de la stratégie RSE...",
  "whyApply": [
    "Mission à fort impact écologique",
    "Télétravail 3j/semaine",
    "Perspectives d'évolution rapides"
  ],
  "skills": {
    "hard": ["Normes ISO", "Bilan Carbone", "Reporting RSE"],
    "soft": ["Conviction", "Pédagogie", "Adaptabilité"]
  },
  "externalUrl": "https://linkedin.com/jobs/view/xxx",
  "sourceName": "LinkedIn",
  "tags": ["Nouveau"],
  "featured": false,
  "status": "published",
  "postedAt": "2026-04-09T00:00:00Z",
  "expiresAt": "2026-06-01T00:00:00Z"
}
```

**Réponse 201 :** objet `Opportunity` complet.

---

### 2.4 Modifier une opportunité *(admin)*

```
PATCH /opportunities/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Body : même structure que POST, tous les champs sont optionnels.

**Réponse 200 :** objet `Opportunity` mis à jour.

---

### 2.5 Supprimer une opportunité *(admin)*

```
DELETE /opportunities/:id
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
{ "deletedId": "uuid" }
```

---

### 2.6 Soumettre une opportunité *(membre authentifié)*

Un membre peut proposer une opportunité. Elle entre en statut `draft` jusqu'à validation admin.

```
POST /opportunities/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :** même structure que POST `/opportunities`, sans `status`, `featured`, ni `tags`.

**Réponse 201 :**

```json
{
  "id": "uuid",
  "status": "draft",
  "message": "Votre opportunité a été soumise et sera examinée sous 48h."
}
```

---

### 2.7 Lister les opportunités en attente de validation *(admin)*

```
GET /opportunities?status=draft
Authorization: Bearer <token>
```

---

### 2.8 Valider / Rejeter une soumission *(admin)*

```
PATCH /opportunities/:id/review
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "action": "approve",
  "tags": ["Vérifié"],
  "featured": false
}
```

ou

```json
{
  "action": "reject",
  "reason": "L'offre n'est plus disponible sur la source."
}
```

**Réponse 200 :** objet `Opportunity` mis à jour.

---

## 3. Bons Plans

### 3.1 Lister les bons plans

```
GET /bonplans
```

**Query params :**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | number | `1` | Page courante |
| `perPage` | number | `12` | Par page (max 50) |
| `category` | string | — | `Outil` \| `Événement` \| `Formation gratuite` \| `Réduction` \| `Bourse` \| `Autre` |
| `domain` | string | — | Filtrer par domaine |
| `q` | string | — | Recherche fulltext (titre, org, description) |
| `featured` | boolean | — | Uniquement mis en avant |
| `valid` | boolean | — | `true` = uniquement les bons plans encore valides (non expirés) |
| `status` | string | `published` | `published` \| `draft` \| `all` *(admin)* |
| `sort` | string | `createdAt:desc` | `createdAt:desc/asc` \| `likes:desc` \| `saves:desc` |

**Réponse 200 :**

```json
{
  "data": [
    {
      "id": "uuid",
      "category": "Formation gratuite",
      "title": "Bootcamp IA pour les associations — 100% gratuit",
      "org": "DataForGood",
      "logoUrl": "https://cdn.connectimpact.org/logos/dfg.webp",
      "description": "3 semaines pour maîtriser l'IA appliquée aux projets sociaux.",
      "externalUrl": "https://dataforgood.fr/bootcamp",
      "tags": ["Gratuit", "En ligne", "Limité"],
      "domain": "Tech",
      "targetAudience": ["Tous"],
      "validFrom": "2026-04-15T00:00:00Z",
      "validUntil": "2026-05-15T00:00:00Z",
      "featured": true,
      "saves": 87,
      "views": 1340,
      "likes": 142
    }
  ],
  "meta": { "total": 31, "page": 1, "perPage": 12, "totalPages": 3 }
}
```

---

### 3.2 Récupérer un bon plan complet

```
GET /bonplans/:id
```

Retourne l'objet `BonPlan` complet avec `detailContent[]` si renseigné.  
Incrémente automatiquement `views`.

**Réponse 200 :** objet `BonPlan` complet.

---

### 3.3 Créer un bon plan *(admin)*

```
POST /bonplans
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "category": "Réduction",
  "title": "-50% sur Notion pour les associations",
  "org": "Notion",
  "logoUrl": "https://cdn.connectimpact.org/logos/notion.webp",
  "description": "Notion offre 50% de réduction sur les plans Pro pour les associations à but non lucratif.",
  "detailContent": [
    { "type": "heading", "level": 2, "text": "Comment en bénéficier ?" },
    { "type": "text", "html": "<p>Il suffit de soumettre votre numéro SIRET...</p>" },
    { "type": "cta", "label": "Faire ma demande", "url": "https://notion.so/nonprofits", "style": "primary" }
  ],
  "externalUrl": "https://notion.so/nonprofits",
  "tags": ["Réduction", "Outil"],
  "domain": "Tech",
  "targetAudience": ["Associations", "ONG"],
  "validUntil": null,
  "featured": true,
  "status": "published"
}
```

**Réponse 201 :** objet `BonPlan` complet.

---

### 3.4 Modifier un bon plan *(admin)*

```
PATCH /bonplans/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Body : même structure que POST, tous champs optionnels.

**Réponse 200 :** objet `BonPlan` mis à jour.

---

### 3.5 Supprimer un bon plan *(admin)*

```
DELETE /bonplans/:id
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
{ "deletedId": "uuid" }
```

---

### 3.6 Soumettre un bon plan *(membre authentifié)*

```
POST /bonplans/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :** même structure que POST `/bonplans`, sans `status`, `featured`.

**Réponse 201 :**

```json
{
  "id": "uuid",
  "status": "draft",
  "message": "Votre bon plan a été soumis et sera examiné sous 48h."
}
```

---

### 3.7 Valider / Rejeter un bon plan soumis *(admin)*

```
PATCH /bonplans/:id/review
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{ "action": "approve", "tags": ["Vérifié"], "featured": false }
```

ou

```json
{ "action": "reject", "reason": "Lien invalide ou bon plan expiré." }
```

**Réponse 200 :** objet `BonPlan` mis à jour.

---

## 4. Ressources

### 4.1 Lister les ressources

```
GET /resources
```

**Query params :**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | number | `1` | Page courante |
| `perPage` | number | `12` | Par page (max 50) |
| `type` | string | — | `Guide` \| `Template` \| `Lien utile` \| `Vidéo` \| `Podcast` \| `Outil` |
| `domain` | string | — | Filtrer par domaine |
| `q` | string | — | Recherche fulltext |
| `featured` | boolean | — | Uniquement mis en avant |
| `status` | string | `published` | `published` \| `draft` \| `all` *(admin)* |
| `sort` | string | `createdAt:desc` | `createdAt:desc/asc` \| `downloads:desc` \| `views:desc` \| `saves:desc` |

**Réponse 200 :**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "Template",
      "title": "Modèle de lettre de motivation pour une ONG",
      "description": "Un template Word prêt à l'emploi adapté aux candidatures dans le secteur associatif.",
      "fileUrl": "https://cdn.connectimpact.org/resources/lettre-ong.docx",
      "fileSize": 48200,
      "fileMimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "tags": ["Template", "Candidature"],
      "domain": "Social",
      "featured": false,
      "downloads": 312,
      "views": 890,
      "saves": 156,
      "author": { "id": "uuid", "name": "Fatou Ndiaye", "avatarUrl": "..." },
      "createdAt": "2026-03-10T00:00:00Z"
    }
  ],
  "meta": { "total": 24, "page": 1, "perPage": 12, "totalPages": 2 }
}
```

---

### 4.2 Récupérer une ressource complète

```
GET /resources/:id
```

Incrémente automatiquement `views`.

**Réponse 200 :** objet `Resource` complet.

---

### 4.3 Télécharger un fichier

```
GET /resources/:id/download
```

Incrémente `downloads`. Retourne un redirect 302 vers l'URL du fichier sur le CDN.

**Réponse 302 :** `Location: https://cdn.connectimpact.org/resources/...`

---

### 4.4 Créer une ressource *(admin)*

```
POST /resources
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form fields :**

| Champ | Requis | Description |
|-------|--------|-------------|
| `type` | oui | Type de ressource |
| `title` | oui | Titre |
| `description` | oui | Description courte |
| `file` | non | Fichier à héberger (max 20 Mo) |
| `externalUrl` | non | URL externe (si pas de fichier) |
| `tags` | non | JSON array ex: `["Template","RH"]` |
| `domain` | non | Domaine |
| `featured` | non | `true` \| `false` |
| `status` | non | `draft` \| `published` |
| `authorId` | non | UUID auteur (par défaut : admin connecté) |

**Réponse 201 :** objet `Resource` complet.

---

### 4.5 Modifier une ressource *(admin)*

```
PATCH /resources/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data ou application/json
```

**Réponse 200 :** objet `Resource` mis à jour.

---

### 4.6 Supprimer une ressource *(admin)*

```
DELETE /resources/:id
Authorization: Bearer <token>
```

Supprime l'objet en base et le fichier associé sur le CDN si applicable.

**Réponse 200 :**

```json
{ "deletedId": "uuid", "fileDeleted": true }
```

---

## 5. Événements

### 5.1 Lister les événements

```
GET /events
```

**Query params :**

| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | number | `1` | Page courante |
| `perPage` | number | `12` | Par page (max 50) |
| `type` | string | — | `Webinaire` \| `Débat` \| `Atelier` \| `Formation en direct` \| `Conférence` \| `Networking` |
| `domain` | string | — | Filtrer par domaine |
| `q` | string | — | Recherche fulltext (titre, description, speakers) |
| `status` | string | `upcoming,ongoing` | `upcoming` \| `ongoing` \| `completed` \| `cancelled` \| `draft` *(admin)* |
| `featured` | boolean | — | Uniquement mis en avant |
| `sort` | string | `startAt:asc` | `startAt:asc/desc` \| `registrations:desc` \| `views:desc` |
| `from` | string | — | ISO 8601 — date début (ex: `2026-04-15`) |
| `to` | string | — | ISO 8601 — date fin (ex: `2026-05-15`) |

**Réponse 200 :**

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "Webinaire",
      "title": "5 erreurs à éviter en candidature ESS",
      "description": "Débat interactif avec recruteurs et candidats accomplis.",
      "startAt": "2026-04-15T18:00:00Z",
      "endAt": "2026-04-15T19:30:00Z",
      "timezone": "Europe/Paris",
      "meetingUrl": "https://meet.google.com/xxx-yyyy-zzzz",
      "capacity": 300,
      "registered": 124,
      "speakers": [
        {
          "id": "uuid",
          "name": "Amara Diallo",
          "role": "Directrice RH, ONG Avenir",
          "avatarUrl": "https://cdn.connectimpact.org/avatars/amara.webp",
          "order": 1
        }
      ],
      "tags": ["Gratuit", "En direct", "Débat"],
      "featured": true,
      "status": "upcoming",
      "views": 340,
      "likes": 45,
      "saves": 78,
      "language": "FR"
    }
  ],
  "meta": { "total": 12, "page": 1, "perPage": 12, "totalPages": 1 }
}
```

---

### 5.2 Récupérer un événement complet

```
GET /events/:id
```

Retourne l'objet `Event` complet avec `content[]`, `speakers[]`, `recordings` si disponibles.  
Incrémente automatiquement `views`.

**Réponse 200 :** objet `Event` complet.

---

### 5.3 Créer un événement *(admin)*

```
POST /events
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "type": "Webinaire",
  "title": "Financer son projet social — Les nouveaux dispositifs 2026",
  "description": "Un webinaire de 90 minutes pour découvrir les aides et subventions destinées aux projets à impact.",
  "content": [
    { "type": "heading", "level": 2, "text": "Programme" },
    { "type": "text", "html": "<p>18h00 — Introduction par Fatou Ndiaye</p><p>18h10 — Présentation des dispositifs</p>" },
    { "type": "heading", "level": 2, "text": "Pour qui ?" },
    { "type": "text", "html": "<p>Entrepreneurs sociaux, associations, collectifs en phase de création ou développement." }
  ],
  "startAt": "2026-04-22T18:00:00Z",
  "endAt": "2026-04-22T19:30:00Z",
  "timezone": "Europe/Paris",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "capacity": 500,
  "speakers": [
    {
      "name": "Fatou Ndiaye",
      "role": "Responsable financements, Réseau ESS",
      "company": "Réseau ESS France",
      "linkedinUrl": "https://linkedin.com/in/fatoudioallo",
      "order": 1
    },
    {
      "name": "Kofi Mensah",
      "role": "Fondateur",
      "company": "EcoTech Solutions",
      "order": 2
    }
  ],
  "domain": "Social",
  "tags": ["Gratuit", "Webinaire", "Financement"],
  "language": "FR",
  "featured": true,
  "status": "draft"
}
```

**Réponse 201 :** objet `Event` complet.

---

### 5.4 Modifier un événement *(admin)*

```
PATCH /events/:id
Authorization: Bearer <token>
Content-Type: application/json
```

Body : même structure que POST, tous champs optionnels.

Cas spécial : passer le `status` à `cancelled` déclenche automatiquement une notification aux inscrits.

**Réponse 200 :** objet `Event` mis à jour.

---

### 5.5 Supprimer un événement *(admin)*

```
DELETE /events/:id
Authorization: Bearer <token>
```

Supprime l'événement et ses inscriptions associées.

**Réponse 200 :**

```json
{ "deletedId": "uuid" }
```

---

### 5.6 S'inscrire à un événement

```
POST /events/:id/register
Content-Type: application/json
```

> Peut être appelé sans authentification (inscription ouverte).

**Body :**

```json
{
  "email": "jean@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "company": "My Org"
}
```

ou avec authentification (le `userId` est pris depuis le token) :

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "company": "My Org"
}
```

**Réponse 201 :**

```json
{
  "registrationId": "uuid",
  "status": "confirmed",
  "message": "Inscription confirmée. Un lien de connexion a été envoyé à jean@example.com"
}
```

---

### 5.7 Annuler une inscription

```
POST /events/:id/unregister
Content-Type: application/json
```

**Body :**

```json
{
  "registrationId": "uuid"
}
```

ou via token :

```
POST /events/:id/unregister
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
{ "cancelled": true }
```

---

### 5.8 Lister les inscriptions d'un événement *(admin)*

```
GET /events/:id/registrations
Authorization: Bearer <token>
```

**Query params :** `status` (`confirmed` | `cancelled`), `page`, `perPage`

**Réponse 200 :**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "jean@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "company": "My Org",
      "registeredAt": "2026-04-12T10:30:00Z",
      "status": "confirmed",
      "attendanceConfirmed": false
    }
  ],
  "meta": { "total": 124, "page": 1, "perPage": 50, "totalPages": 3 }
}
```

---

### 5.9 Confirmer la présence *(admin)*

Après l'événement, marquer les participants présents :

```
PATCH /events/:id/attendance
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "registrationIds": ["uuid-1", "uuid-2", "uuid-3"],
  "attended": true
}
```

**Réponse 200 :**

```json
{ "updated": 3, "message": "Présence confirmée pour 3 participants." }
```

---

### 5.10 Récupérer les événements d'un utilisateur

```
GET /me/events
Authorization: Bearer <token>
```

**Query params :** `status` (`registered` | `attended`), `page`, `perPage`

**Réponse 200 :**

```json
{
  "data": [
    {
      "event": {
        "id": "uuid",
        "title": "Financer son projet social",
        "startAt": "2026-04-22T18:00:00Z"
      },
      "registrationId": "uuid",
      "status": "confirmed",
      "attendanceConfirmed": false,
      "registeredAt": "2026-04-12T10:30:00Z"
    }
  ]
}
```

---

### 5.11 Statistiques d'un événement *(admin)*

```
GET /events/:id/stats
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
{
  "views": 450,
  "saves": 87,
  "likes": 142,
  "registrations": 124,
  "attended": 89,
  "cancellations": 8,
  "peakRegistrationTime": "2026-04-15T10:30:00Z",
  "registrationOverTime": [
    { "date": "2026-04-12", "count": 23 },
    { "date": "2026-04-13", "count": 34 }
  ]
}
```

---

## 6. Engagement commun

Les trois espaces (Opportunités, Bons Plans, Ressources) partagent des actions d'engagement identiques.

### 6.1 Sauvegarder / Retirer des favoris

```
POST /:resource/:id/saves
```

Bascule la sauvegarde (idempotent). Identification via token ou cookie de session.

`:resource` = `opportunities` | `bonplans` | `resources` | `events`

**Réponse 200 :**

```json
{ "saves": 24, "saved": true }
```

---

### 6.2 Liker / Unliker *(Bons Plans, Ressources et Événements)*

```
POST /bonplans/:id/likes
POST /resources/:id/likes
POST /events/:id/likes
```

Bascule le like (idempotent).

**Réponse 200 :**

```json
{ "likes": 143, "liked": true }
```

---

### 6.3 Récupérer les sauvegardes d'un utilisateur

```
GET /me/saves
Authorization: Bearer <token>
```

**Query params :** `type` (`opportunity` | `bonplan` | `resource`), `page`, `perPage`

**Réponse 200 :**

```json
{
  "data": [
    {
      "type": "opportunity",
      "item": { /* objet Opportunity résumé */ },
      "savedAt": "2026-04-05T14:22:00Z"
    }
  ],
  "meta": { "total": 7, "page": 1, "perPage": 12, "totalPages": 1 }
}
```

---

## 7. Candidatures aux opportunités

> Cette section couvre les candidatures **internes** à Connect Impact (hors lien externe). Elle est optionnelle si toutes les offres redirigent vers une source externe.

### 7.1 Postuler à une opportunité *(membre authentifié)*

```
POST /opportunities/:id/apply
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**

```json
{
  "coverLetter": "Bonjour, je suis très intéressé par cette offre car...",
  "cvUrl": "https://cdn.connectimpact.org/cvs/user-uuid-cv.pdf",
  "linkedinUrl": "https://linkedin.com/in/mon-profil",
  "availableFrom": "2026-06-01"
}
```

**Réponse 201 :**

```json
{
  "applicationId": "uuid",
  "status": "pending",
  "message": "Votre candidature a bien été envoyée."
}
```

---

### 7.2 Lister les candidatures d'un utilisateur

```
GET /me/applications
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
{
  "data": [
    {
      "applicationId": "uuid",
      "opportunity": {
        "id": "uuid",
        "title": "Chef de projet digital",
        "org": "ONG Avenir Connecté"
      },
      "status": "pending" | "reviewed" | "accepted" | "rejected",
      "appliedAt": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

### 7.3 Lister toutes les candidatures *(admin)*

```
GET /applications
Authorization: Bearer <token>
```

**Query params :** `opportunityId`, `status`, `page`, `perPage`

---

## 8. Modération & admin

### 8.1 Lister les contenus en attente de validation

```
GET /admin/pending
Authorization: Bearer <token>
```

**Query params :** `type` (`opportunity` | `bonplan`), `page`, `perPage`

**Réponse 200 :**

```json
{
  "data": [
    {
      "type": "opportunity",
      "id": "uuid",
      "title": "Chargé de mission numérique",
      "submittedBy": { "userId": "uuid", "name": "Kofi Mensah" },
      "createdAt": "2026-04-08T09:30:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "perPage": 20, "totalPages": 1 }
}
```

---

### 8.2 Marquer un contenu comme expiré *(admin ou automatique)*

```
PATCH /opportunities/:id
PATCH /bonplans/:id
Body: { "status": "expired" }
```

> Le serveur peut également déclencher l'expiration automatiquement si `expiresAt` ou `validUntil` est dépassé.

---

### 8.3 Statistiques d'un contenu *(admin)*

```
GET /opportunities/:id/stats
GET /bonplans/:id/stats
GET /resources/:id/stats
Authorization: Bearer <token>
```

**Réponse 200 :**

```json
{
  "views": 1240,
  "saves": 87,
  "likes": 142,
  "applications": 34,
  "viewsOverTime": [
    { "date": "2026-04-01", "count": 120 },
    { "date": "2026-04-02", "count": 95 }
  ]
}
```

---

## 9. Pagination standard

Toutes les listes renvoient un objet avec `data` et `meta` :

```json
{
  "data": [],
  "meta": {
    "total": 48,
    "page": 1,
    "perPage": 12,
    "totalPages": 4
  }
}
```

---

## 10. Codes d'erreur

| Code | Signification |
|------|--------------|
| `400` | Données invalides (body malformé, champ manquant ou invalide) |
| `401` | Token absent ou expiré |
| `403` | Permissions insuffisantes (ex: non admin, non auteur) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex: candidature déjà soumise pour cette offre) |
| `410` | Contenu expiré (offre ou bon plan périmé) |
| `413` | Fichier trop lourd (> 20 Mo pour ressources, > 5 Mo pour logos) |
| `422` | Format non supporté |
| `429` | Trop de requêtes (rate limiting) |
| `500` | Erreur serveur interne |

**Format d'erreur standard :**

```json
{
  "error": {
    "code": "OPPORTUNITY_EXPIRED",
    "message": "Cette opportunité a expiré et n'accepte plus de candidatures."
  }
}
```

---

## Annexe — Récapitulatif des endpoints

### Opportunités

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/opportunities` | Non | Lister (filtres, recherche, pagination) |
| `GET` | `/opportunities/:id` | Non | Détail complet |
| `POST` | `/opportunities` | Admin | Créer |
| `PATCH` | `/opportunities/:id` | Admin | Modifier |
| `DELETE` | `/opportunities/:id` | Admin | Supprimer |
| `POST` | `/opportunities/submit` | Membre | Soumettre pour validation |
| `PATCH` | `/opportunities/:id/review` | Admin | Approuver / Rejeter |
| `POST` | `/opportunities/:id/apply` | Membre | Candidater (interne) |
| `POST` | `/opportunities/:id/saves` | Membre | Sauvegarder / Retirer |
| `GET` | `/opportunities/:id/stats` | Admin | Statistiques |

### Bons Plans

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/bonplans` | Non | Lister |
| `GET` | `/bonplans/:id` | Non | Détail complet |
| `POST` | `/bonplans` | Admin | Créer |
| `PATCH` | `/bonplans/:id` | Admin | Modifier |
| `DELETE` | `/bonplans/:id` | Admin | Supprimer |
| `POST` | `/bonplans/submit` | Membre | Soumettre pour validation |
| `PATCH` | `/bonplans/:id/review` | Admin | Approuver / Rejeter |
| `POST` | `/bonplans/:id/likes` | Optionnel | Liker / Unliker |
| `POST` | `/bonplans/:id/saves` | Membre | Sauvegarder / Retirer |
| `GET` | `/bonplans/:id/stats` | Admin | Statistiques |

### Ressources

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/resources` | Non | Lister |
| `GET` | `/resources/:id` | Non | Détail complet |
| `GET` | `/resources/:id/download` | Non | Télécharger (redirect CDN) |
| `POST` | `/resources` | Admin | Créer (multipart) |
| `PATCH` | `/resources/:id` | Admin | Modifier |
| `DELETE` | `/resources/:id` | Admin | Supprimer + CDN |
| `POST` | `/resources/:id/likes` | Optionnel | Liker / Unliker |
| `POST` | `/resources/:id/saves` | Membre | Sauvegarder / Retirer |
| `GET` | `/resources/:id/stats` | Admin | Statistiques |

### Événements

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/events` | Non | Lister (filtres, pagination) |
| `GET` | `/events/:id` | Non | Détail complet |
| `POST` | `/events` | Admin | Créer |
| `PATCH` | `/events/:id` | Admin | Modifier |
| `DELETE` | `/events/:id` | Admin | Supprimer |
| `POST` | `/events/:id/register` | Non | S'inscrire |
| `POST` | `/events/:id/unregister` | Non/Member | Annuler inscription |
| `GET` | `/events/:id/registrations` | Admin | Lister inscriptions |
| `PATCH` | `/events/:id/attendance` | Admin | Confirmer présence |
| `POST` | `/events/:id/likes` | Optionnel | Liker / Unliker |
| `POST` | `/events/:id/saves` | Membre | Sauvegarder / Retirer |
| `GET` | `/events/:id/stats` | Admin | Statistiques |

### Utilisateur connecté

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/me/saves` | Membre | Mes sauvegardes (toutes catégories) |
| `GET` | `/me/applications` | Membre | Mes candidatures |
| `GET` | `/me/events` | Membre | Mes événements inscrits |

### Admin — Modération

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/admin/pending` | Admin | Contenus en attente de validation |

---

*Document généré pour Connect Impact v2 — Dernière mise à jour : 2026-04-09*
