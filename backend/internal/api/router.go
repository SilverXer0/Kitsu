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

		if hasRecommendationsSuffix(r.URL.Path) {
			handler.GetRecommendationsByAnimeID(w, r)
			return
		}

		handler.GetAnimeByID(w, r)
	})

	return withCORS(mux)
}

func hasRecommendationsSuffix(path string) bool {
	return len(path) >= len("/recommendations") &&
		path[len(path)-len("/recommendations"):] == "/recommendations"
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}