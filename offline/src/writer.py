import psycopg2.extras

from .models import RecommendationRecord


def write_recommendations(conn, recommendations: list[RecommendationRecord], model_version: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM recommendations WHERE model_version = %s",
            (model_version,),
        )

        if recommendations:
            rows = [
                (
                    rec.source_anime_id,
                    rec.recommended_anime_id,
                    rec.score,
                    rec.rank,
                    rec.reason,
                    rec.model_version,
                )
                for rec in recommendations
            ]

            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO recommendations (
                    source_anime_id,
                    recommended_anime_id,
                    score,
                    rank,
                    reason,
                    model_version
                )
                VALUES %s
                """,
                rows,
            )

    conn.commit()