import { useRef } from "react";
import type { Anime, Recommendation } from "../types/anime";

type RecommendationListProps = {
  recommendations: Recommendation[];
  onSelectAnime: (anime: Anime) => void;
  isLoading?: boolean;
};

function scoreClass(score: number | null | undefined): string {
  if (score == null) return "score-na";
  if (score >= 7.5) return "score-high";
  if (score >= 5.5) return "score-mid";
  return "score-low";
}

export default function RecommendationList({
  recommendations,
  onSelectAnime,
  isLoading = false,
}: RecommendationListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: number) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction * 320, behavior: "smooth" });
  }

  if (isLoading) {
    return <div className="empty-state">Loading recommendations…</div>;
  }

  if (recommendations.length === 0) {
    return <div className="empty-state">No recommendations found.</div>;
  }

  return (
    <div className="recommendation-list">
      <div className="rec-scroll-container" ref={scrollRef}>
        {recommendations.map((rec, i) => (
          <div
            className="rec-chip"
            key={`${rec.source_anime_id}-${rec.recommended_anime_id}`}
            onClick={() => onSelectAnime(rec.anime)}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rec-chip-image-wrapper">
              {rec.anime.image_url ? (
                <img
                  className="rec-chip-image"
                  src={rec.anime.image_url}
                  alt={rec.anime.title}
                  loading="lazy"
                />
              ) : (
                <div className="rec-chip-image anime-card-placeholder">No image</div>
              )}
              <span className={`score-badge ${scoreClass(rec.anime.score)}`}>
                {rec.anime.score != null ? rec.anime.score.toFixed(1) : "—"}
              </span>
            </div>
            <div className="rec-chip-body">
              <p className="rec-chip-title">{rec.anime.title}</p>
              <p className="rec-chip-reason">{rec.reason}</p>
              <div className="rec-chip-meta-row">
                <span className="rec-chip-score">Match: {rec.score.toFixed(2)}</span>
                <span className="rec-chip-rank">#{rec.rank}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 2 && (
        <div className="rec-nav">
          <button
            className="rec-nav-btn"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll recommendations left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="rec-nav-btn"
            onClick={() => scrollBy(1)}
            aria-label="Scroll recommendations right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}