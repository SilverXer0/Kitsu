package cache

import "fmt"

func AnimeDetailKey(animeID int64) string {
	return fmt.Sprintf("anime:%d:detail", animeID)
}

func AnimeRecommendationsKey(animeID int64) string {
	return fmt.Sprintf("anime:%d:recommendations", animeID)
}