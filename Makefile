.PHONY: up build down restart logs bootstrap start recommend ingest dbshell redisshell

up:
	docker compose up

build:
	docker compose up --build

down:
	docker compose down

restart:
	docker compose down
	docker compose up

logs:
	docker compose logs -f

bootstrap:
	docker compose up -d postgres redis
	./scripts/bootstrap_data.sh

start:
	docker compose up -d postgres redis
	./scripts/bootstrap_data.sh
	docker compose up --build backend frontend

recommend:
	docker compose run --rm offline

ingest:
	docker compose run --rm ingester

dbshell:
	docker exec -it kitsu-postgres-1 psql -U postgres -d kitsu

redisshell:
	docker exec -it kitsu-redis-1 redis-cli