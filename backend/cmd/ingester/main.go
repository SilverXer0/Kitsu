package main

import (
	"context"
	"encoding/json"
	"fmt"
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

	log.Printf(
		"starting ingest mode=%s pages=%d max_pages=%d",
		cfg.IngestMode,
		cfg.IngestPages,
		cfg.IngestMaxPages,
	)

	syncRunID, err := syncRunStore.CreateSyncRun(ctx, "jikan", cfg.IngestMode)
	if err != nil {
		log.Fatalf("failed to create sync run: %v", err)
	}

	pagesRequested := cfg.IngestPages
	pagesSucceeded := 0
	totalUpserted := 0

	if cfg.IngestMode == "backfill" {
		pagesRequested = cfg.IngestMaxPages
	}

	for page := 1; shouldContinue(cfg, page); page++ {
		log.Printf("fetching mode=%s page=%d", cfg.IngestMode, page)

		resp, err := fetchPageByMode(ctx, client, cfg.IngestMode, page)
		if err != nil {
			_ = syncRunStore.MarkSyncRunFailed(
				ctx,
				syncRunID,
				pagesRequested,
				pagesSucceeded,
				totalUpserted,
				err.Error(),
			)
			log.Fatalf("failed to fetch mode=%s page=%d: %v", cfg.IngestMode, page, err)
		}

		// In backfill mode, stop cleanly when the upstream returns no data.
		if len(resp.Data) == 0 {
			log.Printf("no data returned for mode=%s page=%d, stopping", cfg.IngestMode, page)
			pagesRequested = page
			break
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

		// For backfill mode, stop when Jikan says there is no next page.
		if cfg.IngestMode == "backfill" && !resp.Pagination.HasNextPage {
			pagesRequested = page
			log.Printf("reached final page for backfill at page=%d", page)
			break
		}

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

func shouldContinue(cfg config.Config, page int) bool {
	switch cfg.IngestMode {
	case "backfill":
		return page <= cfg.IngestMaxPages
	default:
		return page <= cfg.IngestPages
	}
}

func fetchPageByMode(
	ctx context.Context,
	client *jikan.Client,
	mode string,
	page int,
) (*jikan.AnimeListResponse, error) {
	switch mode {
	case "top":
		return client.GetTopAnime(ctx, page)
	case "season_now":
		return client.GetSeasonNow(ctx, page)
	case "upcoming":
		return client.GetUpcomingAnime(ctx, page)
	case "backfill":
		return client.GetTopAnime(ctx, page)
	default:
		return nil, fmt.Errorf("unsupported ingest mode: %s", mode)
	}
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