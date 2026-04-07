# 🐳 Docker Setup Guide - Connect Impact Backend

## Quick Start

### 1. Démarrer les conteneurs
```bash
make docker-up
```

ou

```bash
docker-compose --env-file .env.docker up -d
```

Cela démarrera :
- **PostgreSQL** sur `localhost:5432`
- **API** sur `http://localhost:3000/api/v1`
- **Swagger** sur `http://localhost:3000/api/docs`

### 2. Générer le client Prisma
```bash
make prisma-generate
```

### 3. Appliquer les migrations
```bash
make prisma-migrate
```

---

## 🛠️ Commandes utiles

### Démarrage / Arrêt

```bash
# Démarrer les containers
make docker-up

# Arrêter les containers
make docker-down

# Voir les logs en temps réel
make docker-logs

# Logs de l'API uniquement
make docker-logs-api

# Logs de PostgreSQL uniquement
make docker-logs-postgres
```

### Database

```bash
# Accéder à psql dans le container
docker-compose exec postgres psql -U postgres -d connect_impact_db

# Réinitialiser la base de données
make db-reset

# Ouvrir Prisma Studio (interface graphique pour voir la BD)
make prisma-studio
```

### Mode Shell
```bash
# Accéder au shell du container API
docker-compose exec api sh
```

---

## 📂 Structure Docker

### `docker-compose.yml`
Configuration complète avec :
- Service PostgreSQL avec volumes persistants
- Service API avec rechargement automatique (hot reload)
- Health checks
- Network personnalisé
- Variables d'environnement

### `Dockerfile.dev`
Image pour le développement :
- Node 20 Alpine (léger)
- Rechargement automatique avec `pnpm start:dev`
- Port 3000 pour l'API
- Port 9229 pour le debugging Node

### `Dockerfile.prod`
Image optimisée pour la production :
- Build multi-stage
- Dépendances de production uniquement
- Taille minimale

### `.env.docker`
Variables d'environnement pour Docker

### `init.sql`
Script d'initialisation PostgreSQL

---

## 🔄 Flux de développement

### ✨ Avec Docker

```bash
# 1. Démarrer l'environnement
make docker-up

# 2. Les changements de code sont appliqués automatiquement (hot reload)
# Modifiez vos fichiers src/*.ts et regardez le rechargement en temps réel

# 3. Consultez les logs
make docker-logs-api

# 4. Accédez à l'API
curl http://localhost:3000/api/v1/health

# 5. Arrêtez quand fini
make docker-down
```

### 📝 Avec Prisma

```bash
# Créer une nouvelle migration
docker-compose exec api npx prisma migrate dev --name add_new_table

# Voir l'interface Prisma Studio
make prisma-studio

# Créer un seed (données de test)
docker-compose exec api npx prisma db seed
```

---

## 🐛 Debugging

### Logs détaillés
```bash
# Tous les logs
docker-compose logs -f

# Logs de l'API seulement
docker-compose logs -f api

# Logs de PostgreSQL seulement  
docker-compose logs -f postgres
```

### Inspecteur Node (Chrome DevTools)
L'API expose le port 9229 pour la débugage :
```bash
# Dans Chrome, accédez à chrome://inspect
```

### Accès PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d connect_impact_db
```

---

## 🔧 Réinitialisation / Nettoyage

### Réinitialiser tout
```bash
make docker-reset
```

Cela supprime :
- Tous les containers
- Tous les volumes (données persistantes)
- Les images Docker

### Rebuild complet
```bash
make rebuild
```

Cela :
1. Supprime les containers et volumes
2. Reconstruit les images
3. Redémarre les containers
4. Applique les migrations

---

## 📚 Utilisation en Production

Pour déployer en production, utilisez `Dockerfile.prod` :

```bash
docker build -f Dockerfile.prod -t connect-impact-api:latest .
docker run -p 3000:3000 --env-file .env.prod connect-impact-api:latest
```

---

## ⚠️ Troubleshooting

### Le port 5432 est déjà utilisé
```bash
# Arrêtez le service PostgreSQL local ou utilisez un autre port
make docker-down
# ou modifiez DATABASE_PORT dans .env.docker
```

### API ne se connecte pas à PostgreSQL
```bash
# Vérifiez que PostgreSQL est prêt
docker-compose logs postgres

# Attendez quelques secondes et réessayez
# Les health checks garantissent que Postgres est prêt
```

### Hot reload ne fonctionne pas
```bash
# Vérifiez que le volume est monté correctement
docker-compose exec api ls -la

# Redémarrez le container
docker-compose restart api
```

### `EBUSY: resource busy or locked, rmdir '/app/dist'`
Ce projet monte `/app/dist` comme volume Docker. En watch mode, Nest peut essayer de supprimer entièrement le dossier `dist` (option `deleteOutDir`), ce qui échoue sur un point de montage.

La commande `start:dev` utilise une configuration Nest dédiée (`nest-cli.dev.json`) qui désactive `deleteOutDir` pour éviter cette erreur.

### `Cannot find module ... bcrypt_lib.node`
`bcrypt` est un module natif : il doit télécharger ou compiler un binaire `.node` pendant l'installation. Si `node_modules` est copié depuis votre machine hôte dans l'image (ex: absence de `.dockerignore`), ou si le volume `node_modules` a été initialisé avec des dépendances “host”, le binaire peut être manquant dans le container.

Correctif recommandé :
```bash
make docker-reset
make docker-build
make docker-up
```

Si le problème persiste, c’est souvent parce que le volume Docker `/app/node_modules` existe déjà avec une installation incomplète. Le container `api` lance maintenant `scripts/docker-dev.sh`, qui réinstalle automatiquement si `bcrypt`/Prisma ne sont pas chargeables.

### Prisma client introuvable
```bash
# Régénérez le client
docker-compose exec api npx prisma generate

# Ou redémarrez depuis zéro
make docker-reset
```

---

## 🎯 Raccourcis utiles

```bash
# Démarrer complet
make setup

# Logs en temps réel
make docker-logs

# Shell du container
docker-compose exec api sh

# Interface Prisma
make prisma-studio

# Réinitialiser la base
make db-reset
```

---

## 📖 Documentation utile

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Prisma Docker Guide](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [NestJS Docker Guide](https://docs.nestjs.com/)

---

## ✅ Checklist de démarrage

- [ ] Docker et Docker Compose installés
- [ ] `.env.docker` configuré
- [ ] `make docker-up` lancé avec succès
- [ ] PostgreSQL passe les health checks
- [ ] API redémarre automatiquement après les changements
- [ ] `curl http://localhost:3000/api/v1` répond
- [ ] Swagger accessible sur `/api/docs`

Vous êtes prêt ! 🚀
