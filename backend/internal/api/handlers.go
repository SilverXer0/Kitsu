package api

import (
	"encoding/json"
	"net/http"

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