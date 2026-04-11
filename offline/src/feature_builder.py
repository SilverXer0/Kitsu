import math
import re
from collections import Counter

from .models import AnimeFeatures, AnimeRecord


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "their",
    "this",
    "to",
    "was",
    "were",
    "will",
    "with",
    "his",
    "her",
    "they",
    "them",
    "who",
    "into",
    "through",
    "after",
    "before",
    "during",
    "while",
    "about",
    "than",
    "then",
    "also",
    "been",
    "being",
    "over",
    "under",
    "one",
    "two",
    "when",
    "where",
    "which",
    "what",
    "how",
    "all",
    "more",
    "most",
    "some",
    "such",
    "very",
    "can",
    "may",
    "might",
    "would",
    "could",
    "should",
    "no",
    "not",
    "so",
    "if",
    "up",
    "out",
    "do",
    "does",
    "did",
    "just",
}


TITLE_NOISE_TOKENS = {
    "season",
    "part",
    "movie",
    "special",
    "ova",
    "tv",
    "ii",
    "iii",
    "iv",
    "final",
    "the",
}


# Genre weights: rarer genres are more discriminative and get higher weight.
# Tier 1 (2.0) — very specific, rarely applied
# Tier 2 (1.5) — moderately specific
# Tier 3 (1.0) — broad, applied to many anime
GENRE_WEIGHTS: dict[str, float] = {
    # Tier 1
    "psychological": 2.0,
    "thriller": 2.0,
    "horror": 2.0,
    "dementia": 2.0,
    "josei": 2.0,
    "avant garde": 2.0,
    "boys love": 2.0,
    "girls love": 2.0,
    "gourmet": 2.0,
    "erotica": 2.0,
    "suspense": 2.0,
    # Tier 2
    "sci-fi": 1.5,
    "sports": 1.5,
    "mystery": 1.5,
    "supernatural": 1.5,
    "slice of life": 1.5,
    "music": 1.5,
    "seinen": 1.5,
    "award winning": 1.5,
    "ecchi": 1.5,
    # Tier 3
    "action": 1.0,
    "comedy": 1.0,
    "drama": 1.0,
    "adventure": 1.0,
    "fantasy": 1.0,
    "romance": 1.0,
    "shounen": 1.0,
    "shoujo": 1.0,
}


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def tokenize_synopsis(text: str | None) -> list[str]:
    """Tokenize synopsis text, returning a list (with duplicates for TF counting)."""
    if not text:
        return []

    normalized = normalize_text(text)
    tokens = []

    for token in normalized.split():
        if len(token) < 3:
            continue
        if token in STOPWORDS:
            continue
        tokens.append(token)

    return tokens


def compute_tf(tokens: list[str]) -> dict[str, float]:
    """Compute term frequency (normalized by document length)."""
    if not tokens:
        return {}

    counts = Counter(tokens)
    length = len(tokens)
    return {token: count / length for token, count in counts.items()}


def compute_idf(all_token_lists: list[list[str]]) -> dict[str, float]:
    """Compute inverse document frequency across the corpus."""
    num_docs = len(all_token_lists)
    if num_docs == 0:
        return {}

    doc_freq: Counter[str] = Counter()
    for tokens in all_token_lists:
        unique_tokens = set(tokens)
        for token in unique_tokens:
            doc_freq[token] += 1

    idf: dict[str, float] = {}
    for token, df in doc_freq.items():
        idf[token] = math.log((num_docs + 1) / (df + 1)) + 1.0

    return idf


def compute_tfidf(tf: dict[str, float], idf: dict[str, float]) -> dict[str, float]:
    """Combine TF and IDF into a TF-IDF vector."""
    return {token: tf_val * idf.get(token, 1.0) for token, tf_val in tf.items()}


def normalize_title_for_franchise(title: str) -> str:
    normalized = normalize_text(title)
    filtered = [
        token
        for token in normalized.split()
        if token not in TITLE_NOISE_TOKENS and not token.isdigit()
    ]
    return " ".join(filtered)


def build_franchise_key(normalized_title: str, studios: set[str]) -> str:
    """Build a franchise key from normalized title + primary studio.

    This groups entries like "naruto" + "pierrot" together regardless
    of whether they're "Naruto", "Naruto Shippuden", or "Boruto: Naruto Next".
    """
    core_tokens = normalized_title.split()[:3]
    core = " ".join(core_tokens) if core_tokens else ""

    primary_studio = sorted(studios)[0] if studios else ""

    return f"{core}|{primary_studio}" if core else ""


def build_features(records: list[AnimeRecord]) -> list[AnimeFeatures]:
    # First pass: extract raw data and tokenize synopses
    raw_entries: list[dict] = []
    all_token_lists: list[list[str]] = []

    for record in records:
        genre_names = {
            genre.name.strip().lower()
            for genre in record.genres_json
            if genre.name and genre.name.strip()
        }

        studio_names = {
            studio.name.strip().lower()
            for studio in record.studios_json
            if studio.name and studio.name.strip()
        }

        synopsis_tokens = tokenize_synopsis(record.synopsis)
        normalized_title = normalize_title_for_franchise(record.title)
        franchise_key = build_franchise_key(normalized_title, studio_names)

        raw_entries.append(
            {
                "mal_id": record.mal_id,
                "title": record.title,
                "normalized_title": normalized_title,
                "franchise_key": franchise_key,
                "score": record.score,
                "popularity": record.popularity,
                "year": record.year,
                "genres": genre_names,
                "studios": studio_names,
                "synopsis_tokens": synopsis_tokens,
            }
        )
        all_token_lists.append(synopsis_tokens)

    # Compute IDF across the full corpus
    idf = compute_idf(all_token_lists)

    # Second pass: build TF-IDF vectors and construct AnimeFeatures
    features: list[AnimeFeatures] = []

    for entry, tokens in zip(raw_entries, all_token_lists):
        tf = compute_tf(tokens)
        tfidf = compute_tfidf(tf, idf)

        features.append(
            AnimeFeatures(
                mal_id=entry["mal_id"],
                title=entry["title"],
                normalized_title=entry["normalized_title"],
                franchise_key=entry["franchise_key"],
                score=entry["score"],
                popularity=entry["popularity"],
                year=entry["year"],
                genres=entry["genres"],
                studios=entry["studios"],
                synopsis_tfidf=tfidf,
            )
        )

    return features