import math

from .models import AnimeFeatures


def jaccard_similarity(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0

    union = a | b
    if not union:
        return 0.0

    return len(a & b) / len(union)


def score_bonus(score: float | None) -> float:
    if score is None:
        return 0.0

    return max(0.0, min(score / 10.0, 1.0))


def popularity_bonus(popularity: int | None, max_popularity: int) -> float:
    if popularity is None or max_popularity <= 0:
        return 0.0

    inverted = max_popularity - popularity + 1
    if inverted <= 0:
        return 0.0

    return min(math.log1p(inverted) / math.log1p(max_popularity), 1.0)


def year_bonus(source_year: int | None, target_year: int | None) -> float:
    if source_year is None or target_year is None:
        return 0.0

    diff = abs(source_year - target_year)
    if diff == 0:
        return 1.0
    if diff <= 1:
        return 0.85
    if diff <= 3:
        return 0.6
    if diff <= 6:
        return 0.3
    return 0.0


def studio_bonus(source_studios: set[str], target_studios: set[str]) -> float:
    if not source_studios or not target_studios:
        return 0.0

    overlap = len(source_studios & target_studios)
    if overlap == 0:
        return 0.0
    if overlap >= 2:
        return 1.0
    return 0.6


def franchise_penalty(source: AnimeFeatures, target: AnimeFeatures) -> float:
    if not source.normalized_title or not target.normalized_title:
        return 0.0

    if source.normalized_title == target.normalized_title:
        return 0.15

    source_tokens = set(source.normalized_title.split())
    target_tokens = set(target.normalized_title.split())

    if not source_tokens or not target_tokens:
        return 0.0

    overlap_ratio = len(source_tokens & target_tokens) / len(source_tokens | target_tokens)
    if overlap_ratio >= 0.8:
        return 0.10
    if overlap_ratio >= 0.6:
        return 0.05
    return 0.0


def build_reason(
    source: AnimeFeatures,
    target: AnimeFeatures,
    genre_sim: float,
    synopsis_sim: float,
    studio_sim: float,
) -> str:
    reasons: list[str] = []

    shared_genres = sorted(source.genres & target.genres)
    if shared_genres:
        reasons.append(f"shared genres: {', '.join(shared_genres[:3])}")

    if synopsis_sim >= 0.15:
        reasons.append("similar themes and synopsis")

    shared_studios = sorted(source.studios & target.studios)
    if shared_studios and studio_sim > 0:
        reasons.append(f"shared studio: {', '.join(shared_studios[:2])}")

    y_bonus = year_bonus(source.year, target.year)
    if y_bonus >= 0.6:
        reasons.append("similar release period")

    if (target.score or 0) >= 8.5:
        reasons.append("high MAL score")

    if not reasons:
        if genre_sim > 0:
            return "genre-based match"
        return "content-based match"

    return "; ".join(reasons)


def compute_similarity(
    source: AnimeFeatures,
    target: AnimeFeatures,
    max_popularity: int,
) -> tuple[float, str]:
    genre_sim = jaccard_similarity(source.genres, target.genres)
    synopsis_sim = jaccard_similarity(source.synopsis_tokens, target.synopsis_tokens)
    s_bonus = score_bonus(target.score)
    p_bonus = popularity_bonus(target.popularity, max_popularity)
    y_bonus = year_bonus(source.year, target.year)
    st_bonus = studio_bonus(source.studios, target.studios)
    f_penalty = franchise_penalty(source, target)

    total = (
        0.40 * genre_sim
        + 0.20 * synopsis_sim
        + 0.12 * s_bonus
        + 0.10 * p_bonus
        + 0.08 * y_bonus
        + 0.10 * st_bonus
        - f_penalty
    )

    if total < 0:
        total = 0.0

    reason = build_reason(source, target, genre_sim, synopsis_sim, st_bonus)
    return total, reason