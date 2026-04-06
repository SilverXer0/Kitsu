import re

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


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def tokenize_synopsis(text: str | None) -> set[str]:
    if not text:
        return set()

    normalized = normalize_text(text)
    tokens = set()

    for token in normalized.split():
        if len(token) < 3:
            continue
        if token in STOPWORDS:
            continue
        tokens.add(token)

    return tokens


def normalize_title_for_franchise(title: str) -> str:
    normalized = normalize_text(title)
    filtered = [
        token
        for token in normalized.split()
        if token not in TITLE_NOISE_TOKENS and not token.isdigit()
    ]
    return " ".join(filtered)


def build_features(records: list[AnimeRecord]) -> list[AnimeFeatures]:
    features: list[AnimeFeatures] = []

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

        features.append(
            AnimeFeatures(
                mal_id=record.mal_id,
                title=record.title,
                normalized_title=normalized_title,
                score=record.score,
                popularity=record.popularity,
                year=record.year,
                genres=genre_names,
                studios=studio_names,
                synopsis_tokens=synopsis_tokens,
            )
        )

    return features