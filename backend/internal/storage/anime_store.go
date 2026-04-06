package storage

import (
	"context"
	"database/sql"

	"github.com/SilverXer0/Kitsu/backend/internal/models"
)

type AnimeStore struct {
	db *sql.DB
}

func NewAnimeStore(db *sql.DB) *AnimeStore {
	return &AnimeStore{db: db}
}

func (s *AnimeStore) UpsertAnime(ctx context.Context, anime models.Anime) error {
	const query = `
		INSERT INTO anime (
			mal_id,
			title,
			title_english,
			synopsis,
			score,
			popularity,
			episodes,
			year,
			image_url,
			genres_json,
			studios_json,
			updated_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
		)
		ON CONFLICT (mal_id)
		DO UPDATE SET
			title = EXCLUDED.title,
			title_english = EXCLUDED.title_english,
			synopsis = EXCLUDED.synopsis,
			score = EXCLUDED.score,
			popularity = EXCLUDED.popularity,
			episodes = EXCLUDED.episodes,
			year = EXCLUDED.year,
			image_url = EXCLUDED.image_url,
			genres_json = EXCLUDED.genres_json,
			studios_json = EXCLUDED.studios_json,
			updated_at = NOW()
	`

	_, err := s.db.ExecContext(
		ctx,
		query,
		anime.MALID,
		anime.Title,
		anime.TitleEnglish,
		anime.Synopsis,
		anime.Score,
		anime.Popularity,
		anime.Episodes,
		anime.Year,
		anime.ImageURL,
		anime.GenresJSON,
		anime.StudiosJSON,
	)

	return err
}

func (s *AnimeStore) SearchAnimeByTitlePaginated(
	ctx context.Context,
	q string,
	page int,
	limit int,
) ([]models.Anime, int, error) {
	const countQuery = `
		SELECT COUNT(*)
		FROM anime
		WHERE title ILIKE '%' || $1 || '%'
		   OR COALESCE(title_english, '') ILIKE '%' || $1 || '%'
	`

	var totalItems int
	if err := s.db.QueryRowContext(ctx, countQuery, q).Scan(&totalItems); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit

	const dataQuery = `
		SELECT mal_id, title, title_english, synopsis, score, popularity, episodes, year, image_url
		FROM anime
		WHERE title ILIKE '%' || $1 || '%'
		   OR COALESCE(title_english, '') ILIKE '%' || $1 || '%'
		ORDER BY popularity ASC NULLS LAST, title ASC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.QueryContext(ctx, dataQuery, q, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	result := make([]models.Anime, 0)
	for rows.Next() {
		var anime models.Anime
		if err := rows.Scan(
			&anime.MALID,
			&anime.Title,
			&anime.TitleEnglish,
			&anime.Synopsis,
			&anime.Score,
			&anime.Popularity,
			&anime.Episodes,
			&anime.Year,
			&anime.ImageURL,
		); err != nil {
			return nil, 0, err
		}

		result = append(result, anime)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return result, totalItems, nil
}

func (s *AnimeStore) GetAnimeByID(ctx context.Context, animeID int64) (*models.Anime, error) {
	const query = `
		SELECT mal_id, title, title_english, synopsis, score, popularity, episodes, year, image_url
		FROM anime
		WHERE mal_id = $1
	`

	var anime models.Anime
	err := s.db.QueryRowContext(ctx, query, animeID).Scan(
		&anime.MALID,
		&anime.Title,
		&anime.TitleEnglish,
		&anime.Synopsis,
		&anime.Score,
		&anime.Popularity,
		&anime.Episodes,
		&anime.Year,
		&anime.ImageURL,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &anime, nil
}

func (s *AnimeStore) GetRecommendationsByAnimeID(
	ctx context.Context,
	animeID int64,
	limit int,
) ([]models.Recommendation, error) {
	const query = `
		SELECT
			r.source_anime_id,
			r.recommended_anime_id,
			r.score,
			r.rank,
			r.reason,
			r.model_version,
			a.mal_id,
			a.title,
			a.title_english,
			a.synopsis,
			a.score,
			a.popularity,
			a.episodes,
			a.year,
			a.image_url
		FROM recommendations r
		JOIN anime a ON a.mal_id = r.recommended_anime_id
		WHERE r.source_anime_id = $1
		ORDER BY r.rank ASC
		LIMIT $2
	`

	rows, err := s.db.QueryContext(ctx, query, animeID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.Recommendation, 0)

	for rows.Next() {
		var rec models.Recommendation
		if err := rows.Scan(
			&rec.SourceAnimeID,
			&rec.RecommendedAnimeID,
			&rec.Score,
			&rec.Rank,
			&rec.Reason,
			&rec.ModelVersion,
			&rec.Anime.MALID,
			&rec.Anime.Title,
			&rec.Anime.TitleEnglish,
			&rec.Anime.Synopsis,
			&rec.Anime.Score,
			&rec.Anime.Popularity,
			&rec.Anime.Episodes,
			&rec.Anime.Year,
			&rec.Anime.ImageURL,
		); err != nil {
			return nil, err
		}

		result = append(result, rec)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}