import type { Anime } from "../types/anime";

type AnimeDetailProps = {
  anime: Anime | null;
};

function scoreClass(score: number | null | undefined): string {
  if (score == null) return "score-na";
  if (score >= 7.5) return "score-high";
  if (score >= 5.5) return "score-mid";
  return "score-low";
}

export default function AnimeDetail({ anime }: AnimeDetailProps) {
  if (!anime) {
    return (
      <div className="empty-state">
        Select an anime to view its details and recommendations.
      </div>
    );
  }

  return (
    <div className="anime-detail" key={anime.mal_id}>
      <div className="anime-detail-image-wrapper">
        {anime.image_url ? (
          <img className="anime-detail-image" src={anime.image_url} alt={anime.title} />
        ) : (
          <div className="anime-detail-image anime-card-placeholder">No image</div>
        )}
      </div>

      <div className="anime-detail-content">
        <h2>{anime.title}</h2>

        {anime.title_english && anime.title_english !== anime.title && (
          <p className="muted">
            {anime.title_english}
          </p>
        )}

        <div className="detail-grid">
          <span className={`detail-pill`}>
            <span className="detail-pill-label">Score</span>
            <span style={{ color: `var(--${scoreClass(anime.score).replace('score-', 'score-')})` }}>
              {anime.score ?? "N/A"}
            </span>
          </span>
          <span className="detail-pill">
            <span className="detail-pill-label">Popularity</span>
            #{anime.popularity ?? "N/A"}
          </span>
          <span className="detail-pill">
            <span className="detail-pill-label">Episodes</span>
            {anime.episodes ?? "N/A"}
          </span>
          <span className="detail-pill">
            <span className="detail-pill-label">Year</span>
            {anime.year ?? "N/A"}
          </span>
        </div>

        <p className="synopsis">{anime.synopsis ?? "No synopsis available."}</p>
      </div>
    </div>
  );
}