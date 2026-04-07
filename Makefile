.PHONY: help docker-up docker-down docker-build docker-logs docker-clean docker-reset prisma-generate prisma-migrate prisma-studio dev

help:
	@echo "╔════════════════════════════════════════════╗"
	@echo "║   Connect Impact Backend - Commands Guide   ║"
	@echo "╚════════════════════════════════════════════╝"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-up          Start all containers (PostgreSQL + API)"
	@echo "  make docker-down        Stop all containers"
	@echo "  make docker-build       Build Docker images"
	@echo "  make docker-logs        Show container logs"
	@echo "  make docker-clean       Remove containers and networks"
	@echo "  make docker-reset       Reset everything (containers, volumes)"
	@echo ""
	@echo "Prisma Commands:"
	@echo "  make prisma-generate    Generate Prisma client"
	@echo "  make prisma-migrate     Run Prisma migrations"
	@echo "  make prisma-studio     Open Prisma Studio"
	@echo ""
	@echo "Development:"
	@echo "  make dev               Start dev server locally (without Docker)"
	@echo ""

# Docker Commands
docker-up:
	docker-compose --env-file .env.docker up -d
	@echo "✓ Containers started successfully"
	@echo "📊 API running on http://localhost:3000/api/v1"
	@echo "📖 Swagger docs available on http://localhost:3000/api/docs"
	@echo "🗄️  PostgreSQL on localhost:5432"

docker-down:
	docker-compose down
	@echo "✓ Containers stopped"

docker-build:
	docker-compose --env-file .env.docker build
	@echo "✓ Docker images built successfully"

docker-logs:
	docker-compose logs -f

docker-logs-api:
	docker-compose logs -f api

docker-logs-postgres:
	docker-compose logs -f postgres

docker-clean:
	docker-compose down -v
	@echo "✓ Containers and networks removed"

docker-reset:
	docker-compose down -v
	docker rmi connect-impact-backend-api:latest 2>/dev/null || true
	@echo "✓ Full reset completed. Run 'make docker-up' to start fresh"

docker-shell:
	docker-compose exec api sh

# Prisma Commands
prisma-generate:
	npx prisma generate
	@echo "✓ Prisma client generated"

prisma-migrate:
	npx prisma migrate dev
	@echo "✓ Database migrations applied"

prisma-studio:
	npx prisma studio

# Development
dev:
	pnpm install && pnpm start:dev

# Database
db-init:
	docker-compose --env-file .env.docker exec postgres psql -U postgres -d connect_impact_db -c "SELECT 1"

db-reset:
	docker-compose --env-file .env.docker exec postgres dropdb -U postgres connect_impact_db || true
	docker-compose --env-file .env.docker exec postgres createdb -U postgres connect_impact_db
	make prisma-migrate
	@echo "✓ Database reset and migrations applied"

# All-in-one
setup: docker-build docker-up prisma-migrate
	@echo "✓ Complete setup finished!"

rebuild: docker-clean docker-up prisma-migrate
	@echo "✓ Complete rebuild finished!"
