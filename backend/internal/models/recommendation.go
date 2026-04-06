package models

type Recommendation struct {
	SourceAnimeID int64 `json:"source_anime_id"`
	RecommendedAnimeID int64 `json:"recommended_anime_id"`
	Score float64 `json:"score"`
	Rank int `json:"rank"`
	Reason string `json:"reason"`
	ModelVersion string `json:"model_version"`

	Anime Anime `json:"anime"`
}