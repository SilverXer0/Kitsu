from .config import Settings
from .feature_builder import GENRE_WEIGHTS
from .models import AnimeFeatures, RecommendationRecord
from .scorer import compute_similarity, weighted_genre_similarity


def _genre_overlap(a: AnimeFeatures, b: AnimeFeatures) -> float:
    return weighted_genre_similarity(a.genres, b.genres, GENRE_WEIGHTS)


def _mmr_rerank(
    scored_candidates: list[tuple[AnimeFeatures, float, str]],
    top_n: int,
    mmr_lambda: float,
    max_per_franchise: int,
) -> list[tuple[AnimeFeatures, float, str]]:

    if not scored_candidates:
        return []

    if len(scored_candidates) <= top_n:
        return scored_candidates

    max_score = max(s for _, s, _ in scored_candidates)
    min_score = min(s for _, s, _ in scored_candidates)
    score_range = max_score - min_score if max_score > min_score else 1.0

    selected: list[tuple[AnimeFeatures, float, str]] = []
    remaining = list(scored_candidates)
    franchise_counts: dict[str, int] = {}

    while len(selected) < top_n and remaining:
        best_idx = -1
        best_mmr = -float("inf")

        for i, (candidate, raw_score, reason) in enumerate(remaining):
            fk = candidate.franchise_key
            if fk and franchise_counts.get(fk, 0) >= max_per_franchise:
                continue

            relevance = (raw_score - min_score) / score_range

            if selected:
                max_sim = max(
                    _genre_overlap(candidate, sel_feat)
                    for sel_feat, _, _ in selected
                )
            else:
                max_sim = 0.0

            mmr = mmr_lambda * relevance - (1.0 - mmr_lambda) * max_sim

            if mmr > best_mmr:
                best_mmr = mmr
                best_idx = i

        if best_idx == -1:
            remaining.sort(key=lambda x: x[1], reverse=True)
            pick = remaining.pop(0)
            selected.append(pick)
            fk = pick[0].franchise_key
            if fk:
                franchise_counts[fk] = franchise_counts.get(fk, 0) + 1
        else:
            pick = remaining.pop(best_idx)
            selected.append(pick)
            fk = pick[0].franchise_key
            if fk:
                franchise_counts[fk] = franchise_counts.get(fk, 0) + 1

    return selected


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

        candidate_pool = scored_candidates[: settings.top_n_recommendations * 3]

        top_candidates = _mmr_rerank(
            candidate_pool,
            settings.top_n_recommendations,
            settings.mmr_lambda,
            settings.max_per_franchise,
        )

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