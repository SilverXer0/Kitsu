package models

import "time"

type Anime struct {
	MALID int64 `json:"mal_id"`
	Title string `json:"title"`
	TitleEnglish *string `json:"title_english,omitempty"`
	Synopsis *string `json:"synopsis,omitempty"`
	Score *float64 `json:"score,omitempty"`
	Popularity *int `json:"popularity,omitempty"`
	Episodes *int  `json:"episodes,omitempty"`
	Year *int `json:"year,omitempty"`
	ImageURL *string `json:"image_url,omitempty"`
	GenresJSON []byte `json:"-"`
	StudiosJSON []byte `json:"-"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"created_at,omitempty"`
}