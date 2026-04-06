import type { Anime } from "../types/anime";

type AnimeCardProps = {
  anime: Anime;
  onSelect?: (anime: Anime) => void;
};

export default function AnimeCard({ anime, onSelect }: AnimeCardProps) {
  return (
    <article
      className={`anime-card ${onSelect ? "anime-card-clickable" : ""}`}
      onClick={() => onSelect?.(anime)}
    >
      <div className="anime-card-image-wrapper">
        {anime.image_url ? (
          <img className="anime-card-image" src={anime.image_url} alt={anime.title} />
        ) : (
          <div className="anime-card-image anime-card-placeholder">No image</div>
        )}
      </div>

      <div className="anime-card-body">
        <h3>{anime.title}</h3>
        {anime.title_english && anime.title_english !== anime.title && (
          <p className="muted">{anime.title_english}</p>
        )}
        <div className="anime-card-meta">
          <span>Score: {anime.score ?? "N/A"}</span>
          <span>Year: {anime.year ?? "N/A"}</span>
          <span>Episodes: {anime.episodes ?? "N/A"}</span>
        </div>
      </div>
    </article>
  );
}