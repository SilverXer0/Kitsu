import { useState, useRef, useEffect } from "react";
import type { Anime, Recommendation } from "../types/anime";
import { searchAnime, getPersonalizedRecommendations } from "../api/anime";

type PersonalizeModalProps = {
  onClose: () => void;
  onSelectAnime: (anime: Anime) => void;
};

type Step = "picking" | "loading" | "results";

function scoreClass(score: number | null | undefined): string {
  if (score == null) return "score-na";
  if (score >= 7.5) return "score-high";
  if (score >= 5.5) return "score-mid";
  return "score-low";
}

export default function PersonalizeModal({ onClose, onSelectAnime }: PersonalizeModalProps) {
  const [step, setStep] = useState<Step>("picking");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<Anime[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MIN_PICKS = 3;
  const MAX_PICKS = 5;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const response = await searchAnime({ query: value.trim(), limit: 12 });
        setSearchResults(response.items);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  }

  function toggleSelect(anime: Anime) {
    const isAlreadySelected = selected.some((s) => s.mal_id === anime.mal_id);
    if (isAlreadySelected) {
      setSelected(selected.filter((s) => s.mal_id !== anime.mal_id));
    } else if (selected.length < MAX_PICKS) {
      setSelected([...selected, anime]);
    }
  }

  function removeSelected(malId: number) {
    setSelected(selected.filter((s) => s.mal_id !== malId));
  }

  async function handleGetRecommendations() {
    if (selected.length < MIN_PICKS) return;

    try {
      setError(null);
      setStep("loading");
      const ids = selected.map((a) => a.mal_id);
      const recs = await getPersonalizedRecommendations(ids);
      setRecommendations(recs);
      setStep("results");
    } catch {
      setError("Failed to get personalized recommendations.");
      setStep("picking");
    }
  }

  function handlePickAgain() {
    setStep("picking");
    setRecommendations([]);
  }

  const selectedIds = new Set(selected.map((s) => s.mal_id));

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="p-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="overlay-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="p-modal-scroll">
          {step === "picking" && (
            <>
              <div className="p-modal-header">
                <h2>Pick Your Favorites</h2>
                <p>Select {MIN_PICKS}–{MAX_PICKS} anime you love, and we'll find your perfect recommendations.</p>
              </div>

              {error && <div className="error-banner">{error}</div>}

              <div className="p-selected-row">
                {selected.length === 0 ? (
                  <span className="p-selected-empty">No anime selected yet</span>
                ) : (
                  selected.map((anime) => (
                    <div className="p-selected-chip" key={anime.mal_id}>
                      {anime.image_url && (
                        <img className="p-selected-chip-img" src={anime.image_url} alt="" />
                      )}
                      <span className="p-selected-chip-title">{anime.title}</span>
                      <button
                        className="p-selected-chip-remove"
                        onClick={() => removeSelected(anime.mal_id)}
                        aria-label={`Remove ${anime.title}`}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-counter">
                <span className={selected.length >= MIN_PICKS ? "p-counter-ready" : ""}>
                  {selected.length}/{MAX_PICKS} selected
                </span>
                <button
                  className="p-get-recs-btn"
                  disabled={selected.length < MIN_PICKS}
                  onClick={handleGetRecommendations}
                >
                  Get Recommendations →
                </button>
              </div>

              <div className="p-search-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search anime to add..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  autoFocus
                />
              </div>

              {isSearching && <div className="empty-state">Searching...</div>}

              {!isSearching && searchResults.length === 0 && query.trim() && (
                <div className="empty-state">No results found.</div>
              )}

              {searchResults.length > 0 && (
                <div className="p-pick-grid">
                  {searchResults.map((anime, i) => {
                    const isSelected = selectedIds.has(anime.mal_id);
                    const isDisabled = !isSelected && selected.length >= MAX_PICKS;
                    return (
                      <div
                        className={`p-pick-card ${isSelected ? "p-pick-card-selected" : ""} ${isDisabled ? "p-pick-card-disabled" : ""}`}
                        key={anime.mal_id}
                        onClick={() => !isDisabled && toggleSelect(anime)}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="p-pick-card-img-wrapper">
                          {anime.image_url ? (
                            <img className="p-pick-card-img" src={anime.image_url} alt={anime.title} loading="lazy" />
                          ) : (
                            <div className="p-pick-card-img anime-card-placeholder">No image</div>
                          )}
                          {isSelected && (
                            <div className="p-pick-card-check">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                          <span className={`score-badge ${scoreClass(anime.score)}`}>
                            {anime.score != null ? anime.score.toFixed(1) : "N/A"}
                          </span>
                        </div>
                        <div className="p-pick-card-body">
                          <p className="p-pick-card-title">{anime.title}</p>
                          <div className="p-pick-card-meta">
                            {anime.year && <span>{anime.year}</span>}
                            {anime.episodes && <span>{anime.episodes} eps</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === "loading" && (
            <div className="p-modal-loading">
              <div className="p-spinner" />
              <p>Finding your perfect recommendations...</p>
            </div>
          )}

          {step === "results" && (
            <>
              <div className="p-modal-header">
                <h2>Recommended For You</h2>
                <p>Based on your {selected.length} favorite anime.</p>
              </div>

              <button className="p-pick-again-btn" onClick={handlePickAgain}>
                ← Pick Again
              </button>

              {recommendations.length === 0 ? (
                <div className="empty-state">No recommendations found. Try different anime.</div>
              ) : (
                <div className="p-results-grid">
                  {recommendations.map((rec, i) => (
                    <div
                      className="anime-card anime-card-clickable"
                      key={rec.recommended_anime_id}
                      onClick={() => onSelectAnime(rec.anime)}
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <div className="anime-card-image-wrapper">
                        {rec.anime.image_url ? (
                          <img className="anime-card-image" src={rec.anime.image_url} alt={rec.anime.title} loading="lazy" />
                        ) : (
                          <div className="anime-card-image anime-card-placeholder">No image</div>
                        )}
                        <span className={`score-badge ${scoreClass(rec.anime.score)}`}>
                          {rec.anime.score != null ? rec.anime.score.toFixed(1) : "N/A"}
                        </span>
                      </div>
                      <div className="anime-card-body">
                        <h3>{rec.anime.title}</h3>
                        <p className="p-result-reason">{rec.reason}</p>
                        <div className="anime-card-meta">
                          {rec.anime.year && <span>{rec.anime.year}</span>}
                          {rec.anime.episodes && <span>{rec.anime.episodes} eps</span>}
                          <span className="p-result-match">Match: {rec.score.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
