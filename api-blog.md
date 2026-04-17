# API Blog — Connect Impact

Base URL : `https://api.connectimpact.org/v1`  
Authentification : `Authorization: Bearer <token>` (requis sur les routes admin)

---

## Modèles de données

### `BlogPost`
```ts
{
  id: string                  // UUID
  slug: string                // URL-friendly, ex: "conseils-entretien-ong"
  title: string
  excerpt: string             // Résumé court (max 300 chars)
  content: ContentBlock[]     // Corps de l'article — tableau de blocs ordonnés
  coverImage: BlogImage       // Image principale (thumbnail de la carte)
  images: BlogImage[]         // Toutes les images du corps, ordonnées (order 1, 2, 3…)
  author: BlogAuthor
  category: string
  tags: string[]
  status: "draft" | "published" | "archived"
  views: number
  likes: number
  commentsCount: number
  readTime: string            // ex: "6 min" — calculé automatiquement côté serveur
  publishedAt: string | null  // ISO 8601
  createdAt: string
  updatedAt: string
}
```

---

### `ContentBlock`

Le corps d'un article est un **tableau de blocs**. Chaque bloc a un `type` et ses propres champs. Cela permet d'alterner librement texte et images.

```ts
type ContentBlock =
  | { type: "text";    html: string }
  | { type: "image";   imageId: string; caption?: string; fullWidth?: boolean }
  | { type: "quote";   text: string; attribution?: string }
  | { type: "heading"; level: 2 | 3; text: string }
```

**Exemple de contenu avec images intercalées :**
```json
"content": [
  { "type": "heading", "level": 2, "text": "Introduction" },
  { "type": "text",    "html": "<p>Travailler pour une ONG demande...</p>" },
  { "type": "image",   "imageId": "img-uuid-1", "caption": "Réunion d'équipe à Paris" },
  { "type": "text",    "html": "<p>Après cette photo, voici les 5 conseils...</p>" },
  { "type": "quote",   "text": "L'engagement doit se lire dans chaque expérience.", "attribution": "Amara Diallo" },
  { "type": "text",    "html": "<p>Voyons maintenant les erreurs à éviter...</p>" },
  { "type": "image",   "imageId": "img-uuid-2", "caption": "Exemple de CV à impact", "fullWidth": true },
  { "type": "text",    "html": "<p>Conclusion...</p>" }
]
```

---

### `BlogImage`

```ts
{
  id: string
  url: string                 // URL publique CDN
  alt: string                 // Texte alternatif (obligatoire)
  caption?: string            // Légende affichée sous l'image
  width: number               // px
  height: number              // px
  size: number                // octets
  mimeType: string            // "image/webp" | "image/jpeg" | "image/png"
  order: number               // 1 = première image du corps, 2 = deuxième, etc.
  createdAt: string
}
```

#### Règle d'identification des images

| Champ | Rôle |
|-------|------|
| `coverImage` | Image de couverture (thumbnail carte + en-tête article). N'a pas de `order`. |
| `images[0]` → `order: 1` | Première image dans le corps de l'article |
| `images[1]` → `order: 2` | Deuxième image dans le corps de l'article |
| `images[n]` → `order: n+1` | …et ainsi de suite |

La correspondance entre un `ContentBlock { type: "image", imageId }` et son objet `BlogImage` se fait via `imageId === BlogImage.id`.

---

### `BlogAuthor`
```ts
{
  id: string
  name: string
  bio?: string
  avatarUrl?: string
  role?: string               // ex: "Rédactrice en chef"
}
```

---

### `BlogComment`
```ts
{
  id: string
  postId: string
  author: {
    name: string
    avatarUrl?: string
    userId?: string
  }
  content: string
  likes: number
  parentId: string | null     // null = commentaire racine
  replies: BlogComment[]      // Réponses imbriquées (1 niveau de profondeur)
  createdAt: string
}
```

---

### `Pagination`
Toutes les listes renvoient :
```ts
{
  data: T[]
  meta: { total: number; page: number; perPage: number; totalPages: number }
}
```

---

## Articles

### Lister les articles
```
GET /blog
```
**Query params :**
| Param | Type | Défaut | Description |
|-------|------|--------|-------------|
| `page` | number | 1 | Page courante |
| `perPage` | number | 12 | Articles par page (max 50) |
| `category` | string | — | Filtrer par catégorie |
| `tag` | string | — | Filtrer par tag |
| `q` | string | — | Recherche fulltext (titre + excerpt) |
| `status` | string | `published` | `published` \| `draft` \| `all` (admin) |
| `sort` | string | `publishedAt:desc` | `publishedAt:desc/asc`, `views:desc`, `likes:desc` |

> La liste ne retourne **pas** `content[]` ni `images[]` pour des raisons de performance. Seuls `coverImage` et les métadonnées sont inclus.

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "conseils-entretien-ong",
      "title": "5 conseils pour réussir votre entretien dans une ONG",
      "excerpt": "...",
      "coverImage": { "id": "uuid", "url": "https://cdn.../cover.webp", "alt": "...", "width": 1200, "height": 750 },
      "author": { "id": "uuid", "name": "Amara Diallo", "avatarUrl": "..." },
      "category": "Conseils",
      "tags": ["entretien", "ONG"],
      "readTime": "6 min",
      "views": 1240,
      "likes": 85,
      "commentsCount": 12,
      "publishedAt": "2026-03-25T10:00:00Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "perPage": 12, "totalPages": 4 }
}
```

---

### Récupérer un article complet
```
GET /blog/:id
GET /blog/slug/:slug
```

Retourne le `BlogPost` complet : `content[]` (tous les blocs), `images[]` (ordonnées), `coverImage`, et les 10 premiers commentaires racines avec leurs `replies`.

> Incrémente automatiquement `views` côté serveur.

**Réponse 200 :**
```json
{
  "id": "uuid",
  "slug": "conseils-entretien-ong",
  "title": "5 conseils pour réussir votre entretien dans une ONG",
  "coverImage": { "id": "cov-uuid", "url": "https://cdn.../cover.webp", "alt": "...", "width": 1200, "height": 750 },
  "images": [
    { "id": "img-uuid-1", "url": "https://cdn.../img1.webp", "alt": "Réunion", "order": 1, "caption": "Réunion d'équipe à Paris" },
    { "id": "img-uuid-2", "url": "https://cdn.../img2.webp", "alt": "CV", "order": 2, "caption": "Exemple de CV à impact" }
  ],
  "content": [
    { "type": "heading", "level": 2, "text": "Introduction" },
    { "type": "text",    "html": "<p>Travailler pour une ONG...</p>" },
    { "type": "image",   "imageId": "img-uuid-1", "caption": "Réunion d'équipe à Paris" },
    { "type": "text",    "html": "<p>Voici les 5 conseils...</p>" },
    { "type": "image",   "imageId": "img-uuid-2", "caption": "Exemple de CV à impact", "fullWidth": true }
  ],
  "author": { "id": "uuid", "name": "Amara Diallo" },
  "views": 1241,
  "likes": 85,
  "commentsCount": 12,
  "publishedAt": "2026-03-25T10:00:00Z"
}
```

---

### Créer un article *(admin)*
```
POST /blog
Authorization: Bearer <token>
Content-Type: application/json
```
**Body :**
```json
{
  "title": "Mon nouvel article",
  "slug": "mon-nouvel-article",
  "excerpt": "Résumé court...",
  "content": [
    { "type": "heading", "level": 2, "text": "Introduction" },
    { "type": "text",    "html": "<p>Premier paragraphe...</p>" },
    { "type": "image",   "imageId": "img-uuid-1", "caption": "Légende de la première image" },
    { "type": "text",    "html": "<p>Texte après la première image...</p>" },
    { "type": "image",   "imageId": "img-uuid-2" }
  ],
  "coverImageId": "cov-uuid",
  "authorId": "uuid",
  "category": "Analyse",
  "tags": ["ia", "impact"],
  "status": "draft",
  "publishedAt": "2026-04-15T09:00:00Z"
}
```

> Les images doivent être **uploadées au préalable** (voir section Images). On passe uniquement leurs `id` dans `content[]` et `coverImageId`. Le serveur calcule automatiquement `images[]` (ordonnées) et `readTime`.

**Réponse 201 :** objet `BlogPost` complet.

---

### Modifier un article *(admin)*
```
PATCH /blog/:id
Authorization: Bearer <token>
Content-Type: application/json
```
Body : même structure que POST, tous les champs sont optionnels. Envoyer uniquement ce qui change.

**Réponse 200 :** objet `BlogPost` mis à jour.

---

### ⚠️ Supprimer un article *(admin)*
```
DELETE /blog/:id
Authorization: Bearer <token>
```

Supprime l'article **et toutes les images associées** du CDN (cover + images du corps).  
Les commentaires sont également supprimés en cascade.

**Réponse 200 :**
```json
{
  "deleted": {
    "postId": "uuid",
    "imagesDeleted": 3,
    "commentsDeleted": 12
  }
}
```

---

## Images

### Upload d'une image *(admin)*
```
POST /blog/images
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Form fields :**
| Champ | Requis | Description |
|-------|--------|-------------|
| `file` | oui | Fichier image (jpg, png, webp — max 5 Mo) |
| `alt` | oui | Texte alternatif |
| `caption` | non | Légende affichée sous l'image |
| `postId` | non | Associer à un article existant |

> Le serveur convertit automatiquement en **WebP** et génère 3 résolutions : 400w, 800w, 1200w.

**Réponse 201 :**
```json
{
  "id": "img-uuid-1",
  "url": "https://cdn.connectimpact.org/blog/img-uuid-1.webp",
  "alt": "Réunion d'équipe",
  "caption": null,
  "width": 1200,
  "height": 750,
  "size": 142000,
  "mimeType": "image/webp"
}
```

---

### Upload de plusieurs images en une fois *(admin)*
```
POST /blog/images/batch
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Form fields :** `files[]` (max 10), `postId` (optionnel).

**Réponse 201 :**
```json
{
  "uploaded": [
    { "id": "img-uuid-1", "url": "..." },
    { "id": "img-uuid-2", "url": "..." }
  ],
  "failed": []
}
```

---

### Lister les images d'un article
```
GET /blog/:id/images
```
**Réponse 200 :** images du corps triées par `order` + la `coverImage` avec `order: 0`.

```json
[
  { "id": "cov-uuid",   "url": "...", "alt": "Cover", "order": 0, "caption": null },
  { "id": "img-uuid-1", "url": "...", "alt": "Réunion", "order": 1, "caption": "Réunion d'équipe" },
  { "id": "img-uuid-2", "url": "...", "alt": "CV",      "order": 2, "caption": null }
]
```

---

### Réordonner les images du corps *(admin)*
```
PATCH /blog/:id/images/order
Authorization: Bearer <token>
Content-Type: application/json
```
Passer les `id` dans le nouvel ordre voulu. La cover n'est pas concernée.

```json
{ "order": ["img-uuid-2", "img-uuid-1"] }
```

> Met à jour le champ `order` de chaque image ET réorganise les blocs `{ type: "image" }` dans `content[]` en conséquence.

**Réponse 200 :** tableau d'images avec `order` mis à jour.

---

### Supprimer une image *(admin)*
```
DELETE /blog/images/:imageId
Authorization: Bearer <token>
```
Supprime l'image du CDN et retire le bloc `{ type: "image", imageId }` correspondant dans le `content[]` de l'article.

**Réponse 200 :**
```json
{ "deletedImageId": "img-uuid-1", "contentBlockRemoved": true }
```

---

## Engagement

### Liker / Unliker un article
```
POST /blog/:id/likes
```
Bascule le like (idempotent). Identification via cookie de session ou token.

**Réponse 200 :**
```json
{ "likes": 86, "liked": true }
```

---

## Commentaires

### Lister les commentaires
```
GET /blog/:id/comments
```
**Query params :** `page` (défaut 1), `perPage` (défaut 20).

Les commentaires racines (`parentId: null`) sont retournés avec leurs `replies[]` imbriquées.

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "com-uuid-1",
      "author": { "name": "Jean Dupont", "avatarUrl": null },
      "content": "Super article, merci !",
      "likes": 3,
      "parentId": null,
      "replies": [
        {
          "id": "com-uuid-2",
          "author": { "name": "Amara Diallo", "avatarUrl": "..." },
          "content": "Merci Jean, avec plaisir !",
          "likes": 1,
          "parentId": "com-uuid-1",
          "replies": [],
          "createdAt": "2026-03-26T09:15:00Z"
        }
      ],
      "createdAt": "2026-03-26T08:00:00Z"
    }
  ],
  "meta": { "total": 12, "page": 1, "perPage": 20, "totalPages": 1 }
}
```

---

### Ajouter un commentaire
```
POST /blog/:id/comments
Content-Type: application/json
```
**Body :**
```json
{
  "content": "Super article, merci !",
  "parentId": null,
  "authorName": "Jean Dupont",
  "authorEmail": "jean@example.com"
}
```
Pour répondre à un commentaire existant, passer son `id` dans `parentId`.

**Réponse 201 :** objet `BlogComment` créé (sans `replies` car nouveau).

---

### Supprimer un commentaire *(admin ou auteur)*
```
DELETE /blog/:postId/comments/:commentId
Authorization: Bearer <token>
```
Si le commentaire a des `replies`, elles sont supprimées en cascade.

**Réponse 200 :**
```json
{ "deletedCommentId": "com-uuid-1", "repliesDeleted": 2 }
```

---

## Catégories

### Lister les catégories
```
GET /blog/categories
```
**Réponse 200 :**
```json
[
  { "name": "Conseils",    "slug": "conseils",    "count": 14 },
  { "name": "Témoignage",  "slug": "temoignage",  "count": 8  },
  { "name": "Analyse",     "slug": "analyse",     "count": 11 }
]
```

---

## Codes d'erreur

| Code | Signification |
|------|--------------|
| `400` | Données invalides (body malformé, champ manquant) |
| `401` | Token absent ou expiré |
| `403` | Permissions insuffisantes |
| `404` | Article / image / commentaire introuvable |
| `409` | Slug déjà utilisé |
| `413` | Fichier image trop lourd (> 5 Mo) |
| `422` | Format d'image non supporté |
| `500` | Erreur serveur |

**Format d'erreur standard :**
```json
{
  "error": {
    "code": "IMAGE_NOT_FOUND",
    "message": "L'image img-uuid-99 est introuvable ou n'appartient pas à cet article."
  }
}
```

---

## Notes d'intégration côté frontend

- **Rendu du contenu** : itérer sur `content[]` et switcher sur `block.type`. Pour `type: "image"`, chercher l'objet correspondant dans `images[]` par `images.find(img => img.id === block.imageId)` pour obtenir l'`url`, `alt` et `caption`.
- **Slug** : si non fourni à la création, le serveur le génère depuis le `title`.
- **Draft preview** : `GET /blog/:id?preview=true` avec token admin pour prévisualiser un brouillon sans incrémenter `views`.
- **Srcset** : l'`url` CDN supporte `?w=400`, `?w=800`, `?w=1200` pour les images responsives.
