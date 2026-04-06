package jikan

type AnimeListResponse struct {
	Data []AnimeData `json:"data"`
	Pagination Pagination `json:"pagination"`
}

type Pagination struct {
	LastVisiblePage int  `json:"last_visible_page"`
	HasNextPage     bool `json:"has_next_page"`
	CurrentPage     int  `json:"current_page"`
}

type NamedResource struct {
	MALID int64  `json:"mal_id"`
	Name string `json:"name"`
	Type string `json:"type"`
	URL string `json:"url"`
}


type AnimeData struct {
	MALID int64 `json:"mal_id"`
	Title string `json:"title"`
	TitleEnglish *string `json:"title_english"`
	Synopsis *string `json:"synopsis"`
	Score *float64 `json:"score"`
	Popularity *int `json:"popularity"`
	Episodes *int `json:"episodes"`
	Year *int `json:"year"`

	Images struct {
		JPG struct {
			ImageURL string `json:"image_url"`
		} `json:"jpg"`
	} `json:"images"`

	Genres  []NamedResource `json:"genres"`
	Studios []NamedResource `json:"studios"`
}
