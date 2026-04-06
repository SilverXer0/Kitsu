package main

import (
	"context"
	"log"
	"net/http"

	"github.com/SilverXer0/Kitsu/backend/internal/api"
	"github.com/SilverXer0/Kitsu/backend/internal/cache"
	"github.com/SilverXer0/Kitsu/backend/internal/config"
	"github.com/SilverXer0/Kitsu/backend/internal/db"
	"github.com/SilverXer0/Kitsu/backend/internal/metrics"
	"github.com/SilverXer0/Kitsu/backend/internal/storage"
)

func main() {
	ctx := context.Background()
	cfg := config.Load()

	postgresDB, err := db.NewPostgres(ctx, cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer postgresDB.Close()

	cacheClient := cache.NewRedisCache(
		cfg.RedisAddr,
		cfg.RedisPassword,
		cfg.RedisDB,
		cfg.CacheTTLSeconds,
	)

	if err := cacheClient.Ping(ctx); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	log.Printf("redis cache connected addr=%s ttl_seconds=%d", cfg.RedisAddr, cfg.CacheTTLSeconds)

	store := storage.NewAnimeStore(postgresDB)
	metricsCollector := metrics.NewMetrics()

	handler := api.NewHandler(store, cacheClient, metricsCollector)
	router := api.NewRouter(handler)

	addr := ":" + cfg.AppPort
	log.Printf("api listening on %s", addr)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}