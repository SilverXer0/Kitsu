#!/usr/bin/env bash
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-kitsu-postgres-1}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-kitsu}"

echo "Waiting for Postgres to be ready..."
until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  sleep 2
done

echo "Applying migrations..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/001_create_anime.sql
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/002_create_recommendations.sql
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < backend/migrations/003_create_sync_runs.sql

anime_count=$(
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM anime;"
)

recommendation_count=$(
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM recommendations;"
)

echo "Current anime count: $anime_count"
echo "Current recommendation count: $recommendation_count"

if [ "$anime_count" = "0" ]; then
  echo "Anime table is empty. Running ingest..."
  docker compose run --rm ingester
else
  echo "Anime data already exists. Skipping ingest."
fi

# Re-check anime count after possible ingest
anime_count=$(
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM anime;"
)

if [ "$anime_count" = "0" ]; then
  echo "Anime table is still empty after ingest attempt."
  exit 1
fi

if [ "$recommendation_count" = "0" ]; then
  echo "Recommendations table is empty. Running offline recommender..."
  docker compose run --rm offline
else
  echo "Recommendations already exist. Skipping recommender."
fi

echo "Bootstrap complete."