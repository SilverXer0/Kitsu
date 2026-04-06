package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/SilverXer0/Kitsu/backend/internal/config"
	"github.com/SilverXer0/Kitsu/backend/internal/db"
	"github.com/SilverXer0/Kitsu/backend/internal/jikan"
	"github.com/SilverXer0/Kitsu/backend/internal/models"
	"github.com/SilverXer0/Kitsu/backend/internal/ratelimit"
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

	store := storage.NewAnimeStore(postgresDB)

	limiter := ratelimit.NewDualLimiter()
	client := jikan.NewClient(cfg.JikanBaseURL, limiter)

	totalUpserted := 0

	for page := 1; page <= cfg.IngestPages; page++ {
		log.Printf("fetching page %d", page)

		resp, err := client.GetTopAnime(ctx, page)
		if err != nil {
			log.Fatalf("failed to fetch page %d: %v", page, err)
		}

		pageCount := 0
		for _, item := range resp.Data {
			anime, err := normalizeAnime(item)
			if err != nil {
				log.Printf("skipping anime %d due to normalization error: %v", item.MALID, err)
				continue
			}

			if err := store.UpsertAnime(ctx, anime); err != nil {
				log.Printf("failed to upsert anime %d (%s): %v", anime.MALID, anime.Title, err)
				continue
			}

			pageCount++
			totalUpserted++
		}

		log.Printf("page %d upserted %d anime", page, pageCount)
		time.Sleep(500 * time.Millisecond)
	}

	log.Printf("done. total upserted: %d", totalUpserted)
}

func normalizeAnime(item jikan.AnimeData) (models.Anime, error) {
	genresJSON, err := json.Marshal(item.Genres)
	if err != nil {
		return models.Anime{}, err
	}

	studiosJSON, err := json.Marshal(item.Studios)
	if err != nil {
		return models.Anime{}, err
	}

	var imageURL *string
	if item.Images.JPG.ImageURL != "" {
		imageURL = &item.Images.JPG.ImageURL
	}

	return models.Anime{
		MALID: item.MALID,
		Title: item.Title,
		TitleEnglish: item.TitleEnglish,
		Synopsis: item.Synopsis,
		Score: item.Score,
		Popularity: item.Popularity,
		Episodes: item.Episodes,
		Year: item.Year,
		ImageURL: imageURL,
		GenresJSON: genresJSON,
		StudiosJSON: studiosJSON,
	}, nil
}