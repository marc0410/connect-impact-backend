#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Main script
case "$1" in
    up)
        print_info "Démarrage des containers..."
        docker-compose --env-file .env.docker up -d
        if [ $? -eq 0 ]; then
            print_success "Containers démarrés"
            print_info "API: http://localhost:3000/api/v1"
            print_info "Swagger: http://localhost:3000/api/docs"
            print_info "PostgreSQL: localhost:5432"
        else
            print_error "Erreur au démarrage"
            exit 1
        fi
        ;;
    down)
        print_info "Arrêt des containers..."
        docker-compose down
        print_success "Containers arrêtés"
        ;;
    build)
        print_info "Construction des images..."
        docker-compose --env-file .env.docker build
        print_success "Images construites"
        ;;
    logs)
        docker-compose logs -f
        ;;
    logs-api)
        docker-compose logs -f api
        ;;
    logs-db)
        docker-compose logs -f postgres
        ;;
    shell)
        print_info "Accès au shell du container API..."
        docker-compose exec api sh
        ;;
    db-shell)
        print_info "Accès à PostgreSQL..."
        docker-compose exec postgres psql -U postgres -d connect_impact_db
        ;;
    clean)
        print_warning "Suppression des containers et networks..."
        docker-compose down -v
        print_success "Nettoyage effectué"
        ;;
    reset)
        print_warning "Réinitialisation complète..."
        docker-compose down -v
        docker rmi connect-impact-backend-api:latest 2>/dev/null || true
        print_success "Réinitialisation complète effectuée"
        ;;
    prisma-generate)
        print_info "Génération du client Prisma..."
        npx prisma generate
        print_success "Client Prisma généré"
        ;;
    prisma-migrate)
        print_info "Application des migrations..."
        npx prisma migrate dev
        print_success "Migrations appliquées"
        ;;
    prisma-studio)
        print_info "Ouverture de Prisma Studio..."
        npx prisma studio
        ;;
    db-reset)
        print_warning "Réinitialisation de la base de données..."
        docker-compose exec postgres dropdb -U postgres connect_impact_db 2>/dev/null || true
        docker-compose exec postgres createdb -U postgres connect_impact_db
        print_success "Base de données réinitialisée"
        ;;
    setup)
        print_info "Configuration complète..."
        docker-compose --env-file .env.docker build
        docker-compose --env-file .env.docker up -d
        sleep 5
        npx prisma generate
        npx prisma migrate dev
        print_success "Configuration complète terminée"
        print_info "API: http://localhost:3000/api/v1"
        ;;
    *)
        echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║   Connect Impact Backend - Docker Helper   ║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Docker Commands:"
        echo "  up                  Démarrer les containers"
        echo "  down                Arrêter les containers"
        echo "  build               Construire les images Docker"
        echo "  logs                Voir tous les logs"
        echo "  logs-api            Voir les logs de l'API"
        echo "  logs-db             Voir les logs de PostgreSQL"
        echo "  shell               Accès au shell du container API"
        echo "  db-shell            Accès à PostgreSQL"
        echo "  clean               Supprimer les containers et networks"
        echo "  reset               Réinitialisation complète"
        echo ""
        echo "Prisma Commands:"
        echo "  prisma-generate     Générer le client Prisma"
        echo "  prisma-migrate      Appliquer les migrations"
        echo "  prisma-studio       Ouvrir Prisma Studio"
        echo ""
        echo "Database Commands:"
        echo "  db-reset            Réinitialiser la base de données"
        echo ""
        echo "All-in-one:"
        echo "  setup               Configuration complète"
        echo ""
        exit 1
        ;;
esac
