import AnimeCard from "./AnimeCard";
import type { Anime, Recommendation } from "../types/anime";

type RecommendationListProps = {
  recommendations: Recommendation[];
  onSelectAnime: (anime: Anime) => void;
  isLoading?: boolean;
};

export default function RecommendationList({
  recommendations,
  onSelectAnime,
  isLoading = false,
}: RecommendationListProps) {
  if (isLoading) {
    return <div className="empty-state">Loading recommendations...</div>;
  }

  if (recommendations.length === 0) {
    return <div className="empty-state">No recommendations found.</div>;
  }

  return (
    <div className="recommendation-list">
      {recommendations.map((recommendation) => (
        <div
          className="recommendation-item"
          key={`${recommendation.source_anime_id}-${recommendation.recommended_anime_id}`}
        >
          <AnimeCard anime={recommendation.anime} onSelect={onSelectAnime} />
          <div className="recommendation-meta">
            <p><strong>Why:</strong> {recommendation.reason}</p>
            <p><strong>Score:</strong> {recommendation.score}</p>
            <p><strong>Rank:</strong> {recommendation.rank}</p>
          </div>
        </div>
      ))}
    </div>
  );
}