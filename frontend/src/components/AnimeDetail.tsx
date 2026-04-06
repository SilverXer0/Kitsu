import type { Anime } from "../types/anime";

type AnimeDetailProps = {
  anime: Anime | null;
};

export default function AnimeDetail({ anime }: AnimeDetailProps) {
  if (!anime) {
    return (
      <div className="empty-state">
        Select an anime to view its details and recommendations.
      </div>
    );
  }

  return (
    <div className="anime-detail">
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
            <strong>English title:</strong> {anime.title_english}
          </p>
        )}

        <div className="detail-grid">
          <div><strong>Score:</strong> {anime.score ?? "N/A"}</div>
          <div><strong>Popularity:</strong> {anime.popularity ?? "N/A"}</div>
          <div><strong>Episodes:</strong> {anime.episodes ?? "N/A"}</div>
          <div><strong>Year:</strong> {anime.year ?? "N/A"}</div>
        </div>

        <p className="synopsis">{anime.synopsis ?? "No synopsis available."}</p>
      </div>
    </div>
  );
}