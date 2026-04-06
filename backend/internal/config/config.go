package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort string
	PostgresDSN string
	JikanBaseURL string
	IngestPages int
	RedisAddr string
	RedisPassword string
	RedisDB int
	CacheTTLSeconds int
}

func Load() Config {
	_ = godotenv.Load()

	cfg := Config{
		AppPort: getEnv("APP_PORT", "8080"),
		PostgresDSN: getEnv("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/kitsu?sslmode=disable"),
		JikanBaseURL: getEnv("JIKAN_BASE_URL", "https://api.jikan.moe/v4"),
		IngestPages: getEnvInt("INGEST_PAGES", 2),
		RedisAddr: getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB: getEnvInt("REDIS_DB", 0),
		CacheTTLSeconds: getEnvInt("CACHE_TTL_SECONDS", 300),
	}
	if cfg.PostgresDSN == "" {
		log.Fatal("POSTGRES_DSN is required")
	}
	return cfg
}


func getEnv(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}

func getEnvInt(key string, fallback int) int {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return parsed
} 