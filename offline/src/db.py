import json
from typing import Any

import psycopg2
import psycopg2.extras

from .config import Settings
from .models import AnimeRecord


def get_connection(settings: Settings):
    return psycopg2.connect(settings.postgres_dsn)


def _parse_json_field(value: Any) -> list[dict]:
    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        return json.loads(value)

    return value


def fetch_anime_records(conn) -> list[AnimeRecord]:
    query = """
        SELECT
            mal_id,
            title,
            score,
            popularity,
            year,
            genres_json,
            studios_json
        FROM anime
    """

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query)
        rows = cur.fetchall()

    records: list[AnimeRecord] = []
    for row in rows:
        record = AnimeRecord(
            mal_id=row["mal_id"],
            title=row["title"],
            score=row["score"],
            popularity=row["popularity"],
            year=row["year"],
            genres_json=_parse_json_field(row["genres_json"]),
            studios_json=_parse_json_field(row["studios_json"]),
        )
        records.append(record)

    return records