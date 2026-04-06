package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/SilverXer0/Kitsu/backend/internal/storage"
)

type Handler struct {
	store *storage.AnimeStore
}

func NewHandler(store *storage.AnimeStore) *Handler {
	return &Handler {store: store}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string {
		"status": "ok",
	})
}

func (h *Handler) SearchAnime(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string {
			"error": "missing query parameter q",
		})
		return
	}

	res, err := h.store.SearchAnimeByTitle(r.Context(), q, 10)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string {
			"error": "failed to search anime",
		})
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (h *Handler) GetAnimeByID(w http.ResponseWriter, r *http.Request) {
	id, ok := extractAnimeID(r.URL.Path)
	if !ok {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid anime id",
		})
		return
	}

	anime, err := h.store.GetAnimeByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to fetch anime",
		})
		return
	}

	if anime == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{
			"error": "anime not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, anime)
}

func (h *Handler) GetRecommendationsByAnimeID(w http.ResponseWriter, r *http.Request) {
	id, ok := extractAnimeIDFromRecommendationsPath(r.URL.Path)
	if !ok {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid anime id",
		})
		return
	}

	recommendations, err := h.store.GetRecommendationsByAnimeID(r.Context(), id, 10)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to fetch recommendations",
		})
		return
	}

	writeJSON(w, http.StatusOK, recommendations)
}

func extractAnimeID(path string) (int64, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[0] != "anime" {
		return 0, false
	}

	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return 0, false
	}

	return id, true
}

func extractAnimeIDFromRecommendationsPath(path string) (int64, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 3 || parts[0] != "anime" || parts[2] != "recommendations" {
		return 0, false
	}

	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return 0, false
	}

	return id, true
}
