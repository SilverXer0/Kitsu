# Kitsu

Kitsu is a production-style anime recommendation platform designed to simulate a real-world recommendation system. It focuses on system design, data pipelines, and scalable API serving rather than purely machine learning experimentation.

The system ingests anime data from external APIs, processes and stores it in a relational database, generates recommendations offline, and serves them through a low-latency backend with caching and a web frontend.

---

## Overview

Kitsu is built as a full-stack system with the following goals:

- Efficient ingestion and storage of anime data
- Offline recommendation generation
- Low-latency API serving with caching
- Simple and reproducible local deployment

---

## Architecture

The system is divided into four main components:

### 1. Ingestion Pipeline
- Fetches anime data from the Jikan API
- Normalizes and stores data into PostgreSQL
- Supports multiple modes (top, seasonal, upcoming)
- Handles pagination and rate limiting

### 2. Storage Layer
- PostgreSQL stores anime metadata and recommendations
- Redis is used as a cache layer for frequently accessed queries

### 3. Recommendation Pipeline (Offline)
- Processes stored anime data into feature vectors
- Computes TF-IDF synopsis similarity and weighted genre matching
- Applies MMR (Maximal Marginal Relevance) diversity reranking to avoid homogeneous results
- Enforces franchise capping so sequels and spin-offs don't flood the top results
- Surfaces hidden gems via a quality-aware popularity bonus
- Writes ranked results back into PostgreSQL

### 4. API + Frontend
- Go backend serves REST endpoints for search, per-anime recommendations, and personalized recommendations
- Redis caching reduces latency and database load
- React + TypeScript frontend provides a user interface for search and discovery
- "For You" flow lets users pick 3–5 favorite anime and get a merged, personalized recommendation list

---

## Tech Stack

- Go (backend API)
- Python (data pipelines and recommendation generation)
- PostgreSQL (primary database)
- Redis (caching layer)
- Docker + Docker Compose (containerization)
- TypeScript + React (frontend)

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Make (optional but recommended)

---

## Running the Project

### One Command Startup (Recommended)

```bash
make start
```

This command will:

- Start PostgreSQL and Redis
- Apply database migrations
- Populate anime data if the database is empty
- Generate recommendations if missing
- Start backend and frontend services

After startup:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

---

## Manual Setup (Step-by-Step)

### 1. Start Infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Apply Migrations

```bash
docker exec -i kitsu-postgres-1 psql -U postgres -d kitsu < backend/migrations/001_create_anime.sql

docker exec -i kitsu-postgres-1 psql -U postgres -d kitsu < backend/migrations/002_create_recommendations.sql

docker exec -i kitsu-postgres-1 psql -U postgres -d kitsu < backend/migrations/003_create_sync_runs.sql
```

### 3. Ingest Anime Data

```bash
docker compose run --rm ingester
```

### 4. Generate Recommendations

```bash
docker compose run --rm offline
```

### 5. Start Backend and Frontend

```bash
docker compose up --build backend frontend
```

---

## Useful Commands

### Start everything (with checks)

```bash
make start
```

### Rebuild services

```bash
make build
```

### Stop services

```bash
make down
```

### View logs

```bash
make logs
```

### Run ingestion manually

```bash
make ingest
```

### Run recommendation pipeline manually

```bash
make recommend
```

### Open Postgres shell

```bash
make dbshell
```

### Open Redis shell

```bash
make redisshell
```

---

## Notes on Data Persistence

- Data is stored in a Docker volume (`postgres_data`)
- Running `docker compose down` will NOT delete data
- Running `docker compose down -v` WILL delete all stored data

---

## Design Considerations

- Separation of offline (batch) and online (serving) systems
- Redis caching to reduce database load and improve latency
- Idempotent ingestion and bootstrap flow
- Containerized environment for reproducibility

---

## Future Improvements

- Scheduled ingestion and data freshness
- Observability (metrics, tracing)
- Deployment to cloud infrastructure
- User accounts and persistent watch history
- Collaborative filtering from user interactions

---

## Summary

Kitsu demonstrates how to design and build a production-style recommendation system end-to-end, with a focus on system architecture, data flow, and scalable serving rather than only model training.
