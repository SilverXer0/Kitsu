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
	syncRunStore := storage.NewSyncRunStore(postgresDB)

	limiter := ratelimit.NewDualLimiter()
	client := jikan.NewClient(cfg.JikanBaseURL, limiter)

	log.Printf("starting ingest mode=%s pages=%d", cfg.IngestMode, cfg.IngestPages)

	syncRunID, err := syncRunStore.CreateSyncRun(ctx, "jikan", cfg.IngestMode)
	if err != nil {
		log.Fatalf("failed to create sync run: %v", err)
	}

	pagesRequested := cfg.IngestPages
	pagesSucceeded := 0
	totalUpserted := 0

	for page := 1; page <= cfg.IngestPages; page++ {
		log.Printf("fetching mode=%s page=%d", cfg.IngestMode, page)

		var resp *jikan.AnimeListResponse

		switch cfg.IngestMode {
		case "top":
			resp, err = client.GetTopAnime(ctx, page)
		case "season_now":
			resp, err = client.GetSeasonNow(ctx, page)
		case "upcoming":
			resp, err = client.GetUpcomingAnime(ctx, page)
		default:
			err = syncRunStore.MarkSyncRunFailed(
				ctx,
				syncRunID,
				pagesRequested,
				pagesSucceeded,
				totalUpserted,
				"unsupported ingest mode: "+cfg.IngestMode,
			)
			if err != nil {
				log.Printf("failed to mark sync run failed: %v", err)
			}
			log.Fatalf("unsupported ingest mode: %s", cfg.IngestMode)
		}

		if err != nil {
			_ = syncRunStore.MarkSyncRunFailed(
				ctx,
				syncRunID,
				pagesRequested,
				pagesSucceeded,
				totalUpserted,
				err.Error(),
			)
			log.Fatalf("failed to fetch page %d: %v", page, err)
		}

		pagesSucceeded++

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

	if err := syncRunStore.MarkSyncRunSucceeded(
		ctx,
		syncRunID,
		pagesRequested,
		pagesSucceeded,
		totalUpserted,
	); err != nil {
		log.Printf("failed to mark sync run succeeded: %v", err)
	}

	log.Printf(
		"ingest complete mode=%s pages_requested=%d pages_succeeded=%d total_upserted=%d",
		cfg.IngestMode,
		pagesRequested,
		pagesSucceeded,
		totalUpserted,
	)
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
		StudiosJSON:studiosJSON,
	}, nil
}