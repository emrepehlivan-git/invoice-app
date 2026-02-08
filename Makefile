.PHONY: up down logs migrate build restart ps migrate-dev migrate-status migration-new migrate-reset

PRISMA_SCHEMA = prisma/schema.prisma

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f app

migrate:
	docker compose run --rm migrate

migrate-dev:
	bunx prisma migrate dev --schema $(PRISMA_SCHEMA)

migrate-status:
	bunx prisma migrate status --schema $(PRISMA_SCHEMA)

migration-new:
	bunx prisma migrate dev --schema $(PRISMA_SCHEMA) --name $(name) --create-only

migrate-reset:
	bunx prisma migrate reset --schema $(PRISMA_SCHEMA)

build:
	docker compose up -d --build

restart:
	docker compose restart

ps:
	docker compose ps
