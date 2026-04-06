CREATE TABLE IF NOT EXISTS anime (
    mal_id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    title_english TEXT,
    synopsis TEXT,
    score DOUBLE PRECISION,
    popularity INTEGER,
    episodes INTEGER,
    year INTEGER,
    image_url TEXT,
    genres_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    studios_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);