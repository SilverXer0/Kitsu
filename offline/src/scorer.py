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

    inverted = max_popularity - popularity
    return max(0.0, inverted / max_popularity)


def year_bonus(source_year: int | None, target_year: int | None) -> float:
    if source_year is None or target_year is None:
        return 0.0

    diff = abs(source_year - target_year)
    if diff == 0:
        return 1.0
    if diff <= 2:
        return 0.7
    if diff <= 5:
        return 0.4
    return 0.0


def studio_bonus(source_studios: set[str], target_studios: set[str]) -> float:
    if not source_studios or not target_studios:
        return 0.0

    overlap = len(source_studios & target_studios)
    if overlap == 0:
        return 0.0
    if overlap >= 2:
        return 1.0
    return 0.5


def build_reason(source: AnimeFeatures, target: AnimeFeatures) -> str:
    reasons: list[str] = []

    shared_genres = sorted(source.genres & target.genres)
    if shared_genres:
        reasons.append(f"shared genres: {', '.join(shared_genres[:3])}")

    shared_studios = sorted(source.studios & target.studios)
    if shared_studios:
        reasons.append(f"shared studio: {', '.join(shared_studios[:2])}")

    y_bonus = year_bonus(source.year, target.year)
    if y_bonus >= 0.7:
        reasons.append("similar release period")

    if (target.score or 0) >= 8.5:
        reasons.append("high MAL score")

    if not reasons:
        return "content-based match"

    return "; ".join(reasons)


def compute_similarity(
    source: AnimeFeatures,
    target: AnimeFeatures,
    max_popularity: int,
) -> tuple[float, str]:
    genre_sim = jaccard_similarity(source.genres, target.genres)
    s_bonus = score_bonus(target.score)
    p_bonus = popularity_bonus(target.popularity, max_popularity)
    y_bonus = year_bonus(source.year, target.year)
    st_bonus = studio_bonus(source.studios, target.studios)

    total = (
        0.60 * genre_sim
        + 0.15 * s_bonus
        + 0.10 * p_bonus
        + 0.10 * y_bonus
        + 0.05 * st_bonus
    )

    reason = build_reason(source, target)
    return total, reason