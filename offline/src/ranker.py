from .config import Settings
from .models import AnimeFeatures, RecommendationRecord
from .scorer import compute_similarity


def rank_recommendations(features: list[AnimeFeatures], settings: Settings) -> list[RecommendationRecord]:
    max_popularity = max(
        (f.popularity for f in features if f.popularity is not None),
        default=1,
    )

    recommendations: list[RecommendationRecord] = []

    for source in features:
        scored_candidates: list[tuple[AnimeFeatures, float, str]] = []

        for target in features:
            if source.mal_id == target.mal_id:
                continue

            score, reason = compute_similarity(source, target, max_popularity)
            if score < settings.min_similarity_score:
                continue

            scored_candidates.append((target, score, reason))

        scored_candidates.sort(key=lambda item: item[1], reverse=True)
        top_candidates = scored_candidates[: settings.top_n_recommendations]

        for rank, (target, score, reason) in enumerate(top_candidates, start=1):
            recommendations.append(
                RecommendationRecord(
                    source_anime_id=source.mal_id,
                    recommended_anime_id=target.mal_id,
                    score=round(score, 6),
                    rank=rank,
                    reason=reason,
                    model_version=settings.model_version,
                )
            )

    return recommendations