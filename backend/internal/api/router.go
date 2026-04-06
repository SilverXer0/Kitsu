package api

import (
	"log"
	"net/http"
	"time"
)

type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *statusRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

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

	return withCORS(withRequestLogging(mux))
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

func withRequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		recorder := &statusRecorder{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(recorder, r)

		log.Printf(
			"request method=%s path=%s status=%d duration=%s",
			r.Method,
			r.URL.Path,
			recorder.statusCode,
			time.Since(start),
		)
	})
}