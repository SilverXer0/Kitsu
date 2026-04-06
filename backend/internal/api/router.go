package api

import "net/http"

func NewRouter(handler *Handler) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", handler.Health)
	mux.HandleFunc("/anime/search", handler.SearchAnime)

	mux.HandleFunc("/anime/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/anime/" {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error": "not found",
			})
			return
		}

		if len(r.URL.Path) > len("/anime/") && hasRecommendationsSuffix(r.URL.Path) {
			handler.GetRecommendationsByAnimeID(w, r)
			return
		}

		handler.GetAnimeByID(w, r)
	})

	return mux
}

func hasRecommendationsSuffix(path string) bool {
	return len(path) >= len("/recommendations") &&
		path[len(path)-len("/recommendations"):] == "/recommendations"
}