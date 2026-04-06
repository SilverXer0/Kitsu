from .models import AnimeFeatures, AnimeRecord


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

        features.append(
            AnimeFeatures(
                mal_id=record.mal_id,
                title=record.title,
                score=record.score,
                popularity=record.popularity,
                year=record.year,
                genres=genre_names,
                studios=studio_names,
            )
        )

    return features