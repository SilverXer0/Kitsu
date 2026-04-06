from .config import Settings
from .db import fetch_anime_records, get_connection
from .feature_builder import build_features
from .ranker import rank_recommendations
from .writer import write_recommendations


def run_pipeline(settings: Settings) -> None:
    conn = get_connection(settings)

    try:
        records = fetch_anime_records(conn)
        print(f"Loaded {len(records)} anime records")

        features = build_features(records)
        print(f"Built {len(features)} feature objects")

        recommendations = rank_recommendations(features, settings)
        print(f"Generated {len(recommendations)} recommendation rows")

        write_recommendations(conn, recommendations, settings.model_version)
        print(
            f"Wrote {len(recommendations)} recommendations for model version {settings.model_version}"
        )
    finally:
        conn.close()