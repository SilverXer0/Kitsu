import type { Anime } from "../types/anime";

type AnimeCardProps = {
  anime: Anime;
  index?: number;
  onSelect?: (anime: Anime) => void;
};

function scoreClass(score: number | null | undefined): string {
  if (score == null) return "score-na";
  if (score >= 7.5) return "score-high";
  if (score >= 5.5) return "score-mid";
  return "score-low";
}

export default function AnimeCard({ anime, index = 0, onSelect }: AnimeCardProps) {
  return (
    <article
      className={`anime-card ${onSelect ? "anime-card-clickable" : ""}`}
      onClick={() => onSelect?.(anime)}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="anime-card-image-wrapper">
        {anime.image_url ? (
          <img className="anime-card-image" src={anime.image_url} alt={anime.title} loading="lazy" />
        ) : (
          <div className="anime-card-image anime-card-placeholder">No image</div>
        )}
        <span className={`score-badge ${scoreClass(anime.score)}`}>
          {anime.score != null ? anime.score.toFixed(1) : "N/A"}
        </span>
      </div>

      <div className="anime-card-body">
        <h3>{anime.title}</h3>
        {anime.title_english && anime.title_english !== anime.title && (
          <p className="muted">{anime.title_english}</p>
        )}
        <div className="anime-card-meta">
          {anime.year && <span>{anime.year}</span>}
          {anime.episodes && <span>{anime.episodes} eps</span>}
        </div>
      </div>
    </article>
  );
}