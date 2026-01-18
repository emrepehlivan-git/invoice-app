.PHONY: up down logs migrate build restart ps

DOCKER_DIR = docker

up:
	cd $(DOCKER_DIR) && docker compose up -d

down:
	cd $(DOCKER_DIR) && docker compose down

logs:
	cd $(DOCKER_DIR) && docker compose logs -f app

migrate:
	cd $(DOCKER_DIR) && docker compose up migrate

build:
	cd $(DOCKER_DIR) && docker compose up -d --build

restart:
	cd $(DOCKER_DIR) && docker compose restart

ps:
	cd $(DOCKER_DIR) && docker compose ps
