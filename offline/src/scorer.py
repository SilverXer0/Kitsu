import math

from .feature_builder import GENRE_WEIGHTS
from .models import AnimeFeatures


def cosine_tfidf_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    if not a or not b:
        return 0.0

    shared_keys = a.keys() & b.keys()
    if not shared_keys:
        return 0.0

    dot = sum(a[k] * b[k] for k in shared_keys)
    mag_a = math.sqrt(sum(v * v for v in a.values()))
    mag_b = math.sqrt(sum(v * v for v in b.values()))

    if mag_a == 0.0 or mag_b == 0.0:
        return 0.0

    return dot / (mag_a * mag_b)


def weighted_genre_similarity(
    a: set[str], b: set[str], weights: dict[str, float] | None = None
) -> float:
    if not a and not b:
        return 0.0

    if weights is None:
        weights = GENRE_WEIGHTS

    union = a | b
    if not union:
        return 0.0

    intersection = a & b
    weighted_inter = sum(weights.get(g, 1.0) for g in intersection)
    weighted_union = sum(weights.get(g, 1.0) for g in union)

    if weighted_union == 0.0:
        return 0.0

    return weighted_inter / weighted_union


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

    normalized = inverted / max_popularity
    return 1.0 / (1.0 + math.exp(-10.0 * (normalized - 0.5)))


def hidden_gem_bonus(score: float | None, popularity: int | None) -> float:
    if score is None or popularity is None:
        return 0.0

    if score >= 7.5 and popularity > 1000:
        return 1.0
    if score >= 8.0 and popularity > 500:
        return 1.0

    return 0.0


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
    if source.franchise_key and target.franchise_key:
        if source.franchise_key == target.franchise_key:
            return 0.30

    if not source.normalized_title or not target.normalized_title:
        return 0.0

    if source.normalized_title == target.normalized_title:
        return 0.25

    source_tokens = set(source.normalized_title.split())
    target_tokens = set(target.normalized_title.split())

    if not source_tokens or not target_tokens:
        return 0.0

    overlap_ratio = len(source_tokens & target_tokens) / len(source_tokens | target_tokens)
    if overlap_ratio >= 0.8:
        return 0.20
    if overlap_ratio >= 0.6:
        return 0.10
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
    genre_sim = weighted_genre_similarity(source.genres, target.genres)
    synopsis_sim = cosine_tfidf_similarity(source.synopsis_tfidf, target.synopsis_tfidf)
    s_bonus = score_bonus(target.score)
    p_bonus = popularity_bonus(target.popularity, max_popularity)
    y_bonus = year_bonus(source.year, target.year)
    st_bonus = studio_bonus(source.studios, target.studios)
    f_penalty = franchise_penalty(source, target)
    gem_bonus = hidden_gem_bonus(target.score, target.popularity)

    total = (
        0.35 * genre_sim
        + 0.25 * synopsis_sim
        + 0.10 * s_bonus
        + 0.08 * p_bonus
        + 0.07 * y_bonus
        + 0.10 * st_bonus
        + 0.05 * gem_bonus
        - f_penalty
    )

    if total < 0:
        total = 0.0

    reason = build_reason(source, target, genre_sim, synopsis_sim, st_bonus)
    return total, reason